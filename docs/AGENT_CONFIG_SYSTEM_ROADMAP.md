# Swoop Golf — Agent Configuration System
## Development Roadmap

**Document:** AGENT_CONFIG_SYSTEM_ROADMAP.md
**Created:** April 11, 2026
**Status:** Draft
**Owner:** Ty Hayes
**Target:** Production-ready agent configuration across 3 tiers (GM, Admin, Engineering)

---

## Executive Summary

The agent system currently runs on hardcoded prompts, a single model (Sonnet/Opus), and fixed tool assignments. The autoresearch QA loop exposed a ceiling: prompt-only iteration produces diminishing returns against stochastic behavioral failures. This roadmap builds a configuration layer that makes agent behavior tunable per club, per agent, per scenario without code deploys.

**End state:** A GM adjusts tone with a dropdown. A CSM adds club-specific examples through a UI panel. Engineering tunes temperature and validation rules through an admin interface. All three layers compose into a single API call at runtime.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    RUNTIME PROMPT ASSEMBLY                       │
│                                                                  │
│  Base Prompt    +  Club Config     +  Engineering     =  API     │
│  (per agent)       (behavioral_     (prompt_             Call    │
│                     config JSONB)    overrides JSONB)            │
│                                                                  │
│  Tool Registry  →  Permission      →  Filtered        →  tools  │
│  (all tools)       Filter             Tool List          param   │
│                    (tool_perms                                   │
│                     JSONB)                                       │
└──────────────────────────────────────────────────────────────────┘
```

### Three Configuration Tiers

| Tier | Audience | Controls | Visibility |
|------|----------|----------|------------|
| 1 — Operational | GM | Enable/disable, auto-approve threshold, notification channels, sweep cadence, tone dropdown | Always visible in Agent Config Drawer |
| 2 — Behavioral | CSM / Power Admin | Custom examples, tool permissions, forbidden actions, greeting style, response length | Collapsible "Advanced" section or separate Admin tab |
| 3 — System | Swoop Engineering | Model, temperature, max tokens, prefill, validation rules, prompt append | Hidden behind `role === 'swoop_admin'` check |

---

## Sprint Plan

### Sprint 1: Schema + Assembly Function (Week 1-2)

**Goal:** Extend `agent_configs` with JSONB columns and build the centralized prompt assembly function that all agent API calls route through.

#### Tasks

1.1 — **Database migration: Add JSONB columns to `agent_configs`**
- Add `behavioral_config JSONB DEFAULT '{}'`
- Add `tool_permissions JSONB DEFAULT '{}'`
- Add `prompt_overrides JSONB DEFAULT '{}'`
- Add `sweep_cadence TEXT DEFAULT 'morning'`
- Add `tone TEXT DEFAULT 'warm'`
- Migration file: `api/migrations/002-agent-config-extend.js`

1.2 — **Define JSONB schemas with defaults**
- `behavioral_config`: tone, greeting_style, response_length, max_comp_amount, forbidden_actions[], custom_examples[], brand_voice_notes
- `tool_permissions`: allowed[], denied[], requires_approval[], auto_execute[]
- `prompt_overrides`: model, temperature, max_tokens, prefill, system_prompt_append, validation_rules[]

1.3 — **Build `assembleAgentCall()` function**
- Location: `api/agents/assemble.js`
- Inputs: clubId, agentId, memberContext, userMessage
- Loads config from DB (single query)
- Selects base prompt from `BASE_PROMPTS[agentId]`
- Injects tone preset, greeting rules, forbidden actions, custom examples
- Filters tool list by `tool_permissions`
- Sets model, temperature, max_tokens from `prompt_overrides` (with defaults)
- Handles prefill injection into messages array
- Returns complete API call payload (not executed)

1.4 — **Create tone preset library**
- Location: `api/agents/tone-presets.js`
- Three presets: `warm`, `professional`, `direct`
- Each preset is a prompt block (5-10 lines) that injects into system prompt
- Include greeting style rules per preset

1.5 — **Refactor `sweep.js` to use `assembleAgentCall()`**
- Replace hardcoded `SYSTEM_PROMPTS` object
- Replace hardcoded model/temperature/max_tokens
- Route all agent API calls through assembly function
- Maintain backward compatibility (no config = current behavior)

1.6 — **Refactor `register-agents.js` to use `assembleAgentCall()`**
- Same refactor for the 8 registered agents
- Ensure agent registration still works with empty config

#### QA Tests — Sprint 1

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S1-01 | Migration runs clean | Run `002-agent-config-extend.js` on fresh DB | Three JSONB columns added to `agent_configs` | `SELECT column_name FROM information_schema.columns WHERE table_name = 'agent_configs'` includes all three new columns |
| S1-02 | Migration is idempotent | Run migration twice | No errors on second run | Exit code 0 both times |
| S1-03 | Assembly with empty config | `assembleAgentCall('oakmont', 'member-pulse', null, 'test')` with no config rows | Returns valid API payload with base prompt, default model (Sonnet), default temperature | Payload has `model`, `system`, `messages` keys; `system` contains base prompt text |
| S1-04 | Assembly with tone override | Set `tone = 'professional'` in DB, call assembly | System prompt includes professional tone block | `system` string contains "professional" tone preset text |
| S1-05 | Assembly with tool filtering | Set `tool_permissions.denied = ['send_message']` in DB | Returned tools array excludes `send_message` | `tools.find(t => t.name === 'send_message')` returns undefined |
| S1-06 | Assembly with prefill | Set `prompt_overrides.prefill = 'Good morning, {member_first_name}'` | Messages array includes assistant prefill with interpolated name | Last message has `role: 'assistant'` and contains member name |
| S1-07 | Assembly with custom examples | Set `behavioral_config.custom_examples = [{scenario: 'complaint', input: '...', ideal_response: '...'}]` | System prompt includes example block | `system` string contains "Club-Specific Examples" header and example text |
| S1-08 | Sweep uses assembly | Call `/api/agents/sweep` with POST | Agent uses config from DB, not hardcoded prompt | Console log shows config loaded; response format unchanged |
| S1-09 | Backward compat — no config row | Delete all `agent_configs` rows, call sweep | Falls back to defaults, no crash | Response status 200, actions array returned |
| S1-10 | Tone presets all valid | Load each preset (`warm`, `professional`, `direct`) | Each returns non-empty string | All three are strings with length > 50 chars |

---

### Sprint 2: Tier 1 UI — GM Config Drawer (Week 3-4)

**Goal:** Expand the existing `AgentConfigDrawer` with tone, sweep cadence, and improved auto-approve controls. All GM-facing, no advanced options.

#### Tasks

2.1 — **Expand `AgentConfigDrawer` with tabbed layout**
- Tab 1: "Behavior" (tone dropdown, sweep cadence, auto-approve)
- Tab 2: "Notifications" (existing channel toggles, moved from inline)
- Tab 3: "Segments" (existing member segment checkboxes, moved from inline)
- Tabs render conditionally by agent type (concierge gets all 3; revenue analyst gets 1 and 2 only)

2.2 — **Tone dropdown component**
- Options: Warm & Personal, Professional & Direct, Board-Ready Formal
- Shows 1-sentence description of each ("Members feel like they're talking to a trusted friend")
- Saves to `agent_configs.tone`

2.3 — **Sweep cadence dropdown**
- Options: Morning Only (6 AM), Every 4 Hours, Hourly, Real-Time
- Shows next scheduled sweep time
- Saves to `agent_configs.sweep_cadence`

2.4 — **Auto-approve section redesign**
- Toggle: "Allow this agent to act without GM approval"
- Confidence threshold slider (0.70 - 0.95) with labeled ticks
- Preview: "At this threshold, ~X% of recommendations would auto-execute based on last 30 days"
- Dollar cap input: "Never auto-approve actions affecting more than $___"

2.5 — **API endpoint: `PATCH /api/agent-config`**
- Accepts clubId, agentId, and partial config update
- Merges into existing JSONB columns (not full replace)
- Validates tone is one of three presets
- Validates threshold is 0.70-0.95
- Returns updated config

2.6 — **Config persistence: Replace localStorage with DB**
- Current drawer saves to localStorage
- Refactor to POST to `/api/agent-config` on save
- Load config from DB on drawer open via GET

#### QA Tests — Sprint 2

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S2-01 | Tone dropdown renders | Open config drawer for any agent | Dropdown shows 3 tone options | All three options visible, one selected |
| S2-02 | Tone saves to DB | Select "Professional", click Save | `agent_configs.tone = 'professional'` in DB | DB query returns 'professional' for this agent |
| S2-03 | Tone persists across sessions | Save tone, close drawer, reopen | Previously saved tone is selected | Dropdown value matches DB value on reopen |
| S2-04 | Sweep cadence dropdown renders | Open config drawer | Dropdown shows 4 cadence options | Options match spec |
| S2-05 | Auto-approve threshold slider | Drag slider to 0.85 | Slider value updates, preview % recalculates | Saved value in DB is 0.85 |
| S2-06 | Dollar cap saves | Enter $500 in max auto-approve field | Saved to `behavioral_config.max_comp_amount` | DB JSONB contains `{"max_comp_amount": 500}` |
| S2-07 | PATCH endpoint partial update | PATCH with `{tone: 'direct'}` only | Only tone updates; other fields unchanged | All other config values remain identical |
| S2-08 | PATCH validates bad tone | PATCH with `{tone: 'aggressive'}` | Returns 400 error | Response body contains validation error message |
| S2-09 | Config loads from DB on open | Set config via DB, open drawer | Drawer reflects DB values, not defaults | All fields match DB state |
| S2-10 | Different agents, different configs | Set Member Pulse to "warm", Service Recovery to "direct" | Each drawer shows its own saved config | Opening each drawer shows different tone values |

---

### Sprint 3: Tier 2 — Tool Permissions + Forbidden Actions (Week 5-6)

**Goal:** Let admins control which tools each agent can use and define guardrails (forbidden actions, comp limits).

#### Tasks

3.1 — **Tool registry: Define all tools per agent**
- Location: `api/agents/tool-registry.js`
- Export `AGENT_TOOLS` map: agentId → array of tool definitions
- Each tool has: `name`, `displayName`, `description`, `category` (read/write/communicate), `riskLevel` (low/medium/high)

3.2 — **Tool permissions UI component**
- Renders inside config drawer as "Permissions" tab (visible to admin role only)
- Three-state toggle per tool: Auto-execute (green) / Requires Approval (yellow) / Disabled (red)
- Grouped by category: Read Operations, Write Operations, Communication
- High-risk tools default to "Requires Approval"

3.3 — **Forbidden actions tag input**
- Free-text tag input: admin types actions the agent should never take
- Pre-populated suggestions: "offer_refund", "cancel_membership", "override_waitlist", "send_mass_email"
- Saves to `behavioral_config.forbidden_actions[]`
- Injected into system prompt as "NEVER do any of the following: [list]"

3.4 — **Max comp amount**
- Number input with dollar sign
- Default: $50 (configurable per club)
- Injected into prompt: "Never offer complimentary items valued above $X without GM approval"

3.5 — **Assembly function: tool filtering**
- Before returning tools array, filter against `tool_permissions`
- `denied` tools are removed entirely
- `requires_approval` tools are wrapped in a confirmation step (agent must propose, not execute)
- `auto_execute` tools pass through directly

3.6 — **Assembly function: forbidden actions injection**
- Load `behavioral_config.forbidden_actions` from DB
- Inject as a CRITICAL_INSTRUCTION block in system prompt
- Format: "NEVER: [action1], [action2], [action3]. If a member requests any of these, explain that you need to connect them with [appropriate staff role]."

#### QA Tests — Sprint 3

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S3-01 | Tool registry loads | Import `AGENT_TOOLS` for each agent | All 8 agents have tool arrays | No agent returns empty array |
| S3-02 | Tool permissions UI renders | Open config drawer as admin, go to Permissions tab | Tools listed with three-state toggles | All tools for this agent are visible with correct default states |
| S3-03 | Deny a tool | Set `send_message` to Disabled, save | Tool removed from assembled API call | `assembleAgentCall()` returns tools array without `send_message` |
| S3-04 | Require approval for a tool | Set `book_tee_time` to Requires Approval | Agent proposes booking but doesn't execute | Agent response contains proposal language, not confirmation |
| S3-05 | Forbidden actions inject | Set `forbidden_actions = ['offer_refund']` | System prompt includes "NEVER: offer_refund" | Prompt string search returns match |
| S3-06 | Forbidden action blocks agent | Ask concierge "Can I get a refund?" with `offer_refund` forbidden | Agent declines and routes to staff | Response does not contain refund offer; contains staff referral |
| S3-07 | Max comp amount injects | Set `max_comp_amount = 75` | System prompt includes "$75" comp limit | Prompt string contains "complimentary items valued above $75" |
| S3-08 | Non-admin cannot see Permissions tab | Open drawer as GM role | Permissions tab not rendered | Tab count is 2 (Behavior + Notifications), not 3 |
| S3-09 | Tool permission merge (not replace) | Save permissions for 3 tools, then update 1 | Only the 1 tool changes; other 2 persist | DB JSONB shows all 3 tools with correct states |
| S3-10 | Empty permissions = all tools enabled | Delete `tool_permissions` from DB | Assembly returns full tool set | Tool count matches `AGENT_TOOLS[agentId].length` |

---

### Sprint 4: Tier 2 — Custom Examples + Brand Voice (Week 7-8)

**Goal:** The highest-value configuration feature. Clubs teach their agents how to talk by providing example conversations. This is the competitive moat.

#### Tasks

4.1 — **Custom examples UI: "Examples" tab in config drawer**
- CRUD interface for example pairs
- Fields per example: Scenario Type (dropdown: complaint, booking, greeting, grief, re-engagement, corporate), Member Input (textarea), Ideal Response (textarea)
- Add / Edit / Delete with confirmation
- Maximum 20 examples per agent per club
- Saves to `behavioral_config.custom_examples[]`

4.2 — **Brand voice notes textarea**
- Free-text field: "How does your GM like to communicate?"
- Placeholder: "e.g., Always acknowledge member tenure. For 10+ year members, say 'As one of our most valued long-standing members...' Never use the word 'unfortunately.'"
- Saves to `behavioral_config.brand_voice_notes`
- Injected at end of system prompt as a "Club Communication Style" block

4.3 — **Greeting style config**
- Radio buttons: "First name" / "Formal title for Legacy members" / "Always formal"
- Saves to `behavioral_config.greeting_style`
- Assembly function injects appropriate rule into prompt

4.4 — **Response length preference**
- Radio buttons: "Concise (1-2 sentences)" / "Standard (2-3 sentences)" / "Detailed (full context)"
- Saves to `behavioral_config.response_length`
- Injected as instruction in system prompt

4.5 — **Example injection in prompt assembly**
- Load `custom_examples` from DB
- Format as few-shot examples in system prompt
- Position: after base prompt, before tone block
- Format: "--- Club-Specific Examples ---\nScenario: [type]\nMember says: \"[input]\"\nYou respond: \"[ideal_response]\"\n"
- Filter examples by relevance: if routing classifier categorizes input as "complaint," only inject complaint examples

4.6 — **Preview / Test button**
- Button in Examples tab: "Test this configuration"
- Opens modal with scenario selector (from QA dataset)
- Runs selected scenario through assembled config
- Displays agent response alongside the example
- Allows rapid iteration without affecting production

#### QA Tests — Sprint 4

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S4-01 | Add custom example | Fill all three fields, click Add | Example appears in list, saved to DB | DB `behavioral_config.custom_examples` contains new entry |
| S4-02 | Edit custom example | Click edit on existing example, change response, save | Updated in DB | DB shows modified `ideal_response` text |
| S4-03 | Delete custom example | Click delete, confirm | Removed from list and DB | `custom_examples` array length decremented by 1 |
| S4-04 | Example injected into prompt | Add complaint example, run assembly for complaint input | System prompt contains example text | `system` string includes "Club-Specific Examples" and example content |
| S4-05 | Example filtering by scenario type | Add complaint and booking examples; input is a complaint | Only complaint example injected | `system` string contains complaint example but NOT booking example |
| S4-06 | Brand voice notes inject | Enter "Never use the word unfortunately", save | Prompt contains instruction | `system` string includes "Never use the word unfortunately" |
| S4-07 | Greeting style — first name | Set to "First name", run concierge for "James Whitfield" | Response uses "James" | Response text starts with or prominently contains "James" (not "Mr. Whitfield") |
| S4-08 | Greeting style — formal | Set to "Always formal", run concierge | Response uses "Mr. Whitfield" | Response contains "Mr. Whitfield" |
| S4-09 | Response length — concise | Set to "Concise", run booking scenario | Response is 1-3 sentences | Response word count < 80 |
| S4-10 | Max 20 examples enforced | Try to add 21st example | Error message, add button disabled | UI prevents addition; DB still has 20 |
| S4-11 | Preview button runs test | Click "Test this configuration", select complaint scenario | Modal shows agent response | Response renders in modal within 10 seconds |
| S4-12 | Preview uses current (unsaved) config | Change tone to "direct" without saving, click preview | Preview uses "direct" tone | Response reflects direct tone despite not yet saved |

---

### Sprint 5: Tier 3 — Engineering Controls + Validation (Week 9-10)

**Goal:** Build the internal tooling that makes agents reliable. Temperature per agent, prefilled openings, post-generation validation with retry, and the model selector.

#### Tasks

5.1 — **Tier 3 admin panel (role-gated)**
- Only visible when `user.role === 'swoop_admin'`
- Separate section in config drawer (or dedicated admin page)
- Shows raw JSONB editor as fallback, but structured inputs for common fields

5.2 — **Model selector per agent**
- Dropdown: claude-opus-4-20250514, claude-sonnet-4-20250514, claude-haiku-4-5-20251001
- Shows cost indicator: Opus ($$$$), Sonnet ($$), Haiku ($)
- Default recommendations shown per agent type
- Saves to `prompt_overrides.model`

5.3 — **Temperature slider**
- Range: 0.0 to 1.0, step 0.1
- Shows recommended range per agent type (highlighted zone on slider)
- Booking: 0.0-0.2 (green zone), Complaint: 0.3-0.4, Concierge: 0.5-0.7
- Saves to `prompt_overrides.temperature`

5.4 — **Prefill configuration**
- Textarea for assistant message prefill
- Supports `{member_first_name}`, `{member_last_name}`, `{agent_name}` interpolation
- Example placeholder: "Good morning, {member_first_name} -- "
- Saves to `prompt_overrides.prefill`

5.5 — **Post-generation validation rules**
- Checklist of validation rules per agent:
  - `empathy_first`: Check first 30 tokens for name + apology/acknowledgment (complaint agents)
  - `no_forbidden_words`: Check response against configurable word list (grief agents)
  - `asks_before_suggesting`: Check for question mark before any specific suggestion (corporate/dietary)
  - `response_length_check`: Verify response is within configured length bounds
- Each rule has: enabled toggle, retry_on_fail toggle, max_retries (1-3)
- Saves to `prompt_overrides.validation_rules[]`

5.6 — **Validation engine: `api/agents/validate.js`**
- Input: agent response text, validation rules array
- Output: { passed: boolean, failures: [{rule, detail}] }
- On failure + `retry_on_fail`: re-call API with appended instruction "Your previous response did not follow the required format. [failure detail]. Try again."
- Max retries configurable per rule (default: 1)

5.7 — **Integrate validation into `assembleAgentCall` pipeline**
- After API response, run through validation engine
- If validation fails and retry enabled, re-call with correction note
- Log validation failures to `agent_activity` for accuracy tracking
- Return final (validated or best-effort) response

5.8 — **Test harness integration**
- "Run QA Suite" button in Tier 3 panel
- Executes all 10 autoresearch scenarios against current config
- Displays per-scenario scores in a table
- Highlights regressions vs. baseline
- Allows A/B comparison: "Current config" vs. "Modified config"

#### QA Tests — Sprint 5

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S5-01 | Tier 3 panel hidden from GM | Login as GM role, open config drawer | No "Advanced" or "Engineering" tab | Tab count matches Tier 1+2 only |
| S5-02 | Tier 3 panel visible to swoop_admin | Login as swoop_admin, open config drawer | Engineering tab visible with all controls | Model selector, temperature slider, prefill textarea all render |
| S5-03 | Model selector saves | Select Opus, save | `prompt_overrides.model = 'claude-opus-4-20250514'` in DB | Assembly function returns Opus as model |
| S5-04 | Temperature saves and applies | Set temperature to 0.3 | API call uses `temperature: 0.3` | Logged API call payload shows correct temperature |
| S5-05 | Prefill injects correctly | Set prefill to "Hi {member_first_name}, " | Messages array includes prefilled assistant turn | Last message in array has `role: 'assistant'`, content starts with "Hi James, " |
| S5-06 | Validation: empathy_first passes | Complaint response starts with "James, I'm so sorry..." | Validation passes | `validate()` returns `{passed: true}` |
| S5-07 | Validation: empathy_first fails + retry | Complaint response starts with "Let me set up booth 12..." | Validation fails, retry triggered, second response checked | `agent_activity` log shows retry; final response starts with empathy |
| S5-08 | Validation: no_forbidden_words passes | Grief response contains no event/booking words | Validation passes | `validate()` returns `{passed: true}` |
| S5-09 | Validation: no_forbidden_words fails | Grief response contains "Would you like to come to our wine dinner?" | Validation fails | `validate()` returns `{passed: false, failures: [{rule: 'no_forbidden_words', detail: 'wine dinner'}]}` |
| S5-10 | Retry max respected | Set max_retries=1, first two responses both fail validation | Returns second response (best-effort) after 1 retry | No third API call made; `agent_activity` shows 2 calls total |
| S5-11 | QA suite runs from panel | Click "Run QA Suite" | All 10 scenarios execute, scores display | Table shows 10 rows with scores, completes within 120 seconds |
| S5-12 | QA suite shows regression | Change temperature to 1.0, run suite | Scores drop, regressions highlighted in red | At least 1 scenario shows red highlight vs. baseline |

---

### Sprint 6: Integration + Multi-Tenancy + Production Hardening (Week 11-12)

**Goal:** Ensure configs are isolated per club, the assembly pipeline handles edge cases, and the full system works end-to-end across the pilot and demo environments.

#### Tasks

6.1 — **Multi-tenancy validation**
- Verify `agent_configs` composite PK (`club_id`, `agent_id`) prevents cross-club leakage
- Add club_id to all config API endpoints
- Verify assembly function loads config for correct club
- Test with two clubs having different configs for same agent

6.2 — **Config versioning**
- Add `config_version INTEGER DEFAULT 1` and `updated_at TIMESTAMPTZ` to `agent_configs`
- On every PATCH, increment version and log previous config to `agent_config_history` table
- Enables rollback: "This agent was better last week, revert to version 3"

6.3 — **Config export/import**
- Export: Download a club's full agent config as JSON
- Import: Upload JSON to apply config to a different club
- Use case: "Bowling Green's config works great, apply it to the next pilot club"
- Validates schema before applying

6.4 — **Default config templates**
- "Swoop Recommended" — the baseline config derived from autoresearch QA results
- "Conservative" — everything requires approval, formal tone, narrow tool set
- "Aggressive" — auto-approve enabled, wide tool set, proactive suggestions on
- Templates stored in code, not DB; applied via "Reset to Template" button

6.5 — **Circuit breaker: Grief/bereavement routing**
- Add `scenario_overrides` to `behavioral_config`
- When routing classifier detects grief: bypass LLM entirely, return canned response + human handoff
- Canned response: "[Name], I want to make sure you're getting the care you deserve. I'm letting [configured staff role] know, and they'll reach out personally today."
- Log as `agent_activity` with `action_type = 'circuit_breaker'`

6.6 — **Performance: Config caching**
- Cache `agent_configs` in memory with 60-second TTL
- Invalidate on PATCH
- Prevents DB round-trip on every agent call

6.7 — **Monitoring: Config drift alerting**
- Track when a club's config diverges significantly from Swoop Recommended
- Alert CSM if accuracy_score drops below 0.60 after config change
- Dashboard: config health across all clubs

#### QA Tests — Sprint 6

| ID | Test | Input | Expected Output | Pass Criteria |
|----|------|-------|-----------------|---------------|
| S6-01 | Multi-tenant isolation | Club A: tone=warm, Club B: tone=direct. Call assembly for each | Different prompts generated | System prompt for Club A contains warm tone; Club B contains direct tone |
| S6-02 | Cross-club leakage prevention | Query config for Club A using Club B's clubId | Returns Club B's config (or empty) | Never returns Club A's data |
| S6-03 | Config version increments | PATCH config 3 times | `config_version = 3` | DB shows version 3; `agent_config_history` has 3 rows |
| S6-04 | Config rollback | Revert to version 1 | Config matches version 1 state | All fields match the historical snapshot |
| S6-05 | Config export | Export Club A config | JSON file with all agent configs | File parses as valid JSON; contains all 8 agent configs |
| S6-06 | Config import | Import Club A's JSON to Club B | Club B now has Club A's config | DB query for Club B matches exported values |
| S6-07 | Import validates schema | Import JSON with invalid tone value | Error returned, no changes applied | DB unchanged; error message specifies invalid field |
| S6-08 | Default template apply | Click "Reset to Swoop Recommended" | Config resets to template values | All fields match template; version increments |
| S6-09 | Circuit breaker fires on grief | Send grief message through concierge | Canned response returned, no LLM call | Response matches canned text; `agent_activity` logs `circuit_breaker` |
| S6-10 | Circuit breaker bypassed for non-grief | Send booking message | Normal LLM response | No circuit breaker log entry; response is LLM-generated |
| S6-11 | Config cache hit | Call assembly twice within 60 seconds | Second call skips DB query | Timing shows < 1ms for second call (cache hit) |
| S6-12 | Config cache invalidation | PATCH config, then call assembly | Fresh config loaded from DB | Assembly uses new value, not cached old value |

---

## Sprint Summary

| Sprint | Weeks | Focus | Key Deliverable |
|--------|-------|-------|-----------------|
| 1 | 1-2 | Schema + Assembly | `assembleAgentCall()` replaces all hardcoded prompts |
| 2 | 3-4 | GM Config UI | Tone, cadence, auto-approve in expanded drawer |
| 3 | 5-6 | Tool Permissions | Per-agent tool enable/disable/approval-required |
| 4 | 7-8 | Custom Examples | Club-specific few-shot examples + brand voice |
| 5 | 9-10 | Engineering Controls | Model/temp/prefill/validation + retry loop |
| 6 | 11-12 | Production Hardening | Multi-tenancy, versioning, circuit breakers, caching |

**Total QA tests:** 66 (10-12 per sprint)
**Total estimated duration:** 12 weeks (6 two-week sprints)

---

## Dependencies + Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| JSONB schema drift across clubs | Config becomes unparseable | Validate on write via JSON Schema; migration script to backfill defaults |
| Custom examples degrade performance | Examples confuse the model instead of helping | Limit to 20 per agent; validate via QA suite before saving; "Test this config" preview |
| Temperature too high causes inconsistency | Stochastic failures return (the original problem) | Recommended range UI; warn when outside recommended zone; QA suite regression check |
| Multi-tenant config leak | Club A sees Club B's prompts or behavior | Composite PK enforcement; integration tests with 2+ clubs; auth middleware validates club_id |
| Prefill breaks for unexpected member names | Special characters or empty names cause API errors | Sanitize interpolation; fallback to empty string if member context missing |
| Config versioning bloats DB | Thousands of historical configs | Retain last 10 versions per agent per club; prune older via cron |

---

## Success Metrics

| Metric | Baseline (Today) | Sprint 4 Target | Sprint 6 Target |
|--------|-------------------|-----------------|-----------------|
| QA suite avg score | 8.9 | 9.3 | 9.5+ |
| Complaint empathy consistency | ~70% | 95% (via prefill + validation) | 99% (via circuit breaker fallback) |
| Grief scenario reliability | ~60% | 90% (via validation retry) | 99% (via circuit breaker) |
| Config change → production | Code deploy (hours) | DB write (seconds) | DB write (seconds) |
| Per-club customization | 0 clubs customized | Pilot club configured | Template library for onboarding |
| Agent API calls through assembly | 0% | 100% | 100% |

---

## Relationship to Existing Systems

- **`AgentConfigDrawer.jsx`** — Expanded in Sprints 2-4; current threshold/notification controls preserved
- **`agent-autonomous.js`** — Refactored in Sprint 1 to use `assembleAgentCall()`; existing `AGENTS` map becomes `BASE_PROMPTS`
- **`sweep.js`** — Refactored in Sprint 1; hardcoded `SYSTEM_PROMPTS` replaced by assembly
- **`register-agents.js`** — Refactored in Sprint 1; model/tools loaded from config
- **`agent_configs` table** — Extended with JSONB in Sprint 1; existing columns preserved
- **Autoresearch QA loop** — Integrated as "Test this config" in Sprint 5; same scenarios, same critic
- **`agent_activity` table** — Receives validation failure logs in Sprint 5; existing schema sufficient
