# SWOOP MVP Refactor - QA Test Plan

**Date:** March 29, 2026
**Branch:** `dev`
**Deploy URL:** https://swoop-member-portal-dev.vercel.app
**Scope:** 8 sprints of MVP refactor (12 commits)
**Priority:** Test on mobile (375px) AND desktop (1440px) for every section

---

## How to Use This Document

- Each section maps to a sprint of work
- Items marked **[BLOCKER]** must pass before pilot launch
- Items marked **[VERIFY]** need visual confirmation
- Items marked **[REGRESSION]** check that existing features still work
- Items marked **[QUESTION]** are areas where QA judgment is needed - please note what you observe
- Use Chrome DevTools mobile emulation (iPhone 14 Pro, 393x852) for mobile testing
- Test mobile app separately at `/#/m` route

---

## 1. Navigation Structure (Sprint 1)

### 1.1 Sidebar - Desktop [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Count visible sidebar nav items | Exactly 7: Today, Members, Revenue, Insights, Actions, Board Report, Admin | |
| 2 | Verify "Revenue" label | NOT "Revenue & Operations" | |
| 3 | Verify "Actions" label | NOT "Playbooks & Automation" | |
| 4 | Verify "Admin" label | No separate "Settings" section header visible | |
| 5 | Verify no "Connected Systems" label | Should not appear anywhere in sidebar | |
| 6 | Click Board Report | "16:1 ROI" green badge visible next to label | |
| 7 | Click Actions | Pending action count badge visible (orange circle with number) | |
| 8 | Collapse sidebar (click toggle) | All 7 icons visible, labels hidden, Board Report badge hidden | |
| 9 | Expand sidebar back | All labels return | |

### 1.2 Sidebar - Mobile [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open hamburger menu on mobile viewport | Sidebar slides in from left with overlay backdrop | |
| 2 | Count nav items in mobile sidebar | Same 7 items as desktop | |
| 3 | Tap backdrop | Sidebar closes | |
| 4 | Navigate to any page | Sidebar auto-closes | |

### 1.3 Route Redirects [BLOCKER]

Navigate directly to each URL by typing in the address bar. Every one should redirect to the target route (no blank page, no error).

| # | Type in address bar | Should redirect to | Pass? |
|---|--------------------|--------------------|-------|
| 1 | `/#/playbooks-automation` | `/#/actions` | |
| 2 | `/#/automation-dashboard` | `/#/actions` | |
| 3 | `/#/agent-command` | `/#/actions` | |
| 4 | `/#/outreach-playbooks` | `/#/actions` | |
| 5 | `/#/daily-briefing` | `/#/today` | |
| 6 | `/#/member-health` | `/#/members` | |
| 7 | `/#/waitlist-demand` | `/#/members` | |
| 8 | `/#/location-intelligence` | `/#/members` | |
| 9 | `/#/revenue-leakage` | `/#/revenue` | |
| 10 | `/#/fb-performance` | `/#/revenue` | |
| 11 | `/#/operations` | `/#/revenue` | |
| 12 | `/#/staffing-service` | `/#/revenue` | |
| 13 | `/#/experience-insights` | `/#/insights` | |
| 14 | `/#/growth-pipeline` | `/#/board-report` | |
| 15 | `/#/data-health` | `/#/admin` | |
| 16 | `/#/activity-history` | `/#/admin` | |
| 17 | `/#/data-model` | `/#/admin` | |
| 18 | `/#/storyboard-flows` | `/#/today` | |
| 19 | `/#/demo-mode` | `/#/today` | |

### 1.4 Header [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Navigate to Today | Greeting message visible in header (Good morning/afternoon) | |
| 2 | Navigate to Members | Header shows "Members" page title and subtitle | |
| 3 | Navigate to Revenue | Header shows "Revenue" page title | |

---

## 2. Today View - P0 Features (Sprint 2)

### 2.1 Health Score Hero [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open Today view | Health score hero card is the FIRST content below staleness alert | |
| 2 | Verify health score ring | Circular ring with score number inside (0-100) | |
| 3 | Verify tier label | Shows "Healthy", "Watch", "At Risk", or "Critical" based on score | |
| 4 | Verify tier breakdown | 4 colored boxes: Healthy (green), Watch (yellow), At Risk (orange), Critical (red) - each with a count | |
| 5 | Verify member count | Shows total members tracked (e.g., "300 members tracked") | |
| 6 | Mobile: no horizontal scroll | Hero card fits within 375px viewport without scrolling | |

### 2.2 Today View Content Order [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Scroll through Today view | Content appears in this order: Staleness Alert (if any) > Health Score Hero > Top Priority Alert > Since Last Visit > Morning Briefing > Today's 3 Priorities > Pending Actions > Revenue Snapshot > Recent Interventions > Log Feedback | |
| 2 | Pending actions section | Shows up to 3-5 pending actions with approve/dismiss buttons | |
| 3 | "View All" in pending actions | Navigates to `/#/actions` (NOT `/#/playbooks-automation`) | |

### 2.3 Getting Started Checklist [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | For onboarding users, checklist appears | Shows 4 steps with checkboxes | |
| 2 | "Review and approve your first AI action" step | Navigates to `/#/actions` | |
| 3 | "Open a member profile" step | Navigates to `/#/members` | |
| 4 | "Explore the Revenue breakdown" step | Text says "Revenue" (not "Revenue & Operations") | |

---

## 3. Members Page (Sprints 2, 5, 6)

### 3.1 Mode Switcher [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open Members page | Exactly 2 mode tabs: "At-Risk" and "All Members" | |
| 2 | Verify NO "Insights" tab | Should not exist (moved to top-level Insights page) | |
| 3 | Verify NO "Waitlist & Tee Sheet" tab | Should not exist (decommissioned) | |
| 4 | Default mode | "At-Risk" is selected by default | |

### 3.2 Archetype Filter Chips [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Filter chips visible | Horizontal row of chips above the content area | |
| 2 | Chip labels | "All Archetypes" + 8 archetypes: Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, Declining, New Member, Ghost, Snowbird | |
| 3 | Click an archetype chip | Chip highlights with accent color | |
| 4 | Click same chip again | Deselects, returns to "All Archetypes" | |
| 5 | Mobile: chips scroll | Chips scroll horizontally without page overflow | |
| 6 | [QUESTION] Does selecting an archetype actually filter the at-risk member list? | Note behavior - the filter state exists but may not be wired to HealthOverview filtering yet | |

### 3.3 At-Risk Member Table [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Table columns | Checkbox, Member, Score, Archetype/Channel, Risk Signal, **Exposure**, Action Status, **Call button** | |
| 2 | Exposure column | Shows dollar amount (e.g., "$18K") with "annual" subtitle | |
| 3 | Call button | Green phone icon circle on each row | |
| 4 | Click call button | Should trigger tel: link (phone dialer on mobile) | |
| 5 | Click member name | Opens member profile drawer | |
| 6 | Expand a row | Shows QuickActions panel below the row | |
| 7 | Expanded row colspan | QuickActions spans all 8 columns (no layout break) | |

### 3.4 First 90 Days Section [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Section title | "First 90 Days" (NOT "Cohort Analysis" or "Retention by Archetype") | |
| 2 | Header stats | Shows "New Members" count and "Falling Behind" count | |
| 3 | Phase timeline bar | 3 phases: Orientation (Weeks 1-4), Habit Building (Weeks 5-8), Integration (Weeks 9-12) | |
| 4 | Member cards | Each card shows: name, phase badge (e.g., "Orientation - Day 24"), health score, archetype | |
| 5 | Progress bar | Horizontal bar showing days elapsed out of 90 | |
| 6 | Milestone pills | 4 milestones per member: First Round, First Dining, Email Engaged, First Event | |
| 7 | Milestone status | Green with checkmark for completed, red with X for missing | |
| 8 | Behind members | Members with <75% milestones show orange "Action:" suggestion | |
| 9 | Key Insight card | Shows retention statistics about milestone completion | |

### 3.5 Member Profile Page [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Navigate to `/#/member-profile` (no ID) | Shows "Select a member to view their full profile" with member roster - NOT a blank page | |
| 2 | Click a member from All Members list | Profile loads with health score, archetype, activity data | |
| 3 | Profile load time | Under 3 seconds | |
| 4 | Back button | Returns to member list | |

---

## 4. Revenue Page (Sprint 3)

### 4.1 Revenue Reframe [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Page headline | Should mention "revenue signals" or "member spend patterns" - NOT "revenue leakage" | |
| 2 | Search for "leakage" on page | Should NOT appear in any visible text (Ctrl+F) | |
| 3 | Revenue opportunity card labels | "Service Gap Impact" (NOT "Revenue Leakage"), "Pro Shop & Lessons", "Spend Potential", "Dues at Risk" | |
| 4 | Deep Dive subtitle | Should read "How service patterns affect member satisfaction and spend" | |
| 5 | F&B data | F&B metrics visible on Revenue page (no separate F&B page) | |
| 6 | Staffing data | Staffing recommendation visible inline on Revenue page | |
| 7 | Navigate to `/#/fb-performance` | Redirects to `/#/revenue` | |

### 4.2 Scenario Modeling [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | 3 sliders visible | "Improve pace of play", "Faster complaint resolution", "Fix staffing gaps" | |
| 2 | **Members Protected metric** | Shows "X members protected from churn" below the dollar recovery amount | |
| 3 | Slider touch targets | Sliders are easy to grab on mobile (44px+ hit area) | |
| 4 | Preset buttons | "Conservative (10%)", "Moderate (25%)", "Aggressive (50%)" work correctly | |
| 5 | Dollar amount updates | Moving any slider updates the projected monthly recovery in real-time | |
| 6 | Members count updates | Members protected count changes with slider movement | |
| 7 | Mobile layout | Sliders and labels don't truncate or overflow on 375px width | |

---

## 5. Actions Page (Sprint 3)

### 5.1 Tab Structure [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Tab count | Exactly 2 tabs visible | |
| 2 | Tab labels | "Inbox" and "Templates" (NOT "Playbooks", "AI Agents", or "History") | |
| 3 | Default tab | "Inbox" is selected by default | |
| 4 | Page title | Header reads "Actions" (NOT "Playbooks & Automation") | |

### 5.2 Inbox Functionality [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Pending actions visible | List of AI-recommended actions with descriptions | |
| 2 | Approve an action | Action moves to approved state | |
| 3 | Dismiss an action | Action moves to dismissed state | |
| 4 | Pending/approved/dismissed counts | Counters update after approve/dismiss | |
| 5 | Team workload section | Shows delegation to staff roles (Head Pro, F&B Director, etc.) | |

### 5.3 Templates Tab [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Click "Templates" tab | Shows playbook/action templates | |
| 2 | Templates render | Content loads without errors | |

---

## 6. Insights Page (Sprint 5)

### 6.1 Top-Level Access [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Click "Insights" in sidebar | Navigates to `/#/insights` | |
| 2 | Page loads | Shows Experience Insights with tabs | |
| 3 | Tabs visible | Correlations, Touchpoints, Complaints, Event ROI, Spend Potential, Survey Intelligence | |
| 4 | Correlations tab | Shows correlation cards (golf-dining link, complaint-retention, etc.) | |

### 6.2 Complaints Tab [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | KPI strip | Shows: Total Complaints (90d), Resolved <24hrs, Renewal (Resolved), Renewal (Unresolved) | |
| 2 | **"Complaints to Watch" panel** | Shows 5 complaint rows with member names | |
| 3 | Overdue indicators | Complaints >30 days show red dot and red day count | |
| 4 | Day counters | Each complaint shows days open (e.g., "38d", "34d", "31d") | |
| 5 | Owner column | Shows assigned owner; "Unassigned" in red | |
| 6 | Dollar exposure | Shows annual dues at risk per member (e.g., "$18K") | |
| 7 | **"Schedule GM call" tag** | Appears ONLY on complaints >30 days overdue | |
| 8 | Staffing-Complaint heatmap | Renders below with day/shift grid | |

### 6.3 Event ROI Tab [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Table columns | Event Type, Avg Attendance, Retention Rate, **Health Impact**, Avg Spend/Member, ROI Score, Frequency | |
| 2 | **Health Impact column** | Shows "+X pts" or "-X pts" with green/red color coding | |
| 3 | Invite action card | "Invite 24 Ghost + Declining members to upcoming Chef's Table" | |

---

## 7. Board Report (Sprint 4)

### 7.1 Tab Structure [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Tab count | Exactly 4 tabs | |
| 2 | Tab labels | Summary, Member Saves, Operational Saves, What We Learned | |
| 3 | NO "Growth Pipeline" tab | Should not exist | |
| 4 | Navigate to `/#/growth-pipeline` | Redirects to `/#/board-report` | |

### 7.2 Tab Content [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Summary tab | KPI cards, sparklines, ROI calculation, benchmarks render | |
| 2 | Member Saves tab | Individual member retention stories render | |
| 3 | Operational Saves tab | Service failure prevention records render | |
| 4 | What We Learned tab | Insight cards render | |
| 5 | PDF Export button | Generates a document (verify it opens/downloads) | |
| 6 | Print button | Opens print dialog with clean layout (no UI chrome) | |

---

## 8. Admin Page (Sprint 7)

### 8.1 Tab Structure [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Tab labels | Integrations, Data Health, CSV Import, Notifications, User Roles | |
| 2 | NO "Onboarding" tab | Should not exist | |
| 3 | NO "Settings" tab | Should not exist | |
| 4 | Integrations tab | Shows connected data sources with status | |
| 5 | Data Health tab | Shows data freshness indicators | |
| 6 | CSV Import tab | [QUESTION] Does the upload interface render and function? Note what appears. | |
| 7 | Notifications tab | Toggle controls for morning digest, alert preferences | |
| 8 | User Roles tab | [QUESTION] Does this tab have content or is it empty? Note what appears. | |

---

## 9. Mobile App (`/#/m` route) (Sprint 8)

### 9.1 Bottom Tab Bar [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Tab count | 5 tabs visible at bottom | |
| 2 | Tab labels | Today, Members, Revenue, Actions, More | |
| 3 | Active tab highlight | Active tab shows orange (#F3922D) color | |
| 4 | Actions badge | Shows pending count badge (red circle) when actions exist | |
| 5 | Touch targets | Each tab is easy to tap (minimum 44px height) | |

### 9.2 "More" Sheet [BLOCKER]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Tap "More" tab | Sheet slides up from bottom with semi-transparent backdrop | |
| 2 | Sheet items | 3 items: Insights, Board Report, Admin | |
| 3 | Tap backdrop | Sheet dismisses | |
| 4 | Tap a sheet item | Navigates to that screen AND dismisses sheet | |
| 5 | Tap "More" again while open | Sheet dismisses (toggle behavior) | |

### 9.3 Mobile Screen Content [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Today screen | Loads cockpit/briefing content | |
| 2 | Members screen | Loads member list | |
| 3 | Actions screen | Loads inbox | |
| 4 | [QUESTION] Revenue screen | Does tapping "Revenue" in the bottom bar load content? Note what happens. The mobile app may not have a dedicated Revenue screen wired up yet. | |
| 5 | [QUESTION] Insights from More menu | Does tapping "Insights" load content? Note what happens. | |

---

## 10. Email Tab Reframe (Sprint 6)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Navigate to Members > At-Risk | Expand "Email Decay" collapsible section | |
| 2 | Title | Should read "Communication Health - Email Engagement" | |
| 3 | Subtitle | Should mention "early health score input" and "6-8 weeks" early warning | |
| 4 | Heatmap | Email open rate heatmap still renders | |

---

## 11. Lazy Loading & Performance (Sprint 8)

### 11.1 Code Splitting [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open DevTools Network tab, navigate to Today | Note initial JS bundle loaded | |
| 2 | Navigate to Board Report | A SEPARATE JS chunk should load (visible in Network tab) | |
| 3 | Navigate to Insights | A SEPARATE JS chunk should load | |
| 4 | Loading state | Brief "Loading..." text appears while chunk loads (should be <1 second) | |
| 5 | No white flash | No blank white screen during route transitions | |

### 11.2 General Performance [VERIFY]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Today page load | Under 3 seconds on simulated 4G (DevTools throttling) | |
| 2 | No console errors | Open DevTools Console, navigate through all 7 pages - no red errors | |
| 3 | No horizontal scroll | On 375px mobile viewport, no page has horizontal overflow | |

---

## 12. Cross-Cutting Concerns

### 12.1 Browser Back/Forward [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Navigate: Today > Members > Revenue > Back | Returns to Members | |
| 2 | Back again | Returns to Today | |
| 3 | Forward | Goes to Members | |

### 12.2 Direct URL Access [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Open `/#/today` directly | Today page loads | |
| 2 | Open `/#/members` directly | Members page loads | |
| 3 | Open `/#/revenue` directly | Revenue page loads | |
| 4 | Open `/#/insights` directly | Insights page loads | |
| 5 | Open `/#/actions` directly | Actions page loads | |
| 6 | Open `/#/board-report` directly | Board Report loads | |
| 7 | Open `/#/admin` directly | Admin page loads | |

### 12.3 Member Profile Drawer [REGRESSION]

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Click any member name in At-Risk list | Drawer slides in from right | |
| 2 | Drawer content | Shows member health score, archetype, activity | |
| 3 | Close drawer | Click X or outside drawer | |
| 4 | Drawer on mobile | Drawer renders correctly without overflow | |

---

## Open Questions for QA

These are areas where development made assumptions. Please document what you observe:

1. **Archetype filter wiring**: The archetype chips on the Members page set state, but do they actually filter the HealthOverview at-risk table? Or are they visual-only right now?

2. **Admin "User Roles" and "CSV Import" tabs**: These tabs were relabeled from existing tabs. Does the content match the new labels? Does "CSV Import" show an upload interface, or does it show activity log content (which is what the original "Activity Log" tab contained)?

3. **Mobile Revenue and Insights screens**: The mobile app bottom bar has Revenue and More > Insights tabs, but the mobile app may not have dedicated screen components for these. What happens when you tap them?

4. **Morning digest email**: The API endpoint at `/api/notifications` with body `{ "action": "generate_digest", "clubId": "demo" }` should return digest content. Can you POST to it and verify the response?

5. **Board Report PDF export**: Does the exported PDF include or exclude the removed "Growth Pipeline" content?

6. **Scenario modeling on small screens**: Do the 3 sliders stack vertically and remain usable on a 375px screen? Are the preset buttons (Conservative/Moderate/Aggressive) wrapping correctly?

7. **At-risk table on mobile**: The table now has 8 columns (including Exposure and Call). Does it scroll horizontally, or do columns get hidden/collapsed on mobile?

---

## Test Environment Setup

1. **URL**: https://swoop-member-portal-dev.vercel.app
2. **Login**: Use demo credentials (any entry triggers demo mode)
3. **Mobile testing**: Chrome DevTools > Toggle Device Toolbar > iPhone 14 Pro (393x852)
4. **Mobile app**: Navigate to `/#/m` for the dedicated mobile experience
5. **Console**: Keep DevTools Console open throughout testing to catch JS errors
6. **Network**: Keep DevTools Network tab open to verify lazy loading chunks

## Severity Guide

- **P0 - Blocker**: Prevents pilot launch. Must fix before any GM sees the product.
- **P1 - Critical**: Major feature broken, but workaround exists.
- **P2 - Major**: Visual/UX issue that degrades experience but doesn't block functionality.
- **P3 - Minor**: Polish issue, cosmetic, or edge case.
