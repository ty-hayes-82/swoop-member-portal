# Platform Mobile — Mobile Score

**Grade: C**

## What's Working
- Single-column flow is maintained throughout; no visible horizontal page scroll.
- Orange CTAs repeat at strong intervals (top, mid, mid-dark, bottom) — good scroll-based conversion pattern.
- Light/dark section alternation preserves visual hierarchy even at small scale.
- Section headings appear appropriately sized and are centered.

## What's Broken
- The "daily brief terminal" dark code block renders with text so small (~10–11px) it's effectively unreadable on a 390px screen.
- The "AgentsLiveDemo" mid-page chat panel exhibits the same problem — mock UI text is below the 14px body floor.
- The "one page replaces four logins" comparison table at the bottom still shows as a multi-column grid — columns compress to unreadable 8–9px text and is the worst offender on the page.
- Card body copy inside the 6-up capability grid appears clipped/truncated due to fixed heights carrying over from desktop.
- No sticky CTA; long page with high effort-to-convert distance.
- Tap targets on nav look ~32px tall — below 44px minimum.

## Exact Fix
File: `src/landing/components/ComparisonSection.jsx`, `src/landing/components/AgentsLiveDemo.jsx`, `src/landing/landing.css`

```css
@media (max-width: 480px) {
  .comparison-grid, .logins-table { display: flex; flex-direction: column; gap: 16px; }
  .comparison-grid > *, .logins-table tr { width: 100%; }
  .capability-card { height: auto !important; min-height: 0; }
  .capability-card p { font-size: 15px; line-height: 1.5; }
  .daily-brief-terminal pre, .daily-brief-terminal code { font-size: 13px !important; }
  .agents-live-demo-panel { font-size: 14px !important; }
  .agents-live-demo-panel .bubble { padding: 12px; }
}
```

In `ComparisonSection.jsx`, gate the desktop `<table>` with `className="hidden md:table"` and render a mobile-only `<div className="md:hidden">` card stack.

Add a `<MobileStickyCta />` in `LandingShell.jsx` visible at `<768px`.
