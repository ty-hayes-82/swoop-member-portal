# SWOOP GOLF V2 -- COMPLETE DEVELOPMENT PLAN

**From Current State to Pilot-Ready Product**

Last Updated: March 31, 2026
Status: Frontend V2 rebuild complete (Sprints 1-8 + QA). Backend APIs complete. Remaining work = real data pipeline + pilot onboarding + post-pilot features.

---

## HOW TO USE THIS DOCUMENT

This document is written so that a developer with zero prior knowledge of this project can:

1. Understand what the product is and who it serves
2. Know exactly what has been built and what remains
3. Execute every remaining task in order
4. Verify each task was completed correctly
5. Know what "done" looks like at each phase

Read Sections 1-4 for context. Execute Sections 5-10 for remaining work.

---

## TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Repository & Deployment](#3-repository--deployment)
4. [Current State -- What Is Already Built](#4-current-state----what-is-already-built)
5. [Phase 1: Infrastructure Setup](#5-phase-1-infrastructure-setup-week-1)
6. [Phase 2: First Pilot Club Onboarding](#6-phase-2-first-pilot-club-onboarding-weeks-2-3)
7. [Phase 3: Vendor Integration Connectors](#7-phase-3-vendor-integration-connectors-weeks-3-6)
8. [Phase 4: Frontend Live Data Wiring](#8-phase-4-frontend-live-data-wiring-weeks-4-7)
9. [Phase 5: Landing Page & Messaging Fix](#9-phase-5-landing-page--messaging-fix-week-5)
10. [Phase 6: Post-Pilot Enhancements](#10-phase-6-post-pilot-enhancements-weeks-8-16)
11. [Quality Gates & Verification Checklists](#11-quality-gates--verification-checklists)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [Key Files Reference](#13-key-files-reference)
14. [Glossary](#14-glossary)

---

## 1. PRODUCT OVERVIEW

### What Is Swoop Golf?

Swoop Golf is a cross-domain intelligence platform for private club General Managers. It connects the disconnected systems a club already uses (CRM, tee sheet, POS, email, scheduling, weather) and surfaces insights that no single system can produce on its own.

### Who Is the Buyer?

The **General Manager (GM)** or **COO** of a private club with 300-600 members. They must justify technology spend to a board and translate platform insights into retained members and recovered revenue.

### What Problem Does It Solve?

Private club GMs manage by anecdote across disconnected systems. They cannot see what is happening across their operation in real time, cannot connect the dots between service failures and financial outcomes, and cannot prove the value of their decisions to their board.

### Product Framework: See It / Fix It / Prove It

| Layer | What It Does | Example |
|-------|-------------|---------|
| **See It** | Member health scores, cross-domain visibility, early warning | "Member 203 dropped from Healthy to At-Risk. Email opens fell 3 weeks ago, golf frequency fell 2 weeks ago, dining stopped 18 days ago." |
| **Fix It** | Real-time cockpit, staffing intelligence, action queue | "3 at-risk members have tee times Saturday. You are 2 servers short for projected demand. Approve these 2 actions." |
| **Prove It** | Dollar-quantified ROI, board report, retention attribution | "This month: 14 members saved, $168K dues protected, 23 service failures caught. Board report ready." |

### Navigation (7 Items)

The product has exactly 7 visible navigation items:

| Nav Item | Purpose |
|----------|---------|
| **Today** | Morning briefing. What happened, what needs attention, what is coming. |
| **Members** | Health scores, risk tiers, 90-day new member cohorts, member profiles. |
| **Revenue** | Service gap analysis (formerly "revenue leakage"), staffing impact, scenario modeling. |
| **Insights** | Experience-outcome correlations. Cross-domain intelligence proving which touchpoints drive retention. |
| **Actions** | Unified inbox of recommended actions. Manual approval by default. Templates for playbooks. |
| **Board Report** | Monthly ROI summary with 4 tabs: Summary, Member Saves, Operational Saves, What We Learned. |
| **Admin** | Connected systems, data health, CSV import, notifications, user roles. |

### Pilot Prospects (All on Jonas Club Software)

| Name | Club | Role | Status |
|------|------|------|--------|
| Daniel Soehren | Bowling Green CC | Director of Golf/GM | Warmest lead. Wants real-time response + health scores. |
| Brad Shupe | Pine Island CC | -- | Interested. Signed up for pilot consideration. |
| Chris Lukov | Spring Brook CC | GM/COO | Interested. Wants more details. |
| Esteban Valladares | Pinetree CC | F&B Manager | Responded to survey. Not ready yet. |

---

## 2. ARCHITECTURE & TECH STACK

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite 5 |
| Charts | Recharts |
| Styling | Inline styles via `config/theme.js` (no CSS framework) |
| State | React Context (`AppContext`, `NavigationContext`, `MemberProfileContext`, `DataProvider`) |
| Routing | Hash-based (`#/today`, `#/members`, etc.) via `NavigationContext.jsx` |
| Mobile | Responsive detection; dedicated mobile views at `/#/m` |

### Backend

| Component | Technology |
|-----------|-----------|
| Runtime | Vercel Serverless Functions (Node.js) |
| Database | Vercel Postgres (managed PostgreSQL) |
| Email | SendGrid (planned, not yet wired) |
| SMS | Twilio (planned, not yet wired) |
| Auth | Token-based with 7-role RBAC (`api/auth.js`) |

### Data Flow (Strictly Enforced)

```
data/*.js  -->  services/*.js  -->  features/  -->  components/
```

- `data/` files export raw arrays and objects. Nothing else imports them directly.
- `services/` are the ONLY files that touch `data/`. They also have `_init()` methods that fetch from `/api/*` endpoints and fall back to static data if the API returns nothing.
- `features/` import from `services/` and pass shaped data down as props.
- `components/ui/` and `components/charts/` receive props only.

**For the live data transition:** Only `services/` files change. Everything above stays untouched.

### Design System

| Token | Value |
|-------|-------|
| Background | `#F8F9FA` |
| Card | `#FFFFFF` |
| Sidebar | `#1A1A1A` |
| Accent (Swoop Orange) | `#F3922D` |
| Fonts | Plus Jakarta Sans (body) + JetBrains Mono (numbers) |
| Colors | Never hardcoded. Always `theme.colors.*` from `config/theme.js` |

### Hard Rules

| Rule | Limit |
|------|-------|
| Feature component file size | 200 lines target, 300 hard ceiling |
| UI primitive file size | 100 lines target, 150 hard ceiling |
| Service file size | 80 lines target, 150 hard ceiling |
| Colors | Always `theme.colors.*`, never hardcoded hex |
| Data access | Components never import from `data/` directly |

---

## 3. REPOSITORY & DEPLOYMENT

### Git

| Setting | Value |
|---------|-------|
| Repo | `github.com/ty-hayes-82/swoop-member-portal` |
| Primary branch | `dev` (all V2 work is here) |
| Legacy branch | `main` (old V1 codebase, do not use for new work) |
| Visibility | Public |

### Vercel

| Setting | Value |
|---------|-------|
| Team | `tyhayesswoopgolfcos-projects` |
| Project ID | `prj_SHAf5gcp56oCK58AJd86KDfIxXFC` |
| Project Name | `swoop-member-portal` |
| Auto-deploy branch | `dev` |
| Production URL | `swoop-member-portal.vercel.app` (currently pointing at `main`) |
| Dev branch URL | `swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app` |
| Database | Vercel Postgres (connection string in environment variables) |

### Deployment Workflow

```bash
git add -A
git commit -m "descriptive message"
git push origin dev
# Vercel auto-deploys within 60-90 seconds
```

### Separate V2 Project (Exists But Not Primary)

There is also `swoop-member-portal-v2` (`prj_Pcms716DTcCkhlxGYs2kJbLCBv3q`) which was created for isolated V2 work. The primary development continues on the `dev` branch of `swoop-member-portal`.

---

## 4. CURRENT STATE -- WHAT IS ALREADY BUILT

### V2 Frontend Rebuild (Complete -- Sprints 1-8 + QA)

These sprints were executed on the `dev` branch between March 26-31, 2026:

| Sprint | What Was Done | Key Commit |
|--------|--------------|------------|
| Sprint 1 | Nav restructured to 7 items. 14 features hidden. Route redirects added. | `415b727` |
| Sprint 2 | Health score hero on Today view. "First 90 Days" cohort tracker. Dollar exposure on at-risk rows. Call button per row. | `a7c809f` |
| Sprint 3 | Revenue reframed ("leakage" to "service gaps"). Actions simplified to 2 tabs (Inbox + Templates). Complaints tracking panel added. | `2af5157` |
| Sprint 4 | Growth Pipeline removed from Board Report. HTML morning digest email via SendGrid. | `ae5f04d` |
| Sprint 5 | Insights promoted to standalone top-level page. Members simplified to 2 modes (At-Risk + All Members). | `6fcf069` |
| Sprint 6 | Archetype filter chips on Members page. Email tab reframed as "Communication Health." | `3538e23` |
| Sprint 7 | Touch-friendly sliders (44px minimum). "Members Protected" metric. Admin tabs restructured (Integrations, Data Health, CSV Import, Notifications, User Roles). | `c2df079` |
| Sprint 8 | Mobile 5-tab bottom nav (Today, Members, Revenue, Actions, More). Lazy loading for Board Report and Insights. | `01c28f4` |
| QA Pass 1 | 22 bugs fixed: routing, removed features, terminology, layout. Removed AI Agent refs, Survey Intelligence tab, Storyboard Flow links. | `af2e5e6` |
| QA Pass 2 | 4 targeted fixes: agent text, health label, pace rename, playbook CTA. | `401b289` |
| QA Pass 3 | Revenue language fixes ("leakage" to "impact"), admin tab rendering, health score computation. | `19a97f8` |
| QA Pass 4 | New club onboarding flow: 4-step wizard, XLSX template auto-detection, data availability API. | `fb692d4` |
| QA Pass 5 | Demo data isolation: real clubs get empty data (not Oakmont fallback). Dynamic date/club name. | `2465454` + `2d60f75` |

### Backend APIs (All 15 Complete)

| API Endpoint | Purpose | Status |
|-------------|---------|--------|
| `api/migrations/001-core-tables.js` | Create 11 core tables + 9 indexes | Ready to run |
| `api/migrations/002-alter-members.js` | Add missing columns to pre-existing members table | Ready to run |
| `api/migrations/003-relax-constraints.js` | Drop NOT NULL on optional columns | Ready to run |
| `api/migrations/004-fix-all-constraints.js` | Fix all remaining constraints | Ready to run |
| `api/auth.js` | Token-based auth, 7-role RBAC | Built |
| `api/import-csv.js` | CSV import for members, rounds, transactions, complaints | Built |
| `api/sync-status.js` | Data sync monitoring | Built |
| `api/compute-health-scores.js` | 4-dimension health scoring + archetype classification | Built |
| `api/execute-action.js` | Email/SMS/task/call/comp execution with templates | Built (email/SMS not wired to providers yet) |
| `api/dashboard-live.js` | Live dashboard data | Built |
| `api/track-outcomes.js` | Intervention outcome tracking + Member Save detection | Built |
| `api/notifications.js` | Morning digest, escalation engine, SLA breach detection | Built |
| `api/compute-correlations.js` | 5 cross-domain correlations from real data | Built |
| `api/onboard-club.js` | 9-step club onboarding wizard | Built |
| `api/execute-playbook.js` | Sequenced playbook execution with step tracking | Built |
| `api/predict-churn.js` | 30/60/90 day churn probability with risk factors | Built |
| `api/agent-autonomous.js` | 6 autonomous agents with auto-execute framework | Built |
| `api/benchmarks-live.js` | Live club vs network vs industry benchmarking | Built |
| `api/data-availability.js` | Check which tables have data per club | Built |

### Demo Environment

- Club: Oakmont Hills Country Club, Scottsdale AZ
- Simulated date: January 17, 2026 (demo mode only; real clubs use today's date)
- 300 members with realistic behavioral data
- 5 resignation scenarios seeded for demo storytelling
- All features work end-to-end with static fallback data

### What Is NOT Built Yet

| Item | Why It Matters |
|------|---------------|
| Live vendor connectors (Jonas, ForeTees, POS) | No real club data flows into the system yet |
| SendGrid email delivery wiring | `execute-action.js` logs actions but does not send real emails |
| Twilio SMS delivery wiring | Same -- logs but does not send |
| Nightly sync scheduler (cron) | No automated data refresh |
| Frontend live data consumption | Services fall back to static data; need to consume `/api/*` responses |
| Landing page messaging correction | Currently leads with "Prove It" instead of "See It" |
| Sentiment/NPS data collection | Health score is behavior-only (no member satisfaction input) |
| Industry benchmarking in Board Report | Internal metrics only, no peer comparison |
| Role-based UI enforcement | RBAC API exists but app shell does not enforce role-filtered views |
| Mobile PWA manifest + install prompt | Mobile works but is not installable as a PWA |

---

## 5. PHASE 1: INFRASTRUCTURE SETUP (Week 1)

**Goal:** Get the database ready, external accounts created, and the pipeline ready to accept real data.

**Prerequisites:** Vercel project access, environment variable write access.

### Task 1.1: Run Database Migrations

**What:** Execute all 4 migrations in sequence to create/update tables in Vercel Postgres.

**How:**

```bash
# Migration 1: Create core tables
curl -X POST https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app/api/migrations/001-core-tables

# Migration 2: Add missing columns to members table
curl -X POST https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app/api/migrations/002-alter-members

# Migration 3: Relax NOT NULL constraints
curl -X POST https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app/api/migrations/003-relax-constraints

# Migration 4: Fix all remaining constraints
curl -X POST https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app/api/migrations/004-fix-all-constraints
```

**Verify:** Each response should return JSON with `"status": "ok"` for each table/step. If any return `"error"`, screenshot the response and debug. Common causes: Vercel Postgres not provisioned, or environment variable `POSTGRES_URL` missing.

**Additional verification:**

```bash
# Check all tables exist
curl https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app/api/schema-all
```

Should return JSON listing these tables (at minimum): `club`, `members`, `rounds`, `transactions`, `complaints`, `health_scores`, `actions`, `csv_imports`.

### Task 1.2: Create SendGrid Account

**What:** Email sending capability for member outreach actions.

**How:**
1. Go to https://sendgrid.com and create a free account (100 emails/day)
2. Dashboard > Settings > API Keys > Create API Key (Full Access)
3. Copy the API key
4. Dashboard > Settings > Sender Authentication > Authenticate a domain
   - Add `swoopgolf.com` (or pilot club domain)
   - Follow DNS record instructions (CNAME records)
   - This takes 24-48 hours to verify -- start immediately
5. Add environment variable in Vercel:
   - Go to: https://vercel.com/tyhayesswoopgolfcos-projects/swoop-member-portal/settings/environment-variables
   - Add `SENDGRID_API_KEY` = your API key
   - Apply to: Production, Preview, Development

**Verify:** In SendGrid dashboard, Sender Authentication should show "Verified" status after DNS propagation (24-48 hours).

### Task 1.3: Create Twilio Account

**What:** SMS sending capability for quick outreach actions.

**How:**
1. Go to https://twilio.com and create a free trial account
2. Get a phone number (assigned during setup)
3. Note: Account SID, Auth Token, Phone Number
4. Add environment variables in Vercel:
   - `TWILIO_ACCOUNT_SID` = your Account SID
   - `TWILIO_AUTH_TOKEN` = your Auth Token
   - `TWILIO_PHONE_NUMBER` = your Twilio number (format: +1XXXXXXXXXX)

**Verify:** Send a test SMS from Twilio console to your personal phone. Should arrive within seconds.

### Task 1.4: Promote Dev Branch to Production

**What:** The `main` branch (currently deployed to production) is the old V1 codebase. The V2 work is on `dev`. Either merge `dev` into `main` or change the Vercel production branch.

**How (Option A -- Merge):**

```bash
git checkout main
git merge dev
git push origin main
```

**How (Option B -- Change production branch in Vercel):**
1. Go to Vercel project settings > Git
2. Change "Production Branch" from `main` to `dev`
3. Trigger a new deployment

**Verify:** Visit `swoop-member-portal.vercel.app` and confirm:
- Navigation shows exactly 7 items: Today, Members, Revenue, Insights, Actions, Board Report, Admin
- No Growth Pipeline, Location Intelligence, or Storyboard Flows visible
- Demo mode shows Oakmont Hills CC data correctly
- Mobile view (`/#/m`) shows 5-tab bottom nav

### Phase 1 Quality Gate

Before proceeding to Phase 2, ALL of these must be true:

- [ ] All 4 migrations return success
- [ ] `api/schema-all` shows all expected tables
- [ ] SendGrid API key is in Vercel environment variables
- [ ] SendGrid domain verification is in progress (24-48 hour wait is OK)
- [ ] Twilio credentials are in Vercel environment variables
- [ ] Production URL shows V2 (7-item nav)
- [ ] Demo mode works end-to-end on production URL

---

## 6. PHASE 2: FIRST PILOT CLUB ONBOARDING (Weeks 2-3)

**Goal:** Get one real club's data into the system and confirm the product works with real data.

**Prerequisites:** Phase 1 complete. Pilot club agreement secured (Daniel Soehren at Bowling Green CC is the primary target).

### Task 2.1: Register the Pilot Club

**What:** Create the club record in the database and get a `club_id`.

**How:**

```bash
curl -X POST https://swoop-member-portal.vercel.app/api/onboard-club \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bowling Green Country Club",
    "city": "Bowling Green",
    "state": "KY",
    "zip": "42101",
    "memberCount": 400,
    "courseCount": 1,
    "outletCount": 3,
    "contactName": "Daniel Soehren",
    "contactEmail": "daniel@bowlinggreencc.com"
  }'
```

**Verify:** Response returns a `club_id` (format: `club_XXXXX`). Save this -- it is used in every subsequent API call.

### Task 2.2: Import Member Data via CSV

**What:** The fastest path to real data is CSV import. Ask the pilot club to export their member roster from Jonas Club Software.

**Required columns (minimum):** `first_name`, `last_name`, `email`, `membership_type`, `annual_dues`, `join_date`

**Optional columns:** `phone`, `household_id`, `external_id` (Jonas member number)

**How:**
1. Receive CSV/XLSX file from pilot club
2. If XLSX: The new club setup wizard at `/#/admin` handles multi-sheet XLSX auto-detection
3. If CSV: POST to the import API:

```bash
curl -X POST https://swoop-member-portal.vercel.app/api/import-csv \
  -H "Content-Type: application/json" \
  -d '{
    "clubId": "club_XXXXX",
    "importType": "members",
    "uploadedBy": "onboarding",
    "rows": [
      {"first_name": "John", "last_name": "Smith", "email": "john@example.com", "membership_type": "Full", "annual_dues": 15000, "join_date": "2020-03-15"},
      ...
    ]
  }'
```

**Alternatively:** Use the in-app wizard:
1. Navigate to `/#/admin` > CSV Import tab
2. Upload the XLSX file
3. The system auto-detects columns using fuzzy matching (0.55 confidence threshold)
4. Vendor-specific aliases are built in for Jonas, ForeTees, Toast, ADP, Mailchimp, and others (see `src/services/csvImportService.js` > `VENDOR_COLUMN_ALIASES`)
5. Review mapping, confirm, and import

**Verify:**
- Navigate to Members page
- Real member names should appear (not Oakmont demo data)
- Member count should match what was imported
- Click any member to see their profile

### Task 2.3: Import Round History (If Available)

**Required columns:** `member_id` (or `member_name`), `round_date`, `tee_time`

**Optional columns:** `course_id`, `duration_minutes`, `players`, `cancelled`, `no_show`

**How:** Same process as 2.2, with `importType: "rounds"`

**Verify:** Members page should show golf frequency in health score dimensions.

### Task 2.4: Import Dining Transactions (If Available)

**Required columns:** `member_id`, `transaction_date`, `total_amount`

**Optional columns:** `outlet_name`, `category`, `item_count`, `is_post_round`

**How:** Same process as 2.2, with `importType: "transactions"`

**Verify:** Revenue page should show real dining data instead of demo fallback.

### Task 2.5: Import Complaints (If Available)

**Required columns:** `member_id`, `complaint_date`, `category`, `description`

**Optional columns:** `status`, `assigned_to`, `resolved_date`, `severity`

**How:** Same process as 2.2, with `importType: "complaints"`

### Task 2.6: Compute Health Scores

**What:** Once member data (and ideally rounds + transactions) is imported, run the health score computation.

**How:**

```bash
curl -X POST "https://swoop-member-portal.vercel.app/api/compute-health-scores?clubId=club_XXXXX"
```

**What this does:**
1. Pulls all members for the club from Postgres
2. Computes a 4-dimension health score: Golf activity (rounds frequency, recency), Dining engagement (spend frequency, recency), Email engagement (open rates, click rates), Event participation
3. Assigns each member to a tier: Healthy (score >= 70), Watch (50-69), At-Risk (30-49), Critical (< 30)
4. Classifies each member into an archetype: Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, New Member, Declining, Ghost, Snowbird
5. Writes results back to `members` table and `health_scores` history table

**Verify:**
- Members page shows real health score distribution (not demo 235/39/26)
- Click on an At-Risk member -- health score breakdown should show which dimensions are low
- Today view should show the health score hero card with real numbers

### Task 2.7: Run Churn Predictions

```bash
curl -X POST "https://swoop-member-portal.vercel.app/api/predict-churn?clubId=club_XXXXX"
```

**Verify:** Members with declining engagement should show churn risk probabilities.

### Task 2.8: Run Cross-Domain Correlations

```bash
curl -X POST "https://swoop-member-portal.vercel.app/api/compute-correlations?clubId=club_XXXXX"
```

**Verify:** Insights page should show correlation cards with real data (e.g., "Members who dine 3+x/month have 94% retention vs. 61% for golf-only").

### Task 2.9: Check Data Availability

```bash
curl "https://swoop-member-portal.vercel.app/api/data-availability?clubId=club_XXXXX"
```

**Returns:** Which data domains are populated and what insight level is available. The product uses progressive disclosure -- features are hidden or show CTAs when their required data is missing.

### Phase 2 Quality Gate

- [ ] Pilot club record created with valid `club_id`
- [ ] Member data imported (minimum 50 members)
- [ ] Health scores computed -- members show real tiers and scores
- [ ] At least one additional data domain imported (rounds OR transactions)
- [ ] Members page shows real member names, not demo data
- [ ] Today view shows health score hero with real numbers
- [ ] Churn predictions generated
- [ ] Correlations computed (if 2+ data domains available)
- [ ] GM can log in and see their club's data

---

## 7. PHASE 3: VENDOR INTEGRATION CONNECTORS (Weeks 3-6)

**Goal:** Replace CSV imports with automated API connectors so data refreshes nightly.

**Prerequisites:** Pilot club secured. Vendor API credentials obtained.

**Architecture pattern:** Every connector follows the same structure:

```
api/connectors/[vendor].js
  --> authenticate(credentials)
  --> fetchData(endpoint, params)
  --> mapToSwoopSchema(rawData)
  --> upsertToPostgres(mappedData)
  --> logSyncStatus(result)
```

### Task 3.1: Jonas Club CRM Connector

**What it provides:** Member profiles, dues, tenure, household data, complaints

**File to create:** `api/connectors/jonas-crm.js`

**Steps:**
1. Obtain Jonas Club API documentation from pilot club's vendor contact
2. Get API credentials (key, base URL, or OAuth client)
3. Build connector following the pattern above
4. Map Jonas fields to Swoop schema (aliases already defined in `VENDOR_COLUMN_ALIASES` in `csvImportService.js`):
   - Jonas `Member #` --> `member_id`
   - Jonas `Acct Balance` --> `annual_dues`
   - Jonas `Join Dt` --> `join_date`
   - Jonas `Last Name` --> `last_name`
5. Add a `syncJonasCRM(clubId, credentials)` function
6. Test with pilot club data

**Verify:**
- Run connector manually
- Check `api/sync-status` shows Jonas CRM as "Connected" with last sync timestamp
- Members page shows fresh data matching Jonas records
- Admin > Data Health shows Jonas CRM tile as green/connected

**Fallback:** If Jonas API access is delayed, continue with CSV imports. The pilot club can export a CSV from Jonas monthly and upload via the Admin > CSV Import tab.

### Task 3.2: Tee Sheet Connector (ForeTees or Jonas Tee Sheet)

**What it provides:** Rounds, tee times, cancellations, no-shows, waitlist

**File to create:** `api/connectors/foretees.js` or `api/connectors/jonas-teesheet.js`

**Steps:**
1. Obtain API docs and credentials
2. Build connector
3. Map fields: tee time, player, date, course, duration, status
4. Link rounds to members via member ID or name matching

**Verify:**
- Members page shows accurate round counts per member
- Revenue page shows pace-of-play data (if duration available)
- Health scores recalculate with golf dimension populated

### Task 3.3: POS Connector (Jonas POS, Northstar, or Toast)

**What it provides:** Dining transactions, covers, item-level detail, staff attribution

**File to create:** `api/connectors/[vendor]-pos.js`

**Steps:**
1. Obtain API docs and credentials
2. Build connector
3. Map fields: member, date, amount, outlet, items, server

**Verify:**
- Revenue page shows real dining data
- Post-round dining conversion rates are computed from linked round + dining data
- Health scores recalculate with dining dimension populated

### Task 3.4: Nightly Sync Scheduler

**What:** A Vercel Cron job that runs all connectors nightly and triggers health score recomputation.

**File to create:** `api/cron/nightly-sync.js`

**Vercel config (`vercel.json`):**

```json
{
  "crons": [
    {
      "path": "/api/cron/nightly-sync",
      "schedule": "0 5 * * *"
    }
  ]
}
```

**Logic:**
1. For each club with active integrations:
   - Run each connector (CRM, Tee Sheet, POS)
   - Log sync results to `csv_imports` or a new `sync_log` table
2. After all connectors complete:
   - `POST /api/compute-health-scores?clubId=X`
   - `POST /api/predict-churn?clubId=X`
   - `POST /api/compute-correlations?clubId=X`
3. If morning digest is enabled:
   - `POST /api/notifications` to send morning briefing email

**Verify:**
- Wait for the cron to fire at 5:00 AM UTC
- Check `api/sync-status` shows updated timestamps
- Health scores should reflect latest data
- Morning digest email should arrive (if SendGrid is configured)

### Task 3.5: Wire SendGrid Email Delivery

**What:** Make `api/execute-action.js` actually send emails via SendGrid instead of just logging.

**File to modify:** `api/execute-action.js`

**Steps:**
1. Import `@sendgrid/mail`
2. In the email execution path, replace the log-only stub with:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: memberEmail,
  from: 'notifications@swoopgolf.com', // or club-specific sender
  subject: actionTemplate.subject,
  html: actionTemplate.body,
});
```

**Verify:**
- Approve an email action in the Actions inbox
- Recipient should receive the email within 60 seconds
- Check SendGrid dashboard for delivery confirmation

### Task 3.6: Wire Twilio SMS Delivery

**What:** Same pattern as 3.5 but for SMS.

**File to modify:** `api/execute-action.js`

**Steps:**
1. Import `twilio`
2. In the SMS execution path:

```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

await client.messages.create({
  body: actionTemplate.smsBody,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: memberPhone,
});
```

**Verify:**
- Approve an SMS action in the Actions inbox
- Recipient should receive the text within seconds

### Phase 3 Quality Gate

- [ ] At least 1 vendor connector is built and syncing data
- [ ] Nightly cron is configured and firing
- [ ] Health scores auto-recompute after each sync
- [ ] SendGrid sends real emails when actions are approved
- [ ] Twilio sends real SMS when actions are approved
- [ ] Admin > Data Health shows connected systems with fresh timestamps
- [ ] `api/sync-status` returns accurate status for all connectors

---

## 8. PHASE 4: FRONTEND LIVE DATA WIRING (Weeks 4-7)

**Goal:** Switch the frontend from static fallback data to consuming live API responses.

**Architecture:** Each service in `src/services/` already has an `_init()` function that tries to fetch from the API and falls back to static data. The task is to ensure these actually consume the live responses when available.

### Task 4.1: Audit Service Layer Init Functions

**Files to check:** Every file in `src/services/`

**Pattern each service should follow:**

```javascript
let _data = null;

export const _init = async (clubId) => {
  try {
    const res = await fetch(`/api/dashboard-live?clubId=${clubId}`);
    if (res.ok) {
      _data = await res.json();
    }
  } catch (e) {
    console.warn('API unavailable, using static fallback');
  }
};

export function getSomeData() {
  if (_data?.someField) return _data.someField;
  return STATIC_FALLBACK; // from data/*.js
}
```

**Verify for each service:**
1. When API returns data: service uses live data
2. When API returns error/nothing: service falls back to static data gracefully
3. No console errors in either case

### Task 4.2: Wire DataProvider to Club Context

**File:** `src/context/DataProvider.jsx`

**What:** Ensure `DataProvider` reads the current `club_id` (from localStorage or auth context) and passes it to all service `_init()` calls.

**Verify:**
- Log in as a real club (not demo mode)
- All pages should show real data
- Log in as demo mode
- All pages should show Oakmont Hills demo data
- Switch between demo and real club -- data should update without page refresh

### Task 4.3: Real-Time Data on Key Pages

For each page, verify that live data flows through:

| Page | Service | API Endpoint | What to Check |
|------|---------|-------------|---------------|
| Today | `briefingService` | `api/dashboard-live` | Action count, critical members, complaints |
| Members | `memberService` | `api/dashboard-live` + member table | Real names, health scores, tiers |
| Revenue | `revenueService` | `api/dashboard-live` | Service gap amounts, dining data |
| Insights | `insightsService` | `api/compute-correlations` | Correlation cards with real coefficients |
| Actions | `actionsService` | `api/dashboard-live` | Pending actions based on real member data |
| Board Report | `boardReportService` | `api/dashboard-live` | Real saves, real ROI numbers |
| Admin | `integrationsService` | `api/sync-status` | Connected system status, last sync times |

### Phase 4 Quality Gate

- [ ] Demo mode still works perfectly with static data
- [ ] Real club data appears on all 7 pages when logged in as a real club
- [ ] No console errors when switching between demo and real modes
- [ ] Health score hero on Today shows real numbers for real clubs
- [ ] Members page shows real member names and health scores
- [ ] Revenue page shows real (or empty with CTA) data for real clubs
- [ ] No Oakmont Hills demo data leaks into real club views

---

## 9. PHASE 5: LANDING PAGE & MESSAGING FIX (Week 5)

**Goal:** Correct the messaging hierarchy from "Prove It first" to "See It first."

**Context from survey data:**
- 43.5/100 budget points went to Member Experience Visibility (See It)
- 50% chose real-time cockpit as #1 unified platform outcome (Fix It)
- Only 10% chose retention/churn as #1 value proposition (Prove It)

The landing page currently leads with board ROI proof. It should lead with member visibility.

### Task 5.1: Restructure Landing Page Hero

**File:** `public/landing.html` (static landing page) and/or `src/landing/` (React landing page components)

**Current hero order:** Prove It > Fix It > See It
**Correct hero order:** See It > Fix It > Prove It

**Messaging to use:**

| Section | Headline | Subtext |
|---------|---------|---------|
| Hero | "See what your systems are hiding." | "Your CRM, tee sheet, POS, and email each see one piece. Swoop sees the whole picture." |
| See It | "Know who is at risk before they leave." | "Cross-domain health scores combine golf, dining, email, and event signals into one score." |
| Fix It | "Fix problems before members feel them." | "Real-time cockpit. Staffing intelligence. One-click actions." |
| Prove It | "Prove the value to your board." | "Dollar-quantified ROI. Board report that writes itself." |

### Task 5.2: Update Demo Flow Order

If a demo/walkthrough mode exists, ensure it follows the same order:
1. Start with Today view (See It -- what is happening now)
2. Go to Members (See It -- who is at risk)
3. Go to Revenue (Fix It -- where are we losing)
4. Go to Actions (Fix It -- what should we do)
5. End with Board Report (Prove It -- what is it worth)

### Phase 5 Quality Gate

- [ ] Landing page hero leads with "See It" messaging, not "Prove It"
- [ ] Feature sections are ordered: See It > Fix It > Prove It
- [ ] No references to "churn prediction" or "AI-powered retention" as primary messaging
- [ ] CTA buttons say "See what your systems are hiding" or similar visibility-first language

---

## 10. PHASE 6: POST-PILOT ENHANCEMENTS (Weeks 8-16)

These items are important but not blocking for pilot launch. Prioritize based on pilot club feedback.

### 6.1: Sentiment / NPS Data Collection

**Priority:** High (fills biggest gap in health score accuracy)

**What:** Add a member satisfaction input layer so health scores reflect how members feel, not just what they do.

**Architecture:** Full design in `docs/SENTIMENT-LAYER-ARCHITECTURE.md`

**Phase 1 (Foundation):**
- Create `member_sentiment_ratings` table
- Build `sentimentService.js` with static fallback
- Add sentiment overlay to member profile drawer
- Wire +/- 5 point health modifier into health score computation

**Phase 2 (Collection):**
- Build POST endpoint for rating submission
- Build mobile-friendly rating page (QR code target)
- Set up post-round SMS survey trigger
- Build response rate tracking

**Verify:**
- Member profile shows sentiment data when available
- Health score adjusts by +/- 5 points based on sentiment
- "Silent dissatisfaction" alert fires when member has high activity but low sentiment

### 6.2: Industry Benchmarking in Board Report

**Priority:** Medium

**What:** Add peer comparison to Board Report metrics.

**API:** `api/benchmarks-live.js` already computes industry averages. Frontend needs to display them.

**Verify:** Board Report shows "Your club: X. Industry average: Y." for at least 3 metrics.

### 6.3: Role-Based UI Enforcement

**Priority:** Medium

**What:** RBAC API exists (`api/auth.js` with 7 roles). App shell needs to enforce role-filtered views.

**Roles:**
- GM/Owner: Full access
- Department Head: Approve own domain, view-only others
- Staff: View-only

**Verify:** A Department Head login cannot approve actions outside their domain.

### 6.4: Mobile PWA Manifest

**Priority:** Low

**What:** Add PWA manifest so mobile users can "install" the app from browser.

**Files:** `public/manifest.json`, service worker, icons

**Verify:** On mobile Safari/Chrome, "Add to Home Screen" creates an app icon that opens without browser chrome.

### 6.5: A/B Testing for Playbooks

**Priority:** Low (post-pilot)

**What:** Treatment/control group split for playbook effectiveness measurement.

**Verify:** Can create an A/B test, assign members to groups, and see statistically valid results after N weeks.

---

## 11. QUALITY GATES & VERIFICATION CHECKLISTS

### After Each Sprint: Run This Checklist

```
NAVIGATION
[ ] Exactly 7 nav items visible: Today, Members, Revenue, Insights, Actions, Board Report, Admin
[ ] No Growth Pipeline, Location Intelligence, Storyboard Flows, or AI Agent Command visible
[ ] All nav items navigate correctly (no redirects to wrong pages)
[ ] Mobile: 5-tab bottom nav works (Today, Members, Revenue, Actions, More)

TODAY VIEW
[ ] Health score hero shows correct tier distribution
[ ] Pending actions count matches Actions page
[ ] Complaints panel shows open complaints with day counters
[ ] Morning context banner shows dynamic date (not "January 17, 2026" for real clubs)

MEMBERS
[ ] Two modes work: At-Risk and All Members
[ ] Health scores show 4-dimension breakdown (Golf, Dining, Email, Events)
[ ] "First 90 Days" tab shows new member cohort tracker
[ ] Archetype filter chips work
[ ] Call button on each at-risk row initiates phone call
[ ] Dollar exposure column shows annual dues at risk
[ ] Search works across all members

REVENUE
[ ] "Service Gap Impact" (not "Revenue Leakage") terminology
[ ] Scenario modeling sliders work and are touch-friendly (44px+ targets)
[ ] Breakdown chart shows root causes
[ ] "Members Protected" metric visible alongside dollar amounts

INSIGHTS
[ ] Standalone page (not a redirect to cockpit or a tab within Members)
[ ] Correlation cards display (even if sample data for demo mode)
[ ] No Survey Intelligence tab visible

ACTIONS
[ ] Two tabs only: Inbox + Templates
[ ] No AI Agent references visible
[ ] Approve/dismiss workflow works
[ ] No "Playbooks & Automation" label (should be "Actions")

BOARD REPORT
[ ] Four tabs: Summary, Member Saves, Operational Saves, What We Learned
[ ] No Growth Pipeline tab
[ ] Dollar amounts visible and formatted correctly

ADMIN
[ ] Five tabs: Integrations, Data Health, CSV Import, Notifications, User Roles
[ ] CSV Import handles XLSX upload with auto-detection
[ ] Data Health shows connected systems with status

DEMO VS REAL
[ ] Demo mode: Oakmont Hills data, January 17 2026 date
[ ] Real club: Empty data or real data, today's date, club name from setup
[ ] No demo data leaks into real club views
```

### Before Pilot Launch: Run This Checklist

```
DATA PIPELINE
[ ] At least members + 1 other domain imported for pilot club
[ ] Health scores computed and showing real tiers
[ ] Churn predictions generated
[ ] Correlations computed (if 2+ domains)

ACTIONS
[ ] Approving an email action sends a real email (SendGrid)
[ ] Approving an SMS action sends a real SMS (Twilio)
[ ] Action outcomes are tracked in the database

DAILY OPERATIONS
[ ] Morning digest email sends at scheduled time
[ ] Today view shows accurate morning briefing data
[ ] New complaints appear in the system

GM EXPERIENCE
[ ] GM can log in with their own credentials
[ ] GM sees their club name (not "Oakmont Hills")
[ ] GM sees real member names
[ ] GM can approve an action and see it execute
[ ] Board Report shows real (even if early) metrics
```

---

## 12. ENVIRONMENT VARIABLES REFERENCE

These must be set in Vercel project settings for the `swoop-member-portal` project.

| Variable | Purpose | Where to Get It |
|----------|---------|----------------|
| `POSTGRES_URL` | Vercel Postgres connection string | Auto-provisioned by Vercel Postgres |
| `POSTGRES_PRISMA_URL` | Prisma connection URL | Auto-provisioned by Vercel Postgres |
| `POSTGRES_URL_NON_POOLING` | Direct connection URL | Auto-provisioned by Vercel Postgres |
| `POSTGRES_USER` | DB user | Auto-provisioned |
| `POSTGRES_HOST` | DB host | Auto-provisioned |
| `POSTGRES_PASSWORD` | DB password | Auto-provisioned |
| `POSTGRES_DATABASE` | DB name | Auto-provisioned |
| `SENDGRID_API_KEY` | Email sending | SendGrid dashboard > API Keys |
| `TWILIO_ACCOUNT_SID` | SMS sending | Twilio console |
| `TWILIO_AUTH_TOKEN` | SMS auth | Twilio console |
| `TWILIO_PHONE_NUMBER` | SMS sender number | Twilio console (format: +1XXXXXXXXXX) |
| `STRIPE_SECRET_KEY` | Billing (future) | Stripe dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Billing (future) | Stripe dashboard |
| `CRON_SECRET` | Protect cron endpoints | Generate a random string |

---

## 13. KEY FILES REFERENCE

### Configuration

| File | Purpose |
|------|---------|
| `src/config/theme.js` | All colors, fonts, spacing. Never hardcode colors. |
| `src/config/navigation.js` | Navigation item definitions. 7 visible + hidden legacy routes. |
| `vercel.json` | Vercel config including cron schedules and rewrites. |

### Context / State

| File | Purpose |
|------|---------|
| `src/context/AppContext.jsx` | Global app state (inbox, actions, demo mode) |
| `src/context/NavigationContext.jsx` | Hash routing, route redirects, sidebar state |
| `src/context/DataProvider.jsx` | Initializes all services, manages data loading state |
| `src/context/MemberProfileContext.jsx` | Member profile drawer state |

### Services (Data Access Layer)

| File | Purpose |
|------|---------|
| `src/services/memberService.js` | Member data, health scores, roster |
| `src/services/briefingService.js` | Today view morning briefing data |
| `src/services/cockpitService.js` | Operational cockpit priority items |
| `src/services/revenueService.js` | Revenue and service gap data |
| `src/services/integrationsService.js` | Connected systems status |
| `src/services/csvImportService.js` | CSV/XLSX import with vendor column aliases |

### API Endpoints

| File | Method | Purpose |
|------|--------|---------|
| `api/migrations/001-core-tables.js` | POST | Create database tables |
| `api/import-csv.js` | POST | Import CSV data |
| `api/compute-health-scores.js` | POST | Compute member health scores |
| `api/predict-churn.js` | POST | Generate churn predictions |
| `api/compute-correlations.js` | POST | Compute cross-domain correlations |
| `api/execute-action.js` | POST | Execute approved actions (email, SMS, task) |
| `api/dashboard-live.js` | GET | Live dashboard data for all pages |
| `api/sync-status.js` | GET | Integration sync status |
| `api/data-availability.js` | GET | Check which data domains are populated |
| `api/onboard-club.js` | POST | Register a new club |
| `api/notifications.js` | POST | Send morning digest and alerts |
| `api/schema-all.js` | GET | List all tables and columns |

### Features (Pages)

| File/Directory | Nav Item |
|---------------|----------|
| `src/features/today/` | Today |
| `src/features/members/` | Members |
| `src/features/revenue/` | Revenue |
| `src/features/experience-insights/` | Insights |
| `src/features/actions/` | Actions |
| `src/features/board-report/` | Board Report |
| `src/features/admin/` | Admin |

---

## 14. GLOSSARY

| Term | Definition |
|------|-----------|
| **Health Score** | Composite 0-100 score measuring member engagement across 4 dimensions: golf activity, dining frequency, email engagement, event participation. |
| **Tier** | Health score bucket: Healthy (70+), Watch (50-69), At-Risk (30-49), Critical (<30). |
| **Archetype** | Behavioral classification of a member: Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, New Member, Declining, Ghost, Snowbird. |
| **Layer 3** | Swoop's strategic framework. Layer 1 = individual club systems (CRM, POS, tee sheet). Layer 2 = integrated suites. Layer 3 = cross-domain intelligence that sits above everything and answers questions no single system can. |
| **See It / Fix It / Prove It** | Product narrative framework. See It = member visibility and health scores. Fix It = real-time cockpit and action queue. Prove It = board report and ROI proof. |
| **Service Gap** | Previously called "revenue leakage." The dollar impact of operational failures (slow rounds reducing dining, understaffing, unresolved complaints). Reframed to avoid negative connotation. |
| **Cross-Domain** | Insight that requires data from 2+ systems. Example: connecting tee sheet data (slow round) to POS data (skipped dining) to show $31 revenue loss per slow round. |
| **Jonas Club Software** | The CRM/club management system used by all 4 pilot prospects. Primary integration target. |
| **ForeTees** | Common tee sheet system in private clubs. Secondary integration target. |
| **Oakmont Hills CC** | Fictional demo club used in the product. Scottsdale, AZ. 300 members. All demo data is set in January 2026. |
| **Demo Mode** | When `club_id` is `club_001` or not set, the product shows Oakmont Hills demo data. Real clubs show real data. |
| **Static Fallback** | The data files in `src/data/` that provide demo/fallback data when API endpoints are unavailable or return empty. |
| **Progressive Disclosure** | Features that require specific data domains show CTAs ("Connect your POS to unlock dining insights") instead of empty/broken states when data is missing. |

---

## TIMELINE SUMMARY

| Phase | Weeks | What Gets Done | Gate |
|-------|-------|---------------|------|
| **Phase 1** | Week 1 | Database migrations, SendGrid, Twilio, promote dev to production | All infrastructure ready |
| **Phase 2** | Weeks 2-3 | First pilot club data imported, health scores computed | Real data visible in product |
| **Phase 3** | Weeks 3-6 | Vendor connectors, nightly sync, email/SMS delivery | Automated data pipeline |
| **Phase 4** | Weeks 4-7 | Frontend consumes live API data instead of static fallback | End-to-end live data flow |
| **Phase 5** | Week 5 | Landing page messaging corrected (See It > Fix It > Prove It) | Correct buyer messaging |
| **Phase 6** | Weeks 8-16 | Sentiment, benchmarking, RBAC, PWA, A/B testing | Post-pilot maturity |

**Critical path:** Phase 1 --> Phase 2 --> Phase 4 (in parallel with Phase 3). A pilot club can go live on CSV imports (Phase 2) while vendor connectors (Phase 3) are being built.

---

*End of document. Questions? Contact ty.hayes@swoopgolf.com.*
