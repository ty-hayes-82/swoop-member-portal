# SWOOP GOLF V2 -- QA TESTING PLANS

**For each development phase, this document provides step-by-step test scripts that a QA tester can execute without any prior knowledge of the project.**

**Last Updated:** March 31, 2026

---

## HOW TO USE THIS DOCUMENT

Each phase has its own section. Within each section:

- **Prerequisites** tell you what must be true before you start testing
- **Environment** tells you which URL to test against
- **Test Cases** are numbered and grouped by feature area
- Each test case has: ID, Description, Steps, Expected Result, Pass/Fail checkbox
- **Severity levels:** P0 = blocker (cannot ship), P1 = major (must fix before pilot), P2 = minor (fix when possible)
- After running all tests, fill in the **Phase Summary** at the bottom of each section
- Screenshot any failures and note the browser/device used

**Browsers to test:** Chrome (latest), Safari (latest), Mobile Safari (iOS), Mobile Chrome (Android)

**Test URLs:**
- Production: `https://swoop-member-portal.vercel.app`
- Dev: `https://swoop-member-portal-git-dev-tyhayesswoopgolfcos-projects.vercel.app`

---

# PHASE 1 QA: INFRASTRUCTURE SETUP

## Prerequisites
- Database migrations have been run (all 4)
- SendGrid API key is in Vercel environment variables
- Twilio credentials are in Vercel environment variables
- Dev branch has been promoted to production (or production URL updated)

## Environment
- **URL:** Production URL (`https://swoop-member-portal.vercel.app`)
- **Mode:** Demo mode (no real club data yet)

---

### 1.1 DATABASE VERIFICATION

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| DB-01 | All tables exist | Navigate to `[URL]/api/schema-all` in browser | JSON response listing at minimum: `club`, `members`, `rounds`, `transactions`, `complaints`, `health_scores`, `actions`, `csv_imports`. No error messages. | P0 | [ ] |
| DB-02 | Members table has required columns | In the `schema-all` response, find the `members` entry | Must include columns: `member_id`, `club_id`, `first_name`, `last_name`, `email`, `health_score`, `health_tier`, `archetype`, `annual_dues`, `join_date` | P0 | [ ] |
| DB-03 | Health scores table exists | In the `schema-all` response, find `health_scores` | Must include: `member_id`, `club_id`, `score`, `tier`, `golf_score`, `dining_score`, `email_score`, `event_score` | P0 | [ ] |
| DB-04 | Migrations are idempotent | Run each migration POST request a second time | All should return `"status": "ok"` or `"already_exists"`. No errors. No duplicate tables. | P1 | [ ] |

**How to check DB-01:**
```
Open browser to: [URL]/api/schema-all
You should see a JSON object. Look for table names as keys.
```

---

### 1.2 NAVIGATION STRUCTURE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| NAV-01 | Exactly 7 nav items visible | Load the app. Look at left sidebar navigation. | Exactly these 7 items visible (in order): Today, Members, Revenue, Insights, Actions, Board Report, Admin | P0 | [ ] |
| NAV-02 | No removed features visible | Scan the entire sidebar | None of these should appear: Growth Pipeline, Location Intelligence, Storyboard Flows, AI Agent Command, Automation Dashboard, Activity History, Data Model, Demo Mode, Outreach Playbooks | P0 | [ ] |
| NAV-03 | Today is default route | Load the app with no hash (just the base URL) | Should land on Today view. URL should show `#/today` | P1 | [ ] |
| NAV-04 | Each nav item navigates correctly | Click each of the 7 nav items one by one | Each should load its corresponding page without errors. No blank screens. No console errors. | P0 | [ ] |
| NAV-05 | Legacy route redirects work | Manually type `#/member-health` in the URL bar | Should redirect to `#/members` | P1 | [ ] |
| NAV-06 | Legacy route: experience-insights | Manually type `#/experience-insights` in the URL bar | Should redirect to `#/insights` (standalone Insights page, NOT to cockpit/members) | P1 | [ ] |
| NAV-07 | Legacy route: playbooks-automation | Manually type `#/playbooks-automation` in the URL bar | Should redirect to `#/actions` | P1 | [ ] |
| NAV-08 | Legacy route: revenue-leakage | Manually type `#/revenue-leakage` in the URL bar | Should redirect to `#/revenue` | P1 | [ ] |

---

### 1.3 TODAY VIEW

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| TODAY-01 | Page loads without errors | Click "Today" in nav | Page renders with content. No blank white screen. No JavaScript errors in console (F12 > Console). | P0 | [ ] |
| TODAY-02 | Health score hero card | Look for a prominent card showing health score distribution | Should show tier breakdown (Healthy / Watch / At-Risk / Critical) with counts. In demo mode, numbers should be non-zero. | P0 | [ ] |
| TODAY-03 | Dynamic date display | Look at the date/header area at the top of Today | For demo mode: Should show "SATURDAY, JANUARY 17, 2026" or similar demo date. Should NOT show a hardcoded "OAKMONT HILLS CC" if you're logged in as a real club. | P1 | [ ] |
| TODAY-04 | Pending actions count | Look for a pending actions indicator | Should show a count (e.g., "3 actions waiting"). Clicking it should navigate to Actions page. | P1 | [ ] |
| TODAY-05 | Complaints panel | Look for an open complaints section | Should show complaints with day counters (e.g., "Open 6 days"). Complaints >30 days should be highlighted. | P1 | [ ] |
| TODAY-06 | No AI agent references | Read all text on the Today page carefully | No text should mention "AI Agent", "agent actions", or "AI-powered". | P1 | [ ] |

---

### 1.4 MEMBERS PAGE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| MEM-01 | Page loads | Click "Members" in nav | Page renders with member data. Two mode tabs visible: "At-Risk" and "All Members" | P0 | [ ] |
| MEM-02 | At-Risk mode | Click "At-Risk" tab (should be default) | Shows members with health scores below 50. Each row shows: name, health score, tier badge, archetype, dollar exposure (annual dues at risk). | P0 | [ ] |
| MEM-03 | All Members mode | Click "All Members" tab | Shows all members in a table. Search bar visible at top. | P0 | [ ] |
| MEM-04 | Search works | Type a partial member name in the search bar | Table filters to matching members. Result count updates. | P1 | [ ] |
| MEM-05 | Health score breakdown | Click on any member name/row | Should open a member profile drawer or page showing 4-dimension breakdown: Golf, Dining, Email, Events. Each with a progress bar and score. | P0 | [ ] |
| MEM-06 | Call button | Look at At-Risk member rows | Each row should have a phone/call icon. Clicking it should initiate a `tel:` link (will prompt phone app on mobile). | P1 | [ ] |
| MEM-07 | Dollar exposure column | Look at the At-Risk table columns | Should include a column showing annual dues at risk (e.g., "$15,000" or "$32,000"). | P1 | [ ] |
| MEM-08 | First 90 Days tab | Look for a "First 90 Days" tab or section | Should show new member cohort tracker with milestone markers (30/60/90 day). Shows which integration milestones each new member has hit (first round, first dining, first event). | P1 | [ ] |
| MEM-09 | Archetype filter chips | Look for horizontal scrollable filter chips | Chips like "All Archetypes", "Die-Hard Golfer", "Social Butterfly", etc. Clicking one filters the member list. | P1 | [ ] |
| MEM-10 | No Insights/Waitlist modes | Check the mode tabs on Members page | Should only show "At-Risk" and "All Members". NO "Insights" tab. NO "Waitlist & Tee Sheet" tab. | P1 | [ ] |
| MEM-11 | "Members scored" label | Look at the health score hero/summary area | Should say "members scored" NOT "members tracked" | P2 | [ ] |

---

### 1.5 REVENUE PAGE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| REV-01 | Page loads | Click "Revenue" in nav | Page renders with revenue data. | P0 | [ ] |
| REV-02 | Terminology check | Read all headings and labels on the page | Should say "Service Gap Impact" or "Service Gap Breakdown" -- NOT "Revenue Leakage" or "Total Monthly Leakage" | P0 | [ ] |
| REV-03 | Scenario modeling sliders | Find the scenario modeling section | Sliders should exist. Each slider handle should be at least 44px wide (touch-friendly). Dragging a slider should update the projected recovery amount. | P1 | [ ] |
| REV-04 | Members Protected metric | Look near the dollar recovery amount | Should show both a dollar amount AND a "Members Protected" count. | P1 | [ ] |
| REV-05 | Breakdown chart | Look for a breakdown of service gap causes | Should show categories (e.g., "Service Pace", "Staffing", "Weather") with dollar amounts for each. | P1 | [ ] |
| REV-06 | "Service Pace" not "Pace-of-Play" | Check the breakdown chart labels | Should say "Service Pace" NOT "Pace-of-Play Impact" | P2 | [ ] |
| REV-07 | Snapshot button label | Look for a button linking to full revenue view | Should say "Revenue" NOT "Revenue & Operations" | P2 | [ ] |

---

### 1.6 INSIGHTS PAGE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| INS-01 | Standalone page | Click "Insights" in nav | Should load its OWN page (not redirect to Members or Cockpit). URL should show `#/insights`. | P0 | [ ] |
| INS-02 | Correlation cards | Look for correlation/insight cards | Should show cross-domain insight cards (e.g., "Members who dine 3+x/month have 94% retention"). Even demo data is fine. | P1 | [ ] |
| INS-03 | No Survey Intelligence tab | Look at any tabs on the Insights page | No tab labeled "Survey Intelligence" should be visible. | P1 | [ ] |
| INS-04 | No Storyboard Flow links | Look for any "See this in action" or flow links | No link to Storyboard Flow #04 or any storyboard flows should appear. | P1 | [ ] |
| INS-05 | Events tab health impact | If an Events tab exists, check its columns | Should include a "Health Impact" column showing health score delta per event type. | P2 | [ ] |

---

### 1.7 ACTIONS PAGE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| ACT-01 | Page loads | Click "Actions" in nav | Page renders. Nav label says "Actions" (NOT "Playbooks & Automation"). | P0 | [ ] |
| ACT-02 | Two tabs only | Look at the tab bar on Actions page | Exactly 2 tabs: "Inbox" and "Templates" (the Templates tab may also be called "Playbook Templates"). NO "Agents" tab. NO "History" tab. | P0 | [ ] |
| ACT-03 | No AI Agent references | Read all text on the Actions page | No text should say "AI Agent", "agent actions waiting", "AI Agents" row, or similar. | P0 | [ ] |
| ACT-04 | Inbox approve/dismiss | Find a pending action in the Inbox tab | Should have Approve and Dismiss buttons. Clicking Approve should mark it as approved with visual confirmation. | P1 | [ ] |
| ACT-05 | Approved/dismissed counts | Look for action counters | If there are 0 approved and 0 dismissed, those counters should be hidden (not showing "3 approved / 1 dismissed" with demo data for real clubs). | P1 | [ ] |
| ACT-06 | "Activate Weather Protocol" | If a weather-related action appears | Button should say "Activate Weather Protocol" NOT "Activate Weather Playbook" | P2 | [ ] |
| ACT-07 | Priority-based filter | Look for a filter/dropdown on the Inbox | Should filter by priority (not "by agent"). | P2 | [ ] |

---

### 1.8 BOARD REPORT

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| BR-01 | Page loads | Click "Board Report" in nav | Page renders with report data. | P0 | [ ] |
| BR-02 | Four tabs only | Look at sub-tabs on Board Report | Exactly 4: Summary, Member Saves, Operational Saves, What We Learned. NO "Growth Pipeline" tab. | P0 | [ ] |
| BR-03 | Dollar amounts formatted | Check headline metrics | Dollar amounts should be properly formatted (e.g., "$168K" not "168000"). | P1 | [ ] |
| BR-04 | Key metrics visible | Look at Summary tab | Should show: members saved count, dues protected amount, service failures caught, average response time. | P1 | [ ] |

---

### 1.9 ADMIN PAGE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| ADM-01 | Page loads | Click "Admin" in nav | Page renders with admin tabs. | P0 | [ ] |
| ADM-02 | Five tabs | Look at Admin sub-tabs | Should have: Integrations, Data Health, CSV Import, Notifications, User Roles. NO "Onboarding" tab. NO "Settings" tab. NO "Activity Log" tab (unless renamed). | P0 | [ ] |
| ADM-03 | CSV Import tab renders | Click "CSV Import" tab | Should show the CSV Import Hub (not Activity Log content). Should have upload area and template download section. | P1 | [ ] |
| ADM-04 | User Roles tab renders | Click "User Roles" tab | Should show team member table with role badges and invite button (not generic Settings content). | P1 | [ ] |
| ADM-05 | Integrations tab | Click "Integrations" tab | Should show connected system tiles with status indicators. | P1 | [ ] |
| ADM-06 | Data Health tab | Click "Data Health" tab | Should show data pipeline status, connection health indicators. | P1 | [ ] |

---

### 1.10 MOBILE EXPERIENCE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| MOB-01 | Mobile detection | Open app on mobile device or resize browser to <768px width | Should show mobile layout (no sidebar, bottom tab bar instead). | P0 | [ ] |
| MOB-02 | Five-tab bottom nav | Look at bottom of screen on mobile | 5 tabs: Today, Members, Revenue, Actions, More | P0 | [ ] |
| MOB-03 | "More" sheet | Tap "More" tab | Should open a slide-up sheet showing: Insights, Board Report, Admin. Tapping backdrop should dismiss. | P1 | [ ] |
| MOB-04 | Hash routing does not trigger mobile | Type `#/members` in URL bar on desktop | Should NOT switch to mobile mode. Mobile should only trigger on actual small viewport or `#/m` prefix. | P0 | [ ] |
| MOB-05 | Touch targets | Tap various buttons and interactive elements on mobile | All touch targets should be at least 44px height. No elements should be too small to tap accurately. | P1 | [ ] |
| MOB-06 | Slider touch targets | Navigate to Revenue page on mobile, find scenario sliders | Slider handles should be at least 44px. Should be easy to drag with a finger. | P1 | [ ] |

---

### 1.11 DEMO VS REAL CLUB ISOLATION

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| ISO-01 | Demo mode works | Load app in default demo mode | Should show "Oakmont Hills CC" data. Members like "James Whitfield", "Pamela Ulrich" should appear. Date references January 2026. | P0 | [ ] |
| ISO-02 | Real club gets empty data | If a real club has been set up, switch to it | Should NOT show Oakmont Hills demo data. Members should be empty (or show real imported data). No "Pamela Ulrich" or "James Whitfield". | P0 | [ ] |
| ISO-03 | Dynamic date for real clubs | When viewing as a real club | Date in header/Today view should show TODAY's actual date, not "January 17, 2026". | P1 | [ ] |
| ISO-04 | Club name for real clubs | When viewing as a real club | Header should show the real club name (e.g., "Bowling Green CC"), not "Oakmont Hills CC". | P1 | [ ] |
| ISO-05 | No demo interventions leak | When viewing as a real club, check Today and Actions | Should NOT show demo interventions (no "Sarah Mitchell", no demo complaints, no demo metrics). | P0 | [ ] |

---

### Phase 1 Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|------------|--------|--------|---------|
| Database | 4 | | | |
| Navigation | 8 | | | |
| Today | 6 | | | |
| Members | 11 | | | |
| Revenue | 7 | | | |
| Insights | 5 | | | |
| Actions | 7 | | | |
| Board Report | 4 | | | |
| Admin | 6 | | | |
| Mobile | 6 | | | |
| Demo/Real Isolation | 5 | | | |
| **TOTAL** | **69** | | | |

**Phase 1 Pass Criteria:** All P0 tests pass. No more than 3 P1 failures. P2 failures are logged but do not block.

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# PHASE 2 QA: FIRST PILOT CLUB ONBOARDING

## Prerequisites
- Phase 1 QA passed
- A pilot club has been registered via `api/onboard-club`
- Member data has been imported (CSV or XLSX)
- Health scores have been computed

## Environment
- **URL:** Production URL
- **Mode:** Logged in as the pilot club (not demo mode)
- **Expected data:** Real member names from the pilot club

---

### 2.1 CLUB REGISTRATION

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| REG-01 | Club exists in system | Navigate to `[URL]/api/data-availability?clubId=[CLUB_ID]` | Should return JSON with the club's data availability. Should NOT return an error. | P0 | [ ] |
| REG-02 | Club name displays | Log in as the pilot club and check header | Club name (e.g., "Bowling Green CC") should appear in the header, not "Oakmont Hills CC". | P0 | [ ] |

---

### 2.2 MEMBER DATA IMPORT

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| IMP-01 | Members appear on Members page | Navigate to Members > All Members | Real member names from the pilot club should appear. Count should match the imported CSV. | P0 | [ ] |
| IMP-02 | Member search works with real names | Type a real member name in the search bar | Should find and display the correct member. | P0 | [ ] |
| IMP-03 | Member profile has data | Click on any imported member | Profile drawer should show: name, membership type, join date, annual dues, email. Health score may or may not be computed yet. | P1 | [ ] |
| IMP-04 | No demo data mixed in | Scroll through the member list | No "James Whitfield", "Pamela Ulrich", "Sarah Mitchell" or other demo names should appear. | P0 | [ ] |
| IMP-05 | Member count is accurate | Compare the displayed count to the known import count | The total member count shown in the UI should match the number of rows imported. | P1 | [ ] |

---

### 2.3 HEALTH SCORE COMPUTATION

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| HS-01 | Health scores exist | Navigate to Members > At-Risk | Members should have health scores (0-100) and tier badges (Healthy/Watch/At-Risk/Critical). | P0 | [ ] |
| HS-02 | Tier distribution is reasonable | Check the health score hero on Today or Members | Distribution should not be 100% one tier. With members-only data (no rounds/dining), expect most to be Watch or At-Risk since golf/dining dimensions will be low. | P1 | [ ] |
| HS-03 | Four-dimension breakdown | Click on a member with a health score | Should show 4 dimensions: Golf, Dining, Email, Events. With only member data imported, Golf and Dining may show as 0 or low. This is expected. | P1 | [ ] |
| HS-04 | Archetypes assigned | Check the archetype labels on member rows | Each member should have an archetype (e.g., "Balanced Active", "New Member", "Ghost"). Not all should be the same archetype. | P1 | [ ] |
| HS-05 | Today hero reflects real data | Check Today view health hero card | Should show real tier counts (not the demo values of 235/39/26). | P0 | [ ] |

---

### 2.4 ADDITIONAL DATA DOMAINS

*Run these tests only if rounds, transactions, or complaints were also imported.*

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| DATA-01 | Rounds data visible | After importing rounds, check Members page | Members should show golf frequency indicators. Health score golf dimension should be non-zero for active golfers. | P1 | [ ] |
| DATA-02 | Dining data visible | After importing transactions, check Revenue page | Revenue page should show real dining data (not demo fallback). Service gap amounts should reflect real data. | P1 | [ ] |
| DATA-03 | Complaints visible | After importing complaints, check Today view | Complaints panel should show real complaints with actual member names and categories. | P1 | [ ] |
| DATA-04 | Health scores improve with more data | Run health score computation after adding rounds + transactions | Members with more activity data should have more accurate (and likely higher) scores than members-only computation. | P2 | [ ] |
| DATA-05 | Data availability reflects imports | Check `api/data-availability?clubId=[CLUB_ID]` | Response should show which domains have data (members: true, rounds: true/false, transactions: true/false, etc.) | P1 | [ ] |

---

### 2.5 CHURN PREDICTIONS

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| CHURN-01 | Predictions generated | After running `predict-churn`, check Members page | Members with declining engagement should show churn risk indicators. | P1 | [ ] |
| CHURN-02 | At-Risk members identified | Check At-Risk tab on Members page | Should show members with low health scores. Dollar exposure column should show real dues amounts from imported data. | P1 | [ ] |

---

### 2.6 CROSS-DOMAIN CORRELATIONS

*Only testable if 2+ data domains are imported (e.g., members + rounds, or members + transactions).*

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| CORR-01 | Correlations computed | After running `compute-correlations`, check Insights page | Should show correlation cards with real data. If only one domain is imported, page may show a CTA to connect more systems. | P1 | [ ] |
| CORR-02 | Correlations make sense | Read the correlation headlines | They should be logically consistent (e.g., members who dine more have better retention). No obviously wrong correlations. | P2 | [ ] |

---

### 2.7 PROGRESSIVE DISCLOSURE

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| PD-01 | Missing data shows CTA | If rounds are NOT imported, check Revenue page | Should show a CTA like "Connect your tee sheet to unlock pace-of-play insights" -- NOT broken/empty charts. | P1 | [ ] |
| PD-02 | Empty states are graceful | Navigate through all 7 pages with minimal data | No page should show a blank white screen or JavaScript error. Pages with insufficient data should show helpful empty states or CTAs. | P0 | [ ] |

---

### Phase 2 Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|------------|--------|--------|---------|
| Club Registration | 2 | | | |
| Member Import | 5 | | | |
| Health Scores | 5 | | | |
| Additional Data | 5 | | | |
| Churn Predictions | 2 | | | |
| Correlations | 2 | | | |
| Progressive Disclosure | 2 | | | |
| **TOTAL** | **23** | | | |

**Phase 2 Pass Criteria:** All P0 tests pass. Real member data is visible on all relevant pages. No demo data leaks.

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# PHASE 3 QA: VENDOR INTEGRATION CONNECTORS

## Prerequisites
- Phase 2 QA passed
- At least one vendor connector built (Jonas CRM, ForeTees, or POS)
- SendGrid email delivery wired
- Twilio SMS delivery wired

## Environment
- **URL:** Production URL
- **Mode:** Logged in as pilot club
- **Note:** Some tests require receiving actual emails/SMS. Coordinate with the test phone number and email inbox.

---

### 3.1 VENDOR CONNECTOR SYNC

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| SYNC-01 | Sync status endpoint | Navigate to `[URL]/api/sync-status?clubId=[CLUB_ID]` | Should return JSON showing each connector's status, last sync time, and row count. | P0 | [ ] |
| SYNC-02 | Admin Data Health reflects sync | Navigate to Admin > Data Health tab | Connected systems should show green status with "Last sync: X minutes ago" timestamps. | P0 | [ ] |
| SYNC-03 | Admin Integrations shows connected | Navigate to Admin > Integrations tab | The vendor that was connected should show as "Connected" (not "Available" or "Coming Soon"). | P1 | [ ] |
| SYNC-04 | Data freshness after sync | Trigger a manual sync (or wait for cron) then check Members page | Member data should reflect the latest data from the vendor system. New members added in Jonas should appear. | P1 | [ ] |
| SYNC-05 | Health scores auto-recompute | After a sync completes, check health scores | Health scores should reflect the new data. Scores may change from prior computation. | P1 | [ ] |

---

### 3.2 EMAIL DELIVERY (SENDGRID)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| EMAIL-01 | Approve email action | In Actions > Inbox, find a pending action that involves email. Click Approve. | Action should be marked as "Approved" in the UI. | P0 | [ ] |
| EMAIL-02 | Email received | Check the recipient's email inbox (use a test email) | Email should arrive within 60 seconds. Subject and body should match the action template. Sender should be from `swoopgolf.com` or the configured domain. | P0 | [ ] |
| EMAIL-03 | Email formatting | Open the received email | Should be properly formatted HTML (not raw code). Club name and member name should be correctly populated in the template. No placeholder text like `{{member_name}}`. | P1 | [ ] |
| EMAIL-04 | SendGrid dashboard confirms | Check SendGrid dashboard > Activity | Should show the sent email with delivery confirmation. | P1 | [ ] |
| EMAIL-05 | Action outcome tracked | After sending, check the action in the UI | Should show as "Completed" or "Sent" with a timestamp. | P1 | [ ] |

---

### 3.3 SMS DELIVERY (TWILIO)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| SMS-01 | Approve SMS action | In Actions > Inbox, find a pending action that involves SMS. Click Approve. | Action should be marked as "Approved" in the UI. | P0 | [ ] |
| SMS-02 | SMS received | Check the recipient's phone (use a test number) | SMS should arrive within 30 seconds. Content should match the action template. Sender should be the Twilio number. | P0 | [ ] |
| SMS-03 | SMS content is correct | Read the received SMS | Member name and action content should be correctly populated. No placeholder text. | P1 | [ ] |
| SMS-04 | Action outcome tracked | After sending, check the action in the UI | Should show as "Completed" or "Sent" with a timestamp. | P1 | [ ] |

---

### 3.4 MORNING DIGEST EMAIL

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| DIGEST-01 | Morning digest fires | Wait for the scheduled cron time (or manually trigger `api/notifications`) | GM's email should receive a morning digest email. | P1 | [ ] |
| DIGEST-02 | Digest content | Open the morning digest email | Should include: action count, critical members summary, open complaints count, saves this week, and a link to the Today view. | P1 | [ ] |
| DIGEST-03 | Digest is branded HTML | Check email format | Should be branded HTML (not plain text). Swoop logo/colors should be present. | P2 | [ ] |
| DIGEST-04 | Deep link works | Click the link in the digest email | Should open the app to the Today view. | P2 | [ ] |

---

### 3.5 NIGHTLY CRON

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| CRON-01 | Cron is configured | Check `vercel.json` for cron configuration | Should have a cron entry pointing to the nightly sync endpoint. | P1 | [ ] |
| CRON-02 | Cron fires successfully | After cron fires, check `api/sync-status` | Last sync timestamps should be updated to the cron run time. | P1 | [ ] |
| CRON-03 | No stale data | On the morning after cron runs, check Members page | Data should be fresh (reflects latest vendor data). | P1 | [ ] |

---

### Phase 3 Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|------------|--------|--------|---------|
| Vendor Sync | 5 | | | |
| Email Delivery | 5 | | | |
| SMS Delivery | 4 | | | |
| Morning Digest | 4 | | | |
| Nightly Cron | 3 | | | |
| **TOTAL** | **21** | | | |

**Phase 3 Pass Criteria:** All P0 tests pass. At least one vendor connector syncing data. Email and SMS delivery confirmed with real messages received.

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# PHASE 4 QA: FRONTEND LIVE DATA WIRING

## Prerequisites
- Phase 3 QA passed
- Frontend services are consuming live API responses
- Both demo mode and real club mode should work

## Environment
- **URL:** Production URL
- **Mode:** Test BOTH demo mode AND real club mode

---

### 4.1 DEMO MODE REGRESSION

*Run these in demo mode to confirm static fallback still works.*

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| DEMO-01 | Demo mode activates | Switch to demo mode (or use default if no real club is set) | Should show Oakmont Hills CC demo data. | P0 | [ ] |
| DEMO-02 | Today view in demo | Check Today page in demo mode | Should show demo briefing data (complaints, actions, health hero with 235/39/26 or similar demo distribution). | P0 | [ ] |
| DEMO-03 | Members in demo | Check Members page in demo mode | Should show demo members (including James Whitfield, Pamela Ulrich, etc.). Health scores should be populated. | P0 | [ ] |
| DEMO-04 | Revenue in demo | Check Revenue page in demo mode | Should show service gap analysis with demo dollar amounts. Scenario sliders should work. | P0 | [ ] |
| DEMO-05 | Board Report in demo | Check Board Report in demo mode | Should show demo metrics (14 members saved, $168K protected, etc.). | P0 | [ ] |
| DEMO-06 | All pages load without errors | Click through all 7 nav items in demo mode | No page should show an error, blank screen, or "No data" message. Console should have no JavaScript errors. | P0 | [ ] |

---

### 4.2 REAL CLUB LIVE DATA

*Run these logged in as the pilot club.*

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| LIVE-01 | Today shows real data | Check Today page | Health hero shows real tier counts (not demo values). Actions count reflects real pending actions. Complaints show real complaints (or empty if none). | P0 | [ ] |
| LIVE-02 | Members shows real data | Check Members page | Real member names appear. Health scores are computed. Archetypes are assigned. | P0 | [ ] |
| LIVE-03 | Revenue shows real or empty | Check Revenue page | If dining data exists: shows real service gap analysis. If no dining data: shows graceful empty state or CTA to connect POS. | P0 | [ ] |
| LIVE-04 | Insights shows real or CTA | Check Insights page | If correlations exist: shows real correlation cards. If insufficient data: shows CTA to connect more systems. | P1 | [ ] |
| LIVE-05 | Actions shows real queue | Check Actions page | Inbox shows actions generated from real member data (or empty if none yet). Templates tab shows available playbook templates. | P1 | [ ] |
| LIVE-06 | Board Report shows real metrics | Check Board Report | Shows real (even if early/small) numbers for members saved, dues protected, etc. If no actions have been taken yet, should show zeros gracefully (not demo data). | P1 | [ ] |
| LIVE-07 | Admin shows real connections | Check Admin > Data Health | Should reflect actual connected systems with real sync timestamps. | P1 | [ ] |
| LIVE-08 | No demo data crossover | Navigate through all pages | Zero instances of "Oakmont Hills", "James Whitfield", "Pamela Ulrich", "Sarah Mitchell", or January 2026 demo dates. | P0 | [ ] |

---

### 4.3 MODE SWITCHING

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| SWITCH-01 | Switch from demo to real | Start in demo mode, then switch to real club | All pages should update to real data. No demo data remnants. | P0 | [ ] |
| SWITCH-02 | Switch from real to demo | Start with real club, switch to demo mode | All pages should show demo data. No real member data visible. | P0 | [ ] |
| SWITCH-03 | No stale data on switch | After switching, check Members page | Member list should completely refresh (not mix old and new data). | P1 | [ ] |
| SWITCH-04 | No console errors on switch | Open browser console (F12), switch modes | No JavaScript errors should appear during or after the switch. | P1 | [ ] |

---

### Phase 4 Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|------------|--------|--------|---------|
| Demo Regression | 6 | | | |
| Real Club Live Data | 8 | | | |
| Mode Switching | 4 | | | |
| **TOTAL** | **18** | | | |

**Phase 4 Pass Criteria:** All P0 tests pass. Both demo and real club modes work independently. No data crossover between modes.

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# PHASE 5 QA: LANDING PAGE & MESSAGING FIX

## Prerequisites
- Landing page has been updated with corrected messaging hierarchy

## Environment
- **URL:** Production URL landing page (before login)
- **Browsers:** Chrome, Safari, Mobile Safari, Mobile Chrome

---

### 5.1 LANDING PAGE MESSAGING

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| MSG-01 | Hero leads with "See It" | Load the landing page. Read the first headline and subtext. | First visible message should be about visibility/seeing what your systems are hiding. NOT about board proof or ROI. | P0 | [ ] |
| MSG-02 | Correct section order | Scroll through the landing page | Feature sections should appear in this order: See It (visibility/health scores) > Fix It (cockpit/actions) > Prove It (board report/ROI) | P0 | [ ] |
| MSG-03 | No "churn prediction" lead | Read all headlines and subheads | Primary messaging should NOT lead with "churn prediction", "AI-powered retention", or "predict who will leave". These can appear as supporting details but not as headlines. | P1 | [ ] |
| MSG-04 | No "autonomous AI" messaging | Read all feature descriptions | No prominent mention of "autonomous agents", "auto-execute", or "AI decides for you". Manual control should be the default message. | P1 | [ ] |
| MSG-05 | Integration section present | Scroll to find integrations section | Should show integration chips (POS, Tee Sheet, CRM, etc.) with "Works with everything you already use" framing. Should emphasize "layer on, not rip-and-replace." | P1 | [ ] |
| MSG-06 | GM quotes present | Look for testimonial/quote section | Should show real GM quotes from surveys (e.g., "I can feel when we're off, but I can't prove it until it's too late.") | P2 | [ ] |
| MSG-07 | CTA is clear | Find the primary call-to-action button | Should say something like "See What Your Systems Are Hiding" or "Book a Demo". NOT "Get AI Predictions" or similar. | P1 | [ ] |

---

### 5.2 LANDING PAGE DESIGN & RESPONSIVENESS

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| LP-01 | Desktop renders correctly | Load landing page on desktop (1440px+ width) | All sections visible, properly aligned, no horizontal scroll. Images/illustrations load. | P0 | [ ] |
| LP-02 | Tablet renders correctly | Resize to 768px width (or use tablet) | Layout adjusts gracefully. No overlapping elements. Text is readable. | P1 | [ ] |
| LP-03 | Mobile renders correctly | Resize to 375px width (or use phone) | Single-column layout. All sections visible. CTA buttons are tappable. Quote cards stack vertically. | P1 | [ ] |
| LP-04 | CTA links work | Click the primary CTA button | Should link to a demo booking form, email address, or the app login page. Should not be a dead link. | P0 | [ ] |
| LP-05 | Page loads quickly | Load page on mobile network (throttle to 3G in DevTools) | Page should be usable within 3 seconds. No blocking resources. | P2 | [ ] |

---

### Phase 5 Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|------------|--------|--------|---------|
| Messaging | 7 | | | |
| Design & Responsiveness | 5 | | | |
| **TOTAL** | **12** | | | |

**Phase 5 Pass Criteria:** All P0 tests pass. Messaging hierarchy is See It > Fix It > Prove It. No "churn prediction" as primary messaging.

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# PHASE 6 QA: POST-PILOT ENHANCEMENTS

## Prerequisites
- Previous phases complete
- Post-pilot features have been built (test only what has been implemented)

## Environment
- **URL:** Production URL
- **Mode:** Real club with sufficient data

---

### 6.1 SENTIMENT / NPS (If Implemented)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| SENT-01 | Sentiment on member profile | Open a member profile who has sentiment data | Should show average satisfaction (1-5 stars or numeric), last 3 ratings with timestamps, and the health modifier being applied. | P1 | [ ] |
| SENT-02 | No-data state | Open a member profile with no sentiment data | Should show "No satisfaction ratings yet" in muted text. Should NOT show zero stars or an error. | P1 | [ ] |
| SENT-03 | Health score modifier | Compare health scores before and after sentiment data is added | Members with high satisfaction (4-5) should have scores 5 points higher. Members with low satisfaction (1-2) should have scores 5 points lower. | P1 | [ ] |
| SENT-04 | Silent dissatisfaction alert | If a member has high activity but low sentiment ratings | Should trigger an alert on the Today view or Members page flagging "Silent Dissatisfaction." | P2 | [ ] |
| SENT-05 | Rating submission | Navigate to the mobile rating submission page (QR code target URL) | Should show a clean, mobile-friendly form: star rating + optional comment. Submission should succeed and appear in the member's profile. | P1 | [ ] |

---

### 6.2 INDUSTRY BENCHMARKING (If Implemented)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| BENCH-01 | Benchmarks on Board Report | Open Board Report > Summary tab | At least 3 metrics should show "Your club: X" alongside "Industry average: Y" comparison. | P1 | [ ] |
| BENCH-02 | Benchmarks are reasonable | Read the benchmark values | Industry averages should be plausible (e.g., industry churn rate 8-15%, not 90%). | P2 | [ ] |
| BENCH-03 | Benchmark API returns data | Navigate to `[URL]/api/benchmarks-live?clubId=[CLUB_ID]` | Should return JSON with industry comparison data. | P1 | [ ] |

---

### 6.3 ROLE-BASED ACCESS CONTROL (If Implemented)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| RBAC-01 | GM sees everything | Log in as GM role | All 7 nav items visible. Can approve any action. Can access all Admin tabs. | P0 | [ ] |
| RBAC-02 | Department Head has limited access | Log in as Department Head role | Can view all pages. Can approve actions in their domain only. Cannot modify Admin settings. | P1 | [ ] |
| RBAC-03 | Staff has view-only access | Log in as Staff role | Can view pages but cannot approve, dismiss, or modify anything. Action buttons should be disabled or hidden. | P1 | [ ] |
| RBAC-04 | Unauthorized action blocked | As Department Head, try to approve an action outside their domain | Should show an error or prevent the action. Should NOT silently succeed. | P1 | [ ] |

---

### 6.4 MOBILE PWA (If Implemented)

| ID | Test | Steps | Expected Result | Severity | Pass? |
|----|------|-------|----------------|----------|-------|
| PWA-01 | Install prompt appears | On mobile Chrome, visit the app URL | Browser should offer "Add to Home Screen" or show install banner. | P2 | [ ] |
| PWA-02 | Installed app opens correctly | Add to home screen, then open from home screen icon | Should open without browser chrome (address bar hidden). App should function normally. | P2 | [ ] |
| PWA-03 | Manifest is valid | Navigate to `[URL]/manifest.json` | Should return valid JSON with `name`, `short_name`, `start_url`, `icons`, `display: "standalone"`. | P2 | [ ] |

---

### Phase 6 Summary

| Area | Total Tests | Passed | Failed | Blocked | N/A (Not Implemented) |
|------|------------|--------|--------|---------|----------------------|
| Sentiment/NPS | 5 | | | | |
| Benchmarking | 3 | | | | |
| RBAC | 4 | | | | |
| Mobile PWA | 3 | | | | |
| **TOTAL** | **15** | | | | |

**Phase 6 Pass Criteria:** All implemented features pass their P0 and P1 tests. Mark unimplemented features as "N/A".

**Tested by:** _________________ **Date:** _____________ **Browser/Device:** _____________

---

# CROSS-PHASE REGRESSION CHECKLIST

**Run this after EVERY phase to catch regressions.**

| # | Check | Expected | Pass? |
|---|-------|----------|-------|
| R-01 | All 7 nav items present and clickable | Today, Members, Revenue, Insights, Actions, Board Report, Admin | [ ] |
| R-02 | No removed features visible anywhere | No Growth Pipeline, Location Intelligence, Storyboard Flows, AI Agent Command | [ ] |
| R-03 | Demo mode still works | Oakmont Hills data loads correctly in demo mode | [ ] |
| R-04 | Mobile 5-tab nav works | Bottom tabs: Today, Members, Revenue, Actions, More | [ ] |
| R-05 | No console errors on any page | Open F12 Console, click through all 7 pages | [ ] |
| R-06 | Member profile drawer opens | Click any member name | [ ] |
| R-07 | Health score hero renders | Check Today view for health score card | [ ] |
| R-08 | Actions approve/dismiss works | Approve one action, dismiss one action | [ ] |
| R-09 | Board Report has 4 tabs | Summary, Member Saves, Operational Saves, What We Learned | [ ] |
| R-10 | Admin has 5 tabs | Integrations, Data Health, CSV Import, Notifications, User Roles | [ ] |
| R-11 | "Service Gap" terminology (not "Revenue Leakage") | Check Revenue page headings | [ ] |
| R-12 | No AI Agent terminology anywhere | Scan all visible text on all pages | [ ] |

**Regression tested by:** _________________ **Date:** _____________ **Phase:** _____________

---

# BUG REPORT TEMPLATE

Use this template when reporting failures.

```
BUG ID: [Phase]-[Test ID] (e.g., P1-MEM-04)
SEVERITY: P0 / P1 / P2
SUMMARY: [One-line description]
PAGE: [Which page/section]
STEPS TO REPRODUCE:
  1.
  2.
  3.
EXPECTED RESULT: [What should happen]
ACTUAL RESULT: [What actually happened]
SCREENSHOT: [Attach or link]
BROWSER/DEVICE: [e.g., Chrome 123 on macOS, iPhone 15 Safari]
CONSOLE ERRORS: [Copy any JavaScript errors from F12 console]
URL AT TIME OF FAILURE: [Full URL including hash]
```

---

*End of QA Testing Plans. Total test cases across all phases: 158.*
