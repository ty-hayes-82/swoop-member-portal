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

