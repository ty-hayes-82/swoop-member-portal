# 5. What "Production-Ready" Actually Means

**Status:** Updated April 4, 2026 with implementation progress

---

## 5.1 P0 -- Must Have Before First Paying Customer

| Item | Original Effort | Status | Notes |
|------|----------------|--------|-------|
| Remove auth password bypass | XS (2-4 hrs) | **DONE** | `api/auth.js` -- requires hash comparison |
| Auth middleware for all API routes | M (16-24 hrs) | **DONE** | `api/lib/withAuth.js` applied to 29 endpoints |
| Add `club_id` to missing tables | M (20-30 hrs) | **DONE** | Migration 007 + schema.sql updated (25+ tables) |
| Wire CSV import to Postgres | M (16-24 hrs) | **DONE** | `api/import-csv.js` already had INSERT logic; auth + club_id added |
| Health score data completeness gate | S (8-12 hrs) | **DONE** | Requires 2+ dimensions; `data_completeness` column added |
| Services render real data via API | L (30-40 hrs) | **DONE** | All 15 `_init()` functions use authenticated `apiFetch()` |
| Demo mode toggle | S (8-12 hrs) | **DONE** | LoginPage demo mode + `withAuth` demo support |
| Remove hardcoded DB credentials | XS (1 hr) | **DONE** | `scripts/reseed-pipeline-leads.mjs` fixed |
| Create `.env.example` | XS (1 hr) | **DONE** | Created at project root |

**Remaining P0 work:**

| Item | Effort | Status |
|------|--------|--------|
| End-to-end test with real Jonas CSV | S (4-8 hrs) | Not started |
| Empty state components for sparse data | S (8-12 hrs) | Not started |
| Password reset flow | S (8-12 hrs) | Not started |
| Onboarding runbook for Swoop team | S (4-8 hrs) | Not started |
| Dry run: create synthetic club, import data, verify all pages | M (16-24 hrs) | Not started |

**Remaining P0 effort: ~40-64 hours (1-2 weeks at 1 engineer)**

## 5.2 P1 -- Within 90 Days of First Customer

| Item | Effort | Status |
|------|--------|--------|
| Board Report with real data | M (20-30 hrs) | API endpoint exists, auth applied |
| Jonas CRM API connector | L (40-60 hrs) | Not started |
| Playbook execution tracking | M (16-24 hrs) | UI exists, no backend persistence |
| Email notifications (SendGrid) | S (8-12 hrs) | API endpoints exist, partially wired |
| Code-split dashboard chunk | S (4-8 hrs) | **DONE** -- 938KB -> 132KB largest chunk |
| Fix stale test | XS (1 hr) | **DONE** -- 12/12 tests passing |
| Frontend RBAC (nav filtering by role) | S (8-12 hrs) | Middleware supports it, UI not wired |
| Fix ANTHROPIC_API_KEY env var mismatch | XS (1-2 hrs) | Open (see 01 §1.6) |
| Clean retention-centric language in services | S (4-8 hrs) | Not started (see 01 §1.1 Phase 4) |

## 5.3 P2 -- Moat Builders (6+ months)

| Item | Effort | Status |
|------|--------|--------|
| Canonical event stream pipeline | L (60-80 hrs) | `seed/linkers/canonical.py` exists |
| Cross-domain correlation engine | XL (80-120 hrs) | `api/compute-correlations.js` exists (basic) |
| ForeTees API connector | L (40-60 hrs) | Not started |
| Toast POS connector | L (40-60 hrs) | Not started |
| Clubessential suite connector | L (40-60 hrs) | Not started |
| Mobile app production | XL (120-160 hrs) | Shell exists (4 screens) |
| Self-service onboarding wizard | L (40-60 hrs) | Onboarding endpoint exists |
| Row-level security (Postgres RLS) | M (20-30 hrs) | Not started |

## 5.4 T-Shirt Size Reference

| Size | Hours | Calendar (1 eng) | Calendar (2 eng) |
|------|-------|-------------------|-------------------|
| XS | 1-4 | 1 day | 1 day |
| S | 8-12 | 1-2 days | 1 day |
| M | 16-30 | 3-5 days | 2-3 days |
| L | 40-60 | 1-2 weeks | 1 week |
| XL | 80-160 | 2-4 weeks | 1-2 weeks |

## 5.5 Concierge vs Automated

**Concierge for first 5 clubs:**
- Data onboarding: Swoop team exports Jonas CSV, uploads via CSV UI, runs health score computation
- Club configuration: Swoop team runs `POST /api/onboard-club`
- User creation: Swoop team creates GM user with hashed password
- Support: Swoop team monitors health scores for nonsensical results

**Automated from Day 1:**
- Auth (login/logout/session management)
- Health score computation (triggered after data import)
- Data rendering (once data is in Postgres, UI shows it)
- Demo mode (automatically separates demo from real tenant data)
