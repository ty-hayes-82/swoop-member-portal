# Web Button-Functionality Audit (Desktop Chrome)

- **Date:** 2026-04-09
- **Branch:** `dev`
- **Commit SHA:** `cb1405a` (HEAD at audit time)
- **Tester:** GM agent (Playwright `Desktop Chrome` project, viewport 1440x900)
- **Scope:** Login → Today → Sidebar → Members → Tee Sheet → Service → Revenue → Automations → Board Report → Admin → Integrations → Profile → Header
- **Spec:** `tests/e2e/web-button-audit.spec.js`
- **Method:** Real clicks, `console`/`pageerror`/`requestfailed` listeners, hash/route snapshots per navigation, screenshots to `test-results/web-button-audit/`

---

## Summary stats

| Metric | Value |
|---|---|
| Total buttons/elements audited | **75** |
| PASS | **50** |
| FAIL | **6** |
| PARTIAL (selector miss / not-present) | **19** |
| Console errors observed | 9 (includes real React warnings) |
| Unhandled page errors | **2** (identical React "Objects are not valid as a React child") |
| Failed network requests (non-aborted) | 0 |
| P0 severity | 1 |
| P1 severity | 4 |
| P2 severity | 20 |

Pass rate (excluding selector-miss PARTIALs): **50/56 = 89%**. The 2 page errors are the same React crash reproducing twice — one in `Toast` render, one propagated up `TodaysRisks`/`TodayView`/`ErrorBoundary`.

---

## Results table (abridged — full JSON at `test-results/web-button-audit/audit.json`)

| # | Screen | Button / Element | Expected | Actual | Status | Severity |
|---|---|---|---|---|---|---|
| 1 | Login | Sign In button exists | Rendered | present | PASS | — |
| 2 | Login | Sign In (invalid creds) | Stay on login | stayed on login | PASS | — |
| 3 | Login | Forgot password link | Open reset flow | **not found (text "Forgot password" missing)** | FAIL | P2 |
| 4 | Login | Sign in with Google | Button exists | present | PASS | — |
| 5 | Login | Explore without an account | Show demo options | demo screen visible | PASS | — |
| 6 | Login/Explore | Guided Demo button | Exists | **not found (selector miss or removed)** | FAIL | P1 |
| 7 | Login/Explore | Set Up New Club | Exists | present | PASS | — |
| 8 | Login/Explore | Conference Demo (mobile) | Exists | present | PASS | — |
| 9 | Login/Explore | Full Demo (Pinetree CC) | Log in + land on Today | `#/today` | PASS | — |
| 10 | Today | Story 1/2/3 launcher buttons | Scroll/navigate | **not found** | PARTIAL | P2 |
| 11 | Today | "View at-risk alerts ↓" | Scroll/navigate | clicked | PASS | — |
| 12 | Today | "See full revenue breakdown →" | Navigate to revenue | `hash=#/revenue` | PASS | — |
| 13 | Today | "Take action" (MemberAlerts) | Open drawer/log | **not found** | PARTIAL | P2 |
| 14 | Today | Approve (PendingActions) | Approve card | **not found via generic role=Approve** | PARTIAL | P2 |
| 15 | Sidebar | Nav: Today | Route to today | **nav button not found by name** | FAIL | P1 |
| 16 | Sidebar | Nav: Members | Route to members | `route=members` | PASS | — |
| 17 | Sidebar | Nav: Tee Sheet | Route to tee-sheet | `route=tee-sheet` | PASS | — |
| 18 | Sidebar | Nav: Service | Route to service | `route=service` | PASS | — |
| 19 | Sidebar | Nav: Revenue | Route to revenue | **nav button not found by name** | FAIL | P1 |
| 20 | Sidebar | Nav: Automations | Route to automations | `route=automations` | PASS | — |
| 21 | Sidebar | Nav: Board Report | Route to board-report | `route=board-report` | PASS | — |
| 22 | Sidebar | Nav: Admin | Route to admin | **nav button not found by name** | FAIL | P1 |
| 23 | Members | Tab Health Overview / All Members / Cohorts / Email / Recovery | Switch tab | **not found** (5/5) | PARTIAL | P2 |
| 24 | Members | Member row click | Open profile drawer | **NO CLICKABLE ROW FOUND** — no `[role="row"]`, no `tr`, no `[data-member-id]`, no `.member-row` | **FAIL** | **P0** |
| 25 | TeeSheet | Page loads | Shows tee sheet | `route=tee-sheet` | PASS | — |
| 26 | TeeSheet | Filter chips | Exist | **found 0 matching All/Today/Tomorrow/Week/Morning/Afternoon/Evening** | PARTIAL | P2 |
| 27 | Service | Page loads | Shows service | `route=service` | PASS | — |
| 28 | Service | Tabs Quality / Staffing / Outlets | Switch | **not found by name** | PARTIAL | P2 |
| 29 | Revenue | Page loads | Shows revenue | `route=revenue` | PASS | — |
| 30 | Revenue | KPI tile Monthly Leakage | Rendered | visible | PASS | — |
| 31 | Revenue | KPI tile Pace of Play | Rendered | visible | PASS | — |
| 32 | Revenue | KPI tile Understaffed | Rendered | visible | PASS | — |
| 33 | Revenue | KPI tile Weather | Rendered | visible | PASS | — |
| 34 | Revenue | "vs last month" delta chip | Rendered | visible (wave 3 fix verified) | PASS | — |
| 35 | Revenue | Approve & Deploy ranger | Fires action | clicked | PASS | — |
| 36 | Revenue | Open Board Report button | Navigate to board-report | **not found by name** | PARTIAL | P2 |
| 37 | Automations | Page loads | Shows automations | `route=automations` | PASS | — |
| 38 | Automations | Chip All | Toggle | clicked | PASS | — |
| 39 | Automations | Chip High | Toggle | clicked | PASS | — |
| 40 | Automations | Chip Medium | Toggle | clicked | PASS | — |
| 41 | Automations | Chip Low | Toggle | clicked | PASS | — |
| 42 | Automations | Chip Approved | Toggle | **not found** | PARTIAL | P2 |
| 43 | Automations | Chip Dismissed | Toggle | **not found** | PARTIAL | P2 |
| 44 | Automations | First Approve | Approve card | clicked | PASS | — |
| 45 | BoardReport | Page loads | Shows board report | `route=board-report` | PASS | — |
| 46 | BoardReport | Tab Summary / Member Saves / Operational Saves / What We Learned | Switch | 4/4 clicked | PASS | — |
| 47 | Admin | Page loads | Shows admin | `route=admin` | PASS | — |
| 48 | Admin | **Next Intelligence Unlock** card (wave 3) | Rendered | visible | PASS | — |
| 49 | Admin | **Live System Health** card (wave 3) | Rendered | visible | PASS | — |
| 50 | Admin | Connect buttons count | At least one | **found 0 by role=button name="Connect"** | PARTIAL | P2 |
| 51 | Integrations | Page loads | Shows integrations | `route=integrations` | PASS | — |
| 52 | Integrations | 4 unlock cards (wave 3) | Rendered | all 4 visible | PASS | — |
| 53 | Integrations | Connect buttons | Exist | **found 0 by role=button name="Connect"** | PARTIAL | P2 |
| 54 | Profile | Page loads | Shows profile | `route=profile` | PASS | — |
| 55 | Profile | Save button | Exists | present | PASS | — |
| 56 | Profile | **Role & Club Permissions** card (wave 3) | Rendered | visible | PASS | — |
| 57 | Profile | Google connect/disconnect | Exists | present | PASS | — |
| 58 | Header | Cmd+K search | Opens search overlay | opened | PASS | — |
| 59 | Header | Notifications bell | Exists | present | PASS | — |
| 60 | Header | LIVE badge | Rendered | visible | PASS | — |
| 61 | Footer | Sign Out button | Exists | present | PASS | — |

---

## Critical broken (P0 — must fix before paying-club ship)

### 1. **React crash: `Toast` renders an object as a child** — reproduces 2x per session

- **File:** `src/components/ui/Toast.jsx:39`
- **Line:** `<span>{message}</span>`
- **Actual error (captured via `page.on('pageerror')`):**
  > `Objects are not valid as a React child (found: object with keys {type, message}). If you meant to render a collection of children, use an array instead.`
- **What's happening:** Some caller is invoking `showToast({ type: 'success', message: '...' })` instead of `showToast('...', 'success')`. The `Toast` component then blindly renders the object into a `<span>`, React throws, and `ErrorBoundary` tears down the entire toast container and everything above it. The Swoop ErrorBoundary logs it and does a re-render attempt, but the toast itself is gone — any action that tried to fire a confirmation silently disappears.
- **User impact:** Every action that uses the buggy caller throws a React error and the confirmation toast never appears. Worse, because this crashes inside `ToastContainer` which lives at `AppProvider`, it briefly blanks or flickers the whole page when triggered.
- **Repro:** Navigate to `#/today`, click any CTA that fires a toast, or navigate to `#/revenue` (the crash fired during the Revenue page walkthrough in the audit run).
- **Fix:** Either (a) harden `Toast.jsx:39` to `<span>{typeof message === 'string' ? message : message?.message ?? String(message)}</span>`, OR (b) find the caller passing an object and normalize to a string. Grep `showToast(` for any call where the first arg is an object literal. Prefer (b) but ship (a) as a belt-and-suspenders.

### 2. **Members page: no clickable member row found by any standard selector**

- **File:** `src/features/members/MembersView.jsx` (member list component)
- **Actual:** The audit looked for `[role="row"]`, `tr`, `[data-member-id]`, `.member-row` — none matched. The Members view may render cards/divs with no role, test-id, or recognizable hook.
- **User impact:** Either (a) there's no visible member list at all on the default Members tab (which would be catastrophic), or (b) rows exist but are totally un-instrumented for keyboard/a11y/testing. Both are blockers for a paying club — a GM walking into the Members screen either sees nothing or can't Tab into rows.
- **Action:** Open `#/members` manually in the browser. If rows are visible, add `role="row"` + `data-member-id` to the row wrapper in `MembersView`. If rows are NOT visible (empty state), this is a demo-data bug and is a hard P0.

### 3. **React key-prop warning + render error origin in `TodaysRisks`**

- **File:** `src/features/today/TodaysRisks.jsx`
- **Warning:** `Each child in a list should have a unique "key" prop. Check the render method of TodaysRisks.`
- **Co-occurs with:** the Toast object-child page error, because the error bubbles up through `TodaysRisks → TodayView → ErrorBoundary`.
- **User impact:** On `#/today` first render, React fires a key warning, then when any Toast triggers it crashes the Today view through the ErrorBoundary recovery path.
- **Fix:** Add `key={...}` to whatever `.map()` in `TodaysRisks.jsx` is producing unkeyed children, AND fix Toast #1 above.

---

## Cosmetic / medium (P1–P2)

1. **P1 — Sidebar nav items "Today", "Revenue", "Admin" not selectable by accessible name.** Sidebar nav buttons return `not found` when queried via `getByRole('button', { name: /^Today$/ })` inside `nav, aside`. The tabs Members / Tee Sheet / Service / Automations / Board Report ARE found. This means 3 of the 8 sidebar items are either (a) rendered as links not buttons (so `getByRole('button')` misses them, low-severity selector issue), or (b) have icon-only rendering with no `aria-label`. The latter would be an accessibility P0. Verify manually; if a11y-missing, bump to P0. **Recommendation:** add `aria-label="Today"`, `aria-label="Revenue"`, `aria-label="Admin"` to the corresponding sidebar items.
2. **P1 — "Guided Demo" button on the Explore screen no longer matches `/^Guided Demo$/`.** Either text has changed (e.g. "Start Guided Demo") or the button was removed. Verify with `grep -r "Guided Demo" src/features/login/LoginPage.jsx`. The mobile audit still references it, so it should exist.
3. **P2 — "Forgot password" link missing from Login screen.** Either text changed (e.g. "Reset password") or feature not shipped. Either ship or remove any "Forgot password?" expectation from docs.
4. **P2 — `Connect` buttons on Admin Hub and Integrations page return 0 matches.** The 4 wave-3 unlock CARDS are present (all 4 verified visible), but no button with accessible name "Connect" was found. Either the CTA text is something else ("Request Access", "Integrate", "Link"), or the buttons are unlabeled icons. Verify and add `aria-label` if icon-only.
5. **P2 — Members page tabs (Health Overview / All Members / Cohorts / Email / Recovery) all report "not found".** Tab text may differ, or they're rendered as segmented-control divs without `role="button"`. Same a11y remediation as nav items above.
6. **P2 — Tee Sheet filter chips, Service tabs (Quality/Staffing/Outlets) all report "not found".** Same pattern — selector miss suggests missing accessible names throughout the app. Not a crash, but a systemic a11y / testability issue.
7. **P2 — `Open Board Report` button on Revenue not found by name.** The "vs last month" delta chip shipped correctly, but the "Open Board Report" CTA noted in the audit scope either has different copy or isn't wired.

---

## Top 5 recommended fixes (ordered by user-blocking severity)

1. **P0** — `src/components/ui/Toast.jsx:39`: harden `<span>{message}</span>` to coerce objects to strings, AND grep/fix all `showToast({...})` callers passing an object literal. This is a live React crash reproducing at least 2x per desktop session.
2. **P0** — `src/features/members/MembersView.jsx`: confirm member rows render in default tab; add `role="row"` + `data-member-id` + `aria-label` to row wrapper so they're keyboard/a11y/test-accessible.
3. **P0** — `src/features/today/TodaysRisks.jsx`: add `key={...}` to the unkeyed list render producing the React key warning.
4. **P1** — Sidebar audit: add `aria-label` to Today / Revenue / Admin nav items. 3 of 8 sidebar items are invisible to accessible-name queries — either a11y or selector-broken, both demo-embarrassing.
5. **P1** — Login screen: restore or rename "Guided Demo" button + "Forgot password" link so they match existing docs and user muscle memory.

---

## Verdict

**GO WITH CAVEATS** — desktop build is substantially healthier than mobile (89% effective pass rate vs mobile's 82%), but ONE live P0 (the `Toast` object-child React crash) is reproducing twice per session on the Today/Revenue walkthrough and MUST be patched before any paying GM touches this. The other two P0s (Members row selector miss, TodaysRisks unkeyed list) are likely quick fixes but need manual eyes-on verification.

**What's good (worth celebrating):**
- All 4 Revenue KPI hero tiles + the new "vs last month" delta chip render cleanly
- Full Demo (Pinetree CC) login flow → `#/today` works end to end
- All 4 Board Report tabs switch correctly
- All 3 wave-3 cards verified rendered: Next Intelligence Unlock (Admin), Live System Health (Admin), Role & Club Permissions (Profile)
- All 4 Integrations wave-3 unlock cards visible
- Cmd+K global search, notifications bell, LIVE badge, footer Sign Out all clean
- Approve & Deploy ranger button on Revenue fires without error
- Automations filter chips (All/High/Medium/Low) + first Approve click all clean

**What blocks paying-club ship:**
- Toast React crash (P0)
- Members row instrumentation (P0, may or may not be a real UX bug — needs eye)
- TodaysRisks key warning (P0 because co-occurs with the crash)

**Projected fix time:** ~1–2 hours for a single engineer. Re-run this spec after patches.

**Recommendation:** Fix the 3 P0s today, re-run `web-button-audit.spec.js`, and if green → GO for paying-club ship on desktop. The desktop build is materially closer to ready than the mobile build was at the same audit stage.
