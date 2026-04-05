# Swoop Golf — Club Onboarding Runbook

**For:** Swoop team (concierge onboarding of first 5 clubs)
**Last updated:** April 5, 2026

---

## Overview

This runbook covers the steps to onboard a new private club onto the Swoop Member Portal. For the first 5 clubs, this is a concierge process — the Swoop team handles data export, import, and validation.

**Time estimate:** 2-4 hours per club (first time), 30-60 minutes with practice.

---

## Prerequisites

- [ ] Club has signed agreement
- [ ] GM contact name and email confirmed
- [ ] Club's vendor stack identified (Jonas, ForeTees, Clubessential, etc.)
- [ ] Access to the production deployment: https://swoop-member-portal.vercel.app
- [ ] `SENDGRID_API_KEY` configured in Vercel environment variables
- [ ] Migration 010 (password_resets table) has been run

---

## Step 1: Run Migrations (First Time Only)

If this is the first club being onboarded, run all migrations in order:

```
POST https://swoop-member-portal.vercel.app/api/migrations/001-core-tables
POST .../api/migrations/002-alter-members
POST .../api/migrations/003-relax-constraints
POST .../api/migrations/004-fix-all-constraints
POST .../api/migrations/005-drop-fk-constraints
POST .../api/migrations/006-weather-tables
POST .../api/migrations/007-add-club-id-tenant-isolation
POST .../api/migrations/008-jonas-import-columns
POST .../api/migrations/009-ensure-club-id-everywhere
POST .../api/migrations/010-password-resets-table
```

Each should return `200 OK`. If any fail, check the error message — most are idempotent (safe to re-run).

---

## Step 2: Create the Club

```bash
curl -X POST https://swoop-member-portal.vercel.app/api/onboard-club \
  -H "Content-Type: application/json" \
  -d '{
    "clubName": "Bowling Green Country Club",
    "city": "Bowling Green",
    "state": "KY",
    "zip": "42101",
    "memberCount": 300,
    "courseCount": 1,
    "outletCount": 5,
    "adminEmail": "daniel@bgcc.com",
    "adminName": "Daniel Soehren",
    "adminPassword": "TEMPORARY_PASSWORD_HERE"
  }'
```

**Save the response:** You'll need `clubId` and `userId` for subsequent steps.

```json
{
  "clubId": "club_xxx",
  "userId": "usr_xxx",
  "message": "Club created. Onboarding started.",
  "nextStep": "crm_connected"
}
```

**Important:** Tell the GM to change their password after first login (or use the password reset flow).

---

## Step 3: Export Data from Jonas

Work with the club's IT contact or Jonas administrator to export these CSV files:

### Required (minimum viable)
| Export | Jonas Report | Key Columns |
|--------|-------------|-------------|
| **Members** | JCM_Members_F9 | Given Name, Surname, Email, Member #, Membership Type, Date Joined, Annual Fee |

### Recommended (unlocks more features)
| Export | Jonas Report | Key Columns |
|--------|-------------|-------------|
| **Tee Sheet** | TTM_Tee_Sheet_SV | Reservation ID, Course, Date, Tee Time, Players |
| **POS Transactions** | POS_Sales_Detail_SV | Chk#, Sales Area, Net Amount, Member # |
| **Events** | JAM_Event_List_SV + JAM_Registrations_SV | Event Number, Event Name, Client Code |

### Optional
| Export | Jonas Report |
|--------|-------------|
| Membership Types | JCM_Membership_Types_F9 |
| Dependents | JCM_Dependents_F9 |
| Course Setup | TTM_Course_Setup_F9 |
| POS Line Items | POS_Line_Items_SV |
| Sales Areas | POS_Sales_Areas_F9 |
| Complaints | JCM_Communications_RG |

**Column mapping is automatic.** Jonas column names like "Given Name", "Surname", "Member #" are mapped to Swoop fields via the alias system. No manual column renaming needed.

---

## Step 4: Import Data

### Option A: CSV Upload UI (Recommended)

1. Log in as the club's admin user
2. Navigate to **Admin** → **Integrations**
3. Click **Open Upload Tool**
4. Upload each CSV file and select the import type
5. Review the mapping preview and confirm

### Option B: API Direct (For Swoop Team)

First, get an auth token:

```bash
TOKEN=$(curl -s -X POST https://swoop-member-portal.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "daniel@bgcc.com", "password": "TEMPORARY_PASSWORD_HERE"}' \
  | jq -r '.token')
```

Then import each file (convert CSV to JSON rows first):

```bash
curl -X POST https://swoop-member-portal.vercel.app/api/import-csv \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "importType": "members",
    "rows": [
      {"first_name": "John", "last_name": "Smith", "email": "john@bgcc.com", ...},
      ...
    ]
  }'
```

**Import order:** Members first (required), then tee_times, transactions, complaints in any order.

---

## Step 5: Compute Health Scores

After importing at least members + one other data type:

```bash
curl -X POST "https://swoop-member-portal.vercel.app/api/compute-health-scores?clubId=CLUB_ID_HERE" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "totalMembers": 300,
  "computed": 295,
  "errors": 5,
  "alerts": 12,
  "message": "Health scores computed for 295 members. 12 members with significant score drops."
}
```

**Validation checklist:**
- [ ] `computed` count matches expected member count (within ~5%)
- [ ] No more than 5% errors
- [ ] Health tier distribution looks reasonable:
  - Healthy: 60-70% (most common)
  - Watch: 15-25%
  - At Risk: 5-15%
  - Critical: 2-8%
- [ ] Check first 10 members manually — do scores make intuitive sense?

---

## Step 6: Validate the Dashboard

Log in as the GM and check each page:

| Page | What to Verify |
|------|---------------|
| **Today** | Greeting shows, rounds count reflects tee sheet data, member alerts populated |
| **Members** | At-Risk tab shows flagged members, All Members shows full roster with health scores |
| **Service** | Quality tab shows consistency score (if complaint data imported), Staffing tab shows data |
| **Board Report** | KPIs populated (Service Quality, Members Retained, etc.) |
| **Admin** | Connected sources show "connected" status with row counts |

**If a page shows "No data yet" empty state:**
- Check which import type is missing
- The empty state message tells you exactly what data to import

---

## Step 7: Go Live

1. **Share credentials with the GM:**
   - URL: `https://swoop-member-portal.vercel.app/#/login`
   - Email: (the one used in Step 2)
   - Password: (tell them to use "Forgot Password" to set their own)

2. **Send welcome email** with:
   - Login URL
   - Quick start guide (which pages to check first)
   - Your contact info for questions

3. **Monitor for 48 hours:**
   - Check for any console errors (Vercel logs)
   - Verify the GM actually logs in (check `last_login` in users table)
   - Look for health scores that seem nonsensical (all 0s, all 100s, etc.)

---

## Troubleshooting

### "No members imported yet" on Members page
**Cause:** Members CSV not imported, or imported to wrong club_id.
**Fix:** Re-import members CSV with correct auth token.

### Health scores all show 0 or "Insufficient Data"
**Cause:** Only member roster imported, no engagement data (rounds, transactions).
**Fix:** Import at least one additional data type (tee_times or transactions), then re-run compute-health-scores.

### GM can't log in
**Cause:** Wrong password, or email case mismatch.
**Fix:** Use password reset flow (`POST /api/forgot-password`), or check that email was lowercase in onboard-club.

### Import shows many errors
**Cause:** Column names don't match expected fields.
**Fix:** Check the CSV headers against the Jonas alias mapping in `src/services/csvImportService.js`. The mapping supports common Jonas column variations.

### Data from wrong club showing
**Cause:** club_id mismatch in import.
**Fix:** Verify the auth token belongs to the correct club. The withAuth middleware automatically scopes imports to the authenticated club.

---

## Cleanup (Test Data)

To remove a test club and all its data:

```sql
DELETE FROM password_resets WHERE club_id = 'club_xxx';
DELETE FROM health_scores WHERE club_id = 'club_xxx';
DELETE FROM csv_imports WHERE club_id = 'club_xxx';
DELETE FROM onboarding_progress WHERE club_id = 'club_xxx';
DELETE FROM complaints WHERE club_id = 'club_xxx';
DELETE FROM transactions WHERE club_id = 'club_xxx';
DELETE FROM rounds WHERE club_id = 'club_xxx';
DELETE FROM members WHERE club_id = 'club_xxx';
DELETE FROM sessions WHERE club_id = 'club_xxx';
DELETE FROM users WHERE club_id = 'club_xxx';
DELETE FROM club WHERE club_id = 'club_xxx';
```

---

## Checklist Summary

- [ ] Migrations run (or verified)
- [ ] Club created via `/api/onboard-club`
- [ ] Jonas CSV files exported
- [ ] Members imported (minimum)
- [ ] At least one engagement data type imported (tee_times or transactions)
- [ ] Health scores computed
- [ ] Dashboard validated — all 5 pages render correctly
- [ ] GM credentials shared
- [ ] Welcome email sent
- [ ] 48-hour monitoring period started
