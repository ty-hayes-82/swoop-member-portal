# QA Test Plan: Progressive Data Import — New Club Onboarding

**App URL:** https://swoop-member-portal-production-readiness.vercel.app
**Purpose:** Validate that a brand-new club can onboard, import datasets one at a time, and see increasing value at every step.
**Approach:** Each test section represents a phase. The tester should execute them **in order** — each phase builds on the previous one.

---

## Prerequisites

- Browser: Chrome or Safari (latest)
- Access to the app URL above
- CSV test files (provided in `/scripts/sample-csv/` or generated via dry-run script)
- Postman or `curl` for API calls (some steps require POST requests)

---

## Phase 0: New Club Creation + First Login

### 0.1 — Create a new club account

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 0.1.1 | Open app URL → Login page loads | Orange "S" badge, "Swoop Golf" title, "Club Intelligence for General Managers" subtitle, gray-50 background | |
| 0.1.2 | Click **"Set Up New Club"** button | New club setup form appears with fields: Club Name, Admin Name, Email, Password | |
| 0.1.3 | Fill in: Club = "Bowling Green CC", Name = "Mike Thompson", Email = "mike@bowlinggreen.club", Password = "TestPass123!" → Submit | Success message, redirected to app. localStorage contains `swoop_auth_token`, `swoop_club_id` (a real UUID, not "demo") | |
| 0.1.4 | Header shows "LIVE" badge (green) | Green "LIVE" badge next to page title (not "DEMO") | |
| 0.1.5 | Footer shows "Mike Thompson" + club identifier | No raw "club_xxx" ID shown; shows club name or "Connected Club" | |

### 0.2 — Empty state: zero data imported

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 0.2.1 | **Today** page loads | Empty state card: "Welcome to your dashboard" with guidance to import data. No demo data visible. No crash. | |
| 0.2.2 | **Members** page | Empty state: "No members imported yet" with guidance to upload roster CSV via Admin → Integrations | |
| 0.2.3 | **Service** page | Empty state or zeroed metrics. No crash. | |
| 0.2.4 | **Board Report** page | Empty state: "No data available" or zeroed KPIs. Export buttons visible but export empty/minimal content | |
| 0.2.5 | **Admin** page | Shows Data Hub section. "Manual Data Upload" card visible with "Open Upload Tool" button. Connected Sources show 0 records. | |
| 0.2.6 | Navigate to **Admin → Integrations** | Integration categories visible (Tee Sheet, POS, CRM, Email, Staffing). All vendors show "available" or "upload CSV" links. No vendor shows "connected" yet. | |

**Value at Phase 0:** User sees the app structure, understands what data is needed, and knows where to upload it. No crashes on empty data.

---

## Phase 1: Import Members (CRM — the foundation)

**What this unlocks:** Member directory, health score baselines, archetypes, at-risk identification, member profiles.

### 1.1 — Upload member roster CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.1.1 | Navigate to **Admin → Open Upload Tool** (or Integrations → CRM → "upload CSV") | CSV import page loads. Import type selector visible. | |
| 1.1.2 | Select import type: **"members"** | Shows required fields: `first_name`, `last_name`. Optional fields listed: email, phone, membership_type, annual_dues, join_date, etc. | |
| 1.1.3 | Upload a CSV with 50+ members (columns: first_name, last_name, email, phone, membership_type, annual_dues, join_date, external_id) | File parses successfully. Preview shows mapped columns. Row count matches file. | |
| 1.1.4 | Click **Import** | Success response: `{ imported: 50, errors: 0 }` (or similar). No 500 error. | |
| 1.1.5 | Upload a second CSV with Jonas-format columns (e.g., "Given Name", "Surname", "Member #", "Date Joined") | Auto-maps Jonas aliases to standard fields. Preview shows correct mapping. Import succeeds. | |

### 1.2 — Verify Members page activates

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.2.1 | Navigate to **Members → All Members** | Member table shows imported members with columns: Member, Score, Level, Archetype, Tier, Annual Value. Pagination works. | |
| 1.2.2 | Search for a member by name | Search results appear in header dropdown. Clicking navigates to member. | |
| 1.2.3 | Click any member name | Member profile drawer opens with: name, email, phone, membership tier, join date. Health score shows "—" or baseline (no engagement data yet). | |
| 1.2.4 | Filter by archetype chip ("New Member") | Filters work. Most/all members may show as "New Member" or "Ghost" since no engagement data exists yet. | |
| 1.2.5 | Navigate to **Members → At-Risk** | Health overview shows distribution. With no engagement data, most members may be Critical/At-Risk. | |
| 1.2.6 | Navigate to **Members → First 90 Days** | Shows members with recent join dates (if any). Cohort tracking visible. | |

### 1.3 — Verify other pages update

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.3.1 | **Today** page | No longer shows empty state. May show member count, basic alerts. Priority items may still be empty (no engagement data). | |
| 1.3.2 | **Board Report** | KPIs may now show member count. Quality/Retention metrics still empty (need rounds + transactions). | |
| 1.3.3 | **Admin → Integrations** | CRM vendor now shows "connected" with member count (e.g., "50 members"). | |

**Value at Phase 1:** Club sees their full member roster, can search/filter, sees each member's profile. Understands who their members are. App feels "alive" with real data.

---

## Phase 2: Import Golf Rounds (Tee Sheet — engagement signal #1)

**What this unlocks:** Golf engagement scores (30% of health), round frequency, pace of play, Today dashboard rounds, archetype differentiation (Die-Hard Golfer vs Ghost).

### 2.1 — Upload rounds CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.1.1 | Navigate to upload tool, select type: **"rounds"** | Required fields: `member_id`, `round_date`. Optional: tee_time, course_id, duration_minutes, pace_rating, etc. | |
| 2.1.2 | Upload CSV with 200+ rounds (various members, dates over last 90 days) | Parses and imports successfully. Count matches. | |
| 2.1.3 | Alternatively: select type **"tee_times"** for tee sheet data | Required: reservation_id, course, date, tee_time. Import succeeds. | |

### 2.2 — Compute health scores

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.2.1 | Run health score computation: `curl -X POST "https://[app-url]/api/compute-health-scores?clubId=[YOUR_CLUB_ID]" -H "Authorization: Bearer [token]"` | Returns success with count of scored members. | |
| 2.2.2 | Navigate to **Members → All Members** | Health scores now show numeric values (not "—"). Members with many rounds score higher. | |
| 2.2.3 | Archetype column shows differentiation | Active golfers: "Die-Hard Golfer" or "Weekend Warrior". Inactive: "Ghost" or "Declining". Recent joins: "New Member". | |

### 2.3 — Verify golf-dependent features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.3.1 | **Members → At-Risk** | Health distribution now meaningful: Healthy/Watch/At-Risk/Critical based on golf activity. Members with 0 rounds flagged as At-Risk or Critical. | |
| 2.3.2 | **Today** page | Shows rounds data: "X rounds booked today" (if rounds include today's date). Priority items may now include golf-related alerts. | |
| 2.3.3 | Click a member with many rounds | Profile shows golf engagement dimension score. Round history visible. | |
| 2.3.4 | Click a member with zero rounds | Profile shows low golf score. Flagged as engagement risk. | |
| 2.3.5 | **Board Report** | Golf-related KPIs begin populating. Retention metrics improve with engagement data. | |

**Value at Phase 2:** Club can now see which members are active golfers vs. disengaged. Health scores become meaningful. At-risk detection begins working. The GM can identify members who stopped playing.

---

## Phase 3: Import F&B Transactions (POS — engagement signal #2)

**What this unlocks:** Dining engagement scores (25% of health), spend patterns, Social Butterfly archetype, Service page metrics, post-round dining correlation.

### 3.1 — Upload transactions CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.1.1 | Select import type: **"transactions"** | Required: `transaction_date`, `total_amount`. Optional: member_id, outlet_name, category, is_post_round, etc. | |
| 3.1.2 | Upload CSV with 500+ transactions (various members, outlets, dates) | Import succeeds. | |
| 3.1.3 | Optionally: import **"sales_areas"** (dining outlets) first | Outlet names map to transactions for richer analytics. | |

### 3.2 — Recompute health scores

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.2.1 | Run health score computation again | Scores update with dining dimension now factored in (25% weight). | |
| 3.2.2 | **Members → All Members** | Scores changed. Members with high dining but low golf may rise. New archetypes appear: "Social Butterfly" (high dining + events, low golf). | |
| 3.2.3 | Member profile: dining dimension | Click a high-spender → profile shows dining engagement score. Click a non-diner → dining score is low. | |

### 3.3 — Verify Service page activates

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.3.1 | **Service → Quality** | Service Consistency Score now computes from real data. Revenue metrics, average check data visible. | |
| 3.3.2 | **Service → Staffing** | If staffing data not yet imported, may show partial metrics. Understaffed days calculated from transaction volume vs. staff (once staff imported). | |
| 3.3.3 | **Today** page | More priority items. Dining-related insights may appear. | |
| 3.3.4 | **Board Report** | F&B revenue KPIs populate. Quality metrics improve. | |

**Value at Phase 3:** Club now sees the full dining picture. The GM can identify members who golf but never dine (revenue opportunity) and members who dine frequently but don't golf (different archetype). Service quality metrics begin working.

---

## Phase 4: Import Complaints (Feedback — service quality)

**What this unlocks:** Complaint tracking, resolution metrics, Service page complaints tab, correlation analysis (understaffing ↔ complaints), Today page alerts.

### 4.1 — Upload complaints CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.1.1 | Select import type: **"complaints"** | Required: `category`, `description`. Optional: member_id, status, priority, reported_at, resolved_at, severity. | |
| 4.1.2 | Upload CSV with 20+ complaints (mix of statuses: In Progress, Resolved, Escalated) | Import succeeds. | |

### 4.2 — Verify complaint-dependent features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.2.1 | **Service → Complaints** | Complaint list populates. Filters work: All, Acknowledged, In Progress, Escalated, Resolved. Count matches import. | |
| 4.2.2 | **Service → Quality** | Resolution Rate updates (Resolved / Total). Open complaint count accurate. | |
| 4.2.3 | **Today** page | "Open Complaints" count shows in operational briefing. Priority items may include unresolved complaints. | |
| 4.2.4 | **Board Report** | Quality KPIs update with complaint data. Confidence score may improve. | |
| 4.2.5 | Click a complaint linked to a member | Opens member profile with complaint history visible. | |

**Value at Phase 4:** Club now has a service quality dashboard. The GM can track complaint resolution, identify patterns, and see which departments have issues.

---

## Phase 5: Import Events + Registrations (engagement signal #3)

**What this unlocks:** Event engagement scores (20% of health), "Balanced Active" archetype accuracy, event attendance tracking, First 90 Days milestone badges.

### 5.1 — Upload events + registrations

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.1.1 | Select type: **"events"** | Required: `event_id`, `event_name`. Optional: event_type, start_date, capacity, pricing_category. | |
| 5.1.2 | Upload 10+ event definitions | Import succeeds. | |
| 5.1.3 | Select type: **"event_registrations"** | Required: `registration_id`, `event_id`. Optional: member_id, guest_count, fee_paid. | |
| 5.1.4 | Upload registrations linking members to events | Import succeeds. | |

### 5.2 — Recompute and verify

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.2.1 | Recompute health scores | All 4 dimensions now active: Golf (30%), Dining (25%), Email (25%), Events (20%). | |
| 5.2.2 | **Members → All Members** | Scores shift again. Members attending many events score higher. "Social Butterfly" archetype more accurate. | |
| 5.2.3 | **Members → First 90 Days** | New members show event participation as milestone badges (if applicable). | |
| 5.2.4 | Member profile | Event attendance dimension visible in health breakdown. | |

**Value at Phase 5:** Three of four health dimensions are active. Archetypes become highly accurate. The GM sees a near-complete picture of member engagement.

---

## Phase 6: Import Email Engagement (engagement signal #4)

**What this unlocks:** Email engagement scores (25% of health), early warning signals, full health score accuracy, complete archetype classification.

### 6.1 — Upload email data

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.1.1 | Select type: **"email_campaigns"** | Required: `campaign_id`, `subject`. Optional: campaign_type, send_date, audience_count. | |
| 6.1.2 | Upload campaign definitions | Import succeeds. | |
| 6.1.3 | Select type: **"email_events"** | Required: `campaign_id`, `member_id`, `event_type`. Optional: timestamp, link_clicked, device. | |
| 6.1.4 | Upload email events (opens, clicks, unsubscribes per member per campaign) | Import succeeds. | |

### 6.2 — Full health score computation

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.2.1 | Recompute health scores | All 4 dimensions now weighted correctly. This is the definitive health score. | |
| 6.2.2 | **Members → All Members** | Final accurate scores. Archetypes reflect true engagement patterns. | |
| 6.2.3 | **Members → At-Risk** | At-risk list is now highly accurate. Members flagged are genuinely disengaged across multiple dimensions. | |
| 6.2.4 | Member profile | All 4 dimension bars visible: Golf, Dining, Email, Events. Each shows a score. | |
| 6.2.5 | "Ghost" archetype members | Confirm: low scores across all 4 dimensions → classified as "Ghost". | |
| 6.2.6 | "Balanced Active" archetype | Confirm: moderate-to-high across all dimensions → "Balanced Active". | |

**Value at Phase 6:** Full health intelligence is active. Every member has a complete engagement picture. At-risk detection is production-quality. The GM can make confident retention decisions.

---

## Phase 7: Import Staffing Data (operational layer)

**What this unlocks:** Staffing vs. demand analysis, understaffed day detection, complaint-staffing correlation, Tomorrow Forecast on Today page.

### 7.1 — Upload staff + shifts

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.1.1 | Select type: **"staff"** | Required: `employee_id`, `first_name`, `last_name`. Optional: department, job_title, hire_date, hourly_rate, ft_pt. | |
| 7.1.2 | Upload staff roster | Import succeeds. | |
| 7.1.3 | Select type: **"shifts"** | Required: `shift_id`, `employee_id`, `date`. Optional: location, shift_start, shift_end, actual_hours. | |
| 7.1.4 | Upload shift schedule (30 days of data) | Import succeeds. | |

### 7.2 — Verify staffing features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.2.1 | **Service → Staffing** | Staffing vs. demand chart populates. Understaffed days identified. Gap analysis by department/outlet. | |
| 7.2.2 | **Today** page | Staffing cards show: "Grill Room X/Y", "Terrace X/Y", etc. Tomorrow Forecast includes staffing risk if understaffed. | |
| 7.2.3 | **Service → Quality** | Complaint-staffing correlation: understaffed days correlate with higher complaint volume. | |
| 7.2.4 | **Board Report** | Operational efficiency KPIs update. Staffing metrics in Details tab. | |

**Value at Phase 7:** The GM now sees the link between staffing gaps and service quality. Can proactively staff for high-demand days. Complete operational picture.

---

## Phase 8: Final Validation — Full Dataset

With all datasets imported, validate the complete experience:

### 8.1 — Cross-page consistency

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.1.1 | **Today** page shows all sections | Greeting, rounds, staffing cards, open complaints, action queue, weather, member alerts — all populated. | |
| 8.1.2 | **Members** all three tabs work | At-Risk (meaningful flags), All Members (full roster with scores), First 90 Days (cohort tracking). | |
| 8.1.3 | **Service** all three tabs work | Quality (consistency score), Staffing (gap analysis), Complaints (full list with filters). | |
| 8.1.4 | **Board Report** complete | All 4 KPI cards populated. Summary and Details tabs both render. PDF export generates multi-page report. | |
| 8.1.5 | **Admin** shows all connected sources | Integration cards show record counts for each imported dataset. | |

### 8.2 — Member profile deep dive

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.2.1 | Open a "Die-Hard Golfer" profile | High golf score, moderate-to-low dining/events. Quick actions available. | |
| 8.2.2 | Open a "Social Butterfly" profile | High events + dining, low golf. Different engagement story. | |
| 8.2.3 | Open a "Ghost" profile | All dimensions low. Flagged as Critical. Suggested actions focus on re-engagement. | |
| 8.2.4 | Open a "New Member" profile | Join date within 120 days. First 90 Days milestones tracked. | |

### 8.3 — Search and navigation

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.3.1 | Type member name in header search bar | Debounced results appear after 300ms. Shows name, email, archetype. | |
| 8.3.2 | Click a search result | Navigates to Members page. | |
| 8.3.3 | Press Cmd/Ctrl+K | Search bar focuses. | |
| 8.3.4 | Press Escape in search | Results dropdown closes, query clears. | |

### 8.4 — Auth and security

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.4.1 | Sign out → Sign back in with created credentials | Login succeeds. All data still present. | |
| 8.4.2 | Click "Forgot your password?" → enter email | Inline form appears (no crash). "Reset link sent" message. | |
| 8.4.3 | Navigate to `/#/reset-password` (no token) | Shows "Invalid Link" page with "Back to Sign In" link. | |
| 8.4.4 | Navigate to `/#/reset-password?token=fake` → submit | Error: "Invalid or expired reset link" (not 500). | |

### 8.5 — Notification bell

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.5.1 | Bell icon visible in header | Bell icon next to user avatar. | |
| 8.5.2 | Click bell | Dropdown opens: "No new notifications" or notification list. | |
| 8.5.3 | Unread badge | Shows count if unread notifications exist; hidden if zero. | |

---

## Progressive Value Summary

| Phase | Dataset Imported | New Value Unlocked |
|-------|------------------|--------------------|
| **0** | (none) | App structure visible, upload guidance, zero crashes on empty data |
| **1** | Members | Full roster, search, member profiles, membership tier breakdown |
| **2** | + Golf Rounds | Health scores activate, at-risk detection begins, archetype differentiation, Today shows rounds |
| **3** | + F&B Transactions | Dining engagement, revenue analytics, Service page metrics, Social Butterfly archetype |
| **4** | + Complaints | Service quality tracking, resolution rates, complaint-staffing correlation seed data |
| **5** | + Events | Event engagement dimension, Balanced Active archetype, First 90 Days milestones |
| **6** | + Email | Full 4-dimension health scores, early warning signals, complete archetype accuracy |
| **7** | + Staffing | Operational intelligence, understaffing alerts, complaint correlation, Tomorrow Forecast |
| **Full** | All datasets | Complete club intelligence: retention, operations, service quality, board reporting |

---

## Test Data Generation

For clubs without real data, use the dry-run script to generate realistic test data:

```bash
# Generate 300 members, 1200 rounds, 3000 transactions, 15 complaints
node scripts/dry-run-bowling-green.mjs
```

Or use the E2E test script for automated validation:

```bash
# Full pipeline: create club → import 4 CSV types → compute health → validate
node scripts/test-onboarding-e2e.mjs
```

---

## Pass Criteria

| Criterion | Requirement |
|-----------|-------------|
| Phase 0: Empty states | All 5 pages load without crash. Clear guidance shown. |
| Phase 1-7: Progressive import | Each import succeeds. Each phase unlocks new visible features. No regressions. |
| Phase 8: Full validation | All pages fully populated. Member profiles complete. Search works. Auth works. |
| Zero console errors | No JavaScript errors during normal navigation. |
| No demo data leakage | Real club never shows Oakmont Hills demo data. |
| Responsive | Sidebar collapses at < 1024px. All pages usable on tablet. |
