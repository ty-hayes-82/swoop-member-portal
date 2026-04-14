# Contact Mobile — Messaging Score

**Grade: B+**

## What's Working
- "See what your club misses today and can recover tomorrow." survives the mobile column cleanly and is still the strongest contact headline on the property.
- The "30 minutes / tee-sheet data / prioritized action list — not a pitch deck" paragraph reads well in the narrow column.
- Three-bullet deliverable list (top-5 revenue/retention gaps, benchmarks, 90-day action plan) compresses nicely to mobile.
- Form fields (Name, Club, Email, Phone) stack with proper label sizing and a clear orange "Book Your Demo" button.
- "No credit card · 30 minutes · Your club's own data" reassurance is visible near the button — not buried.
- Mobile footer with "Member retention software for private clubs · demo@swoopgolf.com" is a clean final descriptor.

## What's Broken
- Button label "Book Your Demo" is generic on mobile where every other B2B form says the same thing — kills the differentiation the hero copy built.
- Phone field appears without "(optional)" callout in the mobile screenshot — could scare off GMs who don't want a sales call. On mobile especially, any unneeded field = drop.
- No single testimonial above the form on mobile — the buyer has to scroll through the hero promise with no social proof before committing.
- "Limited founding partner slots available" scarcity line is truncated/hidden on the mobile viewport — a huge wasted conversion lever.
- The mobile footer puts "Member retention software for private clubs" below the form — that positioning statement is actually stronger than the hero sub and should be ABOVE the fold.
- No click-to-call on the mobile phone number — GMs on a cart path will tap-to-call before they fill a form.

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` and `src/landing/components/LandingFooter.jsx`

- Change button label on mobile to "Send my club's action list" (matches hero promise).
- Explicitly label the phone field "Phone (optional — we won't call unless you ask)."
- Above the form on mobile, insert a one-line testimonial: "'Swoop found $47k in lapsed dues in week one.' — GM, Top-100 Platinum club" with a small avatar.
- Ensure "Limited founding partner slots — early clubs get hands-on onboarding and direct roadmap input" is rendered above the form on the mobile breakpoint, not hidden in a collapsed section.
- Wrap the footer phone number in `<a href="tel:+14801234567">` so mobile GMs can tap-to-call.
- Add a sticky mobile bottom CTA bar: "Get my 90-day action plan →" that scrolls to the form.
