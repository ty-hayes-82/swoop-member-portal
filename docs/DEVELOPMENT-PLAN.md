# SWOOP GOLF — DEVELOPMENT PLAN

**From Current State to Market-Ready Product**

Last Updated: March 21, 2026
Status: Backend APIs + frontend wiring COMPLETE (12/12). Vendor integrations and pilot launch remaining.

---

## WHAT'S BUILT

All 15 backend API endpoints are built and deployed to dev. The frontend demo environment is live with static fallback data. The mobile experience is polished to A-grade.

### Backend APIs (Complete)

| API | Purpose |
|-----|---------|
| `api/migrations/001-core-tables.js` | 11 core tables + 9 indexes (ready to deploy) |
| `api/auth.js` | Token-based auth with 7-role RBAC |
| `api/import-csv.js` | CSV import for members, rounds, transactions, complaints |
| `api/sync-status.js` | Data sync monitoring dashboard |
| `api/compute-health-scores.js` | 4-dimension health scoring + archetype classification |
| `api/execute-action.js` | Email/SMS/task/call/comp execution with templates |
| `api/dashboard-live.js` | Live dashboard data replacing all hardcoded values |
| `api/track-outcomes.js` | Intervention outcome tracking + Member Save detection |
| `api/notifications.js` | Morning digest, escalation engine, SLA breach detection |
| `api/compute-correlations.js` | 5 cross-domain correlations from real data |
| `api/onboard-club.js` | 9-step club onboarding wizard |
| `api/execute-playbook.js` | Sequenced playbook execution with step tracking |
| `api/predict-churn.js` | 30/60/90 day churn probability with risk factors |
| `api/agent-autonomous.js` | 6 autonomous agents with auto-execute framework |
| `api/benchmarks-live.js` | Live club vs network vs industry benchmarking |

### Frontend (Complete)
- Desktop: Today, Members, Revenue, Playbooks (restructured), Board Report, Admin
- Mobile (`/#/m`): Today, Actions, Members, Settings — all A-grade
- Playbooks & Automation: merged tabs, contextual guides, action library, outcome indicators

---

## WHAT REMAINS

Work is organized into 4 tracks that can run in parallel.

---

### TRACK 1: Infrastructure (Ty-Dependent)

These items require external accounts, credentials, or decisions. Nothing else can proceed to "real data" without them.

| # | Item | What's Needed | Who |
|---|------|---------------|-----|
| 1 | **Run database migration** | Hit `POST /api/migrations/001-core-tables` on production to create tables | Ty |
| 2 | **Secure pilot club** | Signed design partner agreement with one club willing to share data | Ty |
| 3 | **Jonas Club API credentials** | API docs + keys from pilot club's CRM vendor | Ty + Pilot Club |
| 4 | **ForeTees API credentials** | API docs + keys for tee sheet integration | Ty + Pilot Club |
| 5 | **POS system API credentials** | API docs + keys (Jonas POS, Northstar, or Toast) | Ty + Pilot Club |
| 6 | **SendGrid or Postmark account** | For sending emails on behalf of clubs. Start domain verification (SPF/DKIM) immediately — takes 1-2 weeks to warm up | Ty |
| 7 | **Twilio account** | For sending SMS from quick actions and notifications | Ty |
| 8 | **Stripe account** | For billing integration (Sprint 14, but setup takes time) | Ty |

**Critical path:** Items 1-2 are the gate. Once the migration runs and a pilot club is secured, everything else unblocks.

### Ty's Step-by-Step Todo List

**Do these in order. Each step unlocks the next.**

#### Step 1: Run the database migration (5 minutes)
1. Open browser to `https://swoop-member-portal-dev.vercel.app/api/migrations/001-core-tables`
2. Use a REST client (Postman, curl, or browser extension) to send a `POST` request to that URL
3. Verify response shows `"status": "ok"` for all 11 tables and 9 indexes
4. If any errors, screenshot and share — likely a permissions issue

#### Step 2: Create a SendGrid account (15 minutes)
1. Go to https://sendgrid.com and create a free account (100 emails/day free tier)
2. In SendGrid dashboard: Settings → API Keys → Create API Key (Full Access)
3. Copy the API key — save it securely
4. In Vercel project settings (https://vercel.com/tyhayesswoopgolfcos-projects/swoop-member-portal/settings/environment-variables):
   - Add environment variable: `SENDGRID_API_KEY` = your API key
   - Add for both Production and Preview environments
5. Settings → Sender Authentication → Authenticate a domain
   - Add the domain you want to send from (e.g., `swoopgolf.com` or the pilot club's domain)
   - Follow the DNS record instructions (add CNAME records)
   - This takes 24-48 hours to verify — **start this now**

#### Step 3: Create a Twilio account (15 minutes)
1. Go to https://twilio.com and create a free trial account
2. Get a phone number (Twilio will assign one during setup)
3. In Twilio console, note your: Account SID, Auth Token, and Phone Number
4. In Vercel project settings, add environment variables:
   - `TWILIO_ACCOUNT_SID` = your Account SID
   - `TWILIO_AUTH_TOKEN` = your Auth Token
   - `TWILIO_PHONE_NUMBER` = your Twilio phone number (e.g., +1234567890)

#### Step 4: Secure a pilot club (timeline varies)
1. Reach out to your best candidate club — ideally one you have a relationship with
2. What you need from them:
   - Permission to connect their CRM, tee sheet, and POS data
   - A primary contact (GM or IT person) who can provide system access
   - Their CRM vendor name (Jonas Club Software? Clubessential? Other?)
   - Their tee sheet vendor name (ForeTees? Club Prophet? Other?)
   - Their POS vendor name (Jonas? Northstar? Toast? Other?)
3. Offer: "We'll set up everything for free during the pilot. You get the full platform at no cost for 90 days."
4. Get a simple email confirmation — doesn't need to be a formal contract for a design partner

#### Step 5: Get vendor API credentials (depends on pilot club)
For each vendor (CRM, Tee Sheet, POS):
1. Ask the pilot club's GM to contact their vendor and request API access for Swoop Golf
2. Alternatively, ask the club's IT contact to provide:
   - API documentation URL
   - API key or OAuth client credentials
   - Sandbox/test environment access (if available)
3. **If API access is slow or denied:** Ask the club to export CSV files instead:
   - Member roster (name, email, phone, membership type, dues, join date)
   - Round history (member name/ID, date, tee time, course)
   - Dining transactions (member name/ID, date, amount, outlet)
   - The CSV import API is already built and will handle this

#### Step 6: Create a Stripe account (15 minutes, not urgent)
1. Go to https://stripe.com and create an account
2. In Stripe dashboard, get your API keys (test mode first)
3. Add to Vercel environment variables:
   - `STRIPE_SECRET_KEY` = your secret key
   - `STRIPE_PUBLISHABLE_KEY` = your publishable key
4. This is for billing integration — not needed until closer to GA

#### Step 7: First data import (once pilot club is secured)
1. If CSV route: Upload member CSV to `POST /api/import-csv` with `importType: "members"` and `clubId` from Step 4
2. If API route: Share vendor credentials with Claude to build the connector
3. Verify: Navigate to All Members tab — you should see real member names and data

#### Step 8: Go live
1. Run health scores: `POST /api/compute-health-scores?clubId=YOUR_CLUB_ID`
2. Run churn predictions: `POST /api/predict-churn?clubId=YOUR_CLUB_ID`
3. Run correlations: `POST /api/compute-correlations?clubId=YOUR_CLUB_ID`
4. Review the product — every page should show real data
5. Invite the GM and train them on the morning workflow

---

### TRACK 2: Vendor Integration Connectors

Build once pilot club credentials are available. Each connector follows the same pattern: authenticate → fetch data → map to Swoop schema → upsert into Postgres → log sync status.

| # | Connector | Data It Provides | Blocked On |
|---|-----------|-----------------|------------|
| 1 | **Jonas Club CRM** | Member profiles, dues, tenure, household data, complaints | Jonas API credentials |
| 2 | **ForeTees Tee Sheet** | Rounds, tee times, cancellations, no-shows, pace data, waitlist | ForeTees API credentials |
| 3 | **POS (Jonas/Northstar/Toast)** | Dining transactions, covers, item-level detail, staff attribution | POS API credentials |
| 4 | **Nightly sync scheduler** | Cron job that runs all connectors + triggers health score recomputation | Connectors 1-3 built |
| 5 | **SendGrid email sending** | Wire `api/execute-action.js` email execution to actually deliver | SendGrid account |
| 6 | **Twilio SMS sending** | Wire `api/execute-action.js` SMS execution to actually deliver | Twilio account |

**Fallback:** CSV import (`api/import-csv.js`) is already built and works for any data source. If API access is slow, the pilot club can go live on CSV imports while connectors are built.

---

### TRACK 3: Frontend Wiring

Switch the frontend from static fallback data to live API responses. The service layer (`src/services/`) already has an `_init()` hydration pattern — each service fetches from `/api/*` and falls back to static data. The APIs are built; the services need to consume them.

| # | Frontend Change | Status |
|---|----------------|--------|
| 1 | **Members page → real health scores** | **DONE** — `memberService._init()` fetches `/api/dashboard-live`, overrides static summary with live data |
| 2 | **Today dashboard → real data** | **DONE** — WeekOverWeekGrid and RecentInterventions now consume `getLiveDashboard()` with static fallback |
| 3 | **Health score breakdown → real dimensions** | **DONE** — `HealthDimensionGrid` uses real `golfScore/diningScore/emailScore/eventScore` from profile, falls back to archetype-weighted deterministic values (no more Math.random) |
| 4 | **Actions → real execution** | **DONE** — `AppContext.approveAction()` now fires `POST /api/execute-action` alongside localStorage dispatch |
| 5 | **Insights → real correlations** | **DONE** — `experienceInsightsService._init()` fetches from `/api/compute-correlations`, overrides static correlation data |
| 6 | **Board Report → real outcomes** | **DONE** — `boardReportService` fetches from `/api/dashboard-live` + `/api/benchmarks-live`, exports `getLiveBenchmarks()` and `getLiveROI()` |
| 7 | **Playbooks → real execution** | **DONE** — Activate button fires `POST /api/execute-playbook` with playbook steps, owners, and due dates |
| 8 | **Notifications → real delivery** | **DONE** — `NotificationFeed.jsx` component consuming `/api/notifications`, with mark-read, mark-all-read, priority badges, time-ago |
| 9 | **Churn predictions → member profile** | **DONE** — `ChurnPredictionBadge` component fetches from `/api/predict-churn`, shows 30/60/90 day risk with factors |
| 10 | **Agent config → real settings** | **DONE** — AgentsTab Configure fires `POST /api/agent-autonomous` with threshold and auto-approve settings |
| 11 | **Onboarding wizard UI** | **DONE** — `OnboardingWizard.jsx` with 9-step progress, consuming `api/onboard-club.js` |
| 12 | **Auth → real login** | **DONE** — `AuthContext.jsx` with login/logout/session validation, `useAuth()` hook |

**12 of 12 COMPLETE.** All frontend components are wired to live APIs with static fallbacks. The product will automatically switch from demo data to real data when `swoop_club_id` is set in localStorage and the APIs return data.

---

### TRACK 4: Pilot Club Launch Sequence

Once real data is flowing (Tracks 1-2 complete), execute this sequence to go live:

| Step | Action | Duration | Acceptance |
|------|--------|----------|------------|
| 1 | Import member data (CSV or API) | 1 day | 300+ members visible in All Members tab |
| 2 | Import round history (CSV or API) | 1 day | Round frequency visible per member |
| 3 | Import dining transactions (CSV or API) | 1 day | Dining spend visible per member |
| 4 | Run health score computation | 1 hour | Every member has a score, tier, and archetype |
| 5 | GM reviews initial scores | 2-3 days | GM flags obvious misclassifications; recalibrate thresholds if needed |
| 6 | Run churn predictions | 1 hour | Every member has 30/60/90 day resignation probability |
| 7 | Run correlation engine | 1 hour | Insights tab shows real computed correlations |
| 8 | Invite GM + department heads | 1 day | Users created with appropriate roles |
| 9 | Configure notifications | 1 hour | Morning digest time, channels, escalation preferences |
| 10 | Run autonomous agent cycle | 1 hour | Inbox populated with AI-generated actions from real data |
| 11 | GM approves first actions | 1 day | First emails/tasks sent; interventions logged |
| 12 | Monitor outcomes for 7+ days | 7 days | At least 1 "Member Save" detected and surfaced in Board Report |
| 13 | **Declare pilot live** | — | Full signal-to-proof loop working end-to-end |

---

## PLAYBOOKS & AUTOMATION — AUDIT ROADMAP

From the independent Playbooks & Automations module audit (March 21, 2026). Current ratings: Layer-3 Alignment B+, ROI Story A-, Buyer Confidence B.

### Short-Term (0-3 months) — Ship Before or During Pilot

| ID | Improvement | Effort | Impact | Status |
|----|------------|--------|--------|--------|
| S1 | **Playbook Performance Summary panel** — Aggregated stats (total activated, approval rate, cumulative impact, outcome success) at top of Playbooks tab | Low | High | **DONE** |
| S2 | **ROI methodology disclosure** — "How is this calculated?" tooltip on every dollar-impact figure explaining inputs (member dues, save rate, archetype weighting, confidence) | Low | High | **DONE** |
| S3 | **Functional search** — Cross-tab filtering across playbook templates, inbox actions, AI agents, and action library with highlighted matches | Low-Med | Medium | **DONE** |
| S4 | **Pause/Resume toggle** — For Response Plans and AI agents, with optional scheduled resume date. Needed for tournament weeks and seasonal transitions | Low | Medium | TODO — agent toggle exists, needs scheduled resume |

### Mid-Term (3-6 months) — Ship for Operator Adoption

| ID | Improvement | Effort | Impact | Status |
|----|------------|--------|--------|--------|
| M1 | **Automation Dashboard** — Board-ready single page: coverage %, actions by week, approval rate by agent, cumulative protected revenue (actual vs projected), top playbooks by outcome | Medium | Very High | **DONE** — `AutomationDashboard.jsx` + nav route |
| M2 | **Role-based access control** — GM/Owner (full), Department Head (approve own domain, view-only others), Staff (view-only). RBAC already in `api/auth.js` with 7 roles | Medium | High | Auth API built, enforcement needs app shell integration |
| M3 | **Audit log** — Every approve, dismiss, activate, configure, edit with timestamp, user, before/after state. Activity tracking already in `activityService.js` | Medium | High | Tracking exists, viewer in Activity History page |
| M4 | **Experience-Outcome Links playbook** — "Service Quality Impact Analysis" proving complaint resolution → spend, event attendance → renewal, interaction quality → dining. Fills weakest Layer-3 pillar | Medium | High | Correlations API computes these; Insights tab displays them |
| M5 | **Notification management panel** — Per-agent channel toggles, batch delivery windows (morning digest at 7 AM), priority-only alerting, escalation rules. `api/notifications.js` has preferences table | Medium | Med-High | **DONE** — `NotificationSettings.jsx` |

### Long-Term (6-12 months) — Ship for Differentiation

| ID | Improvement | Effort | Impact | Status |
|----|------------|--------|--------|--------|
| L1 | **A/B testing for playbooks** — Treatment/control group split, run for N weeks, statistically valid results. Converts observational track records into causal evidence | High | Very High | TODO |
| L2 | **Playbook versioning + rollback** — Version history for every archetype playbook, response plan, and agent config. Diff view + "Restore this version" | Med-High | Medium | TODO |
| L3 | **Pace-of-Play Revenue Playbook** — Integrates round-time data with tee-sheet utilization and F&B capture to model revenue impact of pace improvements. Addresses explicit Layer-3 gap | High | Medium | TODO |

### Noise to Address

| ID | Issue | Action |
|----|-------|--------|
| N1 | Service Save Protocol appears in both Response Plans and Playbook Templates | **DONE** — Added distinct descriptions: Response Plans = "auto-triggered protocols", Templates = "step-by-step guides you activate manually" |
| N2 | Archetype Playbooks vs Playbook Templates relationship unclear | **DONE** — Added dismissible relationship explainer + per-section descriptions + tooltips on sub-tab buttons |
| N3 | "See this in action" flows take vertical space on repeat visits | **DONE** — Already collapsed; guide uses localStorage to auto-dismiss after first view |
| N4 | Action Library sub-tab duplicates embedded action list in Archetype Playbooks | Standalone version has channel/timing/effectiveness data that embedded does not — distinction is now clearer with section descriptions |

### Audit KPIs to Track

**Operational Efficiency:** Time from signal detection to GM decision (<4 hrs target), inbox processing time (<15 min target), actions processed within 24 hrs (90%+ target)

**Retention Impact:** At-risk members retained per quarter, annualized dues protected, churn rate with vs without playbook coverage

**Revenue Impact:** Incremental revenue from revenue playbooks, dining capture rate from Dormancy Recovery (0% → 15%+ target), tee-sheet utilization on active playbook days

**Adoption & Trust:** Approve-to-dismiss ratio by agent (3:1+ target), active playbooks as % of templates, agent active-vs-idle ratio trending up, repeat activation rate

---

## POST-LAUNCH REMAINING ITEMS

Items that enhance the product but are not required for pilot launch:

| Item | Priority | Notes |
|------|----------|-------|
| ML churn model upgrade (replace rules-based v1) | After 6 months data | `api/predict-churn.js` already supports `model_version` field for switchover |
| LLM-drafted communications (Claude integration) | Post-pilot | Wire to `api/execute-action.js` email templates — generate personalized messages per member |
| A/B testing for outreach messages | Post-pilot | Track open/click rates per template variant |
| Agent learning loop (improve from GM approval patterns) | Post-pilot | Log approval/dismissal patterns, adjust proposal weights |
| Slack integration for notifications | When requested | `api/notifications.js` has slack_webhook field ready |
| Email marketing integration (Mailchimp/Constant Contact) | Sprint 13+ | Ingest open rates per member for email health score dimension |
| Events/calendar integration | Sprint 13+ | Ingest attendance for event health score dimension |
| ADP/labor integration | Sprint 13+ | Staffing data for labor optimization features |
| Weather API integration | Sprint 13+ | Cancellation risk correlation |
| Self-serve onboarding UI | Pre-GA | `api/onboard-club.js` API is built; needs frontend wizard |
| Stripe billing integration | Pre-GA | Wire Admin > Billing to Stripe subscription management |
| SOC 2 audit prep | Pre-GA | Audit logging, access controls, data encryption review |
| Sales enablement package | Pre-GA | Case studies from pilot, demo script, ROI calculator |

---

## KEY RISKS

| Risk | Mitigation |
|------|-----------|
| Pilot club vendor denies API access | CSV import fallback is built and operational |
| Health scores don't match GM intuition | 2-3 day calibration period built into launch sequence; threshold adjustment tools planned |
| Email deliverability issues (spam) | Start domain verification and warm-up immediately — 2 week lead time |
| Mobile experience breaks with real data | Mobile is built with the same service layer; verify during launch Step 5 |
| Scale issues with 300+ members | Health score computation is per-member sequential; batch if needed for 1000+ |
