# Pricing Mobile — Navigation Score

**Grade: B**

## What's Working
- Hamburger reaches all 5 routes; active state on "Pricing" remains visible in the drawer.
- Pricing tiers stack cleanly in a vertical column — no horizontal scroll required.
- FAQ collapses into thumb-reachable rows just above the footer.
- End-of-page CTA block prevents a dead end into the footer.

## What's Broken
- Tier cards stack vertically with no "recommended" anchor scroll — user cannot jump directly to the middle tier without scrolling past the $0 tier.
- No sticky bottom "Book a Demo" CTA on mobile; primary conversion only exists at top nav (requires scroll-up) and end-of-page (requires scroll-down).
- Calculator section is cramped on narrow viewport and has no "skip to pricing" link for users who already know their numbers.
- FAQ items have no deep-link anchors, same as desktop.

## Exact Fix
File: `src/landing/pages/PricingPage.jsx`

1. Add a "Skip the calculator → See tiers" anchor link above the calculator on mobile:
```jsx
<a href="#tiers" className="mobile-only" style={{ display:'block', textAlign:'center', fontSize:13, color:theme.colors.accent, marginBottom:16 }}>Skip to pricing →</a>
```
and add `id="tiers"` to the pricing grid wrapper.

2. In the pricing grid, add `id="recommended"` to the middle tier and on mount scroll it into view on mobile if `window.innerWidth < 768`:
```jsx
useEffect(() => { if (window.innerWidth < 768) document.getElementById('recommended')?.scrollIntoView({ block:'center' }); }, []);
```

File: `src/landing/LandingShell.jsx` — add the site-wide mobile sticky bottom CTA bar described in home-mobile.md.
