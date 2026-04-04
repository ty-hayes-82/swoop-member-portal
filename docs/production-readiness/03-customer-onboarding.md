# 3. Customer Onboarding Flow

**Status:** Endpoint functional, needs end-to-end testing with real data

---

## 3.1 Onboarding Endpoint

**`api/onboard-club.js` -- EXISTS AND IS FUNCTIONAL.**

- `POST /api/onboard-club` -- Creates club record + admin user + initializes 9-step onboarding
- `GET /api/onboard-club?clubId=xxx` -- Returns onboarding progress
- `PUT /api/onboard-club` -- Marks individual steps complete

**Updated on branch:** Now hashes admin password with pbkdf2 on user creation. Requires `adminPassword` (min 8 chars) in POST body.

9 onboarding steps: `club_created` -> `crm_connected` -> `members_imported` -> `tee_sheet_connected` -> `pos_connected` -> `health_scores_computed` -> `team_invited` -> `notifications_configured` -> `pilot_live`

**Gap:** Steps are marked complete but not validated (marking `crm_connected` doesn't verify a CRM connection exists). Acceptable for concierge onboarding.

## 3.2 CSV Import for Jonas Member Roster

The Jonas field mapping (447 rows) identified specific field names. The CSV import service's `VENDOR_COLUMN_ALIASES` for Jonas:

```
Member # -> member_id
Acct Balance -> annual_dues
Join Dt -> join_date
Last Name -> last_name
```

The fuzzy matching at 0.55 threshold provides a safety net. **Backend now fully writes to Postgres** (was identified as a gap in the original audit, but `api/import-csv.js` already had INSERT logic for members, rounds, transactions, complaints).

## 3.3 Health Score Computation

**`api/compute-health-scores.js` -- REAL IMPLEMENTATION.**

Scoring: Golf 30%, Dining 25%, Email 25%, Events 20%.
Tiers: Healthy (67+), Watch (45-66), At Risk (25-44), Critical (0-24).
8 archetypes: New Member, Ghost, Snowbird, Declining, Die-Hard Golfer, Social Butterfly, Weekend Warrior, Balanced Active.

**Implemented on branch:** Data completeness gate -- if fewer than 2 of 4 dimensions have real data, member is marked "Insufficient Data" instead of getting a misleading score. `data_completeness` column added to members table.

## 3.4 Day 1 Experience (Concierge MVP)

```
Contract signed
    |
Swoop team runs POST /api/onboard-club (creates club + admin user with hashed password)
    |
Swoop team obtains Jonas CSV export from club
    |
Swoop team uploads via CSV import UI
    |
Swoop team runs POST /api/compute-health-scores?clubId=xxx
    |
GM receives login credentials -> sees THEIR members with health scores
    |
Today view shows data for connected domains, empty states for others
```

**Demo mode:** `LoginPage.jsx` has demo mode that sets `clubId: 'demo'`. Production users get their real `clubId` from auth. The `withAuth` middleware supports a `demoClubId` header for demo access.

## 3.5 Next Steps

- [ ] Test the full onboarding flow end-to-end with a synthetic club
- [ ] Validate Jonas CSV alias matching against a real export
- [ ] Build onboarding runbook documenting each step for Swoop team
- [ ] Implement password reset flow (SendGrid is configured)
- [ ] Design and implement empty state components for partially-hydrated pages
