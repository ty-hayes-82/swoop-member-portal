# QA Testing Plan — Phase 2
## Simplify Existing Pages

**Phase:** 2 of 5
**Sprints Covered:** 2.1 (Members), 2.2 (Board Report), 2.3 (Admin), 2.4 (ROI Removal)
**Estimated QA Time:** 2-3 hours
**Prerequisite:** Phase 1 must be complete and passing
**Environment:** Deployed Vercel preview or local (`npm run dev`)

---

## WHAT CHANGED IN THIS PHASE

1. **Members page** was simplified — the At-Risk view used to show 6 sections (HealthOverview, ResignationTimeline, Archetypes, Email Decay, Recovery, First 90 Days). Now it shows only HealthOverview (which includes the resignation timeline). The headline no longer shows dollar amounts.
2. **Board Report** went from 4 tabs to 2 tabs — "Summary" and "Details" (which merges Member Saves + Operational Saves). "What We Learned" was removed.
3. **Admin** went from 5 tabs to 2 tabs — "Integrations" and "Data Health." CSV Import, Notifications, and User Roles were removed.
4. **All projected ROI numbers were removed** — no more "$216K/yr" on playbooks, no "+$XXK/yr" in sidebar, no "16:1 ROI" on Board Report. Playbooks now show track records only (e.g., "3 of 4 members retained").

---

## PRE-TEST SETUP

1. Open the app in a browser
2. Log in (demo mode)
3. Confirm Phase 1 changes are in place (5 sidebar items, Service page exists)

---

## TEST SUITE 1: MEMBERS PAGE SIMPLIFICATION

### Test 1.1 — At-Risk Mode Structure

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Members" in sidebar | Members page loads | |
| 2 | Confirm "At-Risk" mode is active by default | The At-Risk / All Members toggle shows "At-Risk" selected | |
| 3 | Look at the content below the toggle | Only **HealthOverview** content should be visible — tier distribution cards, member list, resignation timeline | |

### Test 1.2 — Removed Sections (Must NOT Be Present)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Scroll through the At-Risk mode content | No collapsible "Archetypes" section with a gear icon | |
| 2 | Continue scrolling | No collapsible "Email Decay" section | |
| 3 | Continue scrolling | No collapsible "Recovery" section | |
| 4 | Continue scrolling | No collapsible "First 90 Days" section | |
| 5 | Look for CollapsibleSection arrows | Zero expandable/collapsible section headers should be present in At-Risk mode | |

### Test 1.3 — Resignation Timeline Moved Into HealthOverview

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | In At-Risk mode, scroll to the bottom of the HealthOverview content | A resignation timeline section should be visible showing recent resignations or resignation trends | |
| 2 | Verify it renders without errors | Timeline renders with dates and member data | |

### Test 1.4 — Updated Headline

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the headline at the top of the Members page (At-Risk mode) | Should say something like "X members need attention — here's what to do" | |
| 2 | Verify NO dollar amounts in headline | The headline should NOT contain "$", "K/yr", "dues", or any financial figures | |
| 3 | Check the context text below the headline | Should mention "multi-domain disengagement patterns" or similar non-financial language | |

### Test 1.5 — All Members Mode Still Works

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "All Members" toggle | View switches to the member directory | |
| 2 | Type a member name in the search field | Members filter as you type | |
| 3 | Click on a member row | Member profile drawer opens from the right | |
| 4 | Close the drawer | Returns to All Members view | |
| 5 | Switch back to "At-Risk" | At-Risk view renders correctly | |

### Test 1.6 — Archetype Filter Chips

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look for archetype filter chips below the mode toggle | Chips like "All Archetypes", "Die-Hard Golfer", "Social Butterfly", etc. should still be visible | |
| 2 | Click "Ghost" chip | Member list filters to Ghost archetype members | |
| 3 | Click "All Archetypes" | Filter resets to show all members | |

---

## TEST SUITE 2: BOARD REPORT SIMPLIFICATION

### Test 2.1 — Tab Count

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Board Report" in sidebar | Board Report page loads | |
| 2 | Count the tabs | Exactly **2 tabs** visible: **Summary** and **Details** | |
| 3 | Verify NO "Member Saves" tab | This tab should not exist as a standalone | |
| 4 | Verify NO "Operational Saves" tab | This tab should not exist as a standalone | |
| 5 | Verify NO "What We Learned" tab | This tab should be completely gone | |

### Test 2.2 — Summary Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Summary" tab (should be active by default) | KPI cards render — Members Saved, Dues Protected, Service Failures Caught, etc. | |
| 2 | Look for 6-month trend sparklines | Small line charts showing trends over time | |
| 3 | Look for industry benchmark comparisons | If present, benchmark data should render without errors | |

### Test 2.3 — Details Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Details" tab | A combined view renders showing both member saves AND operational saves as sections | |
| 2 | Scroll through the Details content | Member saves section with specific members saved, dates, and outcomes | |
| 3 | Continue scrolling | Operational saves section with service failures caught and recovery paths | |
| 4 | Verify both sections are present in a single scrollable view | No sub-tabs within Details — it's one continuous scroll | |

### Test 2.4 — Subtitle Updated

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the subtitle below the "Board Report" title | Should mention "service quality" and "member health" | |
| 2 | Verify it does NOT say "retention, revenue, and operational saves" | Old subtitle should be replaced | |

### Test 2.5 — No ROI Badge

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the Board Report page | No "16:1 ROI" badge visible anywhere on the page | |
| 2 | Look at the sidebar Board Report item | No green ROI badge next to the label | |

---

## TEST SUITE 3: ADMIN SIMPLIFICATION

### Test 3.1 — Tab Count

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Admin" in sidebar | Admin page loads | |
| 2 | Count the tabs | Exactly **2 tabs** visible: **Integrations** and **Data Health** | |
| 3 | Verify NO "CSV Import" tab | Should be gone | |
| 4 | Verify NO "Notifications" tab | Should be gone | |
| 5 | Verify NO "User Roles" tab | Should be gone | |

### Test 3.2 — Integrations Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Integrations" tab (should be active by default) | Data Hub / Connected Sources content renders | |
| 2 | Verify integration cards are visible | Cards showing connected systems (Jonas, ForeTees, etc.) | |
| 3 | No console errors | Clean console | |

### Test 3.3 — Data Health Tab

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Click "Data Health" tab | Data health dashboard renders | |
| 2 | Verify connection status indicators | Green/amber/red indicators for each data source | |
| 3 | Verify data freshness information | Last sync timestamps or freshness indicators | |

### Test 3.4 — Subtitle Updated

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the subtitle below "Admin" | Should say "Integrations and data health monitoring" or similar | |
| 2 | Should NOT say "CSV imports, notifications, and user roles" | Old references to removed features should be gone | |

---

## TEST SUITE 4: ROI NUMBERS REMOVED

### Test 4.1 — Playbooks Have No Dollar Projections

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the Actions drawer (click pending actions badge in sidebar) | Drawer opens | |
| 2 | Navigate to the playbook/templates section (if accessible from drawer) | Playbooks are visible | |
| 3 | For each playbook, check for dollar amounts | NO "$216K/yr", "$264K/yr", "$18K/mo", or any projected financial impact should be visible | |
| 4 | Verify track records ARE visible | Each playbook should show something like "3 of 4 members retained (Q4 2025)" or "7 of 8 new members integrated" | |

### Test 4.2 — Sidebar Has No Revenue Badge

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Look at the sidebar | No "+$XXK/yr" badge anywhere | |
| 2 | Look above the navigation items | No "X PLANS ACTIVE" with dollar amount | |
| 3 | Activate a playbook (if possible) and check sidebar | Still no revenue impact badge | |

### Test 4.3 — Full App Sweep for Dollar Projections

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Today | No projected ROI numbers | |
| 2 | Navigate to Service | No projected ROI numbers | |
| 3 | Navigate to Members | No projected ROI numbers (note: "dues at risk" dollar amounts in the headline should be GONE, replaced by member count) | |
| 4 | Navigate to Board Report | No "16:1 ROI" badge. KPI metrics showing actual tracked data are OK. Projected/hypothetical dollar estimates are NOT OK | |
| 5 | Navigate to Admin | No projected ROI numbers | |

---

## TEST SUITE 5: REGRESSION — PHASE 1 STILL WORKS

### Test 5.1 — Quick Phase 1 Regression

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Sidebar has 5 items | Today, Service, Members, Board Report, Admin | |
| 2 | Service page loads with 3 tabs | Quality, Staffing, Complaints | |
| 3 | Today page has 3 sections | Risks, Priority Members, Pending Actions | |
| 4 | No health score circle on Today | Confirmed | |
| 5 | Actions drawer opens from sidebar badge | Confirmed | |
| 6 | `#/revenue` redirects to `#/service` | Confirmed | |

---

## TEST SUITE 6: CONSOLE & BUILD

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open F12 Console, navigate through all 5 pages | Zero red errors | |
| 2 | Open F12 Console, switch all tabs on Members, Board Report, Admin | Zero red errors | |
| 3 | If local: run `npm run build` | Build succeeds with zero errors | |

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
