# Contact Desktop — Mobile Score

**Grade: A-**

## What's Working
- Simple two-section layout (light intro + dark form band) that collapses trivially to mobile.
- Form uses a 2x2 + full-width grid (Name/Club, Email, Phone, submit) — will stack to 1-col cleanly.
- Orange "Book Your Demo" submit button is full-width within its column — mobile-ready.
- Nav includes visible "Book a Demo" CTA in top-right — carries to mobile easily.
- Form field labels are above inputs (not placeholder-only) which is the correct accessible mobile pattern.
- The headline "See what your club misses today and can recover tomorrow" is on the left with form on the right — stacks to header-over-form on mobile, which is standard.

## What's Broken
- Form inputs appear to have minimal vertical padding (~12px) — at mobile they need to be ≥44px tall to meet tap targets.
- No visible input `inputmode` / `type` attributes can be verified — if email and phone fields aren't `type="email"` and `type="tel"`, mobile keyboards won't optimize.
- The dark card containing the form has rounded corners — at 390px this may clip the form edges if side padding is insufficient.
- Footer link row at bottom is dense horizontally — may wrap poorly on mobile.

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` and `src/landing/landing.css`

```jsx
<input type="text" name="name" autoComplete="name" />
<input type="text" name="club" autoComplete="organization" />
<input type="email" name="email" autoComplete="email" inputMode="email" />
<input type="tel" name="phone" autoComplete="tel" inputMode="tel" />
```

```css
@media (max-width: 768px) {
  .contact-form { grid-template-columns: 1fr; gap: 16px; }
  .contact-form input { min-height: 48px; font-size: 16px; padding: 12px 14px; }
  .contact-form label { font-size: 13px; }
  .contact-card { margin: 0 12px; padding: 24px 20px; }
  .contact-hero h1 { font-size: clamp(32px, 7vw, 56px); }
  .landing-footer .footer-links { flex-wrap: wrap; gap: 12px 16px; }
}
```
