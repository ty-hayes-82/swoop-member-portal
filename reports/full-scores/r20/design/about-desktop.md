# About Desktop — Design Score

**Grade: F**

## What's Working
- Nothing. The screenshot renders as a blank near-white canvas with no visible content.

## What's Broken
- The page renders essentially empty at desktop width — a full white/off-white frame with no header, hero, copy, team photos, or footer visible.
- Either the route failed to mount `AboutPage.jsx`, a hydration error blanked the body, a global CSS rule (`opacity:0` / `visibility:hidden` on an intersection observer) is hiding sections until scroll, or an async data fetch is gating render.
- Mobile version of the same page renders fine (see about-mobile), which points to a desktop-specific CSS/visibility bug, most likely an IntersectionObserver reveal animation that never triggers when the full page is captured via Playwright before scroll.
- Zero hierarchy, zero typography, zero brand — there is literally nothing to grade.

## Exact Fix
`src/landing/pages/AboutPage.jsx` — audit for scroll-reveal classes. Any section using `opacity-0` + `animate-on-scroll` must have a fallback visible state. Add a global override in `src/landing/landing.css`:
```css
/* Ensure scroll-reveal sections are visible by default; JS adds .is-visible on intersect */
.reveal { opacity: 1; transform: none; }
@media (prefers-reduced-motion: no-preference) {
  .reveal:not(.is-visible) { opacity: 0; transform: translateY(16px); transition: opacity .6s, transform .6s; }
}
```
Then in the IntersectionObserver setup (likely `LandingShell.jsx` or a hook), add a fallback timer so screenshots/SSR always get visible content:
```jsx
useEffect(() => {
  const t = setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }, 1500);
  return () => clearTimeout(t);
}, []);
```
Also verify `AboutPage.jsx` doesn't wrap its entire return in a conditional like `{data && <...>}` where `data` is async.
