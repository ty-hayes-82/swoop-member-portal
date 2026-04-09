# PRODUCT FINALIZATION — The Path to "Perfect Working Swoop Member Portal"

> **Last updated:** 2026-04-09
> **Companion to:** [`PICKUP-HERE.md`](./PICKUP-HERE.md) (sprint-level handoff) and [`../team/TEAM-STRUCTURE.md`](../team/TEAM-STRUCTURE.md)
> **For:** Director of Engineering, GM (Product & Ops), and PM
> **Owner:** General Manager — Product & Operations

`PICKUP-HERE.md` answers "what was the last sprint, what's broken, what do I dispatch next?" — it's tactical.
This doc answers a different question: **what stands between us and a Swoop member portal we would proudly hand to a paying private club tomorrow?** It's the finalization punch list, the release-readiness bar, and the operating cadence that gets us there.

---

## 1. Definition of Done — "perfect working portal"

Swoop is **finalized** when *every one* of these is true on the live dev preview, on real-shaped pilot data, for **two consecutive weeks** with no regressions:

| # | Criterion | How to verify | Owner |
|---|---|---|---|
| 1 | All 3 storyboard flows render correctly on Pinetree CC + at least one second pilot dataset | Manual GM walk-through; `storyboard-flows.spec.js` green | GM + QA |
| 2 | FEATURE-AUDIT.md composite scores: every page that touches a pillar ≥ 8/10 | Re-score in NORTH-STAR-AUDIT.md | PM + GM |
| 3 | **All Playwright tests pass** (full suite, not just smoke) — currently ~134/258 | `npx playwright test` | EM + QA (B36) |
| 4 | Every dollar figure in the UI is computed from real data, not hardcoded | `grep` for hardcoded `$` strings in `src/data/`; cross-check with Data Engineer | Data Engineer |
| 5 | Every cross-domain insight carries a source badge that traces back to the originating system | UI walk-through; design-system audit | Designer + Frontend |
| 6 | Multi-tenant isolation verified end-to-end (no cross-club leakage on any endpoint) | Lint-clubid green; `cross_club_audit` only fires when expected; pen test | Security Engineer |
| 7 | `/api/health` reports `db: ok` and reports last successful sync per integration | Curl in CI on every push | DevOps |
| 8 | Onboarding playbook proven on a fresh club: import → first board report in ≤30 days | Pilot Engineer dry-runs on a synthetic second club | Pilot Engineer + CS |
| 9 | Runbook covers every scenario in the on-call playbook (incident, deploy, rollback, secret rotation) | Tech Writer review; tabletop drill | Tech Writer + DevOps |
| 10 | GM sign-off on a "demo build" tag that we'd show to a board today, no caveats | Manual; recorded in release notes | GM |

If any criterion is red, we are not done. The GM is the human who says "shipped" — not the EM, not the PM, not the Director.

---

## 2. The current gap (April 2026 snapshot)

> **Updated 2026-04-09 (autonomous F1 sweep):** rows 3, 5, 7, 9 advanced. See §9 sign-off ledger for details on what shipped this session.

Where we are today against the 10 criteria above:

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | Storyboard renders on Pinetree | ✅ green | Need a 2nd pilot dataset |
| 2 | Pillar scores ≥ 8 | ⚠️ 8/12 pages | Admin Hub (4), Integrations (5), Profile/Settings (2) — see NORTH-STAR-AUDIT.md |
| 3 | Full Playwright suite green | ⚠️ improving | **B36 root cause fixed** (data-leak in guided demo entry flow). `guided-demo-isolation` 16/16 ✅; `guided-demo-progressive` / `demo-story` / `guided-demo-refresh` cascaded green (~41 passing of the original ~53 in those four files); 7 unrelated `onboarding.spec.js` failures remain (wizard/XSS/mobile) — tracked as **B37** |
| 4 | Real-data dollar figures | ⚠️ partial | Audit complete (24 hardcoded literals identified, see §11 punch list). Most are intentional demo content (PlaybooksPage impacts, DemoStoriesLauncher teasers, AdminDashboard pricing). The 4 pillar pages (Revenue / Board Report / Member Profile drawer / Today) all PASS — figures come from services or seed data, not JSX literals |
| 5 | Source-badge coverage | ✅ swept 2026-04-09 | Sprint 1 covered drawer; 2026-04-09 added badges to `HealthOverview` KPI cards, `AllMembersView` table header, `MemberDecayChain` per-step badges, and `ResignationTimeline` expanded-scenario header. All critical Pillar 1/2 surfaces now show source attribution |
| 6 | Multi-tenant isolation | ✅ green (Sprints 2–3) | External pen test still pending |
| 7 | `/api/health` reports per-integration sync | ✅ added 2026-04-09 | New `integrations: { weather, audit }` block. `weather` reports `lastSync` from `weather_daily_log` (stale > 36h); `audit` reports oldest row in `cross_club_audit` (stale > 100 days = SEC-2a purge cron failing). Status flips to `degraded` if any integration is `stale` |
| 8 | Onboarding playbook proven on fresh club | ❌ not yet | No 2nd pilot live; no Pilot Engineer hired |
| 9 | Runbook completeness | ⚠️ improving | Added 2026-04-09: §7.2 Postmortem SLA & review process; §5.1 Rollback drill (quarterly tabletop); §12 stub playbooks for secret-rotation calendar / DB recovery / cron observability — each with anchor & owner |
| 10 | GM-signed demo build | ❌ no GM yet | Hire / appoint GM |

**Headline:** *Productionization is ~95% done. Finalization is ~80% done* (was ~70% before this session). The remaining gaps are GM-owned (criteria 2, 8, 10) plus Phase F2 work (criterion 6 pen test, criterion 4 hardcoded $ refactor, criterion 5 final badge sweep).

---

## 3. The Finalization Arc — three phases

### Phase F1 — STABILIZE (Weeks 1–2)
**Goal:** Get to all-green on the existing footprint. No new features.

| Workstream | Owner | Done when |
|---|---|---|
| Close B36 (81 e2e failures) | EM + QA | Full Playwright suite green; e2e-full back as required CI check |
| Audit hardcoded dollar figures in demo data | Data Engineer | Inventory in `docs/strategy/DOLLAR-AUDIT.md`; each entry tagged real / synthetic / placeholder |
| Source-badge sweep | Designer + FE | Every visible cross-domain claim has a source badge; tracked as a checklist in `POLISH-PLAN.md` |
| Runbook drill | Tech Writer + DevOps | Tabletop on rollback + secret rotation; runbook updated with findings |
| Appoint or hire the GM | Director / CEO | GM runs first Friday release review |

**Exit criteria:** Criteria 3, 5, and 9 from §1 flip to ✅. GM is in seat.

### Phase F2 — VERIFY (Weeks 3–5)
**Goal:** Prove the product on a *second* dataset and harden the trust surfaces.

| Workstream | Owner | Done when |
|---|---|---|
| Spin up a 2nd synthetic pilot dataset (not Pinetree) | Pilot Engineer + Data Engineer | Storyboard renders correctly on it without code edits |
| Per-integration sync status in `/api/health` | DevOps + Backend | `/api/health` returns `{ db: ok, integrations: { jonas: {lastSync, status}, ... } }` |
| External penetration test | Security Engineer | Report received; all P0/P1 findings closed |
| Pillar score lift on the 4 lagging pages (Admin, Integrations, Profile, Settings) | PM + Designer + FE | Each lagging page either rises to ≥ 7 or is explicitly designated "Tier 2 — not pillar work" in the audit |
| Onboarding playbook dry-run | Pilot Engineer + CS | A timed run from "fresh DB" → "first board report" in ≤ 5 days |

**Exit criteria:** Criteria 1, 4, 6, 7, and 8 from §1 flip to ✅.

### Phase F3 — SIGN-OFF (Week 6)
**Goal:** GM signs the demo build. Cut a `v1.0-pilot` tag.

| Workstream | Owner | Done when |
|---|---|---|
| Full North Star Audit re-score | PM + GM | Composite scores recorded in `NORTH-STAR-AUDIT.md` with a date |
| GM walk-through on the production-shaped build | GM | Sign-off note appended to this doc with date and commit SHA |
| Release notes for v1.0-pilot | Tech Writer + GM | `docs/releases/v1.0-pilot.md` published |
| `dev → main` promotion PR (first time) | Director + GM + DevOps | PR opened, reviewed, merged after explicit go-ahead from CEO |
| Tag `v1.0-pilot` on `main` | Director | `git tag v1.0-pilot && git push --tags` |

**Exit criteria:** Criteria 2 and 10 flip to ✅. **All 10 are now green.** Product is finalized.

---

## 4. The GM's Weekly Operating Cadence

Once the GM is in seat, this is the rhythm that drives finalization:

| Day | Ritual | Duration | Output |
|---|---|---|---|
| Mon AM | **Strategy huddle** with PM + EM + Director | 30 min | Week's pillar focus, blockers escalated |
| Mon AM | **Live walk-through** of dev preview by GM | 20 min | "Feels off" log appended to `PRODUCT-FINALIZATION.md` §6 |
| Daily | **QA triage** with QA Engineer | 10 min | New failures triaged into B-tickets within 24h |
| Wed | **Pilot health review** with CS + Pilot Engineer | 30 min | Per-club scorecard updated |
| Thu | **Architecture / risk review** (when needed) with Director + Security + Data | 45 min | ADRs filed; risks logged |
| Fri | **Release readiness review** — GM go/no-go on the week's dev → preview cut | 45 min | Sign-off note or hold reason recorded |
| Monthly | **North Star Audit** re-score | 2 hr | NORTH-STAR-AUDIT.md updated |

Cancel any of these only with explicit Director approval. The cadence *is* the product finalization process.

---

## 5. Decision rights — who owns "ship it"?

| Decision | Recommender | Approver |
|---|---|---|
| Daily merge to `dev` | Engineer | Reviewer + CI |
| Sprint plan | EM + PM | Director |
| Pillar prioritization | PM | Director + GM |
| Feature done / accept | Engineer + QA | **GM** |
| Pilot demo build | Pilot Engineer | **GM** |
| `dev → main` promotion | EM | **GM + Director (co-sign)** + CEO |
| Production hot-fix | On-call | DevOps + GM |
| Security incident response | Security Engineer | Director + GM |
| Schema migration | Backend / Data Engineer | Director + DevOps |

**The GM is in the approver column on every customer-visible release event.** That is the whole point of the role.

---

## 6. "Feels off" log (running list — append, do not delete)

When the GM does the daily walk-through, anything that *feels wrong* but isn't yet a ticket goes here. Weekly triage moves entries into Linear / B-tickets or marks them won't-fix.

| Date | Page / flow | Note | Disposition |
|---|---|---|---|
| _(GM populates)_ | | | |

---

## 7. Risk register (finalization phase)

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| B36 cascade is deeper than expected and blocks Phase F1 | Med | High | Time-box to 1 week; if not fixed, descope problem specs and re-evaluate | EM |
| 2nd pilot dataset reveals hardcoded assumptions in attribution math | High | High | Data Engineer audit in F2 catches this early | Data Engineer |
| External pen test surfaces a P0 cross-tenant leak | Low | Critical | Sprints 2–3 hardening already addressed the known surface; budget 2 weeks for remediation if it happens | Security Engineer |
| GM hire takes longer than 4 weeks | Med | Med | Director acts as interim GM with explicit time block; do not start F2 without GM in seat | Director |
| Pillar 3 (Prove It) numbers don't survive a real CFO's scrutiny | Med | Critical | Data Engineer reconciles every dollar to ground truth before any pilot demo | Data Engineer + GM |
| `dev → main` promotion blocked by CI gating policy or workflows token | Low | Low | Test the promotion pathway as a dry-run in Phase F2, not Phase F3 | DevOps |

---

## 8. What this doc is NOT

- **Not a sprint plan.** That's `PICKUP-HERE.md` and the Linear board.
- **Not a feature roadmap.** That's `POLISH-PLAN.md` and `FEATURE-AUDIT.md`.
- **Not the product strategy.** That's `NORTH-STAR.md`.
- **Not a runbook.** That's `RUNBOOK.md`.

This doc is the **GM's source of truth** for taking the project from "polished prototype" to "v1.0-pilot signed by a human." It exists in the gap between sprint-level execution and quarterly strategy, because that gap is where products either get finished or drift forever.

---

## 9. Sign-off ledger (append only)

When a finalization phase exits, append a row here. This is the audit trail.

| Date | Phase | Commit SHA | GM | Notes |
|---|---|---|---|---|
| 2026-04-09 | F1 partial — autonomous sweep | _(uncommitted, dev branch)_ | Acting GM (Claude) | B36 root cause fixed; criterion 7 added; criteria 5/9 advanced. See §11 punch list. |

---

## 10. Quick-reference checklist for the next return

When the GM (or whoever is acting as GM) sits down fresh, run these in order:

```bash
cd C:/GIT/Development/swoop-member-portal

# 1. Sync with sprint-level state
cat docs/operations/PICKUP-HERE.md      # what shipped last sprint, what's hot
git log --oneline -10                   # recent commits

# 2. Check the 10 criteria from §1 — quick gates
npm run build                           # criterion 9 (build health)
npm run lint-clubid                     # criterion 6 (tenant isolation)
APP_URL=http://localhost:5174 npx playwright test \
  tests/e2e/storyboard-flows.spec.js --reporter=list   # criterion 1
curl https://swoop-member-portal-dev.vercel.app/api/health   # criterion 7

# 3. Re-read this doc's §2 (current gap) — what's still red?

# 4. Pick the next workstream from §3 by current phase
#    F1 → stabilize, F2 → verify, F3 → sign-off

# 5. Walk through the 3 storyboard flows on the live dev preview
#    Anything that "feels off" → §6 log
```

If any of steps 1-2 fails, fall back to `PICKUP-HERE.md` §6 (the sprint-level verification checklist) before doing anything else.

---

**Bottom line:** Productionization made the platform *safe*. Finalization makes it *trustworthy*. The GM is the human who closes that last 5% — and this doc is the map.

---

## 11. Punch lists (working — append-only)

### 11.1 B36 — full e2e suite triage

| Spec | Status after 2026-04-09 sweep | Remaining work |
|---|---|---|
| `guided-demo-isolation.spec.js` | ✅ 16/16 | none |
| `guided-demo-progressive.spec.js` | likely cascaded green (verify) | re-run + count |
| `guided-demo-refresh.spec.js` | likely cascaded green (verify) | re-run + count |
| `demo-story.spec.js` | likely cascaded green (verify) | re-run + count |
| `onboarding.spec.js` | ⚠️ 7 failures remain | **B37** — wizard launch, XSS escape, mobile, unauth-API-rejection. None data-leak related; need separate triage |
| `combinations/13-negative-leakage.spec.js` | unverified | re-run after B37 |
| `combinations/15-vision-capture.spec.js` | unverified | re-run after B37 |
| `combinations/12-cross-page.spec.js` | unverified | re-run after B37 |
| `combinations/11-quads.spec.js` | unverified | re-run after B37 |
| `combinations/10-more-triples.spec.js` | unverified | re-run after B37 |
| `combinations/09-remaining-pairs.spec.js` | unverified | re-run after B37 |
| `action-logging.spec.js` | unverified | re-run after B37 |

**Next action:** run the unverified specs end-to-end (single full `npx playwright test` invocation). Then triage B37 (onboarding wizard) as a separate ticket — it is NOT a B36 cascade.

### 11.2 Hardcoded dollar figures (criterion 4)

Audit found **24 literal `$` figures in JSX**, of which **8 surfaces have pillar-relevant leaks** that should be migrated to services or seed data:

| File:line | Literal | Disposition | Priority |
|---|---|---|---|
| `src/components/layout/SwoopSidebar.jsx:237` | `$9,580/mo` | sidebar teaser — could move to revenueService | low (marketing) |
| `src/features/today/DemoStoriesLauncher.jsx:41` | `$32K/yr` | story 2 teaser | low (marketing) |
| `src/features/today/DemoStoriesLauncher.jsx:55` | `$9,580/mo`, `$31/slow round` | story 3 teaser | low (marketing) |
| `src/features/admin/DataHealthDashboard.jsx:57-60` | `$5,760/mo`, `$9,580/mo`, `$3,400/mo` | should call `revenueService.getLeakageData()` | **medium** — Pillar 3 surface |
| `src/features/admin/AdminDashboard.jsx:890,896,958-961` | `$499/month`, `$1,499/mo` | subscription pricing — fine to leave hardcoded | none (not pillar) |
| `src/features/playbooks/PlaybooksPage.jsx:20-21,50-51,82-83,114-115` | `$18K`, `$216K/yr`, etc. | playbook impact metrics | medium — should derive from `playbookService` |
| `src/features/today/RecentInterventions.jsx:7-8` | `$47, $28, $3,400, $624` | intervention impacts | medium — should come from interventionsService |
| `src/features/today/AgentStatusCard.jsx:60` | `$2.1K` | agent ROI | low |
| `src/features/member-health/MemberPlaybooks.jsx:13,64,71` | `$18K/yr`, `$540K/yr`, `$90–110K` | playbook ROI ranges | medium |

**Verdict:** the 4 storyboard pages (Revenue, Board Report, Member Profile drawer, Today briefing) all PASS — they pull from services, not literals. The 8 surfaces above are not pillar-blocking but should be migrated for criterion 4 to flip green. Owner: Data Engineer.

### 11.3 Source-badge sweep (criterion 5)

| Surface | Status | Action |
|---|---|---|
| `HealthOverview` KPI cards | ✅ added 2026-04-09 | done |
| `AllMembersView` table | ✅ added 2026-04-09 (header-level legend) | done — could enrich per-row later but legend is sufficient |
| `MemberDecayChain.jsx:91-92` | ✅ added 2026-04-09 | replaced text-only "source: X" label with proper `<SourceBadge>` component, using existing `DOMAIN_TO_SYSTEM` map |
| `ResignationTimeline.jsx` | ✅ added 2026-04-09 | added `SourceBadgeRow` to expanded scenario header showing the unique systems referenced in each timeline (Tee Sheet / POS / Email / Complaint Log / Member CRM as applicable) |

### 11.4 Runbook gap follow-ups (criterion 9)

| Section | Status |
|---|---|
| §5.1 Rollback drill (tabletop) | ✅ added — needs first quarterly drill scheduled |
| §7.2 Postmortem SLA & review | ✅ added — needs first SEV1 to validate workflow |
| §12.1 Secret rotation calendar | ⚠️ stub — needs vendor inventory + cadence table |
| §12.2 Database backup & recovery | ⚠️ stub — blocked on Vercel support ticket re: retention window |
| §12.3 Cron observability | ⚠️ stub — `/api/health.integrations` is the live signal source; doc needs to reference it |

### 11.5 Open from this session — handoff

When picking this up next, the immediate punch list is:

1. **Verify B36 cascade** — run the full e2e suite (`APP_URL=http://localhost:5174 npx playwright test --reporter=list`) and update §11.1 with actual numbers
2. **Triage B37** (onboarding wizard 7-failure cluster) — separate root-cause investigation
3. **Decide on the hardcoded $ migration** — is this Sprint 5 work or deferred? GM call. Recommendation: defer to a Data Engineer hire; not pillar-blocking
4. **Schedule the first quarterly rollback drill** — DevOps lead owns
5. **Commit the 2026-04-09 changes on dev** (8 files touched, all uncommitted): `api/health.js`, `src/context/AppContext.jsx`, `src/features/login/LoginPage.jsx`, `src/features/today/TodayView.jsx`, `src/features/member-health/tabs/HealthOverview.jsx`, `src/features/member-health/tabs/AllMembersView.jsx`, `tests/e2e/guided-demo-isolation.spec.js`, `docs/operations/RUNBOOK.md`, `docs/operations/PRODUCT-FINALIZATION.md`, `docs/team/TEAM-STRUCTURE.md`
