# Swoop Golf Five Lenses Platform — Production Readiness Plan

**Date:** April 3, 2026
**Branch:** `production-readiness-plan` (from `dev`)
**Author:** Engineering Audit (Director-level assessment)
**Status:** Prototype → Production gap analysis

---

## Executive Summary

The Swoop Golf Five Lenses Platform is a cross-domain intelligence portal for private club General Managers. The current deployment is a **functional prototype** simulating Oakmont Hills Country Club (300 members, 2 courses, 5 dining outlets, 45 staff, January 2026). The V3 product audit and realignment work is **substantially complete** — navigation restructured, pages simplified, messaging pivoted from retention-first to operations-first, and 24 dead feature folders deleted.

**What's real:** The frontend architecture, story-first UI pattern, service layer abstraction, health score computation, CSV import framework, onboarding endpoint, and canonical event linker are all implemented — not stubs.

**What's not real:** Authentication (accepts any password), tenant isolation (most API endpoints unfiltered), the data pipeline (CSV backend doesn't write to target tables), and the connection between frontend mock data and the Postgres schema.

**Bottom line:** This is 60-70% of the way to a concierge MVP for the first paying club. The architecture is sound. The remaining 30-40% is plumbing, security, and the unglamorous work of making real data flow through the system.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Mock Data to Real Data Translation Layer](#2-mock-data-to-real-data-translation-layer)
3. [Customer Onboarding Flow](#3-customer-onboarding-flow)
4. [Multi-Tenancy & Infrastructure](#4-multi-tenancy--infrastructure)
5. [What "Production-Ready" Actually Means](#5-what-production-ready-actually-means)
6. [Testing & Validation Strategy](#6-testing--validation-strategy)
7. [Go-Live Roadmap](#7-go-live-roadmap)
8. [Top 5 Things to Fix This Week](#8-top-5-things-to-fix-this-week)

---

## 1. Current State Audit

### 1.1 V3 Realignment Completion Status

| Phase | Description | Status | Evidence |
|-------|-------------|--------|----------|
| **Phase 1** | Navigation Restructure + Service Page | **Complete** | 5 nav items in `src/config/navigation.js`; Service page with 3 tabs at `src/features/service/` |
| **Phase 2** | Simplify Existing Pages | **Complete** | Members 6→3 tabs, Board Report 4→2 tabs, Admin 5→2 tabs. ROI projections removed from UI. |
| **Phase 3** | Playbooks & Actions Simplification | **Partial** | 3 playbooks visible (Service Save, 90-Day Integration, Staffing Adjustment) but 10 additional hidden playbooks still in `src/features/playbooks/PlaybooksPage.jsx`. Actions moved to drawer. |
| **Phase 4** | Messaging & Framing Realignment | **Partial** | Customer-facing headlines are operations-first. Section 9 Rule enforced. But data/service layer still has retention-centric language in `src/services/experienceInsightsService.js` and `src/data/outreach.js`. |
| **Phase 5** | Code Cleanup | **Complete** | 24 feature folders deleted (exceeding the 17 planned). Zero TODO/FIXME/HACK comments in `src/`. App.jsx clean. |
| **Phase 6** | Post-MVP Features | **Not started** | Correctly gated behind pilot validation. |

**Assessment:** Phases 1, 2, and 5 are fully shipped. Phases 3 and 4 are 80% complete — the structural work is done but some internal language cleanup remains. Phase 6 is correctly deferred.

### 1.2 Data File Inventory

Every file in `src/data/` with its downstream consumer and vendor mapping:

| Data File | Records | Service Consumer | Feature Consumer | Real-World Vendor Source |
|-----------|---------|-----------------|-----------------|------------------------|
| `agents.js` | 6 agents, 12 actions | `agentService.js` | ActionsDrawer, MemberProfileDrawer | Internal (Swoop Agent System) |
| `benchmarks.js` | 6 KPI comparisons | (inline in boardReportService) | BoardReport | Industry aggregates |
| `boardReport.js` | 19 records (4 arrays) | `boardReportService.js` | BoardReport, RecoveryTab | Aggregated from all systems |
| `cockpit.js` | 3 priority items | `cockpitService.js` | TodayView | Aggregated (cross-domain) |
| `combinations.js` | 14 integration pairs | (inline usage) | IntegrationsPage | Internal config |
| `email.js` | 37 records | `memberService.js` | EmailTab, ArchetypeTab | Club Prophet / Mailchimp |
| `integrations.js` | 30 systems, 6 combos | `integrationsService.js` | IntegrationsPage | Internal config |
| `location.js` | 65 entries | `locationService.js` | **ORPHANED** (no feature) | GPS/WiFi (future) |
| `members.js` | 41 records + 5 profiles | `memberService.js`, `experienceInsightsService.js` | MembersView, MemberProfile, TodayView | Northstar CRM |
| `onlySwoopAngles.js` | 9 perspectives | **ORPHANED** (no service) | **ORPHANED** | N/A — dead code |
| `outlets.js` | 17 records | `fbService.js` | (via other services) | Jonas POS / Toast |
| `outreach.js` | 28 actions + 8 playbooks | (direct localStorage) | PlaybooksPage, MemberProfile | Internal config |
| `pace.js` | 16 records | `operationsService.js` | (via briefingService) | ForeTees |
| `pipeline.js` | 64 entries | `pipelineService.js`, `waitlistService.js`, `briefingService.js` | TodayView (via briefing) | Northstar + ForeTees |
| `revenue.js` | 32 records | `operationsService.js`, `waitlistService.js` | (via briefingService) | Jonas POS |
| `staffing.js` | 20 records | `staffingService.js` | (via briefingService) | ClubReady / ADP |
| `teeSheetOps.js` | 49 records | `teeSheetOpsService.js` | **ORPHANED** (no feature) | ForeTees |
| `trends.js` | 60 data points | `trendsService.js` | TrendChart, TrendContext | Aggregated |
| `weather.js` | 31 daily entries | (inline usage) | TodayView | Weather API |
| `schema/vercelPostgresSchema.js` | DDL definitions | (reference only) | AdminHub | N/A — schema config |

**Orphaned data files (3):**
- `onlySwoopAngles.js` — not imported by any service. Dead code, safe to delete.
- `location.js` — consumed by `locationService.js` but that service has zero feature consumers.
- `teeSheetOps.js` — consumed by `teeSheetOpsService.js` but that service has zero feature consumers.

**Orphaned services (4):**
- `locationService.js` — no feature imports it
- `teeSheetOpsService.js` — no feature imports it
- `pipelineService.js` — no feature imports it (data used via `waitlistService` instead)
- `fbService.js` — no direct feature imports (consumed indirectly)

### 1.3 Data Flow Rule Compliance

**Result: CLEAN.** Zero violations found. No component or feature file imports directly from `src/data/`. All data access flows through `src/services/`. The Phase 2 API swap pattern is intact.

### 1.4 Deleted Feature Folders

The 17+ folders slated for Phase 5 Sprint 5.1 deletion have been deleted. In total, **24 feature folders** were removed:

`actions/`, `activity-history/`, `agent-command/`, `automation-dashboard/`, `csv-import/`, `daily-briefing/`, `data-model/`, `demo-mode/`, `experience-insights/`, `fb-performance/`, `growth-pipeline/`, `landing-redirect/`, `location-intelligence/`, `member-profile/` (old), `notification-settings/`, `onboarding/`, `operations/`, `outreach-playbooks/`, `pipeline/`, `revenue/`, `revenue-leakage/`, `staffing-service/`, `storyboard-flows/`, `waitlist-demand/`

**14 active feature folders remain:** today, service, members, board-report, admin, member-health (tabs reused by MembersView), member-profile, playbooks, integrations, login, landing, data-health.

### 1.5 Temp Files

- `temp-check-tables.js` — **Deleted** (not in repo)
- `temp-seed-empty-tables.mjs` — **Deleted** (not in repo)

### 1.6 Build Status

**Build succeeds** (979 modules, ~12 seconds).

| Issue | Severity | Detail |
|-------|----------|--------|
| Oversized dashboard chunk | Medium | `dashboard-CjRBRe1w.js` at **924 KB** (gzip 275 KB). Needs code-splitting. |
| Oversized vendor chunk | Low | `vendor-BIt1-r4J.js` at 525 KB (gzip 151 KB). React + Recharts. |
| xlsx import conflict | Low | Dynamic import in `NewClubSetup.jsx` vs static in `csvImportService.js`. Cosmetic warning. |
| 1 failing test | Medium | `memberService.test.js` expects `critical.count = 12` but gets `26`. Stale test assertion. |

**No build errors. No TypeScript (pure JS project).**

### 1.7 Security Issues

| Issue | Severity | File | Detail |
|-------|----------|------|--------|
| **Password bypass** | **Critical** | `api/auth.js` | Comment: "TODO: Remove this bypass before production launch" — accepts ANY password if no hash stored |
| **Hardcoded DB credentials** | **Critical** | `scripts/reseed-pipeline-leads.mjs:3` | Neon connection string with password as fallback value |
| **No auth middleware** | **High** | All `api/*.js` endpoints | Protected routes don't validate Bearer tokens |
| **No .env.example** | Medium | Project root | `.env.local` is gitignored but no template for new developers |
| **Env var mismatch** | Low | `api/agents/draft.js` et al | Code references `ANTHROPIC_API_KEY` but env has lowercase `anthropic` |

### 1.8 Cosmetic Components (Look functional, aren't wired)

| Component | File | Status |
|-----------|------|--------|
| IntegrationMap (radial SVG) | `src/features/integrations/IntegrationMap.jsx` | **Orphaned.** Has `onSelectSystem` handler but is never rendered. IntegrationsPage uses vendor grid instead. |
| UnifiedExperienceMap | `src/components/ui/UnifiedExperienceMap.jsx` | **Cosmetic.** SVG diagram, display-only. |
| TwoLayerDiagram | `src/components/ui/TwoLayerDiagram.jsx` | **Cosmetic.** Data flow diagram, display-only. |
| OnlySwoopModule | `src/components/ui/OnlySwoopModule.jsx` | **Cosmetic.** Feature showcase text, no interaction. |
| AgentThoughtLog | `src/components/ui/AgentThoughtLog.jsx` | **Display-only.** Renders reasoning but no actual agent backend. |
| "Request Integration" button | `src/features/integrations/IntegrationsPage.jsx:408` | **alert() only** — no API call. |

**Agent System assessment:** `AgentActionCard` and `AgentStatusCard` ARE wired with callbacks (approve/dismiss/toggle) and render in `ActionsDrawer`. The agent actions themselves come from mock data (`src/data/agents.js`), but the UI interaction pattern is real. The agent _backend_ (`api/agents/draft.js`, `api/agents/explain.js`, `api/agents/sweep.js`) calls Anthropic's API — this is real but would need the env var fix and proper gating.

### 1.9 Section 9 Rule Compliance

**COMPLIANT.** Primary navigation uses customer-friendly labels:
- Today, Service, Members, Board Report, Admin

No customer-facing references to "Operator's Lens", "Economic Buyer", "Member Retention Lens", "Labor & Service Lens", or "Growth Pipeline Lens." Lens names appear only in internal theme color tokens (`lensMemberIntelligence`, `lensStaffingLabor` in the theme config) — acceptable for internal use.

### 1.10 Mobile App

A mobile app shell exists at `src/mobile/` with 4 screens matching the spec:
- `CockpitScreen.jsx` (Cockpit)
- `ActionInboxScreen.jsx` (Actions)
- `MemberLookupScreen.jsx` (Member Lookup)
- `SettingsScreen.jsx` (Settings)

Routed via `#/m` and `#/m/*`. Status unknown — needs separate audit for production readiness.

---

## 2. Mock Data to Real Data Translation Layer

### 2.1 Phase 2 Swap Pattern Assessment

The architecture defines that only `src/services/*.js` files change when swapping mock data for real API calls. **This contract is clean.** Zero components import from `src/data/` directly.

Every service file already has the `_init()` async pattern:
```javascript
export async function _init() {
  // Attempt API call → fall back to static data
}
```

The swap involves: (1) updating `_init()` to call the corresponding `/api/` endpoint, (2) the API endpoint queries Postgres, (3) the service transforms the response to match the current data shape. The frontend components never change.

### 2.2 Vendor Attribution Map

Based on `seed/linkers/canonical.py` and the Jonas field mapping work:

| Data Domain | Mock File | Postgres Tables | Primary Vendor | Mapping Status |
|-------------|-----------|----------------|----------------|----------------|
| Members & Profiles | `members.js` | `members`, `households`, `membership_types` | **Northstar CRM** | Jonas mapping done (447 rows). Northstar TBD. |
| Golf Bookings | `teeSheetOps.js`, `pace.js` | `bookings`, `booking_players`, `pace_of_play`, `pace_hole_segments` | **ForeTees** | Canonical linker maps ForeTees. Field mapping **not done.** |
| POS / F&B | `outlets.js`, `revenue.js` | `pos_checks`, `pos_line_items`, `pos_payments`, `close_outs` | **Jonas POS** | Jonas mapping done. Activity Category codes (S/D/B/C/A/G/M/O/R/F/E) documented. |
| Events & Email | `email.js` | `event_definitions`, `event_registrations`, `email_campaigns`, `email_events` | **Club Prophet** | Canonical linker maps Club Prophet. Field mapping **not done.** |
| Feedback & Service | `staffing.js` | `feedback`, `service_requests`, `service_recovery_alerts` | **Northstar** | Canonical linker maps Northstar. Field mapping **not done.** |
| Staffing | `staffing.js` | `staff`, `staff_shifts` | **ClubReady / ADP** | Canonical linker maps ClubReady. Field mapping **not done.** |
| Waitlist & Pipeline | `pipeline.js` | `waitlist_entries` | **ForeTees** | Canonical linker maps ForeTees. Field mapping **not done.** |
| Weather | `weather.js` | `weather_daily` | **Weather API** | Simple API integration needed. |

**Mapping gap summary:**
- **Done:** Jonas CRM (447 rows), Jonas POS (via Activity Category)
- **Not done:** ForeTees, Northstar, Club Prophet, ClubReady, Toast, ADP, Mailchimp, Clubessential

### 2.3 CSV Import Service Assessment

**Frontend (`src/services/csvImportService.js`):** Production-quality implementation.
- 10 template categories with sample data (members, tee-times, fnb-transactions, reservations, staffing, events, complaints, email-engagement, golf-rounds, fitness-pool)
- **10 vendor alias sets** mapped: Jonas, ForeTees, Toast, ADP, Mailchimp, Lightspeed, Square, Chronogolf, ForeUP, 7shifts
- Fuzzy matching with `scoreMatch()` function (threshold 0.55)
- File parsing (CSV + XLSX via `xlsx` library)
- Row validation with type checking

**Backend (`api/import-csv.js`):** Partially implemented.
- Creates `csv_imports` record with metadata
- **Does NOT insert validated rows into target tables.** This is the critical gap.
- The backend receives parsed/validated data but only logs the import — no actual database writes.

**Gap to production:** ~16-24 hours of engineering to wire `api/import-csv.js` to actually INSERT rows into the correct Postgres tables based on category (members → `members` table, tee-times → `bookings` table, etc.).

### 2.4 "Dark" Columns — Schema Fields With No Mock Data

The 27-table Postgres schema has columns that the seed data may not populate. Key gaps:

| Table | Dark Columns | Impact |
|-------|-------------|--------|
| `members` | `external_id`, `secondary_phone`, `referral_source`, `notes` | Low — optional fields |
| `bookings` | `confirmation_status`, `no_show` | Medium — needed for tee sheet ops |
| `pos_checks` | `discount_total`, `void_flag` | Medium — affects revenue accuracy |
| `feedback` | `resolution_notes`, `resolved_by`, `resolved_at` | High — needed for Service page |
| `staff` | `certifications`, `availability_json` | Medium — needed for staffing intelligence |
| `weather_daily` | `uv_index`, `humidity` | Low — nice-to-have |

### 2.5 Data Ingestion Architecture Options

**Option 1: CSV Upload + Mapping UI (RECOMMENDED for Phase 1)**
- Current state: Frontend 90% done, backend 60% done
- Gap: Wire `api/import-csv.js` to write to target tables, add progress feedback, add error reporting
- Effort: **M (16-24 hours)**
- Verdict: **This is the path.** First 3-5 clubs get manually exported CSVs from Jonas/ForeTees, uploaded through our UI.

**Option 2: Jonas API Connector**
- Current state: Spec'd in V2 Dev Plan Task 3.1, not built
- Jonas uses REST API with club-specific credentials. Activity Category dropdown mapping is documented.
- Effort: **L (40-60 hours)** — API auth, endpoint mapping, error handling, retry logic, data transformation
- Verdict: P1 (within 90 days). Not needed for first paying customer.

**Option 3: Nightly Sync via Vercel Cron**
- Current state: Spec'd in V2 Dev Plan Task 3.4, not built
- Vercel Cron supports up to once/minute on Pro plan. Adequate for nightly sync.
- Effort: **M (20-30 hours)** per connector
- Verdict: Correct infrastructure choice for first 20 clubs. No need for Temporal/Airflow yet. Vercel Cron + `api/cron/sync-[vendor].js` is pragmatic. Upgrade when we need retry queues or multi-step orchestration.

---

## 3. Customer Onboarding Flow

### 3.1 Onboarding Endpoint Assessment

**`api/onboard-club.js` — EXISTS AND IS FUNCTIONAL.**

Endpoints:
- `POST /api/onboard-club` — Creates club record + admin user + initializes 9-step onboarding
- `GET /api/onboard-club?clubId=xxx` — Returns onboarding progress
- `PUT /api/onboard-club` — Marks individual steps complete

9 onboarding steps tracked:
1. `club_created` 2. `crm_connected` 3. `members_imported` (requires 300+) 4. `tee_sheet_connected` 5. `pos_connected` 6. `health_scores_computed` 7. `team_invited` 8. `notifications_configured` 9. `pilot_live`

**Gap:** Steps are marked complete via API call but not validated. Marking `crm_connected` doesn't verify a CRM connection exists. This is acceptable for concierge onboarding (we mark steps ourselves) but needs validation for self-service.

### 3.2 CSV Import for Jonas Member Roster

The Jonas field mapping (447 rows) identified specific field names. The CSV import service's `VENDOR_COLUMN_ALIASES` for Jonas includes:

```
Member # → member_id
Acct Balance → annual_dues
Join Dt → join_date
Last Name → last_name
```

**Assessment:** The alias table covers the basics but needs validation against a real Jonas CSV export. Jonas exports vary by version and club configuration. The fuzzy matching at 0.55 threshold provides a safety net for slight naming variations.

**Critical gap:** Even after CSV parsing and validation, `api/import-csv.js` doesn't write to Postgres. The pipeline is: upload CSV → parse → validate → map columns → ...nothing. The "confirm import" step needs to INSERT into the `members` table.

### 3.3 Health Score Computation

**`api/compute-health-scores.js` — REAL IMPLEMENTATION, NOT STUBBED.**

Scoring model:
- Golf Engagement: 30% weight (rounds in 90 days vs 12-round benchmark, recency penalties)
- Dining Frequency: 25% weight (visits vs benchmark, spend bonus, recency)
- Email Engagement: 25% weight (open rate vs 40% benchmark)
- Event Attendance: 20% weight (attended vs 3-event benchmark)

Tiers: Healthy (67+), Watch (45-66), At Risk (25-44), Critical (0-24)

8 archetype classifications: New Member, Ghost, Snowbird, Declining, Die-Hard Golfer, Social Butterfly, Weekend Warrior, Balanced Active.

**Risk with sparse data:** A new club with only member roster imported (no golf/dining/email data yet) will classify everyone as "Ghost" or "New Member." The algorithm needs a **"data completeness" gate** — if <2 of 4 dimensions have data, show "Insufficient data" instead of a misleading score.

### 3.4 Day 1 Experience Design

**Current state:** The app loads Oakmont Hills demo data for everyone. A real customer would see someone else's fake club.

**Recommended approach for concierge MVP:**

```
Contract signed
    ↓
Swoop team runs POST /api/onboard-club (creates club record + admin user)
    ↓
Swoop team obtains Jonas CSV export from club
    ↓
Swoop team uploads via CSV import UI (or direct DB insert)
    ↓
Swoop team runs POST /api/compute-health-scores?clubId=xxx
    ↓
GM receives login email → sees THEIR members, THEIR health scores
    ↓
Today view shows: "Welcome to Swoop, [Club Name]"
    ↓
Service + Members pages show real data
    ↓
Board Report shows "Data available after 30 days of operation"
```

**The "Demo Mode" toggle:**
- `src/features/login/LoginPage.jsx` already has a demo mode concept
- Need: a `?demo=true` query param or a Swoop-admin toggle that loads Oakmont Hills data
- Production users must NEVER see Oakmont Hills data
- Implementation: Check `club_id` on login. If `club_id === 'oakmont_hills'`, user is in demo. Otherwise, all data queries filter by their `club_id`.

---

## 4. Multi-Tenancy & Infrastructure

### 4.1 Schema-Level Tenant Isolation

**Core tables WITH `club_id`:** `club`, `courses`, `dining_outlets`, `bookings`, `waitlist_entries`, `pos_checks`, `event_definitions`, `email_campaigns`, `feedback`, `staff`, `close_outs`, `members`, `board_report_snapshots`, `member_interventions`, `activity_log`

**Tables MISSING `club_id` (requiring join-through or addition):**

| Table | Current Scoping | Fix Required |
|-------|----------------|-------------|
| `membership_types` | Shared lookup (FG/SOC/JR) | Add `club_id` — clubs have different type codes |
| `households` | No scoping | Add `club_id` — family data must be isolated |
| `weather_daily` | Date-unique only | Add `club_id` — clubs in different cities have different weather |
| `canonical_events` | No scoping | Add `club_id` — audit trail must be isolated |
| `booking_players` | Via booking FK only | Acceptable (join-through) |
| `pos_line_items`, `pos_payments` | Via check FK only | Acceptable (join-through) |
| `pace_of_play`, `pace_hole_segments` | Via course FK only | Acceptable (join-through) |
| `staff_shifts` | Via staff FK only | Add `club_id` for query efficiency |
| `service_requests` | No scoping | Add `club_id` |
| `visit_sessions` | No scoping | Add `club_id` |
| `waitlist_config` | PRIMARY KEY hardcoded 'oakmont' | Redesign with `club_id` PK |
| `connected_systems` | No scoping | Add `club_id` |
| `agent_definitions`, `agent_actions` | No scoping | Add `club_id` |

**Effort to fix:** M (20-30 hours) — migration scripts, update seed data, update API queries.

### 4.2 API-Level Tenant Isolation

**63 total API endpoints.** Of these:

- **~10 endpoints** properly filter by `club_id` parameter: `/api/auth`, `/api/onboard-club`, `/api/compute-health-scores`, `/api/agent-autonomous`, `/api/benchmarks-live`, `/api/compute-correlations`, `/api/dashboard-live`, `/api/import-csv`, `/api/pause-resume`, `/api/predict-churn`
- **~50+ endpoints** have **NO `club_id` filtering**: `/api/members`, `/api/cockpit`, `/api/briefing`, `/api/board-report`, `/api/fb`, `/api/operations`, `/api/pipeline`, `/api/notifications`, etc.

**Root cause:** The unfiltered endpoints were built during single-tenant prototype phase. They query the database without WHERE clauses on `club_id`.

**Fix:** Auth middleware that extracts `club_id` from the session token and injects it into every query. This is a systematic fix — create `api/lib/withAuth.js` middleware wrapper, apply to all endpoints.

**Effort:** M (16-24 hours) — middleware creation + retrofit all endpoints.

### 4.3 Authentication Status

**Current implementation (`api/auth.js`):**
- Token-based login (creates session in `sessions` table, 24-hour TTL)
- Returns `{token, user: {userId, clubId, name, email, role, title}, expiresAt}`
- `LoginPage.jsx` is real and functional (email/password form + demo mode)
- Test account: `sarah@oakmonthills.com` / any password

**Critical gap:** The password bypass — "if no password hash stored, accept any password." This is a `TODO: Remove this bypass before production launch` comment in the code.

**What's needed for first customer:**
1. Remove password bypass — require bcrypt hash comparison
2. Add password hashing on user creation (`api/onboard-club.js` creates users)
3. Add auth middleware to all protected API routes
4. Add password reset flow (SendGrid is already configured)

**What can wait:**
- OAuth/SSO (Phase 2)
- MFA (Phase 3)
- Session refresh tokens (Phase 2)

### 4.4 Shared Database vs Database-Per-Tenant

**Recommendation: Shared database with `club_id` tenant isolation** (the current schema design).

**Rationale:**
- First 20 clubs = ~6,000 members, ~100K bookings/year, ~200K POS transactions/year. Postgres handles this trivially.
- Vercel Postgres (Neon) supports branching for dev/staging — one database is simpler to manage.
- Row-level security (RLS) in Postgres can enforce isolation at the database level if needed.
- Database-per-tenant adds operational complexity (migrations, backups, connection pooling) that a 1-2 person team cannot manage.

**Risks to monitor:**
- Query performance once data exceeds 50 clubs (~15K members, 500K+ transactions). Add composite indexes on `(club_id, ...)` for all tenant-scoped tables.
- Noisy neighbor: one club's large data import shouldn't block another's queries. Neon's connection pooling handles this.
- Compliance: if a club demands data isolation, offer a dedicated Neon branch (same codebase, different connection string).

### 4.5 RBAC Assessment

The `users` table has a `role` column with values: `gm`, `assistant_gm`, `fb_director`, `head_pro`, `membership_director`, `controller`, `viewer`.

**Current enforcement: ZERO.** No endpoint checks user role. All authenticated users can access all data.

**Minimum viable RBAC for first customer:**

| Role | Access |
|------|--------|
| `gm` | Full access to all pages |
| `fb_director` | Service page only (F&B data) |
| `membership_director` | Members page only |
| `viewer` | Read-only all pages, no actions |
| `swoop_admin` | Cross-tenant access for support |

**Effort:** S (8-12 hours) — role check in auth middleware + conditional nav items in `src/config/navigation.js`.

---

## 5. What "Production-Ready" Actually Means

### 5.1 Priority Classification

#### P0 — Must Have Before First Paying Customer

| Item | Current State | Effort | Files to Touch |
|------|--------------|--------|----------------|
| **Remove auth password bypass** | TODO comment in code | XS (2-4 hrs) | `api/auth.js`, `api/onboard-club.js` |
| **Auth middleware for all API routes** | Not implemented | M (16-24 hrs) | New `api/lib/withAuth.js`, all 50+ `api/*.js` files |
| **Add `club_id` to missing tables** | 12+ tables need migration | M (20-30 hrs) | `seed/schema.sql`, new migration file, update API queries |
| **Wire CSV import to Postgres** | Frontend done, backend stops at logging | M (16-24 hrs) | `api/import-csv.js` |
| **Health score "data completeness" gate** | Computes scores even with no data | S (8-12 hrs) | `api/compute-health-scores.js` |
| **Today/Members/Service render real data** | Services have `_init()` stubs for API | L (30-40 hrs) | All service `_init()` functions, corresponding API endpoints |
| **Demo mode toggle** | LoginPage has demo concept | S (8-12 hrs) | `src/features/login/LoginPage.jsx`, `src/context/DataProvider.jsx` |
| **Remove hardcoded DB credentials** | In `scripts/reseed-pipeline-leads.mjs` | XS (1 hr) | `scripts/reseed-pipeline-leads.mjs` |
| **Create .env.example** | Missing | XS (1 hr) | New `.env.example` file |

**P0 total effort: ~120-160 hours (3-4 weeks at 1 engineer, 2 weeks at 2 engineers)**

#### P1 — Within 90 Days of First Customer

| Item | Current State | Effort |
|------|--------------|--------|
| **Board Report with real data** | Mock data only | M (20-30 hrs) |
| **Jonas CRM API connector** | Spec'd, not built | L (40-60 hrs) |
| **Playbook execution tracking** | UI exists, no backend persistence | M (16-24 hrs) |
| **Email notifications (SendGrid)** | API endpoints exist, partially wired | S (8-12 hrs) |
| **Password reset flow** | Not implemented | S (8-12 hrs) |
| **Code-split dashboard chunk** | 924 KB single chunk | S (4-8 hrs) |
| **Fix stale test** | memberService.test.js assertion wrong | XS (1 hr) |

**P1 total effort: ~100-150 hours**

#### P2 — Moat Builders (6+ months)

| Item | Current State | Effort |
|------|--------------|--------|
| Canonical event stream pipeline | `seed/linkers/canonical.py` exists | L (60-80 hrs) |
| Cross-domain correlation engine | `api/compute-correlations.js` exists (basic) | XL (80-120 hrs) |
| ForeTees API connector | Not started | L (40-60 hrs) |
| Toast POS connector | Not started | L (40-60 hrs) |
| Clubessential suite connector | Not started | L (40-60 hrs) |
| Mobile app production | Shell exists (4 screens) | XL (120-160 hrs) |
| Self-service onboarding wizard | Onboarding endpoint exists | L (40-60 hrs) |
| Row-level security (Postgres RLS) | Not implemented | M (20-30 hrs) |

### 5.2 T-Shirt Size Reference

| Size | Hours | Calendar (1 eng) | Calendar (2 eng) |
|------|-------|-------------------|-------------------|
| XS | 1-4 | 1 day | 1 day |
| S | 8-12 | 1-2 days | 1 day |
| M | 16-30 | 3-5 days | 2-3 days |
| L | 40-60 | 1-2 weeks | 1 week |
| XL | 80-160 | 2-4 weeks | 1-2 weeks |

### 5.3 Concierge vs Automated

**What we concierge for first 5 clubs:**
- Data onboarding: Swoop team exports Jonas CSV, uploads via our CSV UI, runs health score computation
- The Jonas mapping work (447 rows, 69 training videos) IS the concierge playbook
- Club configuration: Swoop team runs `POST /api/onboard-club` and sets up the club record
- User creation: Swoop team creates GM user with hashed password
- Support: Swoop team monitors health scores for nonsensical results, manually adjusts

**What must be automated from Day 1:**
- Auth (login/logout/session management) — GMs must log in themselves
- Health score computation — must run on data import completion (not manual trigger)
- Data rendering — once data is in Postgres, the UI must show it without manual intervention
- Demo mode — must automatically separate demo from real tenant data

---

## 6. Testing & Validation Strategy

### 6.1 Current Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/navigation.smoke.test.jsx` | 5 tests | **Pass** (with deprecation warnings) |
| `src/services/memberService.test.js` | 3 tests | **1 failing** — stale assertion on `critical.count` (expects 12, gets 26) |

**Coverage: Minimal.** Two test files covering navigation smoke and one service. No API endpoint tests, no integration tests, no E2E tests.

### 6.2 Synthetic Club Profiles

| Profile | Members | Outlets | Stack | Key Feature Exercise |
|---------|---------|---------|-------|---------------------|
| **Small 9-hole semi-private** | 150 | 1 (Grill Room) | Jonas suite (CRM + POS) | Minimal data volumes. Tests: health scores with sparse data, single-outlet F&B, no tee sheet integration. **Risk:** Many features show empty states. |
| **Mid-size private (Oakmont archetype)** | 300 | 5 | ForeTees + Jonas POS + Northstar CRM | Full feature exercise. Tests: all 5 nav pages populated, cross-domain correlations, 8 archetypes distributed. **Baseline target.** |
| **Large private, F&B emphasis** | 500 | 8 | Clubessential suite | Heavy dining minimum enforcement. Tests: outlet-level drill-down, high POS transaction volume (~15K/month), dining spend archetype correlation. **Risk:** Dashboard chunk performance with large member lists. |
| **Resort/multi-course** | 800 | 2 courses, 6 outlets | ForeTees + Toast + ADP + Mailchimp | Best-of-breed stack. Tests: multi-vendor CSV import, course-level pace analytics, large waitlist queue, email engagement from Mailchimp. **Risk:** Vendor alias conflicts in fuzzy matching. |

**Realistic data volumes per profile:**

| Metric | Small | Mid | Large | Resort |
|--------|-------|-----|-------|--------|
| Rounds/month | 400 | 1,200 | 1,800 | 4,000 |
| Covers/month | 800 | 3,000 | 6,000 | 8,000 |
| Complaints/quarter | 5 | 15 | 30 | 50 |
| Email campaigns/month | 2 | 4 | 6 | 8 |
| Staff shifts/week | 20 | 80 | 150 | 200 |

**Feature degradation by profile:**

| Feature | Small | Mid | Large | Resort |
|---------|-------|-----|-------|--------|
| Today view | Partial (no tee sheet data) | Full | Full | Full |
| Service Quality tab | Minimal (1 outlet) | Full | Full | Full |
| Service Staffing tab | Basic | Full | Full | Full |
| Members At-Risk | Sparse (few archetypes) | Full | Full | Full |
| Board Report | Limited (30-day min) | Full | Full | Full |
| Cross-domain correlations | None (single vendor) | Partial | Full | Full |
| Playbook triggers | Manual only | Partial auto | Full auto | Full auto |

### 6.3 Story Validation Testing

The StoryHeadline component renders contextual headlines with variants (urgent, warning, insight, risk). If the data says "3 members need attention" — how do we confirm it's actually 3?

**Testing contract:**

```
src/data/*.js (mock)     →  src/services/*.js (shaping)  →  src/features/*.jsx (rendering)
     ↕                              ↕                              ↕
  Known inputs              Deterministic functions           UI assertions
```

**Approach:**
1. **Service-level unit tests:** For each service function that produces a count, headline, or classification, write a test with known input data and assert the exact output. E.g., `memberService.getAtRiskMembers()` with 5 at-risk members in mock data → assert returns array of length 5.
2. **Snapshot tests for headlines:** For each StoryHeadline usage, snapshot the rendered text with known data. If the data shape changes, the snapshot breaks.
3. **Data contract tests:** Define the expected shape (TypeScript-like interfaces as JSDoc or Zod schemas) for what each service returns. Test that the shape holds regardless of input volume.

**Priority tests to write:**

| Test | Why | Effort |
|------|-----|--------|
| `memberService.getAtRiskMembers()` count matches `healthDistribution.atRisk` | Core metric displayed on Today + Members | S |
| `briefingService.getDailyBriefing()` returns correct section counts | Today view depends on these numbers | S |
| `compute-health-scores` with all-zero engagement → assigns "Ghost" archetype | Validates sparse-data behavior | S |
| `compute-health-scores` with balanced engagement → assigns "Balanced Active" | Validates happy-path classification | S |
| CSV import with real Jonas column names → maps correctly | Validates the 447-row mapping work | M |

---

## 7. Go-Live Roadmap

### Phase 1 — Concierge MVP (First 3 Clubs)

**Target:** Bowling Green CC as Club 1 (contact: Daniel Soehren)
**Engineering headcount:** 1-2
**Calendar:** 4-6 weeks from start

**Sprint 1 (Week 1-2): Security & Auth**
- Remove password bypass in `api/auth.js`
- Add bcrypt password hashing to user creation
- Create `api/lib/withAuth.js` middleware
- Apply auth middleware to all protected endpoints
- Remove hardcoded credentials from `scripts/reseed-pipeline-leads.mjs`
- Create `.env.example`

**Sprint 2 (Week 2-3): Tenant Isolation**
- Add `club_id` to 12+ tables missing it (migration script)
- Update `waitlist_config` to use `club_id` as part of primary key
- Retrofit all API endpoints to filter by `club_id` from session
- Add demo mode toggle (Oakmont Hills = demo, everything else = real)

**Sprint 3 (Week 3-4): Data Pipeline**
- Wire `api/import-csv.js` to INSERT into target Postgres tables
- Add data completeness gate to health score computation
- Test with synthetic Bowling Green CC data (150-300 members)
- Verify health score distribution makes sense

**Sprint 4 (Week 4-5): Real Data Rendering**
- Update service `_init()` functions to call live API endpoints
- Verify Today, Members, Service pages render from Postgres data
- Handle empty states gracefully (no golf data → "Connect your tee sheet to see golf analytics")
- QA pass on all 5 nav pages with real data

**Sprint 5 (Week 5-6): Polish & Launch**
- Fix the 924 KB chunk (code-split board report + member profile)
- Fix stale test assertion
- Create onboarding runbook for Swoop team
- Conduct dry run: create Bowling Green CC, import sample data, verify end-to-end
- **Go live with Bowling Green CC**

**Key milestone:** GM logs in and sees their real members with health scores.
**Biggest risk:** Health score algorithm produces nonsensical results with sparse real data. Mitigation: data completeness gate + manual review of first 50 health scores before giving GM access.
**What "done" looks like:** GM uses the platform unprompted for 2+ weeks. They reference specific member health scores or service insights in conversation with their team.

### Phase 2 — Semi-Automated (Clubs 4-20)

**Engineering headcount:** 2-3
**Calendar:** 90 days after Phase 1 launch

**Key deliverables:**
- Jonas CRM API connector (auto-sync members + POS)
- CSV import UI polished for club admins (not just Swoop team)
- Board Report with real aggregated data
- Playbook execution tracking persisted to database
- Email notifications via SendGrid (member alerts, weekly digest)
- Password reset flow
- Basic RBAC (GM full access, director scoped, viewer read-only)

**Onboarding time target:** Under 1 week from contract to live data.
**Biggest risk:** Jonas API varies by club version/configuration. May need per-club adapter config.
**What "done" looks like:** A club admin can upload their own CSV, see data appear in the portal within minutes, and the GM receives a weekly email digest.

### Phase 3 — Scale (20+ Clubs)

**Engineering headcount:** 3-5
**Calendar:** 6-12 months after launch

**Key deliverables:**
- Self-service onboarding wizard (club signs up → connects systems → sees data)
- Multiple vendor connectors (ForeTees, Toast, Clubessential)
- Canonical event stream pipeline (real-time cross-domain events)
- Cross-domain correlation engine
- Mobile app (4 screens: Cockpit, Actions, Member Lookup, Settings)
- Row-level security in Postgres
- SOC 2 compliance preparation

**Biggest risk:** Supporting 5+ PMS vendors means 5+ data transformation pipelines. The canonical event model (`seed/linkers/canonical.py`) is designed for this — but it needs to be promoted from a seed script to a production service.
**What "done" looks like:** A new club can be fully live within 24 hours of connecting their systems, with zero Swoop team intervention.

### 7.1 The Single Most Important Technical Decision (Next 2 Weeks)

**Decision: How to handle the mock-to-real data transition for the first club.**

**Option A: "Big Bang" — Build the full API layer, then switch all services at once.**
- Pro: Clean architecture, no hybrid state
- Con: 3-4 weeks of work before anyone sees real data
- Risk: All-or-nothing launch; if one service breaks, everything breaks

**Option B: "Progressive Hydration" — Start with members (CSV import → Postgres → memberService._init()), then add domains one at a time.**
- Pro: GM sees real member data in Week 3, golf data in Week 4, F&B in Week 5
- Con: Hybrid state where some pages show real data and others show empty states
- Risk: GM confusion if empty states aren't clearly labeled

**Recommendation: Option B (Progressive Hydration).**

The concierge model means we control the pace. Import member roster first (the Jonas CSV mapping is already done). This lights up the Members page immediately. Then add F&B data (Jonas POS export), then golf data (ForeTees export). Each domain addition is independently testable and deliverable. The Today view gracefully degrades — it only shows sections for which data exists.

The key architectural requirement: each service's `_init()` function must handle the case where its API endpoint returns no data. Return the service's "empty" state, don't fall back to Oakmont Hills mock data. This is the single line of code that separates "demo" from "production."

---

## 8. Top 5 Things to Fix This Week

These are the highest-leverage, lowest-effort items that immediately make this more credible as a real product.

### 1. Remove the Password Bypass (2 hours)

**File:** `api/auth.js`

Find the "TODO: Remove this bypass" block. Replace with proper bcrypt comparison. Update `api/onboard-club.js` to hash passwords on user creation. This is the single most embarrassing line of code if an investor reads the source.

### 2. Remove Hardcoded Database Credentials (30 minutes)

**File:** `scripts/reseed-pipeline-leads.mjs` (line 3)

The Neon connection string with password is committed to git. Replace with `process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL`. Rotate the exposed credentials in Neon console.

### 3. Create Auth Middleware Skeleton (4 hours)

**File:** New `api/lib/withAuth.js`

Even before retrofitting all endpoints, create the middleware pattern and apply it to the 5 most sensitive endpoints (`/api/members`, `/api/dashboard-live`, `/api/board-report`, `/api/notifications`, `/api/compute-health-scores`). This demonstrates the security model exists.

### 4. Fix the Stale Test + Add 3 Service Tests (4 hours)

**Files:** `src/services/memberService.test.js` (fix assertion), new test files for `briefingService` and `compute-health-scores`

The failing test makes CI red. Fix the `critical.count` assertion to match current mock data. Then add 3 focused tests: briefing section count, health score with zero data → Ghost classification, health score with balanced data → correct tier.

### 5. Create .env.example and Wire CSV Backend (8 hours)

**Files:** New `.env.example` (list all required env vars without values), `api/import-csv.js` (add INSERT logic for `members` category)

Start with just the `members` category — when a CSV import of type "members" is confirmed, INSERT rows into the `members` table. This is the critical path to getting real data into the system. The other 9 categories can follow.

---

## Appendix A: Complete File Tree (Active Code Only)

```
src/
├── App.jsx                          # Route definitions, 5 active routes
├── config/
│   └── navigation.js                # 5 PRIMARY nav items
├── context/
│   ├── NavigationContext.jsx         # Hash routing + legacy redirects
│   ├── DataProvider.jsx              # Service initialization orchestrator
│   └── ThemeProvider.jsx             # Theme config
├── data/                            # 19 mock data files (Phase 2 swap targets)
│   ├── agents.js, benchmarks.js, boardReport.js, cockpit.js
│   ├── combinations.js, email.js, integrations.js, location.js
│   ├── members.js, onlySwoopAngles.js*, outlets.js, outreach.js
│   ├── pace.js, pipeline.js, revenue.js, staffing.js
│   ├── teeSheetOps.js, trends.js, weather.js
│   └── schema/vercelPostgresSchema.js
├── services/                        # 18 service files (API abstraction layer)
│   ├── activityService.js, agentService.js, boardReportService.js
│   ├── briefingService.js, cockpitService.js, csvImportService.js
│   ├── experienceInsightsService.js, fbService.js, integrationsService.js
│   ├── locationService.js*, memberService.js, operationsService.js
│   ├── pipelineService.js*, staffingService.js, teeSheetOpsService.js*
│   ├── trendsService.js, waitlistMetrics.js, waitlistService.js
│   └── index.js
├── features/                        # 12 active feature folders
│   ├── today/                       # Today view (4 sections)
│   ├── service/                     # Service view (3 tabs)
│   ├── members/                     # Members view (3 modes)
│   ├── board-report/                # Board Report (2 tabs)
│   ├── admin/                       # Admin Hub (2 tabs)
│   ├── playbooks/                   # Playbooks (3 visible + 10 hidden)
│   ├── member-profile/              # Member detail drawer
│   ├── member-health/               # Tab components reused by MembersView
│   ├── integrations/                # Vendor integration grid
│   ├── login/                       # Auth + new club setup
│   ├── landing/                     # Orphaned*
│   └── data-health/                 # Feature-flagged (2+ sources required)
├── components/
│   ├── layout/                      # Sidebar, Header, Footer, ActionsDrawer
│   ├── ui/                          # 48 shared components (story-first pattern)
│   ├── charts/                      # TrendChart
│   └── playbooks/                   # PlaybookPanel, PlaybookActionCard
└── mobile/                          # 4 mobile screens (shell only)

api/                                 # 64 Vercel serverless functions
├── auth.js                          # Login/logout/validate
├── onboard-club.js                  # Club creation + onboarding steps
├── import-csv.js                    # CSV import (partial)
├── compute-health-scores.js         # Health score engine (real)
├── members.js, dashboard-live.js    # Data endpoints (need club_id filtering)
├── agents/                          # Anthropic API integration
│   ├── draft.js, explain.js, sweep.js
├── migrations/                      # DB migration scripts
└── ... (60+ more endpoints)

seed/                                # Database seeding
├── schema.sql                       # 32-table DDL
├── seed_database.py                 # 7-phase orchestrator
└── linkers/canonical.py             # Canonical event stream generator
```

*Items marked with `*` are orphaned/dead code candidates.*

## Appendix B: Environment Variables Required

```bash
# Database (Vercel Postgres / Neon)
DATABASE_URL=
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=

# Auth
# (no external auth provider yet — session-based)

# SendGrid (email)
SENDGRID_API_KEY=

# Twilio (SMS — optional for Phase 1)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=

# Anthropic (agent system — optional for Phase 1)
ANTHROPIC_API_KEY=

# Vercel (auto-injected in deployment)
VERCEL=
VERCEL_ENV=
VERCEL_URL=

# Feature flags (client-side)
VITE_API_ENABLED=       # true/false — enables live API calls in services
VITE_DEMO_ENDPOINT=     # URL for demo CTA
```
