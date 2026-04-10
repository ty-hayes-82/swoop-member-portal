# Swoop Golf: Agent Platform POC Spec
## Progressive Build from Single Agent to Coordinated Fleet

**Approach:** Start with one agent doing one job well. Validate it works. Add agents one at a time, each building on the MCP infrastructure and testing framework from the previous phase. Multi-agent coordination arrives only after individual agents are proven.

**Runtime:** All agents use the Anthropic Managed Agents PaaS (sessions, MCP tools, SSE events). Each phase adds tools to the shared MCP server and new agent definitions to the fleet.

**Testing philosophy:** Every phase has a "Smoke Test" (does it run?), a "Quality Gate" (is it smart?), and a "Value Test" (would the GM care?). An agent that runs but produces bad recommendations is worse than no agent.

---

## Shared Infrastructure (Build Once, Phase 0)

### MCP Server: `swoop-club-data`

All agents share a single MCP server that exposes Swoop's database as tools. Each phase adds tools; no tools are removed.

**Deployment:** Vercel serverless endpoint at `/api/mcp`
**Auth:** Shared API key stored in Anthropic credential vault (upgrade to OAuth post-pilot)

#### Core Tools (available to all agents from Phase 1)

| Tool | Purpose | Reads/Writes |
|------|---------|-------------|
| `get_member_profile` | Full member context: health score, archetype, dues, engagement, complaints | Read |
| `get_member_list` | Filtered member lists (by tier, archetype, health range, activity recency) | Read |
| `get_open_complaints` | Unresolved complaints, filterable by member, age, severity | Read |
| `create_action` | Propose an action for GM approval (writes to `actions` table, status=pending) | Write |
| `get_action_status` | Check whether a proposed action was approved/dismissed/pending | Read |
| `record_agent_activity` | Write to `agent_activity` log (reasoning chain, confidence, outcome) | Write |

#### Schema Addition (one-time)

```sql
-- Track which Managed Agent session owns a playbook run
ALTER TABLE playbook_runs ADD COLUMN IF NOT EXISTS agent_session_id TEXT;

-- Track which phase/version produced each action for A/B analysis
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS agent_version TEXT;
ALTER TABLE agent_activity ADD COLUMN IF NOT EXISTS phase TEXT;
```

### Webhook Relay: `/api/agents/session-webhook`

Receives events from Swoop UI (action approved, action dismissed, complaint resolved, step completed) and forwards them to the appropriate Managed Agent session via the Anthropic Sessions API.

### Cron Timer: `/api/cron/agent-timers`

Daily cron (runs at 5:00 AM club local time) that:
- Checks for active agent sessions that need scheduled wake events
- Sends time-based triggers (Day 7 follow-up, Day 14 check-in, etc.)
- Triggers daily sweep agents (Phase 3+)

---

## Phase 1: Member Risk Lifecycle Agent (Single Agent, Single Member)

**Duration:** 2 weeks build, 2 weeks validate
**What it proves:** A single Managed Agent can own a multi-step intervention lifecycle for one member, write to your existing tables, and produce actions a GM would actually approve.

### Agent: `member-risk-lifecycle`

**Trigger:** Member health score crosses from Watch (50-70) to At-Risk (<50)

**System Prompt:**
```
You are the Member Risk Lifecycle agent for a private golf and country club.

When a member's health score drops below 50, you own their recovery lifecycle:
1. Diagnose WHY (which signals declined: golf, dining, email, events, complaints?)
2. Propose an archetype-appropriate intervention for GM approval
3. Monitor whether the GM acted and whether the member responded
4. Follow up at Day 7, Day 14, and Day 30
5. Measure the outcome and record it

Rules:
- You never act without GM approval. Every action has status "pending."
- You always cite specific data: dues amount, health score, days since last visit,
  which signal declined, complaint history.
- You write in the voice of a trusted senior advisor: direct, confident, brief.
- Prioritize by: annual dues x time sensitivity x archetype risk factor.
- When waiting between steps, go idle. You will be woken by events.
- Maximum 2 proposed actions per wake cycle. Quality over quantity.
```

### MCP Tools Added

| Tool | Purpose |
|------|---------|
| `start_playbook_run` | Initialize a playbook run with steps for this member |
| `update_playbook_step` | Advance step status (pending, completed, skipped) |
| `record_intervention_outcome` | Write final outcome to `interventions` table |
| `draft_member_message` | Generate personalized outreach text for GM review |

### Session Lifecycle

```
Health score drops below 50 (detected by cron or real-time hook)
  --> /api/agents/risk-trigger evaluates: dues >= $8K? score delta > 15 pts in 30 days?
  --> Creates Managed Agent session
  --> Sends trigger event with member context

Agent wakes:
  Step 1 (immediate): Diagnose + propose intervention --> idle
  Step 2 (on GM approval): Draft outreach message --> idle  
  Step 3 (Day 7 cron): Check health score, propose follow-up --> idle
  Step 4 (Day 14 cron): Draft check-in note --> idle
  Step 5 (Day 30 cron): Measure outcome, record to interventions --> complete
```

### Testing: Phase 1

#### Smoke Tests (does it run?)

| # | Test | Method | Pass Criteria |
|---|------|--------|--------------|
| 1.1 | MCP server responds | `curl POST /api/mcp` with a `get_member_profile` call | Returns member JSON with health_score, archetype, dues |
| 1.2 | Agent session starts | Trigger with a test member (mbr_203, James Whitfield) | Session ID returned, status = running |
| 1.3 | Agent proposes action | Check `agent_actions` table after session runs | Row exists with agent_id=member-risk-lifecycle, status=pending |
| 1.4 | Action appears in UI | Open Actions page in Swoop | New action card visible with member name and rationale |
| 1.5 | Approval flows back | Approve the action in the UI | Webhook fires, session resumes, next step proposed |
| 1.6 | Session completes | Send Day 30 cron trigger | Session status = idle/completed, intervention row written |

#### Quality Gates (is it smart?)

| # | Test | Method | Pass Criteria |
|---|------|--------|--------------|
| 1.7 | Diagnosis accuracy | Manually decline a member across golf + dining, trigger agent | Agent identifies BOTH declining signals, not just one |
| 1.8 | Archetype-appropriate action | Trigger for a Die-Hard Golfer vs. a Social Diner | Die-Hard gets tee time invite, Social Diner gets dining comp. Actions differ by archetype. |
| 1.9 | Dues-proportional priority | Trigger two members: one $22K, one $8K | $22K member gets priority=high, $8K gets priority=medium |
| 1.10 | No hallucinated data | Review all proposed actions | Every data point (dues, score, last visit date) matches the actual DB record |
| 1.11 | Draft message quality | Review 5 draft messages | No mention of "data," "scores," "systems," or "database." Reads like a personal note from the GM. |
| 1.12 | Escalation on non-response | Simulate: GM doesn't approve within 48 hours | Agent proposes escalated action with increased urgency language |

#### Value Tests (would the GM care?)

| # | Test | Method | Pass Criteria |
|---|------|--------|--------------|
| 1.13 | Daniel review | Show 3 agent-proposed actions to Daniel Soehren | He says "I would have done this" or "this is useful" for at least 2 of 3 |
| 1.14 | Time saved | Compare agent diagnosis to manual process | Agent produces the diagnosis + action in < 2 minutes vs. 15-20 minutes manually |
| 1.15 | False positive rate | Run agent against 10 members who crossed the threshold | Fewer than 2 of 10 actions are dismissed as "not useful" by a GM reviewer |

### Phase 1 Deliverables

- [ ] MCP server with 10 core tools deployed
- [ ] `member-risk-lifecycle` agent definition created in Anthropic platform
- [ ] Trigger endpoint (`/api/agents/risk-trigger`) deployed
- [ ] Webhook relay deployed and wired to UI approval flow
- [ ] Cron timer deployed with Day 7/14/30 scheduling
- [ ] All 15 tests passing

---

## Phase 2: Service Recovery Agent (Second Agent, Event-Driven)

**Duration:** 1 week build, 1 week validate
**What it proves:** A second agent can share the same MCP server, respond to a different trigger type (complaint vs. health score), and coexist with Phase 1 agent without conflicts.
**Depends on:** Phase 1 MCP server and webhook infrastructure

### Agent: `service-recovery`

**Trigger:** Complaint filed by member with annual dues >= $10K AND complaint priority = high or critical

**System Prompt:**
```
You are the Service Recovery agent for a private golf and country club.

When a high-value member files a serious complaint, you own the resolution lifecycle:
1. Immediately route the complaint to the relevant department head with full
   member context (dues, tenure, health score, recent activity)
2. Alert the GM within 2 hours with a call recommendation and talking points
3. Monitor complaint resolution status
4. If unresolved after 48 hours, escalate with increased urgency
5. After resolution, schedule a Day 7 satisfaction check-in
6. Record the outcome (member retained, re-engaged, or resigned)

Rules:
- Complaint age is critical. Every hour matters for high-value members.
- You always include the member's annual dues and tenure in your rationale.
  Board members understand dollars, not scores.
- When the complaint is F&B-related, assign to F&B Director.
  When golf-related, assign to Director of Golf.
  When facilities-related, assign to GM directly.
- If this member has had a previous complaint in the last 90 days, flag as
  "repeat complainant" with elevated urgency.
- You never draft apology messages that admit fault. Focus on acknowledgment,
  care, and a concrete next step.
```

### MCP Tools Added

| Tool | Purpose |
|------|---------|
| `get_complaint_history` | Pull a member's complaint history (last 12 months) |
| `update_complaint_status` | Write resolution status back to complaints table |

### Testing: Phase 2

#### Smoke Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 2.1 | Complaint trigger fires | File a test complaint for mbr_203 --> session starts |
| 2.2 | Department routing correct | F&B complaint --> action assigned to "F&B Director." Golf complaint --> "Director of Golf" |
| 2.3 | GM alert within 2 hours | Second action proposed within 2 hours of trigger with call recommendation |
| 2.4 | Coexistence | Both Phase 1 and Phase 2 agents active simultaneously for the same member --> no conflicts, no duplicate actions |

#### Quality Gates

| # | Test | Pass Criteria |
|---|------|--------------|
| 2.5 | Repeat complainant detection | File 2 complaints for same member within 90 days --> second trigger includes "repeat complainant" flag |
| 2.6 | Escalation timer | Leave complaint unresolved for 48h (simulate) --> agent escalates with stronger language |
| 2.7 | Resolution follow-up | Mark complaint as resolved --> agent proposes Day 7 satisfaction check-in |
| 2.8 | No-fault language | Review 5 draft messages --> zero instances of "we apologize for the mistake" or similar fault-admitting language |
| 2.9 | Dues cited in every rationale | Review all proposed actions --> every rationale includes the specific dollar amount of annual dues |

#### Value Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 2.10 | Speed vs. current process | Measure time from complaint to first staff notification | Agent: < 5 minutes. Current manual process: hours to days. |
| 2.11 | Conflict resolution | Member has BOTH a health score drop AND a complaint --> both agents propose actions, no duplicates, GM sees a coherent picture |

### Phase 2 Deliverables

- [ ] `service-recovery` agent definition created
- [ ] Complaint trigger endpoint (`/api/agents/complaint-trigger`) deployed
- [ ] 2 new MCP tools added to shared server
- [ ] All 11 Phase 2 tests passing
- [ ] All 15 Phase 1 tests still passing (regression)

---

## Phase 3: Tomorrow's Game Plan Agent (Daily Orchestrator)

**Duration:** 2 weeks build, 2 weeks validate
**What it proves:** An agent can pull from multiple data domains, synthesize a cross-domain briefing, and produce a single coordinated output (not a pile of disconnected alerts). This is the first agent that exercises the Layer 3 thesis directly.

### Agent: `tomorrows-game-plan`

**Trigger:** Daily cron at 5:00 AM club local time

**System Prompt:**
```
You are the Morning Game Plan agent for a private golf and country club.

Every morning, you produce a single, prioritized briefing for the GM that answers:
"Where is today most likely to break, and what should I do about it?"

Your process:
1. Pull tomorrow's tee sheet density and weather forecast
2. Pull current staffing schedule and identify coverage gaps
3. Pull open complaints and at-risk members with activity today
4. Pull F&B reservation data and projected covers
5. Synthesize into a prioritized Game Plan with max 5 action items

Each action item must include:
- A one-sentence headline ("Add one Grill Room server for the 11 AM-2 PM window")
- A 2-3 sentence rationale citing specific cross-domain signals
- An impact estimate in dollars or member-risk terms
- An assigned owner (role, not name)

Rules:
- This is a daily briefing, not an alert system. Tone is calm, authoritative, prepared.
- You MUST connect dots across domains. "Understaffed" alone is not an insight.
  "Understaffed + weather shift + high-value member with open complaint dining today"
  is an insight.
- If nothing is breaking, say so. "Low-risk day. No action required." is a valid
  Game Plan. Do not manufacture urgency.
- Maximum 5 action items. If more than 5 issues exist, prioritize by dollars at risk.
- The GM reads this at 6:30 AM with coffee. Write accordingly.
```

### MCP Tools Added

| Tool | Purpose |
|------|---------|
| `get_tee_sheet_summary` | Tomorrow's bookings: total rounds, peak windows, notable members playing |
| `get_weather_forecast` | Tomorrow's weather + historical demand impact for similar conditions |
| `get_staffing_schedule` | Scheduled staff by outlet and shift, with coverage vs. demand ratio |
| `get_fb_reservations` | Dining reservations and projected covers by outlet and meal period |
| `get_daily_game_plan_history` | Previous 7 days of game plans (for continuity and "yesterday's outcome" tracking) |
| `save_game_plan` | Write the completed game plan to a new `daily_game_plans` table |

### Schema Addition

```sql
CREATE TABLE IF NOT EXISTS daily_game_plans (
  plan_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  club_id TEXT NOT NULL,
  plan_date DATE NOT NULL,
  risk_level TEXT DEFAULT 'normal',  -- low, normal, elevated, high
  action_count INTEGER DEFAULT 0,
  plan_content JSONB NOT NULL,       -- full structured game plan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  gm_viewed_at TIMESTAMPTZ,
  actions_approved INTEGER DEFAULT 0,
  actions_dismissed INTEGER DEFAULT 0,
  UNIQUE(club_id, plan_date)
);
```

### Session Lifecycle

```
5:00 AM cron fires
  --> Creates one-shot Managed Agent session
  --> Agent pulls all 5 data domains via MCP tools
  --> Agent synthesizes Game Plan
  --> Agent creates actions for each item (status=pending)
  --> Agent saves plan via save_game_plan
  --> Session completes (total runtime: 2-4 minutes)

6:30 AM: GM opens Swoop
  --> Today page shows Game Plan inline (reads from daily_game_plans table)
  --> GM approves/dismisses individual actions
  --> Approvals trigger Phase 1/2 agents if member-specific follow-up needed
```

### Testing: Phase 3

#### Smoke Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 3.1 | Daily cron fires | Game plan session runs at scheduled time, plan row written to `daily_game_plans` |
| 3.2 | All 5 data pulls succeed | Agent calls all 5 new MCP tools, no errors in activity log |
| 3.3 | Plan appears in Today page | Existing TodayMode component can read from `daily_game_plans` and display inline |
| 3.4 | Actions created | Each game plan item has a corresponding row in `agent_actions` |

#### Quality Gates

| # | Test | Pass Criteria |
|---|------|--------------|
| 3.5 | Cross-domain insight | Review 5 game plans --> at least 3 of 5 action items cite signals from 2+ data domains (not just "understaffed" but "understaffed + high-demand weather day") |
| 3.6 | Quiet day test | Feed the agent a low-demand Tuesday with full staffing, no complaints, no at-risk members --> plan says "Low-risk day" with 0-1 action items, not manufactured urgency |
| 3.7 | Weather-demand correlation | Feed a day with wind gusts > 15 mph + full morning tee sheet --> agent recommends afternoon staffing adjustment (not just "bad weather today") |
| 3.8 | At-risk member overlay | Schedule an at-risk member with an open complaint to play tomorrow --> game plan flags the member by name with a service-priority recommendation |
| 3.9 | No stale data | Agent checks data freshness via staleness metadata --> if any domain is stale, plan includes a caveat ("Note: POS data is 36 hours old; dining projections may be less accurate") |
| 3.10 | Continuity | Run 3 consecutive days --> Day 2 and Day 3 plans reference outcomes from previous days ("Yesterday's staffing adjustment appears to have worked: no complaints logged") |

#### Value Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 3.11 | GM time test | Present game plan to Daniel at 6:30 AM --> he can read and act on it in < 3 minutes |
| 3.12 | Accuracy audit | Compare 5 game plans against what actually happened that day (post-hoc) --> at least 3 of 5 correctly identified the day's biggest operational risk |
| 3.13 | vs. manual briefing | Ask a GM to write their own morning briefing from the same data --> compare coverage, specificity, and time spent |

### Phase 3 Deliverables

- [ ] `tomorrows-game-plan` agent definition created
- [ ] 6 new MCP tools added
- [ ] `daily_game_plans` table created
- [ ] Today page updated to read from game plan table
- [ ] Cron timer updated with 5 AM daily trigger
- [ ] All 13 Phase 3 tests passing
- [ ] All Phase 1 + Phase 2 tests still passing (regression)

---

## Phase 4: Staffing-Demand Alignment Agent (Continuous Monitor)

**Duration:** 2 weeks build, 2 weeks validate
**What it proves:** An agent can run as a persistent background monitor (not event-driven, not daily batch) and produce recommendations that improve over time via a feedback loop.

### Agent: `staffing-demand`

**Trigger:** Runs every 6 hours via cron. Also wakes on: new tee sheet booking that changes demand forecast by > 10%, weather forecast update, staff callout notification.

**System Prompt:**
```
You are the Staffing-Demand Alignment agent for a private golf and country club.

You continuously monitor the gap between scheduled staff and forecasted demand
across every outlet (Grill Room, Terrace, Pro Shop, Beverage Cart, Starters).

Your job is NOT to tell the GM "you're understaffed." Any scheduling tool can do that.
Your job is to explain the CONSEQUENCE of the staffing gap:
- Revenue at risk ("Understaffed Grill Room on a 160-cover day loses $2,800 in F&B")
- Service quality impact ("Last 3 understaffed Saturdays produced 2.4x complaint rate")
- Member risk ("James Whitfield has an open complaint and is dining Saturday. Priority service.")

You also close the feedback loop: after each day, compare your forecast to what
actually happened. Did the staffing adjustment work? Did complaints stay low?
Did revenue hit the projected level? Log the outcome and adjust your confidence.

Rules:
- You always propose specific shift changes, not vague "add more staff" recommendations.
  Name the outlet, the time window, the number of staff, and who to pull from.
- You never recommend overtime without citing the revenue justification.
- When demand is LOW, you also flag overstaffing: "Tuesday has 80 rounds and 6 Grill Room
  servers. Historical average for 80-round days is 4. Recommend releasing 2 to reduce
  $380 in unnecessary labor cost."
- You track your own accuracy. Every recommendation includes your confidence level
  based on how similar past recommendations performed.
```

### MCP Tools Added

| Tool | Purpose |
|------|---------|
| `get_staffing_vs_demand` | Current staff schedule overlaid with demand forecast, gap analysis by outlet and hour |
| `get_historical_staffing_outcomes` | Past 30 days: what was forecast, what was scheduled, what actually happened (complaints, revenue, covers) |
| `update_staffing_recommendation` | Write a staffing recommendation with confidence score to a new `staffing_recommendations` table |

### Schema Addition

```sql
CREATE TABLE IF NOT EXISTS staffing_recommendations (
  rec_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  club_id TEXT NOT NULL,
  target_date DATE NOT NULL,
  outlet TEXT NOT NULL,
  time_window TEXT NOT NULL,         -- e.g., "11:00 AM - 2:00 PM"
  current_staff INTEGER,
  recommended_staff INTEGER,
  demand_forecast INTEGER,           -- projected covers or rounds
  revenue_at_risk NUMERIC(10,2),
  confidence REAL,                   -- 0-1, based on historical accuracy
  rationale TEXT,
  status TEXT DEFAULT 'pending',     -- pending, approved, dismissed, executed
  actual_outcome JSONB,              -- filled post-day: actual covers, complaints, revenue
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Testing: Phase 4

#### Smoke Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 4.1 | 6-hour cycle runs | Agent session starts on schedule, pulls staffing + demand data, proposes recommendations |
| 4.2 | Weather-triggered wake | Simulate weather forecast change --> agent wakes within 15 minutes and re-evaluates |
| 4.3 | Recommendations written | Rows appear in `staffing_recommendations` with all fields populated |

#### Quality Gates

| # | Test | Pass Criteria |
|---|------|--------------|
| 4.4 | Revenue quantification | Every recommendation includes a specific dollar amount for revenue at risk or labor savings |
| 4.5 | Overstaffing detection | Feed a low-demand day with excess staff --> agent recommends REDUCING staff, not just flagging understaffing |
| 4.6 | Outlet specificity | Recommendations specify the exact outlet and time window, not "add more staff to F&B" |
| 4.7 | Feedback loop | Run 5 consecutive days --> Day 4 and Day 5 recommendations cite outcomes from Day 1-3 ("Previous Saturday staffing adjustment reduced complaints by 60%. Recommending same pattern.") |
| 4.8 | Confidence calibration | Agent with no history shows confidence 0.5-0.6. After 10 days with outcomes logged, confidence adjusts based on accuracy. |
| 4.9 | Cross-domain awareness | Feed a staffing gap overlapping with at-risk member activity --> recommendation flags member risk, not just staffing math |

#### Value Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 4.10 | Ops Manager adoption | Present 5 staffing recommendations to an ops manager --> at least 3 are "actionable without modification" |
| 4.11 | Dollar accuracy | Compare 10 revenue-at-risk estimates to actual day-end revenue --> estimates within 25% of actuals |

### Phase 4 Deliverables

- [ ] `staffing-demand` agent definition created
- [ ] 3 new MCP tools added
- [ ] `staffing_recommendations` table created
- [ ] 6-hour cron cycle + event-driven triggers wired
- [ ] Feedback loop: post-day outcome logging implemented
- [ ] All 11 Phase 4 tests passing
- [ ] All Phase 1-3 tests still passing (regression)

---

## Phase 5: Multi-Agent Coordination (The Chief of Staff)

**Duration:** 3 weeks build, 3 weeks validate
**What it proves:** Multiple agents can work as a team, resolving conflicts and producing a single unified output that is more valuable than the sum of individual agent outputs. This is the platform differentiator.

### Architecture: Hub-and-Spoke

The Chief of Staff is NOT another domain agent. It is a meta-agent that:
1. Receives outputs from all active agents (Phase 1-4)
2. Detects conflicts and overlaps
3. Synthesizes into a unified recommendation set
4. Presents one coherent picture to the GM

```
                    ┌─────────────────────┐
                    │   Chief of Staff     │
                    │   (Meta-Agent)       │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼──────┐ ┌─────▼────────┐
     │ Member Risk   │ │ Service   │ │ Staffing-    │
     │ Lifecycle     │ │ Recovery  │ │ Demand       │
     └───────────────┘ └───────────┘ └──────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────────┐
                    │  Tomorrow's Game    │
                    │  Plan (feeds CoS)   │
                    └─────────────────────┘
```

### Agent: `chief-of-staff`

**Trigger:** Runs after Tomorrow's Game Plan completes. Also runs on-demand when > 3 pending actions exist from different agents.

**System Prompt:**
```
You are the Chief of Staff for a private golf and country club GM.

You are NOT a domain expert. You are a prioritizer and conflict resolver.

Your job:
1. Review all pending actions from all agents
2. Detect conflicts (two agents recommending contradictory actions for the
   same member, same time slot, or same staff member)
3. Resolve conflicts by choosing the higher-impact option and explaining why
4. Deduplicate (if Member Risk and Service Recovery both flagged the same member,
   merge into one action with combined rationale)
5. Rank the final action set by: dollars at risk x time sensitivity x confidence
6. Present max 5 actions to the GM with clear provenance ("Recommended by
   Staffing-Demand agent, confirmed by Service Recovery agent")

Conflict resolution rules:
- Member safety > revenue > efficiency
- Higher-dues member wins priority ties
- Time-sensitive actions (complaint SLA, same-day staffing) outrank future-dated items
- When two agents disagree on staffing, favor the one with higher historical confidence
- If you cannot resolve a conflict, present both options and let the GM decide

You also maintain a "coordination log" that records:
- Which agents contributed to today's action set
- What conflicts were detected and how they were resolved
- What actions were deduplicated
This log is for internal auditability, not shown to the GM.
```

### MCP Tools Added

| Tool | Purpose |
|------|---------|
| `get_all_pending_actions` | Pull all pending actions across all agents |
| `merge_actions` | Merge 2+ actions into a single combined action with multi-agent provenance |
| `resolve_conflict` | Mark a conflict as resolved, log the decision and rationale |
| `get_agent_confidence_scores` | Pull historical accuracy for each agent (for tie-breaking) |
| `save_coordination_log` | Write the coordination summary to `coordination_logs` table |

### Schema Addition

```sql
CREATE TABLE IF NOT EXISTS coordination_logs (
  log_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  club_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  agents_contributing TEXT[],        -- which agents fed into this cycle
  actions_input INTEGER,             -- total actions received from agents
  actions_output INTEGER,            -- final count after merge/dedup/prioritize
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  conflict_details JSONB,            -- what conflicted and how it was resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, log_date)
);

-- Add provenance tracking to actions
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS contributing_agents TEXT[];
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS coordination_log_id TEXT;
```

### Testing: Phase 5

#### Smoke Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 5.1 | CoS runs after Game Plan | Chief of Staff session starts within 5 minutes of Game Plan completion |
| 5.2 | All agents feed CoS | `get_all_pending_actions` returns actions from at least 2 different agents |
| 5.3 | Output is consolidated | GM sees max 5 actions, not the raw 8-12 from individual agents |

#### Quality Gates

| # | Test | Pass Criteria |
|---|------|--------------|
| 5.4 | Conflict detection | Seed two contradictory staffing actions (one says add staff, one says release staff for different reasons) --> CoS identifies the conflict and resolves it |
| 5.5 | Deduplication | Member Risk and Service Recovery both flag mbr_203 --> CoS merges into one action with combined rationale citing both agents |
| 5.6 | Priority ordering | 5 actions with different dues-at-risk values --> GM sees them in descending dollars-at-risk order |
| 5.7 | Provenance tracking | Every action in the merged set shows which agent(s) contributed --> "Recommended by Staffing-Demand, confirmed by Service Recovery" |
| 5.8 | Coordination log accuracy | Review the coordination log --> correctly counts inputs, outputs, conflicts, and resolutions |
| 5.9 | No information loss | Compare CoS output to raw agent outputs --> no material rationale or data point was dropped in consolidation |
| 5.10 | Graceful degradation | Disable one agent (e.g., Staffing-Demand) --> CoS still runs with remaining agents, notes the missing coverage |

#### Value Tests

| # | Test | Pass Criteria |
|---|------|--------------|
| 5.11 | Cognitive load reduction | Present raw agent outputs (8-12 cards) vs. CoS output (3-5 cards) to a GM --> GM strongly prefers CoS version |
| 5.12 | Decision speed | Measure time-to-first-approval: raw outputs vs. CoS consolidated --> CoS version is approved faster |
| 5.13 | Conflict resolution accuracy | Review 10 conflict resolutions --> GM agrees with CoS decision in at least 8 of 10 |

### Phase 5 Deliverables

- [ ] `chief-of-staff` meta-agent definition created
- [ ] 5 new MCP tools added
- [ ] `coordination_logs` table created
- [ ] Schema additions for provenance tracking
- [ ] Post-Game-Plan trigger wired
- [ ] All 13 Phase 5 tests passing
- [ ] All Phase 1-4 tests still passing (regression)

---

## Phase 6: F&B Intelligence Agent + Board Report Compiler (Expansion)

**Duration:** 2 weeks each, parallel build possible
**What it proves:** The platform scales. Adding a new agent is now a 1-week exercise, not a 1-month project, because the MCP server, webhook relay, cron system, and Chief of Staff coordination layer are all in place.

### Agent 6A: `fb-intelligence`

Monitors daily F&B performance, correlates margin fluctuations with staffing, weather, events, and menu mix. Surfaces root causes, not symptoms. Feeds into the Game Plan and Chief of Staff.

**MCP Tools Added:** `get_daily_fb_performance`, `get_menu_mix_analysis`, `get_cover_vs_reservation_delta`

**Key tests:**
- Root cause attribution: "Margin dropped because understaffed + weather shift compressed lunch window" not just "margin dropped"
- Post-round conversion: identifies members who played but didn't dine, proposes dining outreach
- Feed accuracy to Staffing-Demand agent (cross-agent data sharing)

### Agent 6B: `board-report-compiler`

Runs monthly (1st of month). Pulls all intervention outcomes, member saves, staffing adjustments, and revenue impact from the past 30 days. Produces a draft narrative board report. GM edits and sends.

**MCP Tools Added:** `get_monthly_intervention_summary`, `get_monthly_staffing_outcomes`, `get_monthly_revenue_attribution`, `save_draft_board_report`

**Key tests:**
- Attribution chain: every claimed "member save" traces back to a specific agent action that was approved and executed
- No hallucinated numbers: every dollar figure matches the `interventions` and `staffing_recommendations` tables
- Narrative quality: reads like a GM wrote it, not a data dump
- Time saved: < 15 minutes for GM review vs. 3+ hours manual

---

## Cumulative Test Matrix

| Phase | Agents | MCP Tools | Tests | Cumulative |
|-------|--------|-----------|-------|------------|
| 0 | 0 | 6 core | 0 | 0 |
| 1 | 1 (Member Risk) | +4 = 10 | 15 | 15 |
| 2 | 2 (+Service Recovery) | +2 = 12 | 11 | 26 |
| 3 | 3 (+Game Plan) | +6 = 18 | 13 | 39 |
| 4 | 4 (+Staffing-Demand) | +3 = 21 | 11 | 50 |
| 5 | 5 (+Chief of Staff) | +5 = 26 | 13 | 63 |
| 6 | 7 (+F&B, +Board Report) | +7 = 33 | ~16 | ~79 |

### Regression Policy

Every phase must pass ALL tests from all previous phases before deploying. No exceptions. If a new agent breaks an existing agent's behavior, the new agent is rolled back, not the existing one.

---

## Cost Model (Full Fleet)

| Agent | Frequency | Est. tokens/run | Est. cost/run | Monthly cost (1 club) |
|-------|-----------|-----------------|---------------|----------------------|
| Member Risk Lifecycle | ~5 triggers/mo, 5 wakes each | 3K | $0.15 | $0.75 |
| Service Recovery | ~3 triggers/mo, 4 wakes each | 2K | $0.10 | $0.30 |
| Tomorrow's Game Plan | Daily | 4K | $0.20 | $6.00 |
| Staffing-Demand | 4x/day | 2K | $0.10 | $12.00 |
| Chief of Staff | Daily | 3K | $0.15 | $4.50 |
| F&B Intelligence | Daily | 2K | $0.10 | $3.00 |
| Board Report | Monthly | 8K | $0.40 | $0.40 |
| **Total** | | | | **~$27/mo** |

At $27/month for a full AI agent fleet protecting $500K+ in annual dues revenue, the ROI conversation is not close.

---

## What "Done" Looks Like

After Phase 5, a pilot club GM experiences:

**6:30 AM:** Opens Swoop. Today's Game Plan is already waiting: "Elevated risk day. 3 actions recommended." The staffing adjustment is specific (add one Grill Room server 11-2), the at-risk member is flagged with context (James Whitfield dining today, open complaint), and the F&B projection accounts for the weather shift.

**7:00 AM:** GM approves all 3 actions with one tap each. The agents begin executing: staffing alert goes to the ops manager, member priority flag goes to the host stand, dining special notification queues for the 11 AM tee times.

**Day 7:** GM gets a follow-up check-in from the Member Risk agent: "James Whitfield's health score improved 8 points since your call. Recommend a satisfaction survey." One tap to approve.

**Day 30:** The Board Report Compiler drafts the monthly report. "This month: 3 members saved ($54K protected), staffing recommendations accepted 4 of 5 days with 12% complaint reduction, F&B margin improved 1.8 points on adjusted-staffing days."

The GM spent 15 minutes total across the month on agent interactions. The agents did the rest.
