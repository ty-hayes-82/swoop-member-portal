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

Where we are today against the 10 criteria above:

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | Storyboard renders on Pinetree | ✅ green | Need a 2nd pilot dataset |
| 2 | Pillar scores ≥ 8 | ⚠️ 8/12 pages | Admin Hub (4), Integrations (5), Profile/Settings (2) — see NORTH-STAR-AUDIT.md |
| 3 | Full Playwright suite green | ❌ 134/258 | **B36** — biggest blocker. Cascade failures. |
| 4 | Real-data dollar figures | ⚠️ partial | Some still hardcoded in demo seeds; needs Data Engineer audit |
| 5 | Source-badge coverage | ⚠️ partial | Drawer parity done in Sprint 1; sweep remaining surfaces |
| 6 | Multi-tenant isolation | ✅ green (Sprints 2–3) | External pen test still pending |
| 7 | `/api/health` reports per-integration sync | ⚠️ partial | Currently DB only; needs sync-status fields |
| 8 | Onboarding playbook proven on fresh club | ❌ not yet | No 2nd pilot live; no Pilot Engineer hired |
| 9 | Runbook completeness | ⚠️ 560 lines | Missing rollback drill, secret rotation playbook, post-mortem template |
| 10 | GM-signed demo build | ❌ no GM yet | Hire / appoint GM |

**Headline:** *Productionization is ~95% done. Finalization is ~70% done.* The remaining gaps are not Sprint 5 work — they are a coordinated, cross-functional finalization arc owned by the GM.

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
| _(populated when phases close)_ | | | | |

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
