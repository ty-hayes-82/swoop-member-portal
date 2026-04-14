# Contact Mobile — CRO Score

**Grade: B+**

## What's Working
- Form stacks vertically with large tap targets and clear labels — mobile-friendly layout.
- "Book Your Demo" button is full-width, orange, prominent.
- Risk-reversal microcopy present under the button (no credit card, 30 minutes, own data).
- Email + phone fallback visible for form-averse users.
- "Limited founding-partner slots" scarcity line retained on mobile.

## What's Broken
- Form is below the value prop on mobile — user has to scroll past ~2 viewports of copy before reaching the first input. On contact page, form should be first on mobile.
- Phone number displayed but not a `tel:` link — a GM on their phone can't tap-to-call. Catastrophic for a mobile contact page.
- Email likewise not a `mailto:` link (or at least unclear from screenshot).
- No "What happens next" steps — even more important on mobile where trust is lower.
- No native mobile keyboard hints: `inputMode`, `autoComplete`, `type="email"`, `type="tel"` — every extra keystroke is a conversion leak on mobile.

## Exact Fix
File: `src/landing/pages/ContactPage.jsx`

Reorder mobile so the form is first:
```jsx
<div className="flex flex-col-reverse md:grid md:grid-cols-2 md:gap-12">
  <div>{/* value prop */}</div>
  <div>{/* form */}</div>
</div>
```

Make the phone and email tap-friendly:
```jsx
<a href="tel:+14805551234" className="text-orange underline">(480) 555-1234</a>
<a href="mailto:demo@swoopgolf.com" className="text-orange underline">demo@swoopgolf.com</a>
```

Add proper input attrs to every form field:
```jsx
<input type="email" inputMode="email" autoComplete="email" ... />
<input type="tel" inputMode="tel" autoComplete="tel" ... />
<input autoComplete="name" ... />
<input autoComplete="organization" ... />
```

Add a mobile sticky bottom bar with `Call` and `Book Demo` buttons so the CTA is always one thumb-tap away even when scrolling the value-prop column.
