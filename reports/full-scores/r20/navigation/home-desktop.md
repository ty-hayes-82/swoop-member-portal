# Home Desktop — Navigation Score

**Grade: B**

## What's Working
- Sticky top nav visible across the full scroll with all 5 primary routes (Home, Platform, Pricing, About, Contact) plus a persistent "Book a Demo" CTA.
- Active-state color on the current "Home" link gives immediate wayfinding.
- Logo in top-left routes back to `#/landing`, the standard SaaS convention.
- Footer reinforces the same nav set, so scroll-to-bottom still offers full wayfinding.
- Multiple in-flow CTA bands ("Book a Demo", "See pricing") act as cross-links out of dead sections.

## What's Broken
- No scroll-progress indicator on a very long page (10+ stacked sections) — GMs lose their place halfway through.
- No section anchors / in-page TOC; sections like "How it works", "ROI", "Integrations" are unreachable except by scrolling.
- Footer legal links "Privacy Policy" and "Terms of Service" both point to `#/contact` — broken dead-end routing that will erode trust for a legal/compliance-sensitive buyer.
- No secondary nav grouping (Product / Company / Legal) in the footer — everything is one flat row.
- Sticky nav has no visual hierarchy separating primary routes from the demo CTA on wide screens; CTA blends in.

## Exact Fix
File: `src/landing/components/LandingFooter.jsx`

1. Replace the Privacy/Terms dead links with real routes (or add `#/privacy` and `#/terms` pages). Change lines 77-78:
```jsx
<a href="#/privacy" style={{...}}>Privacy Policy</a>
<a href="#/terms"   style={{...}}>Terms of Service</a>
```
2. Restructure the footer into 3 columns (Product: Platform, Pricing, Integrations | Company: About, Contact, Careers | Legal: Privacy, Terms) instead of a single flat row at line 53.

File: `src/landing/components/LandingNav.jsx` — add a scroll-progress bar under the nav (lines 40-50): append `<div style={{height:2, background: 'linear-gradient(...)', transform: \`scaleX(${scrollPct})\`, transformOrigin:'left'}}/>` driven by `window.scrollY / (documentHeight - innerHeight)`.
