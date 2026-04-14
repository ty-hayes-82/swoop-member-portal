# Contact Desktop — B2B Buyer Score

**Grade: B+**

## What's Working
- "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking" — this is a textbook value-first demo offer and one of the best B2B lines on the entire site
- "You leave with a prioritized action list — not a pitch deck" directly handles the #1 GM objection to sales calls ("I don't want to sit through another pitch")
- The three checkmarks (ranked action list, benchmarks, 90-day draft plan) give the buyer concrete deliverables — they know exactly what they'll walk away with
- "A draft 90-day action plan — yours to keep, no strings attached" explicitly states risk reversal in the copy
- Form is minimal (name, club, email, phone optional) — low-friction for a busy GM
- "No credit card. 30 minutes. Your club's own data. We'll confirm your slot in 1 business day." micro-copy under the CTA is exactly right
- "Limited founding-partner slots available — early-club get hands-on onboarding and direct input on the roadmap" creates scarcity and also handles the "are we too early" objection by flipping it to a benefit

## What's Broken
- No calendar booking widget visible (Calendly/Chili Piper) — B2B GMs expect to self-book a slot, not wait for a confirmation email that may lose them to a competitor
- No "who you'll meet" block — a GM wants to know if they're getting a rep or the founder on the call; naming the founder here dramatically increases show-rate
- No social proof on the contact page at all — a pilot-club quote or logo right next to the form would lift conversion 20%+
- No phone number or "prefer to talk now" option for urgent buyers
- The "Limited founding-partner slots" scarcity claim has no number attached ("3 slots left this quarter" would make it credible)

## Exact Fix
File: `src/landing/pages/ContactPage.jsx` — immediately under the form, add a "Who you'll meet" micro-block:

```
"You'll be on the call with [Founder Name], Swoop founder and former [GM credential]. Not a rep, not an SDR. Direct line: [phone] if you prefer to talk first."
```

Then next to the form, add a pilot-club quote card with this exact pattern: `"'They loaded our Jonas data in 22 minutes and found $47K in tee-time leakage on the first call.' — [GM name], [Club name], 320 members."` And tighten the scarcity line to a real number: `"3 founding-partner slots remaining for Q2 2026."` Real scarcity beats vague scarcity for B2B decision-stage buyers.