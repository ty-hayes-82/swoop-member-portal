# About Hero — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C | "Humans in your clubhouse" is evocative but under-explained as a value prop |
| Design/Visual | B- | Avatar initials instead of real photos destroy credibility for a team page |
| CRO/Conversion | D+ | No CTA on the About hero — dead end for a buyer who just arrived here |
| Trust/Credibility | D | Initials-only avatars, no photos, no LinkedIn links; looks placeholder |
| Mobile UX | C | Three-column bio cards will stack awkwardly on mobile |
| Navigation/UX | B | Nav is clean; active "About" state is correctly highlighted |
| B2B Buyer Journey | C- | GM wants to know who they're trusting with member data — team bios are too thin |
| Copy/Voice | C+ | Headline is memorable; sub-copy is soft and vague |
| Technical Credibility | D | No credentials, no LinkedIn, no past club names — team bios read as placeholder text |

## Messaging/Positioning
**Grade: C**
- What's working: "The humans in your clubhouse for six months" is a genuine differentiation hook — hands-on pilot framing is unusual in SaaS
- What's broken: The sub-headline ("Every pilot is hands-on — we're in your systems, on your calls, and in your board deck") is the real value statement but it's in small body text where nobody reads it; the section label "WHO YOU'LL WORK WITH" is too generic
- Fix: Promote the sub-headline copy into the hero itself. Change section label from "WHO YOU'LL WORK WITH" to "YOUR IMPLEMENTATION TEAM". Move "we're in your systems, on your calls, and in your board deck" to a subtitle directly beneath the H1.

## Design/Visual
**Grade: B-**
- What's working: White card layout with orange accent initials is visually consistent with brand; three-column grid is clear
- What's broken: Colored-circle initials look like a mockup that never got real photos. On an About page for a trust-based B2B sale, this is a serious credibility gap. The bottom dark section is cropped — it creates visual confusion about what's below
- Fix: Replace initials with actual headshots (even casual/LinkedIn-style photos). If photos aren't available yet, use a grayscale placeholder with a "Photo coming Q2 2026" note rather than color initials. Minimum card height should be consistent across all three cards.

## CRO/Conversion
**Grade: D+**
- What's working: "Book a Demo" is visible in the nav bar
- What's broken: No in-section CTA. A buyer who comes to the About page to vet the team has no prompt to take the next step. After reading about Tyler, Jordan, and Alex, there's nothing that says "Ready to meet the team? Book a pilot call."
- Fix: Add a CTA row beneath the three bio cards: `<h3>Ready to meet us?</h3>` + `<p>Pilot calls are 30 minutes. We'll show you your club's data on the call.</p>` + `<Button>Book a Pilot Call →</Button>`

## Trust/Credibility
**Grade: D**
- What's working: Titles are present (Founder & CEO, Head of Club Success); role specialization signals intentional team-building
- What's broken: No real photos, no LinkedIn profile links, no specific past club names for Tyler's "300-member desert club" claim, Jordan's company "Ex-Aglyyx" is unverifiable, Alex's "Ex-Salesforce Industries" is vague
- Fix: For each bio, add: (1) a real photo, (2) a LinkedIn URL, (3) one specific, named credential. Example for Tyler: "Former GM-side operator at Desert Mountain Club (Scottsdale). Built the member analytics layer that cut lapse rate 18% in year one."

## Mobile UX
**Grade: C**
- What's working: Headline text size appears large enough to read on mobile
- What's broken: Three-column card grid will collapse to single column on mobile, making the section very long. The dark section peeking at the bottom will look clipped. No visible indication of what comes next.
- Fix: On mobile, stack cards vertically with consistent padding `py-6 px-4`. Add a horizontal rule or orange divider between bio cards on mobile. Ensure dark "MOAT" section below has a visible top edge that signals continuation, not cutoff.

## Navigation/UX
**Grade: B**
- What's working: Nav is consistent, "About" is active/highlighted, "Book a Demo" CTA is orange and prominent
- What's broken: No breadcrumb or sub-nav to jump to sections within the About page (Team, Moat, Testimonials, Demo Results, FAQ — all below the fold with no wayfinding)
- Fix: Add an in-page anchor nav below the hero: `Team | Our Moat | What GMs Say | Live Demo Results | FAQ` — links scroll to their respective sections.

## B2B Buyer Journey
**Grade: C-**
- What's working: The "founding-partner clubs" framing signals exclusivity and a customer-first development model
- What's broken: A GM evaluating Swoop wants to know: who built this, what's their club-industry credibility, and can I call a reference? None of those are answered. The bios are too thin to convey industry expertise. "Behavioral prediction systems for clubs, resorts, and cruise lines" for Jordan is generic.
- Fix: Each bio should answer "why should a GM trust this person with member data?" Restructure to: [Name] — [specific past club/company] — [one quantified outcome they produced]. Add a line at the bottom of the section: "Want to speak with a founding-partner GM before you commit? We'll connect you directly."

## Copy/Voice
**Grade: C+**
- What's working: "Humans in your clubhouse" has warmth and specificity — it correctly calls out that Swoop isn't just software-you-deploy-and-forget
- What's broken: "Swoop is in closed pilot with founding-partner clubs" is buried in sub-text and repeats information GMs have already seen. The bios read like LinkedIn summaries, not trust-building copy.
- Fix: Rewrite Tyler's bio: "I ran member ops at a 300-member private club before writing a single line of code. I built Swoop because the GM tools I needed didn't exist." Rewrite Jordan's bio: "Eight years building predictive models at Aglyyx — I retrained them on 12 months of club-specific behavioral data. That's the engine." Rewrite Alex's bio: "I spent six years at Salesforce turning enterprise data into daily workflows. Now I do the same thing for GMs — your onboarding, your team training, your morning brief."

## Technical Credibility
**Grade: D**
- What's working: Jordan's "behavioral prediction systems" and "NASDAQ: AGYS" reference suggests real technical background
- What's broken: No specifics about the tech stack, data pipeline, or security posture on a page where GMs are evaluating whether to give Swoop access to member records. "Ex-Aglyyx" is not a well-known brand; it needs context.
- Fix: Add a single sentence to Jordan's bio: "Built on the same data infrastructure used by enterprise hospitality — Jonas-native API integration, SOC 2 Type II in progress." Add a footnote to the team section: "All member data is isolated per club, encrypted at rest, and never used for cross-club training."

## Top 3 Priority Fixes for This Section
1. Replace initials with real headshots — this is an About page; placeholder avatars shred credibility with a B2B buyer vetting the team
2. Add an in-section CTA after the bio cards — "Book a Pilot Call" with a one-line hook; the page currently dead-ends
3. Rewrite all three bios with specific, named credentials and quantified outcomes — generic LinkedIn-style summaries do not build trust at the price point Swoop is selling
