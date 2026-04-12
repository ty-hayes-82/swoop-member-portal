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

### Stage 3 — Dining (F&B transactions)

**Preconditions:** restore `members-and-tee-sheet` save point.

**Import:** `docs/jonas-exports/POS_Sales_Detail_SV.csv` via `/api/import-csv?importType=transactions`.

**Verify:**
- Transaction count in `transactions` table matches CSV row count.
- Every transaction's `member_id` resolves to a Stage-1 member (no orphans, no "unknown member" rows).
- Revenue totals (daily, weekly, monthly) match SQL aggregates over the imported rows.
- Today view's "F&B revenue" and "dining engagement" signals populate with honest values derived from the real transactions — not the hardcoded `$375,200`/`$112K` from `src/data/boardReport.js` or `briefingService.js`.
- Member drawer now shows dining engagement score for members with post-round F&B activity.
- Cross-domain reveal: members with tee times but no post-round dining should flag correctly.
- Zero leaked dining values.

**Snapshot when green:**
```
node scripts/db-savepoint.mjs create full-roster-seeded <clubId>
```

### Stage 4+ — Everything else

After dining, the same staged pattern applies to complaints, staff, shifts, events, email campaigns. Each new stage restores the latest green save point and adds its data on top. Each new stage adds its own zero-fallback assertion to `b-lite-journey.spec.js`.

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

