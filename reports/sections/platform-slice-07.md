# Integrations Hero + Section Intro — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B- | Headline is clever but undersells the intelligence layer benefit |
| Design/Visual | B | Dark-to-light transition is clean; hub diagram is cut off at bottom |
| CRO/Conversion | D+ | No CTA anywhere in this section; pure education with no ask |
| Trust/Credibility | C | No named integrations visible yet; promise without proof at this scroll depth |
| Mobile UX | C- | Hub diagram will collapse to unreadable at mobile widths |
| Navigation/UX | B- | Section transition from hero to integrations is smooth but eyeline breaks |
| B2B Buyer Journey | C+ | Addresses "will it work with my systems?" but doesn't close the objection fast enough |
| Copy/Voice | B | Body copy is solid; overline label "INTEGRATIONS" is weak |
| Technical Credibility | C | "28 integrations across 10 categories" not yet visible; feature bullets appear but diagram is partial |

## Messaging/Positioning
**Grade: B-**
- What's working: "Your tools manage operations. Swoop connects them." is a clean, defensible positioning statement that frames Swoop as the intelligence layer, not a replacement.
- What's broken: The hero overline "ONE OPERATING VIEW" and the section overline "INTEGRATIONS" are two different frames arriving in quick succession. The GM reads two positioning statements in three seconds and neither anchors.
- Fix: Remove the "ONE OPERATING VIEW" overline from the hero entirely. Let "Every signal. Every system. One clubhouse of intelligence." stand alone. Change the section overline from "INTEGRATIONS" to "WORKS WITH YOUR STACK" — more benefit-forward for a skeptical buyer.

## Design/Visual
**Grade: B**
- What's working: Dark cinematic hero image with centered white headline creates high-contrast readability. Section transition to the darker panel is intentional and professionally executed.
- What's broken: The hub-and-spoke diagram at the bottom of the frame is cropped — the bottom nodes are cut off. This makes it look unfinished, not mysterious. The orange hub dot in the center lacks a label, so the visual metaphor requires mental work.
- Fix: Add `padding-bottom: 80px` to the diagram container to ensure all outer nodes are visible before the next section begins. Label the center hub node "SWOOP" in white, 10px, letter-spacing 0.1em.

## CRO/Conversion
**Grade: D+**
- What's working: The section creates clear awareness of the integration story, which is a known objection for B2B buyers.
- What's broken: There is no CTA in this section. A GM who is convinced by the integration argument has nowhere to go. The next logical step — "See all integrations" or "Book a demo" — is absent.
- Fix: Add a ghost/outline CTA button below the body paragraph: `<button>See all 28 integrations →</button>` styled in white outline. This keeps the dark aesthetic while giving a committed reader an action path.

## Trust/Credibility
**Grade: C**
- What's working: The body copy correctly names POS, tee sheet, and CRM as the source systems, which signals category fluency to a golf GM.
- What's broken: "28 integrations across 10 categories" is referenced in slice-08 but not yet visible here. This section makes a promise ("connects them") with no proof in the same viewport.
- Fix: Add a single proof line directly under the headline: `"28 integrations across 10 categories — including Lightspeed, Jonas, Club Prophet, and Northstar."` This surfaces the logos before the buyer has to scroll to find them.

## Mobile UX
**Grade: C-**
- What's working: The headline text is large enough to read on mobile. Two-word lines stack cleanly.
- What's broken: The hub-and-spoke diagram is an SVG/canvas layout that will collapse below ~480px. Spoke nodes arranged radially require horizontal space that mobile does not provide. No fallback layout is visible.
- Fix: Add a `@media (max-width: 640px)` rule that hides the hub diagram (`display: none`) and replaces it with a simple pill-badge list of 6 top integration names: `Lightspeed · Jonas · Northstar · Toast · ADP · HubSpot`.

## Navigation/UX
**Grade: B-**
- What's working: The section flows naturally from the hero into the integrations narrative. Visual weight decreases as you scroll, drawing the eye down.
- What's broken: The overline "INTEGRATIONS" uses the same amber/orange color as the brand accent. When this color appears on both navigation elements and section labels, it loses its urgency signal.
- Fix: Reserve the amber accent color for CTAs and key metrics only. Change section overline labels to white at 60% opacity (`rgba(255,255,255,0.6)`), uppercase, 11px, letter-spacing 0.12em.

## B2B Buyer Journey
**Grade: C+**
- What's working: The copy directly addresses the #1 integration objection: "will Swoop break what I already have?" The framing of Swoop as an additive intelligence layer (not a replacement) is strategically correct.
- What's broken: The buyer journey moment here is Consideration — the GM is asking "how does this fit?" The section answers the question intellectually but doesn't show the before/after operational impact. A GM needs to feel the relief, not just understand the architecture.
- Fix: Add a two-line "before/after" micro-statement below the body: `"Before: your F&B manager checks Toast. Your pro shop checks Lightspeed. Nobody sees the member. After: Swoop surfaces the full picture before the member arrives."`

## Copy/Voice
**Grade: B**
- What's working: "Your tools manage operations. Swoop connects them." is tight, confident, and positions Swoop without arrogance. The body paragraph is honest and specific.
- What's broken: The body copy buries the lead: "location-aware behavioral signals" appears in sentence three and is the most differentiated claim in the paragraph — it should be the hook, not the explanation.
- Fix: Rewrite body as: `"Most tools see transactions. Swoop sees behavior — location signals, cross-system patterns, and the gap between what members do and what your systems record. Then it tells you what to do about it."`

## Technical Credibility
**Grade: C**
- What's working: Mentioning "POS, tee sheet, or CRM" by category name demonstrates the vendor understands the golf club tech stack.
- What's broken: "Location-aware behavioral signals" is a technically impressive capability but is asserted without mechanism. A skeptical GM will read this as marketing language.
- Fix: Add a parenthetical: `"(via the Swoop member app — no hardware installation required)"` directly after the first mention of location signals. This converts a vague claim into a credible product fact.

## Top 3 Priority Fixes for This Section
1. Add a CTA button ("See all 28 integrations →") below the body paragraph — this section educates without converting.
2. Surface named integrations (Lightspeed, Jonas, Northstar, Toast) in the headline zone, not 300px further down the page.
3. Fix the hub diagram crop — add bottom padding so all nodes are visible, and label the center node "SWOOP".
