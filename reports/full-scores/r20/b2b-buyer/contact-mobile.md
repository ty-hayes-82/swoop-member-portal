# Contact Mobile — B2B Buyer Score

**Grade: B**

## What's Working
- The 30-minute tee-sheet-load offer reads cleanly at mobile width and the three deliverables (action list, benchmarks, 90-day plan) stack vertically where a GM can screenshot and forward
- "Yours to keep, no strings attached" is visible on mobile without scrolling past the form — risk reversal where it matters
- Form is short (name, club, email, phone optional) which is critical on mobile where long forms kill B2B conversion
- "No credit card. 30 minutes. Your club's own data." badge under the CTA is mobile-appropriate

## What's Broken
- No tap-to-call or tap-to-email link visible as a form alternative — mobile GMs often prefer to call on the spot
- No founder name or face visible anywhere on the mobile contact page — the buyer submits a form to a faceless company
- No calendar self-book option — mobile GMs expect Calendly-style tap-to-book, not "we'll confirm in 1 business day" which feels like a lead-nurture trap
- No mobile-visible social proof (quote or logo) adjacent to the form
- "Limited founding-partner slots" scarcity line has no specific number, which feels like marketing vapor on a small screen
- The phone field is optional, but there's no reciprocal offer ("we'll call you in 10 minutes if you include a phone") to motivate inclusion

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` — add a mobile-only tap-to-action strip directly above the form:

```
"Prefer to talk? Tap to call [Founder Name] directly: [tel: link]  •  Or book a slot: [Calendly link]"
```

And change the phone-field helper text to: `"Add your phone and we'll call you within 10 minutes during business hours — founder's direct line."` Then add a single mobile testimonial card immediately below the form submit button: `"'22-minute data load. $47K found on call one. Booked a second call before we hung up.' — [GM], [Club], 320 members."` — this handles the mobile GM's "is this a real company with real customers" objection at the exact moment they're deciding whether to tap submit.