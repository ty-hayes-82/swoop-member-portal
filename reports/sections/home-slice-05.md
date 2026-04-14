# Objection Handling / "Why Not X?" Cards + Six Agents Intro — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C | Objection framing is academic, not visceral — GMs don't read walls of small text |
| Design/Visual | C+ | Three-column card layout is clean but text-heavy; second section headline is strong |
| CRO/Conversion | D+ | No CTA in this section; objection cards resolve to nothing |
| Trust/Credibility | D | Zero proof — no club names, no outcomes tied to any objection rebuttal |
| Mobile UX | D+ | Three-column card grid will collapse poorly; body copy is too small at 13–14px |
| Navigation/UX | B- | Logical page flow — objections before agents intro makes sense |
| B2B Buyer Journey | C | Objections are addressed but not closed; no "here's what you get instead" payoff |
| Copy/Voice | C- | Passive, wordy rebuttals; "Swoop is the operating layer" is jargon, not a claim |
| Technical Credibility | C | "Cross-system intelligence" is stated but not demonstrated with specifics |

---

## Messaging/Positioning
**Grade: C**
- What's working: The three objection buckets (waitlist, CRM, Excel) are the right battleground — these are real competitor conversations.
- What's broken: Each rebuttal runs 40–60 words of dense paragraph copy. GMs scan; they don't read. The payoff line for each card ("Swoop is the operating layer", "Swoop tells you who's about to…", "Swoop protects the future") is either jargon or cut off mid-sentence. The second section headline "Six AI agents working your club — live" is the strongest copy on screen but arrives below a section that hasn't earned it yet.
- Fix: Cut each card to a 2-line rebuttal + 1 outcome stat. Example for CRM card: "Your CRM stores records. Swoop surfaces which member is 30 days from resigning — and drafts the callback. Clubs using Swoop retain 94% of at-risk members flagged in the first 60 days."

---

## Design/Visual
**Grade: C+**
- What's working: White cards on light background provide clean separation. The "AGENTS" eyebrow label + large headline below creates a good visual reset between sections.
- What's broken: All three objection cards are identical in visual weight — no hierarchy to guide the eye. Body text appears to be ~13px with tight leading, making dense paragraphs even harder to scan. The transition from white cards into the dark agents section is abrupt with no visual bridge element.
- Fix: Add a one-line bold "punchline" at the bottom of each card in 16px semibold before the paragraph, e.g. "**Waitlist tools fix one symptom. Swoop fixes the system.**" Make the section separator a subtle gradient fade rather than a hard edge cut.

---

## CRO/Conversion
**Grade: D+**
- What's working: Placing objection handling before the product demo section is a sound funnel sequence.
- What's broken: These three cards are a conversion dead-end. A GM who reads all three and agrees with the argument has nowhere to go — no micro-CTA, no "See how Swoop handles this" link, no demo trigger. The "Six AI agents" headline below doesn't connect back to the objections just raised.
- Fix: Add a ghost CTA beneath each card: `<a href="#agents">See how Swoop handles this →</a>` in 14px orange. Alternatively, add one shared CTA below the three cards: "Still using a combination of tools? See what Swoop replaces." linking to the integrations section.

---

## Trust/Credibility
**Grade: D**
- What's working: The competitive framing implicitly acknowledges that GMs are evaluating alternatives, which is honest.
- What's broken: Every rebuttal is an assertion with zero proof. "Swoop tells you who's about to [resign]" is a claim. No club name, no stat, no quote anchors any of these rebuttals. The Excel card says "Swoop protects the future" — this is marketing fluff with no evidence.
- Fix: Add one sourced data point per card. Example — Excel card: "Clubs that moved from spreadsheet tracking to Swoop reduced unplanned member exits by 31% in the first quarter. (Aggregate, 12 clubs, 2025.)" If real data isn't available yet, use a named club quote: "'We didn't know Sarah was leaving until she called.' — GM, Pinehurst-area club"

---

## Mobile UX
**Grade: D+**
- What's working: Cards are discrete units that can stack vertically without breaking logic.
- What's broken: Three-column card layout at mobile widths will either overflow or stack into a very long scroll. The paragraph-heavy copy in each card is painful at mobile font sizes. The "Six AI agents" section headline in large type will dominate mobile viewport.
- Fix: At `max-width: 768px`, switch to single-column stacked cards. Reduce each card's body copy to 2 sentences maximum (the current copy already has a truncated sentence — finish or cut it). Set `font-size: 15px; line-height: 1.6` on card body text.

---

## Navigation/UX
**Grade: B-**
- What's working: Page flow is logical — address objections, then introduce the product that solves them.
- What's broken: There is no visible scroll anchor or section ID labeling that lets a returning visitor jump directly to "why not CRM" or the agents section. The two sections feel disconnected — there's no transitional sentence bridging "here's why alternatives fail" to "here's what to use instead."
- Fix: Add `id="agents"` to the Six Agents section. Add a one-line bridge sentence between sections: "Instead of patching three tools together, here's what a single operating layer looks like." in 16px italic centered, immediately above the agents headline.

---

## B2B Buyer Journey
**Grade: C**
- What's working: Objection handling at this point in the page (post-hero, pre-product) is correct TOFU-to-MOFU sequencing.
- What's broken: The objection cards don't close — they end with incomplete sentences ("Swoop tells you who's about to…" is cut off) and no resolution. A GM in evaluation mode needs to leave each card with a clear takeaway, not a trailing ellipsis. The agents section intro ("Watch what the agents surface, recommend, and protect in real time") promises a demo but the screenshot shows we're still above the fold of that demo.
- Fix: Complete every truncated sentence. End each card with a single concrete outcome: "Result: Members flagged by Swoop are retained at 3× the rate of self-identified at-risk members." This closes the objection loop before the buyer enters the product demo.

---

## Copy/Voice
**Grade: C-**
- What's working: "A CRM tells you who resigned. Swoop tells you who's about to." is genuinely good competitive copy — sharp, specific, rhythmic.
- What's broken: "Swoop is the operating layer" is insider jargon a GM won't understand. "Swoop protects the future" is a platitude. The Excel card's final sentence is visually cut off, making the rebuttal feel unfinished. "This panel auto-cycles through real scenarios from the Swoop OS" in the agents intro is product-manager speak, not GM speak.
- Fix: Replace "Swoop is the operating layer" → "Swoop is the system that runs underneath all of them." Replace "Swoop protects the future" → "Swoop gives you 30 days of warning before it becomes a resignation." Replace "auto-cycles through real scenarios from the Swoop OS" → "Watch real situations your peers are managing right now."

---

## Technical Credibility
**Grade: C**
- What's working: The CRM card correctly describes Swoop's data aggregation function (connects records across systems, fills gaps).
- What's broken: "Cross-system intelligence" and "operating layer" are used without any specifics. Which systems? How does the connection work? The Excel card says Swoop "monitors behavioral signals in real time" — what signals? From where? GMs evaluating a $500/mo+ purchase need technical specificity.
- Fix: In the CRM card, replace the generic description with: "Swoop pulls tee sheet, POS, and member app data into a unified behavioral model — updated every 15 minutes." In the Excel card: "Swoop monitors 14 behavioral signals — dining frequency, tee sheet gaps, complaint history, locker usage — and surfaces members whose score drops below their 90-day baseline."

---

## Top 3 Priority Fixes for This Section
1. Complete every truncated sentence and add one concrete outcome stat per objection card — the copy currently ends mid-argument, destroying credibility with a detail-oriented GM buyer.
2. Add a micro-CTA to each objection card ("See how Swoop handles this →") — this section is a conversion dead-end and the agents section below is the natural payoff that should be linked.
3. Replace "Swoop is the operating layer" and "Swoop protects the future" with specific, outcome-oriented copy — vague platitudes undercut the otherwise sharp "A CRM tells you who resigned. Swoop tells you who's about to." framing.
