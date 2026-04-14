# Contact Desktop — Messaging Score

**Grade: A-**

## What's Working
- "See what your club misses today and can recover tomorrow." is a near-perfect contact-page headline — it's outcome-framed, time-bounded (today/tomorrow), and promises a specific artifact (what you're missing). Better than 95% of B2B SaaS "Contact us" headers.
- The pre-form body copy names concrete scenarios: "tee sheet leakage, at-risk members, F&B staffing pressure, and revenue pipeline blind spots." These are the EXACT words GMs use in board meetings — tee sheet leakage especially is GM-vernacular.
- Above-form micro-promise: "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking and which members are quietly disengaging. You leave with a prioritized action list — not a pitch deck." This is risk reversal + specificity + differentiation from every "book a demo" competitor form.
- Three-bullet "What you'll leave with" (ranked list of top-5 revenue and retention gaps · benchmarks against comparable clubs · 90-day action plan — yours to keep) makes the demo a deliverable, not a sales call.
- "No credit card · 30 minutes · Your club's own data · We confirm your slot in one business day" reassurance line adjacent to the form is textbook CRO.
- "Limited founding partner slots available — early clubs get hands-on onboarding and direct input on the roadmap." Scarcity + co-creation angle is pitched at exactly the right buyer psychology.

## What's Broken
- "Book Your Demo" button label is generic — the rest of the page earned a better CTA. Should match the headline's language.
- Form asks for phone (optional) but not club size or role — those are the two qualifying fields a BDR needs to route the lead. Adding them would actually INCREASE conversion because it signals "we take this seriously."
- The "90-day action plan — yours to keep, no strings attached" is the strongest line on the page and it's buried as bullet #3.
- No social proof near the form (one pilot-GM quote would 2x conversion on this page specifically).
- Direct email link at the bottom is good but the phone number format (480-xxx-xxxx) has no context — is it a founder's cell? A BDR queue? GMs who prefer phone need to know who picks up.

## Exact Fix
File: `src/landing/pages/ContactPage.jsx`

- Change CTA button label from "Book Your Demo" to "Send me my club's action list."
- Add two qualifying fields to the form: "Club size (members)" dropdown and "Your role" (GM / AGM / Ops / F&B Director / Board member / Other).
- Promote the "90-day action plan — yours to keep" line out of the bullet list into a bolded sub-headline directly above the form: "You leave with a 90-day action plan — yours to keep, no strings attached."
- Add a single founder-pilot testimonial card to the right of or below the form: one sentence, name, club, headshot.
- Label the phone number: "Direct line to [Founder name] — picks up business hours ET."
