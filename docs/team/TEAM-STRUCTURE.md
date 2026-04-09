# Swoop Golf — Development Team Structure

> **Purpose:** Define the full development team needed to take Swoop from polished prototype to a market-ready, scalable platform.
> **Anchor:** Every role exists to serve the [North Star](../strategy/NORTH-STAR.md) — *See It · Fix It · Prove It*.
> **Date:** April 9, 2026

---

## Executive Summary

Today, Swoop is a strategy-aligned prototype with an ~98% pillar-aligned UX and 7 passing storyboard E2E tests. To take it to market, we need a structured team that converts that polish into a **scalable, reliable, secure** product with predictable delivery cadence and 24/7 operational confidence.

This document defines the **8 core roles**, their responsibilities, how they collaborate around the North Star, and what changes about our day-to-day workflow once the team is in place.

---

## 1. Core Team Structure

### 1.1 Director of Engineering
**Mission:** Set the technical vision and ensure the platform scales with the business.

**Owns:**
- Long-range technical strategy and architecture decisions
- Hiring, mentoring, and team structure
- Budget for tooling, infrastructure, and headcount
- Final escalation point for technical risk
- Alignment between engineering output and the North Star pillars

**Day-to-day:**
- Reviews architecture decision records (ADRs) before they ship
- Sits in PM/Design/Engineering tri-weekly syncs
- Owns the engineering roadmap (3- to 6-month horizon)
- Conducts 1:1s with the Engineering Manager and senior engineers
- Reports engineering health metrics to the executive team

**North Star alignment:**
- Ensures every architectural decision can be traced back to See It / Fix It / Prove It
- Vetoes work that doesn't ladder up to a pillar (or explicitly enable one)
- Owns the data integration strategy (Layer 3 cross-domain synthesis is the moat)

---

### 1.2 Engineering Manager
**Mission:** Day-to-day execution of the engineering roadmap. Translate strategy into shipped sprints.

**Owns:**
- Sprint planning, retrospectives, and standups
- Engineer workload balancing and unblock-everyone responsibility
- People management for engineers (career growth, performance reviews)
- Liaison between engineers and the Director / Product Manager
- Velocity, lead time, and cycle time metrics

**Day-to-day:**
- Runs daily 15-minute standups
- Plans 2-week sprints with the PM and Tech Lead
- Pairs with QA on test plan reviews
- Removes blockers (vendor issues, scope creep, dependency tangles)
- Escalates to Director on trade-offs that affect timeline or quality

**North Star alignment:**
- Every sprint must include at least one item that serves a pillar directly
- Refuses sprints that are 100% Tier 2 / infrastructure work
- Ensures the [POLISH-PLAN.md](../strategy/POLISH-PLAN.md) and [FEATURE-AUDIT.md](../strategy/FEATURE-AUDIT.md) inform sprint priorities

---

### 1.3 Software Engineers (Frontend / Backend / Full-Stack)

**Suggested initial composition:** 1 senior frontend, 1 senior backend, 2 mid-level full-stack. Scale to 6+ as needed.

#### 1.3a. Senior Frontend Engineer
**Mission:** Own the React component layer, the design system, and pixel fidelity across the app.

**Owns:**
- React/Tailwind component library (`src/components/ui/`)
- Storybook (when introduced) and visual regression testing
- Performance: bundle size, code splitting, lazy loading, animation perf
- Accessibility (WCAG AA compliance)
- The 3 storyboard pages: Today, Member Profile, Revenue, Board Report

**North Star alignment:**
- Owns the Pillar 1 (See It) UX — every cross-domain synthesis must render correctly
- Implements source badges, evidence strips, and decay sequence visualizations
- Owns the demo polish that wins pilot meetings

#### 1.3b. Senior Backend Engineer
**Mission:** Own the data layer — ingestion, transformation, the cross-domain intelligence engine, and the API surface.

**Owns:**
- Database schema and migrations (Postgres / Supabase / Vercel)
- Service layer (`src/services/`) and REST API endpoints
- The cross-domain attribution algorithms (pace-to-dining, decay sequence, leakage decomposition)
- Vendor integrations: Jonas, ForeTees, Northstar, ADP, etc.
- Background jobs, scheduled syncs, data freshness monitoring

**North Star alignment:**
- Owns the **Layer 3** competitive moat — the algorithms that connect tee sheet × POS × scheduling × email × member CRM
- Ensures every dollar attribution figure ($31/slow round, $9,580/mo leakage) is computable from real data, not hardcoded
- Owns the data trust pipeline that powers Pillar 1 (See It) and Pillar 3 (Prove It)

#### 1.3c. Full-Stack Engineers (×2)
**Mission:** Ship features end-to-end across the stack. Bridge frontend and backend work.

**Owns:**
- New feature development per sprint priorities
- Bug triage and fixes
- Test coverage (unit + integration)
- Onboarding new vendor integrations
- Documentation of features they ship

**North Star alignment:**
- Every feature ticket must reference a pillar in its description
- Pair with Designer on UX implementation and with QA on acceptance tests
- Treat the [POLISH-PLAN.md](../strategy/POLISH-PLAN.md) as a backlog of pillar-aligned work

---

### 1.4 Product Manager (PM)
**Mission:** Own the **what** and the **why**. Translate market needs into prioritized roadmap items.

**Owns:**
- Product roadmap (3-month rolling)
- User research and customer discovery
- Pilot club relationships (currently Bowling Green CC, Pinetree CC)
- Competitive intelligence (Jonas MetricsFirst, ForeTees, Northstar, Club Prophet)
- Pricing and packaging
- Pillar prioritization — final say on which items in [POLISH-PLAN.md](../strategy/POLISH-PLAN.md) ship next
- Authoring user stories with clear acceptance criteria tied to pillars

**Day-to-day:**
- Customer interviews 2-3x per week
- Roadmap reviews with engineering and design
- Demo-watching sessions with prospects
- Sprint priority calls with Engineering Manager
- Maintains the FEATURE-AUDIT.md scoring as features ship

**North Star alignment:**
- Owns the **storyboard fidelity** — the [demo storyboard](../swoop_demo_storyboard.md) is the source of truth for what "great" looks like
- Refuses any feature request that doesn't serve at least one pillar
- Reports every quarter on how each pillar's score has progressed (per FEATURE-AUDIT.md)

---

### 1.5 UI/UX Designer
**Mission:** Own the look, feel, interaction, and storytelling of the product.

**Owns:**
- Design system (Tailwind tokens, theme, typography, color)
- Figma source of truth for every page
- Interaction patterns (hover states, animations, loading skeletons, empty states)
- Storyboard moments — visual fidelity to the 3 demo flows
- Accessibility design (color contrast, focus states, screen-reader flows)
- Onboarding and first-run experience

**Day-to-day:**
- Wireframes and high-fidelity mockups for upcoming sprints
- Pairs with Frontend on implementation reviews
- Conducts user testing on prototypes before they hit dev
- Maintains the design system documentation
- Reviews every PR with visible UI changes

**North Star alignment:**
- Owns visual prominence of the 3 storyboard flows (the Demo Stories Launcher, sidebar, etc.)
- Ensures the **First Domino** decay sequence reads as a story, not a chart
- Designs the print stylesheets for the Board Report PDF export
- Owns the "Layer 3" tagging language and visual vocabulary

---

### 1.6 QA Tester / Engineer
**Mission:** Advocate for quality. Catch defects before they ever reach pilot clubs.

**Owns:**
- Test plans for every new feature (with pillar-aligned acceptance criteria)
- Manual exploratory testing on staging before each release
- Automated test suite (Playwright E2E, Vitest unit tests)
- Bug triage and reproduction documentation
- Regression test maintenance
- Demo-readiness checks before every pilot meeting

**Day-to-day:**
- Writes Playwright tests for every new feature alongside the engineer who built it
- Reviews PRs from a quality lens (edge cases, error states, accessibility)
- Maintains the storyboard flows test (`tests/e2e/storyboard-flows.spec.js`)
- Runs weekly visual regression checks (Gemini critique pipeline)
- Tracks bug escape rate: how many bugs reach production after passing tests

**North Star alignment:**
- The 3 storyboard flows are the **acceptance test suite** — they must always pass
- Treats the [FEATURE-AUDIT.md](../strategy/FEATURE-AUDIT.md) as a "must keep working" checklist
- Owns "shift-left" quality: testing happens during development, not after
- Authors test cases derived from the demo storyboard

**Existing automation (already in place):**
- `tests/e2e/storyboard-flows.spec.js` — 7 tests covering all 3 storyboard moments
- `tests/e2e/demo-story.spec.js` — 5 demo moment tests
- `scripts/gemini-critique.mjs` — visual QA via Gemini 2.5 Flash
- `scripts/qa-full-test.mjs` — full regression sweep

---

### 1.7 DevOps / Platform Engineer
**Mission:** Make deployment, infrastructure, and CI/CD invisible to the rest of the team.

**Owns:**
- Vercel deployment pipeline (currently `dev` branch only — no prod yet)
- GitHub Actions CI: build verification, test runs, lint checks
- Database migrations and backups (Postgres / Vercel Postgres)
- Secrets management (`.env.vercel`, API keys, OAuth credentials)
- Monitoring and alerting (uptime, error rates, API latency)
- Cost optimization (Vercel functions, DB queries, vendor APIs)
- Multi-tenant infrastructure as we onboard more clubs
- Disaster recovery and incident response

**Day-to-day:**
- Reviews and merges deployment-related PRs
- On-call rotation for production incidents
- Maintains the staging environment that mirrors production
- Documents runbooks for common operations
- Owns the "no production deploys without DevOps approval" gate

**North Star alignment:**
- Ensures Pillar 1 (See It) data freshness — when a vendor sync breaks, DevOps gets paged
- Owns the trust signals: uptime, data sync status, error budgets
- Builds the infrastructure for the Data Health dashboard (Phase L Admin work)

---

### 1.8 Customer Success / Onboarding Specialist *(post-pilot)*
**Mission:** Bridge the gap between the product and the pilot clubs. Make sure every club gets to "the briefing works" within 30 days.

**Owns:**
- Pilot club onboarding (data import, integration setup, training)
- The 30-day onboarding playbook: from CSV import → first board report
- Member success metrics: time-to-first-insight, time-to-first-saved-member
- Escalation path from clubs to engineering (bug reports, feature requests)
- Demo-to-pilot conversion tracking
- Documentation, help articles, and video walkthroughs

**North Star alignment:**
- Owns the moment of truth: when a real GM first sees their own real $X,XXX/mo leakage number
- Reports demo-stopping moments back to PM and Design for further polish
- Maintains the "demo-readiness" checklist for pilot meetings

---

## 2. Reporting Structure

```
              Founder / CEO
                   |
        ┌──────────┼──────────┐
        |          |          |
   Director of    PM        Customer
   Engineering              Success Lead
        |
   ┌────┴────┐
   |         |
   EM      DevOps
   |
   ├─ Senior Frontend
   ├─ Senior Backend
   ├─ Full-Stack #1
   ├─ Full-Stack #2
   ├─ UI/UX Designer (dotted line to PM)
   └─ QA Engineer (dotted line to PM)
```

**Notes:**
- UI/UX Designer reports solid line to EM but works closely with PM on roadmap design.
- QA Engineer reports solid line to EM but is empowered by PM to block releases that fail acceptance criteria.
- DevOps is a peer to EM, both report to Director.
- Customer Success is a separate function that reports to CEO directly during pilot phase, then folds under a future Head of Customer Success or VP Sales.

---

## 3. Sample Sprint Cadence (2-week sprints)

| Day | Activity | Owners |
|---|---|---|
| **Mon W1** | Sprint planning (2hr) — review backlog, commit to sprint goals | EM, PM, all engineers |
| **Daily** | Standup (15 min) — yesterday/today/blockers | EM facilitates |
| **Wed W1** | Design review — Designer walks through upcoming UI work | Designer, FE, PM |
| **Thu W1** | Tech architecture review (when needed) — ADRs | Director, Senior engineers |
| **Fri W1** | Bug triage + grooming | QA, EM, PM |
| **Mon W2** | Demo prep — what's shipping this sprint | All |
| **Wed W2** | Pilot client check-in (when applicable) | PM, CS, demo presenter |
| **Fri W2** | Sprint review + retro (2hr) | Everyone |
| **Fri W2 EOD** | Sprint deploy to dev | DevOps, EM |

---

## 4. Key Workflow Changes (from solo dev to structured team)

### What changes immediately

| From | To |
|---|---|
| Informal Slack/voice requests | Structured user stories in Linear/Jira/Shortcut with acceptance criteria |
| "Push when it builds" | PR review by another engineer + QA approval before merge |
| Single dev branch | `dev` (continuous), `staging` (pre-release), `main` (production) |
| Manual smoke testing | Automated Playwright + Vitest + Gemini critique on every PR |
| Memory files for tribal knowledge | Confluence/Notion for living documentation |
| Ad-hoc deploys | Scheduled releases on a 2-week cadence, with hot-fix exception process |
| One person owns everything | Clear OWNERS file for each major area |
| No formal testing role | QA in every sprint planning, every PR, every release |
| Single environment | Three environments: local → staging → production |

### What stays the same

- **The North Star.** See It / Fix It / Prove It governs every decision.
- **The storyboard.** The 3 demo flows are the acceptance criteria.
- **The pillar-first prioritization.** Tier 2 / enabling work never crowds out pillar work.
- **The Pinetree CC demo data** as the canonical demo experience.
- **No production deploys without explicit approval** (currently a memory feedback note).

---

## 5. Key Advantages of this Approach

### Shift-left quality
With QA involved from sprint planning, testing happens **during** development rather than after. Bugs caught earlier are 10–100× cheaper to fix. Our existing Playwright suite (`tests/e2e/storyboard-flows.spec.js`) is the foundation.

### Robustness & reliability
Automated testing + CI/CD pipeline + deploy gates means new changes can't break the 3 storyboard flows. The Demo Stories Launcher, the First Domino visualization, the Revenue page — all of it stays green.

### Scalability
A Director of Engineering ensures the architecture handles multi-club growth. Backend Engineer owns the Layer 3 algorithms so they remain performant as more clubs and more data sources come online.

### Risk management
Director + DevOps + QA jointly own a risk register. Security, performance, vendor integration failures, and data leakage between tenants are all assessed early.

### Pilot-to-market readiness
Customer Success ensures every pilot club gets to value within 30 days. PM tracks pilot conversion. The team can scale from 1 pilot to 10 to 100 without restructuring.

---

## 6. Hiring Sequence (recommended)

If hiring incrementally rather than all at once:

| Order | Role | Why first |
|---|---|---|
| 1 | **Director of Engineering** | Sets vision, hires the rest |
| 2 | **PM** | Locks down roadmap, owns customer discovery |
| 3 | **Senior Backend Engineer** | Owns the Layer 3 moat — the data algorithms |
| 4 | **QA Engineer** | Locks in quality before the codebase grows |
| 5 | **Senior Frontend Engineer** | Owns the storyboard pages |
| 6 | **UI/UX Designer** | Maintains design fidelity as features grow |
| 7 | **DevOps Engineer** | When we have ≥3 production clubs |
| 8 | **Engineering Manager** | When the team reaches 5+ engineers |
| 9 | **Full-Stack Engineers (×2)** | As feature velocity becomes the bottleneck |
| 10 | **Customer Success Lead** | When pilot count exceeds 5 |

**Minimum viable team for first paid pilot:** Director + PM + Senior Backend + QA + Senior Frontend (5 people).
**Full team for scale:** all 10 roles (8 core + Director + CS).

---

## 7. Metrics Each Role Owns

| Role | Primary metric | Secondary metric |
|---|---|---|
| Director | Engineering org health (eNPS, retention, hiring velocity) | Architecture decisions documented |
| EM | Sprint velocity, cycle time | Sprint commit-to-deliver ratio |
| PM | Pilot count + pilot retention | Roadmap items shipped per quarter |
| Senior Frontend | Lighthouse perf score, Core Web Vitals | Visual regression test pass rate |
| Senior Backend | API p95 latency, sync freshness | Layer 3 algorithm coverage of pillar features |
| Full-Stack | Tickets closed, PR quality | Test coverage of new code |
| Designer | Design system adoption rate | Storyboard moments matching Figma |
| QA | Bug escape rate (production bugs / total bugs) | Test suite pass rate, Gemini critique score |
| DevOps | Uptime, deployment success rate | MTTR (mean time to recovery), cost per club |
| Customer Success | Time-to-first-insight (per club) | Pilot-to-paid conversion rate |

---

## 8. The North Star Audit (Team Accountability)

Every quarter, the team conducts a **North Star Audit**:
1. Re-run the [FEATURE-AUDIT.md](../strategy/FEATURE-AUDIT.md) scoring
2. Verify all 7 storyboard E2E tests still pass
3. Verify the 3 storyboard moments still match the [demo storyboard](../swoop_demo_storyboard.md)
4. Run the Gemini critique pipeline on the latest screenshots
5. Identify any pillar score regressions and assign owners to fix

**Owner of the North Star Audit:** Engineering Manager (operational) + PM (strategic). Director is the final approver.

---

## 9. Tooling Recommendations

| Need | Tool |
|---|---|
| Project management | Linear (preferred) or Shortcut |
| Source control | GitHub (current) |
| CI/CD | GitHub Actions + Vercel (current) |
| Documentation | Notion or GitBook |
| Design | Figma |
| Testing | Playwright (current) + Vitest (current) + Gemini critique (current) |
| Monitoring | Sentry (errors) + Vercel Analytics (perf) + Datadog or Grafana (infra) |
| Communication | Slack |
| Customer feedback | Linear feedback or PostHog |
| Demos / pilot recordings | Loom |

---

## 10. Onboarding Materials for New Team Members

When a new team member joins, day-one reading:

1. [NORTH-STAR.md](../strategy/NORTH-STAR.md) — the 3 pillars
2. [WHO-WE-ARE.md](../strategy/WHO-WE-ARE.md) — who we serve
3. [DEVELOPMENT-PRIORITIES.md](../strategy/DEVELOPMENT-PRIORITIES.md) — how we prioritize
4. [swoop_demo_storyboard.md](../swoop_demo_storyboard.md) — the demo flows
5. [FEATURE-AUDIT.md](../strategy/FEATURE-AUDIT.md) — current state of every feature
6. [POLISH-PLAN.md](../strategy/POLISH-PLAN.md) — the roadmap for perfection
7. **This document** — team structure and responsibilities

Day-one task: Run the storyboard E2E tests locally and watch all 7 pass:
```bash
npm run dev
# in another terminal
APP_URL=http://localhost:5174 npx playwright test tests/e2e/storyboard-flows.spec.js
```

Day-two task: Open the app in demo mode and walk through all 3 storyboard flows manually.

Day-three task: Pick the first item from POLISH-PLAN.md that aligns with your role and ship it to dev.

---

## Final Word

The North Star never moves. The team exists to **make the storyboard real for every private club in America** — by polishing what's there, scaling what works, and ruthlessly cutting what doesn't serve the 3 pillars.

Every role has the same job: **See It · Fix It · Prove It.**
