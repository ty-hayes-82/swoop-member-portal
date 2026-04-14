# Home Desktop — Design Score

**Grade: B**

## What's Working
- Strong hero contrast: dark forest-green hero with white headline and single orange CTA creates clear focal point.
- Consistent card system throughout — rounded corners, subtle borders, uniform padding on the "Three jobs" / "Morning briefing" grids.
- Disciplined two-color accent system (orange CTA + green hero) holds across sections.
- Whitespace between stacked sections is generous; dark "agents" band breaks rhythm effectively.
- Footer CTA block ties back to hero styling, bookending the page.

## What's Broken
- Too many near-identical card grids stacked (3-up, 4-up, 3-up, 3-up) — the page reads as one texture with no visual variety or imagery.
- Zero photography or product screenshots above the fold — the hero is all text on a flat gradient, feels like a template.
- Type scale is flat: section H2s, card titles, and body copy compress into similar weights when viewed full-page, hurting hierarchy.
- The dark "Your tools manage operations" band has a circular loader/placeholder where a real product shot should live — reads as unfinished.
- Section dividers rely only on background color flips; no illustrative or iconographic anchors.

## Exact Fix
`src/landing/components/HeroSection.jsx` — add a product screenshot or dashboard mock to the right column at `lg:` breakpoint:
```jsx
<div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
  <div>{/* existing headline + CTA */}</div>
  <img src="/assets/hero-dashboard.png" alt="Swoop morning briefing"
       className="rounded-xl shadow-2xl ring-1 ring-white/10" />
</div>
```
And in `src/landing/landing.css`, tighten the H2/H3 scale so section titles jump:
```css
.landing h2 { font-size: clamp(2rem, 3.4vw, 3rem); line-height: 1.1; letter-spacing: -0.02em; }
.landing h3 { font-size: 1.125rem; font-weight: 600; }
```
Replace the circular loader in `AgentsSection.jsx` (dark band) with a static SVG agent diagram or real screenshot.
