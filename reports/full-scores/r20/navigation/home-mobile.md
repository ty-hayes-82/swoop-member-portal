# Home Mobile — Navigation Score

**Grade: C**

## What's Working
- Hamburger icon present in top-right with 44x44 touch target meeting accessibility minimums.
- Drawer, when open, lists all 5 routes plus "Book a Demo" CTA.
- Logo doubles as home link, preserving escape hatch from any scroll position.

## What's Broken
- The mobile drawer appears to be in the open state AND the page is showing the open drawer overlapping content — the screenshot suggests drawer is rendered inline (pushing page down) rather than as an overlay, so the user loses scroll context when closing.
- No sticky "Book a Demo" thumb-zone CTA at the bottom of the viewport; on a 10+ section scroll, demo conversion is buried until user scrolls all the way down.
- No scroll-progress indicator — mobile users have even less spatial awareness than desktop.
- Hamburger drawer has no visible divider between nav routes and CTA, making the CTA feel like just another link.
- No "jump to section" affordance on a long single-page scroll — mobile users thumb-scroll through 10+ screens with no shortcuts.

## Exact Fix
File: `src/landing/components/LandingNav.jsx`

1. Convert mobile drawer (lines 96-112) from inline to overlay: wrap in a fixed-position container:
```jsx
<div style={{ position:'fixed', top:72, left:0, right:0, bottom:0, zIndex:199, background:'rgba(250,247,242,0.98)', padding:'24px', overflowY:'auto' }}>
```
2. Add a persistent mobile bottom CTA bar (new component, rendered only `@media (max-width: 768px)`) anchored `position:fixed; bottom:0;` with "Book a Demo" button — add to `LandingShell.jsx`.

File: `src/landing/components/LandingNav.jsx` — add `aria-expanded={menuOpen}` to hamburger button (line 75) for screen-reader state.
