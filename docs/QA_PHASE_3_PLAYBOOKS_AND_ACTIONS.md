# QA Testing Plan — Phase 3
## Playbooks & Actions Simplification

**Phase:** 3 of 5
**Sprints Covered:** 3.1 (Reduce Playbooks to 3), 3.2 (Complaint Resolution Tracking)
**Estimated QA Time:** 2 hours
**Prerequisite:** Phase 1 and Phase 2 must be complete and passing
**Environment:** Deployed Vercel preview or local (`npm run dev`)

---

## WHAT CHANGED IN THIS PHASE

1. **Playbooks reduced from 6 to 3.** Only these remain:
   - **Service Save Protocol** — triggered when an engaged member files an unresolved complaint
   - **New Member 90-Day Integration** — triggered when new members aren't building habits
   - **Staffing Adjustment** (renamed from "Slow Saturday Pace Recovery") — triggered by staffing-to-demand mismatches
2. **Three playbooks were hidden:** Ghost Reactivation, Engagement Decay Prevention, and Peak Demand Capture are no longer visible anywhere.
3. **"Slow Saturday Pace Recovery" was renamed** to "Staffing Adjustment" with a broader description.
4. **Complaint resolution tracking was added.** Complaints now show resolution status (resolved/in_progress/escalated), who resolved them, and when. Unresolved complaints older than 7 days appear as a risk on the Today page.

---

## PRE-TEST SETUP

1. Open the app in a browser
2. Log in (demo mode)
3. Confirm Phase 1 + 2 changes are in place

---

## TEST SUITE 1: PLAYBOOK COUNT

### Test 1.1 — Only 3 Playbooks Visible

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open the Actions drawer or navigate to wherever playbooks are displayed | Playbook templates/library is visible | |
| 2 | Count the playbooks | Exactly **3 playbooks** visible | |
| 3 | Verify "Service Save Protocol" is present | Playbook visible with description and steps | |
| 4 | Verify "New Member 90-Day Integration" is present | Playbook visible with description and steps | |
| 5 | Verify "Staffing Adjustment" is present | Playbook visible — this was renamed from "Slow Saturday Pace Recovery" | |

### Test 1.2 — Hidden Playbooks Are Gone

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Search the playbook list for "Ghost" | NOT found — "Ghost Member Reactivation" should not appear | |
| 2 | Search for "Engagement Decay" | NOT found — "Engagement Decay Prevention" should not appear | |
| 3 | Search for "Peak Demand" | NOT found — "Peak Demand Capture" should not appear | |
| 4 | Scroll through all visible playbooks | Only 3 — no hidden or collapsed entries | |

### Test 1.3 — Staffing Adjustment Renamed Correctly

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Find the staffing playbook | Name should be "Staffing Adjustment" (NOT "Slow Saturday Pace Recovery") | |
| 2 | Read the description | Description should be broader — about matching staffing to demand across all days, not just Saturday pace | |
| 3 | Check the playbook steps | Steps should reference staffing patterns, demand signals, and scheduling adjustments | |

---

## TEST SUITE 2: PLAYBOOK FUNCTIONALITY

### Test 2.1 — Activate a Playbook

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Find "Service Save Protocol" playbook | Click the activate/deploy button | |
| 2 | Confirm activation | Playbook status changes to active. Trail/progress steps begin to appear | |
| 3 | Check that activation is reflected in the sidebar or actions drawer | If there's a count or status indicator, it should update | |

### Test 2.2 — Deactivate a Playbook

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Find an active playbook | Click the deactivate/stop button | |
| 2 | Confirm deactivation | Playbook status returns to inactive. Progress resets | |

### Test 2.3 — Playbook Track Records (No Dollar Projections)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Expand each of the 3 playbooks | View their details | |
| 2 | For "Service Save" | Track record shows something like "3 of 4 at-risk members retained" — NO "$216K/yr" or "$18K/mo" | |
| 3 | For "New Member 90-Day" | Track record shows "7 of 8 new members integrated" — NO projected dollar amounts | |
| 4 | For "Staffing Adjustment" | Track record or description present — NO projected dollar amounts | |
| 5 | Check the before/after sections | Before/after metrics should focus on operational metrics (response time, resolution rate), NOT dollar projections | |

---

## TEST SUITE 3: COMPLAINT RESOLUTION TRACKING

### Test 3.1 — Complaints Show Resolution Status

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Service page > Complaints tab | Complaints list is visible | |
| 2 | Look at each complaint entry | Each should show a **status** field: `resolved`, `in_progress`, `acknowledged`, or `escalated` | |
| 3 | For resolved complaints | A **resolved date** and **resolved by** (e.g., "F&B Director") should be visible | |
| 4 | For unresolved complaints | A **days since filed** count should be visible | |
| 5 | Verify at least one complaint has "resolved" status with date and resolver | Data is present and formatted correctly | |

### Test 3.2 — Unresolved Complaints Appear in Today's Risks

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Navigate to Today page | Look at the risk cards section at the top | |
| 2 | Look for a complaint-related risk card | If there are complaints older than 7 days that are unresolved, a risk card should mention them (e.g., "2 complaints unresolved > 7 days") | |
| 3 | If all complaints are resolved | The complaint risk card should either not appear or show "0 unresolved complaints" | |

### Test 3.3 — Complaint Member Links

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | On the Service > Complaints tab, find a complaint with a member name | The member name should be clickable | |
| 2 | Click the member name | Member profile drawer opens showing that member's details | |
| 3 | Close the drawer | Returns to the Complaints tab without losing tab state | |

---

## TEST SUITE 4: REGRESSION — PHASES 1 + 2 STILL WORK

### Test 4.1 — Quick Regression

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Sidebar has 5 items | Today, Service, Members, Board Report, Admin | |
| 2 | Service page has 3 tabs | Quality, Staffing, Complaints | |
| 3 | Today page has 3 sections | Risks, Priority Members, Pending Actions | |
| 4 | Members At-Risk mode | Only HealthOverview content — no Archetypes/Email/Recovery/Cohorts sections | |
| 5 | Members headline | No dollar amounts — "X members need attention" | |
| 6 | Board Report has 2 tabs | Summary, Details | |
| 7 | Admin has 2 tabs | Integrations, Data Health | |
| 8 | No ROI badges | No "16:1 ROI", no "+$XXK/yr", no projected dollar playbook numbers | |

---

## TEST SUITE 5: CONSOLE & BUILD

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | F12 Console — navigate through all 5 pages | Zero red errors | |
| 2 | F12 Console — open actions drawer, view playbooks, activate/deactivate | Zero red errors | |
| 3 | F12 Console — click through all Service page tabs | Zero red errors | |
| 4 | If local: `npm run build` | Build succeeds with zero errors | |

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
