# About Mobile — Navigation Score

**Grade: C+**

## What's Working
- Hamburger visible top-right with clear icon and 44x44 hit target.
- Logo present top-left, clickable back to home.
- Clear section eyebrows ("ABOUT SWOOP", "WHO YOU'LL WORK WITH") act as informal wayfinding landmarks.
- Content is readable and vertically rhythm'd — user won't get lost in layout.

## What's Broken
- No visible active-state indicator for "About" in the collapsed hamburger (cannot confirm without opening drawer, but the top bar gives no hint which route is current).
- No sticky mobile CTA — on an About page, primary conversion ("Book a Demo") is invisible without scrolling to the footer.
- About content (humans-in-your-clubhouse section) has no inline link to Platform or Contact — it's a narrative dead end.
- No breadcrumb ("Swoop > About") or "Next: See the platform →" contextual forward link.
- Inconsistency with about-desktop (which renders blank) means mobile and desktop are not code-paired; one of them is wrong.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx`

1. Add a mid-page cross-link after the "Who you'll work with" section:
```jsx
<div style={{ textAlign:'center', padding:'32px 20px' }}>
  <a href="#/platform" style={{ color:theme.colors.accent, fontWeight:700 }}>See how the platform works →</a>
</div>
```

2. Append a "Next step" block before the footer routing to `#/contact`: "Ready to talk? Book a 30-min walkthrough →".

File: `src/landing/components/LandingNav.jsx` — add a subtle page-title label in the mobile collapsed bar so the user always sees "About" (line 55-61 area): `<span style={{fontSize:12, color:theme.colors.textMuted}}>{pageTitle}</span>` derived from `activeHash`.
