# Mobile Test Suite — README

> **Created 2026-04-09** as part of the F1 autonomous sweep wave 12.
> **Owner:** GM (Product & Ops) — re-run before every conference demo or pilot mobile-floor walkthrough.

This directory holds Playwright specs that exercise the **mobile-only** surfaces of the Swoop member portal:

- `#/m` — the existing mobile shell (`src/mobile/MobileShell.jsx`)
- `#/m/members` — the staff "members on premise" lookup (`src/mobile/screens/MemberLookupScreen.jsx`)
- `#/m/conference` — the conference-floor demo (`src/mobile/conference/ConferenceShell.jsx`)
- `#/m/inbox`, `#/m/cockpit`, `#/m/settings` — the regular mobile tabs

Mobile specs use Playwright's `iPhone 13` device profile (390×844 viewport, touch events, mobile user-agent). The profile is registered at the bottom of `playwright.config.js`:

```js
{ name: 'iPhone 13', use: { ...devices['iPhone 13'] } }
```

## Naming convention

```
mobile-<surface>-walkthrough.spec.js   ← end-to-end audit walkthrough (slow, captures screenshots)
mobile-<surface>-smoke.spec.js          ← fast regression smoke (no screenshots, no waitForTimeout > 2s)
```

Walkthrough specs are NOT in the smoke gate by default. They're for periodic re-audits.

## Running mobile tests

```bash
# Single spec, mobile project
APP_URL=http://localhost:5174 npx playwright test \
  tests/e2e/mobile-conference-walkthrough.spec.js \
  --project="iPhone 13" --reporter=line

# All mobile specs
APP_URL=http://localhost:5174 npx playwright test \
  tests/e2e/mobile-*.spec.js \
  --project="iPhone 13" --reporter=line

# Mobile smoke against the live dev preview (great for pre-conference final check)
APP_URL=https://swoop-member-portal-dev.vercel.app npx playwright test \
  tests/e2e/mobile-conference-walkthrough.spec.js \
  --project="iPhone 13" --reporter=line
```

## When to add a new mobile spec

Add a new spec when:
1. You ship a new mobile screen (not a tweak to an existing one)
2. You add a new gesture (swipe, pinch, long-press)
3. You add a new mobile-specific layout breakpoint (e.g., a split-screen tablet treatment)
4. The desktop e2e suite cannot meaningfully cover the behavior (touch-only interactions)

Do NOT add a new mobile spec for:
- Pixel-perfect layout tests (use Gemini critique instead — see `scripts/gemini-critique.mjs`)
- Smoke checks already covered by the desktop suite
- Tests that would also pass on Desktop Chrome — those belong in the regular smoke set

## Touch event quirks

Playwright's `iPhone 13` device profile enables `hasTouch: true`. To dispatch swipe gestures:

```js
// Using page.touchscreen (preferred)
await page.touchscreen.tap(200, 400);
// Manual touch sequence
const card = await page.locator('[data-testid="swipe-card"]').first();
const box = await card.boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
// Multi-step swipe (right) — drag from center to right edge
await page.dispatchEvent('[data-testid="swipe-card"]', 'touchstart', {
  touches: [{ clientX: box.x + 50, clientY: box.y + box.height / 2 }],
});
await page.dispatchEvent('[data-testid="swipe-card"]', 'touchmove', {
  touches: [{ clientX: box.x + 350, clientY: box.y + box.height / 2 }],
});
await page.dispatchEvent('[data-testid="swipe-card"]', 'touchend', { touches: [] });
```

The `useSwipeGesture` hook in `src/mobile/hooks/useSwipeGesture.js` expects this exact event sequence — see its `onTouchStart` / `onTouchMove` / `onTouchEnd` handlers for the expected payload shape.

## Audit cadence

- **Before every conference demo:** run `mobile-conference-walkthrough.spec.js` against the live dev preview
- **Before every pilot demo:** run `mobile-on-premise-walkthrough.spec.js`
- **At every Friday release-readiness review:** the GM agent runs both walkthroughs as part of the §10b audit cycle (see `docs/operations/PRODUCT-FINALIZATION.md`)

## Cross-references

- [`docs/operations/PRODUCT-FINALIZATION.md`](../../docs/operations/PRODUCT-FINALIZATION.md) §10b — the §10b audit framework that drives these walkthroughs
- [`docs/operations/storyboard-audits/`](../../docs/operations/storyboard-audits/) — historical audit results
- [`src/mobile/`](../../src/mobile/) — the mobile shell implementation
