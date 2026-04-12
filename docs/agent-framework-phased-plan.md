# Swoop Multi-Agent Framework: Phased Development Plan

## Context

The brainstorm doc ("Swoop Multi-Agent Architecture: Deep Dive") proposes a 14-agent event-bus architecture, sequenced in 5 phases starting with "build event bus" and "build Arrival Anticipation." Ground-truth review of `api/agents/` shows the baseline is materially further along than the doc assumes.

### Already live (don't rebuild)

- **11 of 14 agents** registered via `api/agents/register-agents.js`, including Arrival Anticipation, Service Recovery, Member Risk Lifecycle, FB Intelligence, Game Plan, Revenue Analyst, Chief of Staff (`agent-coordination`), and a `booking-agent`.
- **Event bus exists** at `api/agents/agent-events.js` with 6 routing rules (concierge↔staffing, complaint↔service-recovery, cancellation↔game-plan, etc.) and thread-aware delivery via `managed-config.js`.
- **45 tools registered** in `api/agents/tool-registry.js`, including 14 writes: `book_tee_time`, `send_message`, `push_staff_brief`, `file_complaint`, `record_intervention_outcome`, `create_action`, `update_playbook_step`, plus dining/waitlist/event writes.
- **9 triggers** wired: `risk-`, `complaint-`, `gameplan-`, `staffing-`, `arrival-`, `fb-`, `service-save-`, `board-report-`, `cos-trigger.js`.
- **Infra tables** already shipped: `agent_configs`, `agent_activity`, `playbook_runs`, `interventions`, `agent_registry`, `agent_config_history` (migrations `001` and `018`).
- **Weather cron** (`api/cron/weather-daily.js`), **arrival geofence** (`api/concierge/arrival-detect.js`), **member onboarding cron** (`api/cron/member-onboarding.js`), **data-availability gate** (`api/agents/data-availability-check.js`).

### True gaps vs. the vision

1. Event bus is **ephemeral/in-memory** — no `event_bus` table, no replay, no subscription config in `agent_configs`, no cross-sweep history for Chief of Staff dedup.
2. **No Post-Round Dining Bridge** agent/trigger. `fb-intelligence` analyzes conversion; it does not nudge members or hold tables. No `create_table_hold` write tool.
3. **No Milestone Concierge agent** — `member-onboarding.js` is deterministic cron, not archetype-aware recognition staging.
4. **No Weather Pivot Concierge** — `weather-daily.js` logs events; nothing cross-references members on-property or composes pivots.
5. **No Playing Partner Matchmaker** — no compatibility scoring, no social-graph table.
6. **No Data Flywheel listener** — `interventions` table records outcomes, but nothing calibrates health-model curves, detects false positives, or trains on `log_draft_usage`.
7. Chief of Staff (`cos-trigger.js`) does not dedupe across agents via persisted event history because there is no persisted history.
8. No "communication DNA" example pairs for Draft Communicator (`draft.js`).
9. No auto-execute gradient; all writes gated on GM approval via `create_action`.

The goal of this plan is to sequence the remaining work by **value ÷ effort**, leveraging what's already shipped rather than rebuilding it.

---

## Phase A — Persistent Event Bus + Data Flywheel Listener (Weeks 1–2)

**Why first:** Unlocks every downstream phase. Cheapest high-leverage work. The in-memory bus in `agent-events.js` already knows the routing rules — we just need durability.

**Scope:**
- New migration: `event_bus` table (`event_id`, `event_type`, `payload jsonb`, `source_agent_id`, `member_id`, `club_id`, `created_at`, `consumed_by jsonb`, `thread_id`).
- Persist every publish in `api/agents/agent-events.js` before thread dispatch. Keep the in-memory fast path; table is append-only audit + replay source.
- Add `subscribes_to: string[]` to `agent_configs.behavioral_config`. Default subscriptions seeded from the existing 6 routing rules in `agent-events.js`.
- Retrofit `sweep.js` to load last-24h events from `event_bus` into the context assembler per agent, filtered by that agent's subscriptions.
- **Data Flywheel listener**: a passive worker subscribed to `intervention.outcome_recorded` that rolls up weekly `calibrate_health_model` stats and `detect_false_positives` counts. Writes to a new `model_calibration_snapshots` table. No new agent LLM calls in v1 — just aggregation SQL over `interventions` and `agent_activity`.

**Files touched:** `api/agents/agent-events.js`, `api/agents/sweep.js`, new `api/migrations/019-event-bus.js`, new `api/agents/flywheel-aggregator.js`, `api/agents/register-agents.js` (subscription defaults).

**Value:** Enables Phases B–E cleanly. Flywheel immediately produces board-report content without any new LLM spend.

---

## Phase B — Post-Round Dining Bridge + `create_table_hold` (Weeks 3–5)

**Why second:** Brainstorm ranks this **#1 revenue generator ($62K–93K/club/year)**. Zero new external dependencies — uses existing tee sheet as the timing proxy.

**Scope:**
- New write tool in `tool-registry.js`: `create_table_hold` (club_id, member_id, outlet, duration_minutes, auto_release=true). Backing table `dining_holds` with TTL cleanup cron.
- New trigger `api/agents/post-round-dining-trigger.js` fired at tee-time-start + 4.5h (cron scan, no GPS). Reads member's dining history, archetype, and open complaints (cross-agent read from Service Recovery activity).
- New agent registration `post-round-dining-bridge` (Haiku, temp 0.4) in `register-agents.js`. Reuses `draft_member_message` + `send_message` tools. Publishes `dining.hold_created` and `dining.conversion_tracked` events.
- Conversion tracking: join `dining_holds` → POS line items; feeds Data Flywheel.
- Respects open-complaint flag: if Service Recovery has an unresolved complaint on the member, nudge tone softens (no upsell). This proves the persistent event bus works.

**Files touched:** `api/agents/tool-registry.js`, `api/agents/register-agents.js`, new `api/agents/post-round-dining-trigger.js`, new `api/migrations/020-dining-holds.js`, new `api/cron/` entry.

**Value:** Single largest revenue lever in the vision doc, shipped without GPS, without mobile app, without new integrations.

---

## Phase C — Milestone Concierge + Weather Pivot Concierge (Weeks 6–9)

**Why third:** Both are thin agents on top of **existing** cron infrastructure (`member-onboarding.js`, `weather-daily.js`). High retention impact, low incremental cost.

**Milestone Concierge:**
- New agent registration `milestone-concierge` (Sonnet, temp 0.5).
- Nightly batch trigger scanning for round counts, anniversaries, spend thresholds, family milestones, and recovery milestones (3+ rounds since complaint resolution — reads from `interventions` table).
- Uses existing `create_action` write tool to stage recognition tasks for staff (no new write tool needed).
- Publishes `milestone.staged` — Arrival Anticipation (already live) subscribes and layers recognition into its pre-arrival brief. Validates the cross-agent brief enrichment pattern.

**Weather Pivot Concierge:**
- New agent `weather-pivot` (Sonnet, temp 0.3).
- Subscribes to `weather.disruption` events (new publish from `weather-daily.js` when severity crosses threshold).
- Cross-references members with bookings in disruption window (existing `get_tee_sheet` + member queries).
- Composes pivots via `draft_member_message`, sends via `send_message`. Publishes `staff.redeployment_requested` consumed by the existing `staffing-demand` agent.
- Outcome tracking feeds Flywheel.

**Files touched:** `api/agents/register-agents.js`, new `api/agents/milestone-trigger.js`, new `api/agents/weather-pivot-trigger.js`, `api/cron/weather-daily.js` (add event publish), optional tuning to `api/cron/member-onboarding.js` to emit events rather than act directly.

**Value:** Activates the retention half of the board-report story. Recovery-milestone detection is the single most-loved feature for owner/member-director personas and is almost free to build on top of the existing `interventions` table.

---

## Phase D — Playing Partner Matchmaker (Weeks 10–13)

**Why fourth:** Brainstorm cites **$180K+ dues protection** but this is the only phase requiring genuinely new data modeling (social graph + compatibility scoring). Sequenced after the event bus is proven and after the flywheel has a few weeks of real data to calibrate against.

**Scope:**
- New migration: `member_social_graph` (member_a, member_b, rounds_together, guest_events, hospitality_score, last_played_at).
- Backfill script from existing tee-sheet history.
- New agent `partner-matchmaker` (Sonnet, temp 0.4), weekly batch + triggered on `member.joined`.
- Compatibility scoring: time overlap × pace × archetype match × hospitality. Pure SQL/JS; LLM only for the introduction message.
- Uses existing `create_action` to propose introductions to Membership Director. Uses `send_message` for paired notifications.
- Publishes `introduction.proposed`, `social_connection.tracked` for Flywheel.

**Files touched:** new `api/migrations/021-social-graph.js`, new `api/agents/matchmaker-trigger.js`, new `scripts/backfill-social-graph.js`, `api/agents/register-agents.js`.

**Value:** Largest long-horizon retention moat; defer-able without blocking B/C.

---

## Phase E — Intelligence Layer: CoS Dedup + Communication DNA + Auto-Execute Gradient (Weeks 14–16+)

**Why last:** Each item is a **refinement** of something already shipped and requires the flywheel's calibration data to justify unlocking writes.

**Scope:**
- **Chief of Staff dedup**: `cos-trigger.js` now pulls last-24h `event_bus` rows grouped by `member_id`. Multi-agent situations collapse into one action card. Pure query change — no new LLM calls.
- **Communication DNA**: new `club_communication_examples` table (channel, prompt, ideal_output). `draft.js` loads 10–15 pairs per channel into the system prompt. Admin UI path deferred; seed via CSV for pilot clubs.
- **Auto-execute gradient**: extend `agent_configs.behavioral_config.auto_execute` from boolean to `{ tool_name: { enabled, confidence_threshold } }`. Launch with `push_staff_brief` only. `create_table_hold` follows after 4 weeks of flywheel data show >90% GM approval on proposed holds.

**Files touched:** `api/agents/cos-trigger.js`, `api/agents/draft.js`, new `api/migrations/022-comm-dna.js`, `api/agents/tool-registry.js` (permission check), `api/agents/sweep.js` (auto-execute branch).

---

## Critical Files to Modify (Reference)

| File | Phase | Purpose |
|---|---|---|
| `api/agents/agent-events.js` | A | Persist publishes, load subscriptions from `agent_configs` |
| `api/agents/sweep.js` | A, E | Event-bus-aware context assembly; auto-execute branch |
| `api/agents/register-agents.js` | B, C, D | Register 4 new agents with models/temps/subscriptions |
| `api/agents/tool-registry.js` | B, E | Add `create_table_hold`; permission check for auto-execute |
| `api/agents/cos-trigger.js` | E | Dedup via persisted event history |
| `api/agents/draft.js` | E | Load communication DNA pairs |
| `api/cron/weather-daily.js` | C | Publish `weather.disruption` |
| `api/cron/member-onboarding.js` | C | Emit events instead of direct action |
| `api/agents/data-availability-check.js` | B–D | Gate new agents behind their required data domains |
| `api/migrations/019-event-bus.js` | A | New |
| `api/migrations/020-dining-holds.js` | B | New |
| `api/migrations/021-social-graph.js` | D | New |
| `api/migrations/022-comm-dna.js` | E | New |

## Reuse Inventory (Don't Rebuild)

- **Event routing** — `api/agents/agent-events.js` already has 6 routing rules and thread-aware delivery. Extend, don't replace.
- **Tool registry pattern** — `api/agents/tool-registry.js` has risk levels (low/medium/high). Reuse for new writes.
- **Agent registration schema** — `register-agents.js` already supports model-per-agent and `callable_agents` (used by `agent-coordination`). Matchmaker and Weather Pivot should register the same way.
- **Intervention outcomes** — `interventions` table schema covers `initiated_by`, `health_score_before/after`, `dues_protected`, `is_member_save`. Flywheel aggregator reads this; no new outcome table needed.
- **Data gate** — `data-availability-check.js` already returns `{ ok, reason, missing }`. New agents plug in by declaring required domains.
- **Cron scheduling** — existing `api/cron/` pattern (`weather-daily`, `member-onboarding`, `pre-arrival-brief`) is the template for new triggers.
- **Arrival Anticipation** — **already live**. Phase C's Milestone Concierge should enrich existing briefs via the event bus, not replace them.

## Verification Plan

**Phase A:**
- Unit: publish event → row in `event_bus` → consumer agent sees it in context assembly.
- Integration: run `sweep.js`; confirm CoS output references events from prior triggers.
- Flywheel: weekly snapshot job produces non-null `model_calibration_snapshots` row on seed data.

**Phase B:**
- E2E via `tests/e2e/b-lite-agents.spec.js` pattern: seed a completed tee time at T-4.5h, assert `dining_holds` row created, `send_message` tool called, `dining.conversion_tracked` published on POS join.
- Soft-tone test: open complaint on member → assert draft contains no upsell language.

**Phase C:**
- Milestone: seed member with 99 completed rounds → nightly batch → `create_action` for recognition → Arrival Anticipation brief for next booking contains milestone line.
- Weather: inject severe weather row → agent composes pivots for all members with bookings in window → `staff.redeployment_requested` received by `staffing-demand`.

**Phase D:**
- Backfill script produces social graph on seed data; matchmaker proposes ≥1 introduction for a seeded new member with a plausibly compatible existing member.

**Phase E:**
- CoS test: seed 3 events for same member across 3 agents → exactly 1 action card in output.
- Auto-execute: `push_staff_brief` fires without GM approval; confidence below threshold falls back to proposed state.

**Harness:** Use existing `scripts/dev-server.sh` + `tests/e2e/b-lite-journey.spec.js`. No prod deploys at any phase.
