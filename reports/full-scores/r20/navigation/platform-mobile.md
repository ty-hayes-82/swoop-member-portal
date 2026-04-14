# Platform Mobile — Navigation Score

**Grade: C-**

## What's Working
- Hamburger nav present and all 5 routes reachable.
- Sections stack in clear vertical rhythm without horizontal scroll.
- Sticky top nav remains visible on scroll providing escape hatch.

## What's Broken
- Platform page on mobile is effectively a 20+ screen vertical scroll with zero mid-page navigation — GM drowns in content.
- Comparison table rendered narrow/cramped on mobile with no horizontal scroll affordance; user cannot tell there is off-screen content.
- No "jump to section" on mobile — the desktop fix of a sub-nav pill bar needs a mobile-specific collapsed chip row.
- No sticky bottom "Book a Demo" CTA — primary conversion is buried below 15+ screens of scrolling.
- No "Back to top" button after long scroll; user must flick-scroll for 5 seconds to reach the nav again.

## Exact Fix
File: `src/landing/pages/PlatformPage.jsx`

1. Add a horizontally-scrollable sub-nav chip row under the hero on mobile:
```jsx
<div style={{ position:'sticky', top:64, zIndex:150, display:'flex', gap:8, overflowX:'auto', padding:'10px 16px', background:'rgba(250,247,242,0.96)', WebkitOverflowScrolling:'touch' }}>
  {['Agents','How it works','Integrations','Comparison','Pricing'].map(s => <a key={s} href={`#${s.toLowerCase().replace(/ /g,'')}`} style={{ whiteSpace:'nowrap', padding:'6px 14px', borderRadius:999, border:'1px solid rgba(17,17,17,0.12)', fontSize:13 }}>{s}</a>)}
</div>
```

File: `src/landing/LandingShell.jsx` — add a "back to top" floating button (`position:fixed; bottom:80px; right:16px; display:none @media(min-width:769px)`) that appears after `scrollY > 600`.
