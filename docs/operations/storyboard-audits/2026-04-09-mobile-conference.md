# Mobile Conference Demo — GM Walkthrough Audit

- **Date:** 2026-04-09
- **Branch:** dev
- **Commit SHA:** 77c694b1ab4a7e64d845240c43c07fa791299e86
- **Emulator:** Playwright `iPhone 13` project (WebKit, 390x844, touch)
- **Route:** `#/m/conference`
- **Spec:** `tests/e2e/mobile-conference-walkthrough.spec.js`
- **Screenshots:** `screenshots/2026-04-09-mobile-conference/`
  - `01-story1-full.png` — Story 1 card (James Whitfield)
  - `02-story2-stack.png` — Story 2 Tinder stack (post-round dining card)
  - `03-after-swipe-bar-ticked.png` — Post-swipe handshake bar

---

## Per-scene scoring (§10b Part A rubric: 1 = not following storyboard, 5 = storyboard-faithful)

| Scene | Score | Notes |
|---|---|---|
| **Story 5 — $XXK handshake bar (persistent)** | **3 / 5** | Baseline `$108K / 6 members` pulls from `getMemberSaves()` as spec'd. Count ticks correctly on swipe (6 → 7 observed). BUT: on iPhone 13 width the two columns ("Saved this quarter" / "Members rescued") collide — "SAVED THIS QUARTERMEMBERS RESCUED" with no gap. Dollar value also did not tick in round-to-K display (`$108K → $108K`) because Story 2's first card impactMetric parses to <$500. |
| **Story 1 — "Who should I talk to today?"** | **2 / 5** | Canonical trio present (James Whitfield 9:20, Anne Jordan 10:15, Robert Callahan 10:42). Decay sequence chips render (CRM → POS → EMAIL). Source badges (Tee Sheet / POS / Member CRM / Email) render. **Stage-breaking bug: Health score renders blank** — shows `/100` with NO number. Root cause: `briefingService.getDailyBriefing()` dynamic path emits `score: 42` but `Story1WhoToTalk.jsx` reads `risk.health`, which is undefined (`src/services/briefingService.js:163-168` vs `src/mobile/conference/Story1WhoToTalk.jsx:147`). The static `DEMO_BRIEFING` fallback uses `health`, the live demo-mode path uses `score` — contract drift. |
| **Story 2 — "Swipe to save"** | **3 / 5** | Tinder stack renders, 15 pending actions, top card shows Revenue Analyst badge + John Harrison + impact line. Swipe gesture WORKS (`dispatchEvent touchstart/move/end` fires the gesture hook, card approves, handshake count increments). Keyboard fallback (`ArrowRight`/`ArrowLeft`) navigates scenes cleanly. Issues: (a) bottom of card clipped behind the "End of demo · swipe back" hint on iPhone 13, (b) a red "Action may not have been delivered — check status" toast flashes after swipe because `approveAction?.()` hits an API that 404s in demo mode, (c) no visible approve/dismiss BUTTONS — a presenter on a non-touch kiosk can only advance via keyboard since the card only exposes a gesture. |

**Time-to-insight per scene (observed in walkthrough):**
- Story 1: ~2s to James card visible · ~5s to grok health+decay (would be ~2s if health number rendered)
- Story 2: ~2s to top card visible · ~3s to swipe-right gesture complete + bar tick
- Story 5: <1s baseline read · ~0.7s tween on each swipe approval

---

## "Feels off" log (screen-level)

1. **[S1 · stage-breaker]** Health score is blank. The big colored hero number showing `/100` with nothing before it reads as "app broken" to a conference audience. `src/mobile/conference/Story1WhoToTalk.jsx:147` — either rename to `risk.score ?? risk.health` or fix the briefing contract.
2. **[S5 · layout]** On iPhone 13 (390px) the two flex columns inside the handshake bar collide with zero gap: "SAVED THIS QUARTERMEMBERS RESCUED" runs together. `src/mobile/conference/Story5HandshakeBar.jsx:197-202` — the outer flex has `justify-content: space-between` + `padding: 6px 18px` but no `gap`; one word of each label overflows its column.
3. **[S1 · occlusion]** The bottom-pinned "Tap for next →" hint overlays the source badges row at the bottom of James's card on an iPhone 13 viewport. Source badges are only partly visible through the blurred pill. `src/mobile/conference/ConferenceShell.jsx:136-163` (hint has `zIndex: 20` over scene content that has no bottom padding compensation for the hint).
4. **[S1 · positioning]** The "STORY 1 OF 2" chip floats 80px below the handshake bar with empty space above and below, making it feel detached from both the bar and the card. Move it closer to the bar or inline with it.
5. **[S2 · gesture-only]** Only swipe is exposed; no tappable Approve / Dismiss buttons. For a conference kiosk that's occasionally laptop-mode, and for a presenter passing the phone, a 44x44pt tap-target pair underneath the card would be a safer fallback.
6. **[S2 · failure toast]** After each approve, a red toast reading "Action may not have been delivered — check status" appears at the bottom because the demo-mode `approveAction` still tries to hit the real API. Bad optics mid-demo; at minimum suppress the toast on the conference route, or stub the API in demo mode.
7. **[S2 · card clipping]** Bottom of the top card (impactMetric + divider + arrow hints) is obscured by the "End of demo · swipe back ←" hint. The card's `h-[480px]` and the fixed bottom hint collide.
8. **[Router · eng-only, does not break stage]** The conference route has a hash-routing bug: any user who clicks "Conference Demo (mobile)" lands on `#/today` instead of `#/m/conference`, because `LoginPage.jsx:393` sets the hash via `setTimeout(100)` AFTER `onLogin()` flips auth, and `NavigationContext.jsx:85-88` sees `m/conference` as unknown and `replaceState`'s it back to `#/today`. The only working entry is a direct deep-link from a fresh load (e.g. paste URL in phone). I bypassed this in the spec by seeding localStorage and `page.goto('/#/m/conference')`, but a real conference attendee clicking the button on the demo iPhone will NOT reach the scene.

---

## Top 5 recommended mobile-specific fixes

1. **Fix health-score blank** (S1 stage-breaker). `src/mobile/conference/Story1WhoToTalk.jsx:147` — change `{risk.health}` to `{risk.score ?? risk.health}`; similarly line 36 `healthColor(risk.health)` → `healthColor(risk.score ?? risk.health)`.
2. **Fix conference-route wiring** so the "Conference Demo (mobile)" button actually lands on the scene. Either add `'m/conference'` to `VALID_ROUTES` with a passthrough in `src/context/NavigationContext.jsx:85` that early-returns before the `replaceState` clobber, OR have `LoginPage.jsx:393` set the hash BEFORE calling `onLogin`, OR have `src/App.jsx:179` `RouterViews` subscribe to `hashchange` like the `App` wrapper does (line 242).
3. **Handshake bar layout**: add `gap: 12` (or `column-gap`) and `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` to the two flex columns in `src/mobile/conference/Story5HandshakeBar.jsx:197-256`. Also consider abbreviating labels on narrow viewports ("Saved Q4" / "Rescued").
4. **Kill the red error toast on the conference route**: suppress `approveAction`'s API error surfacing when `window.location.hash.startsWith('#/m/conference')`, or have `Story2SwipeToSave.jsx:167` skip `approveAction` entirely and only call `trackAction` (which already fires locally). File: `src/mobile/conference/Story2SwipeToSave.jsx:167-168`.
5. **Add a safe bottom inset** to the scene container so the bottom hint never overlaps content. `src/mobile/conference/ConferenceShell.jsx:125-131` — change scene `paddingBottom` to `calc(env(safe-area-inset-bottom, 0px) + 80px)`. Also consider adding tap-target Approve/Dismiss buttons to `Story2SwipeToSave.jsx` so desktop-kiosk and handoff flows have a non-gesture fallback.

---

## Verdict: **NO-GO (conditional)** for next week's tech conference

The scene concept itself is strong, the swipe+tick handshake loop works, the canonical trio is correct, and on a rehearsed direct deep-link it could be presentable. But three issues are show-stoppers if unaddressed:

1. **The button that the tag above the demo promises doesn't work** — clicking "Conference Demo (mobile)" from Explore sends the attendee to `#/today`, not the conference scene. This is a 100%-repro bug on the main entry.
2. **Story 1 health score renders blank** — "AT RISK · /100" reads as a broken app on a 20-foot screen.
3. **Red error toast after every swipe** — "Action may not have been delivered" is the worst possible message for an AI-agent demo; it directly undermines the "Swoop acts for you" pitch.

**Go verdict if:** all three are fixed. Items 1-2 are 5-minute fixes (contract rename + route whitelist); item 3 is also small (short-circuit on conference route). With those landed and re-audited, scores rise to 4+/5 across the board. Do NOT take this demo to a conference in its 77c694b state.
