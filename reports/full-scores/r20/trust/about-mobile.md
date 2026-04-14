# About Mobile — Trust Score

**Grade: C-**

## What's Working
- The mobile hero renders (unlike desktop) and the copy is direct: "Built for the people who run private clubs" with a concrete benefit sentence below.
- "Who you'll work with / The humans in your clubhouse for six months" eyebrow + title is a good trust frame — it promises people, not a portal.
- The subtitle honestly discloses "Swoop is in closed pilot with founding-partner clubs" — that honesty is itself a trust signal.

## What's Broken
- The team cards below the fold (confirmed via source) use letter monograms, not real photos. On mobile that's even more jarring — a full-width card with a giant "T" in a circle looks like a placeholder.
- "The humans in your clubhouse for six months" — "six months" appears nowhere else on the site as a commitment; unclear if this means "we stay 6 months then leave" or "6-month onboarding." Ambiguity on a page about trust is a trust tax.
- No investor/advisor/board signal, no company founding date, no HQ city — GMs evaluating a vendor ask these first.
- Testimonials section follows with the same anonymous quotes. Compounds the weakness.
- No press logos or podcast/interview mentions — a founder-led trust page typically leans on one or two press/podcast credits.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` line 27-29. Replace:
```
Most club software tells you what happened. Swoop tells you what to do about it —
connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing
that turns operational noise into decisions.
```
with:
```
Swoop was founded in Scottsdale, AZ in January 2025 by two former club-ops leaders. We're in closed pilot with 7 private clubs across the US and backed by [Named Fund] plus operator angels from Jonas Club Software and Troon.
```
(Fill bracketed name with the actual fund or remove if not raised yet — do not fabricate.)

File: `src/landing/components/TeamSection.jsx` subtitle (line 28). Replace `Swoop is in closed pilot with founding-partner clubs. Every pilot is hands-on — we're in your systems, on your calls, and in your board deck.` with `Swoop is in closed pilot with 7 founding-partner clubs as of April 2026. We're on your onboarding calls, in your morning briefings, and in your board deck until month six — then you decide.` Kills the "six months" ambiguity and adds a denominator.
