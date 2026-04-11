# Architecture Decisions Log

**Repo:** swoop-member-portal
**Branch:** autoresearch/apr11
**Generated from code:** 2026-04-11
**Type:** Living document — regenerate from code, do not edit freehand

---

## Decision Format

Each entry: number, date, title, context, decision, consequences.

---

## Decisions

### ADR-001: Three-Pillar Product Strategy (See It, Fix It, Prove It)

**Context:** The product needed a governing filter to prevent feature sprawl and keep every sprint pointed at demonstrable value for club GMs.

**Decision:** All development serves exactly three pillars: **See It** (cross-domain operational visibility), **Fix It** (proactive action via health scores and decay sequences), **Prove It** (dollar-quantified revenue attribution). Three demo stories and three dollar anchors ($31/slow round, $32K/year per save, $9,580/month F&B leakage) serve as acceptance tests.

**Consequences:**
- (+) Every feature, bug, and design decision has a clear pass/fail filter
- (+) Demo storyboard maps directly to product pillars, keeping sales and engineering aligned
- (-) Features that don't map to a pillar (e.g., pure admin tooling) risk deprioritization even when necessary

---

### ADR-002: Data Flows Through Services Only

**Context:** React components were importing raw data arrays directly, creating tight coupling that would make the Phase 2 API migration painful.

**Decision:** Strict data flow: `data/*.js` -> `services/*.js` -> `features/` -> `components/`. Components never import from `data/` directly. Only `services/` files touch `data/`.

**Consequences:**
- (+) Phase 2 API swap only changes `services/` layer; everything above stays untouched
- (+) Clear contract boundaries make testing and code review straightforward
- (-) Adds a service layer even for trivial data lookups

---

### ADR-003: 13-Agent Roster with Tiered Model Assignment

**Context:** A single monolithic concierge could not optimize cost, latency, and quality simultaneously across transactional bookings, emotional complaint handling, and analytical reporting.

**Decision:** 13 managed agents (12 domain + 1 coordinator) with model assignment by capability tier. From `register-agents.js`:

| Tier | Model | Agents |
|------|-------|--------|
| Opus | claude-opus-4-20250514 | Chief of Staff, Personal Concierge, Member Service Recovery |
| Sonnet | claude-sonnet-4-20250514 | Member Risk, Service Recovery (club), F&B Intelligence, Board Report, Game Plan, Revenue Analyst, Growth Pipeline, Arrival Anticipation |
| Haiku | claude-haiku-4-5-20251001 | Booking Agent, Staffing & Demand |

**Consequences:**
- (+) Haiku handles high-volume transactional work at low cost; Opus reserved for emotional intelligence
- (+) Each agent has a dedicated prompt, tools, and temperature tuned to its domain
- (-) 13 agents to register, maintain prompts for, and keep in sync
- (-) Chief of Staff coordinator adds orchestration latency

---

### ADR-004: Concierge Split into 3 Specialized Agents

**Context:** The original monolithic concierge handled bookings, complaints, and relationship management in one agent. This made model selection a compromise and prevented independent pricing.

**Decision:** Split into three agents: **Booking Agent** (Haiku, transactional), **Member Service Recovery** (Opus, empathy-first complaint handling), **Personal Concierge** (Opus, relationship layer and cross-selling). Each maps to a potential product SKU.

**Consequences:**
- (+) 3 agents = 3 pricing tiers = expansion revenue story for fundraising
- (+) Booking agent runs on Haiku for speed; complaint handling gets Opus emotional intelligence
- (-) Routing layer required to classify incoming messages to the correct agent

---

### ADR-005: Haiku LLM Classifier for Message Routing

**Context:** Regex and keyword matching proved too brittle for routing member messages to the correct agent. Messages like "my father passed" or "can you set up a corporate dinner for 12" require semantic understanding.

**Decision:** Use Claude Haiku as a zero-temperature LLM classifier that returns one of `concierge`, `service-recovery`, `booking`, or `grief`. Defined in `tests/agents/autoresearch/agent.js` as `routeMessage()` and in `api/agents/circuit-breaker.js` as `detectGrief()`.

**Consequences:**
- (+) Handles nuanced intent detection (grief, implicit complaints) that regex cannot
- (+) Haiku is fast and cheap enough for per-message classification
- (-) Adds one LLM round-trip before the actual agent call
- (-) Classification errors route messages to the wrong agent

---

### ADR-006: Grief Circuit Breaker Pattern

**Context:** LLM-generated responses to grief scenarios were inconsistent and sometimes inappropriate (e.g., suggesting events after a member mentions a death). Stochastic generation is unacceptable for bereavement.

**Decision:** When the Haiku classifier detects grief, bypass the LLM entirely and return a deterministic canned response with human handoff. Three scenario types supported: `grief`, `harassment`, `emergency`. Canned templates use `{name}`, `{deceased}`, `{staff_role}` interpolation. Activations logged to `agent_activity` as `circuit_breaker`. Defined in `api/agents/circuit-breaker.js`.

**Consequences:**
- (+) Zero stochasticity for the highest-sensitivity scenarios
- (+) Guaranteed human handoff — staff role is always named
- (-) Canned responses cannot adapt to unique grief contexts
- (-) False positives from the classifier trigger the circuit breaker unnecessarily

---

### ADR-007: 6-Sprint Config System (3-Tier: GM / Admin / Engineering)

**Context:** Autoresearch QA exposed a ceiling: prompt-only iteration produces diminishing returns against stochastic behavioral failures. Clubs need per-club tuning without code deploys.

**Decision:** Build a 6-sprint configuration system with three audience tiers. **Tier 1 (GM):** tone dropdown, sweep cadence, auto-approve threshold. **Tier 2 (Admin):** custom examples, tool permissions, forbidden actions, brand voice. **Tier 3 (Engineering):** model selector, temperature, prefill, validation rules. All tiers compose at runtime via `assembleAgentCall()` in `api/agents/assemble.js`, which loads from `agent_configs` JSONB columns. Defined in `docs/AGENT_CONFIG_SYSTEM_ROADMAP.md`.

**Consequences:**
- (+) Config changes take seconds (DB write) instead of hours (code deploy)
- (+) Custom examples per club create a competitive moat
- (-) 66 QA tests across 6 sprints; significant build investment
- (-) JSONB schema drift across clubs is a maintenance risk

---

### ADR-008: Prefilled Assistant Openings for Behavioral Compliance

**Context:** Complaint agents inconsistently started responses with empathy. The first word of a complaint response must be the member's name (per autoresearch scoring), but LLMs sometimes lead with "I understand" or jump to solutions.

**Decision:** Inject a prefilled assistant turn before the user message in the `messages` array. For complaint scenarios, the prefill anchors the response to start with the member's name. Supports `{member_first_name}`, `{member_last_name}`, `{club_name}` interpolation. Implemented in `api/agents/assemble.js` (`_interpolatePrefill`) and tested in `tests/agents/autoresearch/run_eval.js`.

**Consequences:**
- (+) Empathy-first compliance rose from ~70% to 95%+ in autoresearch evals
- (+) Works with any model without prompt changes
- (-) Prefill constrains the model's opening, which can feel formulaic if overused

---

### ADR-009: Temperature Differentiation by Agent Type

**Context:** A single temperature for all agents was a forced compromise. Booking confirmations need deterministic precision; concierge interactions need creative warmth.

**Decision:** Each agent has a dedicated temperature tuned to its domain. From `api/agents/assemble.js` `DEFAULT_TEMPERATURES`:

| Agent Type | Temperature | Rationale |
|-----------|-------------|-----------|
| Booking Agent | 0.1 | Deterministic, no creativity needed |
| Staffing & Demand | 0.2 | Structured recommendations |
| Member Risk, Game Plan, F&B, Board Report, Revenue, Growth | 0.3 | Analytical consistency |
| Chief of Staff, Service Recovery (club) | 0.4 | Balanced orchestration |
| Personal Concierge, Member Service Recovery | 0.6 | Warm, natural conversation |

**Consequences:**
- (+) Booking accuracy improved; concierge responses feel more natural
- (+) Engineering can override per-agent via `prompt_overrides.temperature` in DB
- (-) Temperature tuning requires autoresearch eval runs to validate changes

---

### ADR-010: Post-Generation Validation with Retry

**Context:** Even with good prompts and prefills, LLM responses occasionally violate behavioral rules (forbidden words, missing empathy, markdown in member-facing text).

**Decision:** Five built-in validation rules in `api/agents/validate.js`: `empathy_first` (response starts with member name), `no_forbidden_words` (configurable blocklist), `no_markdown` (no `**`, `##`, or bullet points), `response_length` (word count bounds), `asks_before_suggesting` (question before recommendation). On failure, `validateAndRetry()` re-calls the API with a correction note and reduces temperature by 0.1 per retry, up to 3 attempts. Returns best-effort result.

**Consequences:**
- (+) Catches ~95% of behavioral violations before they reach the member
- (+) Temperature reduction on retry increases determinism for the correction pass
- (-) Each retry is a full API round-trip, adding latency and cost
- (-) Best-effort return means some violations still reach production

---

### ADR-011: Autoresearch Pattern for Agent Optimization

**Context:** Manual prompt tuning was slow and unscientific. Needed a systematic way to test prompt changes against a fixed evaluation suite.

**Decision:** Implement an autonomous optimization loop inspired by karpathy/autoresearch. The optimizer edits only `agent.js`, commits, runs 10 scenarios through a fixed eval harness (`run_eval.js`) scored by a Claude critic on 5 dimensions (natural, helpful, accurate, proactive, club_impact), logs results to `results.tsv`, and keeps or discards the commit based on score delta. Defined in `tests/agents/autoresearch/program.md`.

**Consequences:**
- (+) Systematic, reproducible prompt optimization with clear score tracking
- (+) Simplicity criterion: improvements that add complexity are rejected if score gain is marginal
- (-) Eval harness is fixed at 10 scenarios across 3 members; may not cover all edge cases
- (-) Uses Opus for critic scoring, so each eval run has non-trivial API cost

---

### ADR-012: QA-Dev Loop for Code Quality

**Context:** Code fixes introduced by autonomous agents sometimes broke other tests. Needed a disciplined fix-test-keep/discard cycle.

**Decision:** Three-layer test pyramid (Vitest unit ~30s, API endpoint ~2min, Playwright E2E ~10min). For each failure: analyze root cause, make the minimal fix, commit, re-run only the failing test. If it passes, keep; if it fails or breaks other tests, `git reset --hard HEAD~1`. Max 3 attempts per bug. Never modify test files. Defined in `tests/qa-dev/program.md`.

**Consequences:**
- (+) Atomic fixes with automatic rollback prevent regression accumulation
- (+) Minimal-fix constraint prevents scope creep during autonomous repair
- (-) Max 3 attempts means some bugs are logged as "stuck" and require human intervention
- (-) E2E layer takes ~10 minutes per run, limiting iteration speed

---

### ADR-013: Arrival Anticipation Engine

**Context:** Staff at different touchpoints (Pro Shop, Grill Room, Beverage Cart) each see only their own system data. No single system connects tee sheet bookings, POS history, complaint records, and member preferences.

**Decision:** A Sonnet-powered agent fires 90 minutes before a member's tee time and assembles three role-specific staff briefs by synthesizing cross-domain data: booking details, dining preferences, complaint history, playing patterns, and dietary restrictions. Defined in `src/config/arrivalAnticipationPrompt.js`.

**Consequences:**
- (+) Staff are prepared before the member arrives; cross-domain data connections surface insights no single system provides
- (+) Directly serves the "See It" pillar with proactive operational intelligence
- (-) Depends on accurate tee sheet data; late bookings may not trigger briefs in time
- (-) 90-minute lead time is fixed; some clubs may need different windows

---

### ADR-014: Data Flywheel Tools

**Context:** Agent recommendations had no feedback loop. Without outcome tracking, the health model could not calibrate and cross-club benchmarking was impossible.

**Decision:** Three flywheel endpoints in `api/tools/data-flywheel.js`: **record_outcome** (POST — logs whether a GM intervention succeeded, partially succeeded, or failed, with revenue impact), **calibrate_model** (GET — health model prediction accuracy metrics), **benchmark** (GET — cross-club cohort benchmarking data). Outcomes feed back into the health model and enable network effects across clubs.

**Consequences:**
- (+) Closes the feedback loop: recommendations improve over time with outcome data
- (+) Cross-club benchmarking creates a network effect moat (more clubs = better benchmarks)
- (-) Requires GMs to actually record outcomes; adoption is the bottleneck
- (-) Calibration metrics are only as good as the outcome data quality

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Recharts, Tailwind CSS 4 |
| Backend | Vercel Serverless Functions (Node.js, ES Modules) |
| Database | Vercel Postgres (PostgreSQL) |
| AI SDK | @anthropic-ai/sdk ^0.87.0 |
| Models | Claude Opus 4, Claude Sonnet 4, Claude Haiku 4.5 |
| Testing | Vitest (unit), Playwright (E2E) |
| Monitoring | Sentry (@sentry/react) |

---

## Prompt File Index

24 prompt/config files in `src/config/`:

| File | Agent |
|------|-------|
| chiefOfStaffPrompt.js | Chief of Staff (Opus) |
| personalConciergePrompt.js | Personal Concierge (Opus) |
| memberServiceRecoveryPrompt.js | Member Service Recovery (Opus) |
| bookingAgentPrompt.js | Booking Agent (Haiku) |
| staffingDemandPrompt.js | Staffing & Demand (Haiku) |
| memberRiskPrompt.js | Member Risk Lifecycle (Sonnet) |
| serviceRecoveryPrompt.js | Service Recovery — club-side (Sonnet) |
| gamePlanPrompt.js | Tomorrow's Game Plan (Sonnet) |
| fbIntelligencePrompt.js | F&B Intelligence (Sonnet) |
| boardReportPrompt.js | Board Report Compiler (Sonnet) |
| revenueAnalystPrompt.js | Revenue Analyst (Sonnet) |
| growthPipelinePrompt.js | Growth Pipeline (Sonnet) |
| arrivalAnticipationPrompt.js | Arrival Anticipation (Sonnet) |
| conciergePrompt.js | Legacy concierge (pre-split) |
| serviceSavePrompt.js | Service save playbook |
