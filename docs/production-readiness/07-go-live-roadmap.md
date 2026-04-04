# 7. Go-Live Roadmap

**Status:** Updated April 4, 2026 with Sprint 1-5 progress

---

## Phase 1 -- Concierge MVP (First 3 Clubs)

**Target:** Bowling Green CC as Club 1 (contact: Daniel Soehren)
**Engineering headcount:** 1-2
**Calendar:** ~2-3 weeks remaining (originally 4-6 weeks, Sprints 1-5 complete)

### Sprint Progress

| Sprint | Scope | Status |
|--------|-------|--------|
| Sprint 1 (Security & Auth) | Remove password bypass, auth middleware, .env.example, remove hardcoded creds | **COMPLETE** |
| Sprint 2 (Tenant Isolation) | club_id migration (25+ tables), API endpoint filtering, demo mode | **COMPLETE** |
| Sprint 3 (Data Pipeline) | CSV import auth + club scoping, verify INSERT logic | **COMPLETE** |
| Sprint 4 (Real Data Rendering) | Service _init() with apiFetch, health score completeness gate | **COMPLETE** |
| Sprint 5 (Polish) | Code-splitting (938KB->132KB), fix tests (12/12), delete orphaned code | **COMPLETE** |

### Remaining Work

**Sprint 6 (Apr 7-11): Integration Testing**
- Test full onboarding flow: create club -> create user -> import CSV -> compute scores
- Validate Jonas CSV alias matching with real export (see [06-testing-validation.md](./06-testing-validation.md))
- Test empty state handling for pages with no data
- Verify all 5 nav pages render correctly with real Postgres data

**Sprint 7 (Apr 14-18): Launch Prep**
- Create onboarding runbook for Swoop team
- Build password reset flow (SendGrid configured)
- Design empty state components ("Connect your tee sheet to see golf analytics")
- Conduct dry run with synthetic Bowling Green CC data
- **Go live with Bowling Green CC**

**Key milestone:** GM logs in and sees their real members with health scores.
**Biggest risk:** Health score algorithm produces nonsensical results with sparse real data. Mitigation: data completeness gate (implemented) + manual review of first 50 health scores.
**What "done" looks like:** GM uses the platform unprompted for 2+ weeks.

## Phase 2 -- Semi-Automated (Clubs 4-20)

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
**Biggest risk:** Jonas API varies by club version/configuration.
**What "done" looks like:** A club admin can upload their own CSV and the GM receives a weekly email digest.

## Phase 3 -- Scale (20+ Clubs)

**Engineering headcount:** 3-5
**Calendar:** 6-12 months after launch

**Key deliverables:**
- Self-service onboarding wizard
- Multiple vendor connectors (ForeTees, Toast, Clubessential)
- Canonical event stream pipeline
- Cross-domain correlation engine
- Mobile app (4 screens)
- Row-level security in Postgres
- SOC 2 compliance preparation

**What "done" looks like:** New club fully live within 24 hours, zero Swoop team intervention.

## Technical Decision: Progressive Hydration

**Decision made:** Option B -- Progressive Hydration.

Import member roster first (Jonas CSV mapping is done). This lights up the Members page immediately. Then add F&B data (Jonas POS export), then golf data (ForeTees export). Each domain addition is independently testable.

The key architectural requirement (implemented): each service's `_init()` function handles the case where its API returns no data by falling back to static demo data. The `apiClient.js` returns `null` on auth failure, letting services degrade gracefully.

## Implementation Artifacts

Files created/modified on `production-readiness-plan` branch:

**New files:**
- `api/lib/withAuth.js` -- Auth middleware with RBAC
- `api/migrations/007-add-club-id-tenant-isolation.js` -- Multi-tenant migration
- `src/services/apiClient.js` -- Authenticated fetch wrapper
- `src/services/briefingService.test.js` -- New test file
- `src/services/cockpitService.test.js` -- New test file
- `src/services/weatherService.js` -- Weather data service
- `api/weather.js` -- Weather API endpoint
- `api/cron/weather-daily.js` -- Nightly weather sync cron
- `api/services/weather.js` -- Weather service (server-side)
- `api/services/demand.js` -- Demand forecasting service
- `.env.example` -- Environment variable template

**Deleted files:**
- `src/data/onlySwoopAngles.js` -- Dead code
- `src/features/integrations/IntegrationMap.jsx` -- Orphaned SVG
- `src/features/landing/PortalLanding.jsx` -- Unreachable page

**Modified (29 API endpoints):** All wrapped with `withAuth` + `club_id` filtering.
**Modified (15 services):** All updated to use `apiFetch` with Bearer tokens.
**Modified:** `seed/schema.sql` (club_id on 25+ tables), `vite.config.js` (code-splitting), `src/App.jsx` (lazy loading).
