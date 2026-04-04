# 1. Current State Audit

**Status:** Complete (April 3, 2026)

---

## 1.1 V3 Realignment Completion Status

| Phase | Description | Status | Evidence |
|-------|-------------|--------|----------|
| **Phase 1** | Navigation Restructure + Service Page | **Complete** | 5 nav items in `src/config/navigation.js`; Service page with 3 tabs at `src/features/service/` |
| **Phase 2** | Simplify Existing Pages | **Complete** | Members 6->3 tabs, Board Report 4->2 tabs, Admin 5->2 tabs. ROI projections removed from UI. |
| **Phase 3** | Playbooks & Actions Simplification | **Partial** | 3 playbooks visible (Service Save, 90-Day Integration, Staffing Adjustment) but 10 additional hidden playbooks still in `src/features/playbooks/PlaybooksPage.jsx`. Actions moved to drawer. |
| **Phase 4** | Messaging & Framing Realignment | **Partial** | Customer-facing headlines are operations-first. Section 9 Rule enforced. But data/service layer still has retention-centric language in `src/services/experienceInsightsService.js` and `src/data/outreach.js`. |
| **Phase 5** | Code Cleanup | **Complete** | 24 feature folders deleted (exceeding the 17 planned). Zero TODO/FIXME/HACK comments in `src/`. App.jsx clean. |
| **Phase 6** | Post-MVP Features | **Not started** | Correctly gated behind pilot validation. |

**Assessment:** Phases 1, 2, and 5 are fully shipped. Phases 3 and 4 are 80% complete -- the structural work is done but some internal language cleanup remains. Phase 6 is correctly deferred.

## 1.2 Data File Inventory

Every file in `src/data/` with its downstream consumer and vendor mapping:

| Data File | Records | Service Consumer | Feature Consumer | Real-World Vendor Source |
|-----------|---------|-----------------|-----------------|------------------------|
| `agents.js` | 6 agents, 12 actions | `agentService.js` | ActionsDrawer, MemberProfileDrawer | Internal (Swoop Agent System) |
| `benchmarks.js` | 6 KPI comparisons | (inline in boardReportService) | BoardReport | Industry aggregates |
| `boardReport.js` | 19 records (4 arrays) | `boardReportService.js` | BoardReport, RecoveryTab | Aggregated from all systems |
| `cockpit.js` | 3 priority items | `cockpitService.js` | TodayView | Aggregated (cross-domain) |
| `combinations.js` | 14 integration pairs | (inline usage) | IntegrationsPage | Internal config |
| `email.js` | 37 records | `memberService.js` | EmailTab, ArchetypeTab | Club Prophet / Mailchimp |
| `integrations.js` | 30 systems, 6 combos | `integrationsService.js` | IntegrationsPage | Internal config |
| `location.js` | 65 entries | `locationService.js` | **ORPHANED** (no feature) | GPS/WiFi (future) |
| `members.js` | 41 records + 5 profiles | `memberService.js`, `experienceInsightsService.js` | MembersView, MemberProfile, TodayView | Northstar CRM |
| `outlets.js` | 17 records | `fbService.js` | (via other services) | Jonas POS / Toast |
| `outreach.js` | 28 actions + 8 playbooks | (direct localStorage) | PlaybooksPage, MemberProfile | Internal config |
| `pace.js` | 16 records | `operationsService.js` | (via briefingService) | ForeTees |
| `pipeline.js` | 64 entries | `pipelineService.js`, `waitlistService.js`, `briefingService.js` | TodayView (via briefing) | Northstar + ForeTees |
| `revenue.js` | 32 records | `operationsService.js`, `waitlistService.js` | (via briefingService) | Jonas POS |
| `staffing.js` | 20 records | `staffingService.js` | (via briefingService) | ClubReady / ADP |
| `teeSheetOps.js` | 49 records | `teeSheetOpsService.js` | **ORPHANED** (no feature) | ForeTees |
| `trends.js` | 60 data points | `trendsService.js` | TrendChart, TrendContext | Aggregated |
| `weather.js` | 31 daily entries | `weatherService.js` | TodayView | Weather API |
| `schema/vercelPostgresSchema.js` | DDL definitions | (reference only) | AdminHub | N/A -- schema config |

**Orphaned data files cleaned up on branch:**
- ~~`onlySwoopAngles.js`~~ -- **Deleted** on `production-readiness-plan` branch
- `location.js` -- consumed by `locationService.js` but that service has zero feature consumers
- `teeSheetOps.js` -- consumed by `teeSheetOpsService.js` but that service has zero feature consumers

**Orphaned services (still present, low priority):**
- `locationService.js`, `teeSheetOpsService.js`, `pipelineService.js`, `fbService.js` (consumed indirectly)

## 1.3 Data Flow Rule Compliance

**Result: CLEAN.** Zero violations found. No component or feature file imports directly from `src/data/`. All data access flows through `src/services/`. The Phase 2 API swap pattern is intact.

## 1.4 Deleted Feature Folders

24 feature folders removed in V3 Phase 5. **14 active feature folders remain:** today, service, members, board-report, admin, member-health, member-profile, playbooks, integrations, login, data-health.

Additional cleanup on `production-readiness-plan` branch:
- ~~`landing/PortalLanding.jsx`~~ -- **Deleted** (unreachable, redirected to today)
- ~~`integrations/IntegrationMap.jsx`~~ -- **Deleted** (orphaned radial SVG, never rendered)

## 1.5 Build Status

**Updated (April 4, 2026) -- after code-splitting on branch:**

| Metric | Before (dev) | After (branch) |
|--------|-------------|----------------|
| Largest app chunk | 938 KB | 132 KB |
| Vendor chunks | 1 (525 KB) | 3 (react 142KB, charts 383KB, xlsx 429KB) |
| Build time | ~12s | ~4.5s |
| Test status | 1 failing / 8 total | **12 passing / 12 total** |

## 1.6 Security Issues

| Issue | Severity | Status on Branch |
|-------|----------|-----------------|
| Password bypass in `api/auth.js` | Critical | **FIXED** -- requires password hash |
| Hardcoded DB credentials in `scripts/reseed-pipeline-leads.mjs` | Critical | **FIXED** -- uses env var only |
| No auth middleware | High | **FIXED** -- `api/lib/withAuth.js` applied to 29 endpoints |
| No `.env.example` | Medium | **FIXED** -- created |
| Env var mismatch (`ANTHROPIC_API_KEY`) | Low | Open |

## 1.7 Cosmetic Components

| Component | Status on Branch |
|-----------|-----------------|
| IntegrationMap (radial SVG) | **Deleted** |
| UnifiedExperienceMap | Cosmetic, display-only (low priority) |
| TwoLayerDiagram | Cosmetic, display-only (low priority) |
| OnlySwoopModule | Cosmetic, display-only (low priority) |
| AgentThoughtLog | Display-only (agent backend exists via Anthropic API) |

## 1.8 Section 9 Rule Compliance

**COMPLIANT.** Primary navigation uses customer-friendly labels: Today, Service, Members, Board Report, Admin. No lens names exposed in customer-facing UI.

## 1.9 Mobile App

Shell exists at `src/mobile/` with 4 screens (Cockpit, Actions, Member Lookup, Settings). Routed via `#/m`. P2 priority -- not needed for first customer.
