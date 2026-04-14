# Demo Form / Final CTA — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Headline is outcome-focused and strong; subhead buries it with too many scenarios |
| Design/Visual | B- | Dark background with form works but 4-field form feels more demanding than a 10-min demo warrants |
| CRO/Conversion | C+ | Phone field is a friction-adder that will reduce submission rate; no confirmation of what happens next |
| Trust/Credibility | B | "No credit card required" and "Cancel anytime" reassurances present but small; email/phone visible |
| Mobile UX | C+ | 2×2 field grid will stack to single column on mobile but needs verification; CTA button width needs check |
| Navigation/UX | B- | Footer is minimal but "Investor Information" link in footer is a distraction at the conversion moment |
| B2B Buyer Journey | B | Form position at page-end is correct; the copy does a good job of naming specific pain points |
| Copy/Voice | B+ | "See what your club misses today and can recover tomorrow" is the best headline on the page |
| Technical Credibility | C | No technical reassurance about data handling for the form submission itself |

## Messaging/Positioning
**Grade: B**
- What's working: "See what your club misses today and can recover tomorrow." is an excellent headline — it is future-tense, outcome-oriented, specific to the GM's core anxiety (missing problems until it's too late), and short enough to scan in a dark background context.
- What's broken: The subhead lists four specific scenarios ("tee sheet leakage, at-risk members, F&B staffing pressure, and revenue pipeline blind spots") — which is comprehensive but too long for a final CTA moment. By the time a buyer is at the bottom of the page, they don't need to be re-sold on use cases.
- Fix: Simplify the subhead to: "Book a live walkthrough with your own club's operating scenarios." Remove the list of four items. The list belongs in the hero or features section — not in the closing argument.

## Design/Visual
**Grade: B-**
- What's working: Dark background (near-black with a golf course silhouette) creates strong contrast for the white form fields and orange CTA button. This is visually the most premium-looking section on the page.
- What's broken: The form has four fields (Name, Club, Email, Phone) laid out in a 2×2 grid. The grid creates visual symmetry but places Phone in the lower-right, which is the least prominent position for a high-friction field. The form card has a dark background on dark background — the contrast between form container and page background is insufficient.
- Fix: Increase form card background to `background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15)` to define the form boundary. Move Phone to below Email as a full-width optional field. Label it "(optional)" in 12px gray.

## CRO/Conversion
**Grade: C+**
- What's working: "No credit card required · 30-minute walkthrough · Cancel anytime" micro-copy below the button addresses the top three demo anxieties.
- What's broken: The Phone field is required (or appears required — no optional label). Every additional required field reduces form submission rate by approximately 10-15% in B2B contexts. For a product at pilot stage that needs demos, this is self-defeating. Additionally, there is no confirmation of what happens after submission — does someone call within 24 hours? Is there a calendar link?
- Fix: Mark Phone as "(optional)". Add a process note below the micro-copy: "After you submit, you'll get a calendar link within 2 business hours to pick your demo time." This reduces the "black box" anxiety that causes form abandonment.

## Trust/Credibility
**Grade: B**
- What's working: Contact information visible in the footer ("demo@swoopgolf.com · (480) 225-5102") and the reassurance copy ("No credit card required") provide baseline credibility signals. Showing a real phone number is a strong trust signal for this audience.
- What's broken: The "Or email us at demo@swoopgolf.com · (480) 225-5102" line below the button is styled as secondary/link text and easy to miss. For GMs who distrust forms, this is an important escape valve that should be more prominent.
- Fix: Move the contact line outside the form card and style it separately: "Prefer to talk directly? Call (480) 225-5102 or email demo@swoopgolf.com" in 14px white text, centered, below the form card. This serves the GM who wants human contact without form overhead.

## Mobile UX
**Grade: C+**
- What's working: The golf course silhouette background likely scales acceptably across viewport widths.
- What's broken: The 2×2 form field grid will collapse to single-column on mobile, which is correct — but the Name/Club fields in the first row are likely equal-width (50% each). Club name for a private golf club can be long ("Congressional Country Club") and a 50% width field at 375px is only ~160px wide — not enough for the full name without horizontal scroll in the input.
- Fix: At mobile widths, stack all fields as `grid-template-columns: 1fr`. Set `width: 100%` on all inputs. Set CTA button to `width: 100%; padding: 16px` on mobile. Ensure `font-size: 16px` on all inputs to prevent iOS auto-zoom.

## Navigation/UX
**Grade: B-**
- What's working: The footer is appropriately minimal — just the Swoop wordmark, tagline, "Investor Information" link, and copyright. No nav clutter at the conversion moment.
- What's broken: "Investor Information" in the footer right-corner is out of place on a GM-targeted marketing page. It signals that this site is partly investor-facing, which introduces noise into a single-audience conversion page. A GM who sees "Investor Information" is reminded that they are talking to a small startup.
- Fix: Remove "Investor Information" from the footer of this page entirely. Move it to a separate /investors page or include it only in a site-wide footer that doesn't appear on the homepage. Replace with a "Privacy Policy" link if a legal footer element is needed.

## B2B Buyer Journey
**Grade: B**
- What's working: The "Limited founding partner spots available — early clubs get hands-on onboarding and direct input on the roadmap" line below the headline is the right scarcity/exclusivity signal at the bottom-of-funnel position. It reframes booking a demo as a competitive act.
- What's broken: By this point in the page journey, a buyer has seen the ROI calculator, proof metrics, testimonials (partially anonymous), FAQ, and founding partner CTA. The demo form does not acknowledge this journey — it restates the value proposition from scratch as if the buyer just landed here.
- Fix: Change the subhead approach from re-explaining the product to a commitment-reinforcing statement: "You've seen the numbers. Now let's run them against your club." This acknowledges the buyer has done their homework and positions the demo as the natural conclusion of the page journey.

## Copy/Voice
**Grade: B+**
- What's working: "See what your club misses today and can recover tomorrow." is excellent — it is the strongest headline on the page. The form label "BOOK A DEMO" as an eyebrow sets appropriate expectations before the headline.
- What's broken: The subhead paragraph ends with "revenue pipeline blind spots" which is the most abstract and jargon-heavy phrase in the section. It weakens the close.
- Fix: Replace the entire subhead with: "Book a live walkthrough using your club's actual scenarios. We'll show you which members are at risk, what your tee sheet is leaving on the table, and what the board report looks like — in 30 minutes." This is specific, visual, and time-bounded.

## Technical Credibility
**Grade: C**
- What's working: The phone number and email address are real contact signals that imply a real company with real staff.
- What's broken: There is no indication of how the form data is handled — no HTTPS note, no "We respect your privacy" micro-copy, no indication that the submitted Club name won't be shared. Private club GMs are protective of their club's data and identity.
- Fix: Add below the form fields, in 11px gray: "Your information is never shared with third parties. We use it only to prepare your demo." This addresses the confidentiality concern that is highly relevant for private club operators who do not want their interest in a new vendor to be public.

## Top 3 Priority Fixes for This Section
1. Mark Phone as optional and add a post-submission process note ("You'll receive a calendar link within 2 business hours") — removing a required field and clarifying what happens next are the two highest-ROI conversion optimizations available in this form.
2. Replace the subhead with "You've seen the numbers. Now let's run them against your club." — this acknowledges the full-page journey and converts the demo from a cold ask into a natural conclusion.
3. Remove "Investor Information" from the footer of this page — it introduces startup-scale anxiety at exactly the moment a GM is deciding whether to trust Swoop with their club's data.
