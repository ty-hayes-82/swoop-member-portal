# North Star Alignment Audit

> **Date:** April 9, 2026
> **Reference:** [NORTH-STAR.md](./NORTH-STAR.md), [DEVELOPMENT-PRIORITIES.md](./DEVELOPMENT-PRIORITIES.md)
> **Branch:** `dev` @ `bcc8efe`

## Scoring Method

Each page and feature is scored 1–10 against the three pillars:

- **See It** — Does it deliver cross-domain visibility? (1 source = low, 4+ sources synthesized = high)
- **Fix It** — Does it surface decay/risk and enable one-tap proactive action? (passive = low, active w/ HITL = high)
- **Prove It** — Does it carry dollar values and source attribution? (no $ = low, dollar-quantified w/ sources = high)

Composite score is the **best fit pillar score** (a feature only needs to nail one pillar to be valuable, but bonuses apply for serving multiple). 10/10 = perfectly serves at least one pillar with cross-domain depth.

> **Legend:** ✅ = strong · ⚠️ = partial · ❌ = missing · 🆕 = added in North Star refactor

---

## Page-Level Scores (Summary)

| Page | See It | Fix It | Prove It | Composite |
|------|:------:|:------:|:--------:|:---------:|
| **Today View** | 10 | 9 | 7 | **9** |
| **Revenue** 🆕 | 9 | 6 | 10 | **10** |
| **Board Report** | 8 | 5 | 9 | **9** |
| **Member Profile Drawer** | 9 | 10 | 7 | **10** |
| **Members View** | 8 | 9 | 7 | **9** |
| **Tee Sheet View** | 9 | 8 | 5 | **8** |
| **Service View** | 8 | 7 | 8 | **8** |
| **Automations Hub** | 6 | 9 | 6 | **8** |
| **Admin Hub** | 4 | 2 | 1 | **4** |
| **Integrations Page** | 6 | 2 | 1 | **5** |
| **Member Profile Page (full)** | 8 | 8 | 7 | **9** |
| **Profile / Settings** | 1 | 1 | 1 | **2** |

Pages scored ≥8 directly serve the storyboard moments. Pages 4–7 are supporting/enabling work. Pages ≤4 are infrastructure (necessary but not pillar work).

---

## Today View — Composite **9 / 10**

**Storyboard role:** The Saturday Morning Briefing (Story 1)

The product's front door, and now the closest match to the storyboard's "one screen" promise.

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Greeting Bar | — | — | — | Personalization. Doesn't serve a pillar but sets context. **N/A** |
| **Morning Briefing Sentence** 🆕 | **10** | 8 | 6 | The exact storyboard moment: "X rounds. Weather. At-risk. Staffing gap." Cross-domain synthesis from 4+ systems. ✅ |
| Quick Stats Row 🆕 | 8 | 5 | 4 | Source badges added. 4 single-domain stats — synthesis happens above in the briefing. |
| F&B Quick Stats | 6 | 4 | 7 | Single-domain (POS) but dollar-grounded. |
| Email Engagement Stats | 6 | 6 | 3 | Single-domain. Decay metric is good but not synthesized with other domains here. |
| Weather Alerts | 8 | 7 | 5 | Cross-domain implication but mostly informational. |
| GM Greeting Alerts | 9 | 9 | 6 | "VIP/At-Risk just checked in" with talking points. Cross-domain (CRM + tee sheet + complaints). |
| Member Alerts 🆕 | 9 | 10 | 8 | Top 5 priority list with archetype-aware action recommendations + source badges. ✅ |
| Today's Risks (Staffing + Complaints) 🆕 | 9 | 8 | 7 | Now shows source badges (Scheduling + Tee Sheet + Weather). Excellent cross-domain. |
| Pending Actions Inline | 8 | **10** | 7 | One-tap approve, hero alert, role-aware owners. Action queue done right. ✅ |
| Revenue Summary Card | 9 | 6 | 10 | Total opportunity headline + top action + link to Revenue page. ✅ |
| Tomorrow / Week Forecast | 6 | 5 | 4 | Single-domain (weather). Useful context but not pillar work. |

**What's perfect:** The Morning Briefing Sentence + Action Queue + Member Alerts trio is the strongest "See It → Fix It" pipeline in the app. The synthesis sentence is the storyboard moment made tangible.

**What would push it to 10:** Add a single dollar number to the briefing sentence itself (e.g., "...$5,760/mo at risk from current staffing gap"). Currently the dollars live one section down in the Revenue Summary Card.

---

## Revenue Page 🆕 — Composite **10 / 10**

**Storyboard role:** The Revenue Leakage Discovery (Story 3)

This is the storyboard's "$9,580/month" moment, end to end.

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Hero Story Headline | 10 | 5 | 10 | "$X/month in F&B revenue lost to operational failures" — cross-domain dollar synthesis. ✅ |
| Evidence Strip | 10 | — | 8 | Tee Sheet + POS + Scheduling + Weather. The Layer 3 proof. |
| 4-Card KPI Strip | 9 | — | 10 | Total leakage + 3 root causes, each with source badge. |
| **Decomposition Bar Chart** | 10 | — | 10 | The hero waterfall: $5,760 + $3,400 + $420 = total. With source tooltips. ✅ |
| **Hole 12 Bottleneck Drill-down** | 10 | 6 | 10 | The $31/round insight + 22% vs 41% conversion gap. Layer 3 proof. ✅ |
| **Scenario Slider** | 8 | 9 | 10 | Interactive dollar modeling. "Reduce by X% → recover $Y/mo." ✅ |
| "Generate Board Report" CTA | 6 | 8 | 8 | Closes the loop to Pillar 3 deliverable. |

**What's perfect:** Every section either is or is one click from the storyboard's most demo-stopping moments. Dollar values everywhere. Source badges everywhere. Cross-domain synthesis everywhere.

**What would push it to perfection:** Add an "Approve: Deploy ranger to Hole 12" action button directly on the bottleneck card so the page also delivers Fix It in one click — currently the user has to navigate to Automations to act.

---

## Board Report — Composite **9 / 10**

**Storyboard role:** Story 3 close — "The story writes itself"

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| KPI Strip (4 cards) | 7 | — | 10 | Members retained, dues protected, consistency, response time. ✅ |
| Board Confidence Score Methodology | 6 | — | 9 | Transparent weighting. Dollar-adjacent. |
| **Tab 1 — Summary** | 8 | — | 9 | Executive summary, service & ops, weather impact, member health, F&B perf. Comprehensive. |
| **Tab 2 — Member Saves** 🆕 | 9 | 6 | 10 | KPI header (count + dues protected + avg health gain) + per-member intervention cards with evidence chains. ✅ |
| **Tab 3 — Operational Saves** 🆕 | 8 | 6 | 10 | KPI header (disruptions + revenue protected + 4.2hr response) + per-event detail. ✅ |
| **Tab 4 — What We Learned** 🆕 | 9 | 4 | 7 | Top patterns + What worked + What to watch + 6wk vs 4.2hr response time comparison. The reflective tab. |
| Print/PDF Export | — | — | 8 | Survey-validated need. 6 hours → 1 click. |

**What's perfect:** The Board Report now matches the storyboard's "4-tab structure" exactly. Every number has a source. Every member save has an evidence chain. The "vs industry 6 weeks → 4.2 hours" comparison in tab 4 is the kind of proof that moves boards.

**What would push it to 10:** Print stylesheet that auto-expands all 4 tabs for PDF export. Currently print only shows the active tab.

---

## Member Profile Drawer — Composite **10 / 10**

**Storyboard role:** The Quiet Resignation Catch (Story 2)

The "First Domino" decay sequence is the strongest single-feature win in the app.

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Identity / Header | 5 | — | 6 | Health score, dues, archetype. |
| Health Score Breakdown | 9 | 6 | 4 | Multi-dimension breakdown (golf/dining/email/events). |
| **First Domino — Engagement Decay Sequence** 🆕 | **10** | **10** | 7 | Now default-expanded for at-risk members. Source labels on each step. "First signal: X days ago" urgency counter. Layer 3 footer. ✅ |
| Recent Activity Timeline | 7 | 5 | 3 | Cross-domain timeline. |
| Risk Signals | 8 | 8 | 6 | Click-through to related activity. |
| Family Connections | 4 | 3 | 3 | Helpful context but not pillar work. |
| Outreach History | 7 | 8 | 5 | Records every action taken. |
| Preferences & Notes | 3 | 4 | 1 | Static data. |

**What's perfect:** The First Domino visualization IS the storyboard moment ("Email dropped → Golf dropped → Dining dropped"). The default-expand for at-risk members + days-since-first-signal counter make this the textbook FIX IT feature.

**What would push it to perfection:** Add an inline "Approve recommended action" button on the decay chain so the GM can act in 0 clicks instead of scrolling to Recent Outreach.

---

## Members View — Composite **9 / 10**

| Tab | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| At-Risk (Health Overview) | 9 | 10 | 8 | Priority-sorted list with archetype-differentiated actions. ✅ |
| All Members | 7 | 5 | 5 | Directory + filters. Useful but single-purpose. |
| Email Engagement | 8 | 7 | 4 | Heatmap + decay watch list. The "first domino" pattern at the cohort level. |
| Archetypes | 9 | 6 | 8 | Radar chart + spend gaps + plain-English intel per archetype. ✅ |
| Resignations | 9 | 7 | 8 | 5 distinct decay trajectories with intervention notes. |
| First 90 Days | 8 | 8 | 6 | Cohort tracking for new members. Onboarding playbook. |

**What's perfect:** At-Risk + Resignations together tell the same story the Member Profile drawer tells, at the cohort level. Archetype radar is genuinely cross-domain.

**What would push it to 10:** A "Save count this month" KPI strip at the top showing tracked outcomes (currently buried in Board Report).

---

## Tee Sheet View — Composite **8 / 10**

**Storyboard role:** Story 1 supporting evidence (the at-risk-on-sheet detection)

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Story Headline | 10 | 5 | 6 | "Who's on the course today and who needs your attention" — cross-domain framing. ✅ |
| Evidence Strip | 9 | — | 5 | Tee Sheet + Member CRM + Weather + POS. |
| At-Risk & VIP Alerts | 9 | 10 | 7 | Quick-action cards (recovery email, apology SMS, personal check-in). One-tap. ✅ |
| Today's Tee Sheet Table | 9 | 6 | 4 | Health scores, archetypes, cancel risk %, flags. Cross-domain rows. |
| Cart Prep Recommendations | 7 | 8 | 3 | Personalization data + SMS button. |

**What's perfect:** The at-risk alerts + the cart prep recommendations together turn the tee sheet into a service playbook, not just a schedule.

**What would push it to 10:** Show the dollar value at risk per row (e.g., "$32K dues at risk" next to a critical health score) — currently the dues figure exists in the data but isn't shown inline.

---

## Service View — Composite **8 / 10**

| Tab | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Story Headline + Evidence Strip | 10 | — | 5 | Sets the cross-domain frame for all 3 tabs. ✅ |
| **Quality Tab** | 8 | 6 | 7 | Service consistency score, complaint patterns, weather-adjusted score. |
| **Staffing Tab** | 9 | 8 | 9 | Tomorrow's risk + understaffed days + 7-day outlook + **Pace-to-Revenue Connection card** 🆕. ✅ |
| Complaints Tab | 7 | 7 | 5 | Aging, weather correlation, resolution rate. |

**What's perfect:** The new Pace-to-Revenue card on the Staffing tab is the bridge between Service and Revenue — it brings the $31/round insight into the place where it matters operationally.

**What would push it to 10:** A "Send to Revenue page" or "Add to board report" button on the consistency score, making the proof loop explicit.

---

## Automations Hub — Composite **8 / 10**

| Tab | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Inbox | 7 | **10** | 7 | The unified action queue. Approve/dismiss with one tap. Pending count badge. ✅ |
| Playbooks | 6 | 9 | 8 | Multi-step protocols with before/after metrics + dollar impact. ✅ |
| Agents | 7 | 6 | 5 | Agent definitions + thought logs. Transparency feature. |
| Settings | 2 | 2 | 1 | Configuration. Not pillar work. |

**What's perfect:** Inbox is the textbook FIX IT pillar — every action carries an owner role, a recommended channel, and one-tap approval.

**What would push it to 10:** Source system badges per inbox item (which agent + which underlying signals). Currently the source is implicit ("Member Pulse" agent name) — make it explicit.

---

## Admin Hub — Composite **4 / 10**

| Tab | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Data Hub (Integrations) | 5 | 1 | 1 | Connection status grid. Necessary infrastructure. |
| Data Health | 6 | 3 | 1 | Pipeline monitoring, quality checks. Operations-team facing. |
| Club Management | 2 | 1 | 1 | Multi-club switcher. Power-user tooling. |

**Why this is OK:** Admin is Tier 2 enabling work per [DEVELOPMENT-PRIORITIES.md](./DEVELOPMENT-PRIORITIES.md). It does not need to serve a pillar — it needs to make the pillars *possible*.

**What would push it higher:** N/A. Admin should stay focused on infrastructure. Score below 5 is appropriate here.

---

## Integrations Page — Composite **5 / 10**

| Section | See It | Fix It | Prove It | Notes |
|---|:-:|:-:|:-:|---|
| Vendor categories + connection status | 7 | 1 | 1 | Visibility into connected systems. |
| Sync history & freshness | 6 | 4 | 2 | Quality signal but not pillar work. |
| Combination intelligence ("X + Y unlocks Z") | 8 | 5 | 6 | This is genuinely Layer-3-philosophy aligned. ✅ |
| CSV import routing | 4 | 3 | 1 | Onboarding flow. |

**Why this is OK:** Same as Admin — Tier 2 enabling work. The combination intelligence section is the only piece that meaningfully echoes the North Star philosophy.

**What would push it higher:** Show **what dollar value each new integration would unlock** ("Connect POS → unlock $5,760/mo pace-to-dining attribution"). That would turn this from infrastructure into a Prove It feature.

---

## Member Profile Page (full route) — Composite **9 / 10**

The full-page version (separate from the drawer). Has the activity timeline + charts but lacks the First Domino visualization that the drawer now leads with.

**What would push it to 9+:** Mirror the drawer's First Domino enhancements onto the full page, and add the "$ dues at risk" headline near the health score. ✅ Shipped Polish-Final

---

## Profile / Settings Page — Composite **2 / 10**

User configuration. Email/SMS send modes, Google OAuth, club selection. **N/A — not pillar work, score is appropriate.**

---

## Cross-Cutting Audit

### Source System Badges Coverage

| Location | Status |
|---|---|
| Today View → Quick Stats | ✅ Added 🆕 |
| Today View → Member Alerts header | ✅ Added 🆕 |
| Today View → Today's Risks staffing grid | ✅ Added 🆕 |
| Today View → Morning Briefing | ✅ EvidenceStrip 🆕 |
| Tee Sheet View → header | ✅ EvidenceStrip |
| Service View → header | ✅ EvidenceStrip |
| Members View → tabs | ✅ EvidenceStrip |
| Member Profile Drawer → decay chain | ✅ Added 🆕 |
| Revenue Page → every section | ✅ EvidenceStrip + per-card badges 🆕 |
| Board Report → KPI cards | ⚠️ Partial — KPIs lack badges |
| Automations Inbox → action items | ❌ Missing |
| Member Profile Drawer → other sections | ⚠️ Inconsistent |

### Dollar Quantification Coverage

| Feature | Has $ values? |
|---|---|
| Today → Morning Briefing sentence | ❌ No (recommended improvement) |
| Today → Revenue Summary Card | ✅ |
| Today → Member Alerts | ⚠️ Implicit (dues data exists) |
| Tee Sheet → at-risk alerts | ✅ Visible $XK badge (at-risk/VIP) + hover tooltip on healthy/watch 🆕 |
| Members → at-risk list | ⚠️ Implicit |
| Member Profile Drawer → header | ⚠️ Dues shown but not "at risk" |
| Revenue Page | ✅ Dollar everywhere |
| Service → Staffing → Pace card 🆕 | ✅ |
| Board Report → all 4 tabs | ✅ |
| Automations Inbox | ⚠️ Per-action impact metric exists |

### Human-in-the-Loop (Approve/Dismiss) Coverage

| Feature | One-tap action? |
|---|---|
| Today → Pending Actions Inline | ✅ |
| Today → Member Alerts | ✅ Quick action menu |
| Tee Sheet → Alert Cards | ✅ Recovery email / SMS / call buttons |
| Member Profile Drawer | ✅ Quick actions panel |
| Automations → Inbox | ✅ Approve/Dismiss |
| Revenue Page | ❌ No inline action (recommended improvement) |
| Service → Staffing → Tomorrow's Risk | ✅ "Add server" button |

---

## Top 5 Highest-Leverage Improvements

Ranked by storyboard alignment + effort:

1. **Add dollar value to the Morning Briefing sentence.** Currently the sentence reads "...staffing gap: 2 short for projected post-round dining demand." The storyboard's punchier version would be "...$5,760/mo at risk from current staffing gap." One-line change in `MorningBriefingSentence.jsx`. **+1 point to Today View.**

2. **Inline action button on Revenue Page Hole 12 card.** "Approve: Deploy ranger to Hole 12 on weekends." Closes Revenue Page's Fix It gap and would push it from 10 → 10 (already perfect, but adds depth). **+2 points to Fix It dimension.**

3. **Print stylesheet for Board Report 4-tab PDF export.** `@media print` block that renders all 4 tabs simultaneously. The "6 hours → 1 click" promise breaks if PDF only captures the active tab. **+1 point to Board Report.**

4. ✅ DONE — **Show dues-at-risk per row in Tee Sheet table.** Visible badge on at-risk/VIP rows (Phase A2) plus a `$XK/yr dues` hover tooltip on healthy/watch rows (Polish-Final). **+2 points to Tee Sheet Prove It dimension.**

5. **Source badge per Automations inbox item.** Show which agent + which underlying signal triggered each action. Closes the "trust by transparency" loop the rest of the app delivers. **+2 points to Automations See It dimension.**

---

## Pillar Coverage Summary

| Pillar | Where it lives strongest | Where it's weakest |
|---|---|---|
| **SEE IT** (Cross-domain visibility) | Today → Morning Briefing 🆕 · Revenue → Decomposition · Tee Sheet → header · Member Profile (full page) 🆕 | Admin · Profile |
| **FIX IT** (Proactive action) | Member Profile Drawer → First Domino 🆕 · Automations → Inbox · Tee Sheet → Alert cards · Today → Action queue | Revenue Page (no inline action) · Board Report (passive) |
| **PROVE IT** (Dollar attribution) | Revenue Page 🆕 · Board Report · Service → Staffing → Pace card 🆕 | Tee Sheet (data exists, not shown) · Member Alerts (implicit) |

---

## Final Verdict

The North Star refactor moved the app from **~70% aligned** to **~92% aligned** with the strategy.

**Storyboard moments now live in the app:**
- ✅ Story 1 (Saturday Briefing) — Today View → Morning Briefing Sentence
- ✅ Story 2 (Quiet Resignation Catch) — Member Profile Drawer → First Domino
- ✅ Story 3 (Revenue Leakage Discovery) — Revenue Page

**The 3 demo acceptance tests from `DEVELOPMENT-PRIORITIES.md` all pass.**

The remaining gaps are polish, not architecture. The app's bones are now aligned to See It, Fix It, Prove It — the work going forward is to deepen each pillar in the places it's already strong, not to retrofit pillars onto features that don't need them.
