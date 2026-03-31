# SWOOP GOLF V3 — Complete Development Plan
## Survey-Validated MVP Realignment

**Created:** March 31, 2026
**Last Updated:** March 31, 2026
**Goal:** Realign the prototype so the product matches what operators actually said they'd buy

---

## HOW TO USE THIS DOCUMENT

This document is written so that a developer with **zero prior knowledge** of this project can:

1. Understand what the product is and why this work is happening
2. Know the exact tech stack, folder structure, and architecture patterns
3. Execute every task in order, knowing which files to touch
4. Verify each sprint was completed correctly with concrete checklists
5. Know what "done" looks like at the end of each phase

**Read Sections 1-3 for context. Execute Sections 4-9 for the work.**

---

## TABLE OF CONTENTS

1. [Product Context](#1-product-context)
2. [Why This Work Is Happening](#2-why-this-work-is-happening)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Phase 1: Navigation Restructure + New Service Page](#4-phase-1-navigation-restructure--new-service-page-weeks-1-2)
5. [Phase 2: Simplify Existing Pages](#5-phase-2-simplify-existing-pages-weeks-2-3)
6. [Phase 3: Playbooks & Actions Simplification](#6-phase-3-playbooks--actions-simplification-weeks-3-4)
7. [Phase 4: Messaging & Framing Realignment](#7-phase-4-messaging--framing-realignment-weeks-4-5)
8. [Phase 5: Code Cleanup](#8-phase-5-code-cleanup-weeks-5-6)
9. [Phase 6: Post-MVP Features](#9-phase-6-post-mvp-features-weeks-7-plus)
10. [Key Files Reference](#10-key-files-reference)
11. [Glossary](#11-glossary)

---

## 1. PRODUCT CONTEXT

### What Is Swoop Golf?

Swoop Golf is a **cross-domain intelligence platform** for private club General Managers. It connects the disconnected systems a club already uses (CRM, tee sheet, POS, email, scheduling, weather) and surfaces insights that no single system can produce on its own.

### Who Is the Buyer?

- **Economic buyer:** General Manager or GM/COO — signs the check, reports to the board
- **Daily user:** GM, F&B Director, Director of Golf, department heads
- **Board:** Monthly read-only consumers of the Board Report

### What Is the Current Prototype?

A React 18 + Vite 5 app deployed on Vercel. It has:

- **7 primary nav items:** Today, Members, Revenue, Insights, Actions, Board Report, Admin
- **37 feature folders** (most hidden/legacy)
- **300 demo members** with health scores, archetypes, engagement data
- **6 playbooks** for service recovery, retention, and staffing
- **49-table Postgres schema** (Neon via Vercel Postgres)
- Static demo data in `src/data/` with Phase 2 API swap pattern via `src/services/`

### Deployed At

- **Production:** Auto-deploys from `dev` branch on Vercel
- **Team:** `tyhayesswoopgolfcos-projects`

---

## 2. WHY THIS WORK IS HAPPENING

### The Problem

An independent product audit compared raw survey data (10-club + 4-response surveys), the 3 Layers strategic framework, and the current prototype. The finding:

**The prototype has drifted into a "member retention dashboard" when the surveys say GMs would buy an "operational intelligence cockpit" first.**

### Survey Priority Order (What GMs Actually Want)

| Rank | Outcome | Survey Signal |
|------|---------|---------------|
| **#1** | Service consistency across shifts/seasons | **70%** selected as top-3 outcome |
| **#2** | Better staffing to match real demand | **60%** selected as top-3 outcome |
| **#3** | Real-time member risk visibility | **50%** selected as top-3 outcome |
| #4 | Eliminate F&B profit leakage | 30% |
| #5 | Consolidate disconnected tools | 20% |

### What the Prototype Emphasizes (Inverted)

| Rank | Current Emphasis | Problem |
|------|-----------------|---------|
| #1 | Member health / churn prevention | Over-indexed — dominates nav, Today view, messaging |
| #2 | Revenue leakage | Entire standalone page |
| #3 | Cross-domain analytics | Entire standalone page (Insights) |
| #4 | Service consistency | **No dedicated view** — buried in Revenue sub-tab |
| #5 | Staffing intelligence | **No dedicated view** — buried in Revenue sub-tab |

### What Needs to Change

| Before | After |
|--------|-------|
| 7 nav items | 5 nav items |
| No Service page | **New Service & Staffing page** (addresses #1 + #2 demand) |
| Revenue + Insights as standalone pages | Removed — content merged into Service + Members |
| Actions as standalone page | Drawer/overlay accessible from any page |
| 6 tabs on Members | 3 tabs |
| 4 tabs on Board Report | 2 tabs |
| 5 tabs on Admin | 2 tabs |
| 6 playbooks | 3 playbooks |
| Projected ROI numbers everywhere | Track records only |
| Today view with 6+ sections | Today view with 3 focused sections |
| Retention-first messaging | Operations-first messaging |

### Target Navigation

**Before:** Today | Members | Revenue | Insights | Actions | Board Report | Admin

**After:** Today | Service | Members | Board Report | Admin

---

## 3. TECH STACK & ARCHITECTURE

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Charts | Recharts |
| Routing | Hash-based (`#/route`) via `NavigationContext` (not React Router paths) |
| State | React Context (`AppContext`, `NavigationContext`, `MemberProfileContext`) |
| Styling | Inline styles via `theme.js` design tokens |
| Database | Neon PostgreSQL via Vercel Postgres |
| Deployment | Vercel (auto-deploy on push to `dev`) |
| Backend | Serverless functions in `api/` folder |

### Data Flow (Strictly Enforced)

```
src/data/*.js  →  src/services/*.js  →  src/features/  →  src/components/
```

- `data/` files export raw arrays and objects. Nothing else imports them.
- `services/` are the **only** files that touch `data/`.
- `features/` import from `services/` and pass shaped data down as props.
- `components/ui/` and `components/charts/` receive props only.
- **Phase 2 API swap:** Only `services/` files change when switching from static data to live APIs.

### Key Architecture Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main router — `ROUTES` object maps route keys to components |
| `src/config/navigation.js` | `navItems` array — defines all nav items with `section: 'PRIMARY'` or `'HIDDEN'` |
| `src/config/theme.js` | Design tokens — colors, fonts, spacing, shadows |
| `src/config/constants.js` | `DEMO_MONTH`, `isRealClub()`, `getClubName()` |
| `src/context/NavigationContext.jsx` | Route state, `VALID_ROUTES` set, `ROUTE_REDIRECTS` map, `navigate()` function |
| `src/context/AppContext.jsx` | Global state: playbooks, inbox, agents, `activeCount`, `totalRevenueImpact`, `pendingAgentCount` |
| `src/context/MemberProfileContext.jsx` | Member drawer open/close state |
| `src/components/layout/Sidebar.jsx` | Dark sidebar nav — reads `NAV_ITEMS`, renders PRIMARY items, shows badges |
| `src/components/ui/StoryHeadline.jsx` | Page-level headline component with variant styling |
| `src/components/ui/EvidenceStrip.jsx` | Data source indicator strip |
| `src/components/ui/Panel.jsx` | Tabbed container component |

### Design System Rules

| Rule | Detail |
|------|--------|
| Colors | **Never** hardcoded. Always `theme.colors.*` from `config/theme.js` |
| Fonts | Plus Jakarta Sans (body), JetBrains Mono (numbers) — via `theme.fonts.*` |
| Card pattern | `background: theme.colors.bgCard`, `border: 1px solid ${theme.colors.border}`, `borderRadius: theme.radius.lg` |
| Page layout | `StoryHeadline` → `EvidenceStrip` → content sections, all in a flex column with `gap: theme.spacing.lg` |
| Loading | Use `SkeletonDashboard` or `SkeletonGrid` with 600ms fake delay |
| Transitions | Wrap page content in `<PageTransition>` |

### Folder Structure (What Matters)

```
src/
├── App.jsx                      # Router + ROUTES map
├── config/
│   ├── navigation.js            # Nav item definitions
│   ├── theme.js                 # Design tokens
│   └── constants.js             # Shared constants
├── context/
│   ├── AppContext.jsx            # Playbooks, inbox, agents state
│   ├── NavigationContext.jsx     # Route state + redirects
│   └── MemberProfileContext.jsx  # Member drawer state
├── components/
│   ├── layout/
│   │   └── Sidebar.jsx          # Dark sidebar navigation
│   └── ui/                      # 50+ reusable components
├── data/                        # Static demo data (23 files)
├── services/                    # Data access layer (20 services)
├── features/                    # Feature folders (one per page/module)
│   ├── today/                   # Today view (morning briefing)
│   ├── members/                 # Members page
│   ├── revenue/                 # Revenue page (to be removed)
│   ├── experience-insights/     # Insights page (to be removed)
│   ├── actions/                 # Actions page (to become drawer)
│   ├── board-report/            # Board Report
│   ├── admin/                   # Admin hub
│   ├── member-health/           # Member health tabs (used by Members page)
│   ├── member-profile/          # Member profile page + drawer
│   ├── playbooks/               # Playbook definitions + UI
│   ├── revenue-leakage/         # Legacy revenue components (reused by Revenue page)
│   ├── daily-briefing/          # Legacy briefing components (reused by Today)
│   ├── agent-command/           # Agent inbox tabs (used by Actions page)
│   ├── login/                   # Auth + new club setup
│   └── [17 more legacy/hidden folders to be deleted]
└── hooks/                       # Custom hooks
```

---

## 4. PHASE 1: NAVIGATION RESTRUCTURE + NEW SERVICE PAGE (Weeks 1-2)

### Sprint 1.1: Create the Service & Staffing Page

**Why:** The #1 survey demand (service consistency, 70%) and #2 demand (staffing-to-demand, 60%) have zero dedicated surfaces. Content is buried under Revenue as sub-tabs. This sprint creates a new top-level page.

#### Task 1.1.1: Create the feature folder

Create `src/features/service/` with two files:

**File: `src/features/service/index.js`**
```js
export { default as ServiceView } from './ServiceView';
```

**File: `src/features/service/ServiceView.jsx`**

This is a new page component. Follow the exact same layout pattern used by `MembersView.jsx`:

1. `<PageTransition>` wrapper
2. `<StoryHeadline>` at top
3. `<EvidenceStrip>` showing data sources
4. Tab switcher (pill-style, same component pattern as MembersView line 86-114)
5. Tab content below

**Headline text:** `"Is your service consistent across shifts, outlets, and days — and where's the risk?"`

**Context text:** `"Cross-domain view connecting staffing levels, complaint patterns, and pace of play to service quality outcomes."`

**Evidence strip systems:** `['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather']`

**Exactly 3 tabs:**

| Tab Key | Tab Label | Content |
|---------|-----------|---------|
| `quality` | Quality | Service quality metrics by shift (AM/PM), by outlet, by day of week |
| `staffing` | Staffing | Staffing-to-demand intelligence + understaffed day analysis |
| `complaints` | Complaints | Complaint patterns by shift, outlet, time block, and resolution status |

#### Task 1.1.2: Build the Quality tab

Create `src/features/service/tabs/QualityTab.jsx`.

This tab shows service consistency scores. Build it using existing data:

**Data sources:**
- `import { feedbackRecords, feedbackSummary } from '@/data/staffing'` — complaint data with dates, categories, outlets
- `import { understaffedDays } from '@/data/staffing'` — days with staffing gaps
- `import { paceFBImpact, slowRoundStats } from '@/data/pace'` — pace impact on dining

**What to render:**
1. **Service Consistency Score** — derive from complaint rate + resolution rate + pace data. Show as a large number with color coding (green/amber/red) using the same conic-gradient circle pattern from TodayView lines 76-88.
2. **By Shift** — AM vs PM complaint rates. Use the `feedbackRecords` array, categorize by time of day from the `date` field.
3. **By Outlet** — Group `feedbackRecords` by outlet. Currently most are "Grill Room" but the structure supports multiple outlets.
4. **By Day of Week** — Group understaffed days and complaints by weekday. Show which days have the worst service consistency.

**Component pattern:** Use `theme.colors.bgCard` cards in a CSS grid, same as the KPI cards in RevenueView lines 91-99. Each card shows a metric with label.

#### Task 1.1.3: Build the Staffing tab

Create `src/features/service/tabs/StaffingTab.jsx`.

**This is the most important tab.** It answers: "Based on tomorrow's bookings + weather + events, how should we staff each outlet?"

**Data sources:**
- `import { understaffedDays } from '@/data/staffing'` — historical understaffed days
- `import { getDailyBriefing } from '@/services/briefingService'` — today's context
- Import the existing `StaffingImpactTab` from `@/features/revenue-leakage/tabs/StaffingImpactTab` — **reuse its content directly** but reframe the headline from revenue language to service language

**What to render:**
1. **Tomorrow's Staffing Risk** card — "Saturday: Grill Room needs 4 servers but 2 scheduled. Based on 220 rounds + Dining Event." This is the single most actionable cross-domain insight. The 4-response survey showed 4/4 respondents would act on "Add server based on weather + demand."
2. **Understaffed Day History** — Reuse the `StaffingImpactTab` component content, but change the headline from "Understaffing = Service Failures = Lost Revenue" to "Understaffing = Inconsistent Service"
3. **Staffing-to-Satisfaction Correlation** — Simple chart showing that understaffed days produce 2x complaint rate (data already in `understaffedDays[].complaintMultiplier`)

#### Task 1.1.4: Build the Complaints tab

Create `src/features/service/tabs/ComplaintsTab.jsx`.

**Data sources:**
- `import { feedbackRecords, feedbackSummary } from '@/data/staffing'` — all complaint data

**What to render:**
1. **Open Complaints** — filter `feedbackRecords` where `status !== 'resolved'`. Show member name (via `MemberLink` component), date, category, status, and days since filed.
2. **Complaint Drivers** — bar chart of `feedbackSummary` categories (Service Speed, Food Quality, Pace of Play, Course Condition). Reuse the bar chart pattern from `feedbackSummary`.
3. **Understaffed Day Correlation** — highlight complaints that occurred on understaffed days (`isUnderstaffedDay === true`). Show "5 of 8 complaints this month occurred on understaffed days."
4. **Pace Impact on Dining** — Reuse content from `PaceImpactTab` but reframe: "When pace exceeds 4:30, post-round dining conversion drops from 41% to 22%."

#### Task 1.1.5: Register the route

**File: `src/App.jsx`**

Add import at top:
```js
import { ServiceView } from '@/features/service';
```

Add to `ROUTES` object (line ~46):
```js
'service': ServiceView,
```

**File: `src/context/NavigationContext.jsx`**

Add `'service'` to the `VALID_ROUTES` Set (line ~8).

Add redirect: `'revenue': 'service'` and `'insights': 'service'` to `ROUTE_REDIRECTS` (around line 38). These replace the existing entries that point to `'revenue'` and `'insights'`.

#### Task 1.1.6: Wire the Service page index export

Ensure `src/features/service/index.js` exports `ServiceView` as shown in Task 1.1.1.

---

### Sprint 1.1 Verification Checklist

- [ ] Navigate to `#/service` — page renders with StoryHeadline, EvidenceStrip, and 3 tabs
- [ ] Quality tab shows service consistency metrics with shift/outlet/day breakdowns
- [ ] Staffing tab shows "Tomorrow's Staffing Risk" card and understaffed day analysis
- [ ] Complaints tab shows open complaints, drivers, and understaffed-day correlation
- [ ] Navigate to `#/revenue` — redirects to `#/service`
- [ ] Navigate to `#/insights` — redirects to `#/service`
- [ ] No console errors
- [ ] `npm run build` succeeds

---

### Sprint 1.2: Simplify the Today View

**Why:** The Today view currently has 8+ sections competing for attention. A cockpit should show 3 things: where is today at risk, which members need attention, and what actions are pending.

**File to edit: `src/features/today/TodayView.jsx`** (currently 282 lines)

#### Task 1.2.1: Remove the Health Score Hero

Delete lines 63-123 in `TodayView.jsx` — the entire `{/* Health Score Hero */}` block with the conic-gradient circle and tier distribution badges. This is the biggest visual element on the page and it frames the product as a retention dashboard.

#### Task 1.2.2: Replace with "Today's Risks" section

Create a new component `src/features/today/TodaysRisks.jsx`:

**Data sources:**
- `import { getDailyBriefing } from '@/services/briefingService'`
- `import { getPriorityItems } from '@/services/cockpitService'`
- `import { understaffedDays } from '@/data/staffing'`

**What to render:**
A card grid (2-3 cards) showing today's operational risks:
1. **Service Risk** — Any understaffed outlets today? Any open complaints > 7 days?
2. **Tomorrow's Staffing** — "Saturday: Grill Room 2 servers short" (reuse logic from Service page)
3. **Weather Impact** — If relevant weather data affects tomorrow's operations

Use the same card pattern as the existing `TodayMode` component — simple cards with a title, a key metric, and a one-line recommendation.

#### Task 1.2.3: Simplify "Members Needing Attention"

Keep the existing `StoryHeadline` for the top priority (lines 126-147), but change it to show the top 3 priority members as a compact list instead of just 1.

Replace the `SinceLastVisit` component (line 150) with a simple "3 members changed status this week" summary linking to the Members page.

#### Task 1.2.4: Keep Pending Actions as compact inline

Keep the existing `PendingActionsInline` component (line 161). This stays.

#### Task 1.2.5: Remove these sections from TodayView

Remove these components/sections from the render:
- `<StalenessAlert />` (line 61) — move to Admin > Data Health
- `<MorningBriefing />` (lines 153-155) — redundant with new Risks section
- `<RevenueSummaryCard />` (line 164) — revenue framing removed
- `<RecentInterventions />` (line 167) — Phase 2
- `<LogFeedbackButton />` (line 170) — Phase 2
- The entire "Performance Review" section with `<WeekOverWeekGrid />` (lines 178-204) — Phase 2
- The `GettingStartedChecklist` function (lines 211-281) — update step references (remove "Explore the Revenue breakdown", add "Check the Service page")

#### Task 1.2.6: Update TodayView imports

Remove unused imports after deleting sections:
- Remove: `SinceLastVisit`, `RevenueSummaryCard`, `WeekOverWeekGrid`, `MorningBriefing`, `RecentInterventions`, `StalenessAlert`
- Add: `TodaysRisks` (the new component)

**Final TodayView structure should be approximately:**
```jsx
<PageTransition>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <TodaysRisks />
    <StoryHeadline ... /> {/* Top priority member */}
    <PendingActionsInline />
    {isOnboarding && <GettingStartedChecklist />}
  </div>
</PageTransition>
```

---

### Sprint 1.2 Verification Checklist

- [ ] Today page loads with 3 clear sections: Risks, Priority Member, Pending Actions
- [ ] No Health Score hero circle visible
- [ ] No Revenue Summary card visible
- [ ] No Week-over-Week grid visible
- [ ] No Staleness Alert on Today (check it moved to Admin)
- [ ] "Tomorrow's Staffing" card appears in the Risks section
- [ ] Page feels like a "cockpit" — focused on what needs attention NOW
- [ ] `npm run build` succeeds

---

### Sprint 1.3: Update Navigation from 7 to 5 Items

**Why:** Remove Revenue and Insights as standalone destinations. Make Actions a drawer overlay.

#### Task 1.3.1: Update navigation.js

**File: `src/config/navigation.js`**

Change the PRIMARY section to have exactly 5 items. Move `revenue`, `insights`, and `actions` to HIDDEN.

Replace the current PRIMARY items (lines 10-73) with:

```js
// PRIMARY — The 5 MVP nav items
{
  key: 'today',
  label: 'Today',
  section: 'PRIMARY',
  icon: '🎯',
  color: theme.colors.navBriefing,
  subtitle: 'Morning cockpit: risks, members, and pending actions.',
  sourceSystems: ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Weather', 'Complaints'],
},
{
  key: 'service',
  label: 'Service',
  section: 'PRIMARY',
  icon: '⚙️',
  color: theme.colors.navOperations,
  subtitle: 'Service quality, staffing intelligence, and complaint patterns.',
  sourceSystems: ['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather'],
},
{
  key: 'members',
  label: 'Members',
  section: 'PRIMARY',
  icon: '👥',
  color: theme.colors.navMembers,
  subtitle: 'At-risk members, health scores, and member directory.',
  sourceSystems: ['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email'],
},
{
  key: 'board-report',
  label: 'Board Report',
  section: 'PRIMARY',
  icon: '📊',
  color: theme.colors.navDemo,
  subtitle: 'Monthly executive summary — service quality, member health, and impact.',
  sourceSystems: ['All Systems'],
  // REMOVED: badge: '16:1 ROI'
},
{
  key: 'admin',
  label: 'Admin',
  section: 'PRIMARY',
  icon: '⚙️',
  color: theme.colors.navIntegrations,
  subtitle: 'Integrations and data health.',
  sourceSystems: ['Postgres'],
},
```

Add `revenue`, `insights`, and `actions` to the HIDDEN section with `hidden: true`.

#### Task 1.3.2: Update Sidebar.jsx — Remove revenue impact badge

**File: `src/components/layout/Sidebar.jsx`**

Delete lines 86-95 — the entire revenue impact badge block that shows `{activeCount} PLANS ACTIVE` and `+${totalRevenueImpact}K/yr`.

#### Task 1.3.3: Update Sidebar.jsx — Remove ROI badge rendering

Delete lines 164-179 — the `item.badge` rendering block that shows "16:1 ROI" on Board Report.

#### Task 1.3.4: Update Sidebar.jsx — Add pending actions badge

The existing pending actions badge on the `actions` nav item (lines 146-163) should now be shown on the sidebar footer area instead, since `actions` is no longer a PRIMARY nav item.

Add a floating action badge near the bottom of the sidebar (above the environment badge, around line 186). When clicked, it opens the Actions drawer:

```jsx
{pendingAgentCount > 0 && (!sidebarCollapsed || isMobile) && (
  <button
    onClick={() => {/* open actions drawer — see Task 1.3.5 */}}
    style={{
      margin: '0 12px 8px',
      padding: '10px 12px',
      background: `${theme.colors.accent}12`,
      border: `1px solid ${theme.colors.accent}30`,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: 'calc(100% - 24px)',
    }}
  >
    <span style={{ fontSize: '14px' }}>⚡</span>
    <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT_LIGHT }}>
      {pendingAgentCount} pending action{pendingAgentCount !== 1 ? 's' : ''}
    </span>
  </button>
)}
```

#### Task 1.3.5: Create the Actions Drawer

Create `src/components/layout/ActionsDrawer.jsx`.

This is a slide-in panel (similar to `MemberProfileDrawer.jsx`) that opens from the right side of the screen. It shows the pending actions list with approve/dismiss buttons.

**Implementation:**
1. Create a new context value `isActionsDrawerOpen` + `toggleActionsDrawer` — add to `AppContext.jsx` or create a simple local state in `App.jsx`
2. The drawer renders the existing `InboxTab` component from `@/features/agent-command/tabs/InboxTab`
3. Drawer is 480px wide, slides in from right, with a dark overlay
4. Close button in top-right corner
5. Title: "Pending Actions (X)"

**Mount it in `App.jsx`** next to the existing `<MemberProfileDrawer />` (around line 120 of App.jsx).

#### Task 1.3.6: Update NavigationContext.jsx redirects

**File: `src/context/NavigationContext.jsx`**

Update `ROUTE_REDIRECTS` so that all revenue-related and insights-related routes point to `'service'`:

```js
// Revenue-related → Service
'revenue': 'service',
'revenue-leakage': 'service',
'fb-performance': 'service',
'operations': 'service',
'staffing-service': 'service',

// Insights-related → Service
'insights': 'service',
'experience-insights': 'service',

// Actions-related → Today (drawer opens from any page)
'actions': 'today',
'playbooks-automation': 'today',
'agent-command': 'today',
```

#### Task 1.3.7: Remove unused imports from App.jsx

After navigation changes, several imports in `App.jsx` are no longer directly referenced in PRIMARY routes but still needed for ROUTES (backward compat). Keep them in the ROUTES object for now — they'll be deleted in Phase 5.

---

### Sprint 1.3 Verification Checklist

- [ ] Sidebar shows exactly 5 items: Today, Service, Members, Board Report, Admin
- [ ] No revenue impact badge (`+$XXK/yr`) visible in sidebar
- [ ] No "16:1 ROI" badge on Board Report nav item
- [ ] Pending actions count badge appears in sidebar (when actions exist)
- [ ] Clicking the pending actions badge opens the Actions drawer from the right
- [ ] Actions drawer shows pending actions with approve/dismiss
- [ ] Navigating to `#/revenue` redirects to `#/service`
- [ ] Navigating to `#/insights` redirects to `#/service`
- [ ] Navigating to `#/actions` redirects to `#/today`
- [ ] `npm run build` succeeds

---

## 5. PHASE 2: SIMPLIFY EXISTING PAGES (Weeks 2-3)

### Sprint 2.1: Simplify the Members Page (6 tabs → 3 tabs)

**Why:** No MVP page should exceed 3 tabs. Currently the Members page renders 6 sub-sections in At-Risk mode.

**File: `src/features/members/MembersView.jsx`**

#### Task 2.1.1: Remove collapsible sections from At-Risk mode

In MembersView.jsx, the At-Risk mode (lines 147-163) currently renders:
```
HealthOverview
ResignationTimeline
CollapsibleSection: Archetypes
CollapsibleSection: Email Decay
CollapsibleSection: Recovery
CollapsibleSection: First 90 Days
```

**Replace with just:**
```jsx
{mode === 'at-risk' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
    <HealthOverview />
  </div>
)}
```

This keeps only the Health Overview tab content in At-Risk mode. The `ResignationTimeline` moves into `HealthOverview` (see next task).

#### Task 2.1.2: Merge ResignationTimeline into HealthOverview

**File: `src/features/member-health/tabs/HealthOverview.jsx`**

Import `ResignationTimeline` and add it at the bottom of the HealthOverview component:
```js
import ResignationTimeline from '../ResignationTimeline';
// ... at the end of the render:
<ResignationTimeline />
```

#### Task 2.1.3: Remove unused tab imports from MembersView.jsx

Remove these imports (lines 15-19):
```js
// DELETE these:
import ArchetypeTab from '@/features/member-health/tabs/ArchetypeTab';
import EmailTab from '@/features/member-health/tabs/EmailTab';
import RecoveryTab from '@/features/member-health/tabs/RecoveryTab';
import CohortTab from '@/features/member-health/tabs/CohortTab';
import ResignationTimeline from '@/features/member-health/ResignationTimeline';
```

Also remove the `CollapsibleSection` import (line 4).

#### Task 2.1.4: Update the At-Risk headline

**File: `src/features/members/MembersView.jsx`** — update the HEADLINES object (lines 28-36).

Change the `'at-risk'` headline from:
```js
headline: `${atRisk} members at risk — $${...}K/yr in dues need attention.`,
```
To:
```js
headline: `${atRisk} members need attention — here's what to do.`,
context: 'Members showing multi-domain disengagement patterns across golf, dining, and events.',
```

Remove the dollar amount from the headline. It frames the product as a retention tool instead of an intelligence platform.

---

### Sprint 2.1 Verification Checklist

- [ ] Members page At-Risk mode shows HealthOverview only (no Archetypes, Email, Recovery, Cohorts sections)
- [ ] ResignationTimeline appears at the bottom of HealthOverview
- [ ] All Members mode still works (search, filter)
- [ ] Headline says "X members need attention" — no dollar amounts
- [ ] No console errors from removed imports
- [ ] `npm run build` succeeds

---

### Sprint 2.2: Simplify Board Report (4 tabs → 2 tabs)

**File: `src/features/board-report/BoardReport.jsx`**

#### Task 2.2.1: Reduce tabs

The `tabNames` array (line 10) is currently:
```js
const tabNames = ['Summary', 'Member Saves', 'Operational Saves', 'What We Learned'];
```

Change to:
```js
const tabNames = ['Summary', 'Details'];
```

#### Task 2.2.2: Merge tab content

The "Details" tab should render the content from both "Member Saves" and "Operational Saves" as sequential sections. Find the tab rendering logic (look for a switch/conditional on the active tab index) and merge the two into a single scrollable view under "Details."

#### Task 2.2.3: Remove the "What We Learned" tab content

Delete or comment out the rendering logic for the 4th tab.

#### Task 2.2.4: Update the page subtitle

Change the subtitle from "Monthly executive summary — retention, revenue, and operational saves" to:
```
"Monthly executive summary — service quality, member health, and impact."
```

---

### Sprint 2.2 Verification Checklist

- [ ] Board Report shows exactly 2 tabs: Summary, Details
- [ ] Details tab shows both member saves and operational saves as sections
- [ ] No "What We Learned" tab visible
- [ ] Page subtitle mentions "service quality" not "retention"
- [ ] `npm run build` succeeds

---

### Sprint 2.3: Simplify Admin (5 tabs → 2 tabs)

**File: `src/features/admin/AdminHub.jsx`**

#### Task 2.3.1: Reduce ADMIN_TABS

The `ADMIN_TABS` array (lines 16-22) is currently:
```js
const ADMIN_TABS = [
  { key: 'data-hub', label: 'Integrations', icon: '🔌' },
  { key: 'health', label: 'Data Health', icon: '🩺' },
  { key: 'activity', label: 'CSV Import', icon: '📥' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'settings', label: 'User Roles', icon: '👤' },
];
```

Change to:
```js
const ADMIN_TABS = [
  { key: 'data-hub', label: 'Integrations', icon: '🔌' },
  { key: 'health', label: 'Data Health', icon: '🩺' },
];
```

#### Task 2.3.2: Remove tab content rendering

Delete these lines from the render (around lines 61-63):
```jsx
{activeTab === 'activity' && <CsvImportHub />}
{activeTab === 'notifications' && <NotificationSettings />}
{activeTab === 'settings' && <UserRolesTab />}
```

#### Task 2.3.3: Remove unused imports

Remove these imports from AdminHub.jsx:
```js
import NotificationSettings from '@/features/notification-settings/NotificationSettings';
import { CsvImportHub } from '@/features/csv-import';
```

#### Task 2.3.4: Update subtitle

Change the subtitle (line 33) from:
```
"Integrations, data health, CSV imports, notifications, and user roles."
```
To:
```
"Integrations and data health monitoring."
```

---

### Sprint 2.3 Verification Checklist

- [ ] Admin page shows exactly 2 tabs: Integrations, Data Health
- [ ] No CSV Import, Notifications, or User Roles tabs visible
- [ ] Subtitle updated
- [ ] `npm run build` succeeds

---

### Sprint 2.4: Remove Projected ROI Numbers

**Why:** Showing made-up ROI numbers ($216K/yr, 16:1 ROI) on a product with zero real customers risks credibility. Replace with track records.

#### Task 2.4.1: Remove ROI from playbooks

**File: `src/features/playbooks/PlaybooksPage.jsx`**

In the `PLAYBOOKS` array (starts at line 11), for each playbook object:
- Remove `monthlyImpact` and `yearlyImpact` fields
- Keep `trackRecord` arrays — these are the credible evidence

Find where `monthlyImpact` and `yearlyImpact` are rendered in the JSX (search for `monthlyImpact` and `yearlyImpact`) and delete those display elements. Replace with a stronger emphasis on the `trackRecord` data.

#### Task 2.4.2: Remove revenue impact from Sidebar

Already handled in Sprint 1.3 Task 1.3.2. Verify it's done.

#### Task 2.4.3: Remove ROI from AppContext

**File: `src/context/AppContext.jsx`**

The `PLAYBOOK_DEFS` object (lines 14-20) defines monthly/annual revenue impact:
```js
const PLAYBOOK_DEFS = {
  'slow-saturday': { monthly: 8400, annual: 100800 },
  'service-save': { monthly: 18000, annual: 216000 },
  ...
};
```

These feed `totalRevenueImpact` which is consumed by the Sidebar. Since the Sidebar badge was removed in Sprint 1.3, verify that `totalRevenueImpact` is no longer rendered anywhere. If it's only used by the deleted Sidebar badge, you can leave the data in place (no harm) or clean it up.

#### Task 2.4.4: Remove ROI badge from navigation.js

Already handled in Sprint 1.3 Task 1.3.1 — verify the `badge: '16:1 ROI'` line was removed from the board-report nav item.

---

### Sprint 2.4 Verification Checklist

- [ ] No playbook shows "$XXK/yr" or "$XXK/mo" projected impact numbers
- [ ] Playbooks show track records: "3 of 4 members retained (Q4 2025)"
- [ ] No `+$XXK/yr` badge in sidebar
- [ ] No "16:1 ROI" badge on Board Report
- [ ] `npm run build` succeeds

---

## 6. PHASE 3: PLAYBOOKS & ACTIONS SIMPLIFICATION (Weeks 3-4)

### Sprint 3.1: Reduce Playbooks from 6 to 3

**File: `src/features/playbooks/PlaybooksPage.jsx`**

#### Task 3.1.1: Filter the PLAYBOOKS array

The `PLAYBOOKS` array defines 6 playbooks. Keep only 3:

| Keep | ID | Current Name | New Name (if changed) |
|------|----|--------------|-----------------------|
| YES | `service-save` | Service Save Protocol | *(keep)* |
| YES | `new-member-90day` | New Member 90-Day Integration | *(keep)* |
| YES | `slow-saturday` | Slow Saturday Pace Recovery | **Staffing Adjustment** |
| NO | `ghost-reactivation` | Ghost Member Reactivation | *(Phase 2)* |
| NO | `engagement-decay` | Engagement Decay Prevention | *(Phase 2)* |
| NO | `peak-demand-capture` | Peak Demand Capture | *(Phase 2)* |

Either delete the 3 hidden playbook objects from the array, or add a `hidden: true` field and filter them out in the render.

#### Task 3.1.2: Rename "Slow Saturday Pace Recovery"

Change the `name` field from `'Slow Saturday Pace Recovery'` to `'Staffing Adjustment'`. Update the description to be broader: focus on matching staffing to demand across all days, not just Saturday pace.

#### Task 3.1.3: Update AppContext playbook definitions

**File: `src/context/AppContext.jsx`**

The `PLAYBOOK_DEFS` object (line 14) and `initialState.playbooks` (line 44) reference all 6 playbooks. Remove `engagement-decay` and `peak-demand-capture` entries. Rename `slow-saturday` to `staffing-adjustment` if the ID changes, or keep the ID and just change the display name.

Also update `TRAIL_STEPS` (line 22) — remove entries for deleted playbooks.

---

### Sprint 3.1 Verification Checklist

- [ ] Actions drawer Templates section (or wherever playbooks render) shows exactly 3 playbooks
- [ ] "Staffing Adjustment" replaces "Slow Saturday Pace Recovery"
- [ ] No Ghost Reactivation, Engagement Decay, or Peak Demand playbooks visible
- [ ] Activating/deactivating playbooks still works
- [ ] `npm run build` succeeds

---

### Sprint 3.2: Add Complaint Resolution Tracking

**Why:** The surveys validate "After a complaint is resolved, does the member recover or decline?" The prototype tracks complaints but doesn't close the loop.

#### Task 3.2.1: Extend feedback data model

**File: `src/data/staffing.js`**

Add `resolved_date` and `resolved_by` fields to `feedbackRecords` entries that have `status: 'resolved'`:

```js
{ id: 'fb_002', ..., status: 'resolved', resolved_date: '2026-01-10', resolved_by: 'F&B Director' },
```

For entries with `status: 'in_progress'` or `status: 'escalated'`, add `days_open` computed value or leave `resolved_date: null`.

#### Task 3.2.2: Surface unresolved complaints in Today's Risks

**File: `src/features/today/TodaysRisks.jsx`** (created in Sprint 1.2)

Add a risk card: "X complaints unresolved > 7 days" — filter `feedbackRecords` where `status !== 'resolved'` and date is > 7 days ago.

#### Task 3.2.3: Show resolution status in Service > Complaints tab

**File: `src/features/service/tabs/ComplaintsTab.jsx`** (created in Sprint 1.1)

In the Open Complaints section, show:
- Days since filed
- Current status (acknowledged / in_progress / escalated)
- For resolved: who resolved it and when
- Member health status post-resolution (link to member profile)

---

### Sprint 3.2 Verification Checklist

- [ ] `feedbackRecords` have `resolved_date` and `resolved_by` fields
- [ ] Today's Risks shows unresolved complaint count when applicable
- [ ] Service > Complaints tab shows resolution status and days open
- [ ] Clicking a member name in complaints opens the member profile drawer
- [ ] `npm run build` succeeds

---

## 7. PHASE 4: MESSAGING & FRAMING REALIGNMENT (Weeks 4-5)

### Sprint 4.1: Reframe All Page Headlines

**Why:** Current headlines lead with retention/revenue. Should lead with operational control.

#### Task 4.1.1: Today view headline

Already handled in Sprint 1.2 — the `StoryHeadline` should focus on the top priority member/risk, not health scores.

#### Task 4.1.2: Members headline

Already handled in Sprint 2.1 — changed from "$XXK at risk" to "X members need attention."

#### Task 4.1.3: Service page headline

Already handled in Sprint 1.1 — "Is your service consistent across shifts, outlets, and days — and where's the risk?"

#### Task 4.1.4: Board Report subtitle

Already handled in Sprint 2.2 — changed to "service quality, member health, and impact."

#### Task 4.1.5: Actions drawer header

Already handled in Sprint 1.3 — drawer title is "Pending Actions (X)".

#### Task 4.1.6: Audit all remaining headlines

Search the codebase for any remaining instances of:
- "churn prevention"
- "revenue leakage"
- "retention dashboard"
- "dues at risk"
- "$XXK/yr"

Replace with operations-first language. Use `grep -r` across `src/` to find instances.

---

### Sprint 4.2: Update Landing Page

**File: `src/features/landing/PortalLanding.jsx`**

#### Task 4.2.1: Update hero title

Change from "Welcome to Swoop Member Intelligence" to:
```
"See where today is breaking — before your members feel it."
```

#### Task 4.2.2: Update hero subtitle

Change to:
```
"Swoop connects your tee sheet, POS, CRM, and scheduling into one intelligence layer — so you can see where service is at risk, know which members need attention, and prove to your board that it's working."
```

#### Task 4.2.3: Update proof points

Change the 3 proof point cards to lead with operations:
1. "Service consistency improved 15% at pilot clubs"
2. "Staffing adjustments prevented 12 service failures"
3. "4 member resignations caught before the letter arrived"

#### Task 4.2.4: Update "What to look at first"

Change to:
1. "Today's cockpit — see where operations are at risk (90 seconds)"
2. "Service & Staffing — is tomorrow staffed correctly?"
3. "Members needing attention — who should you call this week?"

---

### Sprint 4.2 Verification Checklist

- [ ] Landing page hero says "See where today is breaking"
- [ ] Proof points lead with service/operations, not just retention
- [ ] "What to look at first" points to Today, Service, Members
- [ ] No "retention dashboard" or "churn prevention" language on landing
- [ ] `npm run build` succeeds

---

## 8. PHASE 5: CODE CLEANUP (Weeks 5-6)

### Sprint 5.1: Delete Unused Feature Folders

**Why:** 17 feature folders represent dead code. Delete them to reduce bundle size and confusion.

**IMPORTANT: Before deleting, verify each folder is not imported by any remaining active feature. Run `grep -r "from '@/features/FOLDER_NAME'" src/` for each folder.**

Delete these folders entirely:

| # | Folder | Reason |
|---|--------|--------|
| 1 | `src/features/location-intelligence/` | No survey demand, no mobile app |
| 2 | `src/features/data-model/` | Developer tool, not GM tool |
| 3 | `src/features/activity-history/` | Not MVP |
| 4 | `src/features/demo-mode/` | Internal only |
| 5 | `src/features/growth-pipeline/` | No survey demand |
| 6 | `src/features/operations/` | Legacy, replaced by Service |
| 7 | `src/features/fb-performance/` | Legacy, merged into Service |
| 8 | `src/features/waitlist-demand/` | Legacy |
| 9 | `src/features/staffing-service/` | Legacy, replaced by Service |
| 10 | `src/features/storyboard-flows/` | Phase 2 |
| 11 | `src/features/automation-dashboard/` | Phase 2 |
| 12 | `src/features/landing-redirect/` | Consolidate into landing |
| 13 | `src/features/outreach-playbooks/` | Merged into Actions |
| 14 | `src/features/onboarding/` | White-glove, not self-serve |
| 15 | `src/features/notification-settings/` | Phase 2 |
| 16 | `src/features/pipeline/` | Unused |
| 17 | `src/features/data-health/` | Only used by Admin — verify before deleting |

**EXCEPTION for #17:** `DataHealthDashboard` is still used by AdminHub. Do **not** delete `src/features/data-health/`. Similarly, check these are still needed:
- `src/features/agent-command/tabs/InboxTab.jsx` — used by ActionsDrawer
- `src/features/revenue-leakage/tabs/` — components reused by Service page
- `src/features/daily-briefing/` — `TodayMode` and `YesterdayRecap` used by TodayView
- `src/features/member-health/` — tabs used by MembersView
- `src/features/member-profile/` — drawer used globally
- `src/features/playbooks/` — used by Actions
- `src/features/csv-import/` — removed from Admin but may be imported elsewhere
- `src/features/integrations/` — used by Admin Data Hub tab

### Sprint 5.1 Process

For each folder:
1. Run: `grep -r "features/FOLDER_NAME" src/` (excluding the folder itself)
2. If zero matches outside the folder → safe to delete
3. If matches exist → determine if the importing file is also being deleted. If so, safe. If not, do NOT delete.

After all deletions:
4. Run `npm run build` — fix any broken imports
5. Run the app in browser — verify all 5 nav items work

---

### Sprint 5.2: Clean App.jsx and NavigationContext.jsx

#### Task 5.2.1: Remove deleted feature imports from App.jsx

**File: `src/App.jsx`**

Remove all `import` statements for deleted features (lines 11-41 contain many). After removal, also remove the corresponding entries from the `ROUTES` object.

**Keep** entries for features that still exist (today, service, members, board-report, admin, member-profile, integrations, login, and any redirect targets that resolve to existing components).

For legacy routes that should redirect, remove them from `ROUTES` entirely — the `ROUTE_REDIRECTS` in NavigationContext handles redirects before the ROUTES object is consulted.

#### Task 5.2.2: Clean VALID_ROUTES and ROUTE_REDIRECTS

**File: `src/context/NavigationContext.jsx`**

Remove route keys from `VALID_ROUTES` that correspond to deleted features. Keep redirect entries in `ROUTE_REDIRECTS` for any routes that might be bookmarked externally.

#### Task 5.2.3: Clean HIDDEN nav entries

**File: `src/config/navigation.js`**

Remove HIDDEN entries for deleted features. Keep HIDDEN entries only for:
- `revenue` (redirects to `service`)
- `insights` (redirects to `service`)
- `actions` (redirects to `today`)
- `member-profile` (accessible via direct navigation)
- `integrations` (accessible via admin)

---

### Sprint 5.2 Verification Checklist

- [ ] `App.jsx` has no imports for deleted feature folders
- [ ] `ROUTES` object only contains active route mappings
- [ ] `npm run build` succeeds with zero errors
- [ ] All 5 nav items render correctly
- [ ] Member profile drawer still works
- [ ] Actions drawer still works

---

### Sprint 5.3: Clean Unused Data & Services

#### Task 5.3.1: Audit data files

Check each file in `src/data/` — if it's only imported by deleted services/features, remove it.

Files likely safe to keep (used by active features):
- `members.js` — used by memberService
- `staffing.js` — used by Service page
- `pace.js` — used by Service page
- `agents.js` — used by agentService (Actions drawer)
- `benchmarks.js` — used by Board Report
- `boardReport.js` — used by Board Report
- `integrations.js` — used by Admin
- `combinations.js` — used by Admin integrations

Files likely safe to delete (used only by deleted features):
- `location.js` — only used by location-intelligence (deleted)
- `cockpit.js` — check if used by cockpitService (which is used by Today)
- `pipeline.js` — only used by growth-pipeline (deleted)

#### Task 5.3.2: Delete temp files from repo root

```bash
rm temp-check-tables.js temp-seed-empty-tables.mjs
```

---

### Sprint 5.3 Verification Checklist

- [ ] No orphaned data files (every file in `src/data/` is imported by at least one active service)
- [ ] No orphaned service files (every file in `src/services/` is imported by at least one active feature)
- [ ] `temp-*.js` files deleted from repo root
- [ ] `npm run build` succeeds
- [ ] App runs with no console errors

---

## 9. PHASE 6: POST-MVP FEATURES (Weeks 7+)

**DO NOT BUILD** any of these until the MVP is validated with at least one pilot club. Each has a gate.

| Feature | Description | Gate |
|---------|-------------|------|
| **Experience Insights** | Correlation explorer, touchpoint analysis, event ROI | 1 pilot club with 90+ days data |
| **Advanced Member Analytics** | Archetypes tab, email heatmap, cohort analysis, recovery timeline | Members page validated with pilot |
| **Automation & Auto-Execute** | Playbook auto-execution, AI agent escalation | Trust built via manual-first with pilot |
| **Additional Playbooks** | Ghost Reactivation, Engagement Decay, Peak Demand, Seasonal | Core 3 playbooks validated |
| **Growth Pipeline** | Waitlist conversion, guest-to-member, warm lead scoring | Only if pilot clubs request |
| **Mobile App** | 4 screens — Cockpit, Actions, Member Lookup, Settings | Desktop MVP validated, 2+ pilots |
| **Advanced Admin** | Self-serve CSV import, notification prefs, user roles, audit log | Past white-glove onboarding phase |
| **Weather & Revenue Modeling** | Forecasting, pro shop analytics, F&B margin diagnostics | Historical data from pilots |

---

## 10. KEY FILES REFERENCE

### Files You Will Create

| File | Phase | Purpose |
|------|-------|---------|
| `src/features/service/ServiceView.jsx` | 1.1 | New Service & Staffing page |
| `src/features/service/index.js` | 1.1 | Barrel export |
| `src/features/service/tabs/QualityTab.jsx` | 1.1 | Service quality by shift/outlet/day |
| `src/features/service/tabs/StaffingTab.jsx` | 1.1 | Staffing-to-demand intelligence |
| `src/features/service/tabs/ComplaintsTab.jsx` | 1.1 | Complaint patterns + resolution tracking |
| `src/features/today/TodaysRisks.jsx` | 1.2 | Operational risk cards for Today view |
| `src/components/layout/ActionsDrawer.jsx` | 1.3 | Slide-in actions panel |

### Files You Will Modify

| File | Phase | What Changes |
|------|-------|-------------|
| `src/App.jsx` | 1.1, 5.2 | Add service route, remove deleted feature imports |
| `src/config/navigation.js` | 1.3 | 5 PRIMARY items (was 7) |
| `src/context/NavigationContext.jsx` | 1.1, 1.3, 5.2 | Add service to VALID_ROUTES, update redirects |
| `src/context/AppContext.jsx` | 3.1 | Remove deleted playbook defs |
| `src/components/layout/Sidebar.jsx` | 1.3 | Remove revenue badge, add actions badge |
| `src/features/today/TodayView.jsx` | 1.2 | Simplify to 3 sections |
| `src/features/members/MembersView.jsx` | 2.1 | Remove 4 collapsible sections, update headline |
| `src/features/member-health/tabs/HealthOverview.jsx` | 2.1 | Add ResignationTimeline |
| `src/features/board-report/BoardReport.jsx` | 2.2 | 2 tabs (was 4), update subtitle |
| `src/features/admin/AdminHub.jsx` | 2.3 | 2 tabs (was 5), update subtitle |
| `src/features/playbooks/PlaybooksPage.jsx` | 2.4, 3.1 | Remove ROI numbers, reduce to 3 playbooks |
| `src/features/landing/PortalLanding.jsx` | 4.2 | Operations-first messaging |
| `src/data/staffing.js` | 3.2 | Add resolution fields |

### Files You Will Delete (Phase 5)

17 feature folders listed in Sprint 5.1 + 2 temp files from repo root.

---

## 11. GLOSSARY

| Term | Definition |
|------|-----------|
| **3 Layers** | Swoop's strategic framework. Layer 3 = "Questions Only We Answer" — cross-domain intelligence no single vendor provides |
| **Archetype** | Behavioral classification of a member (Die-Hard Golfer, Social Butterfly, Ghost, etc.) |
| **Health Score** | 0-100 score derived from golf, dining, event, and email engagement signals |
| **Tier** | Health status: Healthy (70+), Watch (50-69), At-Risk (30-49), Critical (<30) |
| **Playbook** | A pre-defined intervention workflow (e.g., Service Save Protocol) with trigger, steps, and expected outcome |
| **Cockpit** | The real-time operational view — "where is today breaking?" |
| **Cross-domain** | Insight that requires connecting data from multiple systems (tee sheet + POS + CRM + scheduling) |
| **Wedge** | Go-to-market strategy: layer onto existing club systems (don't rip-and-replace). Member Health Score is the wedge product. |
| **§9 Rule** | Internal rule: "Five Lenses" language is internal only. Customer-facing labels use GM language (e.g., "Daily Briefing" not "Operator's Lens") |
| **StoryHeadline** | Reusable component that renders a contextual page headline with variant styling (urgent, warning, insight, risk) |
| **EvidenceStrip** | Small UI strip showing which data systems feed the current page |
| **Panel** | Tabbed content container component |
| **PageTransition** | Fade-in animation wrapper for page content |

---

## FULL VERIFICATION CHECKLIST (Run After All Phases Complete)

### Navigation
- [ ] Sidebar shows exactly 5 items: Today, Service, Members, Board Report, Admin
- [ ] Actions drawer opens from sidebar badge on any page
- [ ] Pending action count badge is visible and accurate
- [ ] Old routes (`#/revenue`, `#/insights`, `#/actions`) redirect gracefully
- [ ] No "lens" language appears in any customer-facing surface

### Today View
- [ ] Renders 3 focused sections: Risks, Priority Members, Pending Actions
- [ ] "Tomorrow's Staffing" risk card is visible
- [ ] No Health Score hero circle
- [ ] No Revenue Summary card
- [ ] No Week-over-Week grid

### Service Page
- [ ] Route `#/service` renders ServiceView
- [ ] Exactly 3 tabs: Quality, Staffing, Complaints
- [ ] Service quality by shift/outlet is visible
- [ ] Staffing-to-demand intelligence is visible
- [ ] Complaint patterns with resolution status are visible

### Members Page
- [ ] At-Risk mode shows HealthOverview + ResignationTimeline only
- [ ] All Members search mode still works
- [ ] Headline: "X members need attention" — no dollar amounts

### Board Report
- [ ] Exactly 2 tabs: Summary, Details
- [ ] No "16:1 ROI" badge
- [ ] Subtitle mentions "service quality"

### Admin
- [ ] Exactly 2 tabs: Integrations, Data Health
- [ ] No CSV Import, Notifications, or User Roles tabs

### Playbooks
- [ ] Exactly 3 playbooks: Service Save, 90-Day Integration, Staffing Adjustment
- [ ] No yearly dollar projections — track records only

### Code Health
- [ ] `npm run build` succeeds with zero errors
- [ ] No imports reference deleted feature folders
- [ ] `temp-*.js` files gone from repo root
- [ ] App loads with no console errors

### Messaging
- [ ] No page headline leads with "churn prevention" or "revenue leakage"
- [ ] Landing page leads with "See where today is breaking"
- [ ] Product feels like "connected intelligence platform" not "retention dashboard"
