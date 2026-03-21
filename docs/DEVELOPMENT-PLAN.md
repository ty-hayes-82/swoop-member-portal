# SWOOP GOLF — PHASED DEVELOPMENT PLAN

**From Current State to Market-Ready Product | Sprint-by-Sprint Execution Plan**

Last Updated: March 21, 2026
Status: Active — Sprint 1 In Progress
Assumption: 2-week sprints, 2-3 engineers + 1 designer

> **Note:** PostgreSQL database is already provisioned and operational. Vercel Postgres is in use with existing schema for members, feedback, engagement, and other tables. The frontend demo environment at swoop-member-portal.vercel.app is live with static fallback data. This plan focuses on wiring real data through existing infrastructure and building the backend execution layer.

---

## PLAN OVERVIEW

| Phase | Sprints | Weeks | Goal |
|-------|---------|-------|------|
| **Phase 1 — Launch Blockers** | 1-6 | 1-12 | Real data flowing, real health scores computing, real actions executing. One pilot club live. |
| **Phase 2 — Operator Adoption** | 7-10 | 13-20 | Daily GM usage, team adoption, retention after first sale. |
| **Phase 3 — Differentiation** | 11-14 | 21-28 | Category-defining. Competitive moat. Expansion revenue. |

---

## PHASE 1 — LAUNCH BLOCKERS (Sprints 1-6)

**Goal:** Real data flowing, real health scores computing, real actions executing. One pilot club live.

---

### Sprint 1 (Weeks 1-2): Database Foundation & First Integration

**Theme:** Wire existing Postgres infrastructure and connect the first data source.

#### Backend Infrastructure
- [x] Design core data models on existing Postgres: `members`, `rounds`, `transactions`, `complaints`, `health_scores`, `actions`, `interventions` — **DONE: `api/migrations/001-core-tables.js`**
- [ ] Build authentication layer with role-based access (GM, Assistant GM, F&B Director, Head Pro, Membership Director, Controller, View Only)
- [x] Set up API framework — **Vercel serverless functions already in use, extended with new endpoints**
- [ ] Deploy staging environment with CI/CD pipeline — **Vercel auto-deploy is operational (dev branch → dev URL)**
- [ ] Create tenant provisioning flow for onboarding new clubs

#### First Integration: CRM/Membership System
- [ ] Build Jonas Club API connector (member profiles, dues, tenure, household data) — **BLOCKED: Needs Jonas API credentials from pilot club**
- [ ] Implement nightly data sync job with error handling and retry logic
- [ ] Map Jonas fields to Swoop member schema (name, email, phone, join date, membership type, annual dues, family members)
- [x] Build CSV import pipeline as fallback for clubs without API access — **DONE: `api/import-csv.js` with validation, error tracking, upsert logic**
- [ ] Validate: 300+ member records imported with profiles, dues amounts, and membership types populated

#### New APIs Built
- `api/migrations/001-core-tables.js` — Idempotent migration creating 11 core tables + 9 indexes
- `api/import-csv.js` — CSV import endpoint for members, rounds, transactions, complaints with row-level validation
- `api/sync-status.js` — Data sync status dashboard API (latest sync per source, member count, import history)

#### Acceptance Criteria
- [x] Database schema designed with all core tables — **Migration ready to deploy**
- [x] API framework deployed to staging — **Vercel serverless operational**
- [ ] Real member data from one pilot club imported and viewable in All Members tab
- [x] CSV import works end-to-end with validation errors surfaced to user — **API built, needs frontend wiring**

#### Blockers Requiring Ty
- **Pilot club selection** — Need a signed design partner agreement
- **Jonas Club API credentials** — Need documentation and API keys from pilot club's CRM vendor
- **Run migration** — Deploy `api/migrations/001-core-tables.js` to create tables in production Postgres
- **Email domain verification** — Start SPF/DKIM setup for Sprint 4 email sending (SendGrid/Postmark account needed)

---

### Sprint 2 (Weeks 3-4): Tee Sheet + POS Integrations

**Theme:** Connect the two remaining critical data sources to enable cross-domain intelligence.

#### Tee Sheet Integration (ForeTees)
- [ ] Build ForeTees API connector (rounds, tee times, cancellations, no-shows, pace data)
- [ ] Implement data sync: booking history, cancellation patterns, round frequency per member
- [ ] Map tee sheet data to member activity model (`rounds_played`, `last_round_date`, `preferred_times`, `cancellation_rate`, `pace_of_play`)
- [ ] Build waitlist data ingestion for the Waitlist & Tee Sheet tab

#### POS Integration (Jonas/Northstar/Toast)
- [ ] Build POS API connector for pilot club's system (checks, covers, item-level detail, staff attribution)
- [ ] Map POS data to member spend model (`dining_frequency`, `avg_check`, `post_round_dining_rate`, `outlet_mix`)
- [ ] Build F&B transaction ingestion with member attribution (match POS ticket to member via account number)
- [ ] Implement CSV fallback for POS data import using existing template

#### Acceptance Criteria
- [ ] Three data sources connected for pilot club (CRM + Tee Sheet + POS)
- [ ] Member records enriched with round history and dining spend
- [ ] Data syncs nightly without manual intervention
- [ ] Connected Systems page shows real sync timestamps

---

### Sprint 3 (Weeks 5-6): Health Score Engine

**Theme:** Build the core intelligence layer that powers every dashboard in the product.

- [ ] Implement health score algorithm: weighted composite of Golf Engagement (30%), Dining Frequency (25%), Email Engagement (25%), Event Attendance (20%)
- [ ] Build score computation job that runs after each data sync and stores historical scores
- [ ] Implement member archetype classification engine (Die-Hard Golfer, Social Butterfly, Balanced Active, Weekend Warrior, Declining, New Member, Ghost, Snowbird) based on behavioral patterns
- [ ] Build health tier assignment logic: Healthy (67+), Watch (45-66), At Risk (25-44), Critical (0-24)
- [ ] Create health score change detection: flag members whose score dropped 10+ points in 30 days
- [ ] Build the "First Domino Alert" detection: identify members showing earliest decay signal across email open rates declining while other metrics hold
- [ ] Wire health scores to Members > At-Risk tab with real computed data
- [ ] Wire health tier counts to the dashboard cards
- [ ] Build archetype filter logic for All Members and Insights tabs
- [ ] Implement the Resignation Sequence model: average timeline from first signal to resignation based on historical club data

#### Acceptance Criteria
- [ ] Every member has a computed health score based on real data
- [ ] Scores update when new data syncs
- [ ] Members page shows real names, real scores, real archetypes
- [ ] At-Risk tab ranks members by actual risk
- [ ] Health score breakdown (4 dimensions) reflects real engagement data in member snapshot sidebar

---

### Sprint 4 (Weeks 7-8): Action Execution Layer

**Theme:** Make the "last mile" work. When a GM clicks an action, something real happens.

- [ ] Integrate email sending via SendGrid or Postmark: wire "Send via email" and "Draft personal note" to actually deliver emails
- [ ] Build email template system: personal notes, recovery outreach, event invites, re-engagement messages with club branding
- [ ] Integrate SMS sending via Twilio: wire "Send SMS" quick action to deliver text messages
- [ ] Build staff notification system: when GM assigns action to staff, notify via email with member context and recommended action
- [ ] Wire "Schedule a call" to create a tracked task assigned to specific staff member with due date and member profile link
- [ ] Wire "Approve" button on pending actions to execute the proposed action (send email, create task, flag record)
- [ ] Wire "Dismiss" button to log the dismissal with optional reason in Activity History
- [ ] Build action confirmation dialogs: show member name, action type, and impact estimate before executing
- [ ] Implement toast notifications for all completed actions
- [ ] Wire all action executions to Activity History with timestamps, actor, and action type

#### Acceptance Criteria
- [ ] GM clicks "Send via email" and member receives the email within 2 minutes
- [ ] GM clicks "Approve" on a pending action and the assigned staff member receives a notification
- [ ] Every action logs to Activity History with real timestamps
- [ ] Confirmation dialogs appear before irreversible actions
- [ ] Toast notifications confirm completion

---

### Sprint 5 (Weeks 9-10): Today Page + Revenue Dashboards Wired to Real Data

**Theme:** Replace all hardcoded data on the Today page and Revenue & Operations page with computed, real-time values.

#### Today Page
- [ ] Wire "Real-Time Cockpit" to computed data: new at-risk members, new complaints, actions completed, health movements since last visit
- [ ] Build "Since your last visit" detection using session timestamps
- [ ] Wire complaint alert banner to real complaint data from CRM/POS with aging timer
- [ ] Build Pending Actions feed from the rules engine: surface actions based on health score changes, complaints, cancellations, waitlist openings
- [ ] Wire Revenue Snapshot to computed totals from real data
- [ ] Wire Week-Over-Week Trends to computed comparisons from real transaction and round data
- [ ] Build "Prove It: Recent Interventions" section from tracked action outcomes

#### Revenue & Operations Page
- [ ] Wire Total Revenue Opportunity to computed values from real data across all four categories
- [ ] Build revenue leakage detection: identify pace-of-play impact on post-round dining using real tee sheet + POS data
- [ ] Wire Scenario Modeling sliders to recalculate projections based on actual club baselines (not hardcoded)
- [ ] Wire Spend Potential by Archetype to real member spend data with computed untapped revenue
- [ ] Wire Bottleneck Holes analysis to real pace-of-play data from tee sheet
- [ ] Build Top 5 Actions to Capture Revenue from rules engine based on actual opportunity sizing

#### Acceptance Criteria
- [ ] Today page loads with real data reflecting overnight changes
- [ ] Revenue page shows computed opportunity from real club data
- [ ] Scenario sliders recalculate from actual baselines
- [ ] No hardcoded values remain on either page
- [ ] GM can open the product in the morning and see what actually changed since yesterday

---

### Sprint 6 (Weeks 11-12): Outcome Tracking + Mobile + Pilot Launch

**Theme:** Close the proof loop and get the pilot club live.

- [ ] Build outcome tracking engine: after an intervention, monitor member's subsequent behavior (tee time bookings, dining visits, email opens) for 30-60 days
- [ ] Implement "Member Save" detection: if an at-risk member's health score improves after intervention, auto-flag as a save with evidence chain
- [ ] Wire Board Report to real tracked data: Members Saved, Dues Protected, Revenue Recovered
- [ ] Build ROI calculator from real investment (subscription + staff time) vs. real returns (protected dues + recovered revenue)
- [ ] Verify mobile experience at `/#/m` works with real data (already built, needs data validation)
- [ ] Implement Print/Export for Today's Briefing and Board Report as clean PDFs
- [ ] QA full end-to-end flow: data ingestion → health score computation → risk alert surfaced → action approved → email sent → outcome tracked → board report updated
- [ ] Deploy production environment for pilot club
- [ ] Conduct pilot club onboarding: connect systems, import data, calibrate health scores, train GM and department heads

#### Acceptance Criteria (Phase 1 Exit)
- [ ] Pilot club is live with real data on all pages
- [ ] Full signal-to-proof loop works end-to-end
- [ ] Board Report generates from real tracked outcomes
- [ ] Today page is usable on mobile with real data
- [ ] Product is demonstrable to prospects using a real live club (with permission) instead of demo environment
- [ ] **Product is sellable**

---

## PHASE 2 — OPERATOR ADOPTION (Sprints 7-10)

**Goal:** Make the product reliable enough that the GM and their team use it daily without prompting. Drive retention after the first sale.

---

### Sprint 7 (Weeks 13-14): Notifications + Alerts System

- [ ] Build morning briefing email: daily digest sent to GM at configured time with top 3 priorities, new at-risk members, and pending action count
- [ ] Implement push notification system for high-priority alerts (new critical member, complaint aging past SLA, cancellation spike)
- [ ] Build escalation engine: if a pending action goes unreviewed for 24/48/72 hours, escalate via notification with increasing urgency
- [ ] Wire Admin > Notifications settings to actually configure channels (email, SMS, Slack) per user role
- [ ] Build complaint SLA tracking: timer starts when complaint is logged, alerts when approaching and exceeding response window
- [ ] Implement digest frequency settings: daily, twice-daily, or real-time per user preference
- [ ] Build Slack integration for clubs that use Slack (incoming webhook for alerts and action notifications)

---

### Sprint 8 (Weeks 15-16): Insights Engine + Correlation Analytics

- [ ] Build correlation engine: compute actual relationships between touchpoints and retention from real club data
- [ ] Wire Members > Insights tab to computed correlations with real multipliers and percentages
- [ ] Build touchpoint ranking algorithm: order by correlation strength to retention, not hardcoded
- [ ] Compute real Recommended Actions from correlation findings
- [ ] Wire Deep Dive sections (Touchpoints, Complaints, Event ROI) to real analytics
- [ ] Build "Your Club vs. Industry" benchmarks using available industry data
- [ ] Implement Insights filter by archetype and health tier using real data

---

### Sprint 9 (Weeks 17-18): Multi-Club Architecture + Second Club Onboarding

- [ ] Validate multi-tenant data isolation: ensure no data leaks between clubs
- [ ] Build club onboarding wizard: guided setup flow (connect systems, map fields, import data, invite team, configure notifications)
- [ ] Build second integration connector if pilot club 2 uses different systems
- [ ] Add health score calibration tool: allow GM to review initial scores and flag misclassifications
- [ ] Build data quality dashboard: show sync health, missing data gaps, and stale records per source
- [ ] Onboard second pilot club end-to-end
- [ ] Implement club profile and brand voice configuration: club name, logo, communication tone

---

### Sprint 10 (Weeks 19-20): Playbooks Engine + Staff Workflows

- [ ] Build playbook execution engine: "Activate Playbook" creates a sequenced action plan with steps, owners, and deadlines
- [ ] Wire Response Plans to trigger automatically from health score changes and complaint events
- [ ] Build staff task queue: department heads see assigned actions filtered by role
- [ ] Implement action tracking: mark steps as completed, track time-to-completion, measure outcomes per playbook
- [ ] Build playbook effectiveness tracking: which playbooks have the highest save rate and ROI
- [ ] Implement search functionality for actions, playbooks, and agent proposals
- [ ] Build staff notes persistence: wire "Add a quick staff note" in member snapshot to save and display

#### Phase 2 Exit Criteria
- [ ] Two clubs live and using the product daily
- [ ] GM receives morning briefing without logging in
- [ ] Staff members receive and act on assigned tasks
- [ ] Playbooks execute as multi-step sequences
- [ ] Insights tab shows real computed correlations
- [ ] All notification channels configured and working
- [ ] Product drives daily engagement without sales team prompting usage

---

## PHASE 3 — DIFFERENTIATION (Sprints 11-14)

**Goal:** Elevate the product to category-defining. Build competitive moats that make Swoop irreplaceable.

---

### Sprint 11 (Weeks 21-22): Predictive Churn Model + AI-Drafted Communications

- [ ] Train ML churn prediction model on accumulated club data: predict resignation probability within 30/60/90 days with confidence intervals
- [ ] Replace rules-based health scoring with ML-powered risk assessment for clubs with 6+ months of data
- [ ] Integrate LLM (Claude) for personalized outreach drafting: generate unique messages per member using their activity history, preferences, and complaint history
- [ ] Build message tone configuration: match outreach to club's brand voice
- [ ] Implement A/B testing framework for outreach messages: track which approaches drive highest re-engagement
- [ ] Build churn probability display in member snapshot: "73% probability of resignation within 90 days" with contributing factors

---

### Sprint 12 (Weeks 23-24): Autonomous Agent Actions

- [ ] Build autonomous action framework: agents execute pre-approved low-risk actions without GM approval (e.g., auto-route waitlist slots to retention-priority members)
- [ ] Implement agent confidence scoring: only auto-execute when confidence exceeds configured threshold
- [ ] Build Thought Log viewer: show agent reasoning chain for each proposed and executed action
- [ ] Implement agent learning loop: agents improve proposal quality based on GM approval/dismissal patterns
- [ ] Build agent configuration UI: set boundaries, confidence thresholds, and auto-approval rules per agent
- [ ] Wire Demand Optimizer agent to real tee sheet data
- [ ] Wire Member Pulse agent to real health score data

---

### Sprint 13 (Weeks 25-26): Benchmarking Network + Additional Integrations

- [ ] Build anonymized cross-club benchmarking: aggregate metrics across all Swoop clubs
- [ ] Replace static industry averages with live network data on Board Report
- [ ] Build email marketing integration (Mailchimp, Constant Contact): ingest open rates, click rates, engagement per member
- [ ] Build events/calendar integration: ingest event attendance, RSVP data, participation patterns
- [ ] Build ADP/labor integration: ingest staffing schedules and clock data for labor optimization
- [ ] Build weather API integration: correlate weather patterns with cancellation risk and dining behavior

---

### Sprint 14 (Weeks 27-28): Polish, Scale Prep + GA Launch

- [ ] Build self-serve onboarding: new clubs sign up, connect systems, and go live without engineering involvement
- [ ] Performance optimization: all pages load in under 2 seconds, data syncs complete within 30 minutes
- [ ] Build audit logging and security compliance for enterprise sales (SOC 2 prep)
- [ ] Implement billing system integration: wire Admin > Billing to Stripe subscription management
- [ ] Build customer success tooling: internal dashboard showing club health, feature adoption, and churn risk per customer
- [ ] Stress test with 10+ clubs running simultaneously
- [ ] Create sales enablement package: case studies from pilot clubs, demo script, ROI calculator, objection handling guide
- [ ] Simplify AI Agents UI: consolidate 6 agents into single "Swoop Intelligence" engine for v1 GA unless agent-level granularity is requested
- [ ] Remove or gate features that add complexity without near-term value: Demand Intelligence sub-tab, Fill Reporting sub-tab, customizable outreach priority ordering
- [ ] Final QA pass across all pages, all roles, all device sizes

#### Phase 3 Exit Criteria
- [ ] Product is generally available
- [ ] New clubs can onboard without engineering
- [ ] AI agents running autonomously for low-risk actions
- [ ] Churn prediction model outperforms rules-based scoring
- [ ] Benchmarking network is live across all clubs
- [ ] Sales team has case studies, ROI proof, and a repeatable demo
- [ ] **Product is category-defining**

---

## SPRINT SUMMARY

### Phase 1 — LAUNCH BLOCKERS (12 weeks)

| Sprint | Weeks | Focus | Milestone |
|--------|-------|-------|-----------|
| 1 | 1-2 | Database Foundation + CRM Integration | Real member data in system |
| 2 | 3-4 | Tee Sheet + POS Integrations | Three data sources connected |
| 3 | 5-6 | Health Score Engine | Real health scores computing |
| 4 | 7-8 | Action Execution Layer | Actions send real emails/notifications |
| 5 | 9-10 | Today + Revenue Dashboards Wired | No hardcoded data remains |
| 6 | 11-12 | Outcome Tracking + Mobile + Pilot Launch | **First club LIVE** |

### Phase 2 — OPERATOR ADOPTION (8 weeks)

| Sprint | Weeks | Focus | Milestone |
|--------|-------|-------|-----------|
| 7 | 13-14 | Notifications + Alerts | Morning briefing emails, escalation engine |
| 8 | 15-16 | Insights Engine + Correlations | Real computed analytics |
| 9 | 17-18 | Multi-Club + Second Onboarding | Two clubs live |
| 10 | 19-20 | Playbooks Engine + Staff Workflows | Playbooks execute as sequences |

### Phase 3 — DIFFERENTIATION (8 weeks)

| Sprint | Weeks | Focus | Milestone |
|--------|-------|-------|-----------|
| 11 | 21-22 | Predictive Churn + AI Comms | ML-powered predictions, LLM drafts |
| 12 | 23-24 | Autonomous Agents | Agents auto-execute low-risk actions |
| 13 | 25-26 | Benchmarking Network + Integrations | Cross-club benchmarks live |
| 14 | 27-28 | Polish + GA Launch | Self-serve onboarding, **product GA** |

---

## KEY DEPENDENCIES & RISKS

### Pre-Sprint 1
- **Pilot Club Secured:** Must have a signed design partner agreement with a club willing to provide API access or CSV exports. Without real data, none of this plan works.

### Sprint 1-2 Blockers
- **API Access from Vendors:** ForeTees, Jonas Club, and the club's POS system must provide API documentation and credentials. CSV import path is the critical fallback — already designed in the product UI but needs backend pipeline.

### Sprint 4 Dependency
- **Email/SMS Deliverability:** Sending emails on behalf of a club requires domain verification, SPF/DKIM setup, and warm-up to avoid spam filters. Start this process in Sprint 1 even though email sending ships in Sprint 4.

### Sprint 3 Risk
- **Health Score Validation:** The health score algorithm will produce initial scores that may not match the GM's intuition. Plan for a 1-2 week calibration period where the GM reviews scores and provides feedback before going live.

### Sprint 6 Consideration
- **Mobile Readiness:** The mobile experience at `/#/m` is already built and recently polished to A-grade quality. Verify it works correctly with real data during Sprint 6 QA. If responsive web is insufficient for daily GM use, evaluate native mobile app timeline.

---

## CURRENT STATE REFERENCE

### What Already Exists (Frontend — Demo Environment)
- Full desktop dashboard with Today, Members, Revenue, Playbooks, Board Report
- Mobile experience at `/#/m` with Today, Actions, Members, Settings
- Static fallback data for all features
- API hydration layer that attempts real Postgres → falls back to static
- Vercel deployment (prod: `main` branch, dev: `dev` branch)
- Existing Postgres tables: `members`, `feedback`, `member_engagement_weekly`, and others

### What Needs to Be Built (This Plan)
- Real vendor integrations (CRM, Tee Sheet, POS)
- Health score computation engine (currently procedural/random)
- Action execution layer (emails, SMS, notifications)
- Outcome tracking and ROI measurement
- Multi-tenant architecture for multiple clubs
- Notification/alerting system
- Playbook execution engine
- ML churn prediction
- Autonomous agent framework
