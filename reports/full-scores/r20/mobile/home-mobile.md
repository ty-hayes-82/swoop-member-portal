# Home Mobile — Mobile Score

**Grade: C+**

## What's Working
- Content does reflow to a single column — no catastrophic horizontal scroll visible in the full-page capture.
- Primary orange "Book a Demo" CTAs are full-width and appear repeatedly down the page, giving multiple conversion points.
- Dark hero, dark AgentsLiveDemo, and dark final CTA sections alternate with light sections for visual rhythm.
- Footer form appears stacked, full-width — correct pattern for 390px.

## What's Broken
- Hero headline looks cramped against viewport edges — insufficient horizontal padding (likely <20px), making text feel boxed-in.
- The AgentsLiveDemo chat card appears to render at near-full width with tiny type (~11–12px) — below the 14px body minimum and likely unreadable.
- Feature/capability cards stack in 2-col at 390px in some bands, producing sub-16px body text per card. They should force 1-col.
- No sticky CTA bar detected; user must scroll long distances between conversion points on a ~10,000px tall page.
- The comparison table band (dark, mid-page) appears to keep multi-column layout, causing text to compress below legibility.
- Nav appears to be a thin top bar with small link targets; likely <44px tap height.

## Exact Fix
File: `src/landing/landing.css` and `src/landing/components/LandingNav.jsx`

```css
/* landing.css — global mobile guards */
@media (max-width: 480px) {
  .section { padding-left: 20px; padding-right: 20px; }
  .card-grid, .capability-grid, .comparison-grid { grid-template-columns: 1fr !important; }
  .agents-live-demo, .agents-live-demo * { font-size: 14px !important; line-height: 1.4; }
  .comparison-table { display: block; }
  .comparison-table thead { display: none; }
  .comparison-table tr { display: block; margin-bottom: 16px; }
  .comparison-table td { display: block; padding: 8px 0; }
}
/* sticky mobile CTA */
.mobile-sticky-cta {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #0b0b0b; padding: 12px 16px; z-index: 50;
  display: none;
}
@media (max-width: 768px) { .mobile-sticky-cta { display: block; } body { padding-bottom: 72px; } }
.landing-nav a { min-height: 44px; display: inline-flex; align-items: center; }
```

Add `<MobileStickyCta />` to `LandingShell.jsx` rendering a single 48px-tall "Book a Demo" button.
