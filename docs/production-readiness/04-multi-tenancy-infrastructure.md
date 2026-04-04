# 4. Multi-Tenancy & Infrastructure

**Status:** Implemented on `production-readiness-plan` branch

---

## 4.1 Schema-Level Tenant Isolation

**Implemented on branch:** `club_id` added to 25+ tables in `seed/schema.sql` and via `api/migrations/007-add-club-id-tenant-isolation.js`.

Tables updated: `households`, `membership_types`, `weather_daily`, `canonical_events`, `service_requests`, `staff_shifts`, `visit_sessions`, `member_engagement_daily`, `member_engagement_weekly`, `board_report_snapshots`, `member_interventions`, `operational_interventions`, `experience_correlations`, `correlation_insights`, `event_roi_metrics`, `archetype_spend_gaps`, `agent_definitions`, `agent_actions`, `connected_systems`, `industry_benchmarks`, `activity_log`, `member_location_current`, `staff_location_current`, `service_recovery_alerts`, `booking_confirmations`, `slot_reassignments`, `health_scores`, `rounds`, `transactions`, `complaints`.

**Migration script features:**
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for safe re-runs
- Composite indexes on `(club_id, ...)` for query performance
- Backfill: sets `club_id = 'club_001'` for existing Oakmont Hills data
- `waitlist_config` primary key fixed (was hardcoded 'oakmont')

**Tables that scope via FK join (no direct club_id needed):**
- `booking_players` -- via booking -> course -> club
- `pos_line_items`, `pos_payments` -- via check -> outlet -> club
- `pace_of_play`, `pace_hole_segments` -- via booking -> course -> club

## 4.2 API-Level Tenant Isolation

**Implemented on branch:** `api/lib/withAuth.js` middleware applied to 29 API endpoints.

The middleware:
- Validates Bearer token from `sessions` table
- Extracts `clubId` from session and attaches to `req.auth`
- Supports role-based access control (`roles` option)
- Supports demo mode via `X-Demo-Club` header
- `swoop_admin` role can query any club via `?clubId=xxx` override
- Helper: `getClubId(req)` returns the authenticated club ID

**All data-serving endpoints now filter by `club_id`:** members, dashboard-live, board-report, briefing, cockpit, notifications, activity, agents, benchmarks, compute-health-scores, compute-correlations, execute-action, execute-playbook, experience-insights, fb, import-csv, integrations, invoices, location, member-detail, operations, pipeline, predict-churn, staffing, tee-sheet-ops, trends, waitlist.

## 4.3 Authentication

**Implemented on branch:**
- Password bypass **removed** -- requires bcrypt-equivalent pbkdf2 hash comparison
- `api/onboard-club.js` now hashes passwords on user creation (requires `adminPassword` param)
- Session-based auth with 24-hour TTL

**Still needed:**
- Password reset flow (SendGrid is configured, endpoint not built)
- OAuth/SSO (P2)
- Session refresh tokens (P2)

## 4.4 Database Architecture Decision

**Shared database with `club_id` tenant isolation** -- confirmed as the right call.

Rationale: First 20 clubs = ~6,000 members, ~100K bookings/year. Postgres handles this trivially. Neon branching handles dev/staging. Database-per-tenant is too complex for a 1-2 person team.

Risks to monitor at scale:
- Add composite indexes at 50+ clubs (migration 007 already adds these)
- Consider Postgres RLS at 100+ clubs
- Offer dedicated Neon branch for clubs requiring data isolation compliance

## 4.5 RBAC

**Partially implemented on branch:** `withAuth` middleware supports `roles` option.

```javascript
// Example: restrict to GM and admin only
export default withAuth(handler, { roles: ['gm', 'assistant_gm', 'swoop_admin'] });
```

**Not yet implemented:** Frontend nav item filtering by role, scoped page access for `fb_director` / `membership_director` roles. Effort: S (8-12 hours).

## 4.6 Deployment URLs

| URL | Purpose |
|-----|---------|
| https://swoop-member-portal.vercel.app | Production (dev branch) |
| https://swoop-member-portal-dev.vercel.app | Dev alias |
| https://swoop-member-portal-production-readiness.vercel.app | Feature branch preview |
