# Home Mobile — Design Score

**Grade: C+**

## What's Working
- Single-column stack reflows cleanly; no horizontal scroll artifacts visible.
- Orange CTA remains the sole chromatic anchor, easy to spot when thumbing.
- Dark hero still reads hero-like at small width.

## What's Broken
- The page is brutally long — screenshot shows ~20+ stacked sections on mobile with almost no visual differentiation; users will scroll-blind.
- Cards collapse to full width but retain desktop padding, producing thin columns of text that feel monolithic.
- No sticky mobile CTA — once the hero scrolls away the orange button disappears entirely for many screens.
- Section headlines and card titles look nearly identical at mobile type sizes (hierarchy collapses).
- The dark "agents" band and the footer CTA block look visually interchangeable — bookending is lost at mobile scale.

## Exact Fix
`src/landing/components/LandingNav.jsx` — add a sticky mobile demo CTA bar:
```jsx
<div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 p-3">
  <a href="/contact" className="block w-full text-center bg-orange-500 text-white font-semibold py-3 rounded-lg">Book a Demo</a>
</div>
```
`src/landing/landing.css` — tighten mobile section rhythm and boost H2 at mobile:
```css
@media (max-width: 640px) {
  .landing section { padding-block: 3rem; }
  .landing h2 { font-size: 1.75rem; line-height: 1.15; }
  .landing h3 { font-size: 1rem; }
  .landing .card { padding: 1.25rem; }
}
```
Also in `HomePage.jsx`, gate `IndustryStatsSection` and one of the redundant card grids behind `hidden md:block` to shorten the mobile page.
