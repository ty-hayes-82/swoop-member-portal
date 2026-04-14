# Home Desktop — Mobile Score

**Grade: B**

## What's Working
- Layout is single-column dominant with clear vertical rhythm that will reflow cleanly to 390px without major grid collapse.
- Hero CTAs are large, stacked-ready, and orange-on-dark which preserves contrast at any viewport.
- Cards in "jobs Swoop does" and "integrations" use equal-height grid cells that naturally collapse to 1-col.
- Nav is compact (logo + 5 links + CTA) so the mobile hamburger fallback is straightforward.
- Sticky footer CTA bar is absent on desktop but the DemoCtaSection near the bottom is full-width, which will become the mobile primary conversion point.

## What's Broken
- The 4-up capability grid and 3-up comparison grid rely on flex-wrap rather than explicit media queries; at ~768px they may double-wrap into awkward 2+1 rows before collapsing.
- The dark "AgentsLiveDemo" chat mockup is a fixed-width visual — likely to horizontal-scroll at 390px if width is set in px rather than %.
- Long headline "Your club runs on four systems..." will line-break badly in the 28–32px mobile range without explicit `text-wrap: balance`.
- Trust-strip logo row is horizontally laid out; will either shrink logos below legible size or cause overflow.

## Exact Fix
File: `src/landing/components/HeroSection.jsx` and `src/landing/landing.css`

```css
/* landing.css */
.hero-title { text-wrap: balance; }
@media (max-width: 480px) {
  .hero-title { font-size: clamp(28px, 8vw, 36px); line-height: 1.15; }
  .hero-ctas { flex-direction: column; gap: 12px; }
  .hero-ctas .btn { width: 100%; min-height: 48px; }
}
.agents-live-demo { max-width: 100%; overflow-x: auto; }
.trust-strip { flex-wrap: wrap; gap: 16px; }
@media (max-width: 480px) {
  .trust-strip img { height: 24px; }
}
```
