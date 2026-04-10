# Freshness-String Audit — 2026-04-09

Scope: every "last synced X ago" / "X min ago" / "All Healthy" / "Just now" /
hardcoded ISO / `new Date('2026-...')` string in `src/` must either derive from
a real service call or render `—`.

Source: SHIP_PLAN.md §1.5. Prior fix in commit 3ad4985 covered
`src/features/integrations/IntegrationsPage.jsx` — out of scope here.

## Punch list

| file:line | string | classification | recommended action |
|---|---|---|---|
| src/services/apiHealthService.js:97 | `${ageMin} min ago` | REAL | keep — derived from `/api/health` → `integrations.weather.ageMin` |
| src/services/apiHealthService.js:115 | `Last synced ${formatAge(w.ageMin) || 'recently'}` | REAL | keep — derived from `/api/health` |
| src/services/apiHealthService.js:117 | `Stale — last sync ${formatAge(w.ageMin) || 'over budget'}` | REAL | keep — derived from `/api/health` |
| src/features/data-health/DataHealthDashboard.jsx:178 | `Last sync: ${new Date(domain.last_sync_at).toLocaleString()}` | REAL | keep — gated on `domain.last_sync_at` existing from `data_health` API |
| src/features/integrations/IntegrationsPage.jsx:16,200,207,415 | Just now / All Healthy / Last sync X | REAL | already fixed in commit 3ad4985 (out of scope) |
| src/features/admin/AdminDashboard.jsx:335 | `Last synced: 5 min ago` | FAKE | **FIXED** → `Last synced: —` |
| src/features/today/TodayView.jsx:94 | `Just now` | FAKE | **FIXED** → `—` (check-in alert is a synthetic demo simulation; real check-ins have no timestamp source) |
| src/mobile/screens/CockpitScreen.jsx:11,42-47 | `Updated N min ago` | FAKE | **FIXED** → `Updated —` (original used page-mount time, not a real sync timestamp) |
| src/components/ui/ConnectedSystems.jsx:4-8 | `N min ago` ×5 | FAKE | **FIXED** → `—` (component exported from `components/ui`; no per-system sync service exists) |
| src/data/cockpit.js:33,68,104 | `Updated N min ago` | DEMO-OK | `src/data/` fixture — excluded by rule |
| src/data/integrations.js:2-31 | `Nm ago` (many) | DEMO-OK | `src/data/` fixture — excluded by rule |
| src/landing/data.js:12,38,56,71,86 | `Updated N min ago`, `Wind advisory confirmed 45 min ago`, etc. | DEMO-OK | marketing landing page fixtures (public `/landing` route, not club-facing data surface) |
| src/features/member-health/tabs/HealthOverview.jsx:19 | `new Date('2026-01-31')` | DEMO-OK | `REF_DATE` anchor for computing aging on `getComplaintCorrelation()` fixture data; all downstream complaint rows are demo fixtures |

## Summary

- Total hits reviewed: **22 lines across 11 files**
- REAL (already wired): 5 lines (apiHealthService ×3, DataHealthDashboard ×1, IntegrationsPage ×4 — already fixed previously)
- FAKE fixed this pass: 4 sites (AdminDashboard, TodayView, CockpitScreen, ConnectedSystems)
- DEMO-OK (gated on `src/data/` or marketing fixtures): 13 lines
- Punted to "needs service support": 3 sites (see below)

## Needs service support

The following were replaced with `—` because no existing service exposes the
required data. Do **not** re-introduce literals — plumb a real signal instead.

1. **`src/features/admin/AdminDashboard.jsx:335`** — per-integration "Last
   synced" badge inside the integrations detail panel. Needs
   `integrationsService.getLastSync(integrationId)` or equivalent. Today,
   `integrationsService.getConnectedSystems()` returns `lastSync` from the
   static `SYSTEMS` fixture in `src/data/integrations.js` only — it is never
   populated from a real backend call.

2. **`src/mobile/screens/CockpitScreen.jsx:42-47`** — the mobile cockpit
   "Updated X min ago" footer previously used `new Date()` captured at
   component mount, which only reports time since the user opened the screen,
   not time since the underlying data refreshed. Needs a real
   `getLastRefreshedAt()` on `memberService` / `agentService` (whichever
   underpins the cockpit KPIs).

3. **`src/components/ui/ConnectedSystems.jsx`** — the Daily Briefing
   integration status panel. Component is exported from the UI barrel but
   currently has no live callers in `src/`; kept for parity. Would need the
   same per-integration sync freshness API as #1.

## Build verification

`npm run build` — see session log for result.
