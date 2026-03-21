# SWOOP GOLF — DEVELOPMENT PLAN

**From Current State to Market-Ready Product**

Last Updated: March 21, 2026
Status: Backend APIs complete. Frontend wiring, vendor integrations, and pilot launch remaining.

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

| # | Frontend Change | Files | API It Consumes |
|---|----------------|-------|-----------------|
| 1 | **Members page → real health scores** | `memberService.js`, `HealthOverview.jsx`, `MembersView.jsx` | `api/dashboard-live.js`, `api/compute-health-scores.js` |
| 2 | **Today dashboard → real data** | `TodayView.jsx`, `RevenueSummaryCard.jsx`, `WeekOverWeekGrid.jsx`, `RecentInterventions.jsx` | `api/dashboard-live.js` |
| 3 | **Health score breakdown → real dimensions** | `MemberProfileDrawer.jsx` (lines 474-494) | Replace random Math with real `golf_score`, `dining_score`, `email_score`, `event_score` from `health_scores` table |
| 4 | **Actions → real execution** | `AgentActionCard.jsx`, `InboxTab.jsx` | Wire Approve button to `api/execute-action.js` instead of just updating localStorage |
| 5 | **Insights → real correlations** | `CorrelationsTab.jsx`, `TouchpointsTab.jsx` | `api/compute-correlations.js` |
| 6 | **Board Report → real outcomes** | `BoardReport.jsx`, `boardReportService.js` | `api/track-outcomes.js`, `api/benchmarks-live.js` |
| 7 | **Playbooks → real execution** | `PlaybooksPage.jsx`, `MemberPlaybooks.jsx` | Wire "Activate" to `api/execute-playbook.js` |
| 8 | **Notifications → real delivery** | New: notification bell feed, morning digest display | `api/notifications.js` |
| 9 | **Churn predictions → member profile** | `MemberProfileDrawer.jsx` | Add "73% resignation risk" from `api/predict-churn.js` |
| 10 | **Agent config → real settings** | `AgentsTab.jsx`, `AgentConfigDrawer` | Wire Configure to `api/agent-autonomous.js` agent_configs |
| 11 | **Onboarding wizard UI** | New component in Admin section | `api/onboard-club.js` |
| 12 | **Auth → real login** | New login page, session context provider | `api/auth.js` |

**No blockers.** This track can start immediately and run in parallel with vendor integrations.

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
