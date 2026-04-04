# 6. Testing & Validation Strategy

**Status:** Partially implemented -- test suite expanded, synthetic profiles defined

---

## 6.1 Current Test Coverage

**Updated April 4, 2026:**

| Test File | Tests | Status |
|-----------|-------|--------|
| `src/__tests__/navigation.smoke.test.jsx` | 5 tests | **Pass** |
| `src/services/memberService.test.js` | 3 tests | **Pass** (fixed stale assertion) |
| `src/services/briefingService.test.js` | 2 tests | **Pass** (new) |
| `src/services/cockpitService.test.js` | 2 tests | **Pass** (new) |

**Total: 12 tests, 4 files, all passing.**

Still needed: API endpoint tests, integration tests, E2E tests.

## 6.2 Synthetic Club Profiles

| Profile | Members | Outlets | Stack | Key Feature Exercise |
|---------|---------|---------|-------|---------------------|
| **Small 9-hole semi-private** | 150 | 1 (Grill Room) | Jonas suite (CRM + POS) | Minimal data volumes. Tests: health scores with sparse data, single-outlet F&B, no tee sheet integration. **Risk:** Many features show empty states. |
| **Mid-size private (Oakmont archetype)** | 300 | 5 | ForeTees + Jonas POS + Northstar CRM | Full feature exercise. All 5 nav pages populated. **Baseline target.** |
| **Large private, F&B emphasis** | 500 | 8 | Clubessential suite | Heavy dining minimum enforcement. High POS transaction volume (~15K/month). |
| **Resort/multi-course** | 800 | 2 courses, 6 outlets | ForeTees + Toast + ADP + Mailchimp | Best-of-breed stack. Multi-vendor CSV import testing. |

**Realistic data volumes:**

| Metric | Small | Mid | Large | Resort |
|--------|-------|-----|-------|--------|
| Rounds/month | 400 | 1,200 | 1,800 | 4,000 |
| Covers/month | 800 | 3,000 | 6,000 | 8,000 |
| Complaints/quarter | 5 | 15 | 30 | 50 |
| Email campaigns/month | 2 | 4 | 6 | 8 |
| Staff shifts/week | 20 | 80 | 150 | 200 |

**Feature degradation by profile:**

| Feature | Small | Mid | Large | Resort |
|---------|-------|-----|-------|--------|
| Today view | Partial | Full | Full | Full |
| Service Quality | Minimal (1 outlet) | Full | Full | Full |
| Members At-Risk | Sparse | Full | Full | Full |
| Board Report | Limited (30-day min) | Full | Full | Full |
| Cross-domain correlations | None | Partial | Full | Full |

## 6.3 Story Validation Testing

Testing contract: `src/data/*.js` (known inputs) -> `src/services/*.js` (deterministic functions) -> `src/features/*.jsx` (UI assertions)

**Priority tests still to write:**

| Test | Why | Effort |
|------|-----|--------|
| `compute-health-scores` with all-zero engagement -> assigns "Ghost" | Validates sparse-data behavior | S |
| `compute-health-scores` with balanced engagement -> correct tier | Validates happy-path classification | S |
| CSV import with real Jonas column names -> maps correctly | Validates the 447-row mapping work | M |
| `memberService.getAtRiskMembers()` count consistency | Core metric on Today + Members | S |
| End-to-end: create club -> import CSV -> compute scores -> verify UI | Full pipeline validation | L |

## 6.4 Next Steps

- [ ] Create seed data generators for each synthetic club profile
- [ ] Write API endpoint tests (at minimum: auth, members, import-csv, compute-health-scores)
- [ ] Add E2E smoke test: login -> navigate all 5 pages -> verify no console errors
- [ ] Test health score computation with real-world sparse data patterns
