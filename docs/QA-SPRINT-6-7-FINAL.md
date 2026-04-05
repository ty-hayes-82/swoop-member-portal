# QA Test Plan: Sprint 6-7 Final Validation

**App URL:** https://swoop-member-portal-production-readiness.vercel.app
**Branch:** `production-readiness-plan`
**Build:** `d5466c2` (or later)
**Date:** April 5, 2026

---

## Prerequisites

| Step | Action | Expected |
|------|--------|----------|
| Run migration 010 | `POST /api/migrations/010-password-resets-table` | 200 — password_resets table created |
| Clear cache | Hard refresh (Ctrl+Shift+R) | Fresh load |
| Dry run club exists | Run `node scripts/dry-run-bowling-green.mjs` if no test club available | Club created with 300 members |

---

## Test 1: Login + Auth Flow

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 1.1 | Navigate to `/#/login` | Login card with orange "S" badge, centered on gray-50 bg | |
| 1.2 | Enter invalid credentials | Red error banner: "Login failed" | |
| 1.3 | Click "Forgot your password?" | Inline form appears with email input + "Send Reset Link" button | |
| 1.4 | Enter any email, click Send Reset Link | Message: "If an account exists with that email, a reset link has been sent." | |
| 1.5 | Click Cancel | Forgot password form disappears | |
| 1.6 | Navigate to `/#/reset-password` (no token) | "Invalid Link" page with "Back to Sign In" link | |
| 1.7 | Navigate to `/#/reset-password?token=fake` | Reset form shows, submit → "Invalid or expired reset link" error | |
| 1.8 | Login with dry run credentials | Redirects to Today page, sidebar visible | |
| 1.9 | Verify footer shows "Demo Environment" or club name | No raw `club_xxx` ID visible | |
| 1.10 | Click "Sign Out" in footer | Returns to login page, localStorage cleared | |

---

## Test 2: Layout + Sidebar (Black + Orange)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 2.1 | Verify sidebar color | True black (`#000000`) background | |
| 2.2 | Verify 5 nav items | Today, Service, Members, Board Report, Admin — SVG icons | |
| 2.3 | Click each nav item | Active item: orange tint (`bg-brand-500/15 text-brand-400`) | |
| 2.4 | Verify accent color is `#ff8b00` | Check any button or active state in DevTools — `rgb(255, 139, 0)` | |
| 2.5 | Verify sidebar at 1024px+ | Sidebar visible, content offset by 290px (`margin-left: 290px`) | |
| 2.6 | Verify header | Sticky, search bar on desktop, page title + DEMO/LIVE badge, user avatar | |
| 2.7 | Verify no CSS conflicts | No elements with `background: transparent` that should be orange | |

---

## Test 3: Empty State Handling (Real Club, No Data)

Log in with a freshly created club that has NO imported data.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 3.1 | Create club: `POST /api/onboard-club` with new email | Club created, 201 response | |
| 3.2 | Login with new club credentials | Today page loads | |
| 3.3 | **Today** page | "Welcome to your dashboard" empty state with import guidance | |
| 3.4 | **Members** page | "No members imported yet" empty state | |
| 3.5 | **Members > First 90 Days** tab | "New member tracking coming soon" empty state | |
| 3.6 | **Service > Quality** tab | "No service quality data yet" empty state | |
| 3.7 | **Service > Staffing** tab | "No staffing data yet" empty state | |
| 3.8 | **Service > Complaints** tab | "No complaint data yet" empty state | |
| 3.9 | **Board Report** | "Board report needs data" empty state | |
| 3.10 | **Admin** | Integration cards visible (static content, always shows) | |
| 3.11 | No page crashes | Zero console errors across all pages | |

---

## Test 4: Dry Run Club (300 Members + Full Data)

Log in with the Bowling Green dry run club credentials.

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 4.1 | **Today** page | Hero card with greeting, rounds count, weather, staffing risks, member alerts | |
| 4.2 | **Members > At-Risk** | Health overview with scored members (AT RISK + CRITICAL counts > 0) | |
| 4.3 | **Members > All Members** | 300 members in table with health scores, archetypes, tiers | |
| 4.4 | Click archetype filter chip | Filters roster (e.g., "Die-Hard Golfer" shows subset) | |
| 4.5 | Click a member name | Member snapshot expands with details + quick actions | |
| 4.6 | **Members > First 90 Days** | Cohort view (shows demo data for now — no crash) | |
| 4.7 | **Service > Quality** | Consistency score, complaint breakdown | |
| 4.8 | **Service > Staffing** | Staffing vs demand data | |
| 4.9 | **Service > Complaints** | Complaint records, status filters | |
| 4.10 | **Board Report** | KPI cards, summary/details tabs | |
| 4.11 | **Admin > Integrations** | Source cards with connected/available status | |

---

## Test 5: E2E Onboarding Pipeline (Automated)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 5.1 | Run `node scripts/test-onboarding-e2e.mjs` | 10/10 steps pass | |
| 5.2 | Step 1: Create club | 201, clubId returned | |
| 5.3 | Step 2: Login | Token returned, role=gm | |
| 5.4 | Step 3: Import 20 members | 20/20 success | |
| 5.5 | Step 4: Import 40 rounds | 40/40 success | |
| 5.6 | Step 5: Import 60 transactions | 60/60 success | |
| 5.7 | Step 6: Import 5 complaints | 5/5 success | |
| 5.8 | Step 7: Compute health scores | 20 members scored | |
| 5.9 | Step 8: Validate session | User object returned | |
| 5.10 | Step 9: Onboarding progress | 1/9 steps complete | |
| 5.11 | Step 10: Fetch members API | 20 members returned | |

---

## Test 6: Jonas CSV Column Mapping (Automated)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 6.1 | Run `npx vitest run src/services/csvImportService.test.js` | 9/9 tests pass | |
| 6.2 | Jonas member fields mapped | Given Name→first_name, Surname→last_name, Member #→member_id | |
| 6.3 | Jonas tee sheet fields mapped | Reservation ID, Tee Time, Duration (min) | |
| 6.4 | Jonas POS fields mapped | Chk#, Sales Area, Net Amount, Tax, Gratuity | |
| 6.5 | Jonas event fields mapped | Event Number, Registration ID, Client Code | |
| 6.6 | Jonas complaint fields mapped | Communication ID, Happometer Score, Subject | |
| 6.7 | All 4 vendors have alias maps | Jonas, ForeTees, Toast, ADP | |

---

## Test 7: Unit Test Suite (Automated)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 7.1 | Run `npx vitest run` | 36/37 pass (1 pre-existing memberService assertion) | |
| 7.2 | Navigation smoke tests | 5/5 — all routes render without crash | |
| 7.3 | Briefing service tests | 2/2 pass | |
| 7.4 | Cockpit service tests | 2/2 pass | |
| 7.5 | CSV import alias tests | 9/9 pass | |
| 7.6 | API client tests | 8/8 pass | |
| 7.7 | Member service tests | 2/3 pass (1 stale assertion — pre-existing) | |

---

## Test 8: Password Reset Flow (End-to-End)

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 8.1 | Run migration 010 | `POST /api/migrations/010-password-resets-table` → 200 | |
| 8.2 | Request reset for valid email | `POST /api/forgot-password { email }` → 200, generic message | |
| 8.3 | Request reset for invalid email | Same 200 response (no email enumeration) | |
| 8.4 | Check email (if SendGrid configured) | Reset email received with branded template + "Reset Password" button | |
| 8.5 | Use reset token with new password | `POST /api/reset-password { token, newPassword }` → 200 | |
| 8.6 | Login with old password | 401 — fails (password changed) | |
| 8.7 | Login with new password | 200 — succeeds | |
| 8.8 | Re-use same reset token | 400 — "Invalid or expired reset link" (token consumed) | |

---

## Test 9: Visual Consistency

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 9.1 | Brand color `#ff8b00` | All buttons, active states, links use orange `rgb(255, 139, 0)` | |
| 9.2 | No old blue `#465fff` | Zero instances in visible UI | |
| 9.3 | No old orange `#F3922D` or `#E8740C` | Zero instances in visible UI | |
| 9.4 | Sidebar background | True black `#000000` | |
| 9.5 | Cards consistent | `rounded-xl border border-gray-200 bg-white p-5` pattern | |
| 9.6 | Font | Plus Jakarta Sans throughout | |
| 9.7 | Tailwind classes applying | `bg-brand-500` computes to `rgb(255, 139, 0)`, `lg:ml-[290px]` applies at 1024px+ | |
| 9.8 | No legacy CSS conflicts | Only `tailwind.css` imported in main.jsx (no global.css, platform-polish.css, design-improvements.css) | |

---

## Test 10: Production Build + Deploy

| # | Step | Expected Result | Pass? |
|---|------|----------------|-------|
| 10.1 | Run `npx vite build` | Build succeeds (no errors, only CSS warning) | |
| 10.2 | Verify code splitting | Separate chunks: vendor-react, vendor-charts, vendor-xlsx, page-* | |
| 10.3 | Verify Vercel deploy | Production readiness URL loads without 500 errors | |
| 10.4 | Check browser console | Zero React errors, zero 404s, zero unhandled promises | |
| 10.5 | Check Vercel function logs | No 500 errors on API endpoints | |

---

## Color Reference

| Token | Hex | Where |
|-------|-----|-------|
| `brand-500` | `#ff8b00` | Buttons, active nav, links, badges |
| `brand-600` | `#e67e00` | Button hover states |
| `brand-50` | `#fff3e0` | Active chip bg, light accent |
| `brand-25` | `#fff9f0` | Hero banner bg |
| `black` | `#000000` | Sidebar |
| `gray-50` | `#f9fafb` | Page background |
| `gray-200` | `#e4e7ec` | Card borders |
| `gray-800` | `#1d2939` | Primary text |
| `success-500` | `#12b76a` | Connected, positive |
| `error-500` | `#f04438` | Error, severe |
| `warning-500` | `#f79009` | Warning |

---

## Pass Criteria

- [ ] Tests 1-4: All manual tests pass (login, layout, empty states, dry run data)
- [ ] Test 5: E2E onboarding script passes 10/10
- [ ] Test 6: Jonas CSV tests pass 9/9
- [ ] Test 7: Unit suite passes 36/37 (1 known pre-existing)
- [ ] Test 8: Password reset flow works end-to-end
- [ ] Test 9: Visual consistency — correct colors, no legacy CSS
- [ ] Test 10: Production build succeeds, Vercel deploys cleanly

**Verdict: Ready for Bowling Green CC onboarding when all criteria met.**
