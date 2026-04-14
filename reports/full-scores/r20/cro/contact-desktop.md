# Contact Desktop — CRO Score

**Grade: A-**

## What's Working
- Textbook conversion page: form is above the fold, left column sells outcome ("See what your club misses today and can recover tomorrow"), right column captures.
- Form is short and correctly labeled — Name, Club, Email, Phone (Optional). Phone marked optional is a known friction-reducer.
- Button copy "Book Your Demo" is clear and specific.
- Risk-reversal microcopy right under the button: "No credit card · 30 minutes · Your club's own data · We'll confirm your slot in 1 business day." This is best-practice CRO.
- Secondary conversion path: email + phone number as a fallback for users who don't trust forms.
- "Limited founding-partner slots available — early-club get hands-on onboarding" adds scarcity + value stacking.

## What's Broken
- "Club" field is ambiguous — is it club name? role at club? Needs placeholder: "e.g., Pine Valley GC".
- No preferred-time picker or Calendly embed — "Book" button implies instant scheduling but likely just submits a form, creating an expectation gap.
- No trust badges near the form (SOC2, "your data stays yours", logos of pilot clubs) — missing final-objection handlers.
- No "What happens next" 3-step strip under the form — users wonder what they're submitting to.

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` (or the form component it uses)

Add placeholder to Club field:
```jsx
<input name="club" placeholder="e.g., Pine Valley Golf Club" ... />
```

Add a "What happens next" strip under the form:
```jsx
<ol className="mt-6 grid grid-cols-3 gap-4 text-xs text-white/70">
  <li><strong>1.</strong> We confirm your slot within 1 business day.</li>
  <li><strong>2.</strong> You send a tee-sheet export (or we pull it live).</li>
  <li><strong>3.</strong> 30-min call with your ranked revenue leaks.</li>
</ol>
```

If possible, swap the form for a Calendly inline embed so "Book" actually books a slot instead of requesting one — closes the expectation gap and typically lifts conversion 20-40%.
