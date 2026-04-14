# Pricing Desktop — Mobile Score

**Grade: B+**

## What's Working
- Three-tier pricing card layout is a classic pattern that collapses cleanly to vertical stack on mobile.
- Hero stat row (3 metrics) will reflow to a 1-col or 1-row stack without layout pain.
- ROI calculator section uses a two-column chart+stat layout that is isolated and responsive-friendly.
- FAQ accordion below pricing is inherently mobile-friendly.
- Final dark CTA band is full-width and centers well at any size.

## What's Broken
- The ROI calculator chart (line graph with axis labels) is a fixed-aspect SVG that may compress y-axis labels below legibility on mobile if not given `min-height`.
- Pricing tier cards have dense bullet lists — at 390px with 20px side padding, body copy may sit at the 14–15px floor without a `font-size: 16px` override on bullets.
- The "highlighted" middle tier uses a lift/scale effect that breaks on mobile when cards are stacked (creates uneven vertical spacing).
- 3-stat hero row (3000+ / $2.1B / 67%) uses large numbers that won't `clamp()` gracefully without explicit styling.

## Exact Fix
File: `src/landing/components/PricingSection.jsx`, `src/landing/components/RoiCalculatorSection.jsx`, `src/landing/landing.css`

```css
@media (max-width: 768px) {
  .pricing-tiers { grid-template-columns: 1fr; gap: 16px; }
  .pricing-tier.featured { transform: none !important; }
  .pricing-tier li { font-size: 16px; line-height: 1.5; }
  .pricing-hero-stats { flex-direction: column; gap: 24px; }
  .pricing-hero-stats .stat-number { font-size: clamp(40px, 12vw, 64px); }
  .roi-chart { min-height: 240px; }
  .roi-chart text { font-size: 11px; }
}
```
