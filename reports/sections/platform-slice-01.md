# Platform Slice 01 (Risk Cards: Blind Spot / Follow-Up Gap / Experience Disconnect) — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Three failure modes are sharp and specific; "member risk blind spot" is the right framing |
| Design/Visual | B- | Card layout works; confidence badges add interest but feel cosmetically bolted on |
| CRO/Conversion | C | No CTA in this section — missed opportunity after a strong emotional hook |
| Trust/Credibility | B- | Named example (James Whitfield, Karen Wittman) adds specificity but reads as illustrative |
| Mobile UX | C | Three-column card layout will collapse but spacing and font size need verification |
| Navigation/UX | B | SEE IT / FIX IT / PROVE IT labels at bottom create navigation but are tiny and easy to miss |
| B2B Buyer Journey | B+ | Excellent pain agitation — specific enough that a GM will recognize their own club |
| Copy/Voice | B+ | "No alert fired because the CRM saw a reply, not the absence of action" is excellent |
| Technical Credibility | B | Confidence percentages (91%, 88%, 84%) are specific but unexplained — source needed |

---

## Messaging/Positioning
**Grade: B**
- What's working: Three distinct failure modes ("Member risk blind spot," "Complaint follow-up gap," "Demand vs. experience disconnect") cover the core anxieties of a club GM. Each card names the problem, shows an example, quantifies the stakes, and assigns a dollar value.
- What's broken: The three cards feel like they're positioned as "problems we found in other clubs" rather than "problems you probably have right now." The framing is slightly clinical — it reads like a case study catalogue rather than a mirror held up to the buyer.
- Fix: Add an eyebrow to the section: **"SEE IT: Real gaps from clubs like yours."** Change card titles to second-person: "Your member risk blind spot" / "Your complaint follow-up gap" / "Your demand vs. experience disconnect."

---

## Design/Visual
**Grade: B-**
- What's working: White cards on warm cream provide good separation. The orange confidence badges ("91% CONFIDENCE," "88% CONFIDENCE," "84% CONFIDENCE") add a data-science feel without overwhelming the layout. Dollar/metric callouts ($22K, $36K, 1-day) are well-sized.
- What's broken: All three cards have the same visual weight — there's no hierarchy signal that tells the buyer which risk is most common or most dangerous. The "WHY THIS SURFACED" section at the bottom of each card is small and feels like metadata, not a feature callout.
- Fix: Add a subtle "MOST COMMON" badge to the first card (Member risk blind spot) and "HIGHEST COST" badge to the third card ($36K dues + F&B leakage). This creates scanning hierarchy and directs attention.

---

## CRO/Conversion
**Grade: C**
- What's working: The dollar figures ($22K, $36K) create urgency that could directly motivate a demo booking.
- What's broken: There is no CTA at the bottom of this section. After seeing $36K in F&B leakage attributed to a "demand vs. experience disconnect," a motivated GM has nowhere to go except continue scrolling. This is a conversion leak.
- Fix: Add a CTA row beneath the three cards: **"Swoop surfaces these gaps automatically — every morning. [Book a 30-minute walkthrough →]"** Use the same orange button style.

---

## Trust/Credibility
**Grade: B-**
- What's working: Named member examples (James Whitfield in the complaint card) with specific timelines ("waited 42 minutes, filed a complaint, sat in 'Acknowledged' for 6 days") feel real and specific.
- What's broken: It's unclear whether these are real cases or illustrative examples. If they're real (anonymized), say so. If they're composites, a skeptical buyer knows it. The confidence percentages (91%, 88%, 84%) need a footnote explaining methodology.
- Fix: Add a sub-caption beneath the card section: **"Examples drawn from real Swoop deployments. Member names changed."** For confidence scores, add a tooltip or footnote: **"Confidence score = Swoop's signal-weighted prediction accuracy across 90-day rolling cohorts."**

---

## Mobile UX
**Grade: C**
- What's working: Cards are content-complete — each one tells a full story independently, so stacking on mobile doesn't lose narrative.
- What's broken: Three-column layout at desktop will stack to single-column on mobile, making this a very long scroll. The "WHY THIS SURFACED" labels and the small metric callouts at card bottoms may be too small on a 390px screen.
- Fix: On mobile, change card layout to a horizontal scroll carousel with 3 snapping positions (one per card). This preserves the three-up comparison feel without requiring the user to scroll past three full cards. Alternatively, accordion the cards: show the headline + metric, expand on tap.

---

## Navigation/UX
**Grade: B**
- What's working: The "FIX IT" and "PROVE IT" labels visible at the section bottom suggest a three-act navigation structure (SEE IT / FIX IT / PROVE IT). This is smart B2B narrative architecture.
- What's broken: These section labels are rendered in tiny orange text and are easy to miss. They appear to be footer-of-section labels rather than prominent navigation anchors. A first-time visitor won't understand the structure.
- Fix: Make SEE IT / FIX IT / PROVE IT a sticky progress bar at the top of the page (or a prominent section divider) so buyers understand they're moving through a deliberate story. Each label should be clickable and anchor to its section.

---

## B2B Buyer Journey
**Grade: B+**
- What's working: This section is doing excellent buyer-journey work. It names specific problems, assigns dollar values, shows a real (or realistic) member scenario, and creates recognition. A GM reading "91% resignations tied to poor F&B experience" will think about their own F&B complaints immediately.
- What's broken: The section title/eyebrow isn't visible in the screenshot — it's not clear how the buyer gets oriented into "these are the three risks Swoop catches." The narrative bridge from the "flying blind" section to these three specific risk cards needs to be explicit.
- Fix: Add a section headline above the three cards: **"Here's what flying blind costs you — three times a week."** Then the three cards land as evidence, not just examples.

---

## Copy/Voice
**Grade: B+**
- What's working: "No alert fired because the CRM saw a reply, not the absence of action" is exceptional copy — technically precise, emotionally resonant, and specific to how CRMs actually fail. "$36K dues + F&B leakage" is a strong frame.
- What's broken: The third card's description ("FIFO waitlists keep healthy members happy while at-risk members walk away. Wind advisory shifts bookings indoors, but staffing and F&B prep stay blind") is slightly dense and uses operational jargon ("FIFO") that not every GM will parse instantly.
- Fix: Replace "FIFO waitlists" with: **"First-come waitlists fill tee times with the wrong members — healthy bookings, not at-risk ones. Wind advisories push play indoors, but staffing and F&B never adjust."**

---

## Technical Credibility
**Grade: B**
- What's working: The "WHY THIS SURFACED" sub-section naming data sources ("CRM sees complaints. Tee sheet sees no-shows. POS sees declining spend.") demonstrates multi-system signal awareness. Confidence percentages feel like real ML outputs.
- What's broken: The confidence percentages appear without methodology. Are these precision? Recall? Accuracy? A technically sophisticated buyer (or their IT manager) will ask. Also, "1-day WARNING MISSED" as a metric for the first card is ambiguous — 1 day before what?
- Fix: Add a one-line methodology note beneath the confidence badges: **"Confidence = 90-day rolling signal accuracy across tee sheet, CRM, and POS inputs."** Change "1-day WARNING MISSED" to: **"1-day early-warning window — missed."**

---

## Top 3 Priority Fixes for This Section
1. Add a CTA beneath the three cards — the dollar figures ($22K, $36K) are strong enough to convert motivated buyers but there's nowhere to go. "Swoop surfaces these gaps automatically. [Book a walkthrough →]" is the fix.
2. Add a section headline above the cards to bridge from the "flying blind" section: "Here's what flying blind costs you — three times a week." Without it, the cards appear without narrative context.
3. Add a methodology footnote to the confidence percentages and a clarifying note that examples are "drawn from real Swoop deployments" — two changes that cost one line of copy each but dramatically increase credibility.
