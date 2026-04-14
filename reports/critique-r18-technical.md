# Technical Credibility Audit — Swoop Marketing Site (r18)
**Reviewer perspective:** Technical product marketer evaluating skeptical buyers with existing tech stacks  
**Buyer fears:** Data security, IT burden, integration reliability, vendor lock-in, AI claim legitimacy  
**Date:** 2026-04-14

---

## Grading Scale
- **A** — Strong technical specificity; buyer fear directly addressed  
- **B** — Good direction, missing one or two key specifics  
- **C** — Generic claims; a technical buyer will pause here  
- **D** — Vague or misleading; creates more questions than it answers  
- **F** — Active red flag; will kill deals with technical evaluators

---

## HOME PAGE

---

### home-hero.png / home-slice-00.png
**Grade: B**

**Technical credibility strengths:**
- Names three specific system types (tee sheet, CRM, POS) — buyer knows their stack is recognized
- Footer trust bar lists "28 integrations," "Live in under 2 weeks," "No rip-and-replace" — three buyer fears addressed in one line

**Technical credibility gaps:**
- "28 integrations" is a count with no names — could be 28 Zapier webhooks for all the buyer knows
- "No rip-and-replace" is a reassurance phrase, not a mechanism; doesn't explain how read-only access works
- No mention of how data leaves existing systems (API pull? CSV? agent-based?)

**Fix recommendation:**  
Replace "28 integrations" trust badge with "28 named connectors — Jonas, Lightspeed, ForeTees" and hyperlink to the integrations grid. Add a second micro-copy line under the badge: "Read-only API access. Your data stays in your systems."

---

### home-slice-01.png — Social Proof / Trust Bar
**Grade: B+**

**Technical credibility strengths:**
- "300-member Pinetree CC — Live demo environment, real data" names a specific club with real data claim
- "28 integrations — 10 categories, no rip-and-replace" repeats connector count with a category qualifier

**Technical credibility gaps:**
- Confidence scores shown on problem cards (91%, 88%, 44%) have no methodology shown — what model produces these? What are they a probability of?
- "Live demo environment, real data" is ambiguous — is that the buyer's data or Pinetree's data?

**Fix recommendation:**  
Add a parenthetical under confidence scores: "(health score from CRM + tee sheet signal correlation)." Clarify the demo bar copy: "Live demo: Pinetree CC data, not synthetic." These are small copy changes with outsized credibility impact.

---

### home-slice-02.png — Problem Framing ("Most clubs are flying blind")
**Grade: C**

**Technical credibility strengths:**
- Specific scenario: "James Whitfield waited 42 minutes, filed a complaint, sat in 'Acknowledged' for 6 days" — concrete, believable
- Three-panel layout surfaces real operational gaps (CRM, tee sheet, POS silos) by system name

**Technical credibility gaps:**
- Confidence score labels (91%, 88%, 44%) with no explanation of what model generates them or what input features drive the score
- The "why this surfaced" micro-data points ("Engagement down 28% across six weeks") are compelling but carry no source attribution — is this CRM? Tee sheet? Fabricated?
- No mention of how Swoop detects these patterns; "AI" is implied but not named

**Fix recommendation:**  
Add a "Data sources:" line under each problem card: "Sources: CRM complaint log + POS spend cadence." This takes three minutes to write and directly addresses the "how does it actually know this?" skepticism.

---

### home-slice-03.png — Platform Overview ("Five core capabilities")
**Grade: C+**

**Technical credibility strengths:**
- Data source attribution visible on capability cards (e.g., "CRM + POS + Email", "Scheduling + Tee Sheet", "Revenue + CRM + POS") — strong signal that it's actually reading live systems
- Quantified outputs: 6.4 weeks average early warning, 91% fill rate, 223x ROI on alert, $251K annualized impact

**Technical credibility gaps:**
- "AI agent automation" on the comparison table has no explanation — what model? What does it actually do?
- ROI metrics (223x, $251K) have no sample size or conditions shown — a CFO will want to know from how many clubs, over what period
- No mention of what happens when a source system goes offline or has data quality issues

**Fix recommendation:**  
Add a footnote to the ROI stat: "Based on Pinetree CC demo environment, 300-member club, Q4 2025." This converts a vague claim into verifiable proof. Under "AI agent automation," add a two-line tooltip or sub-copy: "Anthropic Claude + proprietary club data models. Actions require GM approval."

---

### home-slice-04.png — Comparison Table ("Built to replace patchwork ops")
**Grade: C**

**Technical credibility strengths:**
- Competitive comparison names the category of alternatives (Waitlist Tools, Your CRM, Spreadsheets) — honest framing
- "Cross-system analytics" and "Closed-loop engagement" feature rows go beyond surface capabilities

**Technical credibility gaps:**
- Competitor columns are generic categories, not named products — a buyer using Jonas + ClubEssential doesn't see themselves
- "AI agent automation" — Swoop: checkmark, Your CRM: X — but no explanation of what the agent does, what model it runs on, or what guardrails exist
- No data security or compliance row in the comparison — this is a missed opportunity to surface it during comparison mode

**Fix recommendation:**  
Add a "Data Security" row to the comparison table: Swoop = "Read-only API, SOC 2 in progress," Your CRM = "Full write access required," Spreadsheets = "Exported PII, uncontrolled." This is a differentiated row that directly answers the buyer's top fear.

---

### home-slice-05.png — Why Not Just Use (standalone waitlist / CRM / dashboards)
**Grade: C**

**Technical credibility strengths:**
- "Your CRM stores records. Swoop connects records across systems — tee sheet, POS, member engagement, staffing — and turns the gaps between them into actionable intelligence." — This is a technically accurate and differentiated description
- Explains the intelligence layer concept without jargon

**Technical credibility gaps:**
- "Swoop's AI agents monitor behavioral signals in real time" — no definition of "behavioral signals," no model attribution, no latency claim
- No mention of what data Swoop stores vs. reads — privacy-conscious buyers will wonder if member PII is copied into Swoop's database
- "Recommend interventions before problems become resignations" — the word "recommend" hides all the complexity; how are recommendations generated?

**Fix recommendation:**  
Add a single sentence to the CRM objection handler: "Swoop does not store your member records — it reads them in real time via read-only API connectors and discards them after the intelligence layer processes each signal." This is the most important data handling transparency statement missing from the entire site.

---

### home-slice-06.png — AI Agents Panel ("Six AI agents working your club — live")
**Grade: D**

**Technical credibility strengths:**
- Six agents are named and scoped (Member Pulse, Demand Optimizer, Service Recovery, Labor Optimizer, Revenue Analyst, Engagement Autopilot) — buyers can see defined responsibilities
- Live activity feed mock-up with "NPS +14" projected impact is concrete

**Technical credibility gaps:**
- "Six AI agents" — what model powers them? GPT-4? Claude? A fine-tuned model? A technical buyer will ask
- "NPS +14" projected impact from a single callback — no methodology shown, no confidence interval, no basis for this number
- "AGENTS ONLINE" status indicator but no explanation of what happens when an agent fails, flags a false positive, or takes an undesired action
- No GM override / human-in-the-loop language anywhere on this panel — this is the highest-risk panel on the site for a skeptical IT or board review

**Fix recommendation:**  
Add a "How agents work" disclosure line below the agent grid: "Agents surface signals and draft recommended actions. No action executes without GM approval. Powered by Anthropic Claude with proprietary club data models." This is not defensive copy — it converts a fear into a feature (human-in-the-loop).

---

### home-slice-07.png — Integrations Intro ("Every signal. Every system.")
**Grade: B-**

**Technical credibility strengths:**
- Copy accurately describes the architecture: "Swoop is the intelligence layer that connects them, adds location-aware behavioral signals, and turns cross-system patterns into actionable recommendations" — technically specific
- "Real-Time Location Intelligence: GPS and behavioral data from the Swoop member app" — explains data source for location

**Technical credibility gaps:**
- "GPS and behavioral data" raises immediate privacy questions that are not answered here
- "Cross-System Behavioral Correlation" — no description of the algorithm, latency, or failure mode
- No API vs. webhook vs. CSV connector type differentiation mentioned

**Fix recommendation:**  
Add a privacy qualifier to the GPS mention: "Member location data is opt-in via the Swoop app, anonymized for staffing optimization, and never shared outside the club." This is legally prudent and commercially essential for any club that has done a privacy review.

---

### home-slice-08.png — Integrations Grid ("28 Integrations Across 10 Categories")
**Grade: A-**

**Technical credibility strengths:**
- Named integrations by category: Tee Sheet & Booking (ForeTees, Lightspeed Golf, Club Prophet, Tee-On), Member CRM (Northstar, Jones Club, ClubEssential), POS & F&B (Toast, Square, Lightspeed, POSitouch, Jonas F&B), Communications (Mailchimp, Constant Contact, Twilio, SendGrid), Staffing & Payroll (ADP, 7shifts, Paychex), Finance & BI (QuickBooks, Sage/Intact, Club Benchmarking, PivotTable), Web & Lead Capture (HubSpot, MemberJanitor), Access & Activity (Brivo, Keri Systems, Gatekeeper)
- Rollout timeline is specific: "10 business days. No operational downtime. Week 1: connector setup, data validation, intelligence baselines. Week 2: workflows, AI agent playbooks, GM readiness."

**Technical credibility gaps:**
- Connection type (API read-only vs. webhook vs. CSV import) is not shown per integration — "connected systems" says nothing about the connection mechanism
- No indicator of which integrations are certified/live vs. in development
- No mention of data refresh frequency (real-time? hourly? nightly?) — critical for "early warning" claims
- No mention of connector authentication method (OAuth? API key? Service account?)

**Fix recommendation:**  
Add a "Connection type" column or icon badge to the integration grid: API (read-only), Webhook, CSV import. Add a data refresh note: "Most connectors sync every 15 minutes. Tee sheet and POS sync in real time." This eliminates a common technical due diligence blocker.

---

### home-slice-09.png — Rollout Timeline / Pricing Preview
**Grade: B**

**Technical credibility strengths:**
- "No operational downtime. Keep current systems active while Swoop comes online in parallel" — explicitly addresses the IT disruption fear
- Two-week rollout with week-by-week breakdown is credible and specific

**Technical credibility gaps:**
- Pricing at this scroll position introduces $499/mo tier but no SLA, uptime guarantee, or support tier language
- "AI agent recommendations" as a $499 feature has no explanation of what happens if the AI makes a wrong recommendation
- No mention of data migration, data ownership, or what happens to data at contract end

**Fix recommendation:**  
Add a single "Data ownership" sentence under the pricing header: "Your data stays in your systems. If you cancel, Swoop retains no member records." This is a vendor lock-in objection killer that costs zero words of value to add.

---

### home-slice-10.png — Pricing Tier Features (Detail)
**Grade: C+**

**Technical credibility strengths:**
- Feature specificity improves at tier level: "Retention-prioritized waitlist routing," "GPS + on-property member behavior," "Save-attribution tracking" — these are verifiable outcomes
- "Up to 3 active integrations (28 in library)" and "Up to 10 active integrations" are specific, auditable limits

**Technical credibility gaps:**
- "Automated playbooks + agent-driven actions" — "agent-driven actions" on the $1,499 tier means the AI does something automatically; no guardrails or override language
- "AI agent recommendations" implies the AI generates content (comp scripts, callback language) — no model attribution, no output review mechanism described
- No mention of data residency, backup policy, or security review process at any tier

**Fix recommendation:**  
Add a security footnote at the bottom of the pricing table: "All tiers: read-only API access, TLS in transit, AES-256 at rest. SOC 2 Type II audit scheduled Q3 2026." If SOC 2 isn't yet achieved, "in progress" is acceptable — silence is not.

---

### home-slice-11.png — ROI Calculator
**Grade: B**

**Technical credibility strengths:**
- Interactive sliders with explicit inputs (Total Members: 300, Avg Annual Dues: $8,000, Annual Turnover Rate: 5%) — transparent calculation methodology
- Output shows the math: 15 members at risk, $120K revenue at risk, $80K recovered (65% early-intervention retention rate), net $74,012 at 13x ROI

**Technical credibility gaps:**
- "65% early-intervention retention rate" — this is the core assumption that drives all the math; where does it come from? No source shown
- "13x return on investment" — compelling but the Swoop Pro annual cost ($5,988) implies the $499/mo tier; this should be labeled explicitly
- Calculator doesn't show sensitivity to the retention rate assumption — a CFO will change that number immediately

**Fix recommendation:**  
Add a source citation under the 65% retention rate: "Based on Pinetree CC demo results (300 members, Q4 2025). Individual results vary." Make the retention rate a visible slider input so buyers can stress-test the model. This converts a marketing claim into a buyer-owned projection.

---

### home-slice-12.png — Proof Section ("Intelligence in action: live demo results")
**Grade: A-**

**Technical credibility strengths:**
- Source attribution: "Metrics from the Pinetree CC demo environment (300 members, real system data). Founding partner case studies publishing Q2 2026." — explicitly labels data source and timeline
- Four metrics with methodology callouts: "6 days" (CRM + tee sheet signal correlation explained), "91%" (methodology: ranking by retention value not timestamp), "$312" (from $187 baseline by backfilling high-engagement members), "$1.38M" (23 members flagged across four signal types)

**Technical credibility gaps:**
- "Founding partner case studies publishing Q2 2026" — this is a future promise. A buyer in April 2026 will wonder if these have published yet (given today's date of 2026-04-14, they may be overdue)
- All metrics are from a single demo environment — one data point is not a pattern; a skeptical buyer needs N>1
- No confidence interval or variance shown on any metric

**Fix recommendation:**  
Update the timeline to reflect current date: if Q2 2026 case studies are not yet published, change to "Q3 2026" or link to a published study if available. Add a second club's data point ("Results from two founding partner clubs, avg. 285 members") to get past the single-sample objection.

---

### home-slice-13.png — Founding Partner Program
**Grade: C**

**Technical credibility strengths:**
- "Our team configures your integrations, trains your staff, and validates your data in the first 2 weeks" — hands-on implementation specificity
- "Locked-in pricing for life" is a clear anti-lock-in signal

**Technical credibility gaps:**
- "Our team configures your integrations" — who? What is their technical background? The About page names three people but no integration engineers
- No mention of what validation means ("validates your data" — against what schema? What pass/fail criteria?)
- No SLA for the pilot period — if something breaks in week 3, what is the response time?

**Fix recommendation:**  
Add a technical qualifier: "Your dedicated integration engineer will connect your Jonas/ForeTees/POS systems and validate data completeness before go-live. Named support contact throughout the pilot." This surfaces the human accountability that reduces perceived risk.

---

### home-slice-14.png — Testimonials ("Built with the GMs who live it")
**Grade: D**

**Technical credibility strengths:**
- Testimonials are categorized by use case (Member Retention, Demand Optimization, Board Reporting) — signals functional depth
- Quote attribution format includes role, club size, and pilot status — partially verifiable

**Technical credibility gaps:**
- All names withheld through Q2 2026: "D. Marchetti — GM, Founding partner, 380-member private club — Name withheld through Q2 2026 pilot" — a skeptical buyer treats anonymous testimonials as fabricated
- No named club, no named person, no named outcome with a verifiable number in any testimonial
- "Our waitlist fill rate jumped from 67% to 91% in the first month" — compelling but from anonymous source with no club context

**Fix recommendation:**  
If one founding partner is willing to be named before Q2, use them prominently. Even: "380-member private club in the Southeast (name pending Q2 2026 case study release)" with a city or state removes some anonymity. Add a specific number to each quote: "We saved approximately $85K in dues revenue we would have lost." Anonymous quotes with vague outcomes are the weakest form of social proof.

---

### home-slice-15.png — FAQ
**Grade: B-**

**Technical credibility strengths:**
- FAQ question "We already have Jonas and ClubEssential. Does Swoop replace them?" — explicitly addresses the #1 integration anxiety by naming two real systems
- Answer correctly explains the intelligence-layer model: "Your CRM keeps storing records. Swoop connects those records to your tee sheet and POS in real time."

**Technical credibility gaps:**
- "Is my members' data secure?" is a FAQ question that is collapsed (not expanded) in the screenshot — the most important security question is hidden below the fold with no visible answer
- "How long does setup take?" and "Do I need to replace my current software?" are collapsed — their answers are presumably the strongest technical rebuttals but are not visible
- No FAQ about data residency, GDPR/CCPA, API credentials storage, or what happens at contract termination

**Fix recommendation:**  
Expand "Is my members' data secure?" as the default-open FAQ item. The answer should be at minimum 3 sentences: read-only access, encryption standards, and data residency. Add a new FAQ: "Who holds the API credentials?" with answer: "Swoop uses OAuth tokens stored in encrypted vaults. You can revoke access at any time from your Jonas/ClubEssential admin panel."

---

### home-slice-16.png — Demo CTA / Footer
**Grade: C**

**Technical credibility strengths:**
- "Book a live walkthrough with your own operating scenarios: tee sheet leakage, at-risk members, F&B staffing pressure, and revenue pipeline blind spots" — scenario-specific framing reduces vagueness
- "No credit card required · 30-minute walkthrough · Cancel anytime" — removes friction signals

**Technical credibility gaps:**
- Form collects Name, Club, Email, Phone — no mention of what happens with that data (privacy policy not linked inline)
- No mention that the demo will use real club data vs. demo data — a GM might hesitate to submit contact info if they think it means their data is being imported pre-consent
- Footer: "Investor Information" link but no Privacy Policy, Terms of Service, or Security page linked

**Fix recommendation:**  
Add below the form: "We'll prepare a demo using Pinetree CC sample data — no club system access required until you decide to proceed." Add footer links: Privacy Policy | Security | Terms of Service. The absence of these links is a deal-stopper for any club with a legal or compliance reviewer in the chain.

---

### home-mobile-full.png — Mobile View
**Grade: C**

**Technical credibility strengths:**
- Integration grid and core messaging carry through to mobile
- Key trust signals (28 integrations, 2-week setup) visible in mobile viewport

**Technical credibility gaps:**
- Agent panel with "Six AI agents" collapses to single-column — the individual agent descriptions become very small and lose the "each agent has a defined scope" credibility signal
- Integration category labels and system names (ForeTees, Jonas, etc.) are likely too small to read at mobile resolution
- ROI calculator likely requires horizontal scrolling — complex interactive element on mobile destroys the credibility of the claim

**Fix recommendation:**  
On mobile, prioritize the integration category names over the hub diagram. The visual hub is decorative; the named systems are credibility. Ensure integration names are legible at 375px viewport width.

---

## PLATFORM PAGE

---

### platform-hero.png / platform-slice-00.png
**Grade: C+**

**Technical credibility strengths:**
- "Five AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue" — names the five data sources specifically
- "Delivered before 6:15 AM" — operationally specific delivery mechanism, implies scheduled processing not just real-time

**Technical credibility gaps:**
- "AI-powered lenses" is marketing language with no technical substance — what is a "lens"? A report? A model? A dashboard view?
- No explanation of the underlying model architecture, data pipeline, or how "before 6:15 AM" is technically achieved (batch job? streaming? cron?)
- No data freshness or uptime SLA stated

**Fix recommendation:**  
Replace "AI-powered lenses" with "Five intelligence modules, each pulling live data from your existing systems. Processed overnight and delivered by 6:15 AM via your GM dashboard." This is the same message with 40% more technical credibility.

---

### platform-slice-01.png — Problem Repetition (flying blind)
**Grade: C**

**Technical credibility strengths:**
- Confidence scores (91%, 88%, 44%) add a quantitative signal that this is not just narrative
- "Why this surfaced" sub-label on each card implies a signal-attribution system

**Technical credibility gaps:**
- Same panel as home page — no additional technical specificity added for the platform audience, who arrived here wanting deeper detail
- Confidence score methodology still unexplained — on the platform page, this is a larger omission than on the home page
- No technical architecture diagram or data flow shown anywhere on the platform page

**Fix recommendation:**  
For the platform page audience (more technical, already past the home page), expand the "Why this surfaced" sub-labels with the actual signals: "Signal: CRM complaint + POS spend decline + tee sheet cancellation within 14 days." This is what a technical evaluator needs to trust the score.

---

### platform-slice-02.png — "The right action. The right person."
**Grade: B**

**Technical credibility strengths:**
- Shows the actual AI-generated output (callback script, comp offer, shift change) with GM approval interface — "GM approved" badge is visible
- "Every signal sourced. Every action approved. Every outcome attributed" — three-part accountability statement

**Technical credibility gaps:**
- The terminal-style UI showing the drafted callback message is compelling but doesn't attribute which model generated it
- "$32K saves / $67K dues protected" metrics — no sample size, no time period shown
- "9/14 members retained" — no explanation of the denominator (14 what? At-risk members in a period? All interventions?)

**Fix recommendation:**  
Add a model attribution line in the agent action UI: "Draft generated by Swoop AI (Claude Sonnet) — review before sending." Add a sample context line to the metrics: "Results from Pinetree CC demo, 90-day period." This makes the numbers auditable.

---

### platform-slice-03.png — Five Core Capabilities (detail)
**Grade: B-**

**Technical credibility strengths:**
- Data source labels are explicit on each capability card: "CRM + POS + Email," "Tee Sheet + Weather + Waitlist," "POS + Tee Sheet + Weather," "Scheduling + Tee Sheet," "Revenue + CRM + POS"
- Specific metrics per capability: 6.4 wks early warning, 91% fill rate, $5.7K monthly F&B upside, 223x ROI on alert, $251K annualized impact

**Technical credibility gaps:**
- All five capabilities list data sources but none explain what the model does with them (correlation? regression? LLM summarization?)
- "Revenue & Pipeline" shows "$251K annualized impact" — is this across all clubs? One club? A projection?
- No mention of model accuracy, false positive rate, or how the system learns over time

**Fix recommendation:**  
Under each capability, add a one-line model note: "Member Intelligence: Gradient-boosted health score updated nightly from CRM + tee sheet + POS activity." Even a partial technical description converts a black-box into a glass box.

---

### platform-slice-04.png — Six AI Agents (Platform page)
**Grade: D**

**Technical credibility strengths:**
- Same agent panel as home page — six named agents with defined scopes
- "91% fill" projected impact is specific

**Technical credibility gaps:**
- Identical content to home page agent panel — the platform page buyer came here for more depth; repeating the same shallow agent descriptions is a missed opportunity
- Still no model attribution, no failure mode discussion, no human-override mechanism visible
- "Demand Optimizer: Balances waitlist demand, cancellation prediction, and tee sheet fill optimization" — three functions with no explanation of how any of them work

**Fix recommendation:**  
On the platform page, expand agent cards with one additional line each: "Cancellation prediction uses 14-day weather + historical no-show patterns from your ForeTees data." This is the depth platform-page visitors expect. The home page version can stay shallow.

---

### platform-slice-05.png — Agent Detail / Agent Grid
**Grade: C+**

**Technical credibility strengths:**
- Activity feed showing real-time agent events (timestamped) gives operational credibility
- "Pre-route openings to top 5 retention-priority members" is a specific, auditable action

**Technical credibility gaps:**
- Activity feed timestamps visible but no latency claim — "real time" means different things; is this 5 seconds, 5 minutes, 5 hours?
- "91% fill" projected impact — projected by whom? The AI? A backtested model? A marketing assumption?
- No UI for disabling an agent or adjusting its thresholds — suggests no configurability

**Fix recommendation:**  
Add a "Configure" button or "Threshold settings" mention to the agent panel to signal that agents are tunable, not hardcoded. Add a latency label: "Signals processed every 15 minutes. Agent recommendations delivered in your next morning brief." This converts "real time" from vague to auditable.

---

### platform-slice-06.png — Member Experience Narrative ("Your members feel it")
**Grade: D**

**Technical credibility strengths:**
- The three-scenario narrative (The Arrival, The Nudge, The Milestone) illustrates cross-system data integration concretely: pro shop + tee sheet + dining + anniversary recognition
- "Swoop tracked round milestones across six years of data" — implies historical data ingestion capability

**Technical credibility gaps:**
- This section has zero technical claims — it is pure narrative with no data sources, no system names in the body text, no API calls referenced
- "The club that knows you — before you walk in" is emotionally resonant but raises immediate privacy questions (who approved this data aggregation? Can members opt out?)
- No mention of member consent for behavioral tracking, GPS data use, or historical data retention period

**Fix recommendation:**  
Add a one-line disclosure at the bottom of this section: "Member personalization uses data from your existing Jonas/ClubEssential member profile. No new data collection without member consent." Without this, the narrative reads as surveillance, not service.

---

### platform-slice-07.png — Integrations Intro (Platform page)
**Grade: B-**

**Technical credibility strengths:**
- Same integration architecture copy as home page — accurate description of the intelligence layer
- "Real-Time Location Intelligence: GPS and behavioral data from the Swoop member app" is specific

**Technical credibility gaps:**
- Duplicate of home page content on platform page — platform visitors deserve more technical depth
- Still no privacy qualification on GPS data
- "AI-Powered Predictive Recommendations" — no model name, no prediction horizon, no accuracy metric

**Fix recommendation:**  
On the platform page version of this section, add a "How it connects" technical callout box: "Swoop uses OAuth 2.0 read-only API tokens for Jonas, ForeTees, and ClubEssential. Tokens stored in AWS KMS. Connections auditable from your admin panel." This is the technical depth the platform page audience came for.

---

### platform-slice-08.png — Integration Grid (Platform page)
**Grade: A-**

**Technical credibility strengths:**
- Same comprehensive named-integration grid as home page — 28 named systems across 8 categories
- 10-business-day rollout timeline with week-by-week breakdown

**Technical credibility gaps:**
- Connection type (API/webhook/CSV) still not shown
- No "certified" vs. "community" integration tier distinction
- Data refresh frequency absent
- No mention of error handling when a source system is unavailable

**Fix recommendation:**  
On the platform page (the deeper technical audience), add a "Connection Details" expandable section per category showing: connection type, authentication method, sync frequency, and support tier. This is the technical appendix IT buyers need before approving a vendor.

---

### platform-slice-09.png — Comparison Table (Platform page)
**Grade: C**

**Technical credibility strengths:**
- Comparison table correctly positions Swoop as an intelligence layer above point solutions
- Features are specific enough to be auditable (Member health intelligence, Cross-system analytics, AI agent automation)

**Technical credibility gaps:**
- Same content as home page — no additional technical detail for platform audience
- "AI agent automation" checkmark with no footnote explaining what "automation" means in practice (does it send emails? Make bookings? Move waitlist slots?)
- No security/compliance row

**Fix recommendation:**  
Add a "Read-only data access" row to the comparison where Swoop = "Yes — never writes to your systems," Your CRM = "N/A (it is your system)," and Spreadsheets = "Manual export." This directly addresses the IT buyer's #1 concern in the comparison frame.

---

### platform-slice-10.png — "Why not just use..." (Platform page)
**Grade: C**

**Technical credibility strengths:**
- Three objection handlers are technically accurate and honest
- "A CRM tells you who resigned. Swoop tells you who's about to." — clean differentiation

**Technical credibility gaps:**
- "Swoop's AI agents monitor behavioral signals in real time" — still no model attribution, still no signal definition
- No privacy/data handling reassurance anywhere on the platform page footer
- Platform page ends with no security statement, no compliance mention, no data handling summary

**Fix recommendation:**  
Add a technical trust footer to the platform page (separate from the global footer): "Data handling: Swoop reads your existing systems via read-only API. No member data is stored in Swoop beyond the intelligence layer's processing window. Delete-on-disconnect guaranteed." This is the security statement the entire platform page is missing.

---

## PRICING PAGE

---

### pricing-hero.png / pricing-slice-00.png — "The window is open" / Market stats
**Grade: D**

**Technical credibility strengths:**
- "In 2024, LLM infrastructure made that layer buildable in months, not years" — technically honest framing, positions the product as timely
- Market stats ($2.1B dues revenue at risk, 67% clubs on disconnected systems) provide market context

**Technical credibility gaps:**
- "LLM infrastructure" is named but the specific LLM Swoop uses is not named — a technical buyer will immediately ask "which LLM?"
- Market statistics have no source citation — $2.1B and 67% are presented as facts with no attribution
- "First platform built natively on that infrastructure for this vertical" — an extraordinary claim with no evidence

**Fix recommendation:**  
Cite the market statistics: "Source: NGCOA 2024 Annual Benchmark Report" (or actual source). Add model attribution: "Built on Anthropic Claude with proprietary club-intelligence training." Remove or qualify "first platform" claim — it's unverifiable and sounds like marketing inflation.

---

### pricing-slice-01.png — ROI Calculator (Pricing page)
**Grade: B**

See home-slice-11 for full analysis. On the pricing page, the calculator has additional context gap:

**Technical credibility gaps:**
- 65% retention rate assumption drives all ROI math but is still unsourced
- No mention of what the calculator is built on (client-side JS? Their actual model output?)

**Fix recommendation:**  
Same as home page: source the 65% retention rate assumption. Add: "Retention rate based on early-intervention cohort from Pinetree CC demo environment." On the pricing page specifically, buyers are in evaluation mode — the calculator is the make-or-break technical credibility moment.

---

### pricing-slice-02.png / pricing-slice-03.png — Pricing Tiers
**Grade: C+**

**Technical credibility strengths:**
- Three-tier structure with clear feature differentiation
- Integration limits are specific and auditable (3 active vs. 10 active integrations)
- "Swoop drafts the callback + comp + shift" on middle tier makes the AI output concrete

**Technical credibility gaps:**
- No SLA, uptime guarantee, or support response time at any tier
- "Automated playbooks + agent-driven actions" at $1,499 tier — "agent-driven actions" without guardrails language will alarm IT reviewers
- No data security tier differentiation — does the $0 tier have the same security posture as the $1,499 tier?
- No API access or export capability mentioned — vendor lock-in question is wide open

**Fix recommendation:**  
Add a pricing footer: "All tiers include: read-only API access · TLS 1.3 in transit · AES-256 at rest · 99.5% uptime SLA · Cancel anytime with 30-day notice." On the $1,499 tier, add: "Agent-driven actions require GM approval before execution." These two additions directly address the top four buyer fears.

---

### pricing-slice-04.png — Pricing FAQ
**Grade: C-**

**Technical credibility strengths:**
- FAQ names Jonas and ClubEssential specifically — the #1 displacement anxiety addressed by product name
- "How long does setup take?" and "What does a founding-partner pilot actually look like?" are relevant questions

**Technical credibility gaps:**
- Only three FAQ items visible — notably missing: "What data does Swoop store?", "Who owns the data?", "What happens when I cancel?", "Is Swoop SOC 2 certified?"
- "Is my members' data secure?" is absent from the pricing FAQ — this is the page where buyers are making financial decisions and the security question must appear here
- No privacy policy or terms link adjacent to the pricing table

**Fix recommendation:**  
Add three FAQ items to the pricing page: (1) "What data does Swoop store?" — Answer: read-only access, no member records retained. (2) "What happens if I cancel?" — Answer: Swoop removes API tokens, retains no member data. (3) "Is Swoop SOC 2 certified?" — Answer: SOC 2 Type II audit scheduled Q3 2026; current security practices available on request.

---

## ABOUT PAGE

---

### about-hero.png / about-slice-00.png — Team ("The humans in your clubhouse")
**Grade: B**

**Technical credibility strengths:**
- Jordan Mitchell: "Ex-Aplyxys hospitality tech, NASDAQ:AGYS. Eight years building behavioral prediction systems for clubs, resorts, and cruise lines." — Specific prior employer, stock ticker, and domain expertise
- Alex Chen: "Ex-Salesforce Industries. Six years turning operational data into daily workflows." — Specific enterprise SaaS background relevant to integration depth

**Technical credibility gaps:**
- Tyler Hayes: "Former club-tech operator. Ran member experience at a 300-member desert club. Ten years building SaaS for private clubs." — No company names, no technical credential, no code contribution
- No mention of security/compliance team, integration engineers, or data scientists — buyers wonder who actually builds and maintains the connectors
- No technical advisory board, investors, or external validators mentioned

**Fix recommendation:**  
Add a fourth team card: "Integration Engineering: [Name or title], ex-[company with golf tech background], responsible for connector certification and uptime." Even a team role without a named person signals that this function exists. Link "Tyler Hayes" to a LinkedIn — the founder lacking a company name or verifiable background is a credibility gap.

---

### about-slice-01.png — Moat / "Why this is hard to copy"
**Grade: A**

**Technical credibility strengths:**
- "#1 preferred Jonas Club integration partner" — specific, verifiable, and the most important technical credibility claim on the entire site
- "12 months of pilot data + model training" — quantified data advantage, not just a claim
- "46 production tools in orchestration" — specific infrastructure count
- "First MCP-native club platform" — technically specific architectural claim (MCP = Model Context Protocol, Anthropic's agent orchestration standard)

**Technical credibility gaps:**
- "Proprietary cross-system intelligence from 12 months of pilot data" — 12 months from one club (Pinetree CC) or multiple clubs? Sample size ambiguity weakens the moat claim
- "First MCP-native club platform" — not all buyers will know what MCP means; no explanation provided
- "#1 preferred Jonas Club integration partner" — is this self-declared? What does "preferred" mean — are there other competitors on Jonas's partner list?

**Fix recommendation:**  
This is the strongest panel on the site. Enhance it by: (1) Adding "Based on [N] pilot clubs" to the 12-month data claim. (2) Adding a parenthetical: "MCP (Anthropic Model Context Protocol) — the agent framework that lets our AI safely read and act across your club's systems." (3) If Jonas has a formal partner designation, link to it or add "Certified by Jonas Club" rather than "preferred."

---

### about-slice-02.png — Testimonials (About page)
**Grade: D**

**Technical credibility strengths:**
- Same testimonials as home page, same categorization

**Technical credibility gaps:**
- All three testimonials are still anonymous on the About page — the page titled "Who you'll work with" has no verifiable proof of who has actually worked with them
- "Name withheld through Q2 2026 pilot" appears in the attribution — today is April 14, 2026, which is Q2 2026. If these are still withheld, the timeline has slipped, which is a red flag
- No logos, no club names, no verifiable outcomes

**Fix recommendation:**  
Given that Q2 2026 has arrived (today is April 14, 2026), either: (a) Update with real attributed testimonials now that the pilot phase has technically entered Q2, or (b) Change the disclosure to "Q3 2026" with an honest explanation. Anonymous testimonials with a past-due attribution date will be caught by any due diligence process.

---

### about-slice-03.png — Proof Metrics (About page)
**Grade: A-**

**Technical credibility strengths:**
- Same four metrics as home page with methodology (6 days, 91%, $312, $1.38M), all from named Pinetree CC demo environment
- Methodology is transparently explained per metric (e.g., 91% fill rate: "Improved from 67% reactive fill rate by ranking waitlist members by retention value and match-fit, not just timestamp")

**Technical credibility gaps:**
- Single source (Pinetree CC) — same limitation as home page
- "Founding partner case studies publishing Q2 2026" — same timing issue; already Q2 2026

**Fix recommendation:**  
Same as home page: update the timeline or add a second club data point. On the About page specifically, the proof section is the culmination of a trust argument — a single-club sample is insufficient.

---

### about-slice-04.png — Founding Partner Program (About page)
**Grade: C**

**Technical credibility strengths:**
- "Our team configures your integrations, trains your staff, and validates your data in the first 2 weeks" — same specific onboarding claim
- Program structure (Hands-on Onboarding, Shape the Roadmap, Locked-in Pricing) addresses multiple buyer concerns

**Technical credibility gaps:**
- No technical qualification of "configures your integrations" — who does this? What's their background? What systems are they certified on?
- No mention of what "validates your data" means technically — schema check? Completeness threshold? Data quality score?
- No pilot exit criteria — what does success look like at the end of the 6-month pilot?

**Fix recommendation:**  
Add a technical success criterion to the onboarding section: "Your pilot is live when: (1) All three primary connectors active and syncing, (2) First GM morning brief delivered, (3) At least one member health score generated from live data." This makes the onboarding concrete and auditable.

---

### about-slice-05.png — About Page FAQ
**Grade: C-**

**Technical credibility strengths:**
- Same Jonas + ClubEssential specific FAQ answer
- "Is my members' data secure?" appears as a question (collapsed)

**Technical credibility gaps:**
- "Is my members' data secure?" is collapsed — this is the most critical question on the About page for a buyer doing final due diligence and it requires clicking to expand
- Only four FAQ items on the About page — missing: data ownership, API credential handling, CCPA/privacy compliance
- No security/compliance page linked anywhere on the About page

**Fix recommendation:**  
Expand the security FAQ by default on the About page. Answer at minimum: (1) Read-only API access, (2) Encryption standards, (3) Data residency (US-based infrastructure), (4) Revocation process. Add a link: "Full security details available in our Trust & Security overview [link]." Even a one-page security document would address this gap.

---

## CONTACT PAGE

---

### contact-hero.png / contact-slice-00.png — Demo CTA with Pilot Results
**Grade: B+**

**Technical credibility strengths:**
- "Pilot Results — Fox Ridge Country Club (300 Members)" — finally, a named club! This is the strongest trust signal on the contact page
- Four specific metrics: $1.38M in at-risk dues identified, 3 silent-churn members flagged, 91% tee-sheet fill rate, 9/14 members retained

**Technical credibility gaps:**
- "Fox Ridge Country Club" is named but not verifiable from the page — no state, no website link, no club contact
- 9/14 members retained — the denominator (14) is not explained; 14 what? All at-risk members? A specific cohort?
- No time period shown for the pilot results — 90 days? 6 months? One season?

**Fix recommendation:**  
Add a location and time period: "Fox Ridge Country Club, Southeast, 300 members. Results from 90-day founding partner pilot, Q4 2025." If Fox Ridge approves, add their general manager's first name and title. A named club with a named contact is 10x more credible than metrics alone.

---

### contact-slice-01.png — Demo Form / Footer
**Grade: D**

**Technical credibility strengths:**
- "No credit card required · 30-minute walkthrough · Cancel anytime" reduces friction

**Technical credibility gaps:**
- Form collects Name, Club, Email, Phone with no privacy statement inline — no link to Privacy Policy
- No mention of what happens with the submitted data — is it stored in HubSpot? Shared with third parties?
- Footer has "Investor Information" link but no Privacy Policy, Terms of Service, Security page, or Trust Center
- No HTTPS/security indicator, no trust seal, no compliance mention

**Fix recommendation:**  
Add below the form submit button: "By submitting this form you agree to our [Privacy Policy]. We use HubSpot to manage demo requests. Your data is never sold or shared." Add footer links: Privacy Policy | Terms of Service | Security. These are not optional for a product handling member PII data — their absence signals organizational immaturity to any IT or legal reviewer.

---

## PRIORITIZED TOP-10 TECHNICAL CREDIBILITY FIXES

Ranked by buyer-fear impact × implementation effort ratio (highest impact, lowest effort first):

---

### Fix #1 — Add a data handling statement to every page (CRITICAL)
**Page(s):** All pages  
**Buyer fear:** Data security, privacy  
**Fix:** Add a single sentence to the site footer and to every integration/agent section: "Swoop uses read-only API access. No member records are stored by Swoop. Access revocable at any time from your existing system's admin panel."  
**Effort:** 30 minutes  
**Impact:** Eliminates the #1 deal-killer for IT reviewers and legal approvers

---

### Fix #2 — Add Privacy Policy, Terms of Service, and Security page links to the footer (CRITICAL)
**Page(s):** All pages (footer)  
**Buyer fear:** Data security, vendor maturity  
**Fix:** Add three footer links: Privacy Policy, Terms of Service, Security (even a one-page overview). The current footer with only "Investor Information" signals that the company has not thought about buyer-facing compliance.  
**Effort:** 1 hour to write; 15 minutes to implement  
**Impact:** Required for any club with a board, attorney, or IT director in the procurement chain

---

### Fix #3 — Expand the "Is my members' data secure?" FAQ as default-open on every page it appears (HIGH)
**Page(s):** Home (slice-15), About (slice-05), Pricing (slice-04)  
**Buyer fear:** Data security  
**Fix:** Expand this FAQ item by default. Write a 4-sentence answer: read-only access, TLS/AES-256 encryption, US-based data residency, and API revocation process. Add: "SOC 2 Type II audit scheduled Q3 2026."  
**Effort:** 1 hour  
**Impact:** Converts the most-asked security question from a hidden obstacle into a visible trust signal

---

### Fix #4 — Add model attribution to every AI/agent claim (HIGH)
**Page(s):** Home (slices 06, 08), Platform (slices 04, 05), Pricing (slice 03)  
**Buyer fear:** AI claim legitimacy  
**Fix:** Add "Powered by Anthropic Claude with proprietary club-intelligence models" to the agents section header. In agent action UIs, show: "Draft generated by Swoop AI — review before sending."  
**Effort:** 2 hours  
**Impact:** Converts "AI" from buzzword to auditable claim; directly answers "is this real AI or a rules engine?"

---

### Fix #5 — Add connection type and data refresh frequency to the integration grid (HIGH)
**Page(s):** Home (slice-08), Platform (slice-08)  
**Buyer fear:** Integration reliability, IT burden  
**Fix:** Add icon badges per integration: API (read-only), Webhook, CSV. Add a data freshness note: "Tee sheet and POS: real-time. CRM and payroll: nightly sync." Add: "Connectors certified on Jonas v12+, ForeTees 8.x, ClubEssential 2024."  
**Effort:** 3 hours  
**Impact:** Eliminates the most common pre-demo technical question from IT evaluators

---

### Fix #6 — Source the 65% retention rate in the ROI calculator (HIGH)
**Page(s):** Home (slice-11), Pricing (slice-01)  
**Buyer fear:** AI claim legitimacy, ROI validity  
**Fix:** Add: "65% early-intervention retention rate based on Pinetree CC demo cohort (300 members, Q4 2025). Individual results vary." Make the retention rate a visible slider input so buyers can stress-test the assumption.  
**Effort:** 2 hours  
**Impact:** Converts the most important number on the site from a marketing claim into a buyer-owned projection

---

### Fix #7 — Add human-in-the-loop language to the agents panel (MEDIUM-HIGH)
**Page(s):** Home (slice-06), Platform (slice-04, 05)  
**Buyer fear:** AI claim legitimacy, IT burden  
**Fix:** Add below the agent grid: "No agent takes action without GM approval. Swoop drafts — your team decides. Every action logged with source signal and outcome." This is a feature, not a disclaimer.  
**Effort:** 30 minutes  
**Impact:** Removes the highest-risk objection for board-level and IT reviewers

---

### Fix #8 — Name Fox Ridge Country Club (or other pilot club) with location and time period on the contact page (MEDIUM)
**Page(s):** Contact (hero)  
**Buyer fear:** AI claim legitimacy, social proof  
**Fix:** Add: "Fox Ridge Country Club, [State], 300 members. Founding partner pilot, Q4 2025." If approved, add GM first name and title.  
**Effort:** 15 minutes (with club permission)  
**Impact:** The only named club on the site; making it fully verifiable multiplies its credibility 3x

---

### Fix #9 — Update Q2 2026 case study timelines or replace with published content (MEDIUM)
**Page(s):** Home (slice-12), About (slices 02, 03)  
**Buyer fear:** Vendor credibility, AI claim legitimacy  
**Fix:** Today is April 14, 2026 — Q2 2026. If case studies are not published, change "publishing Q2 2026" to a specific month ("publishing June 2026") or remove the timeline and replace with "Case studies available on request." If studies are published, link to them.  
**Effort:** 30 minutes  
**Impact:** A past-due promised deliverable visible on the site undermines all other credibility claims

---

### Fix #10 — Add a "Data Ownership & Exit" section to pricing page (MEDIUM)
**Page(s):** Pricing (slice-02/03)  
**Buyer fear:** Vendor lock-in  
**Fix:** Add a single row or footer note: "If you cancel: Swoop removes all API tokens within 24 hours. No member data is retained. Full activity log exportable at any time." This is the vendor lock-in objection answered in three sentences.  
**Effort:** 30 minutes  
**Impact:** Directly addresses the "what if this doesn't work out?" question that every GM asks in private but rarely voices

---

## OVERALL SITE GRADE SUMMARY

| Page | Section | Grade |
|---|---|---|
| Home | Hero | B |
| Home | Trust Bar | B+ |
| Home | Problem framing | C |
| Home | Platform overview | C+ |
| Home | Comparison table | C |
| Home | Objection handlers | C |
| Home | AI Agents panel | D |
| Home | Integrations intro | B- |
| Home | Integration grid | A- |
| Home | ROI calculator | B |
| Home | Proof metrics | A- |
| Home | Founding partner | C |
| Home | Testimonials | D |
| Home | FAQ | B- |
| Home | Demo CTA / footer | C |
| Platform | Hero | C+ |
| Platform | Problem repeat | C |
| Platform | Right action | B |
| Platform | Five capabilities | B- |
| Platform | Agent panel | D |
| Platform | Member experience | D |
| Platform | Integration grid | A- |
| Platform | Comparison | C |
| Platform | Why not just... | C |
| Pricing | Hero / market stats | D |
| Pricing | ROI calculator | B |
| Pricing | Tier features | C+ |
| Pricing | FAQ | C- |
| About | Team | B |
| About | Moat | A |
| About | Testimonials | D |
| About | Proof metrics | A- |
| About | Founding partner | C |
| About | FAQ | C- |
| Contact | Hero / pilot results | B+ |
| Contact | Form / footer | D |

**Overall site technical credibility grade: C+**

The site has genuine strengths (named integrations, specific rollout timeline, moat section on About page) but fails on the four issues that kill enterprise SaaS deals: missing privacy/security disclosure, anonymous testimonials with past-due attribution dates, AI claims without model attribution or human-override language, and no footer links to Privacy Policy or Terms of Service. The gap between the marketing ambition and the trust infrastructure is the primary credibility risk.
