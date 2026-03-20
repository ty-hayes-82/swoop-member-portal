# Swoop Golf — Development Plan
## Based on Comprehensive Product Review & QA Testing Report
**Date:** March 20, 2026
**Overall Market Readiness Score:** B+
**Verdict:** STRONG GO — with targeted fixes before enterprise sales

---

## P0 — Ship-Blocking (Fix Before Any Paid Demo)

### 1. Fix Member Profile Name Mismatch Bug
**Priority:** CRITICAL
**Impact:** Trust-breaking in live demo
**Problem:** Clicking a member row in the All Members table opens a sidebar showing a different member's profile. Clicking "Sandra Chen" shows "Rosa Fox." Clicking "James Whitfield" shows "Darryl Harrington."
**Root Cause:** The `MemberProfileDrawer` receives a `memberId` but the lookup in `memberProfiles` data doesn't match the generated roster IDs. The `AllMembersView` generates members with IDs like `mbr_400+` but `memberProfiles` only has 5 hardcoded entries (`mbr_203`, `mbr_042`, `mbr_089`, `mbr_271`, `mbr_146`). When a generated member is clicked, the drawer falls back to a random existing profile.
**Fix:**
- Extend `getMemberProfile()` in `memberService.js` to handle generated members by building a profile from the roster data
- OR extend `MemberProfileDrawer` to construct a profile object from the clicked member's row data when no matching profile exists
- Ensure the sidebar always shows the name, score, archetype, and dues of the clicked member
**Files:** `src/services/memberService.js`, `src/features/member-profile/MemberProfileDrawer.jsx`, `src/features/member-health/tabs/AllMembersView.jsx`
**Estimate:** 2–3 hours

### 2. Fix Critical Filter Count Discrepancy
**Priority:** CRITICAL
**Impact:** A GM who clicks "26 Critical" and sees 13 rows will question every number
**Problem:** The health level card shows 26 Critical members, but filtering by Critical returns only 13 rows.
**Root Cause:** The `healthDistribution` data defines 26 critical members, but the `generateRoster()` function in `AllMembersView.jsx` doesn't precisely match the distribution. The random score generation doesn't guarantee exactly 26 members with scores < 30.
**Fix:**
- Update `generateRoster()` to explicitly match the `healthDistribution` counts: 200 Healthy, 35 Watch, 39 At Risk, 26 Critical
- Assign scores deterministically based on target distribution rather than random generation
- Verify filter counts match card counts after generation
**Files:** `src/features/member-health/tabs/AllMembersView.jsx`
**Estimate:** 1–2 hours

### 3. Ensure Toast Notifications Are Visible
**Priority:** CRITICAL
**Impact:** User gets no feedback that their action registered
**Problem:** Quick actions (Schedule call, Send email) and action buttons (Start Outreach, Deploy Rangers) update badge counts but toasts were not visibly appearing during QA testing.
**Root Cause:** Possible z-index conflict between toast container and member profile drawer (z-index 1001-1002). Toast container may render behind the drawer overlay. Also possible timing issue where toast fires but is obscured by the drawer's close animation.
**Fix:**
- Verify `ToastContainer` z-index is higher than all overlays (set to 9999)
- Test toast visibility when member drawer is open vs closed
- Add a slight delay to toast if the drawer is closing simultaneously
- Ensure `showToast` is called BEFORE any drawer close animations
**Files:** `src/components/ui/Toast.jsx`, `src/context/AppContext.jsx`
**Estimate:** 1 hour

---

## P1 — Buyer Confidence (Fix Before Contract Negotiation)

### 4. Add Search to All Members Table
**Priority:** HIGH
**Impact:** Basic table feature every GM expects for the "someone just walked into my office" use case
**Problem:** No search input field exists on the All Members table. A GM looking for a specific member has to paginate through 300 members or use filters.
**Fix:**
- Add a text input above the table that filters by member name (case-insensitive substring match)
- Filter should work in combination with existing health level and archetype filters
- Show result count: "Showing X of 300 matching 'chen'"
**Files:** `src/features/member-health/tabs/AllMembersView.jsx`
**Estimate:** 1 hour

### 5. Add Health Score Breakdown to Member Profiles
**Priority:** HIGH
**Impact:** GM preparing for retention call needs to understand WHY a member scored 34
**Problem:** Member profiles show the overall health score and a trend line but no breakdown of component scores.
**Fix:**
- Add a "Health Score Breakdown" section to the member profile drawer
- Show component scores: Golf engagement, Dining frequency, Email engagement, Event attendance
- Each component shows a mini progress bar and value
- Components that are declining get a red indicator
- Formula explanation: "Weighted average of 4 engagement dimensions"
**Files:** `src/features/member-profile/MemberProfileDrawer.jsx`
**Estimate:** 2 hours

### 6. Build Full Member Profile Page
**Priority:** HIGH
**Impact:** The sidebar snapshot is good for quick reference but insufficient for retention call prep
**Problem:** "Open full profile →" link closes the sidebar instead of navigating to a dedicated profile page.
**Fix:**
- Make "Open full profile →" navigate to `#/member-profile` with the member ID
- The full profile page (`MemberProfilePage.jsx`) should show: complete engagement timeline, health score trend chart, spend history, communication history, family/household info, and action recommendations
- If the page already exists but isn't wired correctly, fix the navigation
**Files:** `src/features/member-profile/MemberProfileDrawer.jsx`, `src/features/member-profile/MemberProfilePage.jsx`
**Estimate:** 2–3 hours

### 7. Harmonize Banner and Headline Member Counts
**Priority:** HIGH
**Impact:** Two different numbers for "at-risk members" is the fastest way to lose credibility
**Problem:** The persistent orange banner says "53 members at risk or critical" while the page headline says "65 members at risk." These should match.
**Fix:**
- Both should pull from the same source: `getMemberSummary()`
- Update the banner in `src/components/layout/Header.jsx` to use `summary.atRisk + summary.critical`
- OR remove the banner entirely — the headline makes it redundant
**Files:** `src/components/layout/Header.jsx`
**Estimate:** 30 minutes

---

## P2 — Competitive Moat (Build for Long-Term Differentiation)

### 8. Add Closed-Loop Feedback to Daily Inbox
**Priority:** MEDIUM
**Impact:** Closes the "did it work?" gap in the daily workflow
**Problem:** After approving an outreach action, there's no follow-up showing whether the member re-engaged. This only appears in the Board Report.
**Fix:**
- When an approved action reaches its check-in window (14/30/60 days), surface a feedback card in the Inbox: "Suresh Drake: you called him 30 days ago. Health score: 34 → 71. Action: Working."
- Add a "Feedback" or "Follow-up" badge type to inbox items
- Pre-seed 2-3 follow-up cards in the demo data to demonstrate the loop
**Files:** `src/data/agents.js`, `src/features/agent-command/tabs/InboxTab.jsx`
**Estimate:** 3–4 hours

### 9. Build "Retention Call Prep" One-Pager
**Priority:** MEDIUM
**Impact:** Would become the single most-used screen in the product
**Problem:** No single screen gives a GM everything they need before calling an at-risk member.
**Fix:**
- When clicking "Act Now" or "Prepare Call" on a member, generate a single-screen briefing:
  - Member name, photo placeholder, tenure, dues amount
  - Current health score with breakdown
  - Risk signals in plain English
  - Last 5 interactions (visits, complaints, outreach)
  - Recommended talking points based on archetype
  - Family/preference notes
  - "Log Call Outcome" button at the bottom
**Files:** New component `src/features/member-profile/RetentionCallPrep.jsx`
**Estimate:** 4–6 hours

### 10. Add Multi-Select Batch Actions on At-Risk Table
**Priority:** MEDIUM
**Impact:** A GM with 22 critical members needs to triage, not process one at a time
**Problem:** The critical members table has checkboxes but the batch action buttons (Draft personal notes, Schedule calls) only appear on the HealthOverview component, not on the AllMembersView table.
**Fix:**
- Add checkbox column to AllMembersView table
- Show floating action bar when members are selected: "X members selected — Draft notes | Schedule calls | Start outreach"
- Each batch action calls `addAction()` with member count
**Files:** `src/features/member-health/tabs/AllMembersView.jsx`
**Estimate:** 2–3 hours

---

## QA Report Score Card

| # | Area | Score | Key Finding |
|---|------|-------|-------------|
| 1 | Value Story / Narrative | **A** | Best-in-class for the vertical. Consistent narrative architecture. |
| 2 | Member Health & Churn | **A-** | 300 members, archetype classifications, First Domino Alert. Deducted for opaque health score methodology and Critical filter mismatch. |
| 3 | Revenue Optimization | **A-** | $84K/mo opportunity with scenario modeling. All action buttons create inbox tasks. |
| 4 | Experience → Outcome Links | **A** | Cross-domain correlations with dollar values. Intellectual moat of the product. |
| 5 | Product Completeness | **B** | Most buttons work. Key issues: member profile mismatch, missing search, toast visibility. |
| 6 | Data & System Readiness | **A-** | 17 systems with sync details, CSV error handling, timeAgo timestamps. |
| 7 | Actionability | **A-** | Complete chain: Insight → Decision → Action → Track. Deducted for missing closed-loop feedback in daily workflow. |
| 8 | UX / Operator Readiness | **B+** | Clean design. Deducted for: no search, name mismatch, banner count discrepancy. |
| 9 | Board Report / ROI Proof | **A** | Best feature. Transparent ROI, evidence chains, industry benchmarking, methodology. |
| 10 | Admin / Onboarding | **A-** | Setup Guide, 7 admin tabs, usage trends, brand voice, channel tests. |

---

## Implementation Sequence

### Week 1: P0 Items (Demo Blockers)
1. Fix member profile name mismatch bug (2–3 hrs)
2. Fix Critical filter count discrepancy (1–2 hrs)
3. Fix toast notification visibility (1 hr)
**Total: ~5 hours**

### Week 2: P1 Items (Buyer Confidence)
4. Add search to All Members table (1 hr)
5. Add health score breakdown to member profiles (2 hrs)
6. Fix "Open full profile →" navigation (2–3 hrs)
7. Harmonize banner and headline counts (30 min)
**Total: ~6 hours**

### Week 3–4: P2 Items (Competitive Moat)
8. Closed-loop feedback cards in Inbox (3–4 hrs)
9. Retention Call Prep one-pager (4–6 hrs)
10. Multi-select batch actions on All Members table (2–3 hrs)
**Total: ~10 hours**

---

## Target Scores After Fixes

| Area | Current | After P0 | After P1 | After P2 |
|------|---------|----------|----------|----------|
| Value Story | A | A | A | A |
| Member Health | A- | A- | A | A |
| Revenue Optimization | A- | A- | A- | A |
| Experience → Outcome | A | A | A | A |
| Product Completeness | B | B+ | A- | A |
| Data & System Readiness | A- | A- | A- | A |
| Actionability | A- | A- | A- | A |
| UX / Operator Readiness | B+ | A- | A | A |
| Board Report / ROI Proof | A | A | A | A |
| Admin / Onboarding | A- | A- | A- | A |
| **Overall** | **B+** | **A-** | **A-** | **A** |

---

## Verdict

> "This is the most compelling club intelligence product I've seen for the private club vertical. It's not a prototype — it's 90% of a production tool. The last 10% is what separates an impressive demo from a signed contract."
>
> — QA Tester, March 20, 2026

**Estimated total effort to reach all A's: ~21 hours of focused development.**
