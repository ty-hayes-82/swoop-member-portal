# Swoop App vs. Marketing Site — Comparison Report
*Generated: 2026-04-13*

---

## Marketing Site's North Star (What It Promises)

The marketing site makes 7 bold, specific claims. Everything below judges the app against these.

| # | Marketing Claim | Specificity |
|---|---|---|
| 1 | **Dollar protection** — $74K+/yr, $32K Henderson save, $8.4K Mark save, $9.58K/mo F&B leakage | Named members, named amounts |
| 2 | **Morning briefing at 06:14** — The GM's first act of the day is reading Swoop's overnight summary | Time-stamped, ritualized |
| 3 | **Cross-system intelligence** — Tee sheet + CRM + POS + Complaints fused into one view | Four named systems |
| 4 | **Actionability** — Drafted callbacks, one-tap approve, not a dashboard you scroll past | One-tap, pre-written |
| 5 | **6 AI agents, overnight** — "A team that never sleeps," catching things before the GM arrives | Overnight, autonomous |
| 6 | **Attribution + board proof** — Board-ready ROI, specific dollar saves traced to Swoop | Board-facing |
| 7 | **Zero rip-and-replace** — Live in 14 days, 28 integrations, no new hardware | Speed + breadth |

---

## Page-by-Page Critique

---

### TODAY VIEW — Grade: B−

**What marketing promises:** A GM opens Swoop at 06:14, reads a concise morning briefing ("3 members at churn risk, $2.1K revenue gap today, 2 pace issues flagged"), and taps approve on 2 AI-drafted actions before coffee.

**What the app delivers:**
- Dark gradient greeting ✓ — feels intentional
- Weather widget ✓
- Course condition card ✓
- A tee sheet summary ✓
- Pending Actions section ✓

**Biggest gaps:**

1. **No morning briefing artifact.** The marketing site shows a time-stamped summary (`06:14 · Your overnight summary`). The app has no concept of "this was generated for today, at this time." Everything feels static. A GM arriving at 7am doesn't know if what they're seeing is fresh or stale.

2. **Dollar amounts are missing from the hero.** The marketing site leads with `$9,580/mo F&B leakage` and `$32,000 Henderson save`. Today view shows member counts and health scores — these are intermediate metrics. The marketing site's promise is that you open the app and see money, not percentages.

3. **Pending Actions section exists but is buried.** On the marketing site, "approve 2 actions" is the first CTA above the fold. In the app, Pending Actions is below weather, course condition, and tee sheet.

4. **No "What happened overnight" framing.** Agents run overnight per the marketing site. The Today view has no overnight digest ("While you slept: Mark Davis logged 3 complaints, F&B revenue dropped 18%, 1 member churn risk identified"). This is the single biggest UX gap.

**Recommendations:**
- Add a collapsible "Overnight Brief" card at the very top — time-stamped, 3–5 bullets, AI-authored
- Surface dollar amounts in the hero (not just member counts): `$2,100 in F&B exposure today`
- Move Pending Actions above the fold — it's the one-tap CTA the marketing site sells

---

### MEMBERS VIEW — Grade: B

**What marketing promises:** Named members, named risk amounts. "Henderson, $32K lifetime value, churn risk high — Swoop drafted a callback script." Specific, human, financial.

**What the app delivers:**
- At-Risk tab with health scores ✓
- Engagement change breakdowns (golf/dining/events) ✓
- Archetype segmentation ✓
- First 90 Days tab ✓
- Resignation tracking ✓

**Biggest gaps:**

1. **No lifetime value displayed.** The marketing site's entire value proposition is protecting specific dollars. The Members view shows health scores (0–100) but not dollar amounts. A GM can't immediately see "this member is worth $18K/yr and is about to leave."

2. **Recovery CTAs are present but not pre-drafted.** The marketing site shows Swoop drafting a callback script. The app's Tee Sheet view has "Send Recovery Email" buttons, but Members view doesn't show pre-written outreach. The GM still has to compose.

3. **No connection between service complaints and member churn.** A member with 3 F&B complaints in 60 days should show "complaint-driven risk" — the app shows a health score drop but doesn't explain the vector. The marketing site shows cross-system causality ("3 F&B complaints → churn signal").

4. **Email Engagement tab shows campaign stats, not actionable signals.** The tab shows open/click rates. The marketing site shows "Mark hasn't responded to 2 touchpoints — here's a different approach." Stats ≠ next action.

**Recommendations:**
- Add estimated annual dues value (or LTV tier) to each member row
- Surface the causal chain: "Health dropped 12pts because: 2 complaints (Nov), 0 rounds (Dec), no dining (Dec)"
- Pre-draft outreach text in the member detail drawer — editable but not blank
- Rename "Email Engagement" to "Outreach Effectiveness" and lead with "X members haven't responded to any touchpoint this month → suggested next step"

---

### TEE SHEET — Grade: A−

**What marketing promises:** Pace issues flagged proactively, ranger deployed before a member complains.

**What the app delivers:**
- Health scores on every tee time ✓
- Cancellation risk % ✓
- "Send Recovery Email" CTA ✓
- "Deploy Ranger" button on Revenue view (reachable from here) ✓
- At-risk badge ✓

**Biggest gaps:**

1. **Recovery actions don't show drafted text inline.** "Send Recovery Email" opens a flow — but the marketing site shows the drafted text already visible before you tap. Small UX gap but it's the difference between "review and approve" vs. "compose from scratch."

2. **No estimated revenue impact per tee time slot.** If 3 members cancel due to pace, what's the dollar cost? The marketing site frames everything in dollars. A tee sheet row showing `$280 at-risk` on a high-cancel slot would land differently than a 68% risk badge.

**Recommendations:**
- Show drafted recovery message inline (collapsed, expandable) on the action row
- Add estimated revenue column to tee sheet rows with cancellation risk

---

### SERVICE VIEW — Grade: C+

**What marketing promises:** "Is your service consistent across shifts, outlets, and days?" with specific complaint patterns traced to staffing gaps.

**What the app delivers:**
- Service quality score ✓
- Staffing vs. demand comparison ✓
- Complaint patterns + root causes ✓
- Quality/Staffing/Complaints tabs ✓

**Biggest gaps:**

1. **Service is the most complaint-heavy section of a golf club's GM life, and this view is the least visually compelling.** It reads like a report. The marketing site sells "prevent the next Henderson situation" — this view shows aggregate scores and trend lines.

2. **No dollar framing on service failures.** The marketing site connects a complaint to a churn risk to a dollar amount. This view shows complaint counts, not potential member loss value.

3. **Staffing tab doesn't show who specifically was on shift.** "Staffing level dropped" is less actionable than "John was the F&B lead on the 3 bad-service days in November." If that correlation exists in the data, it's not surfaced.

4. **No proactive alerts.** The marketing site implies Swoop catches service issues before the member complains (via pace + F&B combo signals). The Service view is reactive — it shows what happened, not what's about to happen.

**Recommendations:**
- Add a "Risk Forecast" sub-section: "Based on this Saturday's bookings + current staff schedule, service risk is HIGH — 14 bookings overlapping 1 F&B server"
- Surface dollar exposure: "3 complaint-prone members booked this week — combined LTV $47K"
- Make the Complaint tab the lead tab (not Quality) — it's the most actionable for a GM
- Add shift-level attribution when staff data is available

---

### REVENUE VIEW — Grade: B+

**What marketing promises:** F&B leakage, pace-of-play losses, weather-day revenue gaps — all in dollars, all attributable.

**What the app delivers:**
- Revenue leakage decomposition in dollars ✓ — this is the closest page to matching marketing site framing
- Breakdown by pace/staffing/weather ✓
- "Deploy Ranger" CTA ✓
- Scenario slider ✓

**Biggest gaps:**

1. **The best page is buried at #5 in the nav.** The marketing site's hero section is about dollar protection. The app nav order is: Today → Members → Tee Sheet → Service → **Revenue**. A first-time GM doesn't see the revenue framing until after four other views.

2. **Scenario slider is powerful but unexplained.** The marketing site shows "what would happen if" as a key differentiator from static reports. The slider exists but has no onboarding tooltip explaining what it does.

3. **F&B leakage is shown but not connected to specific members.** The marketing site example: "Mark ordered less this month — pace issue on his last round caused early departure." The Revenue view shows aggregate F&B leakage but not which member experiences are driving it.

**Recommendations:**
- Move Revenue (or at least a revenue summary card) up to the Today view hero
- Add "Top leakage sources this month" with member-level attribution when available
- Add a one-sentence tooltip on the scenario slider explaining the model
- Surface the "$9,580/mo" type number prominently — this is a hero stat, not a detail

---

### AUTOMATIONS / AGENTS — Grade: C

**What marketing promises:** 6 AI agents running overnight, surfacing insights before the GM arrives. "Approve 2 actions" is the daily ritual. Not a dashboard — an inbox.

**What the app delivers:**
- Action Inbox ✓
- Playbook status ✓
- Agent activity log ✓
- Approve/reject buttons ✓
- 5 tabs of agent management ✓

**Biggest gaps:**

1. **The inbox is tab #1 inside Automations, which is tab #6 in the nav.** The marketing site makes "approve actions" the FIRST thing you do. In the app, you navigate to Automations → Inbox → find the actions. The pending action count on Today view helps, but the flow is still: notice badge → click Today Actions → navigate to Automations to approve.

2. **Agent explanations are too technical.** "Churn Risk Agent triggered at 02:14 — executed `compute_health_scores`, `flag_at_risk`, `draft_outreach`" is developer language. A GM wants: "While you slept: Mark Davis was flagged as high-risk. Here's the callback script I drafted. [Approve] [Edit] [Skip]."

3. **Playbooks feel like configuration, not outcomes.** The Playbooks tab shows pipeline steps and completion status. The marketing site shows outcomes: "Pace playbook saved $1,200 in F&B last month." No outcome attribution in the current UI.

4. **Activity log is a log.** Timestamped events are fine for debugging. They don't communicate value to a GM. "14 actions taken this week → 3 members recovered, $4,200 protected" would replace the entire log with a sentence that lands.

**Recommendations:**
- Move Action Inbox to a persistent badge/tray accessible from any page (like an email inbox unread count) — GMs should not navigate to Automations just to approve an action
- Rewrite agent output in GM language: member name, risk framing, proposed action, one-tap approve
- Add outcome attribution to the Playbooks tab: "Last 30 days: X actions taken, Y members recovered, $Z saved"
- Replace the Activity tab with a "What Swoop Did for You" weekly digest

---

### BOARD REPORT — Grade: A−

**What marketing promises:** Board-ready ROI proof. "Here's what we saved you this month" in a format you can paste into the board deck.

**What the app delivers:**
- Board Confidence Score ✓
- KPI strip: Members Retained, Dues Protected, Dues at Risk ✓
- Member Saves $$ / Operational Saves $$ ✓
- 4-tab breakdown ✓
- "What We Learned" tab ✓

**Biggest gaps:**

1. **No export or copy-to-deck CTA.** The marketing site implies this is board-ready. The app shows the data but has no "Export PDF" or "Copy to Slides" button. A GM who wants to use this in a board deck still has to screenshot.

2. **Board Confidence Score is unexplained.** It's a good concept but a first-time viewer doesn't know what 73/100 means or how to improve it.

3. **Dues at Risk number needs more prominence.** This is the scariest number — the one that gets boards to act. It should be bigger, redder, and come with a "here's the intervention plan" link.

**Recommendations:**
- Add Export PDF / Print-to-PDF button to the Board Report page
- Add a one-paragraph AI-authored narrative at the top: "This month Swoop identified $X at risk and protected $Y. Here's how."
- Make Dues at Risk the hero number with a drill-down to the at-risk member list

---

### ADMIN / SETTINGS — Grade: B

**What marketing promises:** "Live in 14 days, 28 integrations, no rip-and-replace."

**What the app delivers:**
- Club Settings form (name, city, state, zip, founded year) ✓
- Weather connection status badge ✓
- Data import UI ✓
- Reset Data button ✓
- Club Management for admins ✓

**Biggest gaps:**

1. **Integration status is not visible.** The marketing site says 28 integrations. The admin panel has no "Connected Systems" status page showing what's connected and what's not. A GM onboarding expects to see "Tee sheet: Connected ✓ / POS: Pending / Email: Not connected."

2. **"Live in 14 days" is not tracked.** There's an onboarding checklist, but no progress-to-value tracker showing "You're on Day 3 — here's what will unlock when your tee sheet data arrives."

3. **Data Import is functional but not framed as time-to-value.** "Upload CSV" is a technical action. "Import your first 90 days of data to unlock churn prediction" is a value action.

**Recommendations:**
- Add a Connected Systems panel showing integration status (even if all manual CSV today)
- Add a "Days to Full Value" tracker on the onboarding checklist
- Rewrite import prompts as value unlocks: "Import transactions → unlock F&B leakage analysis"

---

## Summary Scorecard

| Page | Marketing Alignment | Key Gap |
|---|---|---|
| Today | B− | No morning brief artifact, no overnight digest, dollars buried |
| Members | B | No LTV display, no pre-drafted outreach, no causal chain |
| Tee Sheet | A− | Near-perfect — add inline drafted text + dollar column |
| Service | C+ | Reactive not proactive, no dollar framing on failures |
| Revenue | B+ | Best dollar framing — buried in nav, F&B not member-linked |
| Automations | C | Inbox buried, agent output too technical, no outcome attribution |
| Board Report | A− | Add export PDF, "Dues at Risk" needs more prominence |
| Admin | B | No integration status, onboarding not value-framed |

---

## Top 5 Recommendations (Highest Leverage)

### 1. Add "Overnight Brief" card to Today view (top of page)
Time-stamped, 3–5 bullets, AI-authored, action count visible. This is the single scene the marketing site sells. It doesn't exist yet.

### 2. Surface dollar amounts in every hero section
Marketing site leads every section with money. Members view: add LTV column. Service view: add "at-risk dues" exposure. Today view: lead with `$X,XXX at risk today`. Revenue view: promote to nav position #2.

### 3. Make Action Inbox globally accessible
Persistent badge on the top nav bar showing pending approvals. Approve actions should be a 2-click flow from any page, not a 4-click journey to Automations → Inbox.

### 4. Rewrite agent/automation output in GM language
Replace technical log entries with member-named, dollar-framed, one-tap outcomes. "Mark Davis — churn risk — draft callback ready. [Approve] [Edit]" is the unit of output the marketing site shows.

### 5. Add Export PDF to Board Report
This is a zero-engineering-effort gap that makes the Board Report actually usable in board meetings. Without it, GMs screenshot — which doesn't look like a $74K/yr tool.
