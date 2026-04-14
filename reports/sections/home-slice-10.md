# Pricing Section — Bottom (Tier Feature Lists + ROI Calculator Header) — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C+ | ROI Calculator headline is well-positioned but the pricing card bottom halves repeat copy already seen |
| Design/Visual | C | Feature checklist visually identical across tiers; $1,499 tier CTA is a ghost button — undersells premium |
| CRO/Conversion | C- | Middle tier CTA (orange) is correctly styled; top tier CTA is visually identical to free tier — major conversion miss |
| Trust/Credibility | C- | ROI Calculator intro is promising but the section content is cut off; no social proof near CTAs |
| Mobile UX | C | Stacked feature lists will be very long on mobile; no collapse mechanism shown |
| Navigation/UX | C+ | Feature parity across tiers is scannable; "ROI CALCULATOR" eyebrow label provides clear section marker |
| B2B Buyer Journey | B- | ROI Calculator directly after pricing is textbook BOFU — addresses "is it worth it?" immediately |
| Copy/Voice | C | "Book the 30-minute walkthrough" repeated twice (middle + top tier) with no differentiation is lazy |
| Technical Credibility | C+ | "GPS + on-property member behavior" and "Save-attribution tracking" are real technical differentiators buried in list items |

---

## Messaging/Positioning
**Grade: C+**
- What's working: Positioning the ROI Calculator directly below the pricing cards is textbook BOFU strategy. "What is member turnover costing your club?" is a sharp, anxiety-inducing headline that reframes the price conversation — instead of "does Swoop cost $499/mo?" the question becomes "what does NOT having Swoop cost you?"
- What's broken: The pricing card bottom halves visible in this screenshot are continuation of content from the previous section — they're the feature checklist items. There's no new positioning message in this scroll zone. A GM scrolling through this region sees a wall of checkmarks and two CTAs before reaching the ROI Calculator. The transition between pricing and ROI Calculator has no copy bridge.
- Fix: Add a bridge sentence between the bottom of the pricing cards and the ROI Calculator: "Not sure which plan is right? Calculate how much member turnover costs your club first — then decide." This connects the two sections and makes the calculator feel like a natural next step rather than a separate section.

---

## Design/Visual
**Grade: C**
- What's working: Checklist items with orange checkmarks create visual consistency across tiers. The "MOST POPULAR" badge on the middle tier card pulls the eye to the right conversion target. The "ROI CALCULATOR" section uses a light/white background that provides visual relief from the pricing card darkness.
- What's broken: All three tier CTAs at the bottom of the cards are visually near-identical in this scroll zone: "Start on Signals (free)" (ghost), "Book the 30-minute walkthrough" (orange, filled), "Book the 30-minute walkthrough" (ghost or lightly outlined). The $1,499 tier CTA has no visual differentiation from the $0 tier CTA despite representing a 12× price difference. The ROI Calculator section title appears in a very small orange eyebrow label with the same light/white background — it doesn't command attention.
- Fix: Apply distinct CTA button styles: Free tier → `background: transparent; border: 1px solid #999; color: #666` (clearly secondary). Middle tier → `background: #F97316; color: white; font-weight: 600` (primary). Top tier → `background: #111; border: 2px solid #F97316; color: white` (premium/enterprise). Make the ROI Calculator section headline `font-size: 36px; font-weight: 800` minimum, and add a subtle amber underline accent under "member turnover."

---

## CRO/Conversion
**Grade: C-**
- What's working: Having a CTA at the bottom of each pricing card (after the feature list) is correct — GMs who read all feature items before deciding need a CTA at the natural end of that reading.
- What's broken: The identical CTA text on the middle and top tiers is a significant conversion problem. "Book the 30-minute walkthrough" means the same thing for a $499/mo buyer and a $1,499/mo buyer — but these are different conversations. The $1,499 tier buyer likely needs a custom demo, a pilot proposal, or a sales conversation — not the same walkthrough as a $499 prospect. The ROI Calculator is introduced but no calculator UI is visible in this screenshot, meaning there's no immediate interaction to engage with.
- Fix: Change the top tier CTA from "Book the 30-minute walkthrough" to "Request a Member App pilot — speak with our team." This differentiates the sales conversation and signals that the top tier involves a more consultative process. Add a visible "Start calculating →" or "Enter your club size" input field immediately below the ROI Calculator headline to trigger engagement before the user scrolls away.

---

## Trust/Credibility
**Grade: C-**
- What's working: The ROI Calculator concept is inherently a trust-building tool — it implicitly says "we're confident enough in our numbers to let you calculate your own ROI."
- What's broken: There is no social proof anywhere near the tier CTAs. A GM who has scrolled to the bottom of the pricing cards and is deciding whether to click a CTA is at maximum purchase anxiety — this is exactly when a customer quote, a logo, or a data point would be most powerful. Instead, they see more checklist items and a ghost button. "Adjust the sliders to see your club's exposure — and what Swoop recovers" promises credibility but the calculator itself isn't visible in this screenshot.
- Fix: Add a testimonial directly above or between the tier CTAs: `"We booked the walkthrough on a Tuesday. By Friday we had a pilot plan. We launched in 11 days." — Operations Director, 320-member club.` This gives the buyer social proof at the moment of maximum hesitation.

---

## Mobile UX
**Grade: C**
- What's working: The ROI Calculator section with its headline and subhead will render fine on mobile — simple centered text layout.
- What's broken: The bottom halves of the pricing cards — which contain the feature checklists and CTAs — will stack into three very long mobile cards. On mobile, a user must scroll through: Free tier features list → Free CTA → Middle tier features list → Middle CTA → Top tier features list → Top CTA, in sequence. With 5–7 checkmark items per tier, that's 15–21 list items before reaching the ROI Calculator. No user will do this.
- Fix: On `max-width: 768px`, collapse each tier's feature list to the top 3 items with a "See all features +" toggle. Ensure each CTA button is `height: 52px; font-size: 16px; width: 100%` for thumb-tap accessibility. Move the ROI Calculator section to appear immediately below the pricing headline on mobile (before the cards), so users are asked "what's your club size?" before they evaluate price.

---

## Navigation/UX
**Grade: C+**
- What's working: "ROI CALCULATOR" eyebrow label clearly demarcates a new section. The checklist format within pricing cards makes feature comparison quick for GMs who scan vertically.
- What's broken: A GM who wants to compare specific features across tiers must visually track horizontally across three columns — this is difficult on desktop and impossible on mobile. The ROI Calculator is introduced but not visible in this screenshot, meaning it's below the fold for this scroll position. A returning visitor has no way to jump directly to the ROI Calculator from the nav.
- Fix: Add `id="roi-calculator"` anchor to the ROI Calculator section and include it in the page's sticky nav or jump-link row. Add a horizontal comparison table (even a minimal one) below the three tier cards: a 4-column table (Feature | Signals | Signals+Actions | Full Suite) for the 8–10 most important features. This enables the head-to-head comparison GMs want.

---

## B2B Buyer Journey
**Grade: B-**
- What's working: The BOFU sequence here is correct: pricing cards → ROI Calculator → (presumably) final CTA/contact. A GM who has read the pricing, reviewed features, and isn't yet sure about cost has the ROI Calculator immediately available to quantify the return. This is exactly what a GM needs before taking a proposal to their Board.
- What's broken: The ROI Calculator subhead ("Adjust the sliders to see your club's exposure — and what Swoop recovers") is passive. It describes the tool mechanics, not what the GM will feel after using it. Also, "exposure" is a finance-department word — GMs think in terms of "lost memberships" or "money walking out the door."
- Fix: Replace "Adjust the sliders to see your club's exposure — and what Swoop recovers." with: "Tell us your membership size and dues. We'll show you what you're losing to member churn — and what Swoop puts back." This is active, GM-native language, and reframes the calculator as a rescue tool, not an analytics exercise.

---

## Copy/Voice
**Grade: C**
- What's working: The feature checklist items visible in the screenshot contain some strong copy: "Swoop drafts the callback + comp + shift" (middle tier), "Automated playbooks + agent-driven actions" (top tier), "Dedicated success manager" (top tier). These are functional and specific.
- What's broken: "Book the 30-minute walkthrough" appears on both the middle and top tier CTAs with identical wording. For a premium tier that costs $1,499/mo, "book a 30-minute walkthrough" undersells the relationship and the product. It suggests a generic demo, not a tailored enterprise evaluation. "Retention-prioritized waitlist routing" (middle tier) is product jargon — no GM has ever said this to themselves.
- Fix: Replace middle tier CTA copy with: "Book the 30-Minute Walkthrough →" (keep). Replace top tier CTA with: "Request a Member App Pilot →". Replace "Retention-prioritized waitlist routing" with: "Waitlist managed by AI — fills tee times with members most likely to stay." Replace "Save-attribution tracking" with: "See exactly which interventions saved which memberships."

---

## Technical Credibility
**Grade: C+**
- What's working: "GPS + on-property member behavior" (top tier) is a genuine technical differentiator — no other golf club retention platform currently offers GPS-level behavioral data from a member app. "Save-attribution tracking" (top tier) is technically meaningful — it implies causal attribution between an intervention and an outcome, not just correlation.
- What's broken: Both technical differentiators are buried as mid-list checklist items in a wall of feature bullets. A GM reading quickly will miss "GPS + on-property member behavior" entirely. These should be featured prominently, not alphabetically sorted into a list. "Push notification channel" (top tier) is also listed as a feature but there's no explanation of what this means for member communication.
- Fix: Pull GPS/location intelligence out of the checklist and add it as a callout box below the top tier description: "Only available in Signals + Actions + Member App: On-property GPS intelligence — see member location patterns that predict churn 4–6 weeks before it shows up in your CRM." Similarly, explain Save-attribution: "Attribution engine: When a member stays after an intervention, Swoop records it. Your board sees exactly what the platform saved."

---

## Top 3 Priority Fixes for This Section
1. Differentiate the top tier CTA from the middle tier — "Book the 30-minute walkthrough" on a $1,499/mo tier is a conversion miss; change to "Request a Member App Pilot →" to signal a consultative sale and higher-value conversation.
2. Add a testimonial between the pricing card CTAs and the ROI Calculator — the gap between "ready to click" and "still hesitating" is exactly where social proof belongs, and this section has none.
3. Replace "Adjust the sliders to see your club's exposure" with "Tell us your membership size and dues. We'll show you what you're losing to member churn — and what Swoop puts back." — the current subhead is passive and uses finance-department language; GMs need to feel the money walking out the door before they engage the calculator.
