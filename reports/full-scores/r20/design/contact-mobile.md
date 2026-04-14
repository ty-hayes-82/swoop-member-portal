# Contact Mobile — Design Score

**Grade: B**

## What's Working
- Dark form card stacks below the hero copy cleanly with maintained glassmorphism effect.
- H1 "See what your club misses today and can recover tomorrow." scales down appropriately without breaking hierarchy.
- Form fields stack to full width with visible uppercase micro-labels (NAME, CLUB, EMAIL, PHONE) preserved.
- Orange submit button remains the CTA anchor, full-width and prominent.
- Orange-check value-prop list above the form still scannable at mobile size.
- Footer collapses to a minimal single-column stack with visible Platform / Pricing / About / Contact / Book a Demo links.

## What's Broken
- The split dark/light hero on desktop collapses into a single vertical stack where the transition between the white copy block and the dark form card is abrupt — no breathing room.
- Form card's dark background image reads as near-black noise at mobile; loses all sense of place.
- "No credit card · 30 minutes · Your club's own data" microcopy is barely legible at mobile contrast.
- Form card takes roughly 60% of the mobile viewport height once stacked — feels top-heavy; the H1 above gets visually squeezed.
- Footer wordmark "swoop." and the footer nav links are very close to the form card edge with minimal padding.

## Exact Fix
`src/landing/pages/ContactPage.jsx` — add a mobile divider and vertical rhythm:
```jsx
<div className="h-px bg-stone-200 my-8 md:hidden" />
```
`src/landing/landing.css`:
```css
@media (max-width: 640px) {
  .contact-form-card { padding: 1.5rem; border-radius: 1rem; }
  .contact-form-card .microcopy { color: #e5e5e5; font-size: .75rem; }
  .contact-hero h1 { font-size: 2rem; line-height: 1.15; }
  footer { padding-block: 2.5rem; }
}
```
Also set the form card background to a flat dark green rather than a dim photo at mobile:
```css
@media (max-width: 640px) { .contact-form-card { background: #0f2a1c; } }
```
