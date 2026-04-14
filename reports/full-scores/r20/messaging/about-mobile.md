# About Mobile — Messaging Score

**Grade: B+**

## What's Working
- "Built for the people who run private clubs" is a FAR stronger About headline than most B2B SaaS — it names the audience, implies domain fit, and avoids generic "mission" language.
- Sub: "Most club software tells you what happened. Swoop tells you what to do about it — connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing that turns operational noise into decisions." This is the best paragraph on the entire site. It names the four systems, commits to the briefing format, and frames the wedge (action, not reporting).
- "Who you'll work with → The humans in your clubhouse for six months" is a fantastic subsection header — it promises concierge-level pilot engagement, which is exactly what a private-club buyer wants to hear.
- "Swoop is in closed pilot with founding-partner clubs. Every pilot is hands-on — we're in your systems, on your calls, and in your board deck." This is the single most credible, differentiated sentence on the property. It acknowledges early-stage status as a FEATURE, not a liability.
- "ABOUT SWOOP" eyebrow in orange is a clean, editorial pattern.

## What's Broken
- The strongest copy on the site is stuck on the About page instead of the home hero. The "tells you what to do about it — connecting tee sheet, POS, CRM, scheduling" sentence should BE the homepage headline.
- No founder names/photos visible above the fold — "humans in your clubhouse" sets up a photo reveal that doesn't deliver in the screenshot frame.
- "Six months" commitment is a huge claim but has no follow-through — what happens in month 7? Does the pilot become paid? Does a CSM take over? GMs will ask.
- No founding-pilot logos or club names (even anonymized) — "closed pilot with founding-partner clubs" is told, not shown.
- The About page has better messaging than the Home page, which means the funnel is leaking qualified traffic that never reaches About.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` — AND promote copy to `HeroSection.jsx`

- Copy the sub paragraph ("Most club software tells you what happened. Swoop tells you what to do about it...") verbatim into `HeroSection.jsx` as the home sub-headline. Best sentence in the codebase; it's wasted on About.
- In `TeamSection.jsx` add visible founder cards directly below "The humans in your clubhouse for six months" — name, photo, one-line credential, direct email.
- Add a one-line "What happens after six months" clarifier: "At month 6 we either prove $X in recovered revenue and you upgrade — or we refund your pilot fee."
- Add an anonymized pilot-club strip: "Founding pilots: 3 top-100 Platinum clubs, 2 regional country clubs, 1 private city club."
