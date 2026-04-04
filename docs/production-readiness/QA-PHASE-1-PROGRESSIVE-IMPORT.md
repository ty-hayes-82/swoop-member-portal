# QA Test Plan: Phase 1 — Progressive Data Import

**App URL:** https://swoop-member-portal-production-readiness.vercel.app/#/login
**Branch:** `production-readiness-plan`
**Repo:** https://github.com/ty-hayes-82/swoop-member-portal/tree/production-readiness-plan
**Build:** `229529a` (or later)

---

## Prerequisites

| Step | Command / Action | Expected |
|------|-----------------|----------|
| Migration 006 | `POST /api/migrations/006-weather-tables` | 200 — weather tables created |
| Migration 007 | `POST /api/migrations/007-add-club-id-tenant-isolation` | 200 — club_id added to 25+ tables |
| Migration 008 | `POST /api/migrations/008-jonas-import-columns` | 200 — Jonas columns added |
| Migration 009 | `POST /api/migrations/009-ensure-club-id-everywhere` | 200 — club_id on all 54 tables, 0 errors |

All migration endpoints use `POST` against the app URL, e.g.:
```
POST https://swoop-member-portal-production-readiness.vercel.app/api/migrations/009-ensure-club-id-everywhere
```

---

## Test 1: Demo Mode Still Works (No Regression)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 1.1 | Go to `/#/login`, click "Try Demo" | Logs in as demo user with Oakmont Hills data | |
| 1.2 | Navigate to **Today** | Tee sheet, weather, staffing, revenue sections all populated with demo data | |
| 1.3 | Navigate to **Service** > Quality tab | Service consistency score shows (e.g., 70+), complaint breakdown visible | |
| 1.4 | Navigate to **Service** > Staffing tab | Understaffed days table shows 3 entries (Grill Room), complaint correlation visible | |
| 1.5 | Navigate to **Service** > Complaints tab | Feedback records visible, status filters work, complaint drivers section shows | |
| 1.6 | Navigate to **Members** | Member roster with health scores, archetype distribution visible | |
| 1.7 | Navigate to **Board Report** | KPIs, member saves, operational saves all populated | |
| 1.8 | Navigate to **Admin** | Integration sources listed, data health section visible | |

**Why:** Ensures the `isAuthenticatedClub()` guards don't break the demo experience.

---

## Test 2: Real Club — Empty State Behavior

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 2.1 | Create a test club via API: `POST /api/onboard-club` with body `{ "clubName": "QA Test Club", "adminEmail": "qa@test.com", "adminPassword": "testpass123", "adminName": "QA Tester" }` | Returns 201 with `clubId` and session token | |
| 2.2 | Log in as the QA Test Club user | Dashboard loads, no errors in console | |
| 2.3 | Navigate to **Today** | Shows welcome empty state: "Welcome to your dashboard — Import your member roster, tee sheet, and POS data..." No fake rounds count (220), no Grill Room, no David Kowalski, no action queue. | |
| 2.4 | Navigate to **Service** > Quality tab | Shows dashed-border empty state: "No service quality data yet — Import POS and feedback data..." | |
| 2.5 | Navigate to **Service** > Staffing tab | Shows dashed-border empty state: "No staffing data yet — Import staffing and shift data..." | |
| 2.6 | Navigate to **Service** > Complaints tab | Shows dashed-border empty state: "No complaint data yet — Import feedback data from your CRM..." | |
| 2.7 | Navigate to **Members** > At-Risk tab | Empty or "No members currently flagged". NO Oakmont Hills demo members (Jennifer Walsh, Nathan Burke, etc.) | |
| 2.8 | Navigate to **Members** > All Members tab | Shows empty state: "No members imported yet — Import your member roster..." NO 300 synthetic demo members. | |
| 2.9 | Navigate to **Board Report** | Shows empty state: "Board report needs data — Import member, golf, and F&B data..." NO demo KPIs (87%, 14 retained), no Oakmont Hills references. | |
| 2.10 | Navigate to **Admin** | Page loads, no crash | |
| 2.11 | Open browser console (F12) | Zero JavaScript errors. API 500s acceptable if frontend handles them gracefully (no white screens). | |

**Why:** Validates that a real club with no data sees clean empty states, not Oakmont Hills demo data.

---

## Test 3: CSV Import — Members (Phase 1 Core Path)

**Test file:** [`docs/jonas-exports/JCM_Members_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Members_F9.csv)
- 390 rows, 17 columns
- Key columns: `Member #`, `Given Name`, `Surname`, `Email`, `Membership Type`, `Date Joined`, `Annual Fee`

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 3.1 | Navigate to **Admin** > CSV Import | Import UI loads with template selector | |
| 3.2 | Select "Members" template | Shows member fields (first_name, last_name, email, etc.) | |
| 3.3 | Upload [`docs/jonas-exports/JCM_Members_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Members_F9.csv) | File parsed, 390 rows detected, columns displayed | |
| 3.4 | Check auto-mapping with vendor hint "Jonas" | `Member #` -> member_id, `Given Name` -> first_name, `Surname` -> last_name, `Date Joined` -> join_date, `Annual Fee` -> annual_dues — all green/auto-matched | |
| 3.5 | Run validation | Most rows show "ready" status (green). Some may warn on optional fields. | |
| 3.6 | Click Import | Import completes. Status: "Complete" or "Partial" (not "Failed"). | |
| 3.7 | Navigate to **Members** > All Members | 390 members now visible with names, membership types, join dates | |
| 3.8 | Click a member name | Profile loads with available data (name, type, dues). Health score shows "Insufficient Data" (only 1 data dimension). | |
| 3.9 | Navigate to **Service** tabs | Still showing empty states — members alone don't populate service data | |
| 3.10 | Navigate to **Today** | May show member count. Tee sheet/revenue sections still show welcome empty state. No crash. | |

**Why:** Validates the core import path and that members-only data doesn't break anything.

---

## Test 4: Import Type Validation (API-level)

Use curl, Postman, or browser dev tools. Replace `<TOKEN>` with the session token from Test 2.1. All requests are `POST` to `https://swoop-member-portal-production-readiness.vercel.app/api/import-csv` with `Authorization: Bearer <TOKEN>` header.

**Reference file:** [`docs/jonas-exports/JCM_Membership_Types_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Membership_Types_F9.csv) (6 rows)

| # | Step | Body | Expected Result | Pass? |
|---|------|------|----------------|-------|
| 4.1 | Import membership types | `{ "importType": "membership_types", "rows": [{"type_code": "FG", "description": "Full Golf", "annual_fee": 18000}] }` | Returns 200 with `success: 1` | |
| 4.2 | Import club profile | `{ "importType": "club_profile", "rows": [{"club_name": "QA Test Club", "city": "Scottsdale", "state": "AZ"}] }` | Returns 200 with `success: 1` | |
| 4.3 | Invalid import type | `{ "importType": "invalid_type", "rows": [] }` | Returns 400 with error listing valid types (21 types) | |
| 4.4 | Missing required field | `{ "importType": "members", "rows": [{"last_name": "Test"}] }` (missing `first_name`) | Returns 200 with `errors: 1`, validation catches missing field | |

**Why:** Verifies new import types work and validation still catches errors.

---

## Test 5: Cross-Page Navigation (Smoke Test)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 5.1 | As real club user (with members imported from Test 3), click through all 5 nav items rapidly: Today, Service, Members, Board Report, Admin | All pages load, no white screen, no console errors | |
| 5.2 | Switch between Service tabs (Quality -> Staffing -> Complaints -> Quality) rapidly | Tabs switch cleanly, empty states appear consistently | |
| 5.3 | Log out, log back in as demo ("Try Demo") | Demo data reappears on all pages — no contamination from real club data | |
| 5.4 | Log out of demo, log back in as real club | Empty states reappear — no contamination from demo data | |

---

## Test 6: API Health Check (Post-Migration)

Use curl or browser dev tools with auth token. All requests need `Authorization: Bearer <TOKEN>` header.

| # | Endpoint | Expected | Pass? |
|---|----------|----------|-------|
| 6.1 | `GET /api/members` | 200 — returns member data (or `total: 0` for empty club) | |
| 6.2 | `GET /api/operations` | 200 — returns operations data (may be empty for new club) | |
| 6.3 | `GET /api/staffing` | 200 — returns staffing data (may be empty) | |
| 6.4 | `GET /api/briefing` | 200 — returns briefing data (may be empty) | |
| 6.5 | `GET /api/fb` | 200 — returns F&B data (may be empty) | |
| 6.6 | `GET /api/trends` | 200 — returns trends data (may be empty) | |
| 6.7 | `GET /api/integrations` | 200 — returns integration status | |
| 6.8 | `GET /api/agents` | 200 — returns agent definitions | |
| 6.9 | `GET /api/experience-insights` | 200 — returns insights data | |

**Why:** Confirms migration 009 resolved all API 500 errors.

---

## Test 7: Additional Jonas CSV Column Mapping (Optional / Stretch)

Upload each file via Admin > CSV Import with vendor hint "Jonas". Verify column auto-mapping shows green matches.

| # | File | Repo Path | Key Mapping to Verify |
|---|------|-----------|----------------------|
| 7.1 | Membership Types | [`docs/jonas-exports/JCM_Membership_Types_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Membership_Types_F9.csv) | `Type Code` -> type_code, `Description` -> description, `Annual Fee` -> annual_fee |
| 7.2 | Dependents | [`docs/jonas-exports/JCM_Dependents_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Dependents_F9.csv) | `Household ID` -> household_id, `Primary Member #` -> primary_member_id |
| 7.3 | Club Profile | [`docs/jonas-exports/JCM_Club_Profile.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Club_Profile.csv) | `Club Name` -> club_name, `City` -> city, `State` -> state |
| 7.4 | Course Setup | [`docs/jonas-exports/TTM_Course_Setup_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/TTM_Course_Setup_F9.csv) | `Course Code` -> course_code, `Course Name` -> course_name |
| 7.5 | Tee Sheet | [`docs/jonas-exports/TTM_Tee_Sheet_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/TTM_Tee_Sheet_SV.csv) | `Reservation ID` -> reservation_id, `Tee Time` -> tee_time |
| 7.6 | Tee Sheet Players | [`docs/jonas-exports/TTM_Tee_Sheet_Players_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/TTM_Tee_Sheet_Players_SV.csv) | `Player ID` -> player_id, `Guest Name` -> guest_name |
| 7.7 | POS Sales | [`docs/jonas-exports/POS_Sales_Detail_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/POS_Sales_Detail_SV.csv) | `Chk#` -> transaction_id, `Sales Area` -> outlet, `Net Amount` -> total |
| 7.8 | POS Line Items | [`docs/jonas-exports/POS_Line_Items_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/POS_Line_Items_SV.csv) | `Line Item ID` -> line_item_id, `Sales Category` -> sales_category |
| 7.9 | POS Payments | [`docs/jonas-exports/POS_Payments_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/POS_Payments_SV.csv) | `Payment ID` -> payment_id, `Settlement Method` -> settlement_method |
| 7.10 | POS Sales Areas | [`docs/jonas-exports/POS_Sales_Areas_F9.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/POS_Sales_Areas_F9.csv) | `Sales Area ID` -> sales_area_id, `Type` -> type |
| 7.11 | POS Daily Close | [`docs/jonas-exports/POS_Daily_Close_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/POS_Daily_Close_SV.csv) | `Golf Revenue` -> golf_revenue, `Covers` -> covers |
| 7.12 | Communications | [`docs/jonas-exports/JCM_Communications_RG.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Communications_RG.csv) | `Communication ID` -> feedback_id, `Happometer Score` -> severity |
| 7.13 | Service Requests | [`docs/jonas-exports/JCM_Service_Requests_RG.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Service_Requests_RG.csv) | `Request ID` -> request_id, `Response Time (min)` -> response_time_min |
| 7.14 | Aged Receivables | [`docs/jonas-exports/JCM_Aged_Receivables_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JCM_Aged_Receivables_SV.csv) | `Invoice #` -> invoice_id, `Aging Bucket` -> aging_bucket |
| 7.15 | Events | [`docs/jonas-exports/JAM_Event_List_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JAM_Event_List_SV.csv) | `Event Number` -> event_id, `Event Name` -> event_name |
| 7.16 | Registrations | [`docs/jonas-exports/JAM_Registrations_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/JAM_Registrations_SV.csv) | `Registration ID` -> registration_id, `Client Code` -> member_id |
| 7.17 | Email Campaigns | [`docs/jonas-exports/CHO_Campaigns_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/CHO_Campaigns_SV.csv) | `Campaign ID` -> campaign_id, `Send Date` -> send_date |
| 7.18 | Email Events | [`docs/jonas-exports/CHO_Email_Events_SV.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/CHO_Email_Events_SV.csv) | `Campaign` -> campaign_id, `Event Type` -> event_type |
| 7.19 | Staff Roster (ADP) | [`docs/jonas-exports/ADP_Staff_Roster.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/ADP_Staff_Roster.csv) | `Employee ID` -> employee_id, `Dept` -> department |
| 7.20 | Staff Shifts (7shifts) | [`docs/jonas-exports/7shifts_Staff_Shifts.csv`](https://github.com/ty-hayes-82/swoop-member-portal/blob/production-readiness-plan/docs/jonas-exports/7shifts_Staff_Shifts.csv) | `Shift ID` -> shift_id, `Act Hrs` -> actual_hours |

**All 21 Jonas CSV test files:** [`docs/jonas-exports/`](https://github.com/ty-hayes-82/swoop-member-portal/tree/production-readiness-plan/docs/jonas-exports)

---

## Bug Severity Guide

| Severity | Definition | Examples |
|----------|-----------|----------|
| **P0 (Blocker)** | App crashes, page won't render, demo data leaking into real club | White screen, "Cannot access before initialization", Oakmont Hills members showing for real club |
| **P1 (High)** | Import fails silently, wrong empty state, data not persisting, API 500 | Import returns "complete" but no rows in DB, empty state says wrong data type |
| **P2 (Medium)** | Column auto-mapping misses a Jonas field, cosmetic layout issue | `Handicap #` not auto-mapped, empty state icon wrong |
| **P3 (Low)** | Wording tweaks, spacing, minor UI polish | "Import feedback data" could be more specific |
