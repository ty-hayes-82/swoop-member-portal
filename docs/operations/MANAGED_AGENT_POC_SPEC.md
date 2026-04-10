# Managed Agent POC: Service Save Protocol Orchestrator

**Scope:** Proof-of-concept spec for deploying one Anthropic Managed Agent as a long-running playbook orchestrator within the Swoop platform.

**Agent:** Service Recovery (existing `service-recovery` agent, reimagined as a stateful, multi-step session)

**Goal:** Replace the single-shot `api/agents/sweep.js` pattern for the Service Save Protocol with a persistent Managed Agent session that owns the full complaint-to-resolution lifecycle.

---

## 1. Why This Playbook First

The Service Save Protocol is the highest-signal proof-of-concept because:

- It has the clearest trigger (complaint filed by a high-value member)
- It has a defined multi-step sequence (escalate, alert GM, draft outreach, schedule follow-up, measure outcome)
- It touches multiple data domains (complaints, member health, F&B POS, staff assignments), which exercises the Layer 3 cross-domain thesis
- The dollar-at-risk attribution is concrete ($18K+ annual dues per save)
- It maps directly to the storyboard flow already built (Flow 05: Service Failure Crisis Response)

---

## 2. Architecture: What Changes, What Stays

### Current Pattern (single-shot)

```
GM opens dashboard
  --> frontend calls /api/agents/sweep.js
    --> sweep.js sends context to Anthropic Messages API
    --> Claude returns 2-3 proposed actions as JSON
    --> Actions rendered in AgentActionCard
    --> GM approves/dismisses
    --> Status updated in agent_actions table
```

**Limitation:** No continuity. Each sweep is stateless. The agent doesn't know what it proposed yesterday, whether the GM acted, or whether the member's health score changed after intervention.

### Managed Agent Pattern (stateful session)

```
Complaint filed for high-value member
  --> Swoop backend starts a Managed Agent session
    --> Agent pulls member context via MCP tools
    --> Agent proposes Step 1 (route complaint to F&B Director)
    --> Session goes idle, waits for next event
  --> F&B Director marks complaint acknowledged (webhook)
    --> Session resumes, agent advances to Step 2
    --> Agent proposes GM outreach with draft note
    --> Session goes idle
  --> GM approves outreach (from Swoop UI)
    --> Session resumes, agent advances to Step 3
    --> Agent schedules Day 7 follow-up survey
    --> Agent schedules Day 14 check-in note
    --> Session monitors member health score daily
  --> Day 30: Agent measures outcome
    --> Health score recovered? --> Log as member save
    --> Health score still declining? --> Escalate to GM with new recommendation
    --> Session completes, outcome written to interventions table
```

### What Changes

| Component | Before | After |
|-----------|--------|-------|
| Agent execution | Vercel serverless function | Anthropic Managed Agent session |
| State management | Stateless (rebuild context each call) | Persistent session event log |
| Tool execution | Direct DB queries in sweep.js | MCP server exposes Swoop APIs as tools |
| Step orchestration | Manual (GM drives each step) | Agent-driven with GM approval gates |
| Follow-up scheduling | Not implemented | Agent schedules and monitors autonomously |
| Outcome measurement | Manual (intervention table updated by staff) | Agent measures health score delta at Day 30 |

### What Stays

| Component | Status |
|-----------|--------|
| Frontend UI (ActionsPage, AgentActionCard) | Unchanged. Reads from same tables. |
| Database schema (actions, interventions, playbook_runs, playbook_steps) | Unchanged. Agent writes to same tables via MCP. |
| Other agents (chief-of-staff, retention-sentinel, etc.) | Stay as single-shot sweeps for now. |
| agentService.js frontend service | Unchanged. Fetches from same /api/agents endpoint. |

---

## 3. MCP Server Contract

The Managed Agent needs tools to read and write Swoop data. These are exposed via a single MCP server deployed as a Vercel serverless endpoint (or standalone Node.js service).

### MCP Server: `swoop-club-data`

**Endpoint:** `https://swoop-golf.vercel.app/api/mcp` (or dedicated subdomain)

#### Tool 1: `get_member_profile`

Returns full member context for agent reasoning.

```json
{
  "name": "get_member_profile",
  "description": "Get a member's full profile including health score, archetype, dues, engagement history, and recent activity.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "member_id": { "type": "string", "description": "Member ID (e.g., mbr_203)" },
      "club_id": { "type": "string", "description": "Club ID" }
    },
    "required": ["member_id", "club_id"]
  }
}
```

**Returns:**
```json
{
  "member_id": "mbr_203",
  "name": "James Whitfield",
  "membership_type": "Full Golf",
  "join_date": "2019-04-15",
  "annual_dues": 18000,
  "health_score": 32,
  "health_tier": "at-risk",
  "archetype": "Die-Hard Golfer",
  "last_visit": "2026-01-08",
  "rounds_last_90d": 2,
  "dining_last_90d": 0,
  "email_open_rate": 0.12,
  "recent_complaints": [
    { "complaint_id": "cmp_044", "category": "Service Speed", "status": "open", "reported_at": "2026-01-13" }
  ],
  "household_members": ["mbr_204"],
  "lifetime_spend": 142000
}
```

#### Tool 2: `get_open_complaints`

Returns unresolved complaints, optionally filtered by member.

```json
{
  "name": "get_open_complaints",
  "description": "Get open/unresolved complaints for a club, optionally filtered to a specific member.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "club_id": { "type": "string" },
      "member_id": { "type": "string", "description": "Optional. Filter to one member." },
      "min_age_hours": { "type": "integer", "description": "Only return complaints older than N hours." }
    },
    "required": ["club_id"]
  }
}
```

#### Tool 3: `create_action`

Proposes an action for GM approval. Writes to `actions` table with status=pending.

```json
{
  "name": "create_action",
  "description": "Propose an action for GM review. The action will appear in the GM's action queue with status 'pending' until approved or dismissed.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "club_id": { "type": "string" },
      "member_id": { "type": "string" },
      "action_type": { "type": "string", "enum": ["outreach", "schedule", "flag", "rebalance", "comp", "alert_staff"] },
      "description": { "type": "string", "description": "Human-readable description of the proposed action" },
      "priority": { "type": "string", "enum": ["low", "medium", "high"] },
      "impact_metric": { "type": "string", "description": "e.g., '$18K/yr at risk'" },
      "assigned_to": { "type": "string", "description": "Role or name of staff to execute" },
      "source": { "type": "string", "description": "Agent name" }
    },
    "required": ["club_id", "action_type", "description", "priority", "source"]
  }
}
```

**Returns:** `{ "action_id": "act_xxx", "status": "pending" }`

#### Tool 4: `update_playbook_step`

Advances a playbook step status.

```json
{
  "name": "update_playbook_step",
  "description": "Update the status of a playbook step (mark as completed, skipped, or add notes).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "step_id": { "type": "string" },
      "status": { "type": "string", "enum": ["pending", "completed", "skipped"] },
      "completed_by": { "type": "string" },
      "notes": { "type": "string" }
    },
    "required": ["step_id", "status"]
  }
}
```

#### Tool 5: `start_playbook_run`

Creates a new playbook_run and its steps. Returns the run_id and step_ids.

```json
{
  "name": "start_playbook_run",
  "description": "Initialize a new playbook run for a member. Creates the run record and all step records.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "club_id": { "type": "string" },
      "playbook_id": { "type": "string", "enum": ["service-save", "new-member-90day", "staffing-adjustment"] },
      "member_id": { "type": "string" },
      "triggered_by": { "type": "string", "description": "Who or what triggered this run" },
      "trigger_reason": { "type": "string" }
    },
    "required": ["club_id", "playbook_id", "member_id", "triggered_by", "trigger_reason"]
  }
}
```

**Returns:**
```json
{
  "run_id": "run_xxx",
  "steps": [
    { "step_id": "stp_001", "step_number": 1, "title": "Route complaint to F&B Director", "status": "pending" },
    { "step_id": "stp_002", "step_number": 2, "title": "GM personal outreach", "status": "pending" },
    { "step_id": "stp_003", "step_number": 3, "title": "Follow-up survey (Day 7)", "status": "pending" },
    { "step_id": "stp_004", "step_number": 4, "title": "Check-in note (Day 14)", "status": "pending" },
    { "step_id": "stp_005", "step_number": 5, "title": "Outcome measurement (Day 30)", "status": "pending" }
  ]
}
```

#### Tool 6: `get_action_status`

Check whether a proposed action was approved, dismissed, or still pending.

```json
{
  "name": "get_action_status",
  "description": "Check the current status of a previously proposed action.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action_id": { "type": "string" }
    },
    "required": ["action_id"]
  }
}
```

#### Tool 7: `record_intervention_outcome`

Writes to the `interventions` table when the agent measures the final outcome.

```json
{
  "name": "record_intervention_outcome",
  "description": "Record the outcome of an intervention: health score before/after, dues protected, whether it qualifies as a member save.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "club_id": { "type": "string" },
      "member_id": { "type": "string" },
      "action_id": { "type": "string" },
      "intervention_type": { "type": "string", "enum": ["call", "email", "comp", "event_invite"] },
      "description": { "type": "string" },
      "initiated_by": { "type": "string" },
      "health_score_before": { "type": "number" },
      "health_score_after": { "type": "number" },
      "outcome": { "type": "string", "enum": ["retained", "re-engaged", "resigned", "pending"] },
      "dues_protected": { "type": "number" },
      "is_member_save": { "type": "boolean" }
    },
    "required": ["club_id", "member_id", "intervention_type", "health_score_before", "outcome"]
  }
}
```

#### Tool 8: `draft_member_message`

Generates a personalized outreach message (replaces the standalone `api/agents/draft.js` call).

```json
{
  "name": "draft_member_message",
  "description": "Draft a personalized outreach message from the GM to a member. Returns the draft text for GM review.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "member_id": { "type": "string" },
      "context": { "type": "string", "description": "Why this message is being sent" },
      "tone": { "type": "string", "enum": ["warm", "formal", "apologetic", "celebratory"], "default": "warm" },
      "channel": { "type": "string", "enum": ["email", "sms", "note"], "default": "email" }
    },
    "required": ["member_id", "context"]
  }
}
```

---

## 4. Managed Agent Configuration

### Agent Definition

```bash
ant beta:agents create \
  --name "Service Save Orchestrator" \
  --model '{id: claude-sonnet-4-6}' \
  --system "$(cat service-save-system-prompt.txt)" \
  --tool '{type: agent_toolset_20260401}' \
  --mcp-server '{url: "https://swoop-golf.vercel.app/api/mcp", name: "swoop-club-data"}'
```

### System Prompt

```
You are the Service Save Orchestrator for a private golf and country club.

Your job is to manage the full lifecycle of the Service Save Protocol: from the
moment a high-value member files a complaint through resolution, follow-up,
and outcome measurement 30 days later.

## Your role

You are an always-on advisor who monitors, proposes, and tracks. You never
take action directly. Every action you propose goes to the GM or assigned staff
for approval before execution.

## Protocol steps

When a complaint triggers this protocol, execute these steps in order:

Step 1: ESCALATE (within 1 hour of trigger)
- Pull the member's full profile via get_member_profile
- Pull the complaint details via get_open_complaints
- Start the playbook run via start_playbook_run
- Create an action to route the complaint to the F&B Director (or relevant
  department head) with the member's full context attached
- Wait for the action to be approved

Step 2: GM ALERT (within 2 hours of trigger)
- Create an action alerting the GM with a call recommendation
- Draft a talking-points note via draft_member_message (tone: apologetic)
- Include the member's annual dues, tenure, recent activity decline, and
  complaint history in the rationale
- Wait for GM approval

Step 3: FOLLOW-UP SURVEY (Day 7)
- Check the member's updated health score via get_member_profile
- If the complaint was resolved and health score is improving: create an action
  to send a satisfaction check-in
- If the complaint is still unresolved: escalate again with increased urgency
- Update the playbook step

Step 4: CHECK-IN NOTE (Day 14)
- Draft a warm follow-up note from the GM via draft_member_message
- Create an action for the GM to review and send
- Update the playbook step

Step 5: OUTCOME MEASUREMENT (Day 30)
- Pull the member's current health score
- Compare to health_score_at_start from the playbook run
- Record the intervention outcome via record_intervention_outcome
- If health score recovered 10+ points: mark as member save, calculate
  dues_protected = annual_dues
- If health score declined further: flag for GM review with a new recommendation
- Complete the playbook run

## Rules

- You never fabricate data. If a tool call fails, report the error and wait.
- You never take action without GM approval. Every proposed action has status
  "pending" until the GM approves it in the Swoop UI.
- You always cite specific data signals in your rationale (dues amount, health
  score, days since last visit, complaint age).
- You write in the voice of a trusted senior advisor: direct, confident, brief.
- You prioritize by: dues at risk x time sensitivity x probability of impact.
- When waiting between steps, go idle. You will be woken by new events.
- If the member resigns before Day 30, record the outcome immediately and
  complete the run.
```

### Environment Definition

```bash
ant beta:environments create \
  --name "swoop-agent-env" \
  --config '{
    type: cloud,
    networking: { type: unrestricted },
    packages: ["nodejs"]
  }'
```

---

## 5. Session Lifecycle

### Trigger: New complaint from high-value member

The Swoop backend (a new Vercel serverless function) detects the trigger condition:

```
POST /api/agents/service-save-trigger
```

**Trigger logic:**
```javascript
// Pseudocode for the trigger endpoint
const member = await getMemberProfile(complaint.member_id);
const shouldTrigger = (
  member.health_score <= 50 &&
  member.annual_dues >= 12000 &&
  complaint.priority !== 'low'
);

if (shouldTrigger) {
  // Start a Managed Agent session via Anthropic API
  const session = await anthropic.beta.managedAgents.sessions.create({
    agent_id: SWOOP_SERVICE_SAVE_AGENT_ID,
    environment_id: SWOOP_AGENT_ENV_ID,
  });

  // Send the initial trigger event
  await anthropic.beta.managedAgents.sessions.sendEvent(session.id, {
    type: 'user.message',
    content: JSON.stringify({
      trigger: 'complaint_filed',
      club_id: complaint.club_id,
      member_id: complaint.member_id,
      complaint_id: complaint.complaint_id,
      complaint_category: complaint.category,
      complaint_priority: complaint.priority,
      timestamp: new Date().toISOString()
    })
  });

  // Store session_id in playbook_runs for later reference
  await db.query(
    'INSERT INTO playbook_runs (run_id, club_id, playbook_id, ..., agent_session_id) VALUES (...)',
    [session.id, ...]
  );
}
```

### Wake events (mid-session)

The agent session goes idle after each step. It is woken by these events:

| Event | Source | Sends to session |
|-------|--------|-----------------|
| Action approved by GM | Swoop UI --> webhook | `{ type: "action_approved", action_id, approved_by }` |
| Action dismissed by GM | Swoop UI --> webhook | `{ type: "action_dismissed", action_id, reason }` |
| Complaint resolved | Staff updates complaint | `{ type: "complaint_resolved", complaint_id, resolved_by }` |
| Day 7 timer | Cron job | `{ type: "scheduled_check", step: "day_7_survey" }` |
| Day 14 timer | Cron job | `{ type: "scheduled_check", step: "day_14_checkin" }` |
| Day 30 timer | Cron job | `{ type: "scheduled_check", step: "day_30_outcome" }` |
| Member resigned | CRM webhook | `{ type: "member_resigned", member_id }` |

### Session completion

The session completes (and stops billing) when:
- The agent marks all 5 playbook steps as completed
- The agent records the intervention outcome
- The agent emits a final summary event

**Expected session lifetime:** 30 days, but only active for ~5-10 minutes total across all wake events. At $0.08/session-hour, estimated cost per playbook run: $0.04-$0.08 for active time (billing is only while agent is running, not idle).

---

## 6. Swoop Backend Changes

### New endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/agents/service-save-trigger` | Evaluates complaint, starts Managed Agent session if criteria met |
| `POST /api/mcp` | MCP server endpoint exposing all 8 tools above |
| `POST /api/agents/session-webhook` | Receives wake events from Swoop UI (action approved/dismissed) and forwards to Managed Agent session |
| `GET /api/agents/session-status/:runId` | Returns current session state for frontend display |

### New cron job

A Vercel cron (or external scheduler) that checks active playbook runs and sends scheduled wake events:

```
# vercel.json
{
  "crons": [
    {
      "path": "/api/cron/playbook-timers",
      "schedule": "0 8 * * *"
    }
  ]
}
```

The cron iterates active `playbook_runs` with `agent_session_id`, checks if any steps are due (Day 7, 14, 30 from `started_at`), and sends the corresponding wake event to the Managed Agent session.

### Schema addition

One column added to `playbook_runs`:

```sql
ALTER TABLE playbook_runs ADD COLUMN agent_session_id TEXT;
```

---

## 7. Frontend Changes

**None required for POC.** The existing ActionsPage, AgentActionCard, and playbook UI already reads from `actions`, `playbook_runs`, and `playbook_steps` tables. The Managed Agent writes to the same tables via MCP, so the frontend sees the same data regardless of whether the action came from a single-shot sweep or a managed session.

The only visible difference: playbook steps will advance automatically as the agent orchestrates, rather than requiring manual status updates.

**Post-POC enhancement:** Add a "Session Timeline" view to the playbook detail card that shows the full event history from the Managed Agent session (escalation, GM approval, follow-ups, outcome). This is a read-only view pulling from the Anthropic session events API.

---

## 8. Implementation Order

| Phase | Work | Estimated effort |
|-------|------|-----------------|
| **A. MCP Server** | Build `/api/mcp` with all 8 tools. Each tool is a thin wrapper around existing DB queries. | 2-3 days |
| **B. Agent Config** | Create the Managed Agent and Environment via CLI. Test the system prompt with a manual session. | 1 day |
| **C. Trigger Endpoint** | Build `/api/agents/service-save-trigger` with complaint evaluation logic and session creation. | 1 day |
| **D. Wake Events** | Build `/api/agents/session-webhook` and wire the Swoop UI approval/dismiss flow to send events. | 1-2 days |
| **E. Cron Timer** | Build `/api/cron/playbook-timers` for Day 7/14/30 scheduled checks. | 0.5 day |
| **F. Integration Test** | End-to-end test with a demo complaint. Verify all 5 steps execute, outcome is recorded. | 1-2 days |
| **Total** | | ~7-10 days |

---

## 9. Cost Model

### Per-playbook-run estimate

| Cost component | Estimate |
|----------------|----------|
| Claude tokens (5-7 agent wake cycles, ~2K tokens each) | ~$0.10-$0.15 |
| Session-hour billing (~10 min active across 30 days) | ~$0.01 |
| MCP tool calls (8 tools, ~20 calls total) | Included in token cost |
| **Total per run** | **~$0.12-$0.16** |

### Monthly estimate (pilot club, 300 members)

Assume 3-5 Service Save Protocol activations per month (based on complaint volume and dues threshold).

| Metric | Value |
|--------|-------|
| Runs per month | 3-5 |
| Cost per month | $0.36-$0.80 |
| Dues protected per save | $12K-$22K |
| ROI per dollar spent | 15,000x-60,000x |

This is effectively free relative to the value delivered.

---

## 10. Belfast and Investor Narrative

This POC gives you three concrete things to show:

1. **"Always-on AI agents"** -- not just dashboards with AI recommendations, but persistent agents that own multi-week workflows end-to-end. No other club tech vendor has this.

2. **"Human-in-the-loop by design"** -- every action goes through GM approval. The agent proposes, the GM decides. This is the trust model that club operators need.

3. **"Closed-loop ROI"** -- the agent that triggered the save also measures the outcome 30 days later and writes it to the board report. No manual tracking, no data entry. The full chain from complaint to save to ROI proof is automated.

**Positioning vs. MetricsFirst:** MetricsFirst shows you a Member Risk Score. Swoop's agent detects the risk, proposes the intervention, drafts the outreach, schedules the follow-up, and measures whether it worked. Display vs. action. Backward-looking vs. forward-looking. Layer 2 BI vs. Layer 3 intelligence.

---

## 11. Open Questions

1. **MCP authentication:** Managed Agent sessions call the MCP server from Anthropic's cloud. The MCP endpoint needs to authenticate these calls. Options: shared secret in the agent's credential vault, or OAuth client credentials flow. Recommendation: start with a shared API key stored in the Anthropic vault, upgrade to OAuth later.

2. **Idle session billing:** Anthropic bills $0.08/session-hour only while the agent is "running" (actively processing). Idle sessions (waiting for wake events) should not incur charges, but this needs verification against the pricing docs.

3. **Session TTL:** Managed Agent sessions are designed for hours, not weeks. A 30-day playbook run may exceed session TTL limits. Fallback: break the run into sub-sessions (Steps 1-2 in session A, Steps 3-5 in session B) with state passed via the playbook_runs table.

4. **Multi-agent coordination:** Post-POC, when Retention Sentinel and Member Pulse are also running as managed sessions, they may propose conflicting actions for the same member. Need a conflict resolution layer (probably a "Chief of Staff" meta-agent or a simple priority queue in the backend).
