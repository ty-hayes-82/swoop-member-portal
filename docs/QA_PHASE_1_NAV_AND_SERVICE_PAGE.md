# QA Testing Plan — Phase 1
## Navigation Restructure + New Service Page

**Phase:** 1 of 5
**Sprints Covered:** 1.1 (Service Page), 1.2 (Today Simplification), 1.3 (Navigation Update)
**Estimated QA Time:** 3-4 hours
**Environment:** Deployed Vercel preview or local (`npm run dev`)
**Browsers:** Chrome (primary), Safari, Firefox, Mobile Safari/Chrome

---

## WHAT CHANGED IN THIS PHASE

A QA tester does not need to know the codebase. Here is what changed from the user's perspective:

1. **New "Service" page** was created — it shows service quality, staffing intelligence, and complaint patterns
2. **The sidebar navigation** went from 7 items to 5 items. "Revenue," "Insights," and "Actions" were removed as standalone pages
3. **The Today page** was simplified — the large health score circle, revenue summary, and week-over-week grid were removed. It now shows 3 focused sections: operational risks, priority members, and pending actions
4. **An Actions drawer** was added — it slides in from the right side when you click the pending actions badge in the sidebar
5. **Old URLs still work** — visiting `#/revenue` or `#/insights` should redirect to `#/service`. Visiting `#/actions` should redirect to `#/today`

---

## PRE-TEST SETUP

1. Open the app in a browser (Chrome preferred)
2. If prompted to log in, use the demo credentials or click "Demo Login"
3. Confirm the sidebar is visible on the left
4. Clear browser console (`F12` > Console > Clear) before each test section

---

## TEST SUITE 1: SIDEBAR NAVIGATION

### Test 1.1 — Correct Navigation Items

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the sidebar | Exactly 5 navigation items visible: **Today**, **Service**, **Members**, **Board Report**, **Admin** | |
| 2 | Count the items | No more, no fewer than 5 | |
| 3 | Look for "Revenue" | "Revenue" should NOT appear in the sidebar | |
| 4 | Look for "Insights" | "Insights" should NOT appear in the sidebar | |
| 5 | Look for "Actions" | "Actions" should NOT appear as a sidebar navigation item | |

### Test 1.2 — Navigation Item Clicks

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Today" in sidebar | Page loads with operational risk cards, priority members, pending actions | |
| 2 | Click "Service" in sidebar | Page loads with headline about service consistency and 3 tabs | |
| 3 | Click "Members" in sidebar | Page loads with member health information | |
| 4 | Click "Board Report" in sidebar | Page loads with executive summary | |
| 5 | Click "Admin" in sidebar | Page loads with integrations and data health | |

### Test 1.3 — No Revenue Impact Badge

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the sidebar above the navigation | There should be NO badge showing "+$XXK/yr" or "X PLANS ACTIVE" | |
| 2 | Look at Board Report nav item | There should be NO green "16:1 ROI" badge next to it | |

### Test 1.4 — Pending Actions Badge

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the sidebar (below navigation items, above environment badge) | If there are pending actions, a badge should show "X pending actions" or a number | |
| 2 | Click the pending actions badge | An Actions drawer should slide in from the right side of the screen | |
| 3 | Click outside the drawer or click the close button | The drawer should close | |

### Test 1.5 — Sidebar Collapse

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click the collapse toggle button (bottom of sidebar) | Sidebar collapses to icon-only mode | |
| 2 | Verify 5 icons are visible | Each navigation item shows its icon | |
| 3 | Hover over each icon | Tooltip shows the item label | |
| 4 | Click the expand toggle | Sidebar expands back to full width with labels | |

---

## TEST SUITE 2: NEW SERVICE PAGE

### Test 2.1 — Service Page Loads

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Service" in sidebar | Page loads without errors | |
| 2 | Check headline | A headline about service consistency is visible at the top | |
| 3 | Check evidence strip | Below the headline, a strip shows data source badges (Scheduling, POS, Tee Sheet, Complaints, Weather) | |
| 4 | Check tabs | Exactly 3 tabs visible: **Quality**, **Staffing**, **Complaints** | |
| 5 | Check loading | Page should show a loading skeleton briefly, then content | |

### Test 2.2 — Quality Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click the "Quality" tab (should be active by default) | Quality content renders | |
| 2 | Look for service consistency metric | A score or rating showing overall service consistency | |
| 3 | Look for shift breakdown | AM vs PM service data visible | |
| 4 | Look for outlet breakdown | Data broken down by outlet (e.g., "Grill Room") | |
| 5 | Look for day-of-week view | Service quality by day of week | |
| 6 | Check for console errors | Open F12 > Console — no red errors | |

### Test 2.3 — Staffing Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click the "Staffing" tab | Staffing content renders | |
| 2 | Look for "Tomorrow's Staffing Risk" card | A card showing staffing predictions for the next day (e.g., "Grill Room needs 4 servers but 2 scheduled") | |
| 3 | Look for understaffed day analysis | Historical data showing days that were understaffed and the impact | |
| 4 | Look for staffing-to-satisfaction correlation | Shows relationship between understaffing and complaints | |
| 5 | Verify no revenue-first language | Staffing should be framed as "service quality" not "revenue loss." No headlines like "Understaffing = Lost Revenue" | |

### Test 2.4 — Complaints Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click the "Complaints" tab | Complaints content renders | |
| 2 | Look for open complaints list | A list of unresolved complaints with member names, dates, categories, and days since filed | |
| 3 | Click a member name in the complaints list | Member profile drawer should open from the right | |
| 4 | Close the member drawer | Drawer closes, complaints tab still visible | |
| 5 | Look for complaint drivers | Bar chart or list showing complaint categories (Service Speed, Food Quality, etc.) | |
| 6 | Look for understaffed-day correlation | A note or visual showing how many complaints occurred on understaffed days | |

### Test 2.5 — Tab Switching

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click Quality > Staffing > Complaints > Quality | Each tab renders its content correctly when clicked | |
| 2 | Switch tabs rapidly (click each within 1 second) | No flickering, no errors, no stale content | |
| 3 | Check active tab styling | The selected tab should be visually highlighted (solid background), others should be plain | |

---

## TEST SUITE 3: SIMPLIFIED TODAY VIEW

### Test 3.1 — Today Page Structure

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Today" in sidebar | Today page loads | |
| 2 | Count the major sections on the page | Should see approximately 3 clear sections: (1) Risk cards, (2) Priority member(s), (3) Pending actions | |
| 3 | Scroll the full page | The page should NOT be excessively long — no week-over-week grid, no revenue summary, no log feedback button | |

### Test 3.2 — Removed Elements (Must NOT Be Present)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for large circular health score | The conic-gradient circle with a number inside (e.g., "72") should be GONE | |
| 2 | Look for health tier badges | Row of colored badges (Healthy: X, Watch: X, At Risk: X, Critical: X) should be GONE from Today | |
| 3 | Look for "Revenue Summary" card | No card showing revenue opportunity breakdown | |
| 4 | Look for "Week-Over-Week Trends" section | No panel with "Performance Review" label or week-over-week comparison grid | |
| 5 | Look for "Since Last Visit" badge | Should be GONE or simplified into the risks section | |
| 6 | Look for staleness alert | No yellow/orange alert about stale data at top of Today (it moved to Admin) | |

### Test 3.3 — Today's Risks Section

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for risk cards at the top of Today | Cards showing today's operational risks (service risk, staffing, weather) | |
| 2 | Look for "Tomorrow's Staffing" card | A card specifically about tomorrow's staffing risk (e.g., "Grill Room 2 servers short") | |
| 3 | Look for unresolved complaints risk | If applicable, a note about complaints older than 7 days | |

### Test 3.4 — Priority Members Section

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for a priority member headline | A highlighted section showing the most important member(s) needing attention | |
| 2 | Click a member name | Member profile drawer opens from the right | |
| 3 | Close the drawer | Returns to Today view | |

### Test 3.5 — Pending Actions Section

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for pending actions inline | A list of pending actions with approve/dismiss buttons | |
| 2 | Click "Approve" on an action | Action status changes to approved. The pending count in sidebar should decrease by 1 | |
| 3 | Click "Dismiss" on another action | Action status changes to dismissed. Pending count decreases | |
| 4 | Verify sidebar badge updates | The pending actions badge count should match the remaining pending actions | |

---

## TEST SUITE 4: ACTIONS DRAWER

### Test 4.1 — Opening and Closing

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | From Today page, click the pending actions badge in the sidebar | Actions drawer slides in from the right | |
| 2 | Verify drawer content | Shows a list of pending actions with details and approve/dismiss buttons | |
| 3 | Click the close button (X) in the drawer | Drawer slides out, Today page is fully visible again | |
| 4 | Navigate to Service page, click pending actions badge | Actions drawer opens on top of the Service page | |
| 5 | Navigate to Members page, click pending actions badge | Actions drawer opens on top of the Members page | |
| 6 | Verify drawer works from all 5 pages | Drawer should be accessible from Today, Service, Members, Board Report, and Admin | |

### Test 4.2 — Drawer Actions

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the actions drawer | Pending actions are visible | |
| 2 | Approve an action | Action moves to approved state. Count updates in drawer header and sidebar badge | |
| 3 | Dismiss an action | Action moves to dismissed state. Count updates | |
| 4 | After approving/dismissing all actions | Drawer shows empty state message. Sidebar badge should disappear or show 0 | |

### Test 4.3 — Drawer + Member Drawer Interaction

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the actions drawer | Drawer is visible | |
| 2 | If a pending action references a member, click the member name | Member profile drawer should open (possibly replacing or overlaying the actions drawer) | |
| 3 | Close the member drawer | Should return to a clean state without visual glitches | |

---

## TEST SUITE 5: URL REDIRECTS

### Test 5.1 — Legacy URL Handling

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Type `#/revenue` in the address bar and press Enter | App redirects to `#/service` — Service page renders | |
| 2 | Type `#/insights` in the address bar and press Enter | App redirects to `#/service` — Service page renders | |
| 3 | Type `#/actions` in the address bar and press Enter | App redirects to `#/today` — Today page renders | |
| 4 | Type `#/revenue-leakage` in the address bar and press Enter | App redirects to `#/service` | |
| 5 | Type `#/experience-insights` in the address bar and press Enter | App redirects to `#/service` | |
| 6 | Type `#/staffing-service` in the address bar and press Enter | App redirects to `#/service` | |
| 7 | Type `#/member-health` in the address bar and press Enter | App redirects to `#/members` | |
| 8 | Type `#/daily-briefing` in the address bar and press Enter | App redirects to `#/today` | |
| 9 | Type `#/nonexistent-route` in the address bar and press Enter | App falls back to Today view (no crash) | |

---

## TEST SUITE 6: RESPONSIVE & CROSS-BROWSER

### Test 6.1 — Mobile Viewport

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Resize browser to 375px width (iPhone) | Sidebar hides, hamburger menu appears | |
| 2 | Tap hamburger menu | Sidebar slides in from left with 5 nav items | |
| 3 | Tap "Service" | Service page renders, sidebar closes | |
| 4 | Scroll the Service page on mobile | All 3 tabs accessible, content doesn't overflow horizontally | |
| 5 | Tap the pending actions badge (if visible) | Actions drawer opens | |

### Test 6.2 — Cross-Browser

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open app in Safari | All 5 pages load, Service page works, drawer works | |
| 2 | Open app in Firefox | Same checks as Safari | |
| 3 | Open app on a real mobile device (if available) | Sidebar, navigation, and Service page all functional | |

---

## TEST SUITE 7: PERFORMANCE & ERRORS

### Test 7.1 — Console Errors

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open browser developer tools (F12) > Console | No red errors on page load | |
| 2 | Navigate through all 5 pages | No red errors appear during navigation | |
| 3 | Open and close the Actions drawer | No errors | |
| 4 | Switch all 3 tabs on Service page | No errors | |

### Test 7.2 — Load Times

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Today | Page should render within 2 seconds (brief skeleton is OK) | |
| 2 | Navigate to Service | Page should render within 2 seconds | |
| 3 | Navigate to Members | Page should render within 2 seconds | |
| 4 | Navigate to Board Report | Page should render within 3 seconds (lazy-loaded component) | |

---

## BUGS FOUND

| # | Test ID | Description | Severity (Critical/High/Medium/Low) | Screenshot? |
|---|---------|-------------|--------------------------------------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## SIGN-OFF

| Role | Name | Date | Result |
|------|------|------|--------|
| QA Tester | | | Pass / Fail |
| QA Lead | | | Approved / Needs Fixes |
| Developer | | | Fixes Deployed |
