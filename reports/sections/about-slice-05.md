# About Slice 05 (FAQ Full + Footer) — Section Score

**Overall Grade: C**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C- | Page ends at a copyright notice — no final positioning statement, no close |
| Design/Visual | C | Footer is minimal to the point of being functionally empty; FAQ section is clean but unstyled |
| CRO/Conversion | F | No CTA anywhere in this visible section — the page ends with zero conversion opportunity |
| Trust/Credibility | C+ | FAQ questions are the right ones; answers need to be expanded to verify |
| Mobile UX | B- | Accordion FAQ is mobile-native; footer collapses cleanly |
| Navigation/UX | C- | Footer has only "Investor Information" and copyright — no nav, no social links, no contact |
| B2B Buyer Journey | D | Journey ends at a footer with no next step — the most interested buyers have nowhere to go |
| Copy/Voice | C | FAQ question copy is strong; footer copy is non-existent |
| Technical Credibility | C- | "Is my members' data secure?" is a collapsed accordion — the most critical technical question is hidden |

## Messaging/Positioning
**Grade: C-**
- What's working: The FAQ section presents the right questions — Jonas replacement, software requirements, setup time, data security, pilot process. These are the exact five objections a GM has.
- What's broken: The page ends at "© 2024 Swoop Staff" with "Investor Information" as the only footer link. There is no closing statement about what Swoop is, no tagline, no final value prop. A GM who has scrolled the entire About page lands on a copyright line.
- Fix: Add a closing section above the footer: `"Swoop is the intelligence layer private clubs didn't know they were missing."` (centered, 32px, bold). One line beneath: `"Built for GMs who want to stop firefighting and start leading."` Then the CTA button. Then the footer.

## Design/Visual
**Grade: C**
- What's working: FAQ accordion design is clean. The "+" icons for collapsed items and "−" for expanded item are clear. Typography is readable.
- What's broken: The footer is essentially empty — "swoop / Integrated Intelligence for Private Clubs" on the left, "Investor Information | © 2024 Swoop Staff" on the right. No visual weight, no nav links, no social proof, no contact info. It looks like a default template footer that was never filled in.
- Fix: Footer minimum content: left column (logo + tagline), center column (Platform, Pricing, About links), right column (Book a Demo button + privacy policy link). Add a thin top border to the footer to separate it from page content. Copyright year should be 2026, not 2024.

## CRO/Conversion
**Grade: F**
- What's working: Nothing. There is no CTA anywhere in this screenshot.
- What's broken: This is the bottom of the About page — the point of maximum consideration for a buyer who has read everything. There is no "Book a Demo", no "Apply for Founding Partner", no "Request a Reference Call", no contact email, no anything. The most engaged buyers on the entire site arrive at the bottom of the About page and find a copyright notice.
- Fix: This is the highest priority fix on the entire About page. Add before the footer: a full-bleed CTA section with dark (or orange) background: `<h2>See your club's data before you commit.</h2>` + `<p>30-minute pilot call. We connect to Jonas, pull your last 90 days, and show you which members are at risk right now.</p>` + `[Book a Pilot Call →]` (white button on dark background) + `[Request a reference call from a current pilot GM]` (text link beneath).

## Trust/Credibility
**Grade: C+**
- What's working: Five FAQ questions are all real, practical objections a GM would have. The visible question "We already have Jonas and ClubEssential. Does Swoop replace them?" is answered well (per prior slice critique).
- What's broken: Three of five FAQ answers are collapsed in this view ("How long does setup take?", "Is my members' data secure?", "What does a founding-partner pilot actually look like?"). The data security question is especially critical — a GM who skims and doesn't expand this will leave with an unresolved security concern.
- Fix: Pre-expand "Is my members' data secure?" by default. Answer should include: "All club data is isolated in a dedicated environment. We use AES-256 encryption at rest and TLS 1.3 in transit. No member data is ever shared across clubs or used for cross-club model training. SOC 2 Type II audit is in progress, expected Q3 2026."

## Mobile UX
**Grade: B-**
- What's working: Accordion FAQ is the correct mobile pattern. "+" icons are tap-friendly. Footer is simple enough to render cleanly on mobile.
- What's broken: Footer on mobile will stack left and right columns vertically, making the copyright line appear at a very long scroll distance from the last content. No "Back to top" button is present.
- Fix: Add a sticky "Book a Demo" button at the bottom of mobile screens (position: fixed, bottom: 0, full width, orange, z-index: 50) that only shows after scrolling past the hero section. This is the single highest-impact mobile CRO fix across the entire About page.

## Navigation/UX
**Grade: C-**
- What's working: FAQ accordion keyboard accessibility (if implemented) is correct UX
- What's broken: Footer has only one link ("Investor Information") and a copyright notice. No links to Platform, Pricing, Home. No social links. No email contact. "© 2024 Swoop Staff" has the wrong year (should be 2026). No back-to-top button. No sitemap.
- Fix: Footer nav minimum: `Platform | Pricing | About | Book a Demo` in center. Right: `Privacy Policy | Terms of Service`. Left: logo + "Integrated Intelligence for Private Clubs". Bottom bar: `© 2026 Swoop Technologies Inc. All rights reserved.`

## B2B Buyer Journey
**Grade: D**
- What's working: FAQ questions address the five most common B2B objections in the right order: displacement risk → switching cost → implementation effort → security → pilot process
- What's broken: The buyer journey ends at a copyright notice. A GM who has read the full About page — team, moat, testimonials, demo stats, founding partner offer, all five FAQ answers — has no final action to take. This is the single most damaging UX failure on the page.
- Fix: The page needs a closing CTA section as described above. Additionally, after the FAQ, add a peer-validation line: `"Want to talk to a GM who's already in the pilot? We'll connect you."` + `[Request a Reference Call →]` This is the perfect final trust signal for a B2B buyer at the decision stage.

## Copy/Voice
**Grade: C**
- What's working: FAQ question phrasing is in the GM's voice — "We already have Jonas and ClubEssential", "Do I need to replace my current software" — this mirrors the actual language a skeptical buyer uses, which creates immediate recognition
- What's broken: The footer tagline "Integrated Intelligence for Private Clubs" is fine but understated for a page-closing moment. The copyright says 2024, which is factually wrong and makes the product look abandoned or outdated.
- Fix: Update copyright to "© 2026 Swoop Technologies Inc." Add a footer tagline upgrade: "Swoop — Know your members. Keep them." (5 words, memorable, action-oriented, retention-focused).

## Technical Credibility
**Grade: C-**
- What's working: "Is my members' data secure?" exists as a FAQ question, which signals awareness of the security concern
- What's broken: The security FAQ is collapsed — the most important technical credibility question on the page requires a click to answer. "What does a founding-partner pilot actually look like?" is also collapsed, which means the technical implementation detail (Jonas connection, data pipeline, onboarding process) is hidden from skimmers.
- Fix: Pre-expand both "Is my members' data secure?" and "What does a founding-partner pilot actually look like?" by default. These are the two questions that most directly address the B2B technical evaluation. Security answer should cite: data isolation, encryption, SOC 2 status, no cross-club sharing. Pilot answer should cite: week 1 (Jonas connection, data import), week 2 (morning brief live), week 3 (first board deck).

## Top 3 Priority Fixes for This Section
1. Add a closing CTA section before the footer — this is the single most damaging omission on the entire About page; the most engaged buyers land here and find nothing
2. Pre-expand "Is my members' data secure?" — collapsed by default, it's the highest-stakes unanswered question for a GM granting data access
3. Fix the copyright year from 2024 to 2026 — a stale copyright makes the product look abandoned and actively damages trust at the final moment of evaluation
