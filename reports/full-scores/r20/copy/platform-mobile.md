# Platform Mobile — Copy Score

**Grade: C+**

## What's Working
- "Six jobs Swoop does before your GM finishes coffee." — survives the narrow column and still lands the number.
- Short section eyebrows give mobile readers a place to pause.

## What's Broken
- The six-card grid collapses to a long scroll where every card's body paragraph reads the same shape ("X helps you Y so that Z") — parallel structure becomes monotony without visual differentiation.
- The comparison table ("One page replaces four logins") is illegible at mobile width — likely rendered as tiny text with horizontal scroll. That's a layout problem but the copy can help by shortening row labels.
- Multiple CTAs on the page all say the same thing ("Book a Demo") — on mobile that's especially wasteful because each one occupies a full tap target.
- Card headlines are full sentences instead of 2–3 word labels that scan.

## Exact Fix
`src/landing/components/CoreCapabilitiesSection.jsx` (card headlines)
- Before: full-sentence H3s
- After: 2–3 word labels — "Leak detection" / "Risk ranking" / "Auto-outreach" / "Board report" / "Agent queue" / "Daily brief"

`src/landing/components/ComparisonSection.jsx` (row labels for mobile)
- Before: "Sends automated retention outreach to at-risk members"
- After: "Auto-outreach to at-risk members"

`src/landing/components/DemoCtaSection.jsx`
- Before: duplicated "Book a Demo" CTAs
- After: one primary CTA per section, labeled for the action — "Run my leak report"
