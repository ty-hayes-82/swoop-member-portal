# FAQ Section — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | FAQ framing is correct but the question set is defensive rather than forward-selling |
| Design/Visual | B+ | Clean accordion layout, good whitespace, but expand icons (+/−) are small and low-contrast |
| CRO/Conversion | C+ | FAQ ends with no CTA — objections are answered but the buyer is not directed anywhere next |
| Trust/Credibility | B- | The Jonas/ClubEssential answer is strong; other closed questions may hide weak answers |
| Mobile UX | B | Accordion is inherently mobile-friendly but tap targets on closed items need verification |
| Navigation/UX | B | Five questions is the right length; order is logical (integration → replacement → setup → security → pilot) |
| B2B Buyer Journey | B- | Questions address mid-funnel objections well but miss the highest-stakes late-funnel question: cost |
| Copy/Voice | B | Answer to question 1 is conversational and specific; unopened questions cannot be evaluated |
| Technical Credibility | B+ | Naming Jonas and ClubEssential explicitly is the best technical credibility signal in the section |

## Messaging/Positioning
**Grade: B**
- What's working: The FAQ section title "Frequently asked questions" is direct. The order — starting with the Jonas/ClubEssential question — shows an understanding of what GMs actually ask first.
- What's broken: Four of five questions are closed (accordion collapsed), preventing evaluation. The visible question set is entirely defensive ("Does it replace my CRM?" "Is data secure?") — these handle blockers but don't advance a buyer who is already interested and wants to know what happens next.
- Fix: Add one forward-selling question to the set: "What does the first 30 days look like?" or "How soon will I see value?" This shifts the FAQ from a blocker-removal tool to a commitment-building one. Place it as question 2, immediately after the integration question.

## Design/Visual
**Grade: B+**
- What's working: Light background with strong typographic hierarchy on question text. The orange minus icon on the expanded answer is visible and on-brand. Generous line-height in the answer body makes it easy to read.
- What's broken: The + and − icons are approximately 16px and positioned at the right edge with minimal visual contrast against the white background. On a wide monitor the icon is 600px away from the question text — hard to parse as a single interactive unit.
- Fix: Increase icon size to 20px. Add `background: #f9fafb; border-radius: 50%; padding: 4px` behind the icon. Consider placing a full-width hover state (`background: #fafafa`) on each accordion item to make the entire row feel clickable.

## CRO/Conversion
**Grade: C+**
- What's working: Answering the Jonas/ClubEssential question prominently removes a common deal-blocker before the demo form.
- What's broken: The FAQ section ends — there is no CTA beneath it. A buyer who has read through all five answers and resolved their objections has no immediate next action. This is an exit point masquerading as a conversion opportunity.
- Fix: Add a CTA block directly below the FAQ accordion: "Still have questions? We'll answer them on a 10-minute call." with a secondary text link "Book a call →" and the primary CTA button "Book Your Demo". Keep it low-pressure — the FAQ buyer is informed, not emotional.

## Trust/Credibility
**Grade: B-**
- What's working: "No — Swoop reads Jonas and ClubEssential, it does not replace them. Your CRM keeps storing records. Swoop connects those records to your tee sheet and POS in real time so the GM sees a ranked member brief every morning, not just a complaint log after the fact." — this is the most credible, specific, technically grounded answer on the entire homepage.
- What's broken: The remaining four questions are collapsed so their answers cannot be evaluated. If the security answer ("Is my members' data secure?") is vague or refers to SOC2 compliance that doesn't yet exist, it will undo the trust built by question 1.
- Fix: Ensure the data security answer is specific: name the encryption standard (AES-256 at rest, TLS 1.3 in transit), name where data is hosted (e.g., "AWS US-East-1"), and state whether a BAA/DPA is available. Vague reassurance ("we take security seriously") is worse than no answer.

## Mobile UX
**Grade: B**
- What's working: Accordion components are inherently well-suited to mobile — they preserve vertical space and allow progressive disclosure.
- What's broken: The tap target for each accordion row needs to be at least 48px tall per WCAG 2.1 guidelines. Current visual spacing suggests rows may be approximately 40px, which is marginal for reliable tapping.
- Fix: Set `min-height: 56px` on each accordion trigger row. Ensure `padding: 16px 0` on the question text. The entire row (not just the + icon) should be the tap target — use `width: 100%` on the button element wrapping each question.

## Navigation/UX
**Grade: B**
- What's working: Five questions is the correct length for a B2B FAQ — long enough to be comprehensive, short enough to not overwhelm. The visible question order (integration → replacement → setup → security → pilot) follows a logical objection sequence.
- What's broken: "What does a founding-partner pilot actually look like?" is the last question — but it's arguably the most conversion-relevant. Buyers who have resolved their objections should hit this question earlier.
- Fix: Reorder: 1) Jonas/ClubEssential integration, 2) What does founding-partner pilot look like?, 3) How long does setup take?, 4) Do I need to replace software?, 5) Is data secure?. Move the most conversion-relevant question (pilot structure) to position 2.

## B2B Buyer Journey
**Grade: B-**
- What's working: The five questions collectively address the four primary late-funnel B2B objections: integration risk, switching cost, time-to-value, and data risk.
- What's broken: There is no question about cost. "How much does Swoop cost?" is the most Googled question for any SaaS product being evaluated. Its absence from the FAQ will not prevent buyers from asking — it just means they leave the page to find out, and never come back.
- Fix: Add: "What does Swoop cost?" Answer: "Founding partners pay $499/month, locked for life. Standard pricing after the founding cohort is $599–$899/month depending on club size. No setup fees. Cancel anytime in the first 90 days for a full refund."

## Copy/Voice
**Grade: B**
- What's working: The expanded answer uses "not just a complaint log after the fact" — this is authentic GM language and exactly the kind of specificity that makes copy feel written by someone who has talked to real customers.
- What's broken: The question "Do I need to replace my current software?" is negatively framed. Buyers don't ask questions in the negative — they ask "Will this work with what I already have?" The negative framing suggests defensiveness.
- Fix: Rephrase question 2 from "Do I need to replace my current software?" to "Does this work with Jonas and ClubEssential?" — this is more naturally how a GM phrases the concern, and it reinforces the integration story rather than the replacement fear.

## Technical Credibility
**Grade: B+**
- What's working: Naming Jonas and ClubEssential as specific systems Swoop reads (not replaces) is the most technically credible move on the homepage. It demonstrates the product team knows the actual software stack in a private club operation room.
- What's broken: "Swoop connects those records to your tee sheet and POS in real time" — "real time" is a strong technical claim. If the integration is actually a nightly sync, this is factually misleading and will surface as a defect in a demo.
- Fix: Replace "in real time" with the accurate sync description: "connects those records to your tee sheet and POS — syncing multiple times daily — so the GM sees a ranked member brief every morning." If it is truly real-time, add "(live API connection, not a nightly batch)" to make the technical distinction explicit and impressive.

## Top 3 Priority Fixes for This Section
1. Add a pricing FAQ entry — "What does Swoop cost?" with a specific founding-partner rate — because the absence of pricing information is the top reason B2B buyers leave a page without converting.
2. Add a CTA block below the FAQ accordion so that buyers who have resolved their objections have an immediate next action rather than hitting a dead end.
3. Verify and correct "real time" sync language in the Jonas/ClubEssential answer — if it is actually a daily batch sync, this claim will be exposed in every demo and damage trust at the highest-stakes moment of the sales process.
