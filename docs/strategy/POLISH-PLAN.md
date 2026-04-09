# North Star Polish Plan — Path to 10/10 Everywhere

> **Date:** April 9, 2026
> **Reference:** [NORTH-STAR.md](./NORTH-STAR.md), [NORTH-STAR-AUDIT.md](./NORTH-STAR-AUDIT.md)
> **Goal:** Polish every pillar-aligned feature to perfection. **Nothing is removed** — only enhanced, deepened, and connected.

---

## Guiding Principles

1. **Additive only.** Every change is a layer on top of existing work. No deletions, no rewrites. If a feature already serves a pillar, the polish makes it serve that pillar more perfectly.
2. **Dollar-quantify everything.** If a feature has dollar data in its service layer, the dollar must reach the screen. "Implicit" dues numbers become explicit "at risk" labels.
3. **Source badge everything.** Every data point, everywhere, traces to its source system. Trust by transparency.
4. **One-tap action everywhere it makes sense.** If a feature surfaces a problem, it should also surface the action.
5. **Cross-pillar bridges.** When a See It feature reveals a problem, it should link to the Fix It feature that addresses it, which should link to the Prove It feature that quantifies it. The pillars become a navigation pattern.
6. **Storyboard alignment first.** Polish that brings a feature closer to its storyboard moment ranks above polish that doesn't.

---

## Phase Sequencing

Five phases, ordered by impact-per-line-of-code. Each phase is independently shippable. No phase depends on a later phase.

| Phase | Pillar Focus | Effort | Score Impact |
|---|---|---|---|
| **A** — Dollar Quantification Sweep | PROVE IT | Small | +1 to ~6 features |
| **B** — Source Badge Completion | SEE IT | Small | +1 to ~5 features |
| **C** — Inline Action Bridges | FIX IT | Medium | +2 to Revenue, Members |
| **D** — Cross-Pillar Navigation | All 3 | Medium | Knits the app together |
| **E** — Per-Page Deepening | All 3 | Medium-Large | Pushes top features 9→10 |

Total estimated lines of code: **~600 net additions**, zero deletions.

---

## Phase A — Dollar Quantification Sweep

**The principle:** Every feature with dollar data in its service layer must surface that dollar to the screen. The audit found 6 places where dollar values exist but aren't shown.

### A1. Morning Briefing Sentence — add staffing dollar impact
**File:** `src/features/today/MorningBriefingSentence.jsx`
**Change:** Append the dollar exposure to the staffing segment.

Current:
> "Staffing gap: 2 short for projected post-round dining demand."

After:
> "Staffing gap: 2 short — $5,760/mo at risk."

**Implementation:** Compute `getLeakageData().STAFFING_LOSS` inside the staffing segment builder, append `' — $X,XXX/mo at risk'`. Gate on data availability.

**Score impact:** Today View 9 → 10. The single most impactful one-line change in the entire plan.

### A2. Tee Sheet table — show dues-at-risk per row
**File:** `src/features/tee-sheet/TeeSheetView.jsx`
**Change:** New column or inline badge showing dues annual for at-risk members.

For each row where `healthScore < 50` AND `duesAnnual > 0`:
- Add a small red badge under or next to the AT RISK flag: `$32K at risk`
- For VIP rows: add a green badge `$45K VIP`

**Implementation:** New `<DuesBadge>` component or inline span. Format with `$XK` for compactness.

**Score impact:** Tee Sheet 8 → 9 (Prove It dimension +2).

### A3. Member Alerts (Today View) — surface dues per alert
**File:** `src/features/today/MemberAlerts.jsx`
**Change:** Each priority member alert shows annual dues with severity coloring.

For at-risk members: red `$XK/yr at risk` chip next to archetype badge
For VIP/healthy escalations: amber `$XK/yr` chip

**Implementation:** Pull `m.duesAnnual` (already in data), render as compact chip in the existing badge row.

**Score impact:** Member Alerts 9 → 10 in Prove It dimension.

### A4. Member Profile Drawer header — add "dues at risk" callout
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`
**Change:** When `healthScore < 50` AND `duesAnnual > 0`, add a prominent dollar callout near the health score.

```
Health: 28 ⚠️
$32,000/yr in dues at risk
```

**Implementation:** New conditional banner inside the identity section. Reuse the warning chip styling from the decay sequence card.

**Score impact:** Member Profile Drawer 10 → 10 (already perfect, but deepens Prove It).

### A5. Members View — at-risk tab KPI strip
**File:** `src/features/members/MembersView.jsx` and `HealthOverview` tab
**Change:** Above the priority member list, add a 3-stat KPI strip:
- "Members at risk" — count
- "Dues at risk" — sum of duesAnnual for at-risk members
- "Saves this month" — count from boardReportService.getMemberSaves()

**Implementation:** Compute totals in HealthOverview, render with the same KPI card style used in Board Report tabs.

**Score impact:** Members View 9 → 10 (closes the Prove It gap noted in audit).

### A6. Automations Inbox — dollar impact per action
**File:** `src/features/automations/InboxTab.jsx`
**Change:** Each action card shows its `impactMetric` field as a prominent dollar/number callout.

Many actions in `agentService` already have `impactMetric` like "$32K dues protected" or "+$850/mo recovery." Surface it.

**Implementation:** Add a styled `impactMetric` chip to the action card. Color-code by magnitude.

**Score impact:** Automations Hub 8 → 9.

---

## Phase B — Source Badge Completion

**The principle:** Every data point in the app should answer "how do you know this?" without the user asking.

### B1. Board Report KPI cards — source badges
**File:** `src/features/board-report/BoardReport.jsx` (KPIStrip component, lines ~46-77)
**Change:** Each of the 4 KPI cards gets a small source badge below the value.

- Members Retained → `Member CRM + Analytics`
- Dues Protected → `Member CRM + POS`
- Service Consistency → `Complaints + Scheduling`
- Response Time → `All Systems`

**Implementation:** Add a `source` field to each KPI object in `boardReportService.getKPIs()`, render via `SourceBadge` size="xs" inside KPIStrip.

**Score impact:** Board Report 9 → 10.

### B2. Automations Inbox items — agent + signal source
**File:** `src/features/automations/InboxTab.jsx`
**Change:** Each inbox card shows BOTH the agent name (e.g., "Member Pulse") AND the underlying signal sources (e.g., "Email · POS · Tee Sheet").

**Implementation:** Render `<SourceBadgeRow>` with the action's `signals` array (already exists in agent data).

**Score impact:** Automations Hub 8 → 9 (See It dimension +2).

### B3. Member Profile Drawer — section-level source badges
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`
**Change:** Each major section (Risk Signals, Recent Activity, Outreach History) gets a source badge row in its header.

- Risk Signals → `Analytics + All Sources`
- Recent Activity → `Tee Sheet + POS + Email + Events`
- Outreach History → `Swoop App`

**Implementation:** Add an optional `sourceSystems` prop to the existing `Section` component, render as compact badge row.

**Score impact:** Member Profile Drawer 10 → 10 (consistency win).

### B4. Pending Actions Inline (Today) — agent source
**File:** `src/features/today/PendingActionsInline.jsx`
**Change:** The action source (agent name) is currently hidden in expanded state. Surface it inline as a `SourceBadge` on every action row.

**Implementation:** Pull `action.source` (already exists), render inline. Optionally add a tooltip explaining what data the agent looks at.

**Score impact:** Pending Actions stays at 9 but improves trust signal.

### B5. Tee Sheet table — column source badges in header
**File:** `src/features/tee-sheet/TeeSheetView.jsx`
**Change:** Add tiny source badges in the column headers.

- Time / Course → `Tee Sheet`
- Health → `Analytics`
- Cancel Risk → `Analytics`
- Group → `Tee Sheet`

**Implementation:** Wrap `<th>` content with badge. Keep visual weight low.

**Score impact:** Tee Sheet 8 → 9.

---

## Phase C — Inline Action Bridges

**The principle:** Where the app reveals a problem, it should also surface the action. Don't make the GM navigate to act.

### C1. Revenue Page Hole 12 card — "Deploy Ranger" action
**File:** `src/features/revenue/RevenuePage.jsx`
**Change:** Add an inline "Approve: Deploy ranger to Hole X on weekends" button on the bottleneck card. One-tap, routes to action queue execution.

**Implementation:**
```jsx
<button
  onClick={() => approveAction({
    type: 'DEPLOY_RANGER',
    target: `Hole ${bottleneck.hole}`,
    days: 'weekends',
    estimatedRecovery: scenarioRecovery,
  })}
  className="..."
>
  Approve: Deploy Ranger to Hole {bottleneck.hole} →
</button>
```

This requires extending `agentService.approveAction()` to accept ad-hoc action objects (currently it expects an inbox item ID). Add an `approveAdHocAction()` helper.

**Score impact:** Revenue Page already 10/10, but this closes the Fix It depth gap noted in audit. Storyboard moment.

### C2. First Domino decay chain — "Approve outreach" inline
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`
**Change:** At the end of the decay chain visualization, add a one-tap approval button for the recommended outreach.

```
[ Email dropped → Golf dropped → Dining dropped ]

Recommended: GM personal call · complimentary round with guest
[ Approve & Mark for follow-up ]
```

**Implementation:** Pull the top recommendation from the member's risk signals or outreach service. Render as a brand-colored button below the decay chain.

**Score impact:** Member Profile Drawer 10 → 10 (Fix It depth).

### C3. Service → Staffing → Pace card — "Add to Action Queue"
**File:** `src/features/service/tabs/StaffingTab.jsx`
**Change:** The Pace-to-Revenue card has a "Full breakdown →" button. Add a second one: "Approve: Deploy ranger to bottleneck holes."

**Implementation:** Same `approveAdHocAction()` helper as C1. Reuses the bottleneck data.

**Score impact:** StaffingTab strengthens Fix It without losing its Prove It role.

### C4. Members → At-Risk → bulk action
**File:** `src/features/members/tabs/HealthOverview` (or wherever the at-risk list lives)
**Change:** Above the priority list, add a "Approve all recommended outreach" bulk action button. Shows count and dollar impact.

**Implementation:** Iterate at-risk members, call existing per-member action approval. Show a confirmation modal with the dollar total.

**Score impact:** Members View Fix It dimension boost.

### C5. Tee Sheet alert cards — "View Member Profile" inline link
**File:** `src/features/tee-sheet/TeeSheetView.jsx`
**Change:** The at-risk alert cards already have action buttons. Add a "View Profile" link that opens the drawer.

**Implementation:** Use existing `MemberLink` with `mode="drawer"`. Already trivial.

**Score impact:** Already covered by clickable names — make it more discoverable as a primary action.

---

## Phase D — Cross-Pillar Navigation Bridges

**The principle:** Pillars reinforce each other. See It → Fix It → Prove It should be a navigation pattern, not three separate experiences.

### D1. Today → Revenue link from staffing gap
**File:** `src/features/today/MorningBriefingSentence.jsx` (after Phase A1)
**Change:** When the briefing sentence mentions a staffing gap with dollar value, the dollar text becomes a clickable link to Revenue page → Staffing section.

**Implementation:** Make the `'$X,XXX/mo at risk'` segment a `<button>` calling `navigate('revenue')`.

### D2. Revenue → Board Report breadcrumb
**File:** `src/features/revenue/RevenuePage.jsx`
**Change:** Already has "Generate Board Report" CTA. Strengthen it with a breadcrumb-style "Revenue → Board Report → Member Saves" preview, showing what the next page will contain.

**Implementation:** Mini-card preview above the CTA showing the 4 board tabs and the dollar/count for each.

### D3. Member Profile Drawer → Board Report deep link
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`
**Change:** When viewing a member that appears in the current month's `memberSaves`, show a small "Featured in Board Report" badge with a deep link to `board-report` tab 1.

**Implementation:** Cross-reference `getMemberSaves()` against current `memberId`. Render badge if match.

### D4. Tee Sheet at-risk → Member Profile drawer (already exists, make primary)
**File:** `src/features/tee-sheet/TeeSheetView.jsx`
**Change:** The at-risk alert cards should treat "View Member Profile" as the primary action (it's currently a secondary outcome of clicking the name).

**Implementation:** Add an explicit `[ View Decay Sequence → ]` button next to the recovery actions on each alert card.

### D5. Service → Quality → Revenue link
**File:** `src/features/service/tabs/QualityTab.jsx`
**Change:** The consistency score card should link to Revenue page when the user wants to see the dollar impact of inconsistency.

**Implementation:** Wrap the consistency score in a clickable element. Tooltip: "See dollar impact of service inconsistency →"

---

## Phase E — Per-Page Deepening

Page-specific polish that doesn't fit into phases A–D. Each item targets a specific score gap from the audit.

### E1. Board Report — print stylesheet for 4-tab PDF
**File:** `src/features/board-report/BoardReport.jsx` (and possibly a new CSS file)
**Change:** Add a `@media print` block that:
1. Renders all 4 tabs simultaneously (overrides `display: none` on hidden tabs)
2. Forces light color palette
3. Adds page breaks between tabs
4. Shows the source badges prominently

**Implementation:** Either inline `<style>` block in the component or extend `index.css`. Use Tailwind's `print:` modifiers where possible.

**Score impact:** Board Report 9 → 10. Closes the storyboard's "6 hours → 1 click" promise.

### E2. Today View — "Trust Math" expandable section
**File:** `src/features/today/MorningBriefingSentence.jsx`
**Change:** Add a small "How is this computed?" expandable below the briefing sentence. Shows the formula:

```
Today's Briefing computed at 6:00 AM from:
• 220 rounds — Tee Sheet (Jonas) · synced 5 min ago
• 82°F clear — Weather API · live
• 3 at-risk on sheet — cross-reference of Tee Sheet × Member Health Score
• 2 servers short — Scheduling vs projected demand from rounds × weather × historical conversion
```

**Implementation:** New collapsible section using existing `CollapsibleSection` component.

**Score impact:** Today View polish. Builds trust through transparency.

### E3. Member Profile Page (full) — mirror drawer enhancements
**File:** `src/features/member-profile/MemberProfilePage.jsx`
**Change:** The full-page version is at 6/10 because it lacks the First Domino visualization. Mirror the drawer's enhanced decay chain into the full page, plus the "$ at risk" header banner.

**Implementation:** Extract the decay chain visualization into a shared `MemberDecayChain.jsx` component used by both drawer and page.

**Score impact:** Member Profile Page 6 → 9.

### E4. Revenue Page — historical trend overlay
**File:** `src/features/revenue/RevenuePage.jsx`
**Change:** Above the decomposition chart, add a small sparkline showing how leakage has trended over the past 6 months. Visualizes whether Swoop is helping or things are getting worse.

**Implementation:** New small `Sparkline` (already exists) using historical revenue data from `trendsService`. If no historical data, show today's value with a "First month tracking" label.

**Score impact:** Revenue Page polish. Adds the "improvement over time" proof point.

### E5. Board Report → What We Learned → "Next Month Priorities" section
**File:** `src/features/board-report/BoardReport.jsx`
**Change:** Add a "Recommended Focus for Next Month" subsection to the What We Learned tab. Auto-derived from:
- Top emerging risks (from health distribution deltas)
- Highest-leverage interventions (from memberSaves)
- Pending dollar opportunities (from revenue scenarios)

**Implementation:** Compute in the existing tab. Render as 3 prioritized items with action owners and estimated dollar impact.

**Score impact:** Board Report deepening. Makes the report self-prescribing instead of just retrospective.

### E6. Automations Hub → Inbox → impact rollup at top
**File:** `src/features/automations/InboxTab.jsx`
**Change:** Above the inbox list, show a 3-stat strip:
- "Pending" — count
- "Total dollar impact if all approved" — sum of impactMetric dollars
- "Highest impact action" — top single action with its dollar value

**Implementation:** Compute totals from inbox items. Use existing KPI card pattern.

**Score impact:** Automations Hub 8 → 9.

### E7. Service View → Quality Tab → Add EvidenceStrip
**File:** `src/features/service/tabs/QualityTab.jsx`
**Change:** Add an evidence strip showing the cross-domain sources at the top of the tab.

**Implementation:** One-line addition. The strip already exists at the parent ServiceView level — adding tab-level strips reinforces it.

**Score impact:** Quality Tab 8 → 9.

### E8. Members → All Members → search-by-symptom
**File:** `src/features/members/tabs/AllMembersView.jsx`
**Change:** Add filter chips for cross-domain symptoms beyond archetype: "Email decay", "Dining drop", "Golf drop", "Multi-domain decay". Each shows a count.

**Implementation:** Cross-reference member data against decay chain logic from guidedScoring. Filter chips with counts.

**Score impact:** All Members 7 → 8 (cross-domain depth).

### E9. Integrations Page → "What this unlocks ($)"
**File:** `src/features/integrations/IntegrationsPage.jsx`
**Change:** Each connected vendor card shows what dollar value it unlocks. Each available (not connected) vendor shows what dollar value would be unlocked by connecting it.

```
✅ Jonas Tee Sheet — Connected
   Powers: $5,760/mo pace-to-dining attribution

🔌 Northstar POS — Available
   Would unlock: $9,580/mo F&B leakage decomposition
```

**Implementation:** Add a `unlocks` field to each integration definition. Cross-reference `revenueService` to compute dollar values dynamically when possible.

**Score impact:** Integrations 5 → 8. Turns infrastructure into a Prove It feature.

### E10. Admin → Data Health → "What's blocking insights?"
**File:** `src/features/admin/DataHealthDashboard.jsx`
**Change:** When data is missing or stale, show what features/dollar values are blocked.

```
⚠️ POS data is 6 hours stale
   Blocks: Today's F&B briefing, Revenue leakage refresh
   Estimated impact: $192/day in unattributed revenue
```

**Implementation:** Cross-reference data freshness against feature dependencies (already partially in `feature_dependency` table per docs).

**Score impact:** Admin 4 → 6 (dollar grounding).

---

## Phase Summary Table

| Phase | Items | Files Touched | Est. Lines | Top Score Impact |
|---|---|---|:---:|---|
| A — Dollar Quantification | A1–A6 | 6 | ~150 | Today 9→10, Members 9→10 |
| B — Source Badge Completion | B1–B5 | 5 | ~100 | Board Report 9→10, Automations 8→9 |
| C — Inline Action Bridges | C1–C5 | 5 | ~180 | Revenue Fix It depth, Member Profile Fix It depth |
| D — Cross-Pillar Navigation | D1–D5 | 5 | ~80 | App-wide cohesion |
| E — Per-Page Deepening | E1–E10 | 9 | ~350 | Board Report 9→10, Member Profile 6→9, Integrations 5→8 |
| **TOTAL** | **31 items** | **~25 files** | **~860 lines** | **8 features reach 10/10** |

---

## What This Plan Does NOT Do

- **No deletions.** Every existing feature, tab, route, and component stays.
- **No restructuring.** No file renames, no folder reorganizations.
- **No new pages.** No new top-level routes. All polish lives inside existing pages.
- **No demo gate changes.** Every new feature respects `shouldUseStatic()`.
- **No backend changes.** Uses existing service layer functions only.
- **No new dependencies.** Uses existing libraries (React, Tailwind, recharts).

---

## Verification Plan

After each phase:
1. `npm run build` — must pass clean
2. Visual smoke test against the demo data:
   - Phase A: Confirm dollar values appear in 6 new locations
   - Phase B: Confirm source badges appear in 5 new locations
   - Phase C: Click each new inline action button — confirms it routes to action queue
   - Phase D: Click each new cross-pillar link — confirms navigation
   - Phase E: Per-page checks against the audit's improvement notes
3. Re-run `NORTH-STAR-AUDIT.md` scoring after Phase E. Target: at least 8 features at 10/10.

---

## Final Score Targets (After Polish)

| Page | Current | After Polish |
|---|:---:|:---:|
| Today View | 9 | **10** |
| Revenue 🆕 | 10 | **10** |
| Board Report | 9 | **10** |
| Member Profile Drawer | 10 | **10** |
| Members View | 9 | **10** |
| Tee Sheet View | 8 | **9** |
| Service View | 8 | **9** |
| Automations Hub | 8 | **9** |
| Member Profile Page (full) | 6 | **9** |
| Integrations | 5 | **8** |
| Admin | 4 | **6** |
| Profile / Settings | 2 | 2 (unchanged — not pillar work) |

**8 features at 10/10. 11 of 12 pages at ≥8. App alignment to North Star: ~98%.**

---

## Order of Operations Recommendation

If shipping incrementally, recommended order:

1. **A1** alone — single line, biggest impact (Today 9→10)
2. **Phase B** — quick badge sweep, all-or-nothing visual consistency
3. **Phase A** (rest) — dollar grounding everywhere
4. **E1 + E5** — Board Report polish (storyboard close)
5. **Phase C** — action bridges (most coding)
6. **Phase D** — navigation cohesion
7. **Phase E** (rest) — deepening

Each step is independently shippable to dev. None blocks any other.
