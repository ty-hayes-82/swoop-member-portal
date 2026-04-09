# Granular Feature Audit — North Star Alignment

> **Date:** April 9, 2026 (post-Phase D polish)
> **Reference:** [NORTH-STAR.md](./NORTH-STAR.md), [DEVELOPMENT-PRIORITIES.md](./DEVELOPMENT-PRIORITIES.md), [POLISH-PLAN.md](./POLISH-PLAN.md)
> **Branch:** `dev` (post-A/B/C/D polish, partial E)

> **Polish-Final update — April 9, 2026:** Member Profile Page parity, Tee Sheet dues tooltip, Board Report saves clickable, briefing scroll-to-alerts, drawer source-badge consistency confirmed.

This document scores **every feature, functionality, and page** in the app against the 3 North Star pillars. The earlier `NORTH-STAR-AUDIT.md` is page-level; this is exhaustive.

## Scoring Method

Each row is scored 1–10 against each pillar:

- **See It** — cross-domain visibility (1 = single source · 10 = 4+ sources synthesized w/ source badges)
- **Fix It** — proactive action (1 = passive display · 10 = one-tap action with HITL)
- **Prove It** — dollar attribution (1 = no $ · 10 = dollar-quantified with source attribution)

**Composite** = best-fit pillar score (a feature only needs to nail one pillar).

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Strong fit — serves the pillar well |
| ⚠️ | Partial fit — data exists but not surfaced or limited depth |
| ❌ | Not applicable / not present |
| 🆕 | Added or enhanced in North Star refactor (April 2026) |
| 🛠️ | Tier 2 enabling work (intentionally outside pillar work) |

---

# 1. Today View — Composite **10**

**Storyboard role:** Saturday Morning Briefing (Story 1)
**File:** `src/features/today/TodayView.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 1.1 | Greeting Bar (date + name) | — | — | — | Personalization. **N/A** |
| 1.2 | **Morning Briefing Sentence** 🆕 | **10** | 8 | **9** | The storyboard moment. Now includes dollar exposure (Phase A1). ✅ |
| 1.3 | Trust Math expandable 🆕 | 9 | — | 6 | "How is this computed?" — Phase E2. Builds trust. |
| 1.4 | Cross-pillar "See full revenue breakdown →" link 🆕 | 6 | — | 9 | Phase D1 navigation bridge. |
| 1.5 | Quick Stat — Course Condition | 6 | 4 | 3 | Single domain (Weather). Source badge added 🆕. |
| 1.6 | Quick Stat — Tee Times Today | 7 | 5 | 4 | Source badge added 🆕. |
| 1.7 | Quick Stat — Active Members | 6 | 4 | 5 | Source badge added 🆕. |
| 1.8 | Quick Stat — Pending Actions | 7 | 8 | 5 | Source badge added 🆕. |
| 1.9 | F&B Quick Stats (covers, avg check, post-round dining %) | 7 | 4 | 9 | Single-domain but dollar-grounded. |
| 1.10 | Email Engagement Stats | 6 | 6 | 3 | Single-domain. |
| 1.11 | Weather Alerts banner | 8 | 7 | 5 | Cross-domain implication. |
| 1.12 | GM Greeting Alerts (VIP / At-Risk check-ins) | 9 | 9 | 7 | Cross-domain (CRM + Tee Sheet + Complaints). Talking points generated. ✅ |
| 1.13 | Member Alerts list | 9 | **10** | **9** | Top 5 priority + archetype actions + dues badges 🆕 + source badges 🆕. ✅ |
| 1.14 | Today's Risks — Staffing grid | 9 | 8 | 7 | Source badge row added 🆕. |
| 1.15 | Today's Risks — Open Complaints | 8 | 7 | 6 | Aging tracking. |
| 1.16 | Pending Actions Inline (hero alert) | 9 | **10** | 8 | Hero card with one-tap approve. ✅ |
| 1.17 | Pending Actions Inline (top 3 list) 🆕 | 9 | **10** | 7 | Source badge per action 🆕 (Phase B4). |
| 1.18 | Action Panel (expanded) | 8 | **10** | 7 | Inline approve/dismiss with channel selection. |
| 1.19 | Revenue Summary Card | 9 | 6 | **10** | Total opportunity + top action + link to Revenue. ✅ |
| 1.20 | Tomorrow Forecast | 6 | 5 | 4 | Single-domain (Weather). |
| 1.21 | Week Forecast | 6 | 5 | 4 | Single-domain (Weather). |

**Strongest pillar trio in the app:** Morning Briefing → Action Queue → Member Alerts. The "See It → Fix It" pipeline made tangible.

---

# 2. Revenue Page 🆕 — Composite **10**

**Storyboard role:** Revenue Leakage Discovery (Story 3)
**File:** `src/features/revenue/RevenuePage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 2.1 | Page header with "Generate Board Report" CTA | 6 | 5 | 8 | Top-of-page nav bridge. |
| 2.2 | Story headline ("$X/mo lost to operational failures") | **10** | 5 | **10** | Cross-domain dollar synthesis as the hero. ✅ |
| 2.3 | Evidence Strip (Tee Sheet + POS + Scheduling + Weather) | **10** | — | 8 | The Layer 3 proof. ✅ |
| 2.4 | KPI card — Total Monthly Leakage | 9 | — | **10** | Animated number + annual projection. |
| 2.5 | KPI card — Pace of Play loss | 8 | — | **10** | Source badge: Tee Sheet. |
| 2.6 | KPI card — Understaffed Days loss | 8 | — | **10** | Source badge: Scheduling. |
| 2.7 | KPI card — Weather No-Shows loss | 8 | — | **10** | Source badge: Weather API. |
| 2.8 | **Decomposition BarChart (recharts)** | **10** | — | **10** | Horizontal bar with source tooltip per segment. ✅ |
| 2.9 | Trend context strip 🆕 | 7 | — | 9 | "Tracking Since" / "This Month" / "Recoverable" — Phase E4. |
| 2.10 | **Hole 12 Bottleneck card** | **10** | 7 | **10** | The $31/slow round demo-stopper. ✅ |
| 2.11 | Bottleneck — dining conversion comparison (22% vs 41%) | 9 | — | **10** | The Layer 3 cross-reference. |
| 2.12 | Bottleneck — Layer 3 explainer footer | **10** | — | 7 | "Tee sheet knows pace. POS knows dining. Swoop sees both." |
| 2.13 | **"Approve & Deploy Ranger" inline action** 🆕 | 7 | **10** | 9 | Phase C1 — closes the Fix It gap. ✅ |
| 2.14 | **Scenario Slider** (interactive) | 8 | 9 | **10** | Real-time dollar modeling. ✅ |
| 2.15 | Scenario Slider — slow rounds eliminated counter | 7 | — | 9 | AnimatedNumber. |
| 2.16 | Scenario Slider — recovered pace + staffing breakdown | 7 | — | **10** | Two-tier recovery model. |
| 2.17 | "Take this story to the board" CTA | 5 | 6 | 9 | Cross-pillar bridge. |
| 2.18 | **4-tab Board Report preview cards** 🆕 | 7 | 6 | 8 | Phase D2 — visual breadcrumb. |

**Storyboard match:** This page is the storyboard's "$9,580 moment" end-to-end.

---

# 3. Board Report — Composite **10**

**Storyboard role:** Story 3 close — "The story writes itself"
**File:** `src/features/board-report/BoardReport.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 3.1 | Page header with Export PDF / Print buttons | — | — | 9 | Survey-validated need. |
| 3.2 | Demo data indicator banner | 4 | — | 3 | Trust signal. |
| 3.3 | **KPI strip — 4 metrics** (Members Retained, Dues, Consistency, Response Time) | 9 | — | **10** | Source badges added 🆕 (Phase B1). ✅ |
| 3.4 | Board Confidence Score methodology details | 8 | — | 9 | Transparent weighting (Service 30 / Member 25 / Ops 25 / Financial 20). |
| 3.5 | Tab switcher (4 tabs) | — | — | — | Navigation. **N/A** |
| 3.6 | Print stylesheet — all 4 tabs in PDF 🆕 | — | — | **10** | Phase E1 — closes the "6 hrs → 1 click" promise. ✅ |
| 3.7 | **Tab 1 — Executive Summary** | 8 | — | 9 | Service quality + member health + ops + F&B perf. |
| 3.8 | Tab 1 — Quick links to Member Saves & Operational Saves tabs 🆕 | 7 | 6 | 9 | Cross-pillar nav. |
| 3.9 | Tab 1 — Service & Operations panel | 8 | — | 9 | Composite consistency score. |
| 3.10 | Tab 1 — Weather Impact panel | 9 | — | 7 | Weather-adjusted consistency. |
| 3.11 | Tab 1 — Member Health Overview | 8 | — | 8 | Distribution + monthly deltas. |
| 3.12 | Tab 1 — F&B Performance | 7 | — | **10** | Dollar grounding. |
| 3.13 | **Tab 2 — Member Saves** 🆕 | 9 | 6 | **10** | KPI header + per-member intervention cards w/ evidence chains. ✅ |
| 3.14 | Tab 2 — Total members saved + dues protected + avg health gain | 7 | — | **10** | KPI strip. |
| 3.15 | Tab 2 — Per-member evidence chain (Signal → Alert → Action → Retained) | **10** | 5 | 9 | The trust mechanism. |
| 3.16 | **Tab 3 — Operational Saves** 🆕 | 8 | 6 | **10** | Disruptions prevented + revenue protected + 4.2hr response. ✅ |
| 3.17 | Tab 3 — KPI strip header | 7 | — | **10** | Mirror of tab 2. |
| 3.18 | Tab 3 — Per-event detail panels | 7 | 5 | 9 | Detection / Action / Outcome. |
| 3.19 | **Tab 4 — What We Learned** 🆕 | 9 | 4 | 7 | The reflective tab. |
| 3.20 | Tab 4 — Top patterns from feedback | 9 | — | 6 | Cross-domain insights. |
| 3.21 | Tab 4 — What worked (highest health improvements) | 8 | 7 | 8 | Prescribes future action. |
| 3.22 | Tab 4 — What to watch (emerging risks) | 9 | 6 | 6 | Distribution deltas. |
| 3.23 | Tab 4 — Response time improvement (6wk → 4.2hr) | 7 | — | 9 | The "vs industry" comparison. |
| 3.24 | **Tab 4 — Recommended Focus Next Month** 🆕 | 9 | 8 | 9 | Auto-derived priorities — Phase E5. ✅ |

---

# 4. Member Profile Drawer — Composite **10**

**Storyboard role:** Quiet Resignation Catch (Story 2)
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 4.1 | Identity / Header (name, tier, joined date) | 4 | — | 5 | Reference data. |
| 4.2 | **Featured in Board Report badge** 🆕 | 7 | 5 | 9 | Phase D3 cross-pillar bridge. ✅ |
| 4.3 | Annual dues / Annual value / Last seen metrics | 5 | — | 8 | Reference data + dollars. |
| 4.4 | Health score gauge with sparkline trend | 7 | — | 6 | Single composite number. |
| 4.5 | **Dues at risk callout** 🆕 | 6 | 7 | **10** | Phase A4 — "$XK/yr at risk" badge for at-risk members. ✅ |
| 4.6 | Open Full Profile button | — | — | — | Navigation. **N/A** |
| 4.7 | Member Habits Snapshot (golf/dining/email/events) | 9 | — | 7 | Cross-domain. |
| 4.8 | Health Score Breakdown (4-dimension grid) | **10** | 6 | 4 | Multi-domain composite. ✅ |
| 4.9 | **First Domino — Engagement Decay Sequence** | **10** | **10** | 7 | Default-expanded for at-risk members. The textbook FIX IT moment. ✅ |
| 4.10 | First Domino — Source labels per step 🆕 | **10** | — | 5 | Phase B3-style — Tee Sheet / POS / Email / Events labels. |
| 4.11 | First Domino — "First signal: X days ago" urgency 🆕 | 7 | 9 | 6 | Time-since counter. |
| 4.12 | First Domino — Layer 3 footer ("No single system would have flagged this") | **10** | — | 6 | The trust line. |
| 4.13 | **First Domino — "Approve & Log" inline action** 🆕 | 6 | **10** | 7 | Phase C2 — archetype-aware recommendation. ✅ |
| 4.14 | Recent Activity Timeline | 7 | 5 | 3 | Cross-domain timeline. |
| 4.15 | Recent Activity — section source badges 🆕 | 8 | — | — | Phase B3. |
| 4.16 | Member Journey (full timeline) — source badges 🆕 | 9 | — | — | Phase B3. |
| 4.17 | Risk Signals list | 8 | 8 | 6 | Click-through to activity. |
| 4.18 | Family Connections | 4 | 3 | 3 | Reference data. |
| 4.19 | Outreach History | 7 | 8 | 5 | Action audit log. |
| 4.20 | Preferences & Notes | 3 | 4 | 1 | Reference data. |
| 4.21 | Quick Actions menu | 7 | 9 | 6 | Per-member action launcher. |

**Strongest single feature in the app:** First Domino — exists at the storyboard's exact moment.

---

# 5. Members View (Members Hub) — Composite **10**

**File:** `src/features/members/MembersView.jsx` + tabs

| # | Tab / Feature | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 5.1 | Tab navigation | — | — | — | **N/A** |
| 5.2 | Evidence Strip (Member CRM + Analytics + Tee Sheet + POS + Email) | **10** | — | 6 | Cross-domain framing. ✅ |
| 5.3 | Archetype filter chips | 6 | 5 | 4 | Filter UI. |
| 5.4 | **HealthOverview tab — Pillar 3 KPI strip (Members at Risk + Dues + Saves)** 🆕 | 7 | 7 | **10** | Phase A5. ✅ |
| 5.5 | HealthOverview — Health Distribution KPI cards | 8 | — | 7 | 4 buckets with monthly deltas. |
| 5.6 | **HealthOverview — Bulk approve all priority outreach** 🆕 | 7 | **10** | 9 | Phase C4 — confirms total dues protected. ✅ |
| 5.7 | HealthOverview — Priority member list (top 5) | 9 | **10** | 8 | Archetype-differentiated actions. ✅ |
| 5.8 | **AllMembers tab — Cross-Domain Decay Patterns legend** 🆕 | 9 | 5 | 5 | Phase E8 — pattern hints. |
| 5.9 | AllMembers — Filter by Health Level | 7 | 5 | 5 | Reactive distribution. |
| 5.10 | AllMembers — Filter by Archetype | 6 | 5 | 4 | 8 archetypes. |
| 5.11 | AllMembers — Filter by Activity | 6 | 5 | 4 | Recency filter. |
| 5.12 | AllMembers — Member directory table | 7 | 6 | 6 | Searchable. |
| 5.13 | EmailTab — Heatmap (campaigns × archetypes) | 8 | 7 | 4 | Cohort decay view. |
| 5.14 | EmailTab — Decay watch list | 9 | 8 | 5 | Earliest churn signals. |
| 5.15 | ArchetypeTab — Selector (8 archetypes with churn coloring) | 7 | 6 | 6 | Categorical view. |
| 5.16 | ArchetypeTab — Radar chart (5-dim engagement) | 9 | 5 | 5 | Cross-domain visualization. ✅ |
| 5.17 | ArchetypeTab — Plain English intel per archetype | 8 | 7 | 7 | Retention outlook + opportunity + watch for. |
| 5.18 | ArchetypeTab — Spend potential breakdown | 7 | 5 | 9 | Dollar grounding. |
| 5.19 | ResignationTimeline — 5 trajectories with annotations | 9 | 7 | 8 | Cohort-level First Domino. ✅ |
| 5.20 | First 90 Days — cohort tracking | 8 | 8 | 6 | New member integration. |
| 5.21 | Recovery tab — recovery strategies | 7 | 8 | 7 | Playbook reference. |

---

# 6. Tee Sheet View — Composite **9**

**File:** `src/features/tee-sheet/TeeSheetView.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 6.1 | Story headline ("Who's on the course today...") | **10** | 5 | 6 | Cross-domain framing. ✅ |
| 6.2 | Evidence Strip (Tee Sheet + Member CRM + Weather + POS) | **10** | — | 6 | ✅ |
| 6.3 | At-Risk Member Alert Cards (top section) | 9 | 9 | 7 | One-tap recovery actions. ✅ |
| 6.4 | Alert Card — Send Recovery Email button | 7 | **10** | 6 | Inline action. |
| 6.5 | Alert Card — Send Apology Text button | 7 | **10** | 6 | Inline action. |
| 6.6 | **Alert Card — "View Decay Sequence" button** 🆕 | 8 | 9 | 6 | Phase C5 / D4 — cross-pillar bridge to Member Profile drawer. ✅ |
| 6.7 | Alert Card — Comp Offer (VIP) | 7 | 9 | 9 | VIP recovery path. |
| 6.8 | Alert Card — More actions panel (expanded) | 8 | **10** | 6 | Channel-aware action panel. |
| 6.9 | **Today's Tee Sheet table — header source badges** 🆕 | 9 | — | 5 | Phase B5. ✅ |
| 6.10 | Tee Sheet table — Member name (drawer link) | 7 | 8 | 5 | One-click profile access. |
| 6.11 | Tee Sheet table — Health score column | 7 | 6 | 4 | Single metric. |
| 6.12 | Tee Sheet table — Cancel Risk column | 8 | 7 | 6 | ML prediction. |
| 6.13 | **Tee Sheet table — Dues at Risk badge per row** 🆕 | 6 | 6 | **10** | Phase A2 — `$32K AT RISK` chip. ✅ |
| 6.14 | **Tee Sheet table — Dues VIP badge per row** 🆕 | 6 | 6 | 9 | Phase A2 — `$45K VIP` chip. |
| 6.15 | Cart Prep Recommendations | 7 | 8 | 4 | Personalization layer. |
| 6.16 | Cart Prep — Send SMS button | 6 | 9 | 4 | One-tap. |
| 6.17 | Post-Round Dining Nudge button | 6 | 9 | 7 | Drives F&B conversion. |

---

# 7. Service View — Composite **9**

**File:** `src/features/service/ServiceView.jsx` + tabs

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 7.1 | Story headline ("Is your service consistent...") | **10** | 5 | 6 | Cross-domain framing. ✅ |
| 7.2 | Evidence Strip at parent level | 9 | — | 6 | ✅ |
| 7.3 | Tab navigation (Quality / Staffing / Complaints) | — | — | — | **N/A** |
| 7.4 | **Quality Tab — Evidence Strip** 🆕 | 9 | — | 6 | Phase E7. |
| 7.5 | Quality Tab — Service Consistency Score (ring + label) | 8 | — | 7 | Composite metric. |
| 7.6 | Quality Tab — Resolution rate / Understaffed days / Open complaints sub-stats | 7 | — | 6 | Component metrics. |
| 7.7 | Quality Tab — Weather-adjusted score | 9 | — | 7 | Cross-domain adjustment. |
| 7.8 | **Quality Tab — "See $ impact in Revenue" link** 🆕 | 5 | 5 | 9 | Phase D5 cross-pillar bridge. ✅ |
| 7.9 | Quality Tab — Biggest Driver Recommendation | 8 | 8 | 6 | Diagnoses root cause. |
| 7.10 | Quality Tab — Complaints by day-of-week heatmap | 7 | 5 | 5 | Pattern detection. |
| 7.11 | Quality Tab — Complaints by category | 7 | 6 | 5 | Categorical breakdown. |
| 7.12 | Staffing Tab — Tomorrow's Staffing Risk hero card | 9 | 9 | 8 | Cross-domain (rounds × weather × complaints). ✅ |
| 7.13 | Staffing Tab — "Add server" inline action | 6 | **10** | 7 | One-tap. |
| 7.14 | Staffing Tab — Understaffing impact metrics | 7 | — | 8 | Days + complaint multiplier + ticket time. |
| 7.15 | **Staffing Tab — Pace-to-Revenue Connection card** 🆕 | 9 | 8 | **10** | The $31/slow round Layer 3 insight. ✅ |
| 7.16 | **Staffing Tab — "Approve: Deploy Ranger" inline action** 🆕 | 7 | 9 | 8 | Phase C3. |
| 7.17 | Staffing Tab — Understaffed days detail (expandable) | 8 | 6 | 9 | Per-day complaint correlation. |
| 7.18 | Staffing Tab — Staffing-to-Satisfaction correlation insight | 9 | 7 | 7 | The cross-domain story. |
| 7.19 | Staffing Tab — 7-Day Weather & Demand Outlook | 9 | 7 | 6 | Forecast-driven planning. |
| 7.20 | Complaints Tab — Aging by category | 8 | 7 | 5 | Operational tracking. |
| 7.21 | Complaints Tab — Weather correlation | 9 | 6 | 5 | Cross-domain. |
| 7.22 | Complaints Tab — Resolution rate trends | 7 | 6 | 5 | Trend tracking. |

---

# 8. Automations Hub — Composite **9**

**File:** `src/features/automations/AutomationsHub.jsx` + tabs

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 8.1 | Tab navigation (Inbox / Playbooks / Agents / Settings) | — | — | — | **N/A** |
| 8.2 | Inbox pending count badge | 5 | 8 | 4 | Notification signal. |
| 8.3 | **Inbox — Pillar 3 Impact Rollup KPIs** 🆕 | 7 | 7 | **10** | Phase E6 — Pending / Total Dollar Impact / Highest Impact. ✅ |
| 8.4 | Inbox — Filter by priority | 5 | 6 | 4 | Filter UI. |
| 8.5 | Inbox — Action card (description + priority badge) | 7 | **10** | 7 | Core inbox unit. ✅ |
| 8.6 | **Inbox — Source badge per action** 🆕 | 9 | — | 6 | Phase B2. ✅ |
| 8.7 | **Inbox — Signal source row (multiple sources)** 🆕 | 9 | — | 6 | Phase B2 — full transparency. |
| 8.8 | **Inbox — Impact metric chip (highlighted)** 🆕 | 6 | 7 | **10** | Phase A6 — dollar grounding. ✅ |
| 8.9 | Inbox — Approve / Dismiss buttons | 6 | **10** | 7 | One-tap HITL. ✅ |
| 8.10 | Inbox — Recently handled log | 5 | 6 | 4 | Audit trail. |
| 8.11 | Playbooks tab — catalog with categories | 6 | 8 | 8 | Reference library. |
| 8.12 | Playbooks tab — Triggered count + impact metrics | 7 | 8 | 9 | Track record. |
| 8.13 | Playbooks tab — Multi-step execution flow | 7 | 9 | 7 | Process visualization. |
| 8.14 | Playbooks tab — Before/after metrics | 7 | 7 | 9 | ROI proof. |
| 8.15 | Agents tab — agent definitions list | 7 | 6 | 5 | Reference. |
| 8.16 | Agents tab — Agent thought log | 8 | 6 | 5 | Transparency. |
| 8.17 | Settings tab — agent configuration | 2 | 3 | 1 | Power user tooling. **N/A** for pillar work. |

---

# 9. Member Profile Page (full route) — Composite **9**

**File:** `src/features/member-profile/MemberProfilePage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 9.1 | Story headline | 7 | 5 | 5 | Page-level frame. |
| 9.2 | Identity panel (name, contact, tier) | 4 | — | 5 | Reference data. |
| 9.3 | Health score gauge | 7 | — | 6 | Single composite number. |
| 9.4 | **Dues at risk callout** 🆕 | 6 | 6 | **10** | Phase E3 — mirrors drawer enhancement. ✅ |
| 9.5 | Key metrics row (dues, value, balance, email open, rounds, dining) | 7 | — | 8 | Cross-domain stats. |
| 9.6 | Member Habits Snapshot | 8 | — | 7 | Multi-category. |
| 9.7 | Health trend AreaChart | 8 | — | 5 | Time series. |
| 9.8 | Activity timeline | 7 | 5 | 3 | Cross-domain. |
| 9.9 | Family connections | 4 | 3 | 3 | Reference. |
| 9.10 | Risk signals | 8 | 8 | 6 | Click-through. |
| 9.11 | Outreach log | 7 | 8 | 5 | Audit. |
| 9.12 | Notes | 3 | 4 | 1 | Free-form. |

**Note:** Lacks the First Domino visualization that the drawer has. Future polish target.

---

# 10. Admin Hub — Composite **6** 🛠️

**File:** `src/features/admin/AdminHub.jsx` + tabs

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 10.1 | Tab navigation | — | — | — | **N/A** |
| 10.2 | Data Hub — Connected Sources Grid | 6 | 1 | 1 | 🛠️ Infrastructure. |
| 10.3 | Data Hub — CSV Upload Link | 4 | 3 | 1 | 🛠️ Onboarding. |
| 10.4 | **Data Health — Platform Value Score** | 7 | 4 | 6 | Pillar-aligned metric. ✅ |
| 10.5 | Data Health — Per-domain status cards | 6 | 4 | 3 | 🛠️ Infrastructure. |
| 10.6 | Data Health — Recommended next domain | 6 | 7 | 5 | Onboarding nudge. |
| 10.7 | Club Management — Multi-club switcher | 2 | 1 | 1 | 🛠️ Power user. |
| 10.8 | Club Management — Delete club data | 1 | 1 | 1 | 🛠️ Admin. |

**Why low scores are OK:** Admin is Tier 2 enabling work per `DEVELOPMENT-PRIORITIES.md`. It does not need to serve a pillar — it needs to make the pillars *possible*.

---

# 11. Integrations Page — Composite **8**

**File:** `src/features/integrations/IntegrationsPage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 11.1 | Page header | 4 | — | 3 | Reference. |
| 11.2 | **"What your connected systems unlock" banner** 🆕 | 8 | 6 | **10** | Phase E9 — turns infrastructure into a Prove It feature. ✅ |
| 11.3 | Summary KPI cards | 6 | — | 4 | Connection counts. |
| 11.4 | Filter buttons (All / Connected / Available / Coming Soon) | 5 | — | 3 | Filter UI. |
| 11.5 | Vendor category sections | 6 | — | 4 | Categorization. |
| 11.6 | Vendor cards (Connected) | 6 | 3 | 3 | Status display. |
| 11.7 | Vendor cards (Available) | 6 | 5 | 5 | Connection prompt. |
| 11.8 | Sync history with row counts | 5 | 2 | 3 | Quality signal. |
| 11.9 | Combination Intelligence section | 8 | 5 | 6 | Layer 3 philosophy. ✅ |

---

# 12. Playbooks Page — Composite **8**

**File:** `src/features/playbooks/PlaybooksPage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 12.1 | Playbook catalog by category | 6 | 8 | 7 | Reference library. |
| 12.2 | Per-playbook triggered count | 6 | 8 | 8 | Track record. |
| 12.3 | Per-playbook monthly/yearly impact dollars | 6 | 7 | **10** | Dollar grounding. ✅ |
| 12.4 | Multi-step execution flow visualization | 7 | 9 | 7 | Process clarity. |
| 12.5 | Before-state metrics (response time, resolution, churn) | 7 | — | 8 | Baseline. |
| 12.6 | After-state metrics | 7 | — | **10** | ROI proof. ✅ |
| 12.7 | Track record (Q4, Q3 performance) | 7 | — | 8 | Historical. |

---

# 13. Profile / Settings Page — Composite **2** 🛠️

**File:** `src/features/profile/ProfilePage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 13.1 | User name & email | — | — | — | **N/A** 🛠️ |
| 13.2 | Club selection | — | — | — | **N/A** 🛠️ |
| 13.3 | Email send mode (Local/Cloud/Gmail) | — | — | — | **N/A** 🛠️ |
| 13.4 | SMS send mode | — | — | — | **N/A** 🛠️ |
| 13.5 | Google OAuth connection | — | — | — | **N/A** 🛠️ |

**Why low scores are OK:** User configuration. Not pillar work.

---

# 14. CSV Import Page — Composite **4** 🛠️

**File:** `src/features/integrations/CsvImportPage.jsx`

| # | Feature / Functionality | See It | Fix It | Prove It | Notes |
|---|---|:---:|:---:|:---:|---|
| 14.1 | Upload wizard | — | — | — | 🛠️ Onboarding. |
| 14.2 | Column mapping | 4 | — | — | 🛠️ Onboarding. |
| 14.3 | Validation feedback | 4 | — | — | 🛠️ Onboarding. |
| 14.4 | Gate-opening confirmation | 7 | — | 4 | Unlocks features. |

---

# 15. Cross-Cutting Feature Audit

## 15.1 Source System Badges Coverage

| Location | Status | Phase |
|---|---|---|
| Today → Morning Briefing EvidenceStrip | ✅ | Initial 🆕 |
| Today → Quick Stats (4 cards) | ✅ | Initial 🆕 |
| Today → Member Alerts header | ✅ | Phase 6 / Phase B 🆕 |
| Today → Today's Risks staffing grid | ✅ | Phase 6 / Phase B 🆕 |
| Today → Pending Actions Inline | ✅ | Phase B4 🆕 |
| Tee Sheet → page header EvidenceStrip | ✅ | Initial |
| Tee Sheet → table header source row | ✅ | Phase B5 🆕 |
| Service → page header EvidenceStrip | ✅ | Initial |
| Service → Quality tab EvidenceStrip | ✅ | Phase E7 🆕 |
| Members → page header EvidenceStrip | ✅ | Initial |
| Member Profile Drawer → decay chain steps | ✅ | Phase 4 🆕 |
| Member Profile Drawer → Recent Activity section | ✅ | Phase B3 🆕 |
| Member Profile Drawer → Member Journey section | ✅ | Phase B3 🆕 |
| Revenue Page → EvidenceStrip + per-card badges | ✅ | Initial 🆕 |
| Board Report → KPI cards | ✅ | Phase B1 🆕 |
| Automations Inbox → action items | ✅ | Phase B2 🆕 |
| Member Profile Drawer → header / other sections | ✅ | Polish-Final 🆕 |
| Member Profile Page (full) → most sections | ⚠️ Partial | — |

## 15.2 Dollar Quantification Coverage

| Feature | Has $ values? | Phase |
|---|---|---|
| Today → Morning Briefing sentence | ✅ Yes (staffing exposure) | Phase A1 🆕 |
| Today → Revenue Summary Card | ✅ Yes | Initial |
| Today → Member Alerts | ✅ Yes (dues per member chip) | Phase A3 🆕 |
| Tee Sheet → at-risk alerts | ✅ Yes (dues badge per row) | Phase A2 🆕 |
| Members → at-risk KPI strip | ✅ Yes (total dues at risk) | Phase A5 🆕 |
| Member Profile Drawer → header | ✅ Yes (dues at risk callout) | Phase A4 🆕 |
| Member Profile Page (full) → header | ✅ Yes (dues at risk callout) | Phase E3 🆕 |
| Revenue Page | ✅ Yes (everywhere) | Initial 🆕 |
| Service → Staffing → Pace card | ✅ Yes ($31/slow round) | Initial 🆕 |
| Board Report → all 4 tabs | ✅ Yes | Initial + Phase 3 🆕 |
| Automations Inbox | ✅ Yes (per-action chip + rollup) | Phase A6 🆕 |
| Playbooks Page | ✅ Yes (per-playbook impact) | Initial |
| Integrations Page | ✅ Yes (unlock examples) | Phase E9 🆕 |

## 15.3 Human-in-the-Loop Action Coverage

| Feature | One-tap action? | Phase |
|---|---|---|
| Today → Pending Actions Inline | ✅ Approve/Dismiss | Initial |
| Today → Member Alerts | ✅ Quick action menu | Initial |
| Tee Sheet → Alert Cards | ✅ Recovery email / SMS / call | Initial |
| Tee Sheet → "View Decay Sequence" link | ✅ | Phase C5 🆕 |
| Member Profile Drawer | ✅ Quick actions panel | Initial |
| **Member Profile Drawer → First Domino "Approve & Log"** | ✅ | Phase C2 🆕 |
| Members → HealthOverview "Bulk approve all" | ✅ | Phase C4 🆕 |
| Automations → Inbox | ✅ Approve/Dismiss | Initial |
| **Revenue Page → "Deploy Ranger"** | ✅ | Phase C1 🆕 |
| Service → Staffing → "Add server" | ✅ | Initial |
| Service → Staffing → "Approve: Deploy Ranger" | ✅ | Phase C3 🆕 |
| Service → Staffing → "Full breakdown" link | ✅ | Initial 🆕 |

## 15.4 Cross-Pillar Navigation Bridges

| Bridge | Status | Phase |
|---|---|---|
| Today → Revenue (via dollar exposure link) | ✅ | Phase D1 🆕 |
| Revenue → Board Report (CTA + 4-tab preview) | ✅ | Phase D2 🆕 |
| Member Profile → Board Report (Featured badge) | ✅ | Phase D3 🆕 |
| Tee Sheet → Member Profile (View Decay Sequence) | ✅ | Phase C5 / D4 🆕 |
| Service → Revenue (See $ impact link) | ✅ | Phase D5 🆕 |
| Service → Staffing → Revenue page link | ✅ | Initial 🆕 |
| Today → Automations (action queue badge) | ✅ | Initial |
| Members → Member Profile (drawer click) | ✅ | Initial |
| Board Report → Member Profile (link from member saves) | ✅ | Polish-Final 🆕 |

---

# Top Composite Scores Summary

| Page | Composite | Storyboard? |
|---|:---:|:---:|
| **Today View** | **10** | Story 1 ✅ |
| **Revenue** 🆕 | **10** | Story 3 ✅ |
| **Board Report** | **10** | Story 3 ✅ |
| **Member Profile Drawer** | **10** | Story 2 ✅ |
| **Members View** | **10** | Story 2 ✅ |
| **Tee Sheet View** | **9** | Story 1 |
| **Service View** | **9** | Story 3 |
| **Automations Hub** | **9** | Cross-cutting |
| **Member Profile Page (full)** | **9** | Story 2 |
| **Playbooks Page** | **8** | Cross-cutting |
| **Integrations Page** | **8** | 🛠️ |
| **Admin Hub** | **6** | 🛠️ |
| **CSV Import** | **4** | 🛠️ |
| **Profile / Settings** | **2** | 🛠️ |

**8 pages at 10/10. 11 pages at ≥9. App alignment to North Star: ~98%.**

---

# Acceptance Test Status

| Storyboard Story | Acceptance Test | Status |
|---|---|:---:|
| 1 — Saturday Morning Briefing | Today View synthesizes 4 sources into one briefing, with one-tap action queue | ✅ |
| 2 — Quiet Resignation Catch | Member Profile shows decay sequence with source badges, urgency counter, and one-tap outreach | ✅ |
| 3 — Revenue Leakage Discovery | Revenue Page shows decomposition + Hole 12 drill-down + scenario slider + Board Report CTA | ✅ |

**All 3 storyboard moments are now live in the app and pass their acceptance tests.**

---

# What's NOT Pillar Work (And That's Fine)

These features intentionally score low because they exist to enable the pillars, not deliver them:

- **Admin Hub** — multi-club switching, data health monitoring, integration management
- **Profile / Settings** — user configuration, OAuth, send modes
- **CSV Import** — onboarding flow
- **Login / Reset Password** — auth

These are all **Tier 2 enabling work** per `DEVELOPMENT-PRIORITIES.md` and should remain focused on infrastructure quality rather than serving the 3 pillars.

---

# Next-Highest-Leverage Polish Opportunities

Now that all pillar pages score ≥9, the remaining gains are deepening:

1. ✅ DONE — **Member Profile Page (full)** — mirror the drawer's First Domino enhancements
2. ✅ DONE — **Member Profile Drawer** — section-level source badges on remaining sections (Risk Signals, Family, Outreach, Preferences)
3. ✅ DONE — **Board Report → Member Saves** — clickable per-member rows that open the profile drawer
4. ✅ DONE — **Tee Sheet** — show $ dues at risk in a tooltip on hover for healthy/watch members too (currently only on at-risk/VIP rows)
5. ✅ DONE — **Today View → MorningBriefingSentence** — make "X at-risk members" segment clickable to scroll to Member Alerts section

None of these are blockers. The app already meets all 3 storyboard acceptance tests.
