# QA Test Plan: TailAdmin Integration

**App URL:** https://swoop-member-portal-production-readiness.vercel.app/#/login
**Branch:** `production-readiness-plan`
**Build:** `4074b56` (or later)

---

## Prerequisites

| Step | Action | Expected |
|------|--------|----------|
| Clear cache | Hard refresh (Ctrl+Shift+R) or clear site data | Fresh load with no cached CSS |
| Browser | Chrome or Edge, latest version | DevTools available |

---

## Test 1: Login Page

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 1.1 | Navigate to `/#/login` | Login card centered on gray-50 background, rounded-2xl with shadow | |
| 1.2 | Verify Swoop logo | Blue "S" badge (brand-500 `#465fff`) with "Swoop Golf" text | |
| 1.3 | Verify form inputs | Rounded-lg inputs with `border-gray-300`, focus ring turns blue | |
| 1.4 | Verify "Sign In" button | Blue `bg-brand-500` button, hover darkens to brand-600 | |
| 1.5 | Verify "Enter Demo Mode" button | White button with gray border, hover shows gray-50 bg | |
| 1.6 | Verify test account hint box | Blue-tinted info box (`bg-blue-light-50`) with blue border | |
| 1.7 | Enter invalid credentials | Red error banner with `bg-error-50` and `text-error-600` | |
| 1.8 | Click "Enter Demo Mode" → "Start Demo" | Logs in, redirects to Today page | |

---

## Test 2: Layout Shell (All Pages)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 2.1 | Verify sidebar visible at 1024px+ | Dark sidebar (bg-gray-900) appears on left, 290px wide | |
| 2.2 | Verify sidebar nav items | 5 items: Today, Service, Members, Board Report, Admin — with SVG icons | |
| 2.3 | Click each nav item | Active item highlights with `bg-brand-500/15 text-brand-400` (blue tint) | |
| 2.4 | Hover sidebar collapse | Mouse over collapsed sidebar → expands to 290px on hover | |
| 2.5 | Verify header | Sticky white header with hamburger, search bar (desktop), user avatar | |
| 2.6 | Verify search bar | Shows "Search or type command..." with ⌘K badge, visible on lg+ screens | |
| 2.7 | Verify page title in header | Shows current page name (e.g., "Members") with DEMO badge | |
| 2.8 | Verify user avatar | Shows initials circle with `bg-brand-100 text-brand-600` | |
| 2.9 | Verify footer | "Swoop Golf · Integrated Intelligence..." with Sign Out link in blue | |
| 2.10 | Verify footer club ID | Shows "Demo Environment" — NOT a raw ID like `club_1775325541693` | |

---

## Test 3: Responsive / Mobile (< 1024px)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 3.1 | Resize browser to < 1024px | Sidebar disappears, hamburger menu visible in header | |
| 3.2 | Click hamburger | Sidebar slides in from left with dark backdrop overlay | |
| 3.3 | Click a nav item | Sidebar closes, page navigates correctly | |
| 3.4 | Click backdrop | Sidebar closes | |
| 3.5 | Verify search bar hidden on mobile | Search bar not visible below lg breakpoint | |
| 3.6 | Verify page title visible on mobile | Page name + DEMO badge visible in header | |
| 3.7 | Resize back to > 1024px | Sidebar reappears, layout adjusts smoothly | |

---

## Test 4: Today Page (`/#/today`)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 4.1 | Navigate to Today | Morning briefing header card with blue tint (`bg-brand-25`) | |
| 4.2 | Verify greeting text | "Good morning..." or "Afternoon check-in..." based on time of day | |
| 4.3 | Verify stats | "220 rounds booked today" and weather forecast visible | |
| 4.4 | Verify Staffing section | "Today's Risks" card with rounded-xl border, Tailwind-styled content | |
| 4.5 | Verify Pending Actions | Action cards with proper card styling, no inline style artifacts | |
| 4.6 | Verify Member Alerts | Alert cards with health score colors, member names clickable | |
| 4.7 | Verify Tomorrow Forecast | Forecast card at bottom of page | |
| 4.8 | No old orange/custom colors | All accent colors should be blue (brand-500), not orange | |

---

## Test 5: Members Page (`/#/members`)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 5.1 | Navigate to Members | Story headline visible with insight styling | |
| 5.2 | Verify tab switcher | "At-Risk / First 90 Days / All Members" — tabs have gap between them, no text overlap | |
| 5.3 | Click each tab | Active tab shows white bg with shadow, inactive tabs are gray-500 | |
| 5.4 | Verify At-Risk mode | Health overview cards, member risk list visible | |
| 5.5 | Switch to "All Members" | Archetype filter chips appear below tabs | |
| 5.6 | Verify filter chips | Active chip: blue border + blue bg tint (`border-brand-500 bg-brand-50`) | |
| 5.7 | Click a filter chip | Chip activates (blue), member list filters | |
| 5.8 | Switch to "First 90 Days" | Cohort tracking view loads | |
| 5.9 | Click a member name | Member profile drawer opens from right side | |
| 5.10 | Verify member drawer | Drawer has proper Tailwind styling, no inline style artifacts | |

---

## Test 6: Service Page (`/#/service`)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 6.1 | Navigate to Service | Story headline + Evidence strip visible | |
| 6.2 | Verify Evidence strip | System badges ("Scheduling", "POS", etc.) styled as pills | |
| 6.3 | Verify tab switcher | "Quality / Staffing / Complaints" — proper spacing with gap-1 | |
| 6.4 | Click "Quality" tab | Service consistency score, complaint breakdown visible | |
| 6.5 | Click "Staffing" tab | Understaffed days table visible with Tailwind table styling | |
| 6.6 | Click "Complaints" tab | Feedback records, complaint drivers visible | |
| 6.7 | No old theme colors | All cards use gray borders, blue accents — no orange | |

---

## Test 7: Board Report (`/#/board-report`)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 7.1 | Navigate to Board Report | KPI strip at top with 4 metric cards | |
| 7.2 | Verify KPI cards | Cards show metric values with proper typography | |
| 7.3 | Verify charts | Recharts render correctly (bar charts, line charts) | |
| 7.4 | Verify tables | Member saves, operational saves tables visible | |
| 7.5 | Tab switching | Summary/Details tabs work correctly | |

---

## Test 8: Admin Page (`/#/admin`)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 8.1 | Navigate to Admin | "Admin" heading with "Integrations and data health" subtitle | |
| 8.2 | Verify tab switcher | "Integrations" tab active by default | |
| 8.3 | Verify data source cards | Grid of source cards (Jonas CRM, ForeTees, POS, etc.) | |
| 8.4 | Connected sources | Green success styling: `bg-success-50`, "connected" Badge | |
| 8.5 | Available sources | Gray styling: `bg-gray-50`, "available" Badge | |
| 8.6 | Verify Card wrapper | Sources wrapped in TailAdmin Card component (rounded-xl border) | |
| 8.7 | Verify upload CTA | "Manual Data Upload" bar with blue "Open Upload Tool" button | |

---

## Test 9: Visual Consistency Check

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 9.1 | Open DevTools → Elements | No `style=""` attributes on major layout elements (sidebar, header, main content, cards) | |
| 9.2 | Search page source for `#F3922D` | Should find ZERO occurrences — old orange is fully removed | |
| 9.3 | Search page source for `#465fff` | Should find occurrences — TailAdmin blue is the brand color | |
| 9.4 | Verify font | "Plus Jakarta Sans" used throughout (check in DevTools computed styles) | |
| 9.5 | Verify no broken layouts | No elements overflowing their containers, no text clipping | |
| 9.6 | Verify card consistency | All cards use same pattern: `rounded-xl border border-gray-200 bg-white p-5` | |
| 9.7 | Verify no stale CSS | No visible conflicts between old global.css rules and Tailwind classes | |

---

## Test 10: Edge Cases

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 10.1 | Resize window rapidly | No layout jank, sidebar transitions smoothly | |
| 10.2 | Open Actions Drawer | Slide-out drawer from right side, proper backdrop | |
| 10.3 | Sign Out → Sign In again | Login page renders cleanly, no stale state | |
| 10.4 | Navigate to `/#/integrations` | Integrations page loads with Tailwind styling | |
| 10.5 | Navigate to `/#/playbooks` | Playbooks page loads without errors | |
| 10.6 | Open browser console | No React errors, no CSS warnings, no 404s for assets | |

---

## Color Reference (TailAdmin Default Blue)

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-25` | `#f2f7ff` | Hero banner bg |
| `brand-50` | `#ecf3ff` | Active chip bg, light accent bg |
| `brand-100` | `#dde9ff` | User avatar bg |
| `brand-400` | `#7592ff` | Active sidebar text |
| `brand-500` | `#465fff` | Primary buttons, active states, links |
| `brand-600` | `#3641f5` | Button hover, deep accent |
| `gray-50` | `#f9fafb` | Page background |
| `gray-200` | `#e4e7ec` | Card borders |
| `gray-500` | `#667085` | Muted text |
| `gray-800` | `#1d2939` | Primary text |
| `gray-900` | `#101828` | Sidebar background |
| `success-500` | `#12b76a` | Connected status, positive indicators |
| `error-500` | `#f04438` | Error states, severe alerts |
| `warning-500` | `#f79009` | Warning states, weather alerts |

---

## Pass Criteria

- All 10 test sections pass with no blocking issues
- Zero instances of old orange (`#F3922D`) in visible UI
- Sidebar visible on standard laptop screens (1024px+)
- Tab switchers readable with proper spacing
- TailAdmin Card and Badge components used on Admin page
- No console errors related to missing styles or broken components
