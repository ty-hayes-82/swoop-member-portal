# Six AI Agents — Live OS Panel + Agent Grid — Section Score

**Overall Grade: B-**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | "Six AI agents working your club — live" is a strong hook; agent names are credible |
| Design/Visual | B+ | Dark OS panel is visually distinctive; card grid below is clean and scannable |
| CRO/Conversion | C | No CTA surfaces anywhere in this dense product section |
| Trust/Credibility | C+ | "LIVE · 6 AGENTS ONLINE" is compelling but unverified; no club attribution |
| Mobile UX | C- | Dark panel UI will be unreadable at mobile width; six-agent grid will collapse badly |
| Navigation/UX | B- | "swoop.io / agents / stream" breadcrumb in panel adds verisimilitude |
| B2B Buyer Journey | B- | Correct placement — GMs need to see the product before pricing |
| Copy/Voice | B | Agent names are functional; "NPS +14" projected impact is specific and credible |
| Technical Credibility | B+ | Real signals (42min wait, satisfaction trending -23%) give the panel technical weight |

---

## Messaging/Positioning
**Grade: B**
- What's working: "Six AI agents working your club — live" is the clearest product claim on the page. The agent names (Service Recovery, Demand Optimizer, Member Pulse, Labor Optimizer, Revenue Analyst, Engagement Autopilot) map directly to the pain vocabulary a GM uses — this isn't "AI features," it's operational roles a GM can mentally hire.
- What's broken: The word "agents" is overloaded in the market right now. Without a one-line differentiation from generic AI tools (ChatGPT, CRM copilots), GMs may mentally bucket this as "another AI add-on." The panel shows an "NPS CONFERENCE" tag on the Service Recovery card — this context is unclear without explanation.
- Fix: Add a single differentiator sentence beneath the headline: "Unlike generic AI, each Swoop agent is trained on golf club operational data — and acts on your systems, not just your prompts." Also change "NPS CONFERENCE" tag to "ACTIVE ALERT" or add a tooltip: "NPS Conference = member NPS score falling below club baseline."

---

## Design/Visual
**Grade: B+**
- What's working: The dark terminal-style OS panel is the most visually distinctive element on the homepage. It signals "real software" not a marketing mock. The activity feed on the left with agent names + timestamps creates a sense of live, active monitoring. The amber/orange accent color on "RECOMMENDED ACTION" creates strong visual hierarchy.
- What's broken: The panel is rendered at a scale where key details (activity feed text, breadcrumb navigation, timestamp values) require straining to read — likely 11–12px text in the screenshot. The transition from the dark panel back to white agent cards below lacks a visual connector. The six agent cards in the lower grid use very small icon illustrations that don't add meaningful visual differentiation.
- Fix: Increase activity feed line height and minimum font size to 13px. Add a subtle gradient bleed (dark → white) between the OS panel and the agent card grid. Replace the small orange circular icons on agent cards with a distinctive icon per agent role (a heartbeat for Member Pulse, a clock for Labor Optimizer, etc.) — these are free to implement with Lucide or Heroicons.

---

## CRO/Conversion
**Grade: C**
- What's working: The live-activity demo is the most persuasive element on the page — a GM who watches it self-sells.
- What's broken: There is no CTA anywhere in this section. A GM who sees "Service Recovery → Trigger captain callback + meal-comp playbook → NPS +14" and thinks "I want that" has no next step. No "Book a demo", no "See all six agents", no "Start free." The section ends and the buyer momentum dissipates.
- Fix: Add a sticky or inline CTA immediately below the agent card grid: a full-width light-orange banner reading "Your club has the same signals. Swoop surfaces them automatically." with a single button: "Book the 30-Minute Walkthrough →". Alternatively, add a hover state on each agent card that surfaces: "See [Agent Name] in action →" linking to an agent-specific demo page.

---

## Trust/Credibility
**Grade: C+**
- What's working: "LIVE · 6 AGENTS ONLINE" with a green dot is the right instinct — live system state signals real software. The specific metrics in the panel (42min wait, satisfaction trending -23%, NPS +14 projected) give the demo technical credibility. These aren't rounded marketing numbers.
- What's broken: Nothing anchors this to a real club. Is this a live demo environment? A staging scenario? A real club's data? "Real scenarios from the Swoop OS" in the subhead is vague. A skeptical GM will wonder if these numbers are fabricated for the website.
- Fix: Add a one-line attribution beneath the OS panel: "Scenario shown: Grill Room delay detected at Oak Hill Country Club — Thursday lunch service, 2:14 PM." or if real clubs can't be named: "Composite scenario drawn from 47 active Swoop deployments, April 2025." This small addition transforms "marketing demo" into "evidence."

---

## Mobile UX
**Grade: C-**
- What's working: The six-agent card grid will stack to 2×3 on tablet, which is workable.
- What's broken: The dark OS panel is a complex multi-column layout (activity feed left, detail panel right, breadcrumb nav top) that will be nearly unreadable on mobile. At 375px width, either the panel overflows horizontally or both columns collapse into unnavigable stacked content. The "NPS +14" projected impact in large amber text will be the only readable element on mobile.
- Fix: At `max-width: 768px`, render the OS panel as a single-column mobile card: show only the active agent detail (Service Recovery scenario), hide the activity feed sidebar, and increase all text to minimum 14px. Add a `<` `>` stepper to cycle through agents on mobile. Agent grid should render 1 column on phones, 2 columns on tablet.

---

## Navigation/UX
**Grade: B-**
- What's working: The panel includes "swoop.io / agents / stream" breadcrumb which reinforces that this is a navigable product, not a slideshow. The agent grid below with consistent card format makes comparison easy.
- What's broken: The auto-cycle behavior (mentioned in subhead: "This panel auto-cycles through real scenarios") means GMs who want to study a specific agent can't pause it — they're forced to watch passively. No pause, replay, or "explore [agent]" interaction is shown.
- Fix: Add a visible pause/play control to the OS panel (a small `⏸` icon in the top-right corner of the panel). Add a tab row above the activity feed listing all 6 agents by name so users can click directly to the scenario they care about most.

---

## B2B Buyer Journey
**Grade: B-**
- What's working: Showing the product in action at this point in the page (post-objection handling, pre-pricing) is the correct MOFU placement. A GM who has read the objection cards and now sees the product running live is in the right mental state to evaluate pricing.
- What's broken: The section ends without a transition to "what does this cost?" — the buyer has seen the product but has no bridge to the next decision stage. The agent cards in the lower grid have descriptions that are useful but don't convey urgency or outcome ("Detects early disengagement signals and proposes intervention windows before members resign" is correct but passive).
- Fix: Add urgency language to each agent card description. Example — Member Pulse: "Detects early disengagement — typically 6–8 weeks before a member calls to resign. Gives you the window to act." End the section with: "These six agents run 24/7 across your tee sheet, POS, and member data. No extra staff required." linking to the integrations section below.

---

## Copy/Voice
**Grade: B**
- What's working: "Trigger captain callback + meal-comp playbook" as a recommended action is excellent — it's specific, operational, and exactly the language a Food & Beverage director uses. "NPS +14" as projected impact is the right metric for a GM audience. Agent names are functional job titles, not tech buzzwords.
- What's broken: "Watch what the agents surface, recommend, and protect in real time" uses three verbs where one strong one would do. "This panel auto-cycles through real scenarios from the Swoop OS" is product-manager language, not GM language. "Forecasts staffing gaps and recommends coverage shifts to protect service quality and margin" (Labor Optimizer) is one sentence doing too much work.
- Fix: Replace subhead: "Watch the agents surface risks and close them — in real time." Replace panel descriptor: "This is a live Swoop session. The scenarios are real." Split Labor Optimizer description: "Forecasts staffing gaps 72 hours out. Recommends shift changes before service quality drops."

---

## Technical Credibility
**Grade: B+**
- What's working: The OS panel is the strongest technical credibility signal on the entire homepage. Showing a detected signal ("Grill Room — 42min wait — satisfaction trending -23%"), a recommended action ("Trigger captain callback + meal-comp playbook"), and a projected outcome ("NPS +14, member retained") is the complete intelligence loop — detect → recommend → outcome. This is what sets Swoop apart from dashboard tools.
- What's broken: "Demand Optimizer: Balances waitlist demand, cancellation prediction, and tee sheet fill optimization" describes what it does but not how — which data sources feed it? What's the prediction model? B2B buyers at the evaluation stage want to know the mechanism.
- Fix: Add a "Data Sources" micro-label to each agent card. Example — Demand Optimizer: "Feeds from: Tee Sheet, Weather API, Historical Fill Rates." Member Pulse: "Feeds from: POS, Access Control, App Engagement, CRM." This takes 2 lines per card and dramatically increases technical credibility for the GM who is asking "how does it actually know this?"

---

## Top 3 Priority Fixes for This Section
1. Add a CTA below the agent card grid — this is the highest-intent moment on the page and there is no conversion surface; add "Book the 30-Minute Walkthrough →" immediately below the six agent cards.
2. Add attribution to the OS panel scenario ("Composite scenario from 47 active deployments, April 2025") — without it, the "LIVE · 6 AGENTS ONLINE" claim reads as a marketing fabrication to a skeptical GM.
3. Rebuild the OS panel for mobile as a single-column card with agent stepper — the current two-column layout will be unreadable at 375px and this is the product's most important demo moment.
