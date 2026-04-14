# About Mobile — B2B Buyer Score

**Grade: C-**

## What's Working
- "Built for the people who run private clubs" is a sharp category-specific positioning line — GMs immediately feel this isn't generic hospitality SaaS
- "Swoop tells you what to do about it" reframes the product as prescriptive, not dashboard-ware — differentiates from existing club software
- "In closed pilot with founding-partner clubs. Every pilot is hands-on — we're in your systems, on your calls, and in your board deck" is the single strongest line on the entire site for B2B risk reduction — it communicates concierge-level service without saying "concierge"
- "The humans in your clubhouse for six months" frames engagement length and tells a GM they won't be abandoned post-sale

## What's Broken
- No founder name, headshot, or credentials visible on mobile — GMs want to see a face before forwarding to a board
- No named pilot clubs, no regions, no count ("4 founding clubs in the Northeast" would be enough)
- No investor or advisor names — private-club boards ask "who's funding them" and there's no answer
- No link to LinkedIn profiles or industry credentials — champion-enablement is weak
- No "what happens after the pilot" paragraph — GMs worry about being a beta victim, and this page doesn't address that fear
- CTA at the bottom of the About page is missing or weak; after a GM reads the team story, they need a one-tap "Meet the team on a call" button

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` (and/or `src/landing/components/TeamSection.jsx`) — add a mobile-first team card block with real names and this copy:

```
"[Founder], [10 yrs at Jonas / former GM at Oakmont / ex-Troon ops]. [Co-founder], [engineering from Toast / Square]. Advisors: [GM of named private club, 300 members], [former CFO of ClubCorp portfolio]. Reach us directly — [founder]@swoopgolf.com."
```

Then add a line: `"After the 6-month pilot: month-to-month, cancel any time, your data exports in one click to CSV. No lock-in, no multi-year contracts, ever."` — this converts the "hands-on pilot" strength into a full-lifecycle reassurance that a mobile-reading GM can screenshot and forward.