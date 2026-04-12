# E2E Onboarding QA + Strategy + UX Critique — Autonomous Loop

**Goal:** Simulate a brand-new club onboarding from first login through fully configured club. Run three phases: (1) functional QA loop until clean, (2) UX design critique of the flow, (3) strategic critique from a GM buyer's perspective. All three produce actionable output.

**Loop behavior:** After all phases complete, start over and run again.

**Code discipline:** Do NOT create AI vibe-coded slop. Be very careful about code added. Follow best practices: no narration comments, no premature abstractions, no speculative error handling, no half-finished implementations. Default to deletion over addition. Fix root causes, not symptoms.

---

## PHASE 1: Functional QA Loop

### Environment setup
- **Target:** http://localhost:5173 (run `npm run dev` first, confirm server is healthy)
- **Database:** PostgreSQL local. Before each run, execute `seed/reset_test.sql` to truncate all club-specific tables (preserve system config)
- **Playwright:** Chrome, non-headless. Save a screenshot after every major step to `/home/claude/qa-screenshots/run-{N}/`

### Test persona
- New user signup with generated email `qa+{timestamp}@swoopgolf.com`
- Club name: **Sonoran Pines CC**
- Location: Phoenix, AZ
- Club type: Private equity

### Onboarding flow — execute in order
1. Create account and log in
2. Complete club setup wizard (name, location, type)
3. Import CSV seed files from `/seed/csv/` in this order: `members → households → tee_times → dining_reservations → pos_transactions`
4. Verify the onboarding agent processes each file — confirm row counts match source CSVs
5. Navigate to the dashboard and verify: member count widget, risk tier distribution, recent activity feed all populate

### Validation criteria (assert after each run)
- Zero console errors in browser
- All CSV row counts match between source files and database tables
- Dashboard widgets render with non-zero data
- No orphaned records (e.g., transactions without matching member IDs)
- API responses return 200 for all dashboard endpoints

### Loop behavior
- If all assertions pass → log `CLEAN PASS — Run {N}` and proceed to Phase 2
- If any assertion fails → log the failure, screenshot the state, identify root cause in code, fix it, purge test data, increment N, restart
- **Max 5 iterations.** If not clean by run 5, produce a summary report of remaining failures and stop (skip Phases 2 and 3)

### Cleanup between runs
- Run `seed/reset_test.sql`
- Verify all club-specific tables are empty before starting next run
- Do **not** truncate `system_config` or `agent_definitions`

---

## PHASE 2: UX Design Critique

**Trigger:** Only runs after Phase 1 achieves a clean pass.

**Method:** Using the screenshots captured during the clean pass, plus a fresh walkthrough of the live app, evaluate the onboarding flow as a product designer would. **Do not fix anything — only document.**

### First impression & cognitive load
- How many steps from signup to first meaningful data on screen?
- Are there moments where the user is staring at a blank or loading state with no guidance?
- Is it obvious what to do next at every step, or does the user have to guess?

### CSV import experience
- Is the file upload interaction clear (drag-drop, browse, both)?
- What feedback does the user get during processing? Progress bar, spinner, nothing?
- What happens on a partial failure (e.g., 3 of 5 files succeed)? Is the error message actionable?
- Does the user understand the required file order, or could they upload out of sequence and break things?

### Information hierarchy
- After import, does the dashboard surface the most important insight first (member count? risk distribution? something else)?
- Is there a clear "you're done" moment, or does setup just trail off?

### Friction log
- Document every moment of hesitation, confusion, or unnecessary clicks as a numbered list
- Rate each friction point: **cosmetic / annoying / blocking**

**Output:** `/home/claude/ux-critique.md` with annotated screenshot references, friction log, and a prioritized list of recommended changes (ranked by impact on first-run experience).

---

## PHASE 3: Strategic Critique — GM Buyer Lens

**Trigger:** Runs after Phase 2 completes (does not require Phase 2 to be positive).

**Persona:** You are a General Manager at a mid-size private club (400-600 members). You oversee a $4-6M operating budget. You're evaluating Swoop as a potential addition to your tech stack. You already have Jonas for club management and ForeTees for tee sheets. You've seen a MetricsFirst demo. Your board is asking about member retention. You have 20 minutes to decide if this is worth a pilot.

### Time to value
- How long from "I said yes to a pilot" to "I can show my board something"?
- Does the onboarding experience feel like it respects my time, or does it feel like I'm doing implementation work?
- At what point in the flow do I first see something I couldn't get from my existing systems?

### Data trust
- After CSV import, do I trust the numbers? Does anything look off, unexplained, or suspiciously perfect?
- Is it clear where Swoop's data came from (my files) vs. what Swoop calculated?
- Would I feel confident showing this dashboard to my board president right now?

### Competitive positioning
- At what moment (if any) does Swoop clearly differentiate from MetricsFirst?
- Does the onboarding experience surface cross-domain insights, or does it just look like another dashboard at first glance?
- Is the Layer 3 value proposition visible in the product, or only in the sales deck?

### Objections this flow would trigger
- List every concern a skeptical GM would raise based on what they just saw
- For each objection, note whether it's addressable with a **product fix**, a **messaging fix**, or requires a **fundamental capability change**

### Missing moments
- What would make a GM say "oh wow" during onboarding that isn't there today?
- Is there a quick win Swoop could surface in the first 5 minutes using the imported data that would lock in the pilot?

**Output:** `/home/claude/gm-strategy-critique.md` with time-to-value assessment, trust evaluation, competitive differentiation gaps, objection list with fix categories, and top 3 recommended changes to the onboarding flow ranked by impact on pilot conversion.

---

## FINAL OUTPUT

After all phases complete, produce `/home/claude/e2e-summary.md` that consolidates:

- **Phase 1:** Pass/fail status, code changes made, remaining bugs (if any)
- **Phase 2:** Top 5 UX friction points by severity
- **Phase 3:** Top 3 strategic gaps that would cost you a pilot
- **Prioritized punch list** merging all three perspectives, ordered by: **blocking → high-impact → polish**

**After each complete cycle, start over and run again.**

---

## Code quality guardrails (apply throughout Phase 1 fixes)

- No vibe-coded slop. No speculative helpers, no "just in case" error handling, no narration comments.
- Fix the root cause. If a test fails because seed data is wrong, fix the seed — don't patch the app to tolerate bad data.
- Prefer editing existing files to creating new ones.
- Delete over add. Three similar lines beats a premature abstraction.
- Run `/simplify` equivalent mental pass on every fix before committing: reuse, quality, efficiency.
- No production deploys. Dev only.

---

## Data integrity — zero tolerance rule (2026-04-12)

**Rule:** Every single number displayed on any screen in the product — every stat, count, percentage, dollar amount, tenure figure, health score, or retention metric — MUST match exactly a value in the imported CSV files or be a deterministic calculation derived from those files. There are zero exceptions. There are no "placeholder for now" values. There are no static fallbacks that leak through when an API field is missing. There is no "reasonable default until the backend lands."

If the data can't be computed from the imported files, the UI hides the stat. Full stop.

This applies to every page, every widget, every tier: Today, Members, Board Report, Admin, Revenue, Insights, Service, Actions, AI Agents. The check: take any number visible to a real authenticated GM. Can you trace it, in one click, back to a row in a CSV they uploaded? If not, it's a leak.

**Known leaks and their fixes:**

1. **Members page — `Avg Tenure`, `Avg Annual Dues`, `Renewal Rate`**
   - Before: `src/data/members.js:33-35` hardcoded `6.2, 16400, 0.91`. Surfaced on every real club because `/api/members` didn't compute them.
   - After: `api/members.js` computes `avgTenure` and `avgDues` from `members.join_date` and `members.annual_dues` on the fly; `renewalRate` derived from `date_resigned` count when available, else 0. The UI's `value > 0` guard hides the stat card when there's no real value.

2. **Board Report — `Service Quality Score 87%`, `Staff Utilization 87%`, `Monthly Revenue $375,200`, `Avg Resolution 4.2 hrs`, `Swoop ROI 4.2x`**
   - Before: `src/data/boardReport.js` kpis array spread into `boardReportService.getKPIs()` for any live club whose membership-saved count was > 0.
   - After: `getKPIs()` in `src/services/boardReportService.js` only returns `staticKpis` for guided/demo mode. Live mode derives 4 KPIs from `getMemberSummary()` (Members Retained, Dues at Risk, Retention Rate, At Risk). Zero-data clubs see an honest `EMPTY_KPIS` block with "Awaiting data" descriptions.

3. **Briefing service — `teeSheet.utilization 0.87`, `DEMO_BRIEFING` fallbacks**
   - Known leak, not yet fixed this session. `src/services/briefingService.js:235` does `summary.totalRounds || DEMO_BRIEFING.teeSheet.roundsToday` and hardcodes `utilization: 0.87`. Tracked as follow-up — the briefing module has many interleaved static references that need a systematic pass, not a one-line patch.

**Verification pattern:** `tests/e2e/b-lite-journey.spec.js` step 4b asserts that none of the old leaked values (`6.2 years`, `$16,400`, `91%`) appear in the rendered body after a real Members CSV import. Extend this assertion as more leaks are plugged.

---

## Staged data-loading plan with save points

**Goal:** perfect each CSV data type in isolation — Members, then Tee Sheet, then Dining — and land every insight the UI shows. After each stage is green, snapshot the tenant state so the next stage's iterations don't require re-running the previous ones from scratch.

### Save-point tool

`scripts/db-savepoint.mjs` — tenant-scoped snapshots of all tables carrying a given `club_id`, stored as `snap__<name>__<table>` tables in Neon.

```
node scripts/db-savepoint.mjs create <name> <clubId>    # snapshot tenant rows
node scripts/db-savepoint.mjs restore <name> <clubId>   # wipe + restore
node scripts/db-savepoint.mjs list                      # show save points
node scripts/db-savepoint.mjs drop <name>               # delete
```

Restore is seconds; creation is ~2 seconds. This is how we avoid re-running signup + Members import every time a Tee Sheet or Dining fix breaks state.

### Stage 1 — Members (✅ green on 2026-04-12)

**Import:** `docs/jonas-exports/JCM_Members_F9.csv` via `/api/import-csv?importType=members`.
**Verify:**
- Member count in `members` table matches CSV row count exactly.
- Members page stat cards render real values: `avgTenure` derived from `join_date`, `avgDues` from `annual_dues`, `renewalRate` from `date_resigned`. Zero-fallback assertion in `b-lite-journey.spec.js` step 4b.
- Every member name, household, dues, join date, and status on the Members page traces to a CSV row.
- Member drawer opens, renders Contact + Archetype sections regardless of engagement data. HealthDimensionGrid renders only when real engagement scores exist (expected empty for Members-only state).

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create members-seeded <clubId>
```

### Stage 2 — Tee Sheet (in progress)

**Preconditions:** restore `members-seeded` save point first. Tee-sheet bookings reference members by ID; without members, every row fails FK.

**Import:** `docs/jonas-exports/TTM_Tee_Sheet_SV.csv` via `/api/import-csv?importType=tee_times`.

**Verify:**
- Booking count in `bookings` table matches CSV row count.
- Every booking's `member_id` resolves to a member imported in Stage 1 (no orphans).
- Booking dates, times, course, player count, status match CSV values byte-for-byte.
- Tee Sheet page shows real bookings — no leaked demo data.
- Today view's "rounds played this week / month" counters match a SQL `SELECT COUNT(*) FROM bookings WHERE booking_date BETWEEN ...`.
- Member drawer now shows golf engagement score for members with bookings (HealthDimensionGrid partial render).
- Zero leaked tee-sheet values: grep the page for hardcoded `312`, `0.87 utilization`, `DEMO_BRIEFING.teeSheet` strings.

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create members-and-tee-sheet <clubId>
```

### Stage 2.5 — Onboarding AI agent (✅ green on 2026-04-12)

**Import path:** `POST /api/onboarding-agent/chat` with `{message, club_id, file_data}`. The agent analyzes the file and uses its tool pipeline (`analyze_file_structure`, `detect_data_type`, `detect_vendor`, `propose_column_mapping`, `get_schema_info`, `preview_import`, `execute_import`) to orchestrate the same imports a human would do through the wizard.

**Verify:**
- `/api/onboarding-agent/chat` returns 200 with a real Claude response (not simulation).
- Response calls at least 4 tools — if it's text-only, the tool pipeline is broken.
- Response recognises members data when given a members CSV (name, email, join_date columns).
- Later (when we extend): driving the agent through a multi-turn "upload → confirm → verify" flow should land rows in the DB via `execute_import`.

**Follow-up:** current b-lite step 8 only exercises the analysis phase. Extend to fully drive the import via agent tool calls (not just UI wizard).

### Stage 3 — Dining (F&B transactions)

**Preconditions:** restore `members-and-tee-sheet` save point (or re-run prior stages). Dining data only makes sense with members + tee sheet loaded because the most interesting signal is "members who played but didn't dine afterward."

**Import:** `tests/fixtures/small/POS_Sales_Detail_SV.csv` (686 rows linked to the Stage-1 members) via `/api/import-csv?importType=transactions`. Full-size `docs/jonas-exports/POS_Sales_Detail_SV.csv` (1,916 rows) for the occasional sanity run.

**Column mapping** (from `src/config/jonasMapping.js` `transactions`): `transaction_date`, `total_amount`, `member_id`, `outlet_name`, `category`, `item_count`, `tax`, `gratuity`, `comp`, `discount`, `void`, `settlement_method`, `open_time`, `close_time`, `is_post_round`. Auto-maps from Jonas aliases like `Chk#`, `Sales Area`, `Member #`, `Net Amount`, `Open Time`, `Close Time`, etc.

**Verify (in order):**

1. **Row count integrity.** Client-side preview reports N rows from CSV. After import, `SELECT COUNT(*) FROM transactions WHERE club_id = $1` equals N (minus any rejected rows — expect zero rejects because our small fixture is pre-validated).

2. **Join to members.** Every transaction's `member_id` resolves to a Stage-1 member row. No orphans: `SELECT COUNT(*) FROM transactions t LEFT JOIN members m ON m.external_id = REPLACE(t.member_id, $clubId || '_', '') WHERE m.member_id IS NULL AND t.club_id = $1` equals 0.

3. **Revenue totals are honest.** The Revenue page and Board Report "Monthly Revenue" KPI must match `SELECT SUM(total_amount) FROM transactions WHERE club_id = $1 AND transaction_date BETWEEN ...`. No `$375,200` hardcoded fallback. No `briefingService.DEMO_BRIEFING.keyMetrics.monthlyRevenue` leak.

4. **Today view's F&B signals populate.** With transactions imported, `TodayView` should now render:
   - A dining engagement hint under the member alerts section if members have post-round dining activity.
   - Revenue-adjacent numbers derived from today's and yesterday's real transactions.
   - Nothing hardcoded from `briefingService.js:117` (DEMO_BRIEFING.keyMetrics). Assert no `$375,200`, no `87%` revenue-vs-plan banners.

5. **Member drawer dining dimension.** `MemberProfileDrawer.HealthDimensionGrid` should now render the Dining Frequency tile with a real score for any member with F&B rows. For members without F&B, the tile stays "Not connected" — honest empty state.

6. **Cross-domain reveal.** After members + tee-sheet + dining are all loaded, the product should be able to surface: "N members played golf this month but didn't eat in the clubhouse." A real differentiator vs dashboards that can't join domains. Add a `b-lite-journey.spec.js` step that navigates to wherever this surfaces (likely Today view or a new cross-domain card) and verifies the number matches a SQL `SELECT COUNT(*) FROM (bookings b LEFT JOIN transactions t ON ... WHERE t.id IS NULL) ...` equivalent.

7. **Zero leaked dining values.** Regex-assert that none of these appear in the rendered body for the real club:
   - `$375,200` / `$375.2K` / `$375200` (all the forms of the DEMO_BRIEFING revenue number)
   - `87%` near the word "utilization" or "margin"
   - `$16,400` average spend (carryover sanity check from Stage 1's assertion)

**Known leaks to hunt** (from Agent C's earlier audit):
- `src/data/boardReport.js:9` — `Monthly Revenue: 375200` hardcoded KPI. Covered by the `getKPIs()` routing fix from Stage 1, but verify the path holds for live clubs with transactions imported.
- `src/services/briefingService.js:117` — `DEMO_BRIEFING.keyMetrics.monthlyRevenue: 375200`. Stage 1 patched `teeSheet.utilization`; this commit should patch `keyMetrics.monthlyRevenue` too: return null / honest computation for authenticated clubs.

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create members-tee-dining <clubId>
```

### Stage 3.5 — AI Agent deep test (GM-as-user)

**Preconditions:** `stage-dining` save point green (members + tee sheet + dining all loaded). Restore it before running this stage so there's no variation in the data the agents see.

**What this stage verifies:** the six orchestration agents (`Member Pulse`, `Demand Optimizer`, `Service Recovery`, `Revenue Analyst`, `Engagement Autopilot`, `Labor Optimizer`) — and their trigger endpoints — can actually:

1. Produce specific, actionable recommendations from the imported data.
2. Show up as pending actions in the UI (Today view, Inbox, Member drawer).
3. Explain WHY each recommendation was made, referencing a real member row, booking row, transaction row, or complaint row.
4. Accept approval / dismissal and persist the outcome.
5. Hand off to other agents where the platform claims orchestration happens (e.g., Service Recovery resolving a complaint feeds Member Pulse's risk score).
6. Be used by a GM through either direct UI interaction OR the Chief of Staff / concierge chat.

**Persona for the test:** a real club GM who just completed onboarding and now opens the app expecting agents to tell them what matters today. No prior knowledge of the internal agent names or triggers. If a GM can't get value in 5 minutes, the agents fail this stage.

**Test shape:** a new spec — `tests/e2e/b-lite-agents.spec.js` — that:

- Restores the `stage-dining` save point and injects the saved session (same pattern as `b-lite-journey.spec.js` with `STAGE=dining`).
- For each trigger endpoint in `api/agents/*-trigger.js`, POSTs a valid payload and verifies:
  - 200 response (or a documented `triggered: false` with a real reason)
  - A new row in `agent_actions` with `status = 'pending'`
  - The `member_id` / `booking_id` / `transaction_id` in the action references a row that was actually imported in stages 1–3 (no orphans, no demo leaks)
- Walks the UI as a GM: navigates to Today, Members, Actions, Concierge Chat (if present). For each visible recommendation, captures:
  - The headline the GM sees
  - The "why" (evidence the agent cites)
  - The suggested action + owner
  - Any numeric claim the agent makes (must match a SQL aggregate over imported data)
- Approves at least one pending action through the UI. Verifies the action moves to `approved`, the agent's action count updates, and the underlying member/booking/transaction is flagged appropriately.
- Tries the concierge chat with GM-realistic questions: "What should I worry about today?", "Which members are at risk?", "Where are we losing revenue?". Logs the concierge's responses. Assesses whether they reference real imported rows or fall back to generic / DEMO strings.
- Fires triggers in combination (e.g., complaint-trigger THEN risk-trigger on the same member) and verifies Member Pulse's score response shifts to reflect the Service Recovery outcome — genuine cross-agent orchestration.

**Findings capture:** every run writes to `C:\Users\tyhay\qa-outputs\agent-deep-test-<date>.md`. Each finding gets: agent name, endpoint, expected GM value, actual behavior, severity (blocking / weakens product / cosmetic), and the one-line fix class (agent prompt / trigger eligibility / UI surface / data join).

**Iteration loop:** after the first run produces the findings file, the dev agent (me) reads it end-to-end, fixes every blocking and "weakens product" finding, and re-runs the spec against the same save point until it produces a clean pass. Cosmetic findings may be deferred. The criterion for moving to Stage 4 is: a GM running through the clean pass would say "yes, this is useful" for each of the 6 agents.

### Stage 4 — Complaints (Service quality)

**Preconditions:** restore `members-tee-dining` save point.

**Import:** `tests/fixtures/small/JCM_Communications_RG.csv` (8 rows for the small set — complaints are rare even in the full 33-row file). Via `/api/import-csv?importType=complaints`.

**Column mapping** (from `jonasMapping.js` `complaints`): `category`, `description`, `member_id`, `status`, `priority`, `reported_at`, `resolved_at`. Auto-maps from Jonas aliases like `Type`, `Subject`, `Member #`, `Complete`, `Happometer Score`, `Date`, `Resolution Date`.

**Verify:**
- Complaint count matches CSV. No rejected rows.
- Every complaint's `member_id` resolves to a Stage-1 member.
- Service page `ComplaintsTab` renders the real rows with correct status (open/resolved), category, and member names.
- Today view's `TodaysRisks` section now shows open complaints tied to real members. No hardcoded `4 open complaints` from DEMO_BRIEFING.
- Board Report `Service Quality Score` is either computed from complaints resolution rate OR shows "Awaiting data" — not the hardcoded 87%.
- Member drawer for a complaint-linked member shows the complaint in the member's timeline.

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create members-tee-dining-complaints <clubId>
```

### Stage 5 — Agent orchestration (trigger agents against loaded data)

**Preconditions:** restore `members-tee-dining-complaints`. By now the tenant has members with real golf + dining + complaint data — enough context for every agent to actually produce recommendations.

**What this stage verifies:** the 6 registered agents (`Member Pulse`, `Demand Optimizer`, `Service Recovery`, `Revenue Analyst`, `Engagement Autopilot`, `Labor Optimizer`) can be triggered and will each write at least one row into `agent_actions` with status `pending`, referencing real imported members.

**Trigger endpoints** (from `api/agents/*-trigger.js`):
- `POST /api/agents/risk-trigger` with `{memberId}` — Member Pulse fires on at-risk member
- `POST /api/agents/fb-trigger` — F&B trigger based on post-round dining gaps
- `POST /api/agents/complaint-trigger` — Service Recovery for unresolved complaints
- `POST /api/agents/cos-trigger` — Chief of Staff / Revenue Analyst orchestration
- `POST /api/agents/gameplan-trigger` — daily gameplan
- `POST /api/agents/staffing-trigger` — Labor Optimizer
- `POST /api/agents/arrival-trigger` — member arrival

**Verify:**
1. For each trigger endpoint, POST with real club session + a real member id. Expect 200 + `{triggered: true, ...}` OR a documented "not triggered" reason (e.g., "member not at risk — criteria not met").
2. After firing all triggers, `SELECT COUNT(*) FROM agent_actions WHERE club_id = $1 AND status = 'pending'` should be > 0.
3. `/api/agents` should now return those pending actions in its `actions` array.
4. `MemberAlerts` on the Today view should render at least one agent-surfaced recommendation with a real member's name, a real "because..." explanation, and an approve button.
5. Approving a pending action should move it to `status = 'approved'` and update the agent's action count.

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create full-staged-cycle <clubId>
```

### Stage 6+ — Everything else

After dining + complaints + agents, the remaining data types follow the same pattern: staff, shifts, events, email campaigns. Each new stage restores the latest green save point and adds its data on top. Each new stage adds its own zero-fallback assertion to `b-lite-journey.spec.js`.

### Final verification

One full forward pass: restore `full-roster-seeded` → walk the entire app (Today, Members, Tee Sheet, Service, Revenue, Board Report, Actions, Admin) → verify every single number visible to a GM traces to a CSV row or a deterministic calculation from CSV rows. This is the acceptance test for the whole plan.

### Iteration discipline

- **Never edit a .jsx or api file while a Playwright run is in flight.** Vite HMR will reload the page mid-test and your screenshots will show a blank canvas. Queue edits for after the run completes.
- **Always `reset-test-clubs` before a run**, not during. Each run creates a new timestamped club to avoid inter-run pollution.
- **Commit after each stage green.** Don't let stages bleed into each other in a single commit — makes rollback painful.

### QA click-tester — runs after every stage

A persistent "QA click tester" role exists alongside the staged import tests. Its entire purpose is to click through the whole app with real imported data and document every break, every visual oddity, every stale label, every 401 it captures, every piece of data that doesn't trace to the imported CSV.

**When it runs:** after each core phase (Members, Tee Sheet, Onboarding Agent, Dining, Complaints, Staff/Shifts) is applied and the staged test is green. Before moving to the next phase.

**What it does:** loads a club that's restored from the latest save point, then walks every nav item: Today → Members → Tee Sheet → Service → Revenue → Automations → Board Report → Admin → Actions. In each view, it expands every tab, opens every drawer, clicks every actionable card. It captures a screenshot and a console/network trace for each view. It logs anything that:

- Shows "Loading..." that never resolves within 20s
- Shows a blank panel where content should render
- Throws a console error (`pageerror` or `console.error`)
- Returns a 4xx/5xx from any `/api/*` call
- Renders a number that doesn't match imported CSV rows or a deterministic calculation from them
- Shows stale labels from a previous tenant (e.g. "Oakmont Hills" in a Sonoran Pines club)
- Shows demo-only strings ("DEMO" pill, "Demo Environment") in live mode
- Renders a placeholder that looks like real data

Output lives in `C:\Users\tyhay\qa-outputs\click-tester-<phase>-<date>.md` — a punch list with:
1. One section per broken view
2. Screenshot path
3. Console errors captured
4. API failures captured
5. Severity: blocking / high / cosmetic
6. A one-line reproduction: "Open X, click Y, observe Z"

**Handoff to dev:** after the click-tester's run, it's my job (the dev agent) to:
1. Read the punch list end-to-end.
2. Prioritise blocking → high → cosmetic.
3. Fix every blocking and high bug. Cosmetic bugs can be deferred if they don't affect data integrity.
4. Re-run the click-tester against the same save point to verify every fix.
5. Only after the click-tester produces a clean pass on that phase's save point, unblock the next phase.

**Implementation:** `tests/e2e/qa-click-tester.spec.js` — a Playwright spec that takes the phase name via env var (`PHASE=members`, `PHASE=tee-sheet`, etc.), restores the matching save point, walks the app, and writes its findings to the output markdown file. It uses soft assertions + `afterEach` hooks to accumulate findings without stopping on the first break.

