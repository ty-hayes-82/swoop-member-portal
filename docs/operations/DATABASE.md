# Database Operations

This document is the authoritative reference for the Swoop Member Portal
Postgres schema, migration story, and multi-tenant conventions. It is
generated from the migration history in `api/migrations/` — if you change
the schema, update a migration (never this doc first) and re-summarise.

## 1. Schema overview

All tables live in a single Vercel Postgres database. The logical groupings
below are derived from migrations 001, 006, 010, and 013 (the `CREATE TABLE`
migrations).

### Tenant root
- `club` — one row per customer club. `club_id TEXT` is the tenant PK used
  everywhere else. Stores name/address/branding/timezone plus `latitude` +
  `longitude` (added in 006 for weather lookups).

### Auth / users
- `users` — portal operators (GM, staff, admins). Email-unique, role-based.
  Password columns added by 002, `auth_provider` by 013.
- `sessions` — active bearer tokens.
- `password_resets` — single-use reset tokens (migration 010).
- `google_tokens` — per-user Google OAuth tokens for Calendar + Gmail
  (migration 013).

### Core member data
- `members` — the core member entity. Heavily altered: 002 adds profile
  columns, 004 relaxes NOT NULL, 007 adds `data_completeness`, 008 adds
  Jonas fields (`birthday`, `sex`, `handicap`, `current_balance`,
  `date_resigned`, `mailings`), 009 adds `membership_status`.
- `health_scores` — time-series health score history per member.
- `member_sentiment_ratings` — manual & derived sentiment scores.
- `churn_predictions` — rolling 30/60/90d churn probability per member.

### Operations data
- `rounds` — tee sheet data (one row per round).
- `transactions` — POS transactions.
- `complaints` — service issues tracked with SLA.
- `actions` — proposed interventions (pending → approved → executed).
- `interventions` — outcome-tracked member saves.

### Feature system
- `data_source_status` — per-domain connector health (one row per
  club+domain).
- `feature_dependency` — which features need which data domains.
- `feature_state_log` — audit trail of feature enablement changes.
- `onboarding_progress` — per-club onboarding checklist state.

### Weather (migration 006)
- `weather_daily_log` — historical daily weather per club.
- `weather_hourly_cache` — short-lived forecast cache (one row per club,
  overwritten on refresh).
- `complaint_weather_context` — per-complaint weather tagging for
  correlations.

### Playbooks & agents
- `playbook_runs`, `playbook_steps` — running instances of intervention
  playbooks.
- `agent_activity` — audit log of agent-proposed actions.
- `agent_configs` — per-club agent settings (enable, auto-approve).

### Notifications
- `notifications` — in-app / email notifications queue.
- `notification_preferences` — per-user notification opt-ins.

### Analytics / imports
- `correlations` — cross-domain correlation insights.
- `data_syncs` — integration sync run log.
- `csv_imports` — CSV import job tracker.

Several additional tables (`bookings`, `pos_checks`, `pace_of_play`,
`staff_shifts`, `event_definitions`, `email_campaigns`, `feedback`, etc.)
pre-exist the migration history and are referenced (but not created) by
migrations 003-009. Those tables are defined in
`docs/DATABASE_SCHEMA.md` and the historical `schema.sql`.

## 2. Multi-tenant model

**Every tenant-scoped table has a `club_id TEXT` column. Every query that
touches tenant data MUST filter by `club_id`.** There is no database-level
row-level security — tenant isolation is enforced entirely in the API layer.

Migration 007 added `club_id` to tables created by 001-006 and other
pre-existing tables. Migration 009 is a belt-and-braces re-run that
`ADD COLUMN IF NOT EXISTS club_id TEXT` on every table the API queries with
`WHERE club_id = ...`, because some databases were provisioned from older
schema snapshots that didn't have it yet.

Tables guaranteed to have `club_id` after migrations 007 + 009:

```
activity_log                    archetype_spend_gaps         agent_actions
agent_definitions               board_report_snapshots       booking_confirmations
booking_players                 bookings                     cancellation_risk
canonical_events                close_outs                   complaints
connected_systems               correlation_insights         courses
csv_imports                     data_source_status           demand_heatmap
dining_outlets                  email_campaigns              email_events
event_definitions               event_registrations          event_roi_metrics
experience_correlations         feedback                     health_scores
households                      industry_benchmarks          member_engagement_daily
member_engagement_weekly        member_interventions         member_invoices
member_location_current         member_waitlist              members
membership_types                operational_interventions    pace_hole_segments
pace_of_play                    pos_checks                   pos_line_items
pos_payments                    rounds                       service_recovery_alerts
service_requests                slot_reassignments           staff
staff_location_current          staff_shifts                 transactions
visit_sessions                  waitlist_config              waitlist_entries
weather_daily                   weather_daily_log            weather_hourly_cache
complaint_weather_context
```

The special value `club_001` is the current demo/seed tenant (Pinetree
Country Club — rebranded from Oakmont Hills in migration 012). All
backfills default to `club_001`.

Tables that do NOT have `club_id` (intentionally global):
- `club` itself (the tenant root — its PK *is* `club_id`)
- `feature_dependency` (global feature map)
- `users` *has* `club_id` (users belong to a club), so this is not an
  exception; listed for clarity because `users.email` is globally unique.

## 3. Migration order

Migrations live in `api/migrations/` and are numbered with a three-digit
prefix. They must always be applied in numeric order. Each is an ES module
that default-exports a Vercel serverless handler `(req, res)`.

| #   | File                                    | What it does |
|-----|-----------------------------------------|--------------|
| 001 | `001-core-tables.js`                    | Creates club, members, health_scores, rounds, transactions, complaints, actions, interventions, data_syncs, users, csv_imports, data_source_status, feature_dependency, feature_state_log, churn_predictions, correlations, playbook_runs/steps, notifications, notification_preferences, sessions, agent_activity, agent_configs, onboarding_progress, member_sentiment_ratings + indexes. Idempotent (IF NOT EXISTS). |
| 002 | `002-alter-members.js`                  | Adds missing columns (`club_id`, profile, health, timestamps) to a pre-existing `members` table; adds `password_hash`/`password_salt` to `users`; retries the `idx_members_*` indexes that 001 couldn't create. |
| 003 | `003-relax-constraints.js`              | Drops NOT NULL on `members.member_number/name/membership_type_id` and on `club.city/state/zip/name`. Needed because the pre-existing tables had strict NOT NULL that blocked CSV imports. |
| 004 | `004-fix-all-constraints.js`            | Queries `information_schema` and drops NOT NULL on *every* remaining nullable-in-practice `members` column except the PK. Follow-up to 003 after more constraints were discovered. |
| 005 | `005-drop-fk-constraints.js`            | Drops all FK constraints on `members` and FKs referencing `members` from other tables. Needed because CSV imports land rows before reference tables are populated. |
| 006 | `006-weather-tables.js`                 | Adds `latitude`/`longitude` to `club`; creates `weather_daily_log`, `weather_hourly_cache`, `complaint_weather_context` + indexes; backfills Pinetree coordinates. |
| 007 | `007-add-club-id-tenant-isolation.js`   | Adds `club_id` to 25+ tables for multi-tenant isolation, creates composite indexes, fixes `waitlist_config` hardcoded default, backfills all NULL `club_id` → `club_001`. |
| 008 | `008-jonas-import-columns.js`           | Adds Jonas-specific columns to `members` (birthday, sex, handicap, current_balance, date_resigned, mailings), `bookings` (transportation, caddie, check_in/round times), `pos_checks` (first_fire, comp, discount, void), and `data_source` to ~20 import-target tables. |
| 009 | `009-ensure-club-id-everywhere.js`      | Belt-and-braces re-run of 007 for every table the API queries with `WHERE club_id = ...`. Also adds `pace_of_play.is_slow_round`, `close_outs.is_understaffed`, `pos_checks.post_round_dining`, `members.membership_status`. Idempotent. |
| 010 | `010-password-resets-table.js`          | Creates `password_resets` table + indexes for forgot-password flow. |
| 011 | `011-unique-constraints.js`             | Creates UNIQUE indexes on `users.email` (lowercased), `members(club_id, external_id)` (partial), `password_resets.token`, `sessions.token`. |
| 012 | `012-rebrand-pinetree.js`               | Rebrands `club_001` from Oakmont Hills to Pinetree Country Club, Kennesaw GA. Supports `?cleanup=true` to delete all non-`club_001` rows (destructive — only when called via URL). |
| 013 | `013-google-tokens.js`                  | Creates `google_tokens` table for per-user Google OAuth; adds `users.auth_provider`. |
| 014 | `014-member-invoices-table.js`          | Creates `member_invoices` table with `club_id` from day 1. Closes the gap where `seed/schema.sql` was the only source of this table. |
| 015 | `015-cross-club-audit-table.js`         | Creates `cross_club_audit` table + indexes for SEC-2 observability of swoop_admin cross-tenant writes. Populated by the `withAdminOverride` wrapper in `api/lib/withAdminOverride.js`. Forensic metadata only — no request bodies are stored (SHA-256 hash only). |

## 4. Running migrations

```bash
npm run db:migrate
```

That runs `node scripts/migrate.mjs`, which:

1. Creates `migrations_log` if it doesn't exist.
2. Reads `api/migrations/[0-9]*.js` in numeric order.
3. Imports each pending migration (skip if already in `migrations_log`).
4. Invokes the default-exported handler with a mock `POST` req/res.
5. Accepts HTTP 2xx (including 207 multi-status) as success.
6. Records `{id, applied_at, status, notes}` in `migrations_log`.
7. Exits non-zero and stops on first failure.

Re-running with all migrations applied is a safe no-op.

The runner loads `POSTGRES_URL` from the shell environment first, falling
back to `.env.local` in the repo root if nothing is set.

Additional flags:

```bash
node scripts/migrate.mjs --status    # show applied/pending, no changes
node scripts/migrate.mjs --dry-run   # list what would run, no changes
node scripts/migrate.mjs --help
```

### Production usage

Migrations can also still be invoked one-by-one via their HTTP endpoint
(`POST /api/migrations/<name>`), which is how the legacy flow worked.
The CLI runner is strictly preferable — it is transactional per-migration,
ordered, and records state. Only fall back to HTTP if the CLI path is
unreachable (e.g. from a Vercel Function without filesystem access).

## 5. Adding a new migration

1. **Name it** with the next three-digit prefix and a kebab-case summary:
   `api/migrations/014-add-member-tier.js`. Gaps are not allowed; the
   runner sorts by the numeric prefix.

2. **Match the existing module shape** — an ES module that default-exports
   an async `(req, res)` handler, uses `@vercel/postgres`, and responds
   with `res.status(200).json({...})` on success, `res.status(207)` on
   partial success, `res.status(5xx)` on failure.

3. **Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`** everywhere. Every
   migration in this repo is idempotent and the runner depends on it —
   never write a migration that would fail a second time.

4. **If you create a tenant-scoped table, the new table MUST have a
   `club_id TEXT` column from day one**, and every query in the API layer
   must filter by it. Do not rely on a follow-up migration to add it.

5. **Indexes** — add composite indexes on `(club_id, ...)` for anything
   you plan to query with a `WHERE club_id = ... ORDER BY ...` clause.

6. **Backfills** — if you're adding a `NOT NULL` column to an existing
   table, add it as nullable, backfill, then `ALTER COLUMN ... SET NOT
   NULL` in the same migration (or a follow-up). See migration 003/004
   for cautionary tales about over-constraining.

7. **Test pattern** — there is no unit-test harness for migrations today.
   Minimum bar: run `npm run db:migrate` locally against a scratch
   database, then re-run it to verify idempotency.

8. **Never edit a past migration file.** Migrations 001-013 are frozen
   history — they are part of the audit trail. If you need to fix
   something in a past migration, write a new migration that corrects it
   (see 004 fixing 003, 009 backstopping 007).

## 6. Backfills and constraint hell — cautionary history

Migrations 003, 004, and 005 exist because an earlier version of the
`members` table was defined in a legacy `schema.sql` with strict NOT NULL
and foreign-key constraints that made CSV imports impossible:

- **003** tried to drop the specific NOT NULL columns known at the time.
- **004** gave up guessing and queries `information_schema.columns` to
  drop NOT NULL on *everything nullable-in-practice* except the PK.
- **005** drops all FK constraints referencing `members`, because imports
  land rows before reference tables are populated.

**Lesson:** start tables with the minimum viable constraints. You can
always tighten later once your import pipeline is proven; you can't
import around a broken NOT NULL without writing a constraint-demolition
migration like 004.

Similarly, 007 + 009 together enforce `club_id` everywhere. 007 was
written optimistically ("these tables already have it"), 009 was written
when the first multi-tenant 500 errors started firing in production.
**Lesson:** multi-tenant invariants must be enforced by the migration
runner, not assumed from the schema of record. If in doubt, write another
idempotent `ADD COLUMN IF NOT EXISTS club_id`.
