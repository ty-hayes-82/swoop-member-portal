# Platform Desktop — Mobile Score

**Grade: B-**

## What's Working
- Page uses distinct sectioned bands (light/dark alternation) which reflow cleanly without complex multi-column layouts.
- The "Six jobs Swoop does" 6-up card grid is a clean grid that will collapse to 1 or 2 cols naturally.
- Hero is centered single-column — ideal starting point for mobile.
- The 4-logo pricing/tool comparison table at the bottom is the highest mobile risk but everything else is forgiving.

## What's Broken
- The terminal/code block ("daily brief, written overnight") is a fixed-width monospace panel — will horizontal-scroll or squish below readable size on mobile if not wrapped in `overflow-x: auto`.
- The 4-column "one page replaces four logins" table at the bottom is a desktop-shaped grid with 4 columns of dense text — will be unusable at 390px without a stacked-card variant.
- The 6-up capability grid appears to rely on CSS grid `auto-fit minmax(200px, 1fr)` which at 390px will produce 1 col with very tall cards; acceptable but padding may need tightening.
- Section headlines are very large (likely 48–56px); will need `clamp()` to avoid mobile overflow.

## Exact Fix
File: `src/landing/components/ComparisonSection.jsx` and `src/landing/landing.css`

```css
@media (max-width: 640px) {
  .platform-comparison-table { display: none; }
  .platform-comparison-cards { display: block; }
}
@media (min-width: 641px) {
  .platform-comparison-cards { display: none; }
}
.code-block, .daily-brief-terminal {
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  font-size: clamp(12px, 3.5vw, 14px);
}
.platform-hero h1 { font-size: clamp(32px, 6vw, 56px); text-wrap: balance; }
```

Add stacked card markup in `ComparisonSection.jsx` mirroring each column as an individual `<article>` for mobile.
