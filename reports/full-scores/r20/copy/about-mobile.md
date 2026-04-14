# About Mobile — Copy Score

**Grade: A-**

## What's Working
- "Built for the people who run private clubs." — direct, specific audience, no cliches, no "we are a team of…" filler.
- "Most club software tells you what happened. Swoop tells you what to do about it" — parallel structure, category contrast in one sentence, verb-led.
- "connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing" — concrete list (4 named systems) beats "all your club data."
- "that turns operational noise into decisions." — the noun pair "noise → decisions" is the single sharpest line on the whole site.
- "The humans in your clubhouse for six months." — unexpected subhead, specific duration (six months), humanizes the pilot model.
- "we're in your systems, on your calls, and in your board deck." — tricolon, parallel "in/on/in", concrete touchpoints.

## What's Broken
- Eyebrow "WHO YOU'LL WORK WITH" is fine but redundant with the H2 below it — one of the two can go.
- "Swoop is in closed pilot with founding-partner clubs." — "founding-partner" is hyphen-glued jargon; a GM reads "partner" as vendor speak.
- "Every pilot is hands-on" — "hands-on" is mildly clichéd; replaced below.

## Exact Fix
`src/landing/pages/AboutPage.jsx`
- Before: "Swoop is in closed pilot with founding-partner clubs. Every pilot is hands-on — we're in your systems, on your calls, and in your board deck."
- After: "Swoop is in closed pilot with 6 founding clubs. For six months we sit in your systems, join your ops calls, and write the page your board reads."

`src/landing/pages/AboutPage.jsx` (eyebrow)
- Before: "WHO YOU'LL WORK WITH"
- After: delete the eyebrow — the H2 already carries the meaning.
