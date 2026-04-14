# About Desktop — Copy Score

**Grade: F**

## What's Working
- Nothing visible — the screenshot renders as a blank off-white canvas with no header, body, or footer.

## What's Broken
- The page appears empty at the viewport captured. Either a render error, an above-the-fold hero with white background and white text, or the route is returning a blank shell. Whichever it is, there is zero readable copy to score.
- If this is the intended hero-reveal animation, the fallback / no-JS / pre-hydration state is wrong — an About page must ship server-rendered text for the GM who opens it on a boardroom laptop.

## Exact Fix
`src/landing/pages/AboutPage.jsx`
- Before: blank / deferred render
- After: ship a static, server-rendered H1 + 2-sentence lede immediately — e.g.
  - H1: "Built for the people who run private clubs."
  - Lede: "Most club software tells you what happened. Swoop tells you what to do about it — connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing that turns operational noise into decisions."
- The mobile screenshot already contains this exact copy; the desktop page should render the same block above the fold instead of the empty canvas currently shown.
