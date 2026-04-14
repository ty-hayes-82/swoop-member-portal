# About Mobile — Mobile Score

**Grade: A-**

## What's Working
- Clean single-column layout with generous vertical spacing — exactly right for 390px.
- Hero headline "Built for the people who run private clubs" is well-sized (~32px), balanced, and readable.
- Body copy "Most club software tells you what happened..." sits at a comfortable ~16–17px with good line-height.
- Section eyebrow labels ("ABOUT SWOOP", "WHO YOU'LL WORK WITH") are orange and provide strong scannable structure.
- Nav is minimal: logo + hamburger — and the hamburger icon appears to be adequately sized (~40–44px).
- Side padding looks generous (~24px) — text does not crowd the viewport edges.
- No horizontal overflow visible.

## What's Broken
- Only the top of the page is captured in the screenshot — cannot verify downstream team grid, photos, or CTA behavior. (If screenshot was truncated by tool, not a real issue; if page actually ends there, the About page is too thin.)
- Hamburger icon has no visible label and tap feedback state is unknown.
- No visible primary CTA above the fold — user must scroll significantly before encountering "Book a Demo".
- The transition from cream hero band to white content band creates a harsh horizontal line — cosmetic.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` and `src/landing/components/LandingNav.jsx`

```jsx
// AboutPage.jsx — add hero CTA for mobile conversion
<div className="about-hero">
  <p className="eyebrow">ABOUT SWOOP</p>
  <h1>Built for the people who run private clubs</h1>
  <p className="lede">…</p>
  <a href="/contact" className="btn btn-primary mobile-hero-cta">Book a Demo</a>
</div>
```

```css
/* landing.css */
@media (max-width: 480px) {
  .mobile-hero-cta { display: inline-flex; min-height: 48px; margin-top: 20px; }
  .about-hero { padding-bottom: 40px; }
  .landing-nav .menu-toggle { width: 48px; height: 48px; }
}
```

Also add `aria-label="Open menu"` on the hamburger button in `LandingNav.jsx`.
