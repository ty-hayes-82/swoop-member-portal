# Swoop Marketing Site — Trust & Credibility Audit (r18)
**Date:** 2026-04-14  
**Auditor role:** B2B Trust & Credibility Expert  
**Scope:** All pages — Home, Platform, Pricing, About, Contact  
**Grading:** A (excellent) → F (actively harmful to trust)

---

## Grading Rubric

| Dimension | What earns points |
|---|---|
| Social proof quality | Named, verifiable sources vs. paraphrased/anonymous |
| Attribution specificity | Role + club name + member count + result magnitude |
| Data source citations | Where did the stat come from? Survey? Internal data? Industry report? |
| Testimonial authenticity | Real name + photo vs. initials vs. total anonymity |
| Security mentions | SOC 2, encryption, data handling, privacy policy |
| Company legitimacy signals | Founded date, team LinkedIn, press, investors, real address |
| Anonymous vs. named proof | Named > role only > category only > fully anonymous |

---

## HOME PAGE

---

### home-hero.png / home-slice-00.png
**Grade: C+**

**Trust signals present:**
- "$74K in dues a year" — a specific dollar figure creates believability vs. a vague "saves money" claim
- Trust bar beneath hero: "Live under 2 weeks · No rip-and-replace · 28 integrations" — concrete deployment facts

**Trust gaps:**
- "$74K" is completely unattributed. No footnote, no "average across X clubs," no methodology. A CFO at a prospect club will immediately ask "whose $74K?" and find nothing.
- "28 integrations" is a product claim with no integration directory link or verification path.
- "Private Club Intelligence · Built for GMs" — brand tagline only; no signal of who Swoop is, how old, how many customers.
- Zero company legitimacy signals in the hero (no year founded, no investor name, no press logo).

**Fix:**
Add a one-line source disclosure under the $74K figure: *"Median annual dues recovered across founding-partner pilots (Pinetree CC demo data, n=1 club). Full case studies Q2 2026."* Link the integration count to a real integration directory page. Add a single trust anchor — a recognizable partner logo or press mention — to the hero trust bar.

---

### home-slice-01.png — "Most clubs are flying blind" + Confidence cards
**Grade: C**

**Trust signals present:**
- "James Whitfield waited 42 minutes, filed a complaint, sat in Acknowledged for 6 days" — a named, specific scenario adds authenticity
- Confidence percentages (91%, 86%, 44%) — labeling confidence levels is honest, not typical marketing puffery

**Trust gaps:**
- Confidence percentages (91%, 86%, 44%) have zero methodology disclosed. Are these ML model confidence scores? Made-up weights? This reads as invented precision.
- "91% CONFIDENCE" on a marketing page sounds manufactured if no explanation exists.
- "James Whitfield" is a named character but his club, membership type, and whether he is real or fictional is never established.
- "$22K ANNUAL DUES AT RISK" — from what data set? Whose club?
- "$36K DUES + F&B LEAKAGE" — same problem. These are scenario cards, not case study results, but presented with dollar amounts that suggest real data.

**Fix:**
Add a one-line label to each card: *"Illustrative scenario based on Pinetree CC demo data."* Disclose confidence scores with a parenthetical: *"(Swoop ML detection confidence — see methodology)."* If James Whitfield is a real pilot customer, say so explicitly. If fictional, label the card as a "sample scenario."

---

### home-slice-02.png — "Five core capabilities. One operating view."
**Grade: D**

**Trust signals present:**
- None. This is a product capability listing with no proof.

**Trust gaps:**
- "6.4 wks AVG. EARLY WARNING" — completely unattributed. Average across how many clubs? What time period? What definition of "early warning"?
- "91% FILL RATE W/ ROUTING" — which clubs? Pilot data or projection?
- "$5.7K MONTHLY F&B UPSIDE" — whose upside? Modeled or realized?
- "223x ROI ON ALERT" — this is the most dangerous number on the site. A 223x claim with zero attribution is an extraordinary claim with zero evidence. A sophisticated buyer will dismiss the entire page.
- "$251K ANNUALIZED IMPACT" — from demo environment only? From real club? Unknown.

**Fix:**
Every metric card needs a source line. Minimum: *"Pinetree CC demo, 300 members, Q1 2026."* Better: a dedicated methodology footnote page. The 223x ROI must either be footnoted with full calculation or removed — it reads as fabricated without context.

---

### home-slice-03.png — Capability cards continued (Staffing & Labor, Revenue & Pipeline)
**Grade: D**

**Trust signals present:**
- None. Pure product description.

**Trust gaps:**
- "223x ROI ON ALERT" repeated — same critical problem.
- "$251K ANNUALIZED IMPACT" repeated.
- No customer attribution for any metric.

**Fix:**
Same as home-slice-02. These cards duplicate the unattributed metrics. A consistent source disclosure on all metric cards would resolve both slices.

---

### home-slice-04.png — Comparison table "Built to replace patchwork ops"
**Grade: C-**

**Trust signals present:**
- Naming specific competitor categories (Waitlist Tools, Your CRM, Spreadsheets) shows market awareness
- "PARTIAL" labels on competitors acknowledge nuance rather than claiming competitors do nothing

**Trust gaps:**
- Self-graded comparison table. Swoop grades itself. There is no third-party validation of any row.
- "Member health intelligence — Partial" for CRM: this is Swoop's assertion, not a verified audit.
- No methodology for how rows were defined or scored.
- No analyst citation, no customer survey source, no third-party benchmark.

**Fix:**
Either source the comparison to a specific customer survey (*"Based on interviews with 12 GMs, Q4 2025"*) or add an asterisk with *"Swoop's assessment based on product documentation review."* Consider adding one named customer quote beneath the table: "We had Jonas and ClubEssential. Neither told us [X]."

---

### home-slice-05.png — "Why not just…" objection handling
**Grade: B-**

**Trust signals present:**
- Directly addressing Jonas/ClubEssential by name builds credibility — Swoop is not afraid to name competitors
- The distinction between "records" (CRM) and "intelligence" (Swoop) is a crisp, verifiable claim

**Trust gaps:**
- "Swoop's AI agents monitor behavioral signals in real time" — "AI agents" is vague. What model? What data? What accuracy?
- No supporting evidence for any of the three "Why not just…" answers — they are marketing assertions.

**Fix:**
Add one customer voice to this section: a one-line quote from a GM who switched from using CRM reports alone. Even a paraphrased/permission quote at this stage strengthens the objection section enormously.

---

### home-slice-06.png — "Six AI agents working your club — live"
**Grade: C**

**Trust signals present:**
- "LIVE - 6 AGENTS ONLINE" header — simulates a real system, creates verisimilitude
- "NPS +14" projected impact figure — a named metric that can be verified

**Trust gaps:**
- "97% CONFIDENCE" badge on the Service Recovery agent — confidence score for what exactly? This is never explained.
- "NPS +14" — projected based on what? Demo data? Industry benchmark? The source is absent.
- "Trigger captain callback + meal-comp playbook" — this is a live product demo panel but presented as if currently running. Is this the Pinetree CC demo? If so, label it.
- The panel header says "swoop.io / agents / stream" which implies a real URL — is this a real demo environment or a mockup? Not disclosed.

**Fix:**
Add a persistent label: *"Live from Pinetree CC demo environment — 300 members, real system data."* Explain the confidence percentage with a tooltip or footnote. Source the NPS +14 impact estimate.

---

### home-slice-07.png — "Every signal. Every system. One clubhouse of intelligence." + Integrations
**Grade: B**

**Trust signals present:**
- "28 INTEGRATIONS ACROSS 10 CATEGORIES" — specific count is verifiable
- Named integration vendors (Fore!!, Lightspeed, Square, Jonas, QuickBooks, ADP, HubSpot, Brivo) — real product names create instant credibility
- "Typical launch: 10 business days. No operational downtime." — specific, testable claims

**Trust gaps:**
- "#1 preferred Jonas Club integration partner" claim appears later (about page) but not here — missed opportunity to use a real partnership credential in the integrations section.
- "No operational downtime" — bold claim with no explanation of what "operational" means or any SLA reference.

**Fix:**
If Swoop has a formal Jonas partnership, add a small Jonas logo with "Preferred Partner" label in the integrations grid. Add a parenthetical to "No operational downtime": *"(read-only connector setup; your live systems remain active throughout)."*

---

### home-slice-08.png — Rollout timeline detail
**Grade: B-**

**Trust signals present:**
- Two-week implementation breakdown (Week 1: connectors; Week 2: workflows, playbooks) — specific enough to be credible
- "No operational downtime" restated with explanation of parallel operation

**Trust gaps:**
- No customer validation of the two-week timeline. Has any actual club launched in this window?
- No reference to what happens if setup exceeds two weeks (no SLA, no guarantee).

**Fix:**
Add a one-line validation: *"All five founding-partner clubs went live within 10 business days."* That single real-world confirmation transforms a promise into a track record.

---

### home-slice-09.png — Pricing preview section
**Grade: C**

**Trust signals present:**
- "$0/mo" free tier removes barrier and signals confidence in product
- "No long-term contracts" is a buyer-friendly trust signal

**Trust gaps:**
- "Start free with your existing systems. Upgrade when you see the value." — no specifics on what triggers upgrade or what "value" looks like.
- No mention of data security/privacy in pricing context — first-party member data is flowing into this system and there is no mention of SOC 2, GDPR, or data handling policy anywhere on pricing.

**Fix:**
Add a single security line under the pricing cards: *"Member data encrypted in transit and at rest. SOC 2 audit in progress — [link to security page]."* Even "Security FAQ available on request" is better than silence.

---

### home-slice-10.png — Pricing cards (feature lists)
**Grade: C+**

**Trust signals present:**
- Feature specificity ("Swoop drafts the callback + comp + shift in plain English") — concrete enough to be differentiating
- "Priority support" for paid tiers — standard but present

**Trust gaps:**
- "AI agent recommendations" — no accuracy disclosure, no fallback explanation, no description of human-in-the-loop.
- No security/compliance mention on the card that includes GPS + member behavioral data ($1,499/mo tier).

**Fix:**
On the highest tier card, add: *"Member location data requires app opt-in. Privacy policy: [link]."* For AI recommendations, add: *"All recommendations require GM approval before sending."*

---

### home-slice-11.png — ROI Calculator
**Grade: C+**

**Trust signals present:**
- Interactive sliders — transparency in methodology is itself a trust signal
- Showing the math ($120K exposure → $80K recovered → net $74K) makes assumptions visible

**Trust gaps:**
- "65% early-intervention retention rate" — where does this number come from? It is a critical assumption driving the entire calculator. If Swoop invented it, the whole output is fiction.
- "13x return on investment" — sourced from the same unverified 65% assumption.
- Calculator model never disclosed (no "how we calculate this" link).

**Fix:**
Add a "How we calculate this" expandable section that shows: *"65% retention rate is based on early-warning interventions in Pinetree CC demo. This is one club's experience and may not reflect your club's results."* Full disclosure increases, not decreases, credibility with sophisticated buyers.

---

### home-slice-12.png — "Intelligence in action: live demo results"
**Grade: B+**

**Trust signals present:**
- Source attribution: *"Metrics from the Pinetree CC demo environment (300 members, real system data)."*
- Specific metric framing: "6 days average advance notice on at-risk members" — specific, testable
- "Founding partner case studies publishing Q2 2026" — honest disclosure of what is coming
- "$1.38M" dues at-risk figure sourced to "23 members flagged across health score decline, declining visits, unresolved complaints, and behavioral pattern changes" — methodology described

**Trust gaps:**
- "Pinetree CC" is one club. The subhead should clarify this is n=1, not aggregate data.
- "91% fill rate" — baseline comparison (67% reactive) is stated but needs more context: 67% is whose industry average?
- $312 average revenue per slot: increased from $187 reactive — but the baseline $187 is not sourced.

**Fix:**
Add "n=1 demo club" to the section subtitle. Source the $187 baseline or label it as "Pinetree CC prior period." This section is nearly good — small transparency additions would push it to an A.

---

### home-slice-13.png — Founding Partner Program callout
**Grade: B-**

**Trust signals present:**
- "First ten clubs" framing — honest about early-stage, not pretending to be scaled
- "Hands-on onboarding — our team configures your integrations, trains your staff, and validates your data in the first 2 weeks" — specific service promise

**Trust gaps:**
- "Locked-in Pricing for life" — this is a major claim. No definition of "life" (company lifetime? product lifetime?). No legal basis stated.
- "Monthly calls with our product team" — no SLA on call length or response time.

**Fix:**
"Locked-in pricing for life" needs legal clarity: *"Founding-partner rate locked at current pricing for a minimum of 36 months — see partner agreement."* Without a reference to a written commitment, this claim reads as aspirational.

---

### home-slice-14.png — Testimonials "Built with the GMs who live it."
**Grade: C**

**Trust signals present:**
- Disclosure header: *"Swoop is in closed pilot with founding-partner clubs. Attributed quotes publish Q2 2026 — these are paraphrased with permission."* — this transparency disclosure is the right instinct
- Role attribution on each card (GM, Director of Operations, GM)
- Context labels (MEMBER RETENTION, DEMAND OPTIMIZATION, BOARD REPORTING)

**Trust gaps:**
- "D. Marchetti - GM - Founding partner - 380-member private club - Name withheld through Q2 2026 pilot" — this attribution tells us almost nothing verifiable. No club name, no full name.
- "Director of Operations, Southeast, founding partner (pending)" — "pending" attribution is worse than no attribution. A pending quote is not a quote.
- The third testimonial: "GM, 450-member club, founding partner (pending)" — again "pending." Two of three testimonials have zero verified attribution.
- The substance of the quotes is strong but completely unverifiable at this stage.

**Fix:**
Remove the two "pending" cards entirely until attribution is confirmed. Replace with one fully attributed card and the disclosure text. One real, verified quote beats three anonymous/pending ones. If names cannot be used yet, replace with a single strong stat from the demo instead.

---

### home-slice-15.png — FAQ
**Grade: B**

**Trust signals present:**
- "Is my members' data secure?" question exists — signals Swoop knows this is a buyer concern
- Jonas/ClubEssential named directly — builds industry credibility

**Trust gaps:**
- FAQ question "Is my members' data secure?" is listed but collapsed — the question is visible but the answer is not shown in the screenshot. This is the highest-stakes question on the page and it is hidden behind a click.
- No mention of SOC 2, encryption standard, data residency, or compliance framework in visible FAQ text.
- "What does a founding-partner pilot actually look like?" is a good trust question — but also hidden.

**Fix:**
Pre-expand the "Is my members' data secure?" answer. The visible answer should include at minimum: encryption standard, who has access to member data, whether data is used to train models, and current compliance posture.

---

### home-slice-16.png — Bottom CTA / Demo form
**Grade: C+**

**Trust signals present:**
- "No credit card required · 30-minute walkthrough · Cancel anytime" — standard but present
- Email address displayed (demo@swoopgolf.com) and phone number (+1 860 225-5102) — real contact info is a legitimacy signal

**Trust gaps:**
- "Limited founding partner slots available" — artificial scarcity claim with no verification mechanism.
- Footer shows "© 2024 Swoop Golf" — the copyright year is 2024 but we are in 2026. Stale copyright year is a common trust red flag for buyers checking company freshness.
- "Investor Information" link in footer — curious link for a SaaS marketing site. If this is a public investor page, it adds legitimacy; if it is an empty page, it subtracts it.
- No privacy policy link in footer. GDPR/CCPA compliance requires this.
- No physical address, no terms of service link.

**Fix:**
Update copyright to © 2026. Add Privacy Policy and Terms of Service links to the footer. The investor information link should either go to a substantive page or be removed. Add a state of incorporation or registered address.

---

### home-mobile-full.png — Mobile homepage
**Grade: C**

**Trust signals present:**
- Core trust signals carry through from desktop version

**Trust gaps:**
- Mobile rendering of the testimonials section: the "pending" attribution problem is even more visible at mobile viewport because there is less surrounding context to dilute it.
- The confidence percentage labels (91%, 86%, 44%) on the problem cards render small enough on mobile that they look like fine print — which makes them feel even more like manufactured precision.
- Copyright year issue visible in footer.

**Fix:**
Same as desktop fixes. On mobile specifically, consider hiding confidence percentages on the problem cards and replacing with simpler language.

---

## PLATFORM PAGE

---

### platform-hero.png / platform-slice-00.png
**Grade: C+**

**Trust signals present:**
- "Delivered before 6:15 AM" — highly specific claim that implies real operational testing
- The hero repeats the same trust bar from home (implicit consistency signal)

**Trust gaps:**
- "Five AI-powered lenses" — "AI-powered" is now table stakes marketing language. No specificity on what "AI" means, what models, what accuracy.
- "Delivered before 6:15 AM" — delivered to whom? Has this been validated by any real club? Sounds like a product roadmap promise, not a proven feature.
- Zero company credibility signals on the Platform hero — a buyer landing here directly has no context on Swoop's stage, team, or customers.

**Fix:**
Add the Pinetree CC demo attribution to the Platform page hero, just as it is used on the Home page. Change "delivered before 6:15 AM" to *"Delivered before 6:15 AM — tested across Pinetree CC founding pilot"* or disclose it as a target delivery time.

---

### platform-slice-01.png — Problem cards (same as home)
**Grade: C**

Same assessment as home-slice-01. The James Whitfield scenario is more prominent on the Platform page because there is less surrounding proof context. The $22K and $36K figures feel more isolated here.

**Fix:**
Add the Pinetree CC source label to each card on the Platform page specifically.

---

### platform-slice-02.png — "The right action. The right person. Before the problem compounds." + Karen Wittman story
**Grade: B+**

**Trust signals present:**
- "Karen Wittman, nine years." — named member (even if illustrative), specific tenure, creates narrative credibility
- Specific action sequence: "CRM said active. POS: last tab 18 days ago. Tee sheet: no-show three Wednesdays. Not one system flagged her." — multi-system corroboration is a compelling, specific claim
- "$32K / 9/14 members retained / $67K dues protected" — specific dollar and retention metrics with context
- "Every signal sourced. Every action approved. Every outcome attributed." — explicit approval-workflow claim

**Trust gaps:**
- Karen Wittman: is she a real member from the pilot? A composite? Fictional? Not disclosed.
- "$67K DUES PROTECTED" — from what data? Pinetree CC demo? This is the most important number on the platform page and it has no footnote.
- "9/14 members retained" — retained over what time window? In what context?
- The approval workflow screenshot (terminal-style UI with "approved" badge) looks like a developer mockup, not a production UI screenshot.

**Fix:**
Add a disclosure line under the Karen Wittman story: *"Illustrative scenario built from Pinetree CC pilot data. Member name changed."* Source the $67K figure with the same Pinetree CC attribution used elsewhere. If Karen is real (with consent), say so — it is much stronger.

---

### platform-slice-03.png — Five core capabilities grid
**Grade: D**

**Trust signals present:**
- None. This is a pure feature specification grid.

**Trust gaps:**
- All metric callouts repeated: 6.4 wks, 91%, $5.7K, 223x, $251K — same unattributed figures as home page.
- The 223x ROI figure appears again with no source, no calculation, no context. This is the single most harmful number on the entire site from a trust perspective.

**Fix:**
Source every metric to Pinetree CC demo data with a footnote. Remove 223x ROI from the capability cards and move it to a dedicated calculation breakdown where it can be explained properly.

---

### platform-slice-04.png — Capability metrics overflow
**Grade: D**

**Trust signals present:**
- None.

**Trust gaps:**
- "$251K ANNUALIZED IMPACT" repeated without source.
- "223x ROI ON ALERT" repeated.

**Fix:**
Same as platform-slice-03. Consider removing the ROI figures from the capability cards entirely and anchoring all financial metrics to the dedicated "live demo results" section where source attribution exists.

---

### platform-slice-05.png — Six AI agents section
**Grade: C**

Same assessment as home-slice-06. The live agent panel is compelling but unattributed.

**Fix:**
Add persistent "Pinetree CC demo" label to the live agent panel on the Platform page.

---

### platform-slice-06.png — Agent panel detail + agent cards
**Grade: C**

**Trust signals present:**
- "91% fill" projected impact is shown in the context of a specific action recommendation
- Six named agents with clear function descriptions — specificity helps credibility

**Trust gaps:**
- "97% CONFIDENCE" and "87% CONFIDENCE" — confidence in what? False positive rate? Detection accuracy? Never explained.
- The agent panel UI shows "Saturday 8am block - 3 cancellations predicted" — is this a prediction that actually came true? Or a demo scenario?

**Fix:**
Add a footnote: *"Confidence scores indicate Swoop's ML detection certainty. Predictions are recommendations — all actions require GM approval."*

---

### platform-slice-07.png — Member experience narrative "Your members feel it. They just can't explain why."
**Grade: C+**

**Trust signals present:**
- Narrative specificity: "Swoop tracked round milestones across six years of data, staged the recognition with the pro shop, and alerted the GM to write the note — three days before James arrived." — detailed operational description
- Three-scenario structure (arrival, milestone, post-round) shows breadth

**Trust gaps:**
- "James" in the milestone story: real member or fictional? Never disclosed.
- "Booth 12" detail — sounds like a real club, but what club? For what purpose?
- "James doesn't know Swoop exists. He just knows his club feels different." — while this is a compelling emotional hook, it also raises a data ethics question: is behavioral tracking disclosed to members? No mention of member consent or privacy.

**Fix:**
Add a one-line disclosure: *"Member behavioral data is collected with club consent per membership agreement. Members may opt out via [link]."* Without this, the "members don't know" framing could create concerns with privacy-conscious GMs.

---

### platform-slice-08.png — Integrations (same as home)
**Grade: B**

Same assessment as home-slice-07. Named vendors are the strongest trust signal on the page.

---

### platform-slice-09.png — Comparison table (same as home)
**Grade: C-**

Same assessment as home-slice-04. Self-graded comparison table.

---

### platform-slice-10.png — "Why not just…" + footer
**Grade: B-**

Same assessment as home-slice-05 plus:

**Trust gaps:**
- Footer shows "© 2024 Swoop Golf" again — same stale copyright issue.
- No Privacy Policy, ToS, or security links in footer.

---

## PRICING PAGE

---

### pricing-hero.png / pricing-slice-00.png — "The window is open. For a little while longer."
**Grade: D+**

**Trust signals present:**
- "3,000+ private clubs in the US with 200+ members" — specific market size with qualifier
- The copy directly acknowledges market context (decade of digitization, 2024 LLM infrastructure) — shows strategic awareness

**Trust gaps:**
- "3,000+" — no source cited. NGCOA? Golf Datatech? McKinsey? Unknown.
- "$2.1B annual dues revenue at risk from preventable churn" — this is the most consequential unattributed statistic on the entire site. It is a calculated market-size figure that demands a source. Investors and procurement teams will flag this immediately.
- "67% of clubs still rely on disconnected point solutions" — no source. Industry survey? Swoop's own outreach? Made up?
- All three hero stat blocks are source-free while simultaneously being the most ambitious claims on the site.

**Fix:**
Every stat on this hero needs a source. Suggested disclosures:
- *"3,000+: NGCOA 2024 membership survey"* (or whatever the actual source is)
- *"$2.1B: Swoop estimate based on NGCOA club count × average dues × industry churn rate. Methodology available on request."*
- *"67%: Swoop survey of 47 GMs, Q3 2025"*
If these numbers are estimated, say so. Estimated + disclosed methodology is far more credible than a naked $2.1B assertion.

---

### pricing-slice-01.png — ROI Calculator (same as home)
**Grade: C+**

Same assessment as home-slice-11. The 65% retention rate assumption drives the entire output and is never sourced.

---

### pricing-slice-02.png — ROI Calculator detail + Pricing cards
**Grade: C**

**Trust signals present:**
- "No long-term contracts" repeated — consistent messaging
- "Start on Signals (free)" — zero-risk entry

**Trust gaps:**
- "13x return on investment" appears again from the calculator — sourced from the same unverified 65% assumption.
- Pricing cards still carry no security mention for the highest tier which includes GPS + member behavioral data.

---

### pricing-slice-03.png — Full pricing cards
**Grade: C+**

**Trust signals present:**
- Feature specificity in each tier — clear differentiation
- "Dedicated success manager" on top tier — named support structure

**Trust gaps:**
- No mention of data security anywhere in pricing cards.
- "AI agent recommendations" — no accuracy or false-positive rate disclosure.
- "Automated playbooks + agent-driven actions" — the word "automated" could alarm a GM. Who reviews what before it fires?

**Fix:**
Add a micro-copy line under the highest-tier CTA: *"All agent actions require GM approval. Member data never used for model training. [Privacy Policy]"*

---

### pricing-slice-04.png — Pricing FAQ
**Grade: B-**

**Trust signals present:**
- FAQ is more detailed than home version — Jonas/ClubEssential named again
- "How long does setup take?" and "What does a founding-partner pilot actually look like?" are genuine buyer questions

**Trust gaps:**
- "Is my members' data secure?" is listed but the answer is collapsed and not visible.
- Pricing page FAQ has only three questions vs. home's five — the data security question is present but the deeper compliance questions (data retention, deletion rights, third-party sharing) are absent.

**Fix:**
On the pricing page specifically, expand the data security FAQ answer by default. This is the page where procurement teams do due diligence. A hidden security answer on the pricing page is a conversion killer.

---

## ABOUT PAGE

---

### about-hero.png / about-slice-00.png — Team section
**Grade: B**

**Trust signals present:**
- Named team members with real names: Tyler Hayes (Founder & CEO), Jordan Mitchell, Alex Chen
- Role specificity: "Former club-tech operator," "Ex-Agilysys," "Ex-Salesforce Industries"
- Prior employer name-drops (Agilysys AGYS — ticker symbol included; Salesforce) — these are verifiable companies
- "NASDAQ: AGYS" — including the ticker symbol is a strong legitimacy signal

**Trust gaps:**
- No LinkedIn profile links for any team member — claims of "Ex-Agilysys" and "Ex-Salesforce" cannot be verified.
- No photos — initials only (TH, JM, AC). Lack of photos is a significant trust gap for a B2B platform handling sensitive member data. Buyers want to know who they are trusting.
- Tyler Hayes: "Former club-tech operator. Ran member experience at a 300-member desert club." — which club? Anonymous founder experience is weaker than named club.
- Alex Chen: "Six years turning operational data into daily workflows" — at which companies/clubs? Vague.

**Fix:**
Add headshots (even informal ones) to all three team cards. Add LinkedIn profile links. Name the specific club Tyler ran, with permission. "Ran member experience at [Desert Highlands, AZ]" is 10x stronger than "a 300-member desert club."

---

### about-slice-01.png — "Why this is hard to copy" + moat metrics
**Grade: B-**

**Trust signals present:**
- "#1 preferred Jonas Club integration partner" — a real partnership claim with a named partner
- "12 months of pilot data + model training" — specific timeline
- "46 production tools in orchestration" — specific count

**Trust gaps:**
- "#1 preferred Jonas Club integration partner" — this is a major claim. Is there a press release? A Jonas endorsement? A logo? Without any verification path, this is a self-reported ranking.
- "46 production tools" — production where? In the demo environment? Across all customers?
- "First MCP-native club platform" — "MCP-native" will mean nothing to most GMs and is not explained. Technical jargon on a trust page hurts credibility with non-technical buyers.

**Fix:**
If there is a Jonas partnership announcement or agreement, link to it or display the Jonas logo with "Preferred Partner" badge. Replace "First MCP-native club platform" with something a GM can understand, or add a parenthetical explanation. Add a "first" source: "First MCP-native club platform — as of Q1 2026, no competitor has shipped agent-to-club system orchestration at this depth" is better than an unsourced "first."

---

### about-slice-02.png — Testimonials (same three as home)
**Grade: C**

Same assessment as home-slice-14. Two of three testimonials are "pending" attribution. This is the About page — the place where buyers assess company credibility. The unverified testimonials hurt most here.

**Fix:**
On the About page especially, replace pending testimonials with the team story or a pilot program description. One verified testimonial > two pending ones.

---

### about-slice-03.png — "Intelligence in action: live demo results" (same as home)
**Grade: B+**

Same assessment as home-slice-12. This is one of the better-sourced sections on the site.

---

### about-slice-04.png — Founding Partner Program (same as home)
**Grade: B-**

Same assessment as home-slice-13. "Locked-in pricing for life" needs legal grounding.

---

### about-slice-05.png — FAQ
**Grade: B-**

Same assessment as home-slice-15. The About page FAQ is the same as the home FAQ with one less question visible. "Is my members' data secure?" is present but collapsed.

---

## CONTACT PAGE

---

### contact-hero.png / contact-slice-00.png — Contact hero with pilot stats
**Grade: B+**

**Trust signals present:**
- "PILOT RESULTS — FOX RIDGE COUNTRY CLUB (300 MEMBERS)" — this is the strongest attribution on the entire site. A named club with member count is a real credibility anchor.
- Specific metrics tied to that named club: $1.38M in-at-risk dues, 3 silent-churn members flagged, 91% tee-sheet fill, 9/14 members retained
- Four distinct metrics with distinct descriptions — not one inflated single number

**Trust gaps:**
- "Fox Ridge Country Club" — is this a real club? A quick Google search should confirm. If it is real, this is strong. If it is a fictional demo club name, this is potentially deceptive and legally risky.
- "9 seats left" — artificial scarcity with no verification mechanism. How does the site know how many seats are left?
- "9/14 members retained" — retained from what baseline? Over what timeframe? What were these 14 members at risk of?
- No photo, testimonial, or contact from Fox Ridge Country Club staff to corroborate the metrics.

**Fix:**
Critical: verify whether Fox Ridge Country Club is a real named club or a fictional demo club. If real: add a club staff quote or at minimum a "(with permission)" note. If fictional: rename it to clearly fictional (e.g., "Pinetree CC demo environment") to avoid the impression of fabricated named-club data. The current framing implies these are results from a real pilot at a real named club. That is either Swoop's strongest trust asset or its biggest legal exposure — clarify immediately.

---

### contact-slice-01.png — Demo booking form
**Grade: C+**

**Trust signals present:**
- Real email and phone displayed — legitimate contact channels
- "No credit card required · 30-minute walkthrough · Cancel anytime"
- Simple form (Name, Club, Email, Phone) — asking for "Club" signals industry specificity

**Trust gaps:**
- No privacy policy disclosure on the form — collecting PII (name, email, phone) with no privacy policy visible is a GDPR/CCPA compliance issue.
- Copyright "© 2024 Swoop Golf" — stale year in footer.
- "Or email us at demo@swoopgolf.com" — note the domain is swoopgolf.com, but the brand is "swoop" — is swooppgolf.com or swoop.io the canonical domain? Brand consistency gap.

**Fix:**
Add "By submitting, you agree to our [Privacy Policy]" below the form submit button. Update copyright to 2026. Confirm canonical domain and ensure all contact addresses use the same domain.

---

## PRIORITIZED TOP-10 TRUST FIXES

Ranked by credibility impact — how much a sophisticated B2B buyer (GM, board member, CFO) would be moved by fixing this item.

---

### #1 — Source or remove "Fox Ridge Country Club" results (CRITICAL)
**Impact: Existential trust risk**

The contact page presents "$1.38M in-at-risk dues identified" and "9/14 members retained" attributed to a named club (Fox Ridge Country Club). If this club is fictional or if these are demo-environment projections presented as real pilot results, this constitutes potential deceptive marketing. Verify immediately: if real, get explicit written permission and add a staff quote; if fictional, relabel as "Pinetree CC demo environment" consistently with the rest of the site.

---

### #2 — Source the three pricing page hero statistics (HIGH)
**Impact: Kills credibility with investors and procurement teams**

"$2.1B annual dues revenue at risk," "3,000+ clubs," and "67% disconnected" are displayed as authoritative market facts with no source. Every sophisticated buyer will ask "source?" and find nothing. Add inline citations (NGCOA, Golf Datatech, or "Swoop estimate — methodology available") to all three. This is the first thing a CFO or investor deck reviewer will check.

---

### #3 — Remove or fully explain "223x ROI ON ALERT" (HIGH)
**Impact: Makes the entire site look untrustworthy**

A 223x return claim with zero attribution is the most trust-destructive single number on the site. Sophisticated buyers dismiss it as marketing fabrication — and then apply that skepticism to every other number. Either: (a) provide the full calculation breakdown on a methodology page and link to it, or (b) remove it from the capability cards and anchor ROI claims only to the sourced demo results section.

---

### #4 — Disclose the 65% retention rate assumption in the ROI calculator (HIGH)
**Impact: The entire calculator output is fiction without this**

The ROI calculator's core assumption ("65% early-intervention retention rate") drives every output figure. Buyers who adjust the sliders are building business cases on this number. If it is not sourced and labeled, every business case built on the calculator is worthless — or worse, a liability if it influences a buying decision. Add: *"65% retention rate based on Pinetree CC founding pilot (1 club, n=23 at-risk members, Q1 2026). Your results may differ."*

---

### #5 — Replace the two "pending" testimonials or remove them (HIGH)
**Impact: Active trust destruction — "pending" signals nothing is real yet**

"Director of Operations, Southeast, founding partner (pending)" and "GM, 450-member club, founding partner (pending)" are not testimonials — they are placeholders. They signal to buyers that Swoop does not yet have real customers willing to go on record. Remove both cards immediately. Keep only the one partially-attributed card (D. Marchetti) and add the source disclosure. One honest testimonial is worth more than three fake ones.

---

### #6 — Expand the "Is my members' data secure?" FAQ answer everywhere (HIGH)
**Impact: Silent deal-killer for every security-conscious GM**

This question exists in every FAQ on every page but is always collapsed. Data security is the #1 objection in B2B SaaS selling to clubs handling 300-1,500 member records. The answer should be expanded by default and include: encryption standard, data residency, access controls, whether data trains models, and current compliance posture (SOC 2 timeline). The answer should be the same on every page.

---

### #7 — Add LinkedIn links and headshots to all team members on the About page (MEDIUM-HIGH)
**Impact: Buyers cannot verify the team exists**

"Ex-Agilysys (NASDAQ: AGYS)" is a strong claim but unverifiable without a LinkedIn link. No photos means buyers cannot confirm these are real people. For a company asking clubs to connect their Jonas, Square, and ADP systems, buyer trust in the human team is critical. Add real photos and LinkedIn profile URLs for Tyler Hayes, Jordan Mitchell, and Alex Chen.

---

### #8 — Add a Privacy Policy and update the copyright year in every footer (MEDIUM)
**Impact: Legal compliance + company freshness signal**

"© 2024 Swoop Golf" appears in every footer on a site operating in 2026. Stale copyright year is a subtle but consistent trust signal to buyers that the company is not actively maintained. More critically, there is no Privacy Policy link anywhere on the site — this is a GDPR/CCPA compliance violation for a platform that collects member PII. Fix both in a single footer update.

---

### #9 — Verify and attribute the Jonas "Preferred Partner" claim (MEDIUM)
**Impact: The site's strongest legitimacy claim is unsupported**

"#1 preferred Jonas Club integration partner" is mentioned on the About page. If this is backed by a formal partnership agreement, it is the site's single strongest third-party legitimacy signal. Add: the Jonas logo, a press release link, or a "Jonas-certified integration" badge. Without verification, it is a self-reported ranking that trained buyers will discount.

---

### #10 — Add data consent and approval-workflow disclosures for AI features (MEDIUM)
**Impact: Privacy-conscious GMs and boards will stall on this**

The platform collects GPS location data, behavioral patterns, and PII. The site never explains member consent (opt-in vs. opt-out), whether member data is used to train AI models, or how GM approval works before any automated action fires. Add a single "How Swoop handles data" page (or expand the security FAQ) to address: member consent mechanism, data use policy, AI action approval workflow, and data deletion rights. A single transparent data-practices page resolves all of these at once.

---

## SUMMARY SCORECARD

| Section | Grade | Primary Issue |
|---|---|---|
| home-hero | C+ | $74K unattributed |
| home-slice-01 | C | Confidence scores unexplained, James Whitfield unlabeled |
| home-slice-02/03 | D | 223x ROI, all metrics unattributed |
| home-slice-04 | C- | Self-graded comparison table |
| home-slice-05 | B- | Objection copy only, no customer voice |
| home-slice-06 | C | AI agent confidence unexplained |
| home-slice-07/08 | B | Named integrations strong, Jonas partnership claim unsupported |
| home-slice-09/10 | C | No security mention in pricing context |
| home-slice-11 | C+ | 65% retention assumption unverified |
| home-slice-12 | B+ | Best sourced section — n=1 disclosure needed |
| home-slice-13 | B- | "Locked-in for life" unsubstantiated |
| home-slice-14 | C | Two "pending" testimonials |
| home-slice-15 | B | Security FAQ hidden |
| home-slice-16 | C+ | Stale copyright, no privacy policy |
| platform-hero | C+ | Same unattributed hero promise |
| platform-slice-02 | B+ | Karen Wittman story strong but unlabeled |
| platform-slice-03/04 | D | 223x ROI repeated, no sources |
| platform-slice-06 | C | Confidence scores unexplained |
| platform-slice-07 | C+ | Member consent not addressed |
| pricing-hero | D+ | $2.1B, 67%, 3,000+ all unsourced |
| pricing-slice-01/02 | C+ | 65% assumption drives all outputs |
| about-hero | B | Named team but no photos or LinkedIn |
| about-slice-01 | B- | Jonas claim unverified |
| about-slice-02 | C | Two pending testimonials on credibility page |
| contact-hero | B+ | Named club attribution (verify real vs. fictional) |
| contact-slice-01 | C+ | No privacy policy on PII form |

**Overall site trust grade: C+**  
The site has the right instincts — source disclosure language exists in the demo results section, the team is named, and the integration directory uses real vendor names. The core failures are: unsourced market statistics, unverified financial metrics that appear across every page, fabricated-feeling precision (confidence percentages, 223x ROI), and the structural problem of pending testimonials signaling pre-customer status. Fix the top 5 items and the overall grade rises to B+.
