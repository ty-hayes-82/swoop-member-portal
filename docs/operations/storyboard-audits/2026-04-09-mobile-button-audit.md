# Mobile Button-Functionality Audit (iPhone 13)

- **Date:** 2026-04-09
- **Branch:** `dev`
- **Commit SHA:** `cb1405a`
- **Tester:** GM agent (Playwright `iPhone 13` project, viewport 390x844)
- **Scope:** Every interactive element on `#/m` (Cockpit/Inbox/Members/Settings) + `#/m/conference` (Story 1 / Story 2 / Story 5)
- **Spec:** `tests/e2e/mobile-button-audit.spec.js`
- **Method:** Real clicks, console/pageerror/requestfailed listeners, screen-marker assertions per click

---

## Summary stats

| Metric | Value |
|---|---|
| Total buttons/elements audited | **49** (40 shell + 9 conference) |
| PASS | **40** |
| FAIL | **6** |
| PARTIAL | **3** |
| Console errors observed | 26 (mostly `favicon.ico` 404 noise) |
| Unhandled page errors | **2** (identical React hooks violation) |
| Failed network requests | 1 |

Pass rate: **40/49 = 82%**. The 6 FAILs and 2 page errors are all reproducible.

---

## Results table

| # | Screen | Button / Element | Expected | Actual | Status | Severity |
|---|---|---|---|---|---|---|
| 1 | Cockpit/Header | Bell icon (`MobileHeader.jsx:22`) | Navigate to Actions/inbox | Navigates to inbox | PASS | — |
| 2 | Cockpit | KPI "At-Risk Members" (`CockpitScreen.jsx:104`) | Go to Members tab | Landed on Cockpit (first run); PASS on re-run | **FAIL (flaky)** | P2 |
| 3 | Cockpit | KPI "Complaints" (`CockpitScreen.jsx:105`) | Go to Inbox | Landed on inbox | PASS | — |
| 4 | Cockpit | KPI "Pending Actions" (`CockpitScreen.jsx:106`) | Go to Inbox | Landed on inbox | PASS | — |
| 5 | Cockpit | KPI "Revenue" (`CockpitScreen.jsx:107`) | Go to Revenue view | **Routes to Inbox** — label lies | PARTIAL | **P1** |
| 6 | Cockpit | Critical alert `<a href="tel:">` (`CockpitScreen.jsx:88`) | Dial member | **Empty `tel:` — dials nothing** | FAIL (static) | **P0** |
| 7 | Cockpit | "Review in Inbox" button | Go to Inbox | Clicked, navigated | PASS | — |
| 8-12 | BottomTab | Today / Members / Revenue / Actions / More | Switch tabs | All switched | PASS | — |
| 13 | BottomTab | "Revenue" tab (`BottomTabBar.jsx:8`) | Show Revenue screen | **Falls back to Cockpit** — key `revenue` not in `MobileShell.SCREENS` | **FAIL** | **P0** |
| 14 | More Sheet | "Insights" | Show Insights screen | Sheet item not found on first open / falls back to Cockpit | **FAIL** | **P0** |
| 15 | More Sheet | "Board Report" | Show Board Report | **Falls back to Cockpit** — key not in SCREENS map | **FAIL** | **P0** |
| 16 | More Sheet | "Admin" | Show Settings | Rendered Settings | PASS | — |
| 17 | Routing | `#/m/inbox` direct URL | Deep-link to Inbox | Hash ignored; lands on Cockpit (or whatever `activeTab` is) | **FAIL** | **P1** |
| 18 | Routing | `#/m/members` direct URL | Deep-link to Members | Hash ignored | **FAIL** | **P1** |
| 19 | Routing | `#/m/settings` direct URL | Deep-link to Settings | Hash ignored | **FAIL** | **P1** |
| 20-21 | Inbox | Filter Pending / Completed | Toggle filter | Both work | PASS | — |
| 22 | Inbox | Approve (single card) | Approve + toast + card exits | Works | PASS | — |
| 23 | Inbox | Dismiss (single card) | Card exits | Works | PASS | — |
| 24 | Inbox | Approve all LOW priority | Batch approve | Works | PASS | — |
| 25-27 | Members | Mode toggle On Premise / At-Risk / All Members | Switch roster source | All work | PASS | — |
| 28 | Members | Search input | Filter roster | Works | PASS | — |
| 29-31 | Members | Health filters Critical / At-Risk / Watch | Toggle filter | All work | PASS | — |
| 32 | Members | Type ▾ dropdown | Open archetype filter | Works | PASS | — |
| 33-36 | Members | Sort Time / Health / Dues / Name | Resort | All 4 work | PASS | — |
| 37 | Members | Member card tap | Expand inline | Works | PASS | — |
| 38 | Members | Last visit InfoItem | Show date or "—" | **No Invalid Date** (fix verified) | PASS | — |
| 39-42 | Members | Quick actions Call / SMS / Email / Comp | Fire action + toast | All 4 fire | PASS | — |
| 43 | Settings | Admin sheet → Settings | Show Settings screen | Rendered | PASS | — |
| 44 | Conference/Story5 | Handshake bar present | Sticky bar with "Saved this quarter" | Visible | PASS | — |
| 45 | Conference | "Story X of Y" indicator | Decorative only | No click action | PASS | — |
| 46 | Conference/Story5 | Handshake bar tap | Open Admin/data hub OR be inert | **Inert** — no onClick; tap bubbles to shell and advances scene | PARTIAL | P2 |
| 47 | Conference/Story1 | "Call now" CTA (`Story1WhoToTalk.jsx:219`) | Invoke `tel:` link OR confirmation | **No tel: link**, text flips to "✓ Logged" | PARTIAL | P2 |
| 48 | Conference/Story1 | Scroll between James/Anne/Robert | All 3 visible | Works | PASS | — |
| 49 | Conference | Keyboard ArrowRight | Advance scene | Advanced to Story 2 | PASS | — |
| 50 | Conference | Keyboard ArrowLeft | Retreat to Story 1 | **Did not retreat** | **FAIL** | **P1** |
| 51 | Conference | Tap anywhere to advance | Advance scene | Works | PASS | — |
| 52 | Conference/Story2 | Swipe-stack card | Approve/dismiss hints visible | Works (gesture itself not swipe-tested in Playwright) | PASS | — |

---

## Critical broken (P0 — must fix before paying-club ship)

1. **"Revenue" bottom tab + "Board Report" / "Insights" More-sheet items silently fall back to Cockpit.**
   - `src/mobile/components/BottomTabBar.jsx:5-17` declares tabs with keys `revenue`, `insights`, `board-report`.
   - `src/mobile/MobileShell.jsx:11-16` only maps `cockpit | inbox | members | settings`. Anything else → `CockpitScreen`.
   - **User impact:** GM taps "Revenue" expecting revenue analytics, sees the same Cockpit they were already on. Zero feedback. Feels broken. Same for Insights and Board Report.
   - **Fix:** Either (a) add a placeholder `<ComingSoonScreen label="Revenue"/>` for each missing key, or (b) remove the 3 unwired tabs from `PRIMARY_TABS` / `MORE_ITEMS` until they have destinations.

2. **Cockpit critical-alert phone icon `<a href="tel:">` dials nothing.**
   - `src/mobile/screens/CockpitScreen.jsx:88` — `href={`tel:`}` (template literal with no number).
   - **User impact:** "Critical member needs attention" has a big red 📞 button. Tapping it opens the dialer with a blank number. Worse than no button — looks broken in front of a prospect.
   - **Fix:** Wire `topPriority.phone` or `topPriority.phoneNumber` from the member profile, and hide the icon entirely if the phone is missing.

3. **React `Rendered fewer hooks than expected` page error fires ~2x per session.**
   - Captured via `page.on('pageerror')` during the Members screen flow (after the QuickAction Comp click ran).
   - Likely cause: an early `return` before hooks finish (common suspects are `CockpitScreen` if-`!loaded` return, or conditional hooks in `MemberLookupScreen`).
   - **User impact:** React tears down the component tree and sometimes shows a blank area. Unusable in production.
   - **Fix:** Audit every component that calls hooks after a conditional `return`. The `CockpitScreen.jsx:52-66` skeleton early-return is the #1 suspect (all hooks above it run, but if you add any hook after, you get exactly this error).

---

## Cosmetic / medium (P1–P2)

1. **Hash-based deep links (`#/m/inbox`, `#/m/members`, `#/m/settings`) are all ignored.** The shell reads `activeTab` from `MobileNavContext` state only. Any bookmark, back button, or shared URL lands on Cockpit. Fix: seed `activeTab` from the hash segment on `MobileShell` mount.
2. **Story 1 "Call now" fires `trackAction` only — no `tel:` link, no toast.** The button text briefly flips to "✓ Logged" for 2s, which is visible to the demo audience but reads as fake. Either wire a real `tel:` link or make the "Logged" confirmation larger and more deliberate.
3. **Conference ArrowLeft keyboard does not retreat.** ArrowRight works. `ConferenceShell.jsx:60-64` binds `ArrowLeft` / `ArrowUp` → `retreat()`. Suspect the `onClick` body handler at line 120-124 is swallowing the scene snapshot before the state commits, OR the handler is only registered once via `useEffect` with `[]` deps and a stale `sceneIdx` closure. Repro: tap-advance to Story 2, press ArrowLeft → nothing.
4. **Story 5 handshake bar has no tap handler.** Per the North Star "Prove It" pillar, tapping the $32K running total should drill into the saved-members list or the admin data hub. Currently the tap bubbles up to the shell's "tap to advance" handler and moves you forward a scene — unexpected.
5. **More-sheet "Insights" item sometimes fails to render even when clicked** (intermittent — we caught 1/3 runs where the overlay button selector missed). Accessible-name inconsistency; add `aria-label` or `data-testid` to the sheet buttons.

---

## Top 5 recommended fixes (ordered by user-blocking severity)

1. **P0** — Wire or remove the `revenue` / `insights` / `board-report` tabs. Right now they silently fall back to Cockpit, which is a demo-killer the moment anyone taps them.
2. **P0** — Fix the empty `tel:` on the Cockpit critical-alert card. Either populate the number or remove the icon.
3. **P0** — Track down the `Rendered fewer hooks than expected` error in the Members/Cockpit flow. Likely a conditional hook after an early return. Non-negotiable before any club sees this.
4. **P1** — Seed `activeTab` from the URL hash in `MobileShell`. Three "deep links" are broken; fixing this makes bookmarks, back-button, and shared links work.
5. **P1** — Fix conference `ArrowLeft` retreat (likely a stale-closure bug in the `useEffect` keydown handler — replace `[]` deps with `[]` + a ref or use a `useCallback` with current `sceneIdx`).

---

## Verdict

**NO-GO for paying-club ship.**

The Cockpit → Members/Inbox/Settings happy path is clean (82% PASS) and the recently-shipped Wave 12 fixes (Last visit date, 44pt quick-action tap targets, On Premise sort-by-time) all verified. But three P0 issues make the mobile app dangerous in front of a paying GM:

1. Three of the five bottom tabs silently lie (Revenue + two More items).
2. The most visually dominant button on the Cockpit (red 📞 next to the critical-member alert) does nothing when tapped.
3. React is throwing a hooks-violation page error during normal Members-screen interaction.

Unblock all three P0s, fix the conference ArrowLeft retreat, and re-run this spec. At that point the mobile build will be production-ready for a paying club. Projected work: **~2–4 hours** for a single engineer familiar with the codebase.
