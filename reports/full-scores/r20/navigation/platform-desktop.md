# Platform Desktop — Navigation Score

**Grade: B-**

## What's Working
- Consistent sticky nav with Platform highlighted — GM knows exactly where they are.
- Several inline "See pricing" / "Book a demo" mid-page bands act as cross-route CTAs, preventing dead ends.
- Section breaks are visually clear (dark/light band alternation), giving natural scroll landmarks.
- Footer reinforces full nav set at page end.

## What's Broken
- Platform page is extremely tall (agents, comparison table, integrations, pricing grid) with no side-rail TOC or sub-nav ("Agents / Integrations / How it works / Comparison").
- The comparison table at the bottom implicitly promises a "See full comparison" but has no link out to a dedicated comparison route.
- No breadcrumb or "Platform >" label showing which sub-section the user is in.
- No "Next: Pricing" contextual link at the bottom — user has to return to top nav to continue the buyer journey.
- Internal integrations section doesn't link to individual integration detail (dead end per partner logo).

## Exact Fix
File: `src/landing/pages/PlatformPage.jsx`

1. Add a sub-nav pill bar directly under the hero, sticky at `top: 72`:
```jsx
<div style={{ position:'sticky', top:72, zIndex:150, background:'rgba(250,247,242,0.94)', padding:'12px 0', display:'flex', gap:24, justifyContent:'center' }}>
  <a href="#agents">Agents</a>
  <a href="#howitworks">How it works</a>
  <a href="#integrations">Integrations</a>
  <a href="#comparison">Comparison</a>
</div>
```
and add matching `id` attributes to each section component.

2. At end of PlatformPage, before `LandingFooter`, add a "Next: See pricing →" contextual link block that routes to `#/pricing`.
