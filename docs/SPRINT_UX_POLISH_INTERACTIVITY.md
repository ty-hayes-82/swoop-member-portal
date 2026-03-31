# Sprint: UX Polish — Interactivity & Drill-Downs
## Post-MVP Enhancement Sprint

**Created:** March 31, 2026
**Source:** QA interactivity audit — 12 remaining items from Phase 5 QA
**Priority:** Post-MVP polish — do not block pilot launch
**Estimated Dev Time:** 3-4 days
**Estimated QA Time:** 2-3 hours

---

## CONTEXT

During Phase 5 QA, 19 non-interactive elements were flagged. 7 high-priority items were fixed immediately (risk card deep-links, clickable member names, tel/mailto links, logo navigation, etc.). The remaining 12 are drill-down enhancements, chart tooltips, and interactive affordances that improve UX polish but don't block core functionality.

---

## SPRINT TASKS

### Task 1: Service Page — Complaint Driver Rows Clickable
**QA Item:** #7 (Medium)
**File:** `src/features/service/tabs/QualityTab.jsx`

**Current:** Complaint driver rows (Service Speed — 14 — 4 unresolved) are static.
**Fix:** Make each row clickable. Clicking a category should:
1. Navigate to the Complaints tab on the Service page
2. Pass the category as a filter intent (e.g., `navigate('service', { tab: 'complaints', category: 'Service Speed' })`)
3. ComplaintsTab should accept and apply a category filter from routeIntent

**Acceptance Criteria:**
- [ ] Click "Service Speed" row → switches to Complaints tab, filtered to Service Speed complaints only
- [ ] Click "Food Quality" row → Complaints tab, filtered to Food Quality
- [ ] "X unresolved" text has underline on hover indicating clickability
- [ ] Cursor changes to pointer on hover over the entire row

---

### Task 2: Service Page — Outlet Rows Expandable
**QA Item:** #8 (Medium)
**File:** `src/features/service/tabs/QualityTab.jsx`

**Current:** Outlet rows (Grill Room — HIGH, The Terrace — LOW) are static.
**Fix:** Make rows expandable with a click. Expanded state shows:
- Complaints filed for that outlet this month
- Understaffed day history for that outlet
- Staffing-to-satisfaction detail

**Implementation:**
- Add `useState` for `expandedOutlet`
- On click, toggle expanded view below the row
- Show complaint records filtered by outlet

**Acceptance Criteria:**
- [ ] Click "Grill Room" row → expands to show 5 complaints, 3 understaffed days
- [ ] Click again → collapses
- [ ] Expand indicator (▸/▾) visible on each row
- [ ] Other outlets show "No issues this month" when expanded

---

### Task 3: Service Page — Complaint Status Filter
**QA Item:** #9 (Medium)
**File:** `src/features/service/tabs/ComplaintsTab.jsx`

**Current:** Complaint status badges (Acknowledged, In Progress, Escalated) are static.
**Fix:** Add a status filter row above the complaint list. Clicking a status badge filters the list.

**Implementation:**
- Add filter chips above the complaint list: All | Acknowledged | In Progress | Escalated | Resolved
- `useState` for `statusFilter`, default `null` (all)
- Filter the `openComplaints` and resolved lists by status

**Acceptance Criteria:**
- [ ] Status filter chips appear above the complaint list
- [ ] Click "Escalated" → only escalated complaints shown
- [ ] Click "All" → resets filter
- [ ] Count in each chip updates to reflect how many complaints match

---

### Task 4: Service Page — Understaffed Day Rows Expandable
**QA Item:** #10 (Medium)
**File:** `src/features/service/tabs/StaffingTab.jsx`

**Current:** Understaffed day rows (Fri, Jan 9 — 2/4 servers) are static.
**Fix:** Make rows expandable. Expanded state shows:
- Complaints filed on that day
- Which members were affected
- Ticket time comparison vs normal days

**Implementation:**
- Add `useState` for `expandedDay`
- On click, show complaints from `feedbackRecords` where `date` matches and `isUnderstaffedDay === true`

**Acceptance Criteria:**
- [ ] Click "Fri, Jan 9" → expands to show 2 complaints from that day with member names
- [ ] Member names are clickable (MemberLink)
- [ ] Click again → collapses
- [ ] Expand indicator visible

---

### Task 5: Chart Hover Tooltips
**QA Item:** #11 (Medium)
**Files:** `src/features/service/tabs/QualityTab.jsx` (bar chart), `src/features/member-profile/MemberProfileDrawer.jsx` (sparkline)

**Current:** Charts show no hover feedback. The "Complaints by Day of Week" bar chart and health score sparkline have no tooltips.
**Fix:** Add hover tooltips to chart elements.

**Implementation for bar chart (QualityTab):**
- Wrap each bar in a container with `onMouseEnter`/`onMouseLeave`
- Show a tooltip div positioned above the bar with: day name, complaint count, breakdown by category

**Implementation for sparklines:**
- Sparklines are SVG — add `<title>` elements to each data point circle
- Or use `onMouseMove` on the SVG to show a floating tooltip

**Acceptance Criteria:**
- [ ] Hover over Friday bar → tooltip shows "Friday: 4 complaints (2 Service Speed, 1 Pace, 1 Food Quality)"
- [ ] Hover over sparkline data points → shows the score value and date
- [ ] Tooltips disappear on mouse leave
- [ ] No layout shift when tooltip appears

---

### Task 6: Board Report — KPI Cards Clickable
**QA Item:** #12 (Medium)
**File:** `src/features/board-report/BoardReport.jsx`

**Current:** KPI cards (14 Members Saved, $168K Dues Protected, etc.) are static.
**Fix:** Make each KPI card clickable to switch to the Details tab.

**Implementation:**
- Add `onClick={() => setActiveTab(1)}` to each KPI card
- Add cursor pointer and hover effect
- Optionally scroll to the relevant section within Details

**Acceptance Criteria:**
- [ ] Click "Members Saved" KPI → switches to Details tab
- [ ] Click "Dues Protected" KPI → switches to Details tab
- [ ] Cursor changes to pointer on hover
- [ ] Subtle shadow/scale on hover

---

### Task 7: Data Source Badges — Tooltips
**QA Item:** #14 (Low)
**File:** `src/components/ui/EvidenceStrip.jsx`

**Current:** Source badges (Scheduling, POS, Tee Sheet) have no hover info.
**Fix:** Add `title` attributes with a brief description of what data comes from each source.

**Implementation:**
Add a description map:
```js
const SOURCE_DESCRIPTIONS = {
  'Tee Sheet': 'Round bookings, pace data, cancellation history',
  'POS': 'Dining transactions, F&B revenue, check averages',
  'Scheduling': 'Staff schedules, shift coverage, labor data',
  'Complaints': 'Member feedback, service issues, resolution status',
  'Weather': 'Daily forecasts, impact on demand and operations',
  'Member CRM': 'Member profiles, tenure, contact info, dues',
  'Email': 'Campaign opens, click rates, engagement decay',
  'Analytics': 'Health scores, engagement trends, risk signals',
};
```
Add `title={SOURCE_DESCRIPTIONS[sig.source] || sig.source}` to each badge.

**Acceptance Criteria:**
- [ ] Hover over "POS" badge → tooltip shows "Dining transactions, F&B revenue, check averages"
- [ ] All badges on Service and Members pages have tooltips
- [ ] Tooltip appears as native browser tooltip (no custom UI needed)

---

### Task 8: Collapsed Sidebar Tooltips
**QA Item:** #15 (Low)
**File:** `src/components/layout/Sidebar.jsx`

**Current:** Nav icons in collapsed mode have `title` attributes set (line 112) but they may not be rendering consistently.
**Fix:** Verify `title={item.label}` is working. If native tooltips are too slow, add a custom tooltip on hover.

**Implementation:**
- Verify the existing `title` prop on the button element
- If needed, add a positioned tooltip div that appears on hover with the label text

**Acceptance Criteria:**
- [ ] Collapse sidebar → hover over each icon → tooltip shows label within 500ms
- [ ] Tooltips show for all 5 nav items
- [ ] Tooltip for pending actions badge shows "X pending actions"

---

### Task 9: Admin — Integration Cards Clickable
**QA Item:** #16 (Low)
**File:** `src/features/admin/AdminHub.jsx` (DataHubTab)

**Current:** "AVAILABLE" integration cards are not clickable.
**Fix:** Make available cards clickable. Click opens an inline expansion showing:
- What this integration provides
- How to connect (API key, CSV upload, or contact Swoop)
- What features it unlocks

**Acceptance Criteria:**
- [ ] Click "ForeTees Tee Sheet" card → expands with connection info
- [ ] Click again → collapses
- [ ] "CONNECTED" cards show last sync time when expanded
- [ ] Cursor pointer on hover for all cards

---

### Task 10: Member Profile — Sortable Invoice Table
**QA Item:** #17 (Low)
**File:** `src/features/member-profile/MemberProfilePage.jsx`

**Current:** Invoice table headers are not sortable.
**Fix:** Add sort-on-click to Date, Amount, and Status columns.

**Implementation:**
- Add `useState` for `invoiceSort` and `invoiceSortDir`
- Sort `invoiceItems` array before rendering
- Add sort indicator (▲/▼) next to active column header
- Click toggles asc/desc

**Acceptance Criteria:**
- [ ] Click "Date" header → sorts invoices by date ascending
- [ ] Click again → descending
- [ ] Click "Amount" header → sorts by amount
- [ ] Sort indicator visible on active column

---

### Task 11: Playbooks — Track Record Clickable
**QA Item:** #18 (Low)
**File:** `src/components/layout/ActionsDrawer.jsx`

**Current:** "Track record: 3 of 4 at-risk members retained" is plain text.
**Fix:** Make it clickable. Click navigates to Members page filtered to the relevant members (or shows a small detail popover).

**Implementation:**
- Wrap track record text in a button
- On click, navigate to `members` with intent to show at-risk members
- Or show a small inline expansion listing the specific members

**Acceptance Criteria:**
- [ ] Click track record text → navigates to Members page or shows detail
- [ ] Cursor pointer on hover
- [ ] Underline or color change on hover indicating clickability

---

### Task 12: Member Profile — Risk Signal Tags Clickable
**QA Item:** #19 (Low)
**File:** `src/features/member-profile/MemberProfileDrawer.jsx`

**Current:** Risk signal tags (e.g., "staff_service_issue") are static.
**Fix:** Make tags clickable. Click scrolls to the relevant activity timeline entry or opens the Service > Complaints tab filtered to that member.

**Implementation:**
- Wrap signal label in a button
- On click, scroll to the activity timeline section within the drawer
- If the signal source is "Complaints", navigate to Service > Complaints

**Acceptance Criteria:**
- [ ] Click a risk signal tag → scrolls to related activity in the drawer
- [ ] Cursor pointer on hover
- [ ] Visual feedback on click (brief highlight)

---

## VERIFICATION CHECKLIST

After completing all 12 tasks:

### Drill-Downs
- [ ] Complaint driver rows → Complaints tab filtered by category
- [ ] Outlet rows expandable with detail
- [ ] Complaint status filter chips work
- [ ] Understaffed day rows expandable with complaints
- [ ] Board Report KPI cards → Details tab

### Tooltips
- [ ] Chart bars show hover tooltips with detail
- [ ] Sparkline data points show score values
- [ ] Data source badges show description tooltips
- [ ] Collapsed sidebar icons show label tooltips

### Interactive Elements
- [ ] Admin integration cards expandable
- [ ] Invoice table sortable by Date, Amount, Status
- [ ] Playbook track record clickable
- [ ] Risk signal tags clickable

### Regression
- [ ] All 5 nav pages still load correctly
- [ ] Actions drawer still opens with Inbox + Playbooks tabs
- [ ] Member profile drawer still works from all pages
- [ ] Today risk cards still deep-link to Service tabs
- [ ] No console errors across all pages
- [ ] `npm run build` succeeds

---

## PRIORITY ORDER

If time is limited, implement in this order (highest impact first):

1. **Task 6** — Board Report KPI cards (simple, high visibility)
2. **Task 1** — Complaint driver drill-down (connects two existing views)
3. **Task 3** — Complaint status filter (most requested filter pattern)
4. **Task 5** — Chart tooltips (expected by all users)
5. **Task 7** — Data source tooltips (one-line fix)
6. **Task 8** — Collapsed sidebar tooltips (verify existing)
7. **Task 2** — Outlet row expansion
8. **Task 4** — Understaffed day expansion
9. **Task 9** — Admin integration cards
10. **Task 10** — Invoice sort
11. **Task 11** — Track record clickable
12. **Task 12** — Risk signal tags
