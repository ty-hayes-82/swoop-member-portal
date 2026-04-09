# Swoop Golf — Operational Runbook

> **Audience:** On-call engineer, day one.
> **Last updated:** 2026-04-09
> **Owner:** PM + DevOps lead
> **Status:** Living document. Update after every incident and every deploy procedure change.

This is the operational source of truth for taking Swoop to market. If you are on-call and something is on fire, start at section 7 (Incident response). If you are new to the team, read sections 1–5 in order.

---

## Table of contents

1. [Overview](#1-overview)
2. [Environments](#2-environments)
3. [Environment variables](#3-environment-variables)
4. [Database](#4-database)
5. [Deploy procedure](#5-deploy-procedure)
6. [Monitoring and alerting](#6-monitoring-and-alerting)
7. [Incident response](#7-incident-response)
8. [Vendor integrations](#8-vendor-integrations)
9. [Multi-tenant onboarding](#9-multi-tenant-onboarding)
10. [Demo mode](#10-demo-mode)
11. [Test strategy](#11-test-strategy)

---

## 1. Overview

Swoop Golf is the cross-domain intelligence layer for private club operations. It sits above every system a club already uses — tee sheets, POS, CRM, scheduling, email, weather — and synthesizes them into one screen that answers three questions: **See It** (what is happening across every system right now?), **Fix It** (what is about to go wrong and what should I do about it?), and **Prove It** (show the board the dollar impact with sources). See [`docs/strategy/NORTH-STAR.md`](../strategy/NORTH-STAR.md) and [`docs/strategy/WHO-WE-ARE.md`](../strategy/WHO-WE-ARE.md).

### Architecture at a glance

| Layer | Tech | Location |
|---|---|---|
| Frontend | Vite 5 + React 18 + React Router 7 + Tailwind 4 | [`src/`](../../src) |
| API | Vercel serverless functions (Node, ESM) | [`api/`](../../api) |
| Database | Vercel Postgres via `@vercel/postgres` | connection strings in Vercel project env |
| Maps | Mapbox GL + Leaflet (+ `leaflet.heat`) | frontend only |
| Charts | Recharts | frontend only |
| Cron | Vercel Cron | declared in [`vercel.json`](../../vercel.json) |
| Auth | Custom session tokens (24 h TTL) in `sessions` table, plus Google OAuth | [`api/auth.js`](../../api/auth.js), [`api/lib/withAuth.js`](../../api/lib/withAuth.js), [`api/google/`](../../api/google) |

### Multi-tenancy

- Every tenant-scoped table has a `club_id` column. Enforced in migrations [`007-add-club-id-tenant-isolation.js`](../../api/migrations/007-add-club-id-tenant-isolation.js) and [`009-ensure-club-id-everywhere.js`](../../api/migrations/009-ensure-club-id-everywhere.js).
- Every authenticated API handler that reads tenant data MUST filter by `req.auth.clubId` (provided by the `withAuth` middleware).
- The `sessions` table binds each token to a single `club_id`; there is no cross-club admin surface today.

### Hosting

- **Platform:** Vercel (connected to GitHub via the Vercel GitHub integration).
- **Project:** `swoop-member-portal` (Vercel team: `tyhayesswoopgolfcos-projects`).
- **Branches:**
  - `dev` — Vercel auto-deploys a preview per push (continuous).
  - `main` — Vercel auto-deploys production from `main` only. **Merges to `main` are gated; see section 5.**
- **Build:** `npm run build` → `vite build` (preceded by [`scripts/prebuild-safe-clean.mjs`](../../scripts/prebuild-safe-clean.mjs)). Output directory: `dist/`.
- **Rewrites:** SPA fallback (`/((?!assets/).*) → /index.html`) and `/api/*` preserved. Defined in [`vercel.json`](../../vercel.json).
- **CORS:** Locked to `https://swoop-member-portal.vercel.app` via `vercel.json` headers. If you add a custom production domain, update that header.

---

## 2. Environments

| Environment | URL | Source | Auto-deploy | Purpose |
|---|---|---|---|---|
| `local` | http://localhost:5174 | developer machine, `npm run dev` | n/a | Day-to-day dev. Note: some e2e specs default to `:5173`, others to `:5174`. |
| `dev` (preview) | `https://swoop-member-portal-<sha>-<team>.vercel.app` | `dev` branch | yes | Continuous preview. Every push runs through here. |
| `production` | `https://swoop-member-portal.vercel.app` | `main` branch | **yes, but merges to `main` are gated** | Real clubs and pilots. |

### Local development

```bash
npm install
npm run dev          # starts Vite on http://localhost:5174
npm run test         # vitest unit tests
npm run test:e2e     # playwright e2e
```

To hit real API routes locally, use `vercel dev` instead of `npm run dev` (installs the Vercel function emulator). API routes are serverless, not part of the Vite dev server.

### Production deploy policy

> **CRITICAL: NO automated production deploys without human approval.** Vercel auto-deploys `main`, so the gate is at the **PR merge to `main`**, not at the Vercel side. Do not bypass the PR process. Do not run `vercel --prod` from a laptop. Do not push directly to `main`. See [feedback_no_prod_deploy.md] memory and section 5 below.

---

## 3. Environment variables

All server-side env vars are read via `process.env.*` inside [`api/`](../../api) handlers. Frontend build-time vars (if any are added later) must be prefixed `VITE_` per Vite convention.

### Where they live

| Target | Location | Notes |
|---|---|---|
| Local dev | `.env.local` at repo root | Developer creates manually; gitignored. Pattern is in [`.env.example`](../../.env.example). |
| Local pulled from Vercel | `.env.vercel` at repo root | Created by `vercel env pull`. **Gitignored.** Contains live secrets — never commit. |
| Preview (`dev` branch) | Vercel project → Settings → Environment Variables → **Preview** | Each variable should be scoped to the Preview environment. |
| Production (`main`) | Vercel project → Settings → Environment Variables → **Production** | Production-only secrets (real Twilio, SendGrid, Postgres) set here. |

### Variable inventory

The table below was built by grepping `process.env.*` across [`api/`](../../api) and cross-referencing the variables currently present in `.env.vercel`. Values are never listed here.

| Variable | Purpose | Where used | Required? | Shape |
|---|---|---|---|---|
| `POSTGRES_URL` | Primary Postgres pooled connection string (read by `@vercel/postgres`) | every file that imports `sql` from `@vercel/postgres` | **required** | `postgresql://user:pass@host/db?sslmode=require` |
| `POSTGRES_URL_NON_POOLING` | Direct (non-pooled) Postgres connection; required by long-running scripts and migrations | [`scripts/reseed-pipeline-leads.mjs`](../../scripts/reseed-pipeline-leads.mjs), migration scripts | **required** | `postgresql://...` |
| `POSTGRES_PRISMA_URL` | Auto-provisioned by Vercel Postgres integration | implicit via Vercel | optional (auto) | `postgresql://...` |
| `POSTGRES_USER` / `POSTGRES_HOST` / `POSTGRES_PASSWORD` / `POSTGRES_DATABASE` | Auto-provisioned components | implicit via Vercel | optional (auto) | strings |
| `ANTHROPIC_API_KEY` | Claude API key for AI draft/explain/sweep agents | [`api/lib/aiClient.js`](../../api/lib/aiClient.js), [`api/agents/draft.js`](../../api/agents/draft.js), [`api/agents/explain.js`](../../api/agents/explain.js), [`api/agents/sweep.js`](../../api/agents/sweep.js) | required for AI features | `sk-ant-api03-...` |
| `GOOGLE_AI_API_KEY` | Gemini alternative for AI draft client | [`api/lib/aiClient.js`](../../api/lib/aiClient.js) | optional (fallback) | `AIza...` |
| `AI_DRAFT_PROVIDER` | `claude` (default) or `gemini` | [`api/lib/aiClient.js`](../../api/lib/aiClient.js) | optional | `claude` \| `gemini` |
| `GOOGLE_CLIENT_ID` | Google OAuth client for Calendar/Gmail/Sign-in | [`api/google/*.js`](../../api/google), [`api/lib/googleTokens.js`](../../api/lib/googleTokens.js) | required for Google integrations | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | same as above | required for Google integrations | `GOCSPX-...` |
| `APP_URL` | Canonical base URL used by OAuth redirect construction | [`api/google/auth.js`](../../api/google/auth.js), [`api/google/callback.js`](../../api/google/callback.js), [`api/google/signin.js`](../../api/google/signin.js), [`api/google/signin-callback.js`](../../api/google/signin-callback.js) | recommended in production | `https://swoop-member-portal.vercel.app` |
| `GOOGLE_WEATHER_API_KEY` | Google Weather API key for the daily cron and live conditions | [`api/services/weather.js`](../../api/services/weather.js), [`api/cron/weather-daily.js`](../../api/cron/weather-daily.js) | required for weather features | `AIza...` |
| `VISUAL_CROSSING_API_KEY` | Visual Crossing weather provider (fallback) | [`api/services/weather.js`](../../api/services/weather.js) | optional | string |
| `SENDGRID_API_KEY` | SendGrid transactional email (password reset, agent email actions, notifications) | [`api/forgot-password.js`](../../api/forgot-password.js), [`api/execute-action.js`](../../api/execute-action.js), [`api/test-email.js`](../../api/test-email.js), `api/notifications.js` | required for email | `SG....` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | [`api/sms/send-test.js`](../../api/sms/send-test.js), [`api/execute-action.js`](../../api/execute-action.js), [`api/twilio/`](../../api/twilio) | required for SMS | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token (fallback auth if API key pair not set) | same | required (either this or API key pair) | string |
| `TWILIO_API_KEY_SID` | Twilio API Key SID (preferred over AUTH_TOKEN) | same | recommended | `SK...` |
| `TWILIO_API_KEY_SECRET` | Twilio API Key secret | same | recommended | string |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio Messaging Service SID (preferred over per-number `From`) | same | recommended | `MG...` |
| `TWILIO_PHONE_NUMBER` | Fallback sending number if no Messaging Service SID | same | optional | `+1...` |
| `NODE_ENV` | Vercel sets this to `production` on the prod deployment | gating in operator CLI scripts under [`scripts/operator/`](../../scripts/operator/) (`check-*`, `debug-db`, `schema-*`, `seed-*`, `fix-*`) | auto | `production` \| `development` |
| `ALLOW_DEBUG` | Escape hatch that lets operator scripts under `scripts/operator/` run against a production DB. **Do not set in production except for a short, audited window.** Required when invoking any `scripts/operator/*.js` via CLI. | all files guarded with `NODE_ENV === 'production' && !ALLOW_DEBUG` | optional | `1` |
| `VERCEL_URL` | Vercel auto-injected per-deploy URL | `api/notifications.js` (fallback base URL) | auto | `<host>` |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC token (short-lived, auto-rotated) | infra tooling only | auto | JWT |
| `CI` | Playwright sets `forbidOnly: true` in CI | [`playwright.config.js`](../../playwright.config.js) | auto in CI | `1` |

### How to rotate a secret

1. Generate the new value at the vendor (Twilio, SendGrid, etc.).
2. In Vercel → Project → Settings → Environment Variables, **add** the new value (do not delete the old one yet).
3. Redeploy production from the latest commit on `main` (Vercel dashboard → Deployments → Redeploy).
4. Smoke-test the affected feature.
5. Delete the old value from Vercel.
6. Invalidate the old credential at the vendor.
7. Record the rotation in the incident log with date, who, and reason.

---

## 4. Database

### Provider

- **Vercel Postgres**, driven client-side by `@vercel/postgres` ([`package.json`](../../package.json)).
- Tagged template SQL (`sql\`SELECT ...\``) is the only pattern allowed. Never build SQL strings by concatenation.
- Two connection strings: `POSTGRES_URL` (pooled, short-lived queries from serverless functions) and `POSTGRES_URL_NON_POOLING` (for long-running scripts and migrations).

### Migrations

Migrations live in [`api/migrations/`](../../api/migrations) and are exposed as POST endpoints (one per file). A runner script wraps them into a single command:

```bash
npm run db:migrate   # runs scripts/migrate.mjs
```

The runner (`scripts/migrate.mjs`) is the preferred path. Individual migrations can still be triggered by POSTing to their URL on a deployed environment (useful for debugging a single migration on a preview deploy).

| # | File | One-line description |
|---|---|---|
| 001 | [`001-core-tables.js`](../../api/migrations/001-core-tables.js) | Core tables (clubs, members, bookings, etc.) — idempotent baseline schema. |
| 002 | [`002-alter-members.js`](../../api/migrations/002-alter-members.js) | Adds member columns required by Phase 1 features. |
| 003 | [`003-relax-constraints.js`](../../api/migrations/003-relax-constraints.js) | Relaxes over-strict NOT NULL / CHECK constraints for CSV import. |
| 004 | [`004-fix-all-constraints.js`](../../api/migrations/004-fix-all-constraints.js) | Final constraint cleanup across tables. |
| 005 | [`005-drop-fk-constraints.js`](../../api/migrations/005-drop-fk-constraints.js) | Drops rigid FK constraints that blocked partial imports. |
| 006 | [`006-weather-tables.js`](../../api/migrations/006-weather-tables.js) | `weather_daily_log`, `weather_hourly_cache`, and weather impact tables. |
| 007 | [`007-add-club-id-tenant-isolation.js`](../../api/migrations/007-add-club-id-tenant-isolation.js) | **Multi-tenant isolation.** Adds `club_id` to every tenant-scoped table. |
| 008 | [`008-jonas-import-columns.js`](../../api/migrations/008-jonas-import-columns.js) | Adds the Jonas club-management-system-specific columns for CSV import. |
| 009 | [`009-ensure-club-id-everywhere.js`](../../api/migrations/009-ensure-club-id-everywhere.js) | Backfills and enforces `club_id` on any table 007 missed. |
| 010 | [`010-password-resets-table.js`](../../api/migrations/010-password-resets-table.js) | `password_resets` table for forgot-password flow. |
| 011 | [`011-unique-constraints.js`](../../api/migrations/011-unique-constraints.js) | Adds unique indexes required for idempotent CSV upserts. |
| 012 | [`012-rebrand-pinetree.js`](../../api/migrations/012-rebrand-pinetree.js) | Rebrands seed club data from "Pinetree" to current demo name. |
| 013 | [`013-google-tokens.js`](../../api/migrations/013-google-tokens.js) | `google_tokens` table for per-user Calendar + Gmail OAuth tokens. |

### Running a migration

```bash
# Replace <deployment-url> with the preview or production URL.
curl -X POST https://<deployment-url>/api/migrations/007-add-club-id-tenant-isolation
```

Each migration returns JSON with one result row per step; a successful run has every step `status: ok`. If a step reports `status: error`, stop and investigate before running later migrations.

Confirm behavior of `scripts/migrate.mjs` before relying on it for production: verify it runs migrations in filename order, fails fast on the first error, and reports per-step status. If it does not, file a bug.

### Operator scripts (seed / fix / check / schema / debug)

One-shot operator scripts live in [`scripts/operator/`](../../scripts/operator/), **not** in `api/`. These used to ship as Vercel serverless routes but are now CLI-only so they do not bloat the deployed API surface. Run one with:

```bash
ALLOW_DEBUG=true node scripts/operator/<script-name>.js
```

Categories:
- `seed-*` — one-shot data seeders for demo clubs and pipelines
- `fix-*` — one-shot data repair (destructive; read the source before running)
- `check-*` — read-only diagnostics
- `schema-*` — schema introspection
- `debug-db` — ad-hoc DB probing

For actual schema migrations, use `scripts/migrate.mjs` — not these scripts. See [`scripts/operator/README.md`](../../scripts/operator/README.md) for the full inventory.

### Multi-tenancy rules

- Every tenant-scoped query MUST include `WHERE club_id = ${req.auth.clubId}`.
- The `withAuth` middleware ([`api/lib/withAuth.js`](../../api/lib/withAuth.js)) attaches `clubId`, `userId`, and `role` to `req.auth`. Use it; do not read tokens manually in handlers.
- The only legitimate cross-club read surface is demo mode (`allowDemo: true` in `withAuth` options) and background crons. Crons iterate `SELECT club_id FROM club` and operate per-club — see [`api/cron/weather-daily.js`](../../api/cron/weather-daily.js).

### Backups

**TODO: confirm backup retention and RPO/RTO with Vercel support.** Vercel Postgres (currently backed by Neon under the hood) offers point-in-time recovery and branch-based snapshots at the Vercel Postgres storage provider level, but the exact retention window depends on the plan tier assigned to this project. Action items:

1. Log into the Vercel dashboard → Storage → the Postgres database → Backups tab and document the retention window.
2. File a ticket to enable weekly automated logical backups (`pg_dump`) to object storage if retention is < 7 days.
3. Document the restore runbook once retention is confirmed.

Until this is resolved, treat the database as "best-effort recovery" for any data less than 24 h old. **Do not delete seed data or re-run destructive migrations on production without first taking a manual `pg_dump` snapshot.**

---

## 5. Deploy procedure

### Dev deploy (continuous, no approval needed)

1. Commit to a feature branch; open PR against `dev`.
2. Merge to `dev`. Vercel GitHub integration auto-deploys a Preview in ~90 s.
3. Preview URL appears in the PR comment and in the Vercel dashboard.
4. Smoke-test the preview URL on the changed surfaces.

### Production deploy (manual, gated)

> This is the only ceremony that matters. Everything above is rehearsal.

**Pre-flight checklist (must all be green):**

- [ ] All CI checks pass on the candidate branch
- [ ] `npm run test` passes locally against the candidate commit
- [ ] Storyboard E2E suite passes: `npx playwright test tests/e2e/storyboard-flows.spec.js` (all 7 tests green — **this is the release acceptance gate**)
- [ ] Polish suite passes: `npx playwright test tests/e2e/polish-final.spec.js` (5 tests)
- [ ] No uncommitted `.env.vercel`, `debug-*.png`, `vision-screenshots/`, or local artifacts in the PR
- [ ] Any new migrations have been run on production-equivalent preview first
- [ ] CHANGELOG or release notes drafted

**Approval:**

- Explicit written approval from the product owner (PM) is required before merging to `main`.
- Approval should name the commit SHA and the date.
- No Slack emoji reactions. Use a PR review "Approve" or a written "approved to deploy — <date>" comment.

**Execution:**

1. Open a PR from `dev` → `main`. Title: `Release: <short description> (<date>)`.
2. PM approves the PR (see above).
3. **Merge via the GitHub PR UI.** Never `git push origin main` from a laptop.
4. Vercel auto-deploys `main` → production. Watch the build in the Vercel dashboard.
5. Once the build is "Ready", run smoke tests (see below).
6. Post a release note in the team deploy channel with: commit SHA, what changed, who approved, smoke-test result, rollback URL (from Vercel dashboard).

**Smoke tests (production post-deploy):**

- [ ] Landing page loads: `https://swoop-member-portal.vercel.app/`
- [ ] Auth works: log in with a real test account, land on the Today View
- [ ] Each of the 3 storyboard flows is reachable without JS errors (open DevTools; zero red)
- [ ] `/api/health` returns 200 — **TODO: endpoint does not exist yet; ticket W2 is creating it. Until W2 ships, substitute a `GET /api/club?clubId=<known>` 200 check.**
- [ ] Weather cron last-run timestamp is within 24 h (check `weather_daily_log` or the admin integrations screen)
- [ ] One AI agent action (draft or explain) succeeds end-to-end

### Rollback

Vercel offers instant rollback by promoting any prior "Ready" deployment to production:

1. Vercel dashboard → Project → **Deployments** tab.
2. Find the last known-good production deployment (it will have a "Production" badge on the old one or a green status).
3. Click the three-dot menu → **Promote to Production**.
4. Rollback completes in seconds (it's a DNS/alias flip, not a rebuild).
5. Announce the rollback in the deploy channel with: rolled-from SHA, rolled-to SHA, reason, follow-up ticket link.

Rollback URL pattern (old deployments remain accessible): `https://swoop-member-portal-<sha>-<team>.vercel.app`.

**What rollback does NOT undo:** database migrations, external state changes (sent emails/SMS, Google Calendar events created, CSV imports). For those, you need a forward-fix, not a rollback.

---

## 6. Monitoring and alerting

### What exists today

- **Vercel function logs** — default log sink for every serverless function. Vercel dashboard → Project → **Logs** tab. Filter by function path (e.g. `/api/execute-action`).
- **Vercel runtime logs for specific deployments** — accessible per deployment via the dashboard or the `mcp__claude_ai_Vercel__get_runtime_logs` tool when debugging from Claude Code.
- **Cron logs** — visible under Vercel → Project → Cron Jobs. The only cron today is `/api/cron/weather-daily` at `0 3 * * *` (3 AM UTC). The handler requires `CRON_SECRET` (set in Vercel project env vars, Production + Preview) — Vercel passes it as `Authorization: Bearer <CRON_SECRET>` automatically on each tick. The handler is fail-closed: if the secret is missing or the header doesn't match, it returns 401 and does nothing. Rotate by generating a new value (`openssl rand -hex 32`), adding it in Vercel env vars, redeploying, then removing the old value.
- **Console error reporting** — [`api/lib/logger.js`](../../api/lib/logger.js) writes structured logs to stdout.

### What is NOT wired yet (TODO)

| Gap | Proposed tool | Ticket |
|---|---|---|
| Client-side error reporting | Sentry (browser SDK) | **TODO — no ticket yet, propose W6** |
| Perf / Core Web Vitals | Vercel Analytics or Vercel Speed Insights (toggle in dashboard) | **TODO** |
| Server-side APM | Datadog or OpenTelemetry → Vercel logs drain | **TODO** |
| Health endpoint | `/api/health` returning `{ status, db, uptime }` | **see W2** |
| Pager rotation | PagerDuty or Opsgenie | **TODO — blocked on hiring** |
| Synthetic uptime | Vercel Monitoring, or UptimeRobot as a cheap stopgap | **TODO** |

Do not claim any of these exist. If an incident requires alerting, today's answer is "a human must be watching."

### Key metrics to watch (manual until the above are wired)

- **Function execution time** — Vercel logs show duration per invocation. Alert threshold: p95 > 3000 ms sustained for 15 minutes.
- **Function error rate** — any 5xx response is a problem. Alert threshold: any 5xx on `/api/auth`, any `/api/execute-action` error, any cron failure.
- **DB query count per request** — watch for N+1 regressions. No automated threshold today; rely on code review.
- **Cron success** — `/api/cron/weather-daily` should succeed once per day. If it fails two days in a row, weather signals go stale.
- **Auth session count** — `SELECT count(*) FROM sessions WHERE expires_at > now()` — sanity check during pilots.

### Cross-club admin audit (`cross_club_audit`)

SEC-2 observability: every time a `swoop_admin` makes a write whose effective clubId (from `req.query.clubId` or `req.body.clubId`) diverges from their session clubId, the `withAdminOverride` wrapper in [`api/lib/withAdminOverride.js`](../../api/lib/withAdminOverride.js) inserts a row into `cross_club_audit`. Today the only opted-in endpoint is `POST /api/pause-resume`; additional admin tools can opt in by wrapping their handler the same way.

Captured per divergent write:

- `user_id`, `session_club_id`, `target_club_id` — the actor and the clubId pair
- `method`, `path` — HTTP method and URL path (no query string)
- `reason` — the `adminTool` / `reason` label the wrapper was configured with
- `body_hash` — SHA-256 hex of the JSON-serialized request body. **The body itself is never stored** — this keeps PII out of the audit table while still allowing forensic correlation against application logs.
- `ip` — first hop from `x-forwarded-for`
- `user_agent` — raw UA string
- `occurred_at` — insert timestamp

Forensics queries:

```sql
-- Recent cross-club activity by a specific admin
SELECT occurred_at, session_club_id, target_club_id, method, path, reason
FROM cross_club_audit
WHERE user_id = $1
ORDER BY occurred_at DESC
LIMIT 100;

-- Who has been touching a specific tenant from outside
SELECT occurred_at, user_id, session_club_id, method, path, reason, ip
FROM cross_club_audit
WHERE target_club_id = $1
ORDER BY occurred_at DESC
LIMIT 100;

-- Burst detection (>N divergent writes per admin in a 15-min window)
SELECT user_id, date_trunc('minute', occurred_at) AS bucket, count(*)
FROM cross_club_audit
WHERE occurred_at > now() - interval '24 hours'
GROUP BY user_id, bucket
HAVING count(*) > 20
ORDER BY bucket DESC;
```

**Retention — TODO.** There is no TTL job yet. A future sprint should add a cron that deletes rows older than ~90 days (or archives them to cold storage) so the table does not grow unbounded. Until then, the indexes on `(user_id, occurred_at DESC)`, `(target_club_id, occurred_at DESC)`, and `(occurred_at DESC)` keep forensic queries cheap even as the table grows.

The wrapper is fire-and-forget: if the audit insert fails the handler still runs and a `warn`-level structured log line is emitted with the same fields. So even if Postgres is temporarily unreachable, divergent writes remain visible in Vercel function logs — grep for `"context":"withAdminOverride"`.

---

## 7. Incident response

### Severity levels

| Level | Definition | Response time | Example |
|---|---|---|---|
| **SEV1** | A storyboard page is broken, or auth is down, or production is returning 5xx on the landing page. Pilot clubs cannot use the product. | immediate | Today View crashes on load. Login button throws. Postgres unreachable. |
| **SEV2** | A non-storyboard feature is broken; a subset of users are affected; there is a workaround. | within 1 business day | Google Calendar sync fails. SMS sends return Twilio error. One dashboard widget shows stale data. |
| **SEV3** | Cosmetic or a single non-critical edge case. | next sprint | Chart axis labels overlap on narrow screens. Typo in copy. |

### First responder checklist

When paged (or when a pilot club reports a problem):

1. **Confirm the blast radius.** Is it all clubs, one club, one user, one page? Check the production URL yourself first.
2. **Check the Vercel deploy log.** Was there a deploy in the last hour? If yes, this is almost certainly the cause.
   - Vercel dashboard → Deployments → filter by Production.
3. **Check the Vercel function logs** for the affected endpoint.
   - Grep for the user's `clubId` or `userId` if known.
4. **Check the database.**
   - From Vercel dashboard → Storage → run a `SELECT 1` query.
   - If connection fails, it's a Postgres availability issue — escalate to Vercel support via the dashboard.
5. **If SEV1 and the cause is a recent deploy: roll back immediately.** See section 5 rollback. Fix forward after the bleeding stops.
6. **If SEV1 and the cause is not a deploy: open a war room** (Slack huddle or equivalent), page the product owner, keep a timeline in a shared doc.
7. **Communicate to affected clubs.** Even a one-line "we see it, we're on it, ETA X" is infinitely better than silence.
8. **After resolution:** write a 5-line postmortem (see stub below) within 48 hours.

### Postmortem stub

Copy this into a new file under `docs/operations/postmortems/YYYY-MM-DD-<slug>.md`:

```markdown
# Postmortem: <title>
**Date:** YYYY-MM-DD
**Severity:** SEV1 | SEV2
**Duration:** HH:MM
**Impact:** <which clubs, how many users, what feature>

## Timeline
- HH:MM — <event>
- HH:MM — <event>

## Root cause
<1-3 sentences, blameless>

## What worked
- <bullet>

## What did not
- <bullet>

## Action items
- [ ] <owner> — <action> — <due>
```

### Destructive operations

Destructive endpoints are locked down so a single fat-fingered click cannot wipe a customer's data. Always logged via `logWarn` with actor, session clubId, target clubId, and IP.

- **Clear a club's activity log** — `DELETE /api/activity`
  - **Required role:** `swoop_admin` only (demo mode blocked).
  - **Required query params:** `?clubId=<id>` AND `?confirm=YES_DELETE_AUDIT_LOG_FOR_<id>` where `<id>` matches the target club exactly. The confirm token is validated server-side; a mismatch returns 400.
  - **Audit trail:** forced `logWarn('/api/activity', 'audit log DELETE', ...)` fires BEFORE the DELETE runs, and a `... complete` line with `deletedRows` fires after. Rejected attempts (wrong role, missing/invalid confirm) are also logged.
  - **Example:** `curl -X DELETE "https://.../api/activity?clubId=club_abc&confirm=YES_DELETE_AUDIT_LOG_FOR_club_abc" -H "Authorization: Bearer <swoop_admin session>"`

---

## 8. Vendor integrations

| Vendor | What it does | Code location | Config (env vars) | Notes |
|---|---|---|---|---|
| **Vercel Postgres** | Primary datastore | all `api/**/*.js` via `@vercel/postgres` | `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` (auto-provisioned) | See section 4. |
| **Twilio** | SMS (outbound reminders, member interventions, inbound webhooks, status callbacks) | [`api/sms/send-test.js`](../../api/sms/send-test.js), [`api/twilio/inbound.js`](../../api/twilio/inbound.js), [`api/twilio/status.js`](../../api/twilio/status.js), [`api/execute-action.js`](../../api/execute-action.js) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_PHONE_NUMBER` | Prefer API-key auth + Messaging Service SID over raw account token + phone number. |
| **SendGrid** | Transactional email (password reset, agent email actions, notifications) | [`api/forgot-password.js`](../../api/forgot-password.js), [`api/execute-action.js`](../../api/execute-action.js), [`api/test-email.js`](../../api/test-email.js), `api/notifications.js` | `SENDGRID_API_KEY` | Sender identity must be verified in SendGrid. |
| **Google OAuth (Sign-in + Calendar + Gmail)** | Member / staff sign-in with Google; Calendar event creation; Gmail drafts | [`api/google/`](../../api/google), [`api/lib/googleTokens.js`](../../api/lib/googleTokens.js) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` | Tokens persisted in `google_tokens` (migration 013). Update the OAuth consent screen when adding production domains. |
| **Google Weather API** | Primary weather provider: current conditions, forecast, daily archive | [`api/services/weather.js`](../../api/services/weather.js), [`api/cron/weather-daily.js`](../../api/cron/weather-daily.js) | `GOOGLE_WEATHER_API_KEY` | Used by the daily cron to refresh `weather_daily_log` and `weather_hourly_cache` per club. |
| **Visual Crossing** | Fallback weather provider | [`api/services/weather.js`](../../api/services/weather.js) | `VISUAL_CROSSING_API_KEY` | Optional; only triggered if Google Weather fails. |
| **Anthropic (Claude)** | AI draft / explain / sweep agents | [`api/lib/aiClient.js`](../../api/lib/aiClient.js), [`api/agents/draft.js`](../../api/agents/draft.js), [`api/agents/explain.js`](../../api/agents/explain.js), [`api/agents/sweep.js`](../../api/agents/sweep.js) | `ANTHROPIC_API_KEY`, `AI_DRAFT_PROVIDER` | Default provider. Set `AI_DRAFT_PROVIDER=gemini` to switch. |
| **Google AI (Gemini)** | Alternate AI provider | [`api/lib/aiClient.js`](../../api/lib/aiClient.js) | `GOOGLE_AI_API_KEY` | Only used when `AI_DRAFT_PROVIDER=gemini`. |
| **Mapbox GL** | Primary map rendering | frontend (`src/`) | frontend token — **TODO: confirm where the Mapbox token is injected; not present in `.env.vercel` at time of writing** | Package: `mapbox-gl`. |
| **Leaflet + leaflet.heat** | Secondary map rendering (heatmaps) | frontend (`src/`) | none (OSS) | No API key. |
| **Recharts** | Chart library | frontend (`src/`) | none | No integration burden. |

### Webhook surfaces

- **Twilio inbound SMS:** `POST https://swoop-member-portal.vercel.app/api/twilio/inbound` — configure in Twilio Messaging Service.
- **Twilio status callback:** `POST https://swoop-member-portal.vercel.app/api/twilio/status` — configure in Twilio Messaging Service.
- **Google OAuth redirect URIs:** `{APP_URL}/api/google/callback` and `{APP_URL}/api/google/signin-callback` — must be registered in the Google Cloud Console OAuth consent screen.

### Rate limits and quotas

A minimal in-memory rate limiter lives in [`api/lib/rateLimit.js`](../../api/lib/rateLimit.js). It is per-instance (serverless cold starts reset it) and should not be relied on as a hard security boundary. **TODO:** move to a durable store (Upstash Redis or Postgres-backed) before production scale.

---

## 9. Multi-tenant onboarding

The 30-day onboarding playbook is documented in [`docs/team/TEAM-STRUCTURE.md § 1.8`](../team/TEAM-STRUCTURE.md). This section documents the operational mechanics.

### Creating a new club

Endpoint: [`api/onboard-club.js`](../../api/onboard-club.js)

- `POST /api/onboard-club` — create a new club and initial admin user.
- `GET /api/onboard-club?clubId=xxx` — fetch onboarding progress.
- `PUT /api/onboard-club` — mark an onboarding step complete.

The 9-step onboarding progress tracked per club:

| # | Key | Label |
|---|---|---|
| 1 | `club_created` | Club profile created |
| 2 | `crm_connected` | CRM / membership system connected |
| 3 | `members_imported` | Member data imported (300+ records) |
| 4 | `tee_sheet_connected` | Tee sheet system connected |
| 5 | `pos_connected` | POS system connected |
| 6 | `health_scores_computed` | Initial health scores computed |
| 7 | `team_invited` | Team members invited |
| 8 | `notifications_configured` | Notification preferences set |
| 9 | `pilot_live` | Club is live |

Progress is stored in `onboarding_progress` (table is created on demand by `api/onboard-club.js`).

### CSV import

Endpoint: [`api/import-csv.js`](../../api/import-csv.js)

- `POST /api/import-csv` with `{ clubId, importType, rows, uploadedBy }`.
- The frontend parses the CSV (client side) and sends rows; the server validates required fields and upserts into the target table using the `columnMap` for each import type.
- Supported import types include `members`, `club_profile`, `membership_types`, `households`, `courses`, `tee_times`, `booking_players`, and more (see constant `IMPORT_TYPES` in `api/import-csv.js`).
- Imports are idempotent when the relevant unique constraints from migration 011 are in place.

### The 30-day onboarding playbook (summary)

See [`docs/team/TEAM-STRUCTURE.md`](../team/TEAM-STRUCTURE.md) for the full version. High-level:

- **Week 1:** Kickoff call. Provision club in `api/onboard-club.js`. Invite the GM. Capture CRM + tee sheet + POS credentials.
- **Week 2:** First data import (members + membership types + courses). First health-score computation run. Weather config (lat/lon).
- **Week 3:** Second import (tee times, bookings, POS checks). Train the GM on the Today View. Configure notifications (email/SMS).
- **Week 4:** Go-live checklist. First Board Report generation. Handoff to customer success.

### Onboarding rollback

If onboarding a club goes wrong and you need to remove them:

1. Freeze their users: `UPDATE users SET status = 'disabled' WHERE club_id = '<id>'`.
2. Delete cascade is **not** automatic (migration 005 dropped FK constraints). You must delete per-table in reverse dependency order.
3. Prefer a soft-delete flag over a hard delete during pilots.

---

## 10. Demo mode

The product has three distinct data modes, controlled by [`src/services/demoGate.js`](../../src/services/demoGate.js):

| Mode | Trigger | Data source |
|---|---|---|
| `live` | `localStorage.swoop_club_id` is set and is not `'demo'` or `demo_*` | **Zero static fallback.** API only. |
| `demo` | no real club id; not in guided mode | All static data from [`src/data/`](../../src/data) |
| `guided` | `sessionStorage.swoop_demo_guided === 'true'` | Static data gated per imported file; each file "unlocks" one gate |

Key API:

- `getDataMode()` — returns `'live' | 'demo' | 'guided'`. Every service getter branches on this.
- `shouldUseStatic(gateId)` — returns `true` if the given gate is open and we should serve static data instead of hitting the API. Always `false` in `live`.
- `isSourceLoaded(gateId)`, `isFileLoaded(fileId)` — guided-mode gate checks.
- `loadFile(fileId, gateId)`, `unloadFile(...)`, `loadAllFiles(...)`, `resetGuidedMode()` — guided-mode mutation.

### When to use demo mode

- **Pilot demos.** Prospects walking through the product at a trade show. Use `demo` mode (full static dataset).
- **Guided demo / sales walkthrough.** Progressive reveal: show the prospect how each data source unlocks new intelligence. Use `guided` mode.
- **Real deployments.** Use `live`. A real `club_id` from the onboarding flow (section 9) automatically puts the app in live mode. No further switch needed.

### How to force live mode for a real club

1. Sign in with a real user whose session row has a non-demo `club_id`.
2. The client stores that `club_id` in `localStorage.swoop_club_id` after login.
3. `getDataMode()` will return `'live'` on subsequent requests.

### How to leave demo mode (for a real deployment)

- Clear `sessionStorage` and `localStorage` in the browser, or call `resetGuidedMode()` + sign in with a real account.
- To disable demo affordances entirely in production, consider wrapping the demo UI in a feature flag gated by `NODE_ENV === 'production'`. **TODO: not implemented.** Today, demo routes are reachable in production to support sales demos; this is intentional but should be audited before broad launch.

---

## 11. Test strategy

### Unit tests

- Runner: **Vitest 2**
- Command: `npm run test`
- Location: co-located with source + anything under `tests/unit/` if present.
- Must pass before any deploy to production.

### End-to-end tests

- Runner: **Playwright 1.59**
- Command: `npm run test:e2e` or `npx playwright test`
- Config: [`playwright.config.js`](../../playwright.config.js) (base URL defaults to `http://localhost:5173`; override with `APP_URL=...` env var to point at a preview or production).
- Location: [`tests/e2e/`](../../tests/e2e)

### Release acceptance gate

The following suite is the **release acceptance gate**. If any test fails, do not deploy to production.

```bash
npx playwright test tests/e2e/storyboard-flows.spec.js
```

These are the 7 storyboard tests covering the 3 canonical flows of the product (See It / Fix It / Prove It). They are the contract with the user and with the North Star.

### Additional tests to run before production

| Suite | File | What it covers |
|---|---|---|
| Storyboard flows (gate) | [`tests/e2e/storyboard-flows.spec.js`](../../tests/e2e/storyboard-flows.spec.js) | The 3 flows, end-to-end |
| Polish finals | [`tests/e2e/polish-final.spec.js`](../../tests/e2e/polish-final.spec.js) | 5 polish regression checks |
| Onboarding | [`tests/e2e/onboarding.spec.js`](../../tests/e2e/onboarding.spec.js) | New-club onboarding path; defaults to production URL |
| Action logging | [`tests/e2e/action-logging.spec.js`](../../tests/e2e/action-logging.spec.js) | `execute-action` audit log |
| Guided demo isolation | [`tests/e2e/guided-demo-isolation.spec.js`](../../tests/e2e/guided-demo-isolation.spec.js) | Gate isolation between users |
| Guided demo progressive | [`tests/e2e/guided-demo-progressive.spec.js`](../../tests/e2e/guided-demo-progressive.spec.js) | Progressive file reveal |
| Guided demo refresh | [`tests/e2e/guided-demo-refresh.spec.js`](../../tests/e2e/guided-demo-refresh.spec.js) | Session persistence across refresh |
| Demo story | [`tests/e2e/demo-story.spec.js`](../../tests/e2e/demo-story.spec.js) | Full demo walkthrough |

### Visual / insights pipeline

- `npm run test:insights` — Playwright run that captures screenshots + behavior traces for LLM critique.
- `npm run insights:full` — capture → generate report → run LLM critique.
- `npm run vision:full` — capture → run Gemini vision critique.

These are not gating, but run them before major UI ships.

### Adding new tests

- E2E specs go under `tests/e2e/`. Use `APP_URL` env var for the base.
- Do not hit production in automated CI runs (onboarding.spec.js currently defaults to production — audit and change it before CI enables full suite).
- Every new storyboard page or flow that ships to production MUST have a corresponding storyboard-flows test.

---

## Appendix A — Quick reference

| Need | Action |
|---|---|
| See prod logs | Vercel dashboard → Project → Logs |
| Roll back prod | Vercel dashboard → Deployments → Promote prior "Ready" to Production |
| Run all migrations | `npm run db:migrate` (uses `scripts/migrate.mjs`) |
| Run one migration | `curl -X POST https://<deploy>/api/migrations/<file>` |
| Rotate a secret | Vercel → Settings → Env Vars → add new → redeploy → delete old → invalidate at vendor |
| Smoke test prod | Section 5 → Smoke tests |
| Who approves a deploy | Product owner (PM), in writing, per PR |
| Paged and nothing is obvious | Section 7 → First responder checklist |

## Appendix B — Known TODOs flagged by this runbook

1. **W2** — Create `/api/health` endpoint. Referenced as part of the smoke-test checklist.
2. **Backups** — Confirm Vercel Postgres backup retention and restore runbook.
3. **Migration runner verification** — `npm run db:migrate` (`scripts/migrate.mjs`) now exists; verify ordering, fail-fast, and per-step reporting before trusting it in production.
4. **Sentry** — Wire browser-side error reporting.
5. **Vercel Analytics / Speed Insights** — Enable and document thresholds.
6. **APM** — Choose and wire Datadog or OpenTelemetry.
7. **Paging** — Stand up PagerDuty / Opsgenie rotation (blocked on hiring per TEAM-STRUCTURE).
8. **Durable rate limit** — Replace in-memory `api/lib/rateLimit.js` with Upstash or Postgres-backed limiter.
9. **Mapbox token location** — Document where the Mapbox GL token is injected; not present in `.env.vercel`.
10. **Production demo route audit** — Decide whether demo routes should be reachable on the production domain and gate them if not.
11. **`tests/e2e/onboarding.spec.js` default URL** — defaults to production; change before CI runs the full E2E suite unsupervised.
12. **CSV import rate limit** — currently disabled in `api/onboard-club.js` for testing; re-enable before production (flagged as a comment in the source).
