# QA Test Plan: Progressive Data Import — New Club Onboarding

**App URL:** https://swoop-member-portal-production-readiness.vercel.app
**Purpose:** Validate that a brand-new club can onboard, import datasets one at a time, and see increasing value at every step.
**Approach:** Each test section represents a phase. Execute them **in order** — each phase builds on the previous one.

---

## Prerequisites

- Browser: Chrome or Safari (latest)
- DevTools open (Console + Network tabs) throughout testing
- Access to the app URL above
- CSV test files (provided in `/scripts/sample-csv/` or generated via dry-run script)
- `curl` or Postman for health score computation calls

---

## Phase 0: New Club Creation + First Login

### 0.1 — Create a new club account

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 0.1.1 | Open app URL → Login page loads | Orange "S" badge, "Swoop Golf" title, "Club Intelligence for General Managers" subtitle, gray-50 background | |
| 0.1.2 | Click **"Set Up New Club"** button | **Step 1 of 4: Club Info** appears. Shows ONLY: Club Name, City, State, ZIP, Estimated Members. NO admin/password fields on this step. | |
| 0.1.3 | Fill in Club Name = "Test Golf Club", City = "Dallas", State = "TX", ZIP = "75201" → Click **Next** | Advances to **Step 2 of 4: Admin Account**. No API call fired. Shows: Your Name, Email, Password fields. | |
| 0.1.4 | Leave all fields empty → Click **Next** | Validation error: "Your name is required" (user-friendly, no raw field names like `adminName`) | |
| 0.1.5 | Fill Name = "Sarah Mitchell", Email = "sarah@testgolf.club", Password = "TestPass123!" → Click **Next** | API call to `/api/onboard-club` succeeds (201). Advances to **Step 3 of 4: Upload Data**. Success banner: "Club created!" | |
| 0.1.6 | Check localStorage in DevTools | `swoop_club_id` = a UUID (e.g., `a1b2c3d4-...`), NOT `club_XXXX` timestamp format. `swoop_club_name` = "Test Golf Club". `swoop_auth_token` exists. | |
| 0.1.7 | Click **Skip for Now** on Upload Data step | Advances to **Step 4 of 4: Ready**. Shows "Test Golf Club is ready!" with "Open Dashboard" button. | |
| 0.1.8 | Click **Open Dashboard** | Dashboard loads. Header shows "Sarah Mitchell / Test Golf Club" (not raw club ID). | |
| 0.1.9 | Green **LIVE** badge visible | Green badge with success styling next to page title. | |
| 0.1.10 | Footer shows user info | "Sarah Mitchell · Connected Club" or similar. No raw `club_xxx` IDs anywhere. | |

### 0.2 — Empty state: zero data imported

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 0.2.1 | **Today** page loads | Empty state: "Welcome to your dashboard" with guidance to import data. No demo data (no "Oakmont Hills", no fake member names). No JS console errors. | |
| 0.2.2 | **Members** page | Empty state: "No members imported yet" with guidance. No demo member list. | |
| 0.2.3 | **Service** page | Empty state or zeroed metrics across all 3 tabs (Quality / Staffing / Complaints). No crash. | |
| 0.2.4 | **Board Report** page | Empty state: "Board report needs data". **Export as PDF** and **Print** buttons visible in the header above the empty state message. | |
| 0.2.5 | **Admin** page → **Integrations** tab | All vendors (ForeTees, Lightspeed, Jonas, ADP, etc.) show "available" status. **None** show "connected". No sync times displayed. | |
| 0.2.6 | **Admin** page → **Data Health** tab | Tab exists and is clickable. All 5 domains (CRM, Tee Sheet, POS, Email & Events, Scheduling & Labor) show "Not Connected" with "—" rows. Value Score = 0%. | |
| 0.2.7 | **Admin** page → scroll to bottom | "Manual Data Upload" section visible with "Open Upload Tool" button. Fully scrollable into view. | |
| 0.2.8 | Open **Actions drawer** (right-side panel) | Inbox is empty — no demo actions referencing "Anne Jordan", "Robert Callahan", or other fake names. | |
| 0.2.9 | Type "Carol" in header search bar | "No results found" (expected — no members imported). No 500 errors in Network tab. | |
| 0.2.10 | Check Network tab | No 401 or 403 errors. `/api/feature-availability` returns 200 (not 401). No requests to `/api/weather?clubId=club_001`. | |

**Value at Phase 0:** User sees the app structure, understands what data is needed, and knows where to upload it. No crashes on empty data. No demo data leakage.

---

## Phase 1: Import Members (CRM — the foundation)

**What this unlocks:** Member directory, health score baselines, archetypes, at-risk identification, member profiles, search.

### 1.1 — Upload member roster CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.1.1 | Click **"Open Upload Tool"** on Admin page | Navigates to CSV import page (`#/csv-import`). Import type selector visible with 18 data types. Page title: "CSV Import" or similar. | |
| 1.1.2 | Select import type: **"Members"** | Selected in dropdown. | |
| 1.1.3 | Click the file upload area or button | File picker opens. Select a CSV or XLSX with 50+ members (columns: first_name, last_name, email, phone, membership_type, annual_dues, join_date). | |
| 1.1.4 | Click **Import** | Progress indicator shows. API call to `/api/import-csv` succeeds. Result shows: "Imported X members, 0 errors" (or similar success message). No 500 error. | |
| 1.1.5 | Upload a second file with Jonas-format columns (e.g., "Given Name", "Surname", "Member #", "Date Joined") | Auto-maps Jonas aliases to standard fields. Import succeeds. | |

### 1.2 — Verify Members page activates

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.2.1 | Navigate to **Members** page | No longer shows "No members imported yet". Member table displays with columns: Name, Score, Level, Archetype, Tier, Annual Value. | |
| 1.2.2 | Type a member's name in header search bar | Search results appear in dropdown within 500ms. Shows name, email, archetype. | |
| 1.2.3 | Click a search result | Navigates to member profile or Members page. Member info displayed. | |
| 1.2.4 | Click any member row in the table | Member profile opens with: name, email, phone, membership tier, join date. Health score may show "—" or baseline (no engagement data yet). | |
| 1.2.5 | Navigate to `/#/members/at-risk` | **At-Risk** tab is selected. Health overview shows distribution. With no engagement data, most members may show as Critical/At-Risk. | |
| 1.2.6 | Navigate to `/#/members/first-90-days` | **First 90 Days** tab is selected (not At-Risk). Shows members with recent join dates (if any). | |
| 1.2.7 | Navigate to `/#/members/all-members` or click "All Members" tab | Full member roster visible. Pagination or scroll works. | |

### 1.3 — Verify other pages update

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.3.1 | **Today** page | No longer shows empty state. Shows member count or basic alerts. | |
| 1.3.2 | **Board Report** | KPIs may now show member count. Other metrics still minimal. | |
| 1.3.3 | **Admin → Data Health** | CRM domain now shows "Connected" with row count matching import. | |

**Value at Phase 1:** Club sees their full member roster, can search/filter, sees each member's profile.

---

## Phase 2: Import Golf Rounds (Tee Sheet — engagement signal #1)

**What this unlocks:** Golf engagement scores (30% of health), round frequency, archetype differentiation (Die-Hard Golfer vs Ghost).

### 2.1 — Upload rounds CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.1.1 | Navigate to CSV import (`#/csv-import`), select type: **"Rounds"** | Selected in dropdown. | |
| 2.1.2 | Upload CSV with 200+ rounds (various members, dates over last 90 days) | Parses and imports successfully. Count matches. No errors. | |

### 2.2 — Compute health scores

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.2.1 | Run health score computation via curl: `curl -X POST "https://[app-url]/api/compute-health-scores?clubId=[YOUR_CLUB_ID]" -H "Authorization: Bearer [token]"` | Returns success with count of scored members. | |
| 2.2.2 | Navigate to **Members → All Members** | Health scores now show numeric values (not "—"). Members with many rounds score higher. | |
| 2.2.3 | Check archetype column | Active golfers: "Die-Hard Golfer" or "Weekend Warrior". Inactive: "Ghost" or "Declining". Recent joins: "New Member". | |

### 2.3 — Verify golf-dependent features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.3.1 | **Members → At-Risk** | Distribution now meaningful: Healthy/Watch/At-Risk/Critical based on golf activity. | |
| 2.3.2 | Click a member with many rounds | Profile shows golf engagement score. | |
| 2.3.3 | Click a member with zero rounds | Profile shows low golf score. Flagged as engagement risk. | |
| 2.3.4 | **Board Report** | Golf-related KPIs begin populating. | |

**Value at Phase 2:** Club sees which members are active golfers vs. disengaged. Health scores become meaningful.

---

## Phase 3: Import F&B Transactions (POS — engagement signal #2)

**What this unlocks:** Dining engagement scores (25% of health), spend patterns, Social Butterfly archetype, Service page metrics.

### 3.1 — Upload transactions CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.1.1 | CSV import → select type: **"Transactions"** | Selected. | |
| 3.1.2 | Upload CSV with 500+ transactions (various members, outlets, dates) | Import succeeds. Count matches. | |

### 3.2 — Recompute health scores

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.2.1 | Run health score computation again | Scores update with dining dimension factored in. | |
| 3.2.2 | **Members → All Members** | Scores shifted. Members with high dining but low golf may rise. New archetypes appear: "Social Butterfly". | |
| 3.2.3 | Click a high-spender member profile | Dining engagement dimension visible. | |

### 3.3 — Verify Service page activates

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.3.1 | **Service → Quality** | Service metrics now compute from real data. Revenue figures visible. | |
| 3.3.2 | **Today** page | More data points. Dining-related insights may appear. | |
| 3.3.3 | **Board Report** | F&B revenue KPIs populate. | |

**Value at Phase 3:** GM sees the full dining picture. Can identify members who golf but never dine (revenue opportunity).

---

## Phase 4: Import Complaints (Feedback — service quality)

**What this unlocks:** Complaint tracking, resolution metrics, Service page complaints tab.

### 4.1 — Upload complaints CSV

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.1.1 | CSV import → select type: **"Complaints"** | Selected. | |
| 4.1.2 | Upload CSV with 20+ complaints (mix of statuses: In Progress, Resolved, Escalated) | Import succeeds. | |

### 4.2 — Verify complaint-dependent features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.2.1 | **Service → Complaints** | Complaint list populates. Filters: All, Acknowledged, In Progress, Escalated, Resolved. Count matches. | |
| 4.2.2 | **Service → Quality** | Resolution Rate updates. Open complaint count accurate. | |
| 4.2.3 | **Today** page | Open complaints count in operational briefing. | |
| 4.2.4 | **Board Report** | Quality KPIs update with complaint data. | |

**Value at Phase 4:** GM has a service quality dashboard. Can track complaint resolution and identify patterns.

---

## Phase 5: Import Events + Registrations (engagement signal #3)

**What this unlocks:** Event engagement scores (20% of health), First 90 Days milestones.

### 5.1 — Upload events + registrations

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.1.1 | CSV import → type: **"Events"** → upload 10+ event definitions | Import succeeds. | |
| 5.1.2 | CSV import → type: **"Event Registrations"** → upload registrations linking members to events | Import succeeds. | |

### 5.2 — Recompute and verify

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.2.1 | Recompute health scores | Event dimension now active. | |
| 5.2.2 | **Members → All Members** | Scores shift. "Social Butterfly" and "Balanced Active" archetypes more accurate. | |
| 5.2.3 | **Members → First 90 Days** | New members show event participation progress. | |

**Value at Phase 5:** Three of four health dimensions active. Archetypes become highly accurate.

---

## Phase 6: Import Email Engagement (engagement signal #4)

**What this unlocks:** Email engagement scores (25% of health), full health score accuracy, complete archetypes.

### 6.1 — Upload email data

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.1.1 | CSV import → type: **"Email Campaigns"** → upload campaign definitions | Import succeeds. | |
| 6.1.2 | CSV import → type: **"Email Events"** → upload opens, clicks, bounces per member | Import succeeds. | |

### 6.2 — Full health score computation

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.2.1 | Recompute health scores | All 4 dimensions now weighted: Golf (30%), Dining (25%), Email (25%), Events (20%). | |
| 6.2.2 | **Members → All Members** | Final accurate scores and archetypes. | |
| 6.2.3 | **Members → At-Risk** | At-risk list is now highly accurate. | |
| 6.2.4 | Verify "Ghost" members | Low scores across all 4 dimensions → classified as "Ghost". | |
| 6.2.5 | Verify "Balanced Active" members | Moderate-to-high across all dimensions → "Balanced Active". | |

**Value at Phase 6:** Full health intelligence active. Every member has a complete engagement picture.

---

## Phase 7: Import Staffing Data (operational layer)

**What this unlocks:** Staffing vs. demand analysis, understaffed day detection, complaint-staffing correlation.

### 7.1 — Upload staff + shifts

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.1.1 | CSV import → type: **"Staff"** → upload employee roster | Import succeeds. | |
| 7.1.2 | CSV import → type: **"Staff Shifts"** → upload 30 days of shift data | Import succeeds. | |

### 7.2 — Verify staffing features

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.2.1 | **Service → Staffing** | Staffing vs. demand data populates. Understaffed days identified. | |
| 7.2.2 | **Today** page | Staffing cards show outlet coverage. Tomorrow Forecast may include staffing risk. | |
| 7.2.3 | **Board Report** | Operational efficiency KPIs update. | |

**Value at Phase 7:** GM sees the link between staffing gaps and service quality.

---

## Phase 8: Final Validation — Full Dataset

### 8.1 — Cross-page consistency

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.1.1 | **Today** | All sections populated: greeting, rounds, staffing cards, complaints, weather. | |
| 8.1.2 | **Members** — all 3 tabs | At-Risk (meaningful flags), All Members (full roster with scores), First 90 Days (cohort tracking). | |
| 8.1.3 | **Service** — all 3 tabs | Quality (consistency score), Staffing (gap analysis), Complaints (full list with filters). | |
| 8.1.4 | **Board Report** | All KPI cards populated. Summary and Details tabs render. Export as PDF generates content. | |
| 8.1.5 | **Admin → Data Health** | All connected domains show row counts and "Connected" status. Value Score > 0%. | |

### 8.2 — Member profile deep dives

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.2.1 | Open a "Die-Hard Golfer" | High golf score, moderate-to-low dining/events. | |
| 8.2.2 | Open a "Social Butterfly" | High events + dining, low golf. | |
| 8.2.3 | Open a "Ghost" | All dimensions low. Flagged as Critical. | |
| 8.2.4 | Open a "New Member" | Join date within 120 days. First 90 Days milestones tracked. | |

### 8.3 — Search and navigation

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.3.1 | Type member name in search bar | Results appear within 500ms with name, email, archetype. | |
| 8.3.2 | Click a search result | Navigates to member. | |
| 8.3.3 | Press Ctrl+K (or Cmd+K on Mac) | Search bar focuses. | |
| 8.3.4 | Press Escape in search | Dropdown closes, query clears. | |

### 8.4 — Auth and security

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.4.1 | Sign out → Sign back in with created credentials | Login succeeds. All data still present. Header shows club name (not raw ID). | |
| 8.4.2 | Click "Forgot your password?" | Inline form appears with email input and "Send Reset Link" button. Submitting shows confirmation message. | |
| 8.4.3 | Navigate to `/#/reset-password` (no token) | Shows "Invalid Link" page. "Back to Sign In" link navigates to login. | |
| 8.4.4 | Navigate to `/#/reset-password?token=fake` | Shows "Invalid Link" immediately (no password form). Not a 500 error. | |

### 8.5 — Notification bell

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.5.1 | Bell icon visible in header | Bell icon next to user avatar. | |
| 8.5.2 | Click bell | Dropdown opens: "No new notifications" or notification list. No crash. | |
| 8.5.3 | Unread badge | Shows count if unread; hidden if zero. | |

### 8.6 — No demo data leakage

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.6.1 | Search all pages for "Oakmont Hills" | Not found anywhere. All references use your club name. | |
| 8.6.2 | Actions drawer Inbox | Empty or contains only actions from YOUR imported data. No "Anne Jordan", "Robert Callahan", "James Whitfield". | |
| 8.6.3 | Check console for errors | No JavaScript errors during normal navigation. | |

---

## Progressive Value Summary

| Phase | Dataset Imported | New Value Unlocked |
|-------|------------------|--------------------|
| **0** | (none) | App structure visible, upload guidance, zero crashes on empty data |
| **1** | Members | Full roster, search, member profiles, membership tier breakdown |
| **2** | + Golf Rounds | Health scores activate, at-risk detection begins, archetype differentiation |
| **3** | + F&B Transactions | Dining engagement, revenue analytics, Service page metrics |
| **4** | + Complaints | Service quality tracking, resolution rates |
| **5** | + Events | Event engagement dimension, Balanced Active archetype, First 90 Days milestones |
| **6** | + Email | Full 4-dimension health scores, complete archetype accuracy |
| **7** | + Staffing | Operational intelligence, understaffing alerts, complaint correlation |
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
| Phase 0: Empty states | All pages load without crash. Clear guidance shown. No demo data. |
| Phase 0: Wizard | 4-step flow works: Club Info → Admin Account → Upload Data → Ready |
| Phase 0: Auth | UUID club ID, club name in header, valid session token |
| Phase 1-7: Progressive import | Each import succeeds via CSV import page. Each phase unlocks new visible features. No regressions. |
| Phase 8: Full validation | All pages fully populated. Member profiles complete. Search works. Auth works. |
| Zero console errors | No JavaScript errors during normal navigation. |
| No demo data leakage | Real club never shows Oakmont Hills demo data or fake member names. |
| No raw IDs | Club ID never shown to user in header, footer, or any visible UI element. |
| API health | No 401, 403, or 500 errors in Network tab during normal operation. |
