# Pricing Slice-04 — FAQ + Footer

**Overall Grade: C**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C+ | FAQ addresses the right objections but only 3 questions are shown — too sparse |
| Design/Visual | C+ | Clean accordion design; warm off-white background is appropriate; too much white space |
| CRO/Conversion | D | Page ends with the footer — no final CTA, no re-engagement, no exit offer |
| Trust/Credibility | C- | FAQ answers are short; no supporting data, no named references |
| Mobile UX | B- | Accordion pattern is inherently mobile-friendly; footer is minimal and clean |
| Navigation/UX | C | Footer has only "Investor Information" link — no product links, no support, no sitemap |
| B2B Buyer Journey | D+ | Page ends cold — buyer who scrolled the entire page gets no next step except nav CTA |
| Copy/Voice | B- | The Jonas/ClubEssential FAQ answer is the best copy on the page; other answers need expansion |
| Technical Credibility | B- | Jonas/ClubEssential answer is specific and credible; setup and pilot questions are vague |

## Messaging/Positioning
**Grade: C+**
- What's working: The three FAQ questions target real objections: (1) Does Swoop replace existing systems? (2) How fast is setup? (3) What does the pilot look like? These are the correct questions for a GM in the late evaluation stage.
- What's broken: Only three questions is too few for a pricing page FAQ. Missing questions that a GM would actually ask: "What does it cost to get started?", "Who owns our data?", "What happens if we want to cancel?", "Do you have references from clubs our size?", "What integrations do you support?". The section ends before it can do its objection-handling job.
- Fix: Add five more FAQ items: **"What does setup actually require from our team?"**, **"Who owns our member data?"**, **"What's the cancellation policy?"**, **"Can we talk to a reference club before deciding?"**, **"What integrations are in the 28-library?"** Use accordion pattern, same design, no redesign required.

## Design/Visual
**Grade: C+**
- What's working: The warm off-white (`#faf8f4` approximately) background differentiates the FAQ from the white plan cards above. The accordion expand/collapse pattern (+/- icons) is standard and recognisable.
- What's broken: The section has too much empty vertical space — large top and bottom padding creates a section that feels unfinished rather than spacious. With only three FAQ items, the section height is disproportionate to its content. The footer is completely text-only and feels abandoned.
- Fix: Reduce section `padding-top` and `padding-bottom` by 30%. Add the five additional FAQ items to fill the section naturally. Add a simple footer CTA strip above the legal footer: a warm-toned banner with the final conversion message and a "Book a Demo" button.

## CRO/Conversion
**Grade: D**
- What's working: Nothing — this section does not contain any conversion element.
- What's broken: The entire pricing page ends at the footer with no final CTA. A GM who read the hero, used the ROI calculator, reviewed the plan cards, and scrolled through the FAQ has completed the full buyer journey — and is then handed a nearly empty footer with only an "Investor Information" link. This is a catastrophic conversion gap. Best-in-class pricing pages end with a strong CTA section: "Ready to protect your dues revenue?" + two buttons.
- Fix: Insert a full-width CTA section between the FAQ accordion and the footer: Background `#0a0a0a`. Headline: **"Ready to see which of your members are at risk?"** Subhead: **"Set up takes 15 minutes. Your first member brief arrives tomorrow morning."** Two buttons: `[Start Free — No Credit Card]` (orange fill) and `[Book a 30-min Walkthrough]` (white outline). This single addition will materially improve page-level conversion.

## Trust/Credibility
**Grade: C-**
- What's working: The Jonas/ClubEssential answer is the most specific and credible on the page — it names actual systems, describes the data relationship ("reads Jonas and ClubEssential, does not replace"), and explains the value ("ranked member brief every morning, not just a complaint log after the fact"). This is excellent copy.
- What's broken: "How long does setup take?" and "What does a founding-partner pilot actually look like?" are accordion headers that are still collapsed in the screenshot — we can't see the answers. But the presence of only 3 questions with 2 still collapsed gives the impression that the FAQ is thin. No testimonial, no reference club, no data in the FAQ context.
- Fix: Expand the second and third FAQ answers in the screenshot to confirm they are substantive. Ideal answer for "How long does setup take?": **"Most clubs are live within 15 minutes using our one-click Jonas/ClubEssential connector. Your first member health brief arrives the next morning. No IT department required."** Ideal answer for pilot question: **"A 90-day founding-partner pilot includes full Signals + Actions access, weekly check-ins with your success manager, and a board-ready retention report at the end. We define success together before we start."**

## Mobile UX
**Grade: B-**
- What's working: Accordion FAQ is inherently mobile-friendly. Single-column layout. Large touch targets on the +/- icons. The footer is simple enough to render cleanly on all screen sizes.
- What's broken: The "Investor Information" footer link is very small text that may fall below accessible touch-target minimums. The footer company descriptor "Integrated Intelligence for Private Clubs" is a nice brand line but is too small on mobile to serve as a trust signal.
- Fix: Increase footer link touch targets: `min-height: 44px; display: inline-flex; align-items: center;`. Increase "Integrated Intelligence for Private Clubs" to `font-size: 0.875rem` on mobile. Ensure the CTA section added above has full-width buttons on mobile.

## Navigation/UX
**Grade: C**
- What's working: The footer is clean and uncluttered.
- What's broken: The footer contains only "Investor Information" and "© 2024 Swoop Golf" — no product links, no support link, no privacy policy, no terms of service, no social links, no "Back to top" link. For a B2B SaaS product, the absence of a privacy policy link is a trust and compliance issue. A GM's IT or legal team will look for a privacy policy before approving a vendor relationship.
- Fix: Add to footer: **Product** column (Platform, Pricing, Demo), **Company** column (About, Investors, Contact), **Legal** column (Privacy Policy, Terms of Service). Add a "Back to top ↑" text link on the right. Minimum viable: add Privacy Policy and Terms of Service links even if they're placeholder pages.

## B2B Buyer Journey
**Grade: D+**
- What's working: FAQ placement at the end of the pricing page is correct — it catches late-stage objections before the buyer bounces.
- What's broken: The buyer journey ends cold. After a GM has invested time reading the hero, using the calculator, comparing plans, and reviewing FAQs, the page offers them nothing. No final summary of value, no urgency hook, no re-engagement path, no email capture for buyers who aren't ready to book. The page's conversion architecture has no closing mechanism.
- Fix: Implement a three-layer close at the bottom of the page: (1) Final CTA section (see CRO fix above). (2) "Not ready to book? Get a 5-minute email breakdown of how Swoop works." — email capture for nurture. (3) Live chat or Intercom widget triggered when user has scrolled 80% of pricing page without clicking a CTA.

## Copy/Voice
**Grade: B-**
- What's working: The Jonas/ClubEssential FAQ answer is the best single piece of copy on the entire pricing page: specific, direct, addresses the exact fear (replacement vs. augmentation), and ends with a concrete benefit ("ranked member brief every morning, not just a complaint log after the fact"). This voice should be the template for all Swoop copy.
- What's broken: The section header "Common questions" is generic. The "PRICING FAQ" label above it is redundant — the buyer knows they're on the pricing page. The section needs a more specific header that signals completeness.
- Fix: Replace "PRICING FAQ" + "Common questions" with: Label — `BEFORE YOU DECIDE`. Headline — **"Questions GMs ask before they sign up."** This reframes the FAQ from a defensive objection-handler into a confident pre-sales conversation.

## Technical Credibility
**Grade: B-**
- What's working: The Jonas/ClubEssential answer is technically specific — it explains data flow (Swoop reads, doesn't replace), names the GM's morning workflow touchpoint, and distinguishes Swoop's value from raw CRM data. This is technically credible.
- What's broken: "How long does setup take?" and "What does a founding-partner pilot actually look like?" are collapsed and we can't assess their answers. If the setup answer doesn't specify which integrations require API keys vs. file exports vs. one-click connectors, it will feel vague to a technical buyer.
- Fix: Ensure the setup answer explicitly states: **"Jonas and ClubEssential connect via read-only API in under 15 minutes. Lightspeed and Northstar connect via daily export. No write access is ever requested. Your data is encrypted at rest and in transit."** This single answer addresses data security, setup speed, and system compatibility simultaneously.

## Top 3 Priority Fixes for This Section
1. Add a full-width CTA section above the footer — the pricing page currently ends with no conversion mechanism for a buyer who completed the full journey. "Ready to see which of your members are at risk?" + two buttons is the single highest-ROI fix on the entire pricing page.
2. Add Privacy Policy and Terms of Service links to the footer — their absence is a trust and compliance issue that will cause IT reviewers and legal-check processes to pause or reject the vendor evaluation.
3. Expand the FAQ from 3 to 8 questions, with fully written answers. Add: data ownership, cancellation policy, reference clubs, integration list, and team setup requirements. Three questions is not enough to close a B2B SaaS deal at $1,499/month.
