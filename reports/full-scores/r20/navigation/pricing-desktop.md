# Pricing Desktop — Navigation Score

**Grade: B+**

## What's Working
- Pricing link in top nav shows active state.
- Page length is reasonable (hero, calculator, 3-tier grid, FAQ, CTA, footer) — no navigation fatigue.
- FAQ section at the bottom is a natural "last-mile" content stop before the footer CTA.
- Final "Ready to see which of your members are at risk?" CTA block routes to Contact, preventing a dead end.
- Footer visible with all 5 route links + legal row.

## What's Broken
- No "Compare plans" cross-link jumping back to the platform comparison table for GMs who want feature detail before price.
- FAQ has no anchor links (no deep-linkable questions) — a GM cannot share a specific FAQ with a colleague.
- The tier pricing cards do not each have a direct "Start [tier] demo" that captures tier intent — only one generic CTA.
- Footer Privacy/Terms still route to `#/contact` (site-wide bug).

## Exact Fix
File: `src/landing/pages/PricingPage.jsx` (or `src/landing/components/PricingSection.jsx`)

1. Add an eyebrow link above the pricing grid: `<a href="#/platform#comparison">← See full feature comparison</a>`.

2. In the FAQ map, give each question an `id={q.slug}` and wrap the question label in a self-anchor `<a href={\`#${q.slug}\`}>#</a>` for deep-link sharing.

3. On each pricing tier card, append `onClick={() => { window.location.hash = \`#/contact?plan=${tier.name}\`; }}` and read `plan` on the Contact page to pre-select the tier.

File: `src/landing/components/LandingFooter.jsx` — fix Privacy/Terms links (see home-desktop.md).
