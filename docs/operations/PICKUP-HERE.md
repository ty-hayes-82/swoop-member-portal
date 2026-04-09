# PICK UP HERE — Sprint 5 Starting State

> **Last updated:** 2026-04-09 (end of Sprint 4)
> **Latest commit on `dev`:** `1dbd7ed` — "Sprint 4: lock down weather GET, audit cron, full e2e CI, defense-in-depth"
> **For:** Director of Engineering returning fresh after a break

Read this file first when picking up. It's a complete handoff: where things stand, what's safe, what's risky, and what to do next.

---

## 1. Current state in 60 seconds

**Branch:** `dev`. Latest commit `1dbd7ed`. Working tree clean except `.claude/settings.local.json` (personal, intentionally unstaged).

**Live dev preview:** https://swoop-member-portal-dev.vercel.app (Vercel auto-deploys from the `dev` branch). `/api/health` should return `status: ok`.

**Sprints 1-4 shipped on `dev`** in this order (most recent first):
| Commit | Sprint | One-line description |
|---|---|---|
| `1dbd7ed` | Sprint 4 | Weather lockdown, audit cron, full e2e CI, defense-in-depth |
| `f62f065` | Sprint 3 | Tenant safety: getClubId split, cross-club audit, ops script relocation |
| `de9fd29` | Sprint 2 | Backend hardening: gate operator endpoints, lint clubId, secure cron + webhooks |
| `d22b7ac` | Sprint 1 | Productionization: CI, security, observability, runbook, polish |
| `bb26343` | Pre-sprint | Add development team structure document |

**Local gates as of last verification:**
- `npm run build` ✅
- `npm run lint-theme` ✅ 0 violations
- `npm run lint-clubid` ✅ 0 violations
- `npm test` (vitest) ✅ 51/51
- `npx playwright test storyboard-flows polish-final` ✅ **12/12** (the smoke set CI gates on)
- `npx playwright test` (FULL suite) ❌ **134/258 pass, 81 fail, 38 didn't run** — see §4

**CI jobs on GitHub Actions** (run on every push to `dev`): `lint`, `unit`, `build`, `e2e-smoke` (gates merge), `e2e-full` (informational, will be RED until B36 is closed — see §4).

---

## 2. The biggest finding from Sprint 4 — READ THIS FIRST

When B32 extended CI to run the **full** Playwright suite (was only running 12 smoke tests before), it surfaced **81 pre-existing test failures** in the broader e2e suite that nobody has been catching. These are NOT regressions from Sprint 1-4 work — they predate the productionization effort. They're surfaced now because we finally point CI at the full suite.

**Failures by file:**
| Spec | Failures |
|---|---|
| `tests/e2e/guided-demo-progressive.spec.js` | 21 |
| `tests/e2e/guided-demo-isolation.spec.js` | 16 |
| `tests/e2e/onboarding.spec.js` | 11 |
| `tests/e2e/guided-demo-refresh.spec.js` | 8 |
| `tests/e2e/combinations/13-negative-leakage.spec.js` | 8 |
| `tests/e2e/demo-story.spec.js` | 5 |
| `tests/e2e/combinations/15-vision-capture.spec.js` | 5 |
| `tests/e2e/combinations/12-cross-page.spec.js` | 2 |
| `tests/e2e/combinations/11-quads.spec.js` | 2 |
| `tests/e2e/combinations/10-more-triples.spec.js` | 1 |
| `tests/e2e/combinations/09-remaining-pairs.spec.js` | 1 |
| `tests/e2e/action-logging.spec.js` | 1 |

**Many of these look like cascade failures from a broken `beforeAll` setup** — a single root cause may fix dozens. The 38 tests that "didn't run" are downstream of beforeAll failures.

**Tracked as ticket B36 in the task list. P1.**

### What to do RIGHT NOW about it

**Option A — exclude e2e-full from required checks (recommended):**
1. Go to https://github.com/ty-hayes-82/swoop-member-portal/settings/branches
2. For the `dev` branch (and `main` if protected), under "Status checks that are required to pass before merging", make sure **`E2E full suite (all tests/e2e/*.spec.js)`** is **NOT** in the required list. Keep `E2E smoke (storyboard + polish-final)` required.
3. Without this, every PR will be blocked by 81 failing tests until B36 is fixed.

**Option B — leave it required and triage immediately:** dispatch a triage agent (B36) to investigate the cascade. Likely 1-2 hours of work. The fix is probably small (one shared helper), but the surface is large.

**My recommendation: do A first (1 minute), then schedule B as Sprint 5's Wave A first ticket.**

---

## 3. What was shipped in each sprint (high-level)

### Sprint 1 (`d22b7ac`) — Productionization
CI workflow (didn't exist before), `/api/health`, `.env.example`, runbook, database doc, ADR-001 (rate-limit persistence), migration runner with safety guard, audit refresh, Member Profile Page parity, drawer source-badge consistency, Board Report saves clickable, tee sheet dues tooltip, briefing scroll-to-alerts, 160 → 0 lint-theme violations, fixed real `briefingService.yesterdayRecap.revenue` regression (was returning undefined in production), 4 new service test suites, polish-final Playwright spec, 8 W3 audit security fixes.

### Sprint 2 (`de9fd29`) — Backend hardening
23 operator endpoints (`api/seed-*`, `fix-*`, `check-*`, `schema-*`, `debug-*`) hardened to 404+logWarn pattern. CRON_SECRET on weather-daily. Twilio webhook signature validation (pure-crypto HMAC). `api/weather.js` POST tag-complaint paths require session. Waitlist explicit join filters (caught a heatmap query with zero club_id filter). `create-invoices-table.js` deleted. New `lint-clubid` linter caught 12 W3 escapes which were all fixed.

### Sprint 3 (`f62f065`) — Tenant safety (the big one)
**SEC-1** split `getClubId` into `getReadClubId` (admin override allowed) + `getWriteClubId` (default-deny). Migrated all 36 callsites. Only `pause-resume.js` opts into `allowAdminOverride: true` (it's swoop_admin gated by design). **SEC-2** added `cross_club_audit` table (migration 015) + `withAdminOverride` wrapper that logs every cross-club admin write to forensic table. **SEC-3** locked down `activity DELETE` with confirm token. **SEC-4** stopped reading actor identity from request body — now from `req.auth.userId`. Plus 23 operator scripts moved out of `api/` to `scripts/operator/` (no longer deployed as routes), schema gap closed (migration 014 creates `member_invoices`), test gating upgrades.

### Sprint 4 (`1dbd7ed`) — Lockdown + observability + CI maturation
- **B19**: weather GET `?clubId=` requires auth (was public)
- **B28**: `verifySession` returns discriminated union, distinguishing 401 from 500
- **SEC-2a**: nightly purge cron for `cross_club_audit` (90-day retention)
- **#57**: activity DELETE upgraded to support cross-club wipe (with the SEC-2 audit wrapper logging it)
- **B31**: pause-resume table moved to migration 016, feature_state_log accuracy fix
- **B32**: CI split into e2e-smoke (gates) + e2e-full (informational, will surface B36)
- **B33**: weatherService uses apiFetch (was raw fetch — never sent Bearer)
- **B34**: club.js PUT explicit isDemo gate
- **B35**: demo role renamed `viewer` → `demo` (prevents future viewer-role gates from accidentally accepting demo traffic)
- **SEC-7**: read-only audit of allowDemo + getClubId combos — verdict: zero footguns

---

## 4. Open backlog (Sprint 5 candidates)

| ID | Priority | Title | Notes |
|---|---|---|---|
| **B36** | **P1** | Triage 81 e2e regressions | NEW from B32. Likely cascade from a few shared helpers. Start here. |
| **B23** | low | Delete v1 fix-cancel.js / seed-fix.js duplicates | Time-gated to 2026-04-19 |
| **SEC-5** | P2 | Admin UI confirmation modal on cross-club writes | Needs design discussion |

Lower-priority items I'd carry but not block on:
- Tighten `e2e-full` once B36 is clean and add it back to required checks.

---

## 5. Two outstanding product questions for the user

These need a human decision before they can be dispatched:

1. **B36 triage approach** — should I auto-fix obvious cascades (a single shared `beforeAll` fix) or do a deeper investigation first? Default: auto-fix the cascade, then re-run, then look at residuals.

2. **SEC-5 design** — when a swoop_admin clicks a write button that targets another club, should the frontend (a) intercept on the route level and show a generic "you are about to write to $CLUB" modal, or (b) require backend cooperation to mark certain endpoints as "needs confirm" via response header, or (c) skip this and just rely on the audit log? Default: (a) is the simplest.

---

## 6. How to verify the current state (checklist for return)

When you sit down fresh, run these in order:

```bash
cd C:/GIT/Development/swoop-member-portal

# 1. Confirm working tree
git status                              # should only show .claude/settings.local.json
git log --oneline -5                    # latest should be 1dbd7ed

# 2. Confirm local gates
npm run build                           # should pass
npm run lint-theme                      # 0 violations
npm run lint-clubid                     # 0 violations
npm test                                # 51/51

# 3. Confirm smoke e2e (the gate)
APP_URL=http://localhost:5174 npx playwright test \
  tests/e2e/storyboard-flows.spec.js \
  tests/e2e/polish-final.spec.js \
  --reporter=list                       # 12/12

# 4. Confirm live deploy
curl https://swoop-member-portal-dev.vercel.app/api/health
# expect: {"status":"ok","db":"ok",...}

# 5. (Optional) confirm the e2e-full failures are still ~81 (not worse)
APP_URL=http://localhost:5174 npx playwright test --reporter=list
# expect: ~134 passed / ~81 failed / ~5 skipped / ~38 did not run
# if numbers got dramatically worse, something regressed since 1dbd7ed
```

If anything in steps 1-4 fails, STOP and investigate before dispatching new work. If only step 5 changed, that's diagnostic info for B36.

---

## 7. How to dispatch Sprint 5 (the recipe that worked)

Mission: clear B36 first, then SEC-5, then revisit `e2e-full` gating.

Read these memory files BEFORE dispatching anything:
- `C:\Users\tyhay\.claude\projects\C--GIT-Development-swoop-member-portal\memory\MEMORY.md` (the index)
- `feedback_director_mode.md` — the parallel-fan-out pattern
- `feedback_agent_dispatch_pattern.md` — the 529-overload mitigation pattern (cap reports at 200 words, foreground for small tasks, trust the file system over notifications)
- `feedback_no_prod_deploy.md` — never `vercel --prod`, `dev` only
- `feedback_long_running.md` — batch fixes, minimize round trips
- `project_north_star.md` — See It · Fix It · Prove It

Then dispatch B36 as Wave A (single agent — large investigation). Brief: "Run `npx playwright test --reporter=list`. Triage the failures by file. Look for shared `beforeAll` patterns that might be the root cause of guided-demo-* cascade. Fix the obvious shared cause first; report what fell out. Don't fix everything in one agent — report findings, let me dispatch followups."

After B36 is clean, the path is clear to gate `e2e-full` as required and close out the productionization arc.

---

## 8. Key files / locations cheat sheet

| What | Where |
|---|---|
| Strategy / North Star | `docs/strategy/NORTH-STAR.md`, `docs/strategy/NORTH-STAR-AUDIT.md`, `docs/strategy/FEATURE-AUDIT.md` |
| Operations runbook | `docs/operations/RUNBOOK.md` (560+ lines, deploy/incident/monitoring) |
| Database doc | `docs/operations/DATABASE.md` (16 migrations documented) |
| ADRs | `docs/operations/ADR-001-rate-limit-persistence.md` |
| Auth core | `api/lib/withAuth.js` (verifySession, withAuth, getReadClubId, getWriteClubId) |
| Cross-club audit wrapper | `api/lib/withAdminOverride.js` |
| Migration runner | `scripts/migrate.mjs` (safe by default; needs `--apply` to mutate) |
| Lint-clubid | `scripts/lint-clubid.mjs` (custom linter, gated in CI) |
| Operator scripts | `scripts/operator/` (was `api/`, moved in Sprint 3) |
| CI workflow | `.github/workflows/ci.yml` (5 jobs: lint, unit, build, e2e-smoke, e2e-full) |
| Test fixtures | `tests/e2e/*.spec.js` (137-258 tests depending on which subset) |
| Pinetree CC demo data | `src/data/` (see `briefingService` etc.) |

---

## 9. Things that are easy to forget

1. **Vercel auto-deploys `dev` on push.** Every push to `origin/dev` triggers a fresh preview. Smoke-test via `/api/health` after.
2. **Never `vercel --prod`.** Per standing memory. Production deploys are gated on a manual `dev → main` PR with explicit approval.
3. **`scripts/migrate.mjs` is dry-run by default.** Pass `--apply` to actually mutate the DB. The safety guard was added in Sprint 1 (B9) after an agent inadvertently applied 13 migrations against the dev DB.
4. **`getClubId` is deprecated.** Use `getReadClubId` or `getWriteClubId(req, opts)`. The deprecated alias still works for back-compat.
5. **`req.auth.isDemo` is the canonical demo check.** `req.auth.role === 'demo'` works after Sprint 4 (B35) but `isDemo` predates it and is still the cleaner gate.
6. **Background agents silently 529.** When a notification is overdue, check the file system directly with grep/Read. The work usually landed; only the agent's final report failed.
7. **The CI workflow file requires the GitHub PAT to have the `Workflows` permission.** First-time pushes that touch `.github/workflows/ci.yml` will be rejected if the token doesn't have it. Fine-grained PATs need "Workflows: Read and write" under Repository permissions.

---

## 10. Phone-a-friend / where to look when stuck

- **A test is failing and I don't know why** → check `test-results/` (Playwright traces). For vitest, see the verbose output.
- **A build is failing** → check `dist/` is not stale. `git clean -fdX` cleans build artifacts.
- **A migration's broken** → don't run it. Read `docs/operations/DATABASE.md` first. Migrations 003-005 have a constraint-hell history; 007 + 009 enforce club_id; 014 created member_invoices retroactively; 015 is the cross_club_audit; 016 is pause_state.
- **An endpoint is returning 401 unexpectedly** → after B28, this means the helper actually couldn't find a valid session. After B19, this also means weather GET `?clubId=` wants auth. Check whether the caller is using `apiFetch` (sends Bearer) vs raw `fetch` (doesn't).
- **An endpoint is returning 500 with "Authentication service error"** → that's the new B28 distinction. The Postgres `sessions` table query threw. Probably DB outage. Check Vercel function logs.
- **A swoop_admin support op did the wrong thing on the wrong club** → grep `cross_club_audit` table for `target_club_id` filter. SEC-2 logs everything.

---

**You're in good shape. The productionization arc is ~95% done. The remaining 5% is B36 (triage the e2e regressions) and SEC-5 (admin confirmation UX). Take your break — the branch will be exactly where you left it.**
