# ROI Calculator — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Calculator headline is absent — no framing for why this number matters |
| Design/Visual | B+ | Two-panel layout is clean but left panel chart has no y-axis label |
| CRO/Conversion | C+ | No CTA anchored to the ROI result — the 13× number lands in a void |
| Trust/Credibility | C | "65% early-intervention retention rate" is unattributed and sounds made-up |
| Mobile UX | C | Two-panel side-by-side will stack awkwardly; sliders likely too small to tap |
| Navigation/UX | B- | Sliders are discoverable but no instructions — passive visitors won't interact |
| B2B Buyer Journey | B | ROI calc is the right mid-funnel tool but exits without a next step |
| Copy/Voice | C+ | "Dues Protected" label on chart is jargon; "Net revenue gain" buries the lead |
| Technical Credibility | C+ | Formula for $74,012 is opaque — buyers will distrust the math |

## Messaging/Positioning
**Grade: B**
- What's working: The two-column before/after framing (Exposure vs. With Swoop) is directionally correct for a GM audience.
- What's broken: There is no section headline. The calculator appears with zero context — the buyer doesn't know whether to trust the inputs or the methodology before they see the output.
- Fix: Add an H2 above the calculator: "See your club's numbers. Change the inputs — see exactly what Swoop returns." Then add a subhead: "Based on your member count, dues, and turnover rate."

## Design/Visual
**Grade: B+**
- What's working: Dark right panel creates strong contrast for the dollar figures; orange accent on key numbers draws the eye correctly.
- What's broken: The "Dues Protected" chart has no y-axis or dollar label — it reads as decoration, not data. The left panel's light beige background makes the slider labels low-contrast.
- Fix: Add a y-axis label "Members retained" to the chart. Increase slider label color from gray-400 to gray-700 (`color: #374151`). Add a dashed horizontal baseline to the chart at the starting value.

## CRO/Conversion
**Grade: C+**
- What's working: The 13× ROI figure is prominent and credible enough to be a conversion trigger.
- What's broken: After a buyer calculates their $74k gain there is no CTA. The section ends. The highest-intent moment on the page is wasted.
- Fix: Add a button directly below "13× return on investment": `<button class="cta-primary">Book a Demo With Your Numbers →</button>` with micro-copy: "We'll run this calculation against your actual Jonas/ClubEssential data in 10 minutes."

## Trust/Credibility
**Grade: C**
- What's working: Showing the Swoop Pro annual cost as a deduction ($5,988) is honest and builds trust by not hiding price.
- What's broken: "65% early-intervention retention rate" floats without a source. A GM will immediately ask: whose clubs, what period, what intervention type? Unattributed rates undermine the entire model.
- Fix: Replace "65% early-intervention retention rate" with "Based on Pinetree CC demo data (10 of 15 at-risk members retained)" and add a footnote: "* Retention rate varies by club size and intervention timing."

## Mobile UX
**Grade: C**
- What's working: Individual panels are compact enough to reflow vertically.
- What's broken: Range sliders are notoriously difficult to interact with on mobile — small touch targets, no haptic step feedback. At stacked width the right panel's dense dollar figures will feel cramped.
- Fix: On mobile (`max-width: 768px`), replace sliders with numeric input steppers (`<input type="number">`) with +/- buttons. Set `min-height: 48px` on all interactive elements. Stack panels vertically with 24px gap.

## Navigation/UX
**Grade: B-**
- What's working: Three sliders map logically to the three variables a GM thinks about.
- What's broken: No affordance communicates that the sliders are interactive — a first-time visitor scanning quickly will read this as a static graphic. No default animation or "try adjusting" prompt.
- Fix: Add a one-time subtle pulse animation on the first slider thumb on page scroll-into-view (`@keyframes pulse-thumb`). Add label above sliders: "Adjust to match your club:" in 12px uppercase orange.

## B2B Buyer Journey
**Grade: B**
- What's working: An ROI calculator is the correct MOFU (middle-of-funnel) asset for a skeptical GM evaluating a new line item.
- What's broken: The section has no path forward. After the buyer is convinced by the math, there is no next step — no demo link, no case study, no "see how we calculated this."
- Fix: Add a secondary link below the CTA button: "How we calculate early-intervention retention → [link to methodology footnote or case study]" to serve buyers who need to justify the purchase to their board.

## Copy/Voice
**Grade: C+**
- What's working: "Revenue recovered (10 members saved)" is concrete and outcome-framed.
- What's broken: "DUES PROTECTED" on the chart header is internal product jargon. "Net revenue gain" undersells — it sounds like an accounting line, not a club win. "13× return on investment" is correct but orphaned.
- Fix:
  - Chart title: change "DUES PROTECTED" → "Members retained over time"
  - Right panel headline: change "EXPOSURE" → "At Risk Today"
  - Bottom result: change "Net revenue gain" → "Your club keeps" in 14px gray, with "$74,012" in 28px bold white
  - Add tagline below result: "That's what early intervention is worth."

## Technical Credibility
**Grade: C+**
- What's working: Showing the Swoop cost subtraction is transparent and defensible.
- What's broken: The formula is invisible. A CFO-reviewing GM needs to understand: is this 65% rate applied to all 15 members? Is the $80k a linear interpolation? The black box will kill deals in finance reviews.
- Fix: Add a collapsible "How this is calculated" disclosure below the result panel: "At-risk revenue ($120k) × early-intervention retention rate (65%) = revenue recovered ($80k). Swoop Pro annual cost ($5,988) subtracted to show net gain. Rate based on founding-partner demo data."

## Top 3 Priority Fixes for This Section
1. Add a CTA button anchored to the 13× ROI result — this is the highest-intent moment on the page and currently has zero conversion path.
2. Source the 65% retention rate with specific attribution (Pinetree CC demo data) or remove it and replace with a range — unattributed statistics actively damage trust with analytical GMs.
3. Add "How this is calculated" disclosure — a one-line formula will survive board-level scrutiny and prevent the deal from dying in a finance review.
