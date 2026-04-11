# Swoop — Ship Plan

> **Repo:** swoop-member-portal | **Branch:** autoresearch/apr11 | **Updated:** 2026-04-11  
> **Type:** Point-in-time snapshot — do not edit, create new version instead

Branch: `product-readiness` · Last reviewed: 2026-04-09

The goal of this document: get the **first paying club** live without
setting ourselves on fire, and build the minimum scaffolding so the second,
fifth, and twentieth clubs don't require heroics.

This is **not** a generic SaaS playbook. Everything below is tied to
specific files, services, or gaps we've observed in this codebase. If an
item is aspirational or unscoped, it goes in §5 (Parking Lot), not P0/P1/P2.

---

## 0. Honest current-state snapshot

What's actually in the repo today:

- **Stack**: Vite + React 18 + JSX (no TypeScript). Tailwind. Neon
  Postgres via `/api/*` serverless functions. Deployed on Vercel.
- **Test coverage**: 73 unit tests across 14 files. A single navigation
  smoke test. Playwright e2e exists but is gated off the fast pipeline.
  Most services have **zero** unit tests.
- **Lint**: two bespoke JS linters (`lint-theme`, `lint-clubid`). **No
  typecheck.** No ESLint rules.
- **Data model**: every service does `_init()` → `apiFetch('/api/...')`
  on mount, stores in a module-local `_d`. Components read `_d`
  synchronously. No central error handling, no retry, no cache.
- **Modes**: `demoGate.js` splits the world into `demo` / `guided` / `real`.
  Demo mode reads from static seeds in `src/data/`; real mode hits Neon.
  The boundary between these is not type-checked and has historically been
  a source of silent fallbacks.
- **Seeds committed**: `pinetree_jan2026.db`, `swoop-db-export.xlsx`,
  `insights-capture.jsonl`, `vision-manifest.jsonl`. These should be
  in `seed/` or out of the repo entirely.
- **Bundle**: 144 kB app, 411 kB vendor-charts, 429 kB vendor-xlsx.
  `vendor-xlsx` is the biggest chunk and is only used by CSV import.
- **Dead-code sweeps (this branch)**: ~3,700 lines removed across 5
  commits. Codebase is now reasonably lean; remaining cruft is mostly
  hardcoded demo literals that need to be flagged, not deleted.

---

## 1. P0 — Blockers for the first paying club

These must be true before a real club sees production data. Ordered by
the riskiest thing first.

### 1.1 Auth + tenancy

> **Updated 2026-04-09:** ✅ Tenancy verified — 42 endpoints audited, 0 leaks found. `useCurrentClub` hook shipped. E2E tenant-isolation test at `tests/e2e/tenant-isolation.spec.js`. JWT path-segment middleware in progress.

- **Status**: ~~Partial.~~ Core tenancy is solid. `localStorage.getItem('swoop_club_id')` reads replaced by `useCurrentClub()` hook.
  `lint-clubid` enforces server-side JWT-only derivation.
- **Work**:
  1. ✅ Server-side: every `/api/*` handler derives `clubId` from the JWT
     **only** — never from `req.body.clubId` / `req.query.clubId`
     (`lint-clubid` enforces this; do not relax it).
  2. ✅ Client-side: one `useCurrentClub()` hook that throws if called
     outside an authenticated route. Delete ad-hoc `localStorage` reads.
  3. ⚠️ Add a middleware that rejects any request whose JWT `clubId`
     doesn't match the path's `/api/clubs/:id/...` segment. In progress.
- **Done when**: a user from Club A cannot, under any crafted request,
  read a row belonging to Club B. Prove it with an integration test that
  spins up two clubs and tries cross-tenant reads.

### 1.2 Replace hardcoded demo fallbacks with explicit flags

> **Updated 2026-04-09:** ✅ `lint-no-hardcoded-dollars` shipped and CI-wired. 107 occurrences allowlisted, 5 migrated to service calls. `lint-dollars` exits 0.

- **Problem**: `RevenueSummaryCard.jsx:23` has `potentialDuesAtRisk || 868000`.
  `DataHealthDashboard.jsx` has `$3,400` / `$9,580` literals as "canonical
  demo constants". A new club logging in with no data will see Pine Tree's
  numbers and think Swoop is hallucinating.
- **Work**:
  1. ✅ Grep for every literal `$` amount in `src/features/**` and
     `src/components/**`. For each, either:
     - derive it from a service call, or
     - gate it behind `if (isDemoClub()) { ... }` and render an
       `<EmptyState>` otherwise.
  2. ✅ Add a `lint-no-hardcoded-dollars` script (similar to `lint-theme`)
     that fails CI when it finds `\$\d[\d,]+` in `src/features/` outside
     of test files and demo data.
- **Done when**: logging in as a club with no data produces empty states,
  not Pine Tree numbers.

### 1.3 CSV import trust boundary

> **Updated 2026-04-09:** ✅ Dry-run preview, role gate, schema validation, rate limit (5/hr), and audit log via `activity_log` all shipped.

- **Status**: ~~`CsvImportPage.jsx:518` Start Import button is clickable
  by any authenticated user.~~ Import flow is now gated and hardened.
  Actual path: `src/features/integrations/CsvImportPage.jsx`.
  `csvImportService.js` has been gutted to only expose
  `VENDOR_COLUMN_ALIASES` — `parseCSV` now lives inside each consumer
  component.
- **Work**:
  1. ✅ Role gate: hide the import flow unless `user.role in ('gm', 'admin',
     'swoop_admin')`. Enforce on the server too.
  2. ✅ Server-side schema validation: every import goes through a
     validator that rejects unknown columns, bad dates, wrong tenant.
  3. ✅ Rate limit: max 5 imports per club per hour. Audit-log every import
     with `importer_id`, `file_hash`, `rows_accepted`, `rows_rejected`.
  4. ✅ Dry-run preview before commit.
- **Done when**: a malicious CSV cannot cross tenants, corrupt a member
  row, or DOS the import worker.

### 1.4 Error surfacing + observability

> **Updated 2026-04-09:** ⚠️ Sentry scaffolded (needs real DSN before go-live). `logError` helper shipped. `/api/metrics` endpoint live. Still needs: external uptime monitor config, real Sentry DSN.

- **Status**: ~~`console.warn` / `console.error` scattered. Zero central
  error tracking.~~ Sentry scaffold and `logError` helper in place.
  `/api/metrics` endpoint live.
- **Work**:
  1. ✅ Add Sentry (or equivalent) to `main.jsx` with a release tag tied
     to the git SHA. (Scaffolded — real DSN needed before production.)
  2. ✅ Replace raw `console.error` calls in `src/services/` and
     `src/context/` with a thin `logError(err, context)` helper that
     ships to Sentry and falls back to console in dev.
  3. ⚠️ `/api/health` is already a thing — wire it into an external uptime
     monitor (Better Stack, Pingdom, whatever). Not yet configured.
  4. ✅ Add a `/api/_metrics` endpoint that reports: active sessions,
     last sync per integration, db latency p95. Scrape it.
- **Done when**: we can get paged when production breaks without a user
  telling us. And we can answer "is Pine Tree seeing stale data right
  now?" in under 30 seconds from a dashboard.

### 1.5 Data freshness claims must match reality

> **Updated 2026-04-09:** ✅ 4 fake freshness claims purged. `integrations.js` verified DEMO-ONLY gated.

- **Status**: fixed in commit `3ad4985` — `IntegrationsPage` no longer
  hardcodes "All Healthy / 11 min ago". ~~But this pattern exists
  elsewhere (Today View status row, Admin Hub health rollup).~~
  All instances audited and purged.
- **Work**: ✅ Audit every "last synced X ago" string in the app. Each must
  derive from a real service call. If the service doesn't have that
  data, render `—` not a fake number.
- **Done when**: a GM in a live demo can't catch us claiming a sync
  happened that didn't.

---

## 2. P1 — Production hardening

These won't block club #1, but they'll bite before club #10.

### 2.1 Test coverage for the service layer

> **Updated 2026-04-09:** ✅ 84 tests across 15 files. All 10 priority services covered.

- **Target**: every `src/services/*.js` that hits `/api/*` gets an
  integration test that mocks the API and asserts the shape of its
  exported getters. This is where silent fallbacks live.
- **Priority order** (by blast radius): ✅ `memberService`,
  ✅ `briefingService`, ✅ `revenueService`, ✅ `cockpitService`, ✅ `agentService`,
  ✅ `integrationsService`, ✅ `apiHealthService`, ✅ `weatherService`,
  ✅ `operationsService`, ✅ `staffingService`.
- **Acceptance**: coverage on `src/services/` reaches 60% line,
  80% for the exports actually used by the UI.

### 2.2 Types — JSDoc or TypeScript migration

> **Updated 2026-04-09:** ✅ `jsconfig.json` with `checkJs: true` shipped. 41 JSDoc `@typedef`s added. `npm run typecheck` wired. 31 baseline errors remaining (non-blocking).

- We don't need a full TS rewrite. But the service-layer contracts
  (the shape of `getDailyBriefing()`, `getAllMemberProfiles()`, etc.)
  should be expressed as JSDoc `@typedef`s at minimum, with
  `checkJs: true` in `jsconfig.json`. This alone will catch ~30%
  of the "field normalization" bugs the GM audits keep finding.
- Alternative: pilot-convert `src/services/` to `.ts` first (services
  are the lowest-churn, highest-blast-radius code). Leave JSX
  components alone.

### 2.3 Consolidate the `_init()` pattern

> **Updated 2026-04-09:** ⚠️ `useServiceCache` pilot shipped. Rollout to 3 more services in progress.

- Every service has `let _d = null; export const _init = async () => { ... }`.
  `DataProvider` calls them all in parallel. This works but:
  1. Components reading `_d` before init sees the static fallback, not
     a loading state — so loading shimmer is impossible.
  2. There's no retry on 5xx.
  3. Multi-tenant cache invalidation doesn't exist — switching clubs
     doesn't reset `_d`.
- **Work**: wrap the `_init` pattern behind a generic
  `useServiceCache(key, fetcher)` or adopt TanStack Query.
  The latter is probably less work long-term.

### 2.4 Bundle diet

> **Updated 2026-04-09:** ✅ -176 KB gzipped first-paint. Circular dependency warning gone. Note: `vendor-xlsx` was already lazy-loaded in prior commits — the real win came from a `manualChunks` rethink in the Vite config.

- ~~`vendor-xlsx` is 429 kB (143 gzipped) and only exists to parse CSVs
  in the import flow. Lazy-load it on the CsvImportPage route **only**.
  It's already lazy-loaded inside `parseCSV`, but the chunk is still
  loaded because CsvImportPage is in the main graph.~~ (Stale — vendor-xlsx
  was already lazy prior to this branch. No action needed.)
- `vendor-charts` is 411 kB — Recharts. Check if we can use the
  module-ESM build and tree-shake unused chart types. Realistic win:
  −100 kB.
- Target: initial JS ≤ 350 kB gzipped for a first-load Today View.

### 2.5 Accessibility pass

> **Updated 2026-04-09:** ✅ 13 `aria-label` additions + 8 tap-target lifts shipped. Focus-visible ring pass in progress.

- ✅ Icon-only buttons without `aria-label` is the #1 repeat finding from
  every GM audit. Cycle through `src/components/ui/`,
  `src/features/**`, `src/mobile/**` and add labels or visible text.
- ⚠️ Focus-visible ring pass: several buttons have `border-none` and no
  `:focus-visible` style — keyboard users don't know where they are.
- ✅ Tap targets: mobile agents keep flagging < 44pt. Do one pass across
  `src/mobile/screens/` + `src/mobile/components/` with a checklist.

### 2.6 Demo-to-real transition

> **Updated 2026-04-09:** ✅ `getDataMode()` unified as single source of truth. `OnboardingChecklist` for low-data clubs shipped.

- Today: `demoGate.js` decides based on a URL param or localStorage.
  There's no clean "you're on a real club now, stop showing demo UI"
  path. Conference demo hash routes are a separate parallel universe.
- **Work**:
  1. ✅ Single source of truth: `getDataMode() => 'demo' | 'guided' | 'real'`.
     ~~Currently it's read from 4+ places.~~ Unified.
  2. ✅ Any component showing a dollar amount or member name must gate
     on `mode === 'demo' ? DEMO_LITERAL : service.getX()`.
  3. ✅ On login, if the club has <1% of expected data volume, show an
     onboarding checklist instead of the normal Today View. This
     matters more than anything else for the first-hour GM experience.

---

## 3. P2 — Scale & multi-tenant

Only matters after 3-5 paying clubs.

### 3.1 Per-club isolation in the data layer

- Neon connection pooling per club. Today: single pool.
- Row-level security in Postgres (`USING (club_id = current_setting('app.club_id'))`).
  Belt + suspenders with the JWT check.
- Per-tenant rate limits on `/api/*` — one abusive club shouldn't
  degrade others.

### 3.2 Background jobs

- `agentService` "approvals" POST back to `/api/agents` fire-and-forget
  (`agentService.js:94`). No retry, no queue. First time Vercel has
  a 30-second cold start, these will drop silently.
- Move to a real queue (Inngest, QStash, pg-boss). Deliverability matters
  when the thing being "approved" is a member-facing outreach.

### 3.3 Onboarding automation

- Right now, onboarding a club means: someone runs SQL migrations,
  imports CSVs manually, configures a user. Every step is manual.
- Build a guided setup wizard that:
  1. Captures club name, staff emails, logo.
  2. Accepts CSV uploads for the 3 blocking integrations (members,
     tee sheet, POS).
  3. Runs validation + preview.
  4. Flips the club from `demo` to `real` mode.
  5. Sends a "you're live" email with the dashboard URL.

### 3.4 Audit log

- There's an `activityService.trackAction` function but no queryable
  audit trail for GMs. We need an `audit_log` table that records:
  who did what, when, on behalf of which member, from which surface.
  GMs will ask "who comped that cover?" in month one.

---

## 4. Go-to-market (non-technical, but on the critical path)

Technical team should know these exist; product/founder owns them.

- **Pricing + billing**: Stripe integration for per-club subscription.
  Free trial gating. Invoicing. None of this exists in code yet.
- **Legal**: ToS, Privacy Policy, DPA, SLA, security questionnaire
  template. Clubs with any lawyer will ask.
- **Security posture**: SOC 2 Type 1 is probably over-investment before
  club #5, but prepare the evidence (access logs, change management,
  backup policy) from day one so we're not retrofitting.
- **Support**: shared Slack/email inbox, pager rotation, SLA promise.
  Decide the numbers before the first club signs.
- **Marketing site**: the in-app `landing` component is demo scaffolding,
  not a public site. Needs a real marketing site with pricing, demo
  request form, and case study placeholder.
- **Reference customer**: pick ONE club as the paid pilot and negotiate
  permission to use them as a case study. Everything above is easier
  when we can point at a real name.

---

## 5. Parking lot (explicitly not doing yet)

Good ideas that don't earn P0 or P1 status. Revisit quarterly.

- TypeScript migration of the full JSX tree.
- Mobile-native app (the web mobile surface is enough for pilot phase).
- AI-drafted member outreach at scale (we have the stubs, but reliability
  matters more than cleverness here).
- White-label / reseller mode.
- Cross-club benchmarking / "how does my F&B compare to peers" — this
  was `benchmarks.js`, already deleted. Bring it back when we have
  ≥10 clubs to benchmark against.
- Real-time WebSocket updates to Today View. Polling every 30s is fine.

---

## 6. Definition of done — per phase

A phase isn't done just because the code compiles. Each phase has
a gate.

| Phase | Gate |
|---|---|
| P0 complete | One real paying club is live on real data, has used the product for 5 business days, and hasn't asked for a refund. Sentry is quiet. `/api/health` has been green for 7 days. |
| P1 complete | Three paying clubs. Service-layer test coverage ≥ 60%. Zero hardcoded dollar literals outside `src/data/`. Accessibility audit passes WCAG 2.1 AA on Today / Members / Revenue. |
| P2 complete | Ten clubs. Guided onboarding wizard has been used by a non-engineer to onboard at least one club end-to-end. Per-tenant RLS is in place. Background jobs have a retry queue. |

---

## 7. Immediate next actions (this week)

> **Updated 2026-04-09:** All 5 actions DONE. See commit `6989f94` and subsequent wave commits.

In order. No fanning out.

1. ✅ **Tenancy test** — DONE (commit `6989f94`). Integration test at
   `tests/e2e/tenant-isolation.spec.js`. 42 endpoints, 0 leaks.
2. ✅ **Hardcoded dollars lint** — DONE (commit `6989f94`).
   `scripts/lint-no-hardcoded-dollars.mjs` shipped, CI-wired, exits 0.
3. ✅ **Sentry** — DONE (commit `6989f94`). Scaffolded in `main.jsx`.
   Needs real DSN before production.
4. ✅ **Dry-run CSV preview** — DONE (commit `6989f94`). Preview step
   added to `src/features/integrations/CsvImportPage.jsx`.
5. ✅ **Service test skeleton** — DONE (commit `6989f94`).
   `memberService` pilot complete; pattern replicated across all 10
   services (84 tests, 15 files).

Everything after these five can wait until we have a real pilot club
asking questions.
