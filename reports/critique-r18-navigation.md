# Swoop Marketing Site — Navigation & UX Audit (r18)
**Reviewer:** UX/IA Expert  
**Date:** 2026-04-14  
**Scope:** Navigation completeness, wayfinding, scroll-depth signaling, section transitions, back-navigation, dead ends, info hierarchy, progressive disclosure

---

## Grading Key
- **A** — Exemplary, industry-leading execution
- **B** — Solid with minor gaps
- **C** — Functional but leaves real conversion on the table
- **D** — Broken or confusing; visitors will bail
- **F** — Absent or actively harmful

---

## HOME PAGE

---

### home-hero.png / home-slice-00.png
**Grade: B**

**Strengths:**
- Clear primary CTA ("Book the 30-minute walkthrough") and a lower-commitment secondary ("See it in action →") — correct hierarchy.
- Three micro-trust chips below the CTAs ("Live in under 2 weeks · No rip-and-replace · 28 integrations") reduce anxiety without cluttering the hero.

**Problems:**
- The nav only shows **Platform | Agents | Pricing** — no "About" link, no "Contact" link. A B2B buyer at the top of funnel who wants to vet the team hits a dead end unless they scroll the entire page or guess a URL.
- "Agents" is used in the nav but the home page hero copy talks about "four systems." There is a mismatch between the nav label and any concept on this page — the visitor cannot anticipate what "Agents" means before clicking.
- No scroll-depth signal (no progress bar, no section indicator, no chevron). The page is very long; the hero gives zero indication there is content below.
- The logo is not hyperlinked visually differentiated as a home affordance — minor but cumulative with nav incompleteness.

**Fix:**
1. Add "About" to the home-page nav (not just the interior pages). The nav should be globally consistent across all pages.
2. Rename "Agents" to "How It Works" or "AI Agents" so the label is self-describing.
3. Add a subtle scroll chevron or animated arrow below the hero CTAs to cue continuation.

---

### home-slice-01.png — "Most clubs are flying blind" (Pain amplification + 3 blind-spot cards)
**Grade: B**

**Strengths:**
- The four trust chips at the top of this section (Founding partner program, 300-member Pinetree CC, 28 integrations, Live in under 2 weeks) act as a persistent trust bar — well placed immediately post-hero.
- Pain framing ("Flying blind") is visceral and clearly directed at club GMs.

**Problems:**
- The three problem cards ("Member risk blind spot," "Complaint follow-up gap," "Demand vs. experience disconnect") each include confidence percentages (91%, 68%, 44%) in tiny orange labels with no explanation. The visitor has no idea what "91% CONFIDENCE" refers to — is it a model confidence score? A survey result? This creates confusion and erodes trust rather than building it.
- Section transition from the trust bar to "Most clubs are flying blind" is abrupt — no visual spacer, label, or micro-heading to signal the narrative shift from "who we are" to "what the problem is."
- No CTA anchor in this section. A buyer who is already sold by the trust bar has nowhere to click.

**Fix:**
1. Add a one-line tooltip or sub-label below each confidence badge: "Signal detection confidence based on 12 months of cross-system data."
2. Add a secondary CTA at the bottom of this section, even a ghost button: "See how Swoop surfaces these signals →" linking to Platform.
3. Add an "IN THE PROBLEM" section label (orange eyebrow text) to maintain narrative orientation.

---

### home-slice-02.png / home-slice-03.png — Problem card continuations + "Five core capabilities"
**Grade: C**

**Strengths:**
- Carrying the same card UI from the blind-spot section into specific dollar/day metrics (1-day warning missed, $22K annual dues at risk, $36K dues + F&B leakage) makes the abstract concrete.

**Problems:**
- The "$22K" and "$36K" numbers appear mid-page with no source attribution visible at this zoom level. They read as marketing assertions, not proof — which is the opposite of the "Prove It" positioning.
- The transition from problem cards into "Five core capabilities. One operating view." is purely narrative — there is no visual divider, no section anchor, no sticky progress cue. A visitor scanning quickly cannot identify where the problem section ends and the solution section begins.
- The capability cards (Member Intelligence, Tee Sheet & Demand, F&B Operations, Staffing & Labor, Revenue & Pipeline) are presented as a flat grid with no clickable affordance. Each card has a "Ranks every member by retention value ›" link that is the only interactive element — but the "›" is so small it does not read as a navigable link.
- No in-page anchor nav for a long capabilities section. Five capabilities scroll over two screenfuls with no positional map.

**Fix:**
1. Add a named section anchor: `id="platform-capabilities"` and surface an in-page jump menu ("Jump to: Member Intelligence | Tee Sheet | F&B | Staffing | Revenue") above the five-card grid.
2. Make each capability card title a proper link to its dedicated section on the Platform page (anchor deep-links).
3. Add a thin horizontal rule or background color shift to visually separate the "Problem" from "Solution" narrative zones.
4. Source the dollar figures: add "Based on Pinetree CC demo data" as a footnote.

---

### home-slice-04.png — "Built to replace patchwork ops" (Comparison table)
**Grade: B**

**Strengths:**
- The comparison table (Swoop vs. Waitlist Tools vs. Your CRM vs. Spreadsheets) is the strongest competitive differentiator asset on the site. Feature-by-feature checkmarks are readable and scannable.
- The "COMPARE" eyebrow label correctly orients the visitor.

**Problems:**
- The table has no CTA below it — it ends and the page continues into "Why not just..." cards with no conversion moment. This is a wasted high-intent location.
- The table header row is very light ("FEATURE," "Swoop," "Waitlist Tools," "Your CRM," "Spreadsheets") — at small screens or quick scroll speeds, visitors won't register what columns they're comparing.
- The "Why not just..." section immediately follows with no visual separator, causing the objection-handling content to blend into the comparison content instead of standing as a distinct rebuttal section.

**Fix:**
1. Place a CTA immediately below the comparison table: "See how Swoop connects the dots → Book Demo."
2. Add a background color change (light beige → white) between the comparison table and the "Why not just..." objection section.
3. Bold or increase size of the column headers in the comparison table.

---

### home-slice-05.png — "Why not just..." (Objection handling cards)
**Grade: C**

**Strengths:**
- Three targeted objections (standalone waitlist, CRM reports, Excel dashboards) directly address the competitive displacement anxiety of a club GM considering Swoop.

**Problems:**
- These three objection cards are orphaned — no CTA after them. The visitor reads three persuasive arguments and then... scrolls into the AI Agents section with no moment to act.
- The section has no eyebrow label or heading above the three cards (it begins with "Why not just use a standalone waitlist tool?"). Without a section header, the visitor arriving at this point mid-scroll has no orientation signal.
- Text density is high. These are 80–100 word paragraphs in small type. On mobile they will be brutal to parse.

**Fix:**
1. Add an eyebrow "OBJECTIONS" or "WHY SWOOP" and a summary h2: "We've heard every objection. Here's the truth."
2. Add a CTA after this section: "Still have questions? Read the FAQ ↓" or an anchor to the FAQ section.
3. Reduce paragraph length to 40-50 words max per card. Cut to the sharpest sentence.

---

### home-slice-06.png / home-slice-07.png — "Six AI agents working your club — live" (Agents panel)
**Grade: B**

**Strengths:**
- The live-demo panel UI (dark OS-style interface with activity feed and agent detail) is the most visually differentiated element on the site — it communicates "real software, not a brochure."
- The six agent tiles below (Member Pulse, Demand Optimizer, Service Recovery, Labor Optimizer, Revenue Analyst, Engagement Autopilot) give the buyer a clear mental model of scope.

**Problems:**
- The "AGENTS" eyebrow and "Six AI agents working your club — live" h2 are present but there is no explanation of what "agents" means in one sentence before the demo panel. For a club GM who has never heard of AI agents, the word is jargon.
- The dark demo panel has breadcrumb-style navigation at the top right: "swoop.io / agents / stream" — this reads like an internal product nav, not a marketing site element. It adds confusion.
- The panel auto-cycles but there is no visible pagination indicator during the transition from one agent scenario to another. Visitors do not know the panel is interactive or how many scenarios exist.
- No CTA after the six-agent tile grid. High-intent section with no exit ramp.

**Fix:**
1. Add a one-sentence plain-English definition above the panel: "Agents are background workers that monitor your data 24/7, recommend actions, and draft communications — so your team acts instead of reacts."
2. Remove the "swoop.io / agents / stream" breadcrumb from the marketing panel — it creates false UI context.
3. Add visible dot-pagination below the auto-cycling panel and a "Pause / Play" affordance.
4. Add a CTA: "See all six agents on the Platform page →" or "Book a live demo of the agents in action."

---

### home-slice-08.png / home-slice-09.png — "Your tools manage operations. Swoop connects them." (Integrations)
**Grade: C**

**Strengths:**
- Hub-and-spoke diagram visually conveys the integration layer concept instantly — good for visitors scanning at speed.
- The 28-integrations-across-10-categories grid names real systems (Jonas, ClubEssential, Toast, Square, ADP, QuickBooks, HubSpot) which is strong specificity.

**Problems:**
- The section arrives after two consecutive dark-background sections (Agents panel, "Every signal. Every system.") creating visual monotony. Contrast fatigue sets in; the important integration content gets less attention than it deserves.
- "Rollout timeline: Typical launch: 10 business days. No operational downtime." is buried at the bottom of this dark section — this is the most objection-killing implementation claim on the site and it receives almost no visual weight.
- No CTA in the Integrations section. There is no "See all integrations" link, no "Book a 30-minute technical review" link. The buyer who is evaluating feasibility (does it connect to my Jonas system?) has no next step.
- The transition from the dark background section to the next white section (Pricing) is handled purely by background color switch — no visual separator or section divider cue.

**Fix:**
1. Give "10 business days" a dedicated callout card or pull-quote treatment with a supporting line: "Most clubs are fully connected within two weeks — zero downtime."
2. Add a CTA: "See the full integration library →" (link to Platform page #integrations anchor).
3. Reduce consecutive dark sections. Either move the Integrations section to a light background or insert a light-background transition section between Agents and Integrations.

---

### home-slice-09.png (continued) / home-slice-10.png — "Simple pricing. No long-term contracts." (Pricing preview)
**Grade: C**

**Strengths:**
- Showing the three pricing tiers on the home page ($0/mo Signals, $499/mo Signals + Actions, $1,499/mo full) de-risks the buyer's journey — they can qualify themselves before booking a demo.
- "Start on Signals (free)" as a Tier 1 CTA dramatically lowers the barrier to entry.

**Problems:**
- This section header ("Simple pricing. No long-term contracts.") arrives without an eyebrow label or "PRICING" identifier. A visitor navigating by h2 headings cannot quickly identify this as the pricing section without reading the dollar amounts.
- The "MOST POPULAR" badge on the middle tier is correctly placed, but the tier-3 CTA ("Book the 30-minute walkthrough") is the same text as tier-2. The two highest tiers are identically CTAed — a buyer who wants tier-3 cannot differentiate the next step.
- The pricing section on the home page has no link to the full Pricing page. A serious buyer who wants to see the Pricing FAQ or the ROI calculator has no path forward except navigating the main nav.
- The home page pricing preview and the dedicated Pricing page duplicate content heavily — this creates confusion about which is authoritative.

**Fix:**
1. Add "PRICING" eyebrow label above the section header.
2. Add a "View full pricing details →" link below the three-tier display pointing to /pricing.
3. Differentiate tier-3 CTA: "Talk to sales about the Member App →" or "Request Enterprise Access →."

---

### home-slice-11.png — ROI Calculator
**Grade: A-**

**Strengths:**
- The ROI calculator (sliders for Total Members, Avg Annual Dues, Annual Turnover Rate → computed Dues Protected curve, net revenue gain, 13x ROI) is the highest-intent interactive element on the site. It speaks directly to board-level buyers.
- Real-time output with a specific net revenue gain figure ($74,012) and cost comparison (-$5,988) makes the value calculation instantaneous.

**Problems:**
- No CTA is visible immediately after the calculator output. A buyer who just saw "13x return on investment" and "$74,012 net revenue gain" needs an immediate "Book a Demo" button in that dopamine moment — not after scrolling.
- The calculator is labeled "ROI CALCULATOR" in the eyebrow but the h2 is "What is member turnover costing your club?" — this is slightly off from the value message. The question frames loss, not gain. After the calculation, the section should reframe around gain.

**Fix:**
1. Place a CTA directly inside or immediately below the calculator output card: "Your club could recover $74K+. Let's show you how. → Book Demo."
2. After calculation runs, dynamically update the CTA copy to include the calculated figure.

---

### home-slice-12.png — "Intelligence in action: live demo results" (Proof metrics)
**Grade: B**

**Strengths:**
- The four proof metrics (6 days early warning, 91% fill rate, $312 revenue per slot, $1.38M dues at risk visibility) are specific, data-sourced, and labeled with context. This is the "Prove It" pillar executing well.
- The "Metrics from the Pinetree CC demo environment" attribution is present and correct.

**Problems:**
- Immediately below the four metrics, the "FOUNDING PARTNER PROGRAM" section begins without a clear visual break. The transition from proof data into a sales pitch for the founding partner program feels manipulative if the visitor notices the seam — it can undermine the credibility of the data above.
- No internal link from the proof section to a case study, demo video, or more detailed evidence page. The metrics are assertions without a "Read the full story →" path.

**Fix:**
1. Insert a visual separator (color background shift or thin rule) between the proof metrics and the Founding Partner CTA.
2. Add "Read the Pinetree CC story →" or "See the full demo data →" link below the metrics block.

---

### home-slice-13.png — "Be one of our first ten clubs" (Founding Partner CTA)
**Grade: B**

**Strengths:**
- The three-column value prop (Hands-on Onboarding, Shape the Roadmap, Locked-in Pricing) clearly articulates what the founding partner gets — not just emotional urgency but practical benefits.
- "Apply for Founding Partner" CTA button is prominent and correctly scoped.

**Problems:**
- "Be one of our first ten clubs" is a FOMO tactic that works better earlier in the page — by this far down the home page (~section 13 of 17), only the most engaged visitors remain. The founding partner offer deserves higher placement, perhaps directly after the proof section.
- The section has no "What happens after I apply?" micro-explanation. The visitor is asked to apply with no indication of what the next step looks like — increases friction.

**Fix:**
1. Move the Founding Partner section higher on the home page — directly after the "Intelligence in action" proof metrics.
2. Add a one-line process note: "Apply → 30-min call → tailored pilot plan in 48 hours."

---

### home-slice-14.png — "Built with the GMs who live it" (Testimonials)
**Grade: C**

**Strengths:**
- Three testimonials cover three distinct value areas (member retention, waitlist fill rate, board reporting) — good coverage of buyer personas.
- Testimonial attribution includes role, club size, and founding partner status — the specificity is credible.

**Problems:**
- All three testimonials are marked "(pending)" for name attribution. The site explicitly notes "Attributed quotes publish Q2 2026." Running testimonials with pending attribution actively signals that Swoop does not yet have published permission from its customers — this is a credibility red flag for a B2B buyer doing diligence.
- There is no way for a visitor to interact with these testimonials — no "Read the full story," no club profile link, no next-step CTA.
- The testimonials section is placed after the Founding Partner CTA, meaning they are sequentially out of order from a persuasion standpoint: proof should precede the CTA, not follow it.

**Fix:**
1. Either obtain published permission before launch or replace with a "Case study coming Q2 2026 — join the pilot to be featured" placeholder that is honest about the state.
2. Reorder: Proof metrics → Testimonials → Founding Partner CTA (not: metrics → CTA → testimonials).
3. Add a "Meet the clubs Swoop is working with →" link or an About page anchor.

---

### home-slice-15.png — FAQ
**Grade: B**

**Strengths:**
- The five FAQ questions directly address the objections a B2B buyer will have (Jonas/ClubEssential replacement, software switching, setup time, data security, founding partner pilot). The question selection is tight and relevant.
- Accordion expand/collapse UX is standard and functional.

**Problems:**
- Only the first question ("We already have Jonas and ClubEssential. Does Swoop replace them?") is expanded in the screenshot. The other four are collapsed with no preview text. First-time visitors do not know the quality of what's inside — they may not bother expanding.
- There is no "More questions? Ask us →" or "Talk to a human" link after the FAQ. A high-intent visitor who did not find their answer has no escape route except the main nav.
- The FAQ section's "FAQ" eyebrow label uses the abbreviation rather than "Frequently asked questions" — the h2 renders the full phrase, but the eyebrow inconsistency is minor visual slop.

**Fix:**
1. Show one or two sentences of preview text for each collapsed FAQ item (visible before expand).
2. Add a post-FAQ CTA: "Didn't find your answer? Email us at demo@swoopgolf.com or book a call."
3. Standardize eyebrow: either all abbreviations or all spelled-out, not mixed across sections.

---

### home-slice-16.png — Bottom Demo CTA + Footer
**Grade: D**

**Strengths:**
- The bottom demo form (Name, Club, Email, Phone + "Book Your Demo" button) is a logical conversion endpoint for a long-scroll page.
- "Or email us at demo@swoopgolf.com / +1(801) 225-5102" provides an alternative contact path — good for the phone-first buyer.

**Problems:**
- **The footer is almost entirely empty.** It contains only "Swoop / Integrated Intelligence for Private Clubs" on the left and "Investor Information | © 2024 Swoop Golf" on the right. There are no footer navigation links whatsoever — no links to Platform, Pricing, About, Privacy Policy, or Terms of Service.
- "© 2024 Swoop Golf" is outdated — the current year is 2026. This is an active trust signal failure for any buyer doing diligence.
- The bottom demo section is the only contact context for the form — but the form's dark background (appearing to be an image behind it) makes the form fields visually hard to parse if the background image has poor contrast.
- There is no "Thank you / success" state visible, nor is there indication of what happens after the form is submitted.
- "No credit card required · 30-minute walkthrough · Cancel anytime" trust chips below the button are appropriate but are displayed in very small grey text on a dark background — likely fails contrast accessibility.

**Fix:**
1. Build a real footer with nav columns: Product (Platform, Pricing, Agents), Company (About, Contact, Blog), Legal (Privacy Policy, Terms of Service), Contact info.
2. Fix the copyright year to 2026.
3. Add form confirmation copy: "After you submit: You'll receive a calendar link within 1 business day."
4. Fix contrast on the trust chips below the CTA button.

---

### home-mobile-full.png — Mobile Full Page
**Grade: D**

**Strengths:**
- The content sequence is mostly preserved from desktop — the narrative arc (hero → pain → solution → agents → integrations → pricing → proof) is readable.

**Problems:**
- **The mobile nav is not visible in any section below the hero.** There is no hamburger menu, no sticky nav, no back-to-top affordance. On a page this long (~17 sections), the visitor is completely untethered after the first scroll.
- Section transitions on mobile are rougher — the dark-on-dark agent panel section and the dark integrations section run together without sufficient visual break. The contrast between sections is lost at mobile width.
- The ROI calculator sliders will be extremely difficult to interact with on a touch screen at this zoom level — the slider tracks appear as thin lines (~4px) that would be nearly impossible to grab with a finger.
- The comparison table becomes unscrollable horizontally without explicit horizontal scroll affordance — the four-column table almost certainly collapses into a broken layout on 375px-wide screens.
- No mobile-specific CTA shortcuts. The mobile visitor who knows what they want has to scroll the entire page to find the form.

**Fix:**
1. Implement a sticky mobile header with hamburger menu visible throughout scroll.
2. Add a floating "Book a Demo" button (bottom-right FAB or bottom bar) for mobile.
3. Rebuild the ROI calculator sliders with 44px touch targets per Apple HIG.
4. Convert the comparison table to a mobile-friendly stacked card format or horizontal scroll with an explicit "Scroll →" caret.

---

## PLATFORM PAGE

---

### platform-hero.png / platform-slice-00.png
**Grade: B**

**Strengths:**
- Platform page nav correctly shows "Home" (resolving the missing back-path gap from the home page nav). The active "Platform" nav item is highlighted orange — good wayfinding.
- Single CTA hero ("Book the 30-minute walkthrough") is focused, no choice paralysis.

**Problems:**
- The platform hero headline ("Every signal. One operating view.") is excellent but the sub-headline ("Five AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue into a single intelligence layer — delivered before 6:15 AM") mentions "five lenses" but the page below focuses on "five capabilities" and then "six AI agents." The terminology is inconsistent — lenses vs. capabilities vs. agents. A buyer tracks these labels and the mismatch creates a trust friction.
- No scroll-depth signal or section navigation below the hero.
- The hero has only one CTA — there is no lower-commitment path (no "Explore the platform" anchor link for buyers not ready to book).

**Fix:**
1. Align terminology globally: decide whether the platform consists of "capabilities," "lenses," or "modules" and use that single word consistently.
2. Add a secondary CTA: "Explore the platform ↓" anchoring to the first capability section.
3. Add a sticky in-page nav for the platform page with anchors: "Capabilities | Agents | Integrations | Compare."

---

### platform-slice-01.png / platform-slice-02.png — "Most clubs are flying blind" + "Fix It / Prove It" cards
**Grade: C**

**Strengths:**
- Reusing the three blind-spot cards (Member risk, Complaint follow-up gap, Demand vs. experience disconnect) with updated context is efficient.

**Problems:**
- **This section is a near-verbatim repeat of the home page "Most clubs are flying blind" section.** The Platform page visitor arrived here specifically to learn about the platform — not to re-read the problem statement they already absorbed on the home page. This is a significant IA error: the Platform page should begin with solution depth, not problem framing.
- The "FIX IT" and "PROVE IT" section eyebrow labels visible at the bottom of slice-02 appear to introduce new content, but these also appear to mirror home page sections. If the Platform page is duplicate content of the home page, visitors will feel deceived by the nav link.
- At small screen widths the confidence percentage badges (91%, 68%, 44%) clip against card edges.

**Fix:**
1. Remove the "Most clubs are flying blind" section entirely from the Platform page. Replace it with a platform-specific section: a module index with deep-dive capability tabs.
2. If problem framing is necessary, limit it to a single h2 and two sentences — do not repeat the full three-card treatment.
3. The Platform page should begin: nav → hero → capability deep dives → agent roster → integrations → compare table → CTA.

---

### platform-slice-02.png / platform-slice-03.png — "Fix It / Prove It" narrative + "Five core capabilities"
**Grade: C**

**Strengths:**
- The "Fix It" narrative ("The right action. The right person. Before the problem compounds.") + the dark terminal-style action card ("Trigger captain callback + meal-comp playbook / NPS +14") is the best copy on the site. The specific action card with projected outcome is viscerally convincing.
- The "Prove It" narrative ("Take a dollar number to the board. Not a feeling.") directly addresses the board-reporting anxiety of the club GM.

**Problems:**
- These two narrative panels (Fix It / Prove It) have no interactive affordance — they are static blocks. A visitor who wants to see more scenarios (not just NPS +14 / Karen Wittman) has no way to navigate to additional examples.
- The transition from the "Prove It" narrative into "Five core capabilities. One operating view." repeats the same section already used on the home page. On the Platform page, the capabilities grid needs to be deeper — not a repeat of the home page teaser.
- No CTA at the end of the Fix It / Prove It section before capabilities.

**Fix:**
1. Add interactive tabbing to the Fix It / Prove It panels: "See: Member Recovery | F&B Recovery | Staffing Recovery | Board Report."
2. On the Platform page, expand each capability card into a full featured section with screenshots, key workflows, and a specific metric. Replace the 4-line teaser with a 200-word module deep-dive.
3. Add "See this in action with your data →" CTA between the Fix It narrative and the capabilities grid.

---

### platform-slice-03.png / platform-slice-04.png — "Five core capabilities" (capability grid)
**Grade: C**

**Strengths:**
- The five capability cards with their unique metrics (6.4 wks avg early warning, 91% fill rate w/ routing, $5.7K monthly F&B upside, 223x ROI on alert, $251K annualized impact) anchor abstract capabilities in concrete outcomes.

**Problems:**
- The capability cards are identical in structure and depth to the home page cards. The Platform page should be the deep-dive destination — this is the worst IA offense on the site. A visitor clicking "Platform" in the nav to learn more gets the same teaser content they already saw on the home page.
- None of the capability cards link to a deeper section, dedicated page, or modal. They are informational dead ends.
- There is no "Learn more about [capability]" affordance anywhere.

**Fix:**
1. Each capability card on the Platform page should expand to a dedicated sub-section OR link to a dedicated anchor section below (e.g., `#member-intelligence`, `#tee-sheet-demand`, etc.) with: a screenshot or workflow diagram, a 3-step how-it-works, and a specific customer outcome.
2. If sub-sections are too expensive to build now, at minimum add a "Deep dive →" link per card pointing to a relevant FAQ anchor or contact form.

---

### platform-slice-04.png / platform-slice-05.png — "Six AI agents working your club — live" (Agent panel)
**Grade: B**

**Strengths:**
- Same agents panel as home page but on the Platform page it gets more contextual weight — the visitor has been primed with capabilities, so seeing the agents in action makes more sense here.
- The six agent tiles below the panel give a complete roster.

**Problems:**
- Same issues as home page: no pagination indicator, no definition of "agents," breadcrumb artifact in the demo panel.
- No CTA after the agent tiles. This is the same dead end as the home page version.

**Fix:** Same fixes as home page agents section. Additionally, on the Platform page specifically, add anchor links between capability cards and the agents that serve them: "The Member Pulse agent powers the Member Intelligence capability. See it →."

---

### platform-slice-06.png — "Your members feel it. They just can't explain why" (Member experience narrative)
**Grade: A-**

**Strengths:**
- The three-scenario member experience narrative (The Arrival / The Nudge / The Milestone) is the best emotional storytelling section on the entire site. It concretizes the value for a GM who thinks about member experience, not data systems.
- The closing line ("James doesn't know Swoop exists. He just knows his club feels different.") is pitch-perfect positioning.

**Problems:**
- This section is on the Platform page but would likely perform better on the home page as a narrative hook after the problem framing — it's the "human story" that makes the data emotional.
- No CTA after the member experience section — another conversion-moment dead end.

**Fix:**
1. Add a CTA: "Give your members this experience. See a live walkthrough →."
2. Consider moving this section to the home page or using it on both pages.

---

### platform-slice-07.png / platform-slice-08.png — "Every signal. Every system. One clubhouse of intelligence" + Integrations
**Grade: C**

**Strengths:**
- Same integration grid as home page — 28 integrations across 10 categories with real vendor names is reassuring.

**Problems:**
- **The Platform page repeats the same integrations section verbatim from the home page.** On the Platform page, the integration section should go deeper: API capabilities, connection methods, data refresh rates, permission models. Instead it is copy-paste.
- "Rollout Timeline: Typical launch: 10 business days. No operational downtime." is still buried at the bottom of the dark section. This key claim needs surface-level prominence.
- No CTA in the integrations section on the Platform page either.

**Fix:**
1. Expand the integrations section on the Platform page to include: "How connections work" (read-only vs. bidirectional, data latency, security model).
2. Add a link: "Request a technical integration review →" for buyers whose IT teams need to evaluate the connection model.
3. Surface the "10 business days" claim as a prominent section header or callout box.

---

### platform-slice-09.png / platform-slice-10.png — "Built to replace patchwork ops" (Compare table) + Footer
**Grade: B / D**

**Strengths:**
- Compare table is the same as home page and works well as a standalone trust element.

**Problems:**
- **The Platform page compare table ends with the same near-empty footer as the home page** — same "Investor Information | © 2024 Swoop Golf" with no nav links, no policies, no sitemap. This is a critical failure for a B2B buyer who has reached the end of the most detailed page on the site and has nowhere to go.
- The footer copyright still says 2024.
- The "Why not just..." section appears after the comparison table on the Platform page as well — the same objection handling copy from the home page. This is a third instance of duplicate content.

**Fix:**
1. Build the full footer (same fix as home page).
2. Remove "Why not just..." from the Platform page — it belongs on the home page only. Replace it with a focused final CTA: "Ready to see your club's data in Swoop? Book the walkthrough."

---

## PRICING PAGE

---

### pricing-hero.png / pricing-slice-00.png — "The window is open. For a little while longer."
**Grade: C**

**Strengths:**
- The pricing page uses a contrasting dark hero (black background vs. cream on other pages) — good visual differentiation that signals this is a different page context.
- The three market-scale stats (3,000+ clubs, $2.1B dues revenue at risk, 67% still on disconnected point solutions) establish urgency with specificity.

**Problems:**
- **The pricing page hero does not show any prices.** A visitor who landed on /pricing from the nav to quickly check costs sees a market framing story before any price. This is anti-pattern for a pricing page — visitors self-select to this page for one reason: to see costs. Forcing a narrative journey before revealing price creates frustration for the exact buyer who is most ready to convert.
- "WHY NOW" is the eyebrow label — this frames urgency and FOMO, which is appropriate for late-funnel persuasion but comes across as pushy when it is the first thing a pricing-intent visitor sees.
- There is no anchor skip nav to jump directly to the pricing cards from the hero. The buyer who wants price-first has to scroll past the entire market-opportunity narrative.

**Fix:**
1. Move the three pricing cards to the top of the pricing page, or place them immediately below the hero (before the ROI calculator). Buyers who navigate to /pricing want prices first.
2. Add a "Skip to pricing →" anchor link in the hero for buyers who want to jump over the narrative.
3. Reorder the pricing page: Pricing cards → ROI calculator → Why Now context → FAQ. Let the buyer price themselves first, then contextualize the investment.

---

### pricing-slice-01.png — ROI Calculator (on pricing page)
**Grade: B**

**Strengths:**
- ROI calculator on the pricing page is well-placed for conversion — it helps the buyer justify the price they're about to see.

**Problems:**
- The calculator appears before the pricing cards on this page. This is the wrong sequence. The buyer needs to see the price ($499/mo) before they calculate the ROI against it. Currently they calculate ROI against an unknown price, then scroll down to see what they are paying. The mental model is backward.

**Fix:** Move the ROI calculator to appear after the pricing cards, not before them. Sequence: "Here's the cost → here's what you get → here's your ROI calculation."

---

### pricing-slice-02.png / pricing-slice-03.png — "Simple pricing. No long-term contracts." (Three tiers)
**Grade: B**

**Strengths:**
- Three-tier structure ($0, $499, $1,499) with clear "Most Popular" callout and feature differentiation is clean and scannable.
- "Start on Signals (free)" CTA for tier-1 dramatically reduces barrier to entry — strongest acquisition move on the page.
- The "PRICING" eyebrow label is present.

**Problems:**
- Both tier-2 and tier-3 have the same CTA ("Book the 30-minute walkthrough") — a visitor at tier-3 considering $1,499/mo deserves a more direct conversation path: "Talk to sales" or "Request custom onboarding."
- The tier-1 CTA ("Start on Signals (free)") has no explanation of what happens next. Does the visitor create an account? Fill out a form? There is no friction-reduction copy.
- Feature lists on tier-2 and tier-3 are long (7–9 checkmarks) but presented in 12px text inside narrow card columns. At pricing-page context, buyers are comparing line by line — this is legibility critical.
- No annual pricing option or discount is displayed. For a $499/mo product, a "Save 20% annually" toggle would substantially increase revenue per customer.

**Fix:**
1. Differentiate tier-3 CTA: "Talk to the founding team about full access →."
2. Add "What happens next?" below tier-1 CTA: "Connect your Jonas or ClubEssential system → get your first member health scores in 48 hours."
3. Add annual/monthly pricing toggle above the cards.
4. Increase feature-list font size from ~12px to at least 14px.

---

### pricing-slice-04.png — "Common questions" (Pricing FAQ)
**Grade: C**

**Strengths:**
- Three pricing-specific FAQs (Jonas/ClubEssential replacement, setup time, founding partner pilot) are well-targeted to the pricing page buyer.

**Problems:**
- **Only three FAQs on the pricing page** — the home page FAQ has five, the about page has five. The pricing page has fewer answers than the home page for a page where the buyer has the most specific questions (setup costs, contract terms, data ownership, what happens if I cancel, integration costs).
- The FAQ ends and the footer immediately appears — there is **no bottom CTA on the pricing page at all.** A buyer who read through the entire pricing page and FAQ has no next step except scrolling back to the pricing cards or clicking the nav. This is a critical dead end.
- The footer on the pricing page is the same empty footer: no links, © 2024.

**Fix:**
1. Add at least 5–7 pricing-specific FAQ items: "Are integrations extra?", "What is the contract length?", "Can I upgrade or downgrade plans?", "Who owns the data?", "What's included in onboarding?"
2. Add a bottom CTA: "Ready to see what Swoop recovers for your club? Book the 30-minute walkthrough →" or "Start on Signals (free) →."
3. Fix the footer.

---

## ABOUT PAGE

---

### about-hero.png / about-slice-00.png — "The humans in your clubhouse for six months."
**Grade: B**

**Strengths:**
- The About page headline ("The humans in your clubhouse for six months.") is unusually strong for an About page — it immediately differentiates from a typical "Who we are" page by emphasizing presence and partnership.
- Three team members (Tyler Hayes, Jordan Mitchell, Alex Chen) with specific backgrounds and roles give the buyer real people to research and vet.
- Active "About" nav item is highlighted orange — wayfinding is correct.

**Problems:**
- The team bios are brief (3–5 lines) with no links to LinkedIn or extended profiles. A B2B buyer doing diligence will want to verify credentials — there is no path to do so.
- The dark section below the team bios ("MOAT") is cut off at the bottom of the hero screenshot — a visitor at this scroll position has no idea what the dark band introduces.
- No secondary CTA in the hero section. The About page visitor is likely a late-funnel buyer evaluating trust — they need a fast path to "Book a call with Tyler" or "Meet the team."

**Fix:**
1. Add LinkedIn links (or external profile links) to each team member card.
2. Add a CTA in the hero: "Meet the founders. Book a 15-minute intro call →."
3. Ensure the transition from team bios to the "Moat" section is visually clear — the dark band needs a visible heading before the scroll reaches it.

---

### about-slice-01.png / about-slice-02.png — "Why this is hard to copy" (Moat) + Testimonials
**Grade: B**

**Strengths:**
- The moat section stats (46 production tools in orchestration, 12 months of pilot data + model training, #1 preferred Jonas Club integration partner) are specific, competitive claims that an enterprise buyer will find meaningful.
- Transitioning directly into testimonials after the moat section is logically sound — credibility from capabilities leads to credibility from customers.

**Problems:**
- The moat section has no CTA. It ends and flows directly into testimonials without giving the convinced buyer a path to act.
- The testimonials on the About page are the same three testimonials as the home page, still marked "(pending)" — same attribution credibility problem noted earlier. The About page is specifically where trust is evaluated; having unattributed testimonials here is more damaging than on the home page.

**Fix:**
1. Add a CTA after the moat section: "Ready to put this to work for your club? →."
2. If testimonials cannot be attributed, replace them on the About page with a "Founding Partner program" explainer that acknowledges the early stage honestly: "We are working with 3 founding-partner clubs. Here is what they're telling us [paraphrased]. Full case studies Q2 2026."

---

### about-slice-03.png — "Intelligence in action: live demo results" (Proof metrics on About page)
**Grade: C**

**Strengths:**
- Same four proof metrics as home page — specific, attributed to Pinetree CC.

**Problems:**
- This is the third instance of the same proof metric section across the site (home, platform, about). Repeating the identical section verbatim on every page creates the impression that the site is padded. For the About page visitor who has likely already seen the home page, this is just noise.
- No CTA after the proof section on the About page.

**Fix:** Replace the proof metrics block on the About page with something About-page-specific: a brief company history / founding story, the club-tech background that makes the founders credible, or a "what we believe" manifesto. Save the metrics for home and platform pages.

---

### about-slice-04.png / about-slice-05.png — Founding Partner CTA + FAQ + Footer
**Grade: C**

**Strengths:**
- The Founding Partner CTA ("Be one of our first ten clubs") on the About page is contextually appropriate — visitors who trust the team enough to read the About page are prime founding partner candidates.

**Problems:**
- Same five-question FAQ appears again on the About page — same as home page and About page FAQ content. Third instance of duplicate content.
- The About page FAQ has no CTA after it — same dead end as every other page.
- The same empty footer appears: no nav links, © 2024.
- The About page ends without a single link back to Platform or Pricing — visitors who are now warmed up on the team and the product have no forward navigation path to the conversion-focused pages.

**Fix:**
1. Remove the FAQ from the About page — it belongs on Home and Pricing only. Replace with a tailored "Questions about working with Swoop? Email tyler@swoopgolf.com directly." CTA.
2. Add footer nav links.
3. Add an "Explore what we've built →" contextual link pointing to /platform at the bottom of the About page content.

---

## CONTACT PAGE

---

### contact-hero.png / contact-slice-00.png — "See what your club misses today, and what you recover tomorrow."
**Grade: B**

**Strengths:**
- Contact page headline reframes the demo from a "sales call" into a discovery session ("see what your club misses today") — strong conversion copy.
- Four proof metrics (($1.38M dues identified, 3 silent-churn members flagged, 91% tee-sheet fill rate, 9/14 members retained) in the hero reinforces credibility at the exact moment of conversion decision.
- "Pilot results — Fox Ridge Country Club (300 members)" attribution makes these figures feel real and specific.

**Problems:**
- Contact page nav is correct (Home | Platform | Pricing | About | Book a Demo), but **the Contact page itself is not linked from the main nav on any other page.** To reach it, the visitor must click "Book a Demo" from the orange button. This is acceptable for a CTA-driven flow, but it means the contact page URL (/contact or /demo) is unshared, unlinked in footer, and inaccessible via sitemap navigation.
- The dark transition band below the stats appears immediately — the visitor doesn't know if scrolling will reveal more proof content or the form itself.

**Fix:**
1. Add a short directional cue at the bottom of the hero: "↓ Book your walkthrough below."
2. Include the contact page URL in the footer sitemap link set.

---

### contact-slice-01.png — Demo Form + Footer
**Grade: C**

**Strengths:**
- Form fields (Name, Club, Email, Phone) are minimal and appropriate — not over-gated.
- Alternative contact paths (email + phone number) alongside the form are excellent friction-reduction.

**Problems:**
- The form has **no "what happens next" confirmation copy visible** before submission. A buyer filling out the form has no idea whether they'll be called, emailed, or sent a calendar link. This ambiguity increases form abandonment.
- "No credit card required · 30-minute walkthrough · Cancel anytime" trust chips are present but visually buried in small grey text below the button on a dark background — likely fails WCAG AA contrast requirements.
- The "Phone" field is required (or appears so) — phone number is a high-friction field for a B2B SaaS demo form. Many buyers will abandon over required phone.
- The footer on the Contact page is the same empty footer — no nav links.
- The form is visually isolated on the right with copy on the left, but on mobile this will stack — the copy ("Book a live walkthrough with your own operating scenarios") needs to be first-screen visible even on mobile.

**Fix:**
1. Add below the CTA button: "We'll send a calendar link within 1 business day. No sales pressure — this is a technical walkthrough."
2. Make Phone optional (or remove it entirely; Email is sufficient for initial contact).
3. Build the full footer with nav links.
4. Ensure contrast on trust chips passes WCAG AA (minimum 4.5:1 for normal text).

---

## CROSS-PAGE NAVIGATION ISSUES

---

### Missing "About" on Home Nav
The home page nav shows **Platform | Agents | Pricing | Book a Demo** — no "About" link. Every interior page shows **Home | Platform | Pricing | About | Book a Demo**. This is a structural inconsistency that breaks the home page visitor's access to the About page without scrolling to the footer (which has no links anyway).

### "Agents" Nav Label
The nav item "Agents" on the home page is not mirrored on interior pages — interior pages show no "Agents" nav item. This means the Agents deep-dive content is inaccessible via nav from any interior page. If Platform is the home for agent content (it is), the nav should say "Platform" on both home and interior pages, not "Agents" on home.

### No Footer Nav on Any Page
Every page on this site has the same near-empty footer (Swoop wordmark + "Investor Information" + © 2024). There is no sitewide footer nav. For a B2B buyer who reaches the bottom of a long page and wants to navigate to another section of the site, the only option is to scroll back to the top to reach the nav. This is an industry-standard failure.

### No Back-to-Top Button
No page has a back-to-top affordance. On 17-section pages like the home page, this forces the visitor to either: a) scroll back manually, or b) use browser controls. Neither is acceptable UX for a conversion-focused marketing site.

### Duplicate Content Across Pages
The following sections appear verbatim on multiple pages:
- "Most clubs are flying blind" — Home + Platform
- "Five core capabilities. One operating view." — Home + Platform
- "Six AI agents working your club — live" — Home + Platform
- "Your tools manage operations. Swoop connects them." — Home + Platform
- "Built to replace patchwork ops" (compare table) — Home + Platform
- "Why not just..." — Home + Platform
- "Intelligence in action: live demo results" — Home + Platform + About
- Testimonials (three cards) — Home + About
- FAQ (five questions) — Home + About

The Platform page is effectively a copy of the home page. This is a critical IA failure: when a visitor clicks "Platform" in the nav, they expect deeper product information — not a mirror of what they just read. The Platform page needs to be rebuilt with unique, deeper content.

---

## PRIORITIZED TOP-10 NAVIGATION / UX FIXES

| # | Fix | Page(s) | Impact | Effort |
|---|-----|---------|--------|--------|
| 1 | **Build a real sitewide footer** with nav columns: Product, Company, Legal, Contact. Fix © 2024 → 2026. | All pages | Critical — every page dead-ends at the footer | Low–Medium |
| 2 | **Rebuild the Platform page with unique deep-dive content.** Remove all sections that duplicate the home page. Replace with: capability module deep dives with screenshots, agent→capability mapping, integration connection specs, and a technical FAQ. | Platform | Critical — current Platform page is a nav-trust failure | High |
| 3 | **Add a sticky mobile header with hamburger menu and a floating "Book Demo" FAB** on mobile. | All pages (mobile) | Critical — mobile visitors are completely lost mid-scroll | Medium |
| 4 | **Reorder Pricing page**: Pricing cards first → ROI calculator → Why Now context → FAQ → bottom CTA. Add "Skip to pricing" anchor in hero. | Pricing | High — pricing-intent visitors are frustrated by page-top narrative | Low |
| 5 | **Add "About" to the home page nav** and standardize nav across all pages to: Home (when not on home) · Platform · Pricing · About · Book a Demo. Remove "Agents" as a standalone nav item. | Home nav | High — About is currently unreachable from home page except via full-page scroll | Low |
| 6 | **Add section-level CTAs throughout the home page** at every high-intent moment: after comparison table, after objection cards, after agent panel, after ROI calculator output, after proof metrics. | Home | High — multiple conversion moments have no exit ramp | Low |
| 7 | **Fix testimonial attribution.** Either obtain published permission for named quotes or replace with an explicit "Case studies publishing Q2 2026" placeholder. Remove "(pending)" labels — they signal credibility gaps. | Home + About | High — trust damage to late-funnel buyers doing diligence | Low |
| 8 | **Add a back-to-top button** on all long pages and add a sticky in-page section anchor nav on the Platform page (Capabilities | Agents | Integrations | Compare). | Home + Platform | Medium — reduces scroll fatigue on dense pages | Low |
| 9 | **Fix the Contact/Demo form**: make Phone optional, add post-submission expectations ("calendar link within 1 business day"), fix contrast on trust chips below CTA button. | Contact | Medium — form abandonment from phone requirement and uncertainty | Low |
| 10 | **Resolve the "agents vs. capabilities vs. lenses" terminology collision** across the site. Pick one term for each concept and apply it globally across nav labels, section headers, and CTAs. | All pages | Medium — buyer mental-model confusion erodes trust | Low |

---

*End of Audit — r18*
