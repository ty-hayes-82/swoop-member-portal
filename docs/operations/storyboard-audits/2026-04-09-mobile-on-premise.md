# Mobile On-Premise Member Lookup — GM Audit

**Date:** 2026-04-09
**Branch:** `dev`
**Commit SHA:** `77c694b1ab4a7e64d845240c43c07fa791299e86`
**Route:** `#/m` (Members tab) — powered by `src/mobile/screens/MemberLookupScreen.jsx`
**Device profile:** Playwright `iPhone 13` (390 × 844, touch, DPR 3)
**Spec:** [`tests/e2e/mobile-on-premise-walkthrough.spec.js`](../../../tests/e2e/mobile-on-premise-walkthrough.spec.js)
**Screenshots:** `test-results/mobile-onprem-01..07.png`

---

## Walkthrough summary

| # | Step | Screenshot |
| --- | --- | --- |
| 1 | Mobile shell landing | `test-results/mobile-onprem-01-mobile-shell.png` |
| 2 | Members tab, On Premise default | `test-results/mobile-onprem-02-members-default-onpremise.png` |
| 3 | Card expanded (first on-premise member) | `test-results/mobile-onprem-03-card-expanded.png` |
| 4 | Mode → At-Risk | `test-results/mobile-onprem-04-mode-atrisk.png` |
| 5 | Mode → All Members | `test-results/mobile-onprem-05-mode-all.png` |
| 6 | Search "Whit" | `test-results/mobile-onprem-06-search-whit.png` |
| 7 | James Whitfield expanded w/ Preferences | `test-results/mobile-onprem-07-james-preferences.png` |

Programmatic assertions from the spec run (Playwright console output):

- `[on-premise] currentContext rows rendered: 26` (tee-sheet + synthesized lunch)
- `[at-risk] count row: 7 at-risk members`
- `[all] count row: 300 total members`
- `[touch-target] Call button: 158 × 41.5 px`
- `[preferences] section visible for James Whitfield: true`

---

## Per-mode scoring (§10b Part A rubric, mobile-adapted, 1-5)

| Criterion | On Premise Now | At-Risk | All Members |
| --- | :---: | :---: | :---: |
| **Relevance** — is what's on screen what a floor-walking GM needs right now? | 5 | 4 | 3 |
| **Density** — enough info per card without crowding the 390px viewport? | 4 | 4 | 4 |
| **Signal-to-noise** — does the top of the list answer "who do I walk up to?" | 5 | 4 | 3 |
| **Interaction fidelity** — taps, expand, quick actions feel app-grade? | 4 | 4 | 4 |
| **Data freshness / trust** — context line reads as live, not canned? | 4 | 4 | 3 |
| **Mode score (avg)** | **4.4** | **4.0** | **3.4** |

Rationale:
- **On Premise Now (4.4)** — The `currentContext` line ("Tee time 8:00 AM · North course", "Lunch reservation 12:15 PM · Grill Room") is the hero of this mode and it lands. 26 cards rendered from real tee-sheet + 6 synthesized lunch rows is a believable floor headcount. Losing 0.6 for the lunch reservations still being `TODO(dining-reservations)` synth and for the default sort ordering putting lower health scores at the top, which pushes lunch members down.
- **At-Risk (4.0)** — Clean, familiar list of 7 at-risk members (Linda Leonard, Kevin Hurst, Robert Callahan, Anne Jordan, Robert Mills, Sandra Chen, James Whitfield). Health chips + dues read clearly. This mode is mostly a re-skin of the existing at-risk roster and carries that mode's strengths and limitations.
- **All Members (3.4)** — 300 members load and search works, but the mobile 30-row cap (`filtered.slice(0, 30)` at `MemberLookupScreen.jsx:308`) silently truncates without any "show more" affordance. For a front-desk rush-hour lookup ("Was that Mr. Hargrove with an H?") the only viable entry path is the search box, which is fine — but the full-roster *list* view doesn't add much when the user has already typed.

---

## "Feels off" log — mobile-specific

1. **`Last visit: Invalid Date`** — In the expanded James Whitfield card, the "Last visit" InfoItem renders `Invalid Date`. `MemberLookupScreen.jsx:182` does `new Date(profile.activity?.[0]?.timestamp).toLocaleDateString(...)` but there's no guard on a malformed or ISO-less timestamp. On the GM floor this reads as "the data is broken." (File: `src/mobile/screens/MemberLookupScreen.jsx:182`)
2. **Tee time in context line doesn't match the at-risk daily briefing** — The on-premise card for James Whitfield shows `Tee time 8:00 AM · North course`, but the daily briefing's canonical at-risk tee times list Robert Callahan at 10:42 AM, Anne Jordan at 10:15, and (in the prompt brief) James at 9:20. The tee sheet service is authoritative here but the mismatch with the morning briefing narrative will confuse a GM who just read the briefing. Need to reconcile `getTodayTeeSheet()` (`src/services/operationsService.js`) and `DEMO_BRIEFING.todayRisks.atRiskTeetimes` (`src/services/briefingService.js`) or collapse them to a single source.
3. **Quick-action row is 41.5px tall, under the 44pt Apple HIG minimum.** The `QuickBtn` at `MemberLookupScreen.jsx:227-238` uses `padding: '10px'` + 13px text, which renders at ~41.5px. During a Saturday rush with gloved, sweaty hands, a 2.5px miss on four stacked targets is a real fat-finger hazard. Bump to `padding: '12px'` → ~45.5px.
4. **Mode toggle pills also clock in at ~38px tall** (`padding: '10px 8px'`, `fontSize: 12`). Same story as quick actions — below HIG minimum. File: `MemberLookupScreen.jsx:326-334`.
5. **No `lastSeenLocation` badge on most on-premise members.** The feature ships the badge (`MemberLookupScreen.jsx:159-163`) but the underlying roster data at `src/data/members.js` only populates `lastSeenLocation` for a handful of members. On the screenshot, the tee-sheet members I can see all omit it. The prompt brief said it should show for on-premise members — effectively dead UI right now.
6. **On Premise list is sorted by health ascending by default**, so the first 30 cards are all the lowest-health members. A front-desk staff member looking for "Mr. Sanford who just walked in at the pro shop" can't scan for him by name in the list view and has to use search instead. Consider defaulting to `sortBy: 'time'` (chronological tee-time order) for on-premise mode.
7. **Expanded-card "Complaint unresolved 6 days" warning is visually louder than the preferences section** — which is exactly backwards for on-floor use. When a GM walks up to a member, the *first* thing they want is "what does this person like" (dining preferences, booth seating, slow mornings with coffee), not the 6-day-old complaint chip. Consider swapping visual weight.

---

## Search responsiveness

- **Latency:** Typing "Whit" in the search field filters the list with no perceptible delay (sub-100ms on the emulator; no loading state needed because the search is a client-side `.filter()` over at most 300 in-memory members). **PASS.**
- **Fuzzy matching quality:** The current implementation (`MemberLookupScreen.jsx:286`) is a case-insensitive `includes()` substring match on `name`. No Levenshtein, no initials search. "Whit" → Whitfield works; "jwhit" would not; "Jim Whit" would not. Acceptable for MVP; note as a Tier-2 improvement.
- **Autofocus behavior:** `autoFocus` on the input means the on-screen keyboard pops up immediately when a GM taps the Members tab. Nice on a floor walk; potentially annoying in a quick mode-toggle flow.

---

## Touch target audit

| Element | Measured | Meets 44pt? | File reference |
| --- | --- | :---: | --- |
| Quick action buttons (Call / SMS / Email / Comp) | 158 × **41.5 px** | ✗ (2.5px short) | `MemberLookupScreen.jsx:227-238` |
| Mode toggle pills | full width × ~38 px | ✗ | `MemberLookupScreen.jsx:326-334` |
| Health filter chips (Critical / At-Risk / Watch) | auto × ~30 px | ✗ | `MemberLookupScreen.jsx:244-253` |
| Sort pills (Health / Dues / Name) | auto × ~26 px | ✗ | `MemberLookupScreen.jsx:411-420` |
| Search input | full × ~46 px | ✓ | `MemberLookupScreen.jsx:339-351` |
| Bottom tab bar buttons | full × ~56 px | ✓ | `BottomTabBar.jsx` |

**Verdict:** Primary navigation (bottom tabs, search) is sized correctly. Secondary controls (mode toggle, filters, sort, quick actions) are all under the HIG minimum by 3-18 px. Not catastrophic, but the filter/sort pills especially are asking for mistaps.

---

## Information density (390 px viewport)

On-premise cards render at roughly 88 px of vertical rhythm per collapsed card (score ring + name + context + archetype/dues line) — comfortable for thumb-scrolling. An expanded card consumes about 540 px, so ~1.5 expanded cards fit above the fold with the sticky mode toggle at the top. That's workable.

The Preferences section specifically is well-formatted: two-up grid of InfoItem cards, clear uppercase labels, readable 13px body.

**No text is clipped** and nothing crowds the 390px edge. Padding is consistent at 16px gutters.

---

## Top 5 recommended improvements

1. **Fix the `Invalid Date` rendering.** Wrap `new Date(profile.activity?.[0]?.timestamp).toLocaleDateString(...)` in a null-guard at `src/mobile/screens/MemberLookupScreen.jsx:182`. Fall back to "—" on NaN. 10-minute fix, high trust payoff.
2. **Bump quick-action + mode-toggle padding to satisfy HIG.** Change `padding: '10px'` → `'12px'` at `MemberLookupScreen.jsx:230` and `MemberLookupScreen.jsx:327`. Same visual balance, safer touch targets.
3. **Default On Premise sort to tee-time chronological** (not health ascending). When a GM is walking the floor, the mental model is "it's 10:15am, who is teeing off in the next 30 minutes", not "who has the worst health score regardless of whether they're here." Introduce a `time` sort option or have `buildOnPremiseRoster()` return in tee-time order and make that the on-premise default. File: `MemberLookupScreen.jsx:266-309`.
4. **Swap the expanded-card visual hierarchy** so Preferences leads and the risk/complaint chip is secondary. What a GM needs at the handshake is "he likes booth seating and slow mornings with coffee refills," not a 6-day-old complaint. File: `MemberLookupScreen.jsx:168-211`.
5. **Reconcile tee-time data between `getTodayTeeSheet()` and `DEMO_BRIEFING.todayRisks.atRiskTeetimes`.** Today they produce different numbers for the same members (James Whitfield 8:00 AM vs. 9:20 AM). Either collapse to one source, or have `buildOnPremiseRoster` prefer the briefing's authoritative times for members that appear in both.

---

## Verdict — Saturday morning front-desk readiness

**Conditional YES, with a 30-minute polish pass first.**

The feature ships a genuinely useful new capability: a GM walking the floor can tap Members, immediately see who is currently on premise, expand a card, and see that member's dining preferences and notes before greeting them at the terrace. The 3-mode toggle is the right mental model, the `currentContext` line is the correct hero, and the real tee-sheet data makes this trustworthy.

Blockers for a Saturday rush:
- **Fix `Invalid Date`** (must — looks broken to a non-technical user).
- **Bump touch targets** (must — 41.5px fails the glance test, and the quick-action row is exactly where a GM taps to log outreach).
- **Reorder expanded card** so preferences lead (should — the whole point of this surface on the floor).

If those three land, this is production-ready for a front-desk staff member during a Saturday morning rush. Without them, it's a strong beta that a GM would use themselves but wouldn't hand to a new front-desk hire without a walkthrough.

---
*Auditor: Claude (GM Product & Ops agent), run via `npx playwright test tests/e2e/mobile-on-premise-walkthrough.spec.js --project="iPhone 13"`*
