# Swoop Golf — Data Model Reference

**Vercel PostgreSQL** | 75 Tables | 15 Domains
**Jonas Club Software Mapped** | Swoop Computed Fields Identified

> This directory contains the complete Swoop data model broken out by domain.
> Each file documents every table, column, type, constraint, Jonas CMS source mapping,
> and extraction method for that domain.

---

## Domain Index

| # | Domain | File | Tables | Description |
|---|--------|------|--------|-------------|
| 1 | [Club Reference](./01-club-reference.md) | `01-club-reference.md` | 4 | Multi-tenant root: club, courses, dining outlets, membership tiers |
| 2 | [Members](./02-members.md) | `02-members.md` | 3 | Core member records, households, billing/invoices |
| 3 | [Golf Operations](./03-golf-operations.md) | `03-golf-operations.md` | 6 | Bookings, players, pace of play, rounds, waitlist entries |
| 4 | [Food & Beverage](./04-food-and-beverage.md) | `04-food-and-beverage.md` | 4 | POS checks, line items, payments, production transactions |
| 5 | [Events & Communications](./05-events-and-communications.md) | `05-events-and-communications.md` | 4 | Event definitions, registrations, email campaigns, email events |
| 6 | [Service & Staffing](./06-service-and-staffing.md) | `06-service-and-staffing.md` | 6 | Feedback, service requests, complaints, staff, shifts, sentiment |
| 7 | [Operations & Metrics](./07-operations-and-metrics.md) | `07-operations-and-metrics.md` | 7 | Close-outs, canonical events, engagement rollups, visits, weather, health scores |
| 8 | [Waitlist & Demand](./08-waitlist-and-demand.md) | `08-waitlist-and-demand.md` | 5 | Waitlist, cancellation risk, demand heatmap, churn predictions |
| 9 | [Board Report & Cockpit](./09-board-report-and-cockpit.md) | `09-board-report-and-cockpit.md` | 5 | Executive snapshots, member/operational interventions, user sessions |
| 10 | [Experience Insights](./10-experience-insights.md) | `10-experience-insights.md` | 5 | Correlations, insights, event ROI, archetype spend gaps |
| 11 | [AI Agents](./11-ai-agents.md) | `11-ai-agents.md` | 5 | Agent definitions, actions, activity, configs |
| 12 | [Location Intelligence](./12-location-intelligence.md) | `12-location-intelligence.md` | 3 | Real-time member/staff location, service recovery alerts |
| 13 | [Tee Sheet Operations](./13-tee-sheet-operations.md) | `13-tee-sheet-operations.md` | 3 | Booking confirmations, slot reassignments, waitlist config |
| 14 | [Integrations & Benchmarks](./14-integrations-and-benchmarks.md) | `14-integrations-and-benchmarks.md` | 5 | Connected systems, benchmarks, data syncs, CSV imports, source status |
| 15 | [Platform, Auth & System](./15-platform-auth-and-system.md) | `15-platform-auth-and-system.md` | 11 | Users, sessions, notifications, playbooks, onboarding, feature mgmt, activity log |

---

## Domain Map

```
 CLUB REFERENCE            MEMBERS                  GOLF OPERATIONS
 ┌──────────────┐    ┌───────────────────┐    ┌──────────────────────┐
 │ club         │◄───│ members           │───►│ bookings             │
 │ courses      │    │ households        │    │ booking_players      │
 │ dining_      │    │ membership_types  │    │ pace_of_play         │
 │   outlets    │    │ member_invoices   │    │ pace_hole_segments   │
 └──────────────┘    └───────────────────┘    │ waitlist_entries     │
                                              │ rounds               │
                                              └──────────────────────┘

 FOOD & BEVERAGE           EVENTS & COMMS            SERVICE & STAFFING
 ┌──────────────────┐    ┌───────────────────┐    ┌────────────────────────┐
 │ pos_checks       │    │ event_definitions │    │ feedback               │
 │ pos_line_items   │    │ event_            │    │ service_requests       │
 │ pos_payments     │    │   registrations   │    │ complaints             │
 │ transactions     │    │ email_campaigns   │    │ staff                  │
 └──────────────────┘    │ email_events      │    │ staff_shifts           │
                         └───────────────────┘    │ member_sentiment_      │
                                                  │   ratings              │
                                                  └────────────────────────┘

 OPERATIONS & METRICS              WAITLIST & DEMAND
 ┌───────────────────────────┐    ┌──────────────────────────┐
 │ close_outs                │    │ waitlist_entries          │
 │ canonical_events          │    │ member_waitlist           │
 │ member_engagement_daily   │    │ cancellation_risk         │
 │ member_engagement_weekly  │    │ demand_heatmap            │
 │ visit_sessions            │    │ churn_predictions         │
 │ weather_daily             │    └──────────────────────────┘
 │ health_scores             │
 └───────────────────────────┘

 BOARD REPORT & COCKPIT           EXPERIENCE INSIGHTS
 ┌───────────────────────────┐    ┌──────────────────────────┐
 │ board_report_snapshots    │    │ experience_correlations   │
 │ member_interventions      │    │ correlation_insights      │
 │ operational_interventions │    │ correlations              │
 │ interventions             │    │ event_roi_metrics         │
 │ user_sessions             │    │ archetype_spend_gaps      │
 └───────────────────────────┘    └──────────────────────────┘

 AI AGENTS                        LOCATION INTELLIGENCE
 ┌───────────────────────────┐    ┌──────────────────────────┐
 │ agent_definitions         │    │ member_location_current   │
 │ agent_actions             │    │ staff_location_current    │
 │ actions                   │    │ service_recovery_alerts   │
 │ agent_activity            │    └──────────────────────────┘
 │ agent_configs             │
 └───────────────────────────┘

 TEE SHEET OPERATIONS             INTEGRATIONS & BENCHMARKS
 ┌───────────────────────────┐    ┌──────────────────────────┐
 │ booking_confirmations     │    │ connected_systems         │
 │ slot_reassignments        │    │ industry_benchmarks       │
 │ waitlist_config           │    │ data_source_status        │
 └───────────────────────────┘    │ data_syncs               │
                                  │ csv_imports               │
                                  └──────────────────────────┘

 PLATFORM, AUTH & SYSTEM
 ┌───────────────────────────┐
 │ users         sessions    │
 │ notifications  notif_     │
 │   preferences             │
 │ playbook_runs  playbook_  │
 │   steps                   │
 │ onboarding_progress       │
 │ feature_dependency        │
 │ feature_state_log         │
 │ pause_state               │
 │ activity_log              │
 └───────────────────────────┘
```

---

## Legend

| Abbreviation | Meaning |
|---|---|
| **PK** | Primary Key |
| **FK** | Foreign Key |
| **JCM** | Jonas Club Management (core member/AR/billing module) |
| **POS** | Jonas Point of Sale module |
| **TTM** | Jonas Tee Time Management module |
| **JAM** | Jonas Activity Management (events/banquets/spa/courts) |
| **CHO** | ClubHouse Online (website/email marketing module) |
| **MF** | MetricsFirst (Jonas BI/analytics add-on) |
| **MI** | MemberInsight (Jonas survey/feedback add-on) |
| **CA** | Club Automation (Jonas scheduled task engine) |
| **SV** | Smart Viewer export (Excel/CSV from any Jonas report) |
| **F9** | F9 Lister (ad-hoc field-level report builder) |
| **RG** | Club Report Generator (custom report builder) |

---

## Source Systems Summary

| Source | Tables Fed | Integration Type |
|--------|-----------|-----------------|
| **Jonas Club Management (JCM)** | club, members, households, membership_types, feedback, complaints | API / CSV / F9 / SV |
| **Jonas Tee Time Mgmt (TTM)** | courses, bookings, booking_players, waitlist_entries, rounds | API / SV |
| **Jonas POS** | dining_outlets, pos_checks, pos_line_items, pos_payments, transactions | API / SV |
| **Jonas Activity Mgmt (JAM)** | event_definitions, event_registrations | SV / CA |
| **ClubHouse Online (CHO)** | email_campaigns, email_events | API / SV |
| **Scheduling** (ADP / 7shifts / Paylocity) | staff, staff_shifts | API / CSV |
| **Weather API** | weather_daily | Automated daily |
| **Swoop App** (GPS/Mobile) | member_location_current, service_requests, visit_sessions | Real-time |
| **Swoop ML/Analytics** | health_scores, churn_predictions, cancellation_risk, demand_heatmap, correlations | Computed |
| **Dashboard UI** | activity_log, agent_actions, booking_confirmations | User actions |

---

## Row Counts (Demo Environment)

| Table | Rows | Table | Rows |
|-------|------|-------|------|
| members | 300 | staff_shifts | ~800 |
| bookings | ~4,000 | weather_daily | 31 |
| booking_players | ~12,000 | close_outs | 31 |
| pos_checks | ~5,000 | agent_actions | ~12 |
| pos_line_items | ~15,000 | activity_log | 17+ |
| member_engagement_daily | 9,300 | member_invoices | ~1,800 |
| member_engagement_weekly | 1,500 | All other tables | 5-100 |
| email_events | ~8,000 | | |

---

## Schema Files

| File | Purpose |
|------|---------|
| `seed/schema.sql` | Complete DDL (75 tables) — run once against Vercel Postgres |
| `src/data/schema/vercelPostgresSchema.js` | Frontend schema introspection (75 tables with sample rows) |
| `api/migrations/001-core-tables.js` | Production table creation (idempotent) |
| `api/migrations/002-alter-members.js` | Adds production columns to seed members table |
| `api/migrations/014-member-invoices-table.js` | Creates `member_invoices` table (run via `npm run db:migrate`) |
