# Swoop Golf — Final Development Plan
## Remaining Items to Reach All A's
**Date:** March 20, 2026
**Current Overall Score:** A
**Target:** All A's — zero caveats for paid demos

---

## Status Summary

| # | Item | Status | Impact |
|---|------|--------|--------|
| 1 | Board Report member save name ("Darryl Harrington" → "James Whitfield") | **NOT FIXED** | Board demo blocker |
| 2 | "Open full profile →" lands on listing page, not individual profile | **PARTIAL** | Minor UX friction |
| 3 | Search + filter combo inconsistency | **NOT FIXED** | Edge case UX |
| 4 | "+ Create Custom Action" button not visible in Outreach tab | **NOT FIXED** | Regression |
| 5 | At-Risk tab shows 3 tiers (235/39/26) vs All Members 4 tiers (200/35/39/26) | **NOT FIXED** | Potential confusion |

---

## P0 — Fix Before Any Board Demo

### 1. Board Report Member Save Name Mismatch
**Priority:** CRITICAL — one-line data fix
**Impact:** The Board Report is the page most likely shown to board members. "Darryl Harrington" appears instead of "James Whitfield" for the 34→71 health recovery save.
**Root Cause:** The `memberSaves` data in `src/data/boardReport.js` uses hardcoded member names. The name "James Whitfield" is correct in the static data, but the Board Report's `MemberPlaybooks` component or the member save rendering pulls from a different source that was mapped to Postgres data.
**Fix:**
- Check `src/data/boardReport.js` — verify the `memberSaves` array has `name: 'James Whitfield'` (not Darryl Harrington)
- If the data is correct there, the issue is in how the Board Report component renders the name — it may be looking up from `memberProfiles` or the API instead of using the save data directly
- Check `src/features/board-report/BoardReport.jsx` lines 397-417 — the member saves loop renders `{m.name}` from `getMemberSaves()` data
- Check `src/services/boardReportService.js` — verify `getMemberSaves()` returns static data, not API-overridden data
- Apply the same SEED_IDS static-data-first pattern used in MemberProfileContext
**Files:** `src/data/boardReport.js`, `src/services/boardReportService.js`, `src/features/board-report/BoardReport.jsx`
**Estimate:** 30 minutes

---

## P1 — Fix Before Contract Negotiation

### 2. "Open full profile →" Route Resolution
**Priority:** HIGH
**Impact:** Drawer link navigates to `#/members/{memberId}` which renders the member listing page instead of the individual profile.
**Root Cause:** The `MemberProfilePage` component parses the member ID from the URL hash and fetches data, but the route `#/members/{memberId}` is handled by NavigationContext as the `member-profile` route. The page component exists and works — it just needs the URL to resolve directly to the individual view instead of showing the listing first.
**Fix:**
- In `MemberProfilePage.jsx`, the `useEffect` parses the hash with `hash.match(/member[=/]([^&/]+)/i)` — verify this regex matches the actual URL format `#/members/mbr_203`
- If the regex matches but the page still shows the listing, the issue is that the page component renders a listing view by default and only shows the individual profile after an additional click
- Check if `MemberProfilePage` has conditional rendering that shows a search/listing when no member is loaded yet, and the async fetch hasn't completed
- Ensure the static fallback loads synchronously for seed members so the profile renders immediately without showing the listing first
- Consider adding a loading state that shows a skeleton instead of the listing while the profile loads
**Files:** `src/features/member-profile/MemberProfilePage.jsx`
**Estimate:** 1-2 hours

### 3. Search + Filter Combo Fix
**Priority:** MEDIUM
**Impact:** Searching first, then clicking a health filter card doesn't reliably combine both filters.
**Root Cause:** The filter state and search state both reset the page to 0, but clicking a health filter card may not account for the existing search term in the filtered count, or the useMemo dependencies may not include both states properly.
**Fix:**
- In `AllMembersView.jsx`, verify the `filteredMembers` useMemo includes both `searchTerm` and `healthFilter` in its dependency array
- Ensure `setPage(0)` is called when EITHER filter changes
- The `handleHealthClick` function should not clear `searchTerm`, and `setSearchTerm` should not clear `healthFilter`
- Test: search "a" → click Critical → should show only Critical members whose names contain "a"
**Files:** `src/features/member-health/tabs/AllMembersView.jsx`
**Estimate:** 30 minutes

### 4. Restore "+ Create Custom Action" Button
**Priority:** MEDIUM
**Impact:** QA expected this from the regression checklist but it wasn't visible.
**Root Cause:** The button was added inside the `editMode && disabledActions.length > 0` conditional block in `OutreachPlaybooks.jsx`. If `disabledActions` is empty (all actions already enabled), the entire block including the Create button doesn't render.
**Fix:**
- Move the "+ Create Custom Action" button outside the `disabledActions.length > 0` check
- It should always be visible when `editMode` is true, regardless of whether there are disabled actions
- The button opens the `CreateActionModal` which is independent of the disabled actions list
**Files:** `src/features/outreach-playbooks/OutreachPlaybooks.jsx`
**Estimate:** 15 minutes

---

## P2 — Polish

### 5. Harmonize At-Risk Tab Health Tier Display
**Priority:** LOW
**Impact:** At-Risk tab shows 3 tiers (Healthy 235 / At Risk 39 / Critical 26) while All Members shows 4 tiers (Healthy 200 / Watch 35 / At Risk 39 / Critical 26). The At-Risk view merges Healthy + Watch into a single count.
**Root Cause:** The At-Risk tab's `HealthOverview` component uses `getHealthDistribution()` which returns 4 tiers, but the rendering groups Healthy and Watch together since the At-Risk view is focused on risk members.
**Fix:**
- Either show all 4 tiers consistently in both views
- Or add a note in the At-Risk view: "235 Healthy (includes 35 Watch members)"
- The simpler fix: keep the current behavior but ensure the numbers are clearly labeled so a GM switching between tabs doesn't think data is inconsistent
**Files:** `src/features/member-health/tabs/HealthOverview.jsx`
**Estimate:** 30 minutes

---

## Implementation Sequence

### Sprint 1: Board Demo Ready (30 min)
1. Fix Board Report member save name (P0-1)
2. Restore Create Custom Action button (P1-4)

### Sprint 2: Profile & UX Polish (2 hours)
3. Fix "Open full profile" route (P1-2)
4. Fix search + filter combo (P1-3)

### Sprint 3: Cosmetic (30 min)
5. Harmonize At-Risk tier display (P2-5)

**Total estimated effort: ~3.5 hours**

---

## Target Scores After Completion

| Area | Current | Target | What Closes the Gap |
|------|---------|--------|---|
| Value Story | A | A | No changes needed |
| Member Health | A | A | Already there |
| Revenue Optimization | A | A | Already there |
| Experience → Outcome | A | A | Already there |
| Product Completeness | A- | A | Follow-up cards done; Board Report name fix closes last gap |
| Data & System Readiness | A- | A- | Limited by demo architecture — acceptable |
| Actionability | A | A | Closed-loop complete |
| UX / Operator Readiness | A- | A | "Open full profile" fix + search/filter combo |
| Board Report / ROI Proof | A | A | Name fix ensures evidence chain is trustworthy |
| Admin / Onboarding | A- | A- | Stable — no changes needed |
| **Overall** | **A** | **A** | 3.5 hours of work |

---

## QA Verification Report Summary

### Latest Test Results (March 20, 2026)

| # | Fix | Result | Notes |
|---|-----|--------|-------|
| 1 | Member profile name mismatch | PASS | All 5 seed profiles show correct names in drawer, inbox, and quick actions |
| 2 | Critical filter count | PASS | 26/26 Critical, 39/39 At Risk, 35/35 Watch, 200/200 Healthy |
| 3 | Search on All Members | PASS | Case-insensitive, real-time count updates |
| 4 | Banner dismiss persistence | PASS | Persists across refresh via localStorage |
| 5 | Health score breakdown | PASS | 4 dimensions with traffic-light coloring |
| 6 | Open full profile navigation | PARTIAL | Navigates but shows listing first |
| 7 | Follow-up cards in inbox | PASS | All 3 cards present with correct data |

**Closed-loop test:** PASS — Full chain works: Risk → Action → Approve → History → Follow-up outcomes → Board proof

**Verdict:** Ready for paid demos with two minor caveats (Board Report name, profile navigation). Fix in next sprint.
