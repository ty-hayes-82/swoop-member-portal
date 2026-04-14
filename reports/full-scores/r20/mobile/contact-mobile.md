# Contact Mobile — Mobile Score

**Grade: A-**

## What's Working
- Form fields are all full-width, stacked single-column — textbook mobile form pattern.
- Labels are uppercase micro-text above each input (NAME, CLUB, EMAIL, PHONE OPTIONAL) — accessible and scannable.
- Input fields appear tall enough (~48px) to meet tap target minimum.
- "Book Your Demo" orange submit button is full-width and appears ~52px tall — excellent.
- Dark form card contrasts crisply against the white intro band — clear focal hierarchy.
- Intro copy "In 30 minutes, we load your tee-sheet data..." is readable, with bullet checkmarks that translate well to mobile.
- Footer is compact with a stacked link list — not overflowing.
- Page is short (fits in roughly 2 screenfuls) — low scroll effort to convert.

## What's Broken
- Inputs may not yet be `type="email"` / `type="tel"` — cannot confirm from screenshot, but if placeholders look like text inputs, mobile keyboards won't switch. This is the single most impactful mobile fix.
- Body copy in the dark card below the form ("No credit card · 30 minutes...") is small (~12px) — below the 14px floor.
- "Or email us at demo@swoopgolf.com" email link appears as plain text without underline — tap affordance unclear.
- Footer nav links (Platform / Pricing / About / Contact) are side-by-side and may be <44px tall tap targets.
- No visible form success/error state planning — unknown if validation uses native browser popovers (which are mobile-friendly) or custom (often broken).

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` and `src/landing/landing.css`

```jsx
<label>EMAIL
  <input type="email" name="email" inputMode="email" autoComplete="email" required />
</label>
<label>PHONE (OPTIONAL)
  <input type="tel" name="phone" inputMode="tel" autoComplete="tel" />
</label>
<a href="mailto:demo@swoopgolf.com" className="email-link">demo@swoopgolf.com</a>
```

```css
@media (max-width: 480px) {
  .contact-form input,
  .contact-form textarea {
    font-size: 16px; /* prevents iOS zoom */
    min-height: 48px;
    padding: 12px 14px;
    border-radius: 8px;
  }
  .contact-card .fine-print { font-size: 14px; line-height: 1.5; }
  .email-link { text-decoration: underline; color: #ff8a3d; }
  .landing-footer a { min-height: 44px; display: inline-flex; align-items: center; padding: 0 8px; }
}
```
