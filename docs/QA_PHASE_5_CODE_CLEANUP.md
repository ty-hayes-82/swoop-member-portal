# QA Testing Plan — Phase 5
## Code Cleanup

**Phase:** 5 of 5
**Sprints Covered:** 5.1 (Delete Unused Features), 5.2 (Clean Navigation), 5.3 (Clean Data & Services)
**Estimated QA Time:** 2-3 hours
**Prerequisite:** Phases 1-4 must be complete and passing
**Environment:** Deployed Vercel preview or local (`npm run dev`)

---

## WHAT CHANGED IN THIS PHASE

This phase is a **code cleanup** — deleting unused feature folders, removing dead imports, and cleaning up the navigation configuration. From a user perspective:

1. **Nothing should look different.** The app should behave identically to after Phase 4.
2. **17 unused feature folders were deleted** from the codebase.
3. **App.jsx** was cleaned up — unused imports and route entries removed.
4. **NavigationContext.jsx** was cleaned up — unused route entries removed, redirects simplified.
5. **navigation.js** was cleaned up — unused HIDDEN entries removed.
6. **Temp files** (`temp-check-tables.js`, `temp-seed-empty-tables.mjs`) deleted from repo root.
7. **Orphaned data files and services** were removed.

**The key risk in this phase is regressions** — accidentally breaking something by deleting a file that was still imported somewhere. That's why this QA plan is a comprehensive regression test of the entire app.

---

## PRE-TEST SETUP

1. Open the app in a browser
2. Log in (demo mode)
3. Open browser developer console (F12 > Console) — keep it open for the entire session
4. If testing locally, first run `npm run build` and confirm it succeeds with zero errors

---

## TEST SUITE 1: BUILD VERIFICATION (Local Only)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Run `npm run build` in terminal | Build completes with zero errors | |
| 2 | Check for warnings about missing modules | Zero "Module not found" warnings | |
| 3 | Run `npm run dev` and open the app | App loads without errors | |
| 4 | Check browser console on initial load | Zero red errors | |

---

## TEST SUITE 2: FULL APP NAVIGATION (Regression)

Test every page thoroughly. The goal is to confirm that deleting 17 feature folders and cleaning up imports broke nothing.

### Test 2.1 — Today Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Today" in sidebar | Page loads without errors | |
| 2 | Risk cards section visible | Operational risk cards render with data | |
| 3 | Priority member section visible | At least one member with context | |
| 4 | Pending actions section visible | Actions list with approve/dismiss buttons (or empty state) | |
| 5 | Click a member name | Member profile drawer opens | |
| 6 | Close the drawer | Returns to Today view | |
| 7 | Check console | Zero red errors | |

### Test 2.2 — Service Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Service" in sidebar | Page loads without errors | |
| 2 | Click "Quality" tab | Content renders with service metrics | |
| 3 | Click "Staffing" tab | Content renders with staffing data | |
| 4 | Click "Complaints" tab | Content renders with complaint list | |
| 5 | Click a member name in complaints | Member profile drawer opens | |
| 6 | Check console | Zero red errors | |

### Test 2.3 — Members Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Members" in sidebar | Page loads without errors | |
| 2 | At-Risk mode is default | HealthOverview renders | |
| 3 | Click "All Members" toggle | Member directory renders | |
| 4 | Type in search box | Members filter by name | |
| 5 | Click a member row | Member profile drawer opens | |
| 6 | In the drawer, scroll through all sections | All profile sections render (health, engagement, etc.) | |
| 7 | Close drawer | Returns to Members | |
| 8 | Click archetype filter chip (e.g., "Ghost") | Members filter by archetype | |
| 9 | Click "All Archetypes" | Filter resets | |
| 10 | Check console | Zero red errors | |

### Test 2.4 — Board Report Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Board Report" in sidebar | Page loads (may take a moment — lazy loaded) | |
| 2 | "Summary" tab is default | KPI cards and trends render | |
| 3 | Click "Details" tab | Combined member saves + operational saves render | |
| 4 | Scroll through all content | All data renders, no blank sections | |
| 5 | Check console | Zero red errors | |

### Test 2.5 — Admin Page

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Admin" in sidebar | Page loads without errors | |
| 2 | "Integrations" tab is default | Integration cards / connected sources render | |
| 3 | Click "Data Health" tab | Data health dashboard renders | |
| 4 | Check console | Zero red errors | |

---

## TEST SUITE 3: ACTIONS DRAWER

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click pending actions badge in sidebar | Actions drawer slides in from right | |
| 2 | Verify action items render | Pending actions with descriptions visible | |
| 3 | Approve an action | Status changes, count decreases | |
| 4 | Dismiss an action | Status changes, count decreases | |
| 5 | View playbooks (if accessible from drawer) | 3 playbooks visible: Service Save, 90-Day Integration, Staffing Adjustment | |
| 6 | Close the drawer | Closes cleanly | |
| 7 | Open drawer from Service page | Works | |
| 8 | Open drawer from Members page | Works | |
| 9 | Open drawer from Board Report page | Works | |
| 10 | Open drawer from Admin page | Works | |
| 11 | Check console | Zero red errors through all of this | |

---

## TEST SUITE 4: MEMBER PROFILE DRAWER (Accessed From Multiple Pages)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | From Today, click a member name | Drawer opens with full profile | |
| 2 | Close drawer | Clean close, Today page still functional | |
| 3 | From Members > All Members, click a row | Drawer opens | |
| 4 | Close drawer | Clean close | |
| 5 | From Service > Complaints, click a member name | Drawer opens | |
| 6 | Close drawer | Clean close | |
| 7 | Verify drawer content | Health score, tier, engagement data, contact info all render | |
| 8 | Check console | Zero red errors | |

---

## TEST SUITE 5: URL REDIRECTS STILL WORK

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `#/revenue` | Redirects to `#/service` | |
| 2 | Navigate to `#/insights` | Redirects to `#/service` | |
| 3 | Navigate to `#/actions` | Redirects to `#/today` | |
| 4 | Navigate to `#/revenue-leakage` | Redirects to `#/service` | |
| 5 | Navigate to `#/experience-insights` | Redirects to `#/service` | |
| 6 | Navigate to `#/member-health` | Redirects to `#/members` | |
| 7 | Navigate to `#/daily-briefing` | Redirects to `#/today` | |
| 8 | Navigate to `#/staffing-service` | Redirects to `#/service` | |
| 9 | Navigate to `#/operations` | Redirects to `#/service` | |
| 10 | Navigate to `#/fb-performance` | Redirects to `#/service` | |
| 11 | Navigate to `#/agent-command` | Redirects to `#/today` | |
| 12 | Navigate to `#/playbooks` | Redirects to `#/today` | |
| 13 | Navigate to `#/data-health` | Redirects to `#/admin` | |
| 14 | Navigate to `#/data-model` | Redirects to `#/admin` | |
| 15 | Navigate to `#/completely-fake-route` | Falls back to Today (no crash, no blank page) | |

**Critical:** None of these should show a blank page, crash, or produce console errors.

---

## TEST SUITE 6: MESSAGING STILL CORRECT (Phase 4 Regression)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Today headline | Operations-focused, no health score circle | |
| 2 | Service headline | "service consistency" language | |
| 3 | Members headline | "members need attention" — no dollar amounts | |
| 4 | Board Report subtitle | "service quality, member health, and impact" | |
| 5 | Admin subtitle | "Integrations and data health" | |
| 6 | Ctrl+F "churn prevention" on each page | Zero results | |
| 7 | Ctrl+F "revenue leakage" on each page | Zero results | |
| 8 | Ctrl+F "16:1 ROI" on each page | Zero results | |
| 9 | Ctrl+F "$216K" on each page | Zero results | |
| 10 | Ctrl+F "Lens" or "lenses" on each page | Zero results | |

---

## TEST SUITE 7: MOBILE RESPONSIVE

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Resize browser to 375px width | Sidebar hides, hamburger icon appears | |
| 2 | Tap hamburger | Sidebar slides in with 5 items | |
| 3 | Tap "Today" | Today page renders on mobile | |
| 4 | Tap "Service" | Service page renders, tabs are tappable | |
| 5 | Tap "Members" | Members page renders | |
| 6 | Tap "Board Report" | Board Report renders | |
| 7 | Tap "Admin" | Admin renders | |
| 8 | Open actions drawer on mobile | Drawer opens (full-width or appropriate mobile size) | |
| 9 | Open member profile drawer on mobile | Drawer opens | |
| 10 | No horizontal scroll on any page | Content fits within viewport | |

---

## TEST SUITE 8: PERFORMANCE

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Measure Today page load time | < 2 seconds to interactive content | |
| 2 | Measure Service page load time | < 2 seconds | |
| 3 | Measure Members page load time | < 2 seconds | |
| 4 | Measure Board Report load time | < 3 seconds (lazy loaded) | |
| 5 | Measure Admin page load time | < 2 seconds | |
| 6 | Navigate rapidly between all 5 pages | No visible lag, no white flashes, no content from previous page lingering | |

---

## TEST SUITE 9: DELETED FEATURES DO NOT APPEAR

These features were deleted in this phase. Verify none of them are accidentally still accessible.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to `#/location-intelligence` | Redirects (does NOT show a GPS/location page) | |
| 2 | Navigate to `#/data-model` | Redirects to Admin (does NOT show a database schema browser) | |
| 3 | Navigate to `#/activity-history` | Redirects to Admin (does NOT show an audit log) | |
| 4 | Navigate to `#/demo-mode` | Redirects to Today (does NOT show a demo walkthrough) | |
| 5 | Navigate to `#/growth-pipeline` | Redirects (does NOT show a pipeline/leads page) | |
| 6 | Navigate to `#/storyboard-flows` | Redirects to Today (does NOT show playbook guides) | |
| 7 | Navigate to `#/automation-dashboard` | Redirects (does NOT show an automation dashboard) | |
| 8 | Look for any nav items referencing deleted features | None should be visible in sidebar or any menu | |

---

## TEST SUITE 10: FULL END-TO-END WORKFLOW

Simulate a complete GM morning session:

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the app | Login page or Today view loads | |
| 2 | View Today page | See today's risks, priority members, pending actions | |
| 3 | Approve one pending action from Today | Action approved, count decreases | |
| 4 | Click a priority member name | Member drawer opens with full profile | |
| 5 | Close drawer, navigate to Service | Service page loads with quality data | |
| 6 | Click Staffing tab | See tomorrow's staffing risk | |
| 7 | Click Complaints tab | See open complaints with resolution status | |
| 8 | Click a complaint member name | Drawer opens | |
| 9 | Close drawer, navigate to Members | At-Risk members visible | |
| 10 | Search for a specific member in All Members mode | Member found, click opens drawer | |
| 11 | Navigate to Board Report | Summary KPIs visible | |
| 12 | Click Details tab | Member saves + operational saves visible | |
| 13 | Navigate to Admin | Integrations and Data Health tabs work | |
| 14 | Open Actions drawer from sidebar | Pending actions visible | |
| 15 | Close drawer | Clean close | |
| 16 | **Entire flow completed without a single console error** | Open F12 Console — confirm ZERO red errors through the entire workflow | |

---

## FINAL PASS/FAIL SUMMARY

| Test Suite | Tests | Passed | Failed | Notes |
|-----------|-------|--------|--------|-------|
| 1. Build Verification | | | | |
| 2. Full Navigation | | | | |
| 3. Actions Drawer | | | | |
| 4. Member Profile Drawer | | | | |
| 5. URL Redirects | | | | |
| 6. Messaging Regression | | | | |
| 7. Mobile Responsive | | | | |
| 8. Performance | | | | |
| 9. Deleted Features | | | | |
| 10. End-to-End Workflow | | | | |
| **TOTAL** | | | | |

---

## BUGS FOUND

| # | Test ID | Description | Severity (Critical/High/Medium/Low) | Screenshot? |
|---|---------|-------------|--------------------------------------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

---

## SIGN-OFF

| Role | Name | Date | Result |
|------|------|------|--------|
| QA Tester | | | Pass / Fail |
| QA Lead | | | Approved / Needs Fixes |
| Developer | | | Fixes Deployed |
| Product Owner | | | MVP Approved for Pilot |
