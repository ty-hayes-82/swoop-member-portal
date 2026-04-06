# QA Test: End-to-End Club Onboarding

**App URL:** https://swoop-member-portal.vercel.app
**Purpose:** Verify a brand-new club can sign up, import data, see insights after each import, and understand next steps — the complete "zero to production" journey.
**Last validated:** April 6, 2026 (52/52 Playwright tests passing)

---

## Prerequisites

1. Open a **fresh incognito/private browser window** (no prior localStorage)
2. Keep **DevTools Console** open (F12 → Console) — note any JS errors
3. Have these test files ready (from `docs/jonas-exports/` in the repo):
   - `JCM_Members_F9.csv` — 390 member records
   - `TTM_Tee_Sheet_SV.csv` — 4,415 tee time bookings
   - `POS_Sales_Detail_SV.csv` — 1,916 F&B transactions
   - `JCM_Communications_RG.csv` — 33 complaints
   - `ADP_Staff_Roster.csv` — 45 staff records
   - `7shifts_Staff_Shifts.csv` — 641 shift records
4. Test on **desktop (1280px+)** and **mobile (375px via DevTools responsive mode)**
5. **Record start time** — full onboarding should complete in under 5 minutes

---

## Section 1: Landing & Login Page

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 1.1 | Login page loads | Open app URL in incognito | "Swoop Golf" logo + "Club Intelligence for General Managers" tagline. Email field (placeholder: `sarah@oakmonthills.com`), Password field (placeholder: `Enter password`), orange "Sign In" button. No JS errors. | |
| 1.2 | All entry points visible | Look below the login form | Three options visible: "Sign In" (orange), "Enter Demo Mode (Oakmont Hills CC)" (white), "Set Up New Club" (white). Blue info box at bottom with test account hint. | |
| 1.3 | Empty login rejected | Click "Sign In" without entering anything | HTML5 validation prevents submission (browser shows "Please fill out this field" on email). Page does not navigate away. | |
| 1.4 | Invalid credentials | Enter `fake@test.com` / `wrongpass`, click Sign In | Red/pink error banner: "Invalid credentials". No stack traces. Form remains usable. | |
| 1.5 | Forgot password flow | Click "Forgot your password?" | Panel expands with email input + "Send Reset Link" button. After submit: "If an account exists with that email, a reset link has been sent." (does NOT reveal whether account exists — secure). | |
| 1.6 | Demo mode works | Click "Enter Demo Mode (Oakmont Hills CC)" | First click shows optional email/phone fields. Click "Start Demo" → app loads with Oakmont Hills demo data. Dashboard shows 220 rounds, member alerts, complaints. | |
| 1.7 | Mobile layout | Resize to 375px (DevTools → Toggle device toolbar) | Login form centered, all buttons full-width, no horizontal scroll. All tap targets ≥ 44px. | |

---

## Section 2: New Club Setup — Step 1: Club Info

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 2.1 | Wizard launches | Click "Set Up New Club" on login page | Title: "Set Up Your Club". Subtitle: "Step 1 of 4: Club Info". 4-segment progress bar, first segment orange. | |
| 2.2 | Club Name required | Leave Club Name empty, click Next | Pink error banner: "Club name is required". Does not advance. | |
| 2.3 | Optional fields visible | Observe form | City, State (maxlength=2), ZIP, Estimated Members (number input). Only Club Name has `*`. | |
| 2.4 | Advance to Step 2 | Enter "QA Test Country Club", click Next | Advances to Step 2. Progress bar updates (2 segments orange). | |
| 2.5 | Back preserves state | Click "Back" on Step 2 | Returns to Step 1. "QA Test Country Club" still in Club Name field. City/State/ZIP preserved. | |

---

## Section 3: New Club Setup — Step 2: Admin Account

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 3.1 | Step 2 layout | Arrive at Step 2 | "Step 2 of 4: Admin Account". Subheading: "Create your admin account". Fields: Your Name*, Email* (placeholder: `sarah@pinevalleycc.com`), Password* (placeholder: `Min 8 characters`). | |
| 3.2 | Name required | Leave all empty, click Next | Error: "Your name is required". | |
| 3.3 | Password min length | Fill name + email, enter "abc" for password, click Next | Error: "Password must be at least 8 characters". | |
| 3.4 | Password masked | Type in password field | Characters show as dots (type="password" confirmed). | |
| 3.5 | Valid submission | Fill: Name=`QA Admin`, Email=`qa@testclub.com`, Password=`Test1234!`, click Next | Loading state: button shows "Setting up...". Then advances to Step 3. | |
| 3.6 | API call succeeds | Check Network tab (F12 → Network) | POST to `/api/onboard-club` returns **201**. Response includes `clubId`, `userId`, `token`. | |
| 3.7 | Auth stored | Check DevTools → Application → Local Storage | `swoop_auth_token` (JWT), `swoop_club_id`, `swoop_club_name` all present. No password stored. | |
| 3.8 | Back preserves state | Click Back → Step 1, then Next → Step 2 | All admin fields preserved (name, email). Password field may be cleared (expected). | |

---

## Section 4: New Club Setup — Step 3: Upload Data

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 4.1 | Step 3 layout | Arrive at Step 3 | Blue info banner: "Club created! Upload your data or skip for now." 4 template download links. Upload area (dashed border). | |
| 4.2 | Templates visible | Observe download links | 4 templates: "Members Only" (blue), "Members + Rounds" (purple), "Members + Rounds + F&B" (green), "Full Dataset" (orange). Each shows sheet count. | |
| 4.3 | Template downloads | Click each template link | `.xlsx` file downloads. Open in Excel/Sheets → has named sheets (Members, Rounds, etc.) with column headers and sample data. | |
| 4.4 | Upload area | Click the dashed-border upload area | File picker opens. Accepts `.xlsx` and `.xls` files only. | |
| 4.5 | Invalid file rejected | Try uploading a `.csv` file | Error: `Invalid file type ".csv" — please upload an .xlsx file. Download a template above to get the correct format.` | |
| 4.6 | Valid upload | Upload the "Full Dataset" template | Loading: "Uploading and processing...". Then: green checkmark ✅, filename shown, "Upload Complete" banner with counts (e.g., "40 members, 120 rounds, 200 transactions, 15 complaints"). | |
| 4.7 | Health scores computed | Check Network tab after upload | POST to `/api/compute-health-scores?clubId=...` fires automatically after members imported. | |
| 4.8 | Skip for now | Instead of uploading, click "Skip for Now" | Advances to Step 4. Button styled as secondary (white, not orange). | |
| 4.9 | Continue after upload | Upload a file, then click "Continue" | Button is orange (primary). Advances to Step 4. | |

---

## Section 5: New Club Setup — Step 4: Ready

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 5.1 | Celebration screen | Arrive at Step 4 | 🎉 emoji. "[Club Name] is ready!" | |
| 5.2 | With data | If data uploaded in Step 3 | "What you can see now:" section with ✅ checkmarks for each imported type. 📎 callouts for missing types (e.g., "Upload F&B data later to unlock revenue insights"). | |
| 5.3 | Without data | If skipped in Step 3 | "No data uploaded yet. You can upload data from Admin > CSV Import anytime." | |
| 5.4 | Open Dashboard | Click "Open Dashboard" | Navigates to Today view. Wizard closes completely. No JS errors. | |
| 5.5 | Total time | Measure from "Set Up New Club" click to "Open Dashboard" | Should complete in **under 3 minutes** (club info → admin → skip/upload → dashboard). | |

---

## Section 6: Empty Dashboard (No Data Uploaded)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 6.1 | Welcome state | Complete setup without uploading data | Greeting ("Good morning..." or "Afternoon check-in..."), current date. 📊 icon with "Welcome to your dashboard". | |
| 6.2 | Guidance message | Read the empty state | "Import your member roster, tee sheet, and POS data to see today's operational briefing. Start with members — each data source you connect unlocks more insights." | |
| 6.3 | No demo data leakage | Verify page content | No "Oakmont Hills", no fake member names, no fabricated tee times. Only the empty state. | |
| 6.4 | All pages accessible | Click each sidebar item: Today, Service, Members, Automations, Board Report, Admin | All 6 pages load without crash. Each shows appropriate empty state or minimal content. No JS errors in console. | |
| 6.5 | CSV Import accessible | Navigate to Admin or type `#/csv-import` in URL bar | CSV Import wizard loads with vendor selection and import types. | |

---

## Section 7: Progressive Data Import — Each File Unlocks New Insights

**This is the critical go-to-market test.** Import files one at a time via `#/csv-import` and verify insights appear after each.

### How to Import a File

1. Go to `#/csv-import` (or Admin → CSV Import)
2. Select **Jonas Club Software** as vendor
3. Select the import type (e.g., Members)
4. Click **Next: Upload File**
5. Upload the CSV file
6. Click **Next: Map Columns** — verify columns auto-map (most should be green)
7. Click **Import N Rows** to advance to review
8. Click **Start Import** — wait for completion
9. Check the pages listed below for new insights

### Import 1: Members (`JCM_Members_F9.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.1 | Import succeeds | Upload and import members file | "Import Complete — 390 rows processed". 390 Imported, 0 Errors. "What this unlocks: Member roster, Health scores, At-risk detection." | |
| 7.2 | Health scores visible | Navigate to Members page | Health distribution visible: HEALTHY / WATCH / AT-RISK / CRITICAL counts. Members listed with scores. | |
| 7.3 | Dashboard not empty | Navigate to Today | No longer shows "Welcome to your dashboard" empty state. Shows member alerts, briefing content, or attention items. | |
| 7.4 | CRM connected | Navigate to Admin → Data Health tab | CRM domain shows "Connected". Row count reflects imported members. Platform Value Score > 0%. | |

### Import 2: Tee Times (`TTM_Tee_Sheet_SV.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.5 | Import succeeds | Upload and import tee times file | Import complete with 4,000+ rows. "What this unlocks: Golf engagement, Pace analysis, Round trends." | |
| 7.6 | Golf data visible | Navigate to Today | Round/golf/tee/booking related data visible in the dashboard. | |
| 7.7 | TEE_SHEET connected | Navigate to Admin → Data Health | TEE_SHEET domain shows "Connected". Platform Value Score increased (CRM 40% + Tee Sheet 25% = 65%). | |

### Import 3: F&B Transactions (`POS_Sales_Detail_SV.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.8 | Import succeeds | Upload and import transactions file | Import complete with 1,900+ rows. "What this unlocks: Revenue signals, Dining engagement, Spend patterns." | |
| 7.9 | Revenue data visible | Navigate to Today | Revenue/dining/spend/transaction/F&B related data visible. | |
| 7.10 | POS connected | Navigate to Admin → Data Health | POS domain shows "Connected". Platform Value Score increased (now 85%). | |

### Import 4: Complaints (`JCM_Communications_RG.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.11 | Import succeeds | Upload and import complaints file | Import complete with 33 rows. | |
| 7.12 | Complaints on Today | Navigate to Today | "OPEN COMPLAINTS" section visible in Today's Risks. Shows member names, categories, aging (days open), status. | |

### Import 5: Staff (`ADP_Staff_Roster.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.13 | Import succeeds | Upload and import staff file | Import complete with 45 rows. "What this unlocks: Staff directory, Department breakdown, Staffing analytics foundation." | |

### Import 6: Shifts (`7shifts_Staff_Shifts.csv`)

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.14 | Import completes | Upload and import shifts file | Import completes without crash. **Note:** Column auto-mapping may not match all fields — some rows may fail. This is a known mapping gap, not a crash. | |
| 7.15 | LABOR domain | Navigate to Admin → Data Health | If rows imported successfully, LABOR domain shows "Connected". | |

### Post-Import: All Pages Have Data

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 7.16 | Today view | Navigate to Today | Member alerts, round data, complaints, staffing — multiple sections populated. Not the empty state. | |
| 7.17 | Members page | Navigate to Members | Health distribution (Healthy/Watch/At-Risk/Critical). Archetype assignments. Member directory. | |
| 7.18 | Service page | Navigate to Service | Service quality data, complaint tracking, staffing information. | |
| 7.19 | Board Report | Navigate to Board Report | Page loads. May show "Board report needs data" for new clubs (normal — requires 30 days of live data for full KPIs). | |
| 7.20 | Automations | Navigate to Automations | Inbox, Playbooks, Agents, Settings tabs all load. | |
| 7.21 | Admin | Navigate to Admin | Data Hub shows connected sources. Data Health shows Platform Value Score and connected domains. | |
| 7.22 | No JS errors | Check DevTools Console across all pages | Zero JavaScript errors. No failed API calls returning 500. | |

---

## Section 8: Data Health & Platform Value

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 8.1 | Platform Value Score | Navigate to Admin → Data Health tab | Circular progress indicator showing %. Increases as more domains are connected. | |
| 8.2 | Domain weights | Check domain breakdown | CRM (40%), Tee Sheet (25%), POS/F&B (20%), Email (10%), Scheduling & Labor (5%). | |
| 8.3 | Per-domain cards | Check each domain | Shows: status (Connected/Not Connected), row count, value %, features unlocked, last sync time. | |
| 8.4 | Next recommendation | Check below domain cards | "Connect [Domain]" suggestion for unconnected domains. Recommends the highest-value unconnected domain. | |
| 8.5 | Value increases | Compare before/after each import | Platform Value Score increases after each import (0% → 40% → 65% → 85% → etc.). | |

---

## Section 9: Navigation & Route Redirects

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 9.1 | Sidebar navigation | Click each sidebar item | Today, Service, Members, Automations, Board Report, Admin all load. Active item highlighted orange. | |
| 9.2 | `#/playbooks` | Type in URL bar | Redirects to `#/automations`. | |
| 9.3 | `#/daily-briefing` | Type in URL bar | Redirects to `#/today`. | |
| 9.4 | `#/member-health` | Type in URL bar | Redirects to `#/members`. | |
| 9.5 | `#/data-health` | Type in URL bar | Redirects to `#/admin`. | |
| 9.6 | `#/automation-dashboard` | Type in URL bar | Redirects to `#/automations`. | |
| 9.7 | `#/agent-command` | Type in URL bar | Redirects to `#/automations`. | |
| 9.8 | `#/csv-import` deep link | Type in URL bar | CSV Import wizard loads directly. | |
| 9.9 | Member profile | Click any member name in the app | Member profile page/panel loads with health score, contact info, quick actions. | |
| 9.10 | Page transitions | Navigate between pages | Smooth transitions, no flicker, no blank screens, no layout shifts. | |

---

## Section 10: Mobile Responsiveness

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 10.1 | Login page | Open DevTools → Toggle Device Toolbar → iPhone 12/13 (375px) | Login form centered, full-width fields and buttons. No horizontal scroll. | |
| 10.2 | Setup wizard | Launch wizard at 375px | All 4 steps usable. Fields stack vertically. City/State/ZIP grid adapts. Buttons tappable. | |
| 10.3 | Dashboard | View Today at 375px | Sections stack vertically. Cards full-width. No horizontal scroll. | |
| 10.4 | Sidebar | Check sidebar at 375px | Collapses to hamburger/drawer. Navigation items accessible. | |
| 10.5 | CSV Import | View CSV Import at 375px | Wizard steps, file upload, column mapping all usable. | |
| 10.6 | Touch targets | Tap all buttons at 375px | All interactive elements have ≥ 44×44px touch targets. | |

---

## Section 11: Security

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 11.1 | Password not stored | Check localStorage after setup | No password anywhere. Only token, user object (no password field), clubId. | |
| 11.2 | JWT token | Inspect `swoop_auth_token` | Three dot-separated base64 segments (JWT format). Not plaintext credentials. | |
| 11.3 | XSS in club name | Enter `<script>alert('xss')</script>` as club name | No alert fires. Name rendered as escaped text. | |
| 11.4 | API auth required | Open new tab, go to `https://swoop-member-portal-dev.vercel.app/api/import-csv` (POST with no token) | Returns 400 or 401. Not 200. | |
| 11.5 | Forgot password safe | Submit forgot password for any email | Same message whether account exists or not. Does not reveal user existence. | |
| 11.6 | No sensitive data in errors | Trigger various errors | Error messages are user-friendly. No SQL queries, file paths, or stack traces exposed. | |

---

## Section 12: Error Recovery & Edge Cases

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 12.1 | Empty XLSX upload | Upload empty .xlsx in setup wizard | Graceful message — no crash. | |
| 12.2 | Wrong file type | Upload .pdf renamed to .xlsx | Error about invalid file. No crash. | |
| 12.3 | Duplicate member import | Import same members CSV twice via `#/csv-import` | Second import upserts (updates existing). No duplicate members. | |
| 12.4 | Special chars in club name | Enter `O'Brien's Golf & CC — #1` | Accepted. Displayed correctly on dashboard. No XSS or SQL errors. | |
| 12.5 | Session expiry | Delete `swoop_auth_token` from localStorage, then reload | Redirected to login page. No crash or partial UI. | |
| 12.6 | Browser back during setup | Press Back button during Step 3 | Returns to previous step or login. No blank screen. | |
| 12.7 | Unmapped required fields | In CSV Import, unmap `first_name`, try to proceed | Blocked: "Map 1 required field to continue". Cannot advance. | |
| 12.8 | Network failure | Disable network (DevTools → Network → Offline), try to create club | Error: "Connection error. Check your network and try again." Form stays usable. | |

---

## Section 13: Performance

| # | Check | Steps | Expected | Pass? |
|---|-------|-------|----------|-------|
| 13.1 | Login page load | Measure time from navigation to form visible | < 3 seconds | |
| 13.2 | Club creation API | Network tab → POST `/api/onboard-club` duration | < 3 seconds | |
| 13.3 | File upload + processing | Time from file selection to "Upload Complete" (40 rows) | < 5 seconds | |
| 13.4 | Dashboard first load | Time from "Open Dashboard" to full render | < 3 seconds | |
| 13.5 | Page navigation | Time from sidebar click to content visible | < 2 seconds | |
| 13.6 | CSV Import — large file | Import TTM_Tee_Sheet_SV.csv (4,415 rows) | < 30 seconds | |

---

## Section 14: Go-to-Market Readiness Checklist

| # | Criteria | Status | Notes |
|---|----------|--------|-------|
| 14.1 | New club: signup → first insight in under 5 minutes | | |
| 14.2 | Club can complete setup without a support call | | |
| 14.3 | Template files import with 0 errors | | |
| 14.4 | App clearly communicates what's unlocked at every stage | | |
| 14.5 | Every empty state tells the user what to do next | | |
| 14.6 | Health scores show realistic distribution (not all 100 or all 0) | | |
| 14.7 | Board Report page is presentable (even if minimal for new clubs) | | |
| 14.8 | No demo data leaks into authenticated clubs (no "Oakmont Hills") | | |
| 14.9 | All error messages are helpful, not technical | | |
| 14.10 | Full onboarding works on mobile | | |
| 14.11 | No page takes > 3 seconds, no spinner > 10 seconds | | |
| 14.12 | Member count consistent between import results, Members page, and Admin | | |
| 14.13 | Can log out and log back in with created credentials | | |
| 14.14 | Each data import visibly unlocks new intelligence in the app | | |

---

## Automated Tests

The same flows are covered by Playwright tests in `tests/e2e/onboarding.spec.js` (52 tests, ~4 minutes).

```bash
# Install
npm i -D @playwright/test
npx playwright install chromium

# Run all tests
npx playwright test tests/e2e/onboarding.spec.js

# Run with visible browser
npx playwright test tests/e2e/onboarding.spec.js --headed

# Run only the progressive import suite
npx playwright test tests/e2e/onboarding.spec.js -g "2B"

# Generate HTML report
npx playwright test tests/e2e/onboarding.spec.js --reporter=html
```

---

## Issue Tracking Template

When an issue is found, log it:

```
### Issue #[N]: [Short title]
- **Section/Check:** [e.g., 7.5]
- **Severity:** Critical / High / Medium / Low
- **Steps to reproduce:** [exact steps]
- **Expected:** [what should happen]
- **Actual:** [what actually happened]
- **Screenshot:** [attach if applicable]
- **Console errors:** [paste any JS errors]
- **Browser/Device:** [e.g., Chrome 124 / iPhone 15 / 375px responsive]
```

---

## Execution Log

| Section | Tester | Date | Duration | Result | Issues |
|---------|--------|------|----------|--------|--------|
| 1. Login Page | | | | | |
| 2. Club Info | | | | | |
| 3. Admin Account | | | | | |
| 4. Upload Data | | | | | |
| 5. Ready Screen | | | | | |
| 6. Empty Dashboard | | | | | |
| 7. Progressive Imports | | | | | |
| 8. Data Health | | | | | |
| 9. Navigation | | | | | |
| 10. Mobile | | | | | |
| 11. Security | | | | | |
| 12. Error Recovery | | | | | |
| 13. Performance | | | | | |
| 14. Go-to-Market | | | | | |
| **TOTAL** | | | | | |
