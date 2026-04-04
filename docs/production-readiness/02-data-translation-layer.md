# 2. Mock Data to Real Data Translation Layer

**Status:** In Progress -- service layer wired to authenticated API, CSV backend already functional

---

## 2.1 Phase 2 Swap Pattern

The architecture defines that only `src/services/*.js` files change when swapping mock data for real API calls. **This contract is clean.** Zero components import from `src/data/` directly.

**Implemented on branch:**
- Created `src/services/apiClient.js` -- authenticated fetch wrapper with Bearer token injection
- Updated all 15 service `_init()` functions to use `apiFetch()` instead of raw `fetch()`
- Services fall back to static data if API returns null/error (progressive hydration)

## 2.2 Vendor Attribution Map

| Data Domain | Mock File | Postgres Tables | Primary Vendor | Mapping Status |
|-------------|-----------|----------------|----------------|----------------|
| Members & Profiles | `members.js` | `members`, `households`, `membership_types` | **Northstar CRM** | Jonas mapping done (447 rows). Northstar TBD. |
| Golf Bookings | `teeSheetOps.js`, `pace.js` | `bookings`, `booking_players`, `pace_of_play` | **ForeTees** | Canonical linker maps ForeTees. Field mapping **not done.** |
| POS / F&B | `outlets.js`, `revenue.js` | `pos_checks`, `pos_line_items`, `pos_payments`, `close_outs` | **Jonas POS** | Jonas mapping done. Activity Category codes documented. |
| Events & Email | `email.js` | `event_definitions`, `event_registrations`, `email_campaigns` | **Club Prophet** | Field mapping **not done.** |
| Feedback & Service | `staffing.js` | `feedback`, `service_requests` | **Northstar** | Field mapping **not done.** |
| Staffing | `staffing.js` | `staff`, `staff_shifts` | **ClubReady / ADP** | Field mapping **not done.** |
| Waitlist & Pipeline | `pipeline.js` | `waitlist_entries` | **ForeTees** | Field mapping **not done.** |
| Weather | `weather.js` | `weather_daily` | **Weather API** | `api/weather.js` + `api/cron/weather-daily.js` implemented on branch |

**Mapping gap summary:**
- **Done:** Jonas CRM (447 rows), Jonas POS (via Activity Category)
- **Not done:** ForeTees, Northstar, Club Prophet, ClubReady, Toast, ADP, Mailchimp, Clubessential

## 2.3 CSV Import Service

**Frontend (`src/services/csvImportService.js`):** Production-quality. 10 template categories, 10 vendor alias sets, fuzzy matching at 0.55 threshold.

**Backend (`api/import-csv.js`):** Fully functional -- already INSERTs into Postgres.
- Handles 4 import types: `members`, `rounds`, `transactions`, `complaints`
- UPSERT on member_id conflict for members
- Tracks import history in `csv_imports` table
- **Updated on branch:** Auth middleware applied, `club_id` scoped from session

**Next steps:**
- Test with a real Jonas CSV export to validate alias matching
- Add import types for `tee-times`, `staffing`, `events`
- Add progress feedback UI during large imports

## 2.4 Data Ingestion Architecture

**Recommended path (progressive):**
1. **Now:** CSV upload via existing UI (concierge for first 3-5 clubs)
2. **P1 (90 days):** Jonas CRM API connector for auto-sync
3. **P2 (6+ months):** Nightly Vercel Cron sync for additional vendors
