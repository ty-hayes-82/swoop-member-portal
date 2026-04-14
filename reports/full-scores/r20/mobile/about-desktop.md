# About Desktop — Mobile Score

**Grade: F**

## What's Working
- Nothing — the desktop capture is a completely blank white page (no hero, no content, no nav). This is a hard failure regardless of viewport.

## What's Broken
- **Page renders empty at desktop width.** Either the `AboutPage.jsx` component failed to mount, a data import returned undefined, or a JS error halted render. The mobile version of the same route renders fine, which points to a conditional hiding content at `>=768px`, or a section that errors out only when a desktop-only block attempts to mount.
- Because there is no content at desktop, there is nothing to "degrade well" to mobile — but more importantly, marketing, SEO, and direct-link sharing are all broken for About on desktop.
- No nav visible, no footer visible — suggests `LandingShell` or route wrapper is also failing, OR a section at the top throws and blanks the tree.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` and `src/landing/LandingShell.jsx`

1. Open the rendered URL in Chrome devtools and read the console — most likely a `TypeError: Cannot read properties of undefined` from a data map.
2. Wrap `AboutPage` in an error boundary:

```jsx
// LandingShell.jsx
import { ErrorBoundary } from './components/ErrorBoundary';
<ErrorBoundary fallback={<div style={{padding:40}}>About failed to render</div>}>
  <AboutPage />
</ErrorBoundary>
```

3. In `AboutPage.jsx`, audit every `.map()` for a null/undefined guard:

```jsx
{(team ?? []).map(member => <TeamCard key={member.id} {...member} />)}
```

4. Check for any `@media (min-width: 768px) { display: none }` rule accidentally applied to the About root — this would explain "blank desktop, populated mobile" exactly. Grep `src/landing/landing.css` for `min-width.*none` on about classes.

5. Re-run screenshot script after fix — this is a P0 blocker, not a mobile polish item.
