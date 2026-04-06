# QA Test: CSV Import Wizard with Column Mapping

**App URL:** https://swoop-member-portal-dev.vercel.app
**Page:** Admin → Manual Data Upload (or direct: `#/csv-import`)
**Purpose:** Verify the new 4-step import wizard works end-to-end with auto column detection, manual mapping override, and successful data import.
**Test data:** `docs/jonas-exports/` — real Jonas Club Management exports.

---

## Prerequisites

1. Log in as a club admin (not demo mode)
2. Navigate to **Admin → Manual Data Upload**
3. Keep DevTools Console open to catch any JS errors

---

## Section 1: Wizard UI & Navigation

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 1.1 | Page loads without errors | Navigate to Admin → Manual Data Upload | 4-step wizard appears: "Select Data → Upload File → Map Columns → Import". Step 1 is active (highlighted). No JS console errors. | |
| 1.2 | Step indicator renders | Observe the top of the page | Four numbered circles with labels. Step 1 is orange/branded, others are gray. | |
| 1.3 | Vendor selector shows Jonas pre-selected | Look at "Which club software" section | Jonas Club Software is selected (highlighted border). Other vendors (Club Essential, Northstar, foreUP) show "Coming soon" and are disabled/grayed out. "Other / Generic CSV" is selectable. | |
| 1.4 | Data type cards show Jonas details | Scroll through data type list | 10 import types visible: Members, Tee Times, Transactions, Complaints, Events, Event Registrations, Email Campaigns, Email Events, Staff Roster, Staff Shifts. Each card shows: icon, label, step number badge, description, Jonas file name, export method, and "unlocks" badges. | |
| 1.5 | "Next" button disabled without selection | Deselect import type (if possible) | "Next: Upload File" button is disabled/grayed out when no import type is selected. | |
| 1.6 | Forward navigation works | Select "Members" → click "Next: Upload File" | Wizard advances to Step 2. Step indicator updates (step 1 shows green checkmark, step 2 is active). | |
| 1.7 | Back navigation works | Click "Back" on Step 2 | Returns to Step 1 with previous selections preserved (Jonas still selected, Members still highlighted). | |

---

## Section 2: File Upload (Step 2)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 2.1 | Jonas export instructions shown | Select Members → Next | Blue instruction card: "How to export from Jonas" with 4 numbered steps mentioning "Club Management" and "F9 Lister on Member entity". Shows expected file: `JCM_Members_F9.csv`. | |
| 2.2 | Drop zone renders | Observe upload area | Dashed-border drop zone with "Drop your file here, or click to browse" text. Shows "CSV or XLSX" and "First row must be column headers". | |
| 2.3 | Required fields hint shown | Below the drop zone | Text showing "Required columns: First Name, Last Name". | |
| 2.4 | File picker works | Click the drop zone | OS file picker opens. Select `docs/jonas-exports/JCM_Members_F9.csv`. | |
| 2.5 | File appears after selection | Select a CSV file | Drop zone changes to green border, shows filename, file size in KB, and "Click or drop to change" text. Checkmark icon shown. | |
| 2.6 | "Next" button enabled with file | After file is selected | "Next: Map Columns" button is enabled (orange, not grayed out). | |
| 2.7 | XLSX file accepted | Try uploading any `.xlsx` file | File accepted, same green state. No error. | |
| 2.8 | Invalid file rejected | Try uploading a `.txt` or `.pdf` file | Error message: "Unsupported file type" appears below the buttons. | |
| 2.9 | Empty CSV rejected | Upload a CSV with only headers, no data rows | Error message: "No data rows found in file". | |

---

## Section 3: Column Mapping — Auto-Detection (Step 3)

Test with `JCM_Members_F9.csv` (Members import type).

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 3.1 | Auto-mapping fires | Select Members → Upload `JCM_Members_F9.csv` → Next | Column mapping screen appears. Most columns are pre-mapped automatically. Status shows "X of Y columns mapped". | |
| 3.2 | Jonas headers auto-detected | Check the mapping table | These Jonas columns should auto-map: `Given Name` → First Name, `Surname` → Last Name, `Member #` → Member ID / External ID, `Email` → Email, `Phone #` → Phone, `Membership Type` → Membership Type, `Annual Fee` → Annual Dues, `Date Joined` → Join Date, `Status` → Status, `Birthday` → Birthday, `Sex` → Gender, `Handicap #` → Handicap / GHIN #, `Current Balance` → Account Balance, `Date Resigned` → Date Resigned, `Household ID` → Household ID. | |
| 3.3 | Required fields indicator | Check mapping status | "All required fields mapped" message in green (First Name and Last Name are both mapped). | |
| 3.4 | Sample values shown | Check each row in mapping table | Each CSV column shows a sample value like `e.g. "Michael"` or `e.g. "Preston"` from the first data row. | |
| 3.5 | Mapped fields color-coded | Observe dropdown colors | Required mapped fields show green background. Optional mapped fields show blue background. Unmapped fields show gray "— Skip this column —". | |
| 3.6 | Preview table renders | Scroll below the mapping table | Data preview table showing first 5 rows with mapped Swoop column headers (First Name, Last Name, Email, etc.) and real data from the CSV. | |
| 3.7 | "Member Number" column handled | Check if `Member Number` column is mapped | `Member Number` may map to Member ID / External ID if `Member #` didn't take it first, or show as unmapped. No error either way. | |
| 3.8 | "Mailings" column unmapped | Check the `Mailings` column | Should show "— Skip this column —" since there's no Swoop field for it. This is expected. | |

---

## Section 4: Column Mapping — Manual Override

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 4.1 | Dropdown shows all Swoop fields | Click any mapping dropdown | All available fields listed: First Name *, Last Name *, Member ID / External ID, Email, Phone, Membership Type, Annual Dues, Join Date, Status, Household ID, Birthday, Gender, Handicap / GHIN #, Account Balance, Date Resigned. Required fields marked with *. | |
| 4.2 | Can change a mapping | Change `Given Name` from "First Name" to "— Skip this column —" | Mapping updates. "1 required field unmapped" warning appears in red. Import button becomes disabled with text "Map 1 required field to continue". | |
| 4.3 | Can reassign a mapping | Change `Given Name` back to "First Name" | Warning clears. "All required fields mapped" shows green. Import button re-enables. | |
| 4.4 | Duplicate prevention | Try to map two CSV columns to the same Swoop field | The already-used Swoop field shows "(already mapped)" and is disabled in the second dropdown. | |
| 4.5 | Preview updates with mapping changes | Change a mapping, then check preview table | Preview table columns and data update to reflect the new mapping. | |

---

## Section 5: Import Execution (Step 4)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 5.1 | Ready screen shows | Click "Import X Rows" from Step 3 | Step 4 shows: rocket emoji, "Ready to Import", row count (e.g. "390 rows of Members data"), mapped column count, and "Start Import" button. | |
| 5.2 | Loading spinner during import | Click "Start Import" | Spinning loader appears with "Importing 390 rows..." message. | |
| 5.3 | Success result | Wait for import to complete | Green success card: "Import Complete". Shows Total / Imported / Errors in 3-column grid. Imported count should be ~390. Errors should be 0 or near-0. | |
| 5.4 | "What this unlocks" shown | Below the result card | Blue card listing: "Member roster & search", "Membership tier breakdown", "Dues at Risk calculations", "Board Report KPIs". | |
| 5.5 | "Import More Data" button | After success | Orange button "Import More Data" resets wizard back to Step 1. | |
| 5.6 | No JS console errors | Check DevTools Console | No 500s, no uncaught exceptions, no React errors during entire flow. | |

---

## Section 6: All 10 Import Types — File-Specific Tests

Run each import type with its Jonas test file. For each, verify: auto-mapping fires correctly, required fields are mapped, import succeeds.

| # | Import Type | Test File | Key Auto-Mappings to Verify | Expected Result | Pass? |
|---|-------------|-----------|---------------------------|-----------------|-------|
| 6.1 | **Members** | `JCM_Members_F9.csv` | `Given Name` → First Name, `Surname` → Last Name, `Member #` → External ID | ~390 imported | |
| 6.2 | **Tee Times / Bookings** | `TTM_Tee_Sheet_SV.csv` | `Reservation ID` → Reservation ID, `Course` → Course, `Date` → Date, `Tee Time` → Tee Time | ~4,415 imported | |
| 6.3 | **F&B Transactions** | `POS_Sales_Detail_SV.csv` | `Net Amount` → Total Amount, `Open Time` → Transaction Date, `Member #` → Member #, `Sales Area` → Outlet | ~1,916 imported | |
| 6.4 | **Complaints** | `JCM_Communications_RG.csv` | `Type` → Category, `Subject` → Description, `Member #` → Member # | ~33 imported | |
| 6.5 | **Events** | `JAM_Event_List_SV.csv` | `Event Number` → Event ID, `Event Name` → Event Name, `Event Type` → Event Type | ~15 imported | |
| 6.6 | **Event Registrations** | `JAM_Registrations_SV.csv` | `Registration ID` → Registration ID, `Event Number` → Event ID, `Client Code` → Member | ~1,649 imported | |
| 6.7 | **Email Campaigns** | `CHO_Campaigns_SV.csv` | `Campaign ID` → Campaign ID, `Subject` → Subject Line, `Audience Count` → Audience | ~20 imported | |
| 6.8 | **Email Events** | `CHO_Email_Events_SV.csv` | `Campaign` → Campaign ID, `Member #` → Member #, `Event Type` → Event Type | ~10,105 imported | |
| 6.9 | **Staff Roster** | `ADP_Staff_Roster.csv` | `Employee ID` → Employee ID, `First Name` → First Name, `Last Name` → Last Name, `FT/PT` → Full-Time/Part-Time | ~45 imported | |
| 6.10 | **Staff Shifts** | `7shifts_Staff_Shifts.csv` | `Shift ID` → Shift ID, `Employee ID` → Employee ID, `Date` → Shift Date, `Act Hrs` → Actual Hours | ~641 imported | |

---

## Section 7: Edge Cases

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.1 | Large file performance | Upload `CHO_Email_Events_SV.csv` (10,105 rows) | File parses within 2-3 seconds. Column mapping screen is responsive. Import may take longer but completes without timeout. | |
| 7.2 | CSV with quoted commas | Upload a CSV where a field value contains a comma inside quotes (e.g. `"Smith, Jr."`) | Field parsed correctly as one value, not split at the comma. | |
| 7.3 | Switching import type resets | Go to Step 1, switch from Members to Tee Times, upload a file, go to mapping | Mapping shows Tee Times fields (Reservation ID, Course, Date, Tee Time) not Members fields. | |
| 7.4 | Not logged in | Log out, navigate to `#/csv-import`, try to import | Error message: "No club connected. Please log in first." on Step 4. | |
| 7.5 | "Other / Generic CSV" vendor | Select "Other / Generic CSV" as vendor | Same import type cards appear (they're the standard Swoop types). No Jonas-specific instructions shown on Step 2. Column auto-mapping still works based on Swoop field name aliases. | |
| 7.6 | Re-import same file | Import Members, then click "Import More Data" → Members → same file | Second import succeeds. Records are upserted (updated, not duplicated). Member count stays ~390, not ~780. | |
| 7.7 | Browser back button | Use browser back from Step 3 | Does NOT navigate away from the page (it's a hash-routed SPA). Wizard state may reset — this is acceptable. | |

---

## Section 8: Data Verification After Import

After completing all imports in Section 6, verify the data appears correctly in the app.

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 8.1 | Members visible | Go to Members → All Members | ~390 members with names, emails, membership types from the imported CSV. | |
| 8.2 | Search works | Type a member name in the search bar | Instant results with matching member from imported data. | |
| 8.3 | Data Health updated | Go to Admin → Data Health | Domains show "Connected" with row counts matching import totals. | |
| 8.4 | Board Report populates | Go to Board Report | KPIs show non-zero values based on imported member and transaction data. | |

---

## Pass Criteria

| Criterion | Requirement |
|-----------|-------------|
| Wizard loads | No JS errors, all 4 steps render correctly |
| Jonas auto-mapping | At least 80% of columns auto-detect for each Jonas test file |
| Manual override | Can change, clear, and reassign column mappings |
| Required field validation | Cannot proceed to import with unmapped required fields |
| All 10 imports succeed | 0 errors (or only expected validation warnings) per import |
| No crashes | No JS console errors, no 500s, no blank pages at any step |
| Data appears in app | Imported data visible on Members, Service, Board Report pages |
