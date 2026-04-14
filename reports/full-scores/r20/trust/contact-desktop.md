# Contact Desktop — Trust Score

**Grade: B-**

## What's Working
- "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking" — specific, falsifiable, ends with "not a pitch deck" which is strong anti-weasel language.
- "What you'll leave with" bullet list promises three concrete deliverables: ranked top-5 gaps, benchmarks, 90-day action plan "yours to keep, no strings attached." The unconditional-ownership language is a trust accelerator.
- Form fields are minimal (Name, Club, Email, Phone optional) — every additional field is a trust tax and this form respects that.
- Fallback contact ("demo@swoopgolf.com · (480) 123-9703") is visible — a real email domain and phone number, not a generic contact form abyss.
- "No credit card · 30 minutes · Your club's own data · We'll confirm your slot in business day" is a strong reassurance strip.

## What's Broken
- "Benchmarks against comparable clubs" — with only 7 pilot clubs, the benchmark pool is tiny and not disclosed. What does "comparable" mean? Same region? Same member count? Trust demands the method be named.
- No SOC 2 / data-handling / NDA language on a form that promises "we load your tee-sheet data into Swoop." Asking for live club data without a security note is the single biggest trust gap on this page.
- "Limited founding-partner slots available — early-club get hands-on onboarding and direct input on the roadmap" — "early-club" is a typo/garbled phrase that reads as AI slop on a contact page, where polish matters.
- Phone number `(480) 123-9703` looks like a placeholder 123-prefix — if real, reformat; if placeholder, fix immediately. Fake-looking numbers destroy trust instantly.
- No named human on the receiving end. "Who actually answers this form?" is a trust question this page doesn't answer.

## Exact Fix
File: `src/landing/components/DemoCtaSection.jsx`. Verify and correct the phone number. If `(480) 123-9703` is a placeholder, replace with the real number or remove entirely. Never show 123-prefix numbers.

File: `src/landing/pages/ContactPage.jsx` line 8. Replace the bullet list:
```
const leaveWithItems = [
  'A ranked list of your top 5 revenue and retention gaps',
  'Benchmarks vs. the 7 founding-partner clubs (anonymized, your club not identified)',
  'A draft 90-day action plan — yours to keep, whether you sign or not',
];
```
Then add a fourth trust bullet immediately below the list:
```
Your data under mutual NDA. We never share club data across pilots. Data deleted within 30 days if you don't move forward.
```

File: `src/landing/components/DemoCtaSection.jsx`. Replace the `early-club` typo in the "Limited founding-partner slots" line with clean copy: `Founding-partner slots available — early clubs get hands-on onboarding and direct input on the roadmap.` Also add a named sender: `Replies come from Tyler Hayes, co-founder, within one business day.`
