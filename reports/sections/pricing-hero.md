# Pricing Hero — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C | Hero copy is market-framing, not pricing-page specific — visitor doesn't know where they are |
| Design/Visual | B- | Dark background works but stat cards use identical styling with no visual hierarchy |
| CRO/Conversion | D+ | Zero pricing-specific CTA above the fold; "Book a Demo" in nav is the only action |
| Trust/Credibility | C | Stats are unsourced; $2.1B claim lands with no citation |
| Mobile UX | C- | Three stat cards horizontally stacked will collapse poorly on small screens |
| Navigation/UX | B | Nav is clean; active "Pricing" state is visible |
| B2B Buyer Journey | C- | GM arriving on /pricing wants plans and numbers — this section delays that with philosophy |
| Copy/Voice | C | "The window is open. For a little while longer." is clever but wrong for a pricing page |
| Technical Credibility | D | No mention of integrations, data sources, or what "intelligence layer" means technically |

## Messaging/Positioning
**Grade: C**
- What's working: The "WHY NOW" framing creates urgency and the market-context paragraph is accurate.
- What's broken: A GM landing on /pricing is in evaluation mode, not awareness mode. This hero re-teaches the problem instead of validating the price. There is no headline connecting urgency to the value proposition of the plans below.
- Fix: Replace headline and subhead with: `PRICING` label above, headline: **"One platform. Three ways in."** Subhead: **"Start free with Signals. Upgrade when the ROI is obvious — usually within 30 days."** Keep stats but reframe them as the cost of inaction that Swoop's plans address.

## Design/Visual
**Grade: B-**
- What's working: High-contrast dark background separates this section. Orange accent on numbers is attention-grabbing.
- What's broken: All three stat cards are identically styled with no visual weight difference. The most important number ($2.1B) is centre-positioned but carries no more visual authority than the flanking stats. Body text under the headline is too light and small at this contrast level.
- Fix: Apply `font-size: 0.875rem; letter-spacing: 0.02em;` to stat labels. Make $2.1B card 10% wider than flanking cards. Increase body paragraph to `font-size: 1rem; line-height: 1.7; max-width: 52ch;`.

## CRO/Conversion
**Grade: D+**
- What's working: The nav CTA "Book a Demo" is always visible.
- What's broken: A pricing page hero with no in-section CTA is a conversion hole. There is no anchor link to the plans, no "See Plans" button, no free-tier call-out. The visitor has to scroll blind.
- Fix: Add a two-button CTA row below the stats: Primary — `<button>See Plans & Pricing</button>` (smooth-scrolls to plans section). Secondary — `<button>Start Free — No Credit Card</button>` (links to Signals sign-up). Both sit on the dark background using the existing orange/white button system.

## Trust/Credibility
**Grade: C**
- What's working: Three specific data points feel researched rather than made-up.
- What's broken: None of the three stats have a source. "$2.1B Annual dues revenue at risk from preventable churn" is a large claim with no citation. "3,000+ Private clubs in the US with 200+ members" needs a source (NGCOA? Club Benchmarking?). Without attribution, a sceptical GM dismisses them.
- Fix: Add micro-attribution beneath each stat: `Source: NGCOA 2023 Industry Report` beneath 3,000+. `Source: Club Benchmarking, avg dues × estimated 5% annual churn` beneath $2.1B. `Source: Club Benchmarking Technology Survey 2023` beneath 67%.

## Mobile UX
**Grade: C-**
- What's working: Text stack is readable at medium widths.
- What's broken: Three stat cards in a horizontal row will compress to unreadable widths on phones below 480px. No evidence of a stacked single-column fallback. The dark section with small subtext is particularly poor on OLED screens with aggressive auto-brightness.
- Fix: Add `@media (max-width: 640px) { .stat-cards { flex-direction: column; gap: 1rem; } .stat-card { width: 100%; } }`. Increase stat label font size to `0.9rem` minimum on mobile.

## Navigation/UX
**Grade: B**
- What's working: "Pricing" nav item is visually active (orange). The four-item nav is clean and uncluttered.
- What's broken: No in-page anchor navigation. Pricing pages benefit from a sticky sub-nav or jump links (Plans | ROI Calculator | FAQ) since the page is long.
- Fix: Add a sticky sub-nav below the main nav that appears after scrolling 100px: `Plans | ROI Calculator | FAQ | Book a Demo`. Use `position: sticky; top: 0; z-index: 40; background: white; border-bottom: 1px solid #e5e5e5;`.

## B2B Buyer Journey
**Grade: C-**
- What's working: The "WHY NOW" framing does give a budget-justification hook a GM can use internally.
- What's broken: B2B buyers arriving at pricing have already done awareness. They want to know: (1) what they get, (2) what it costs, (3) whether their peers use it. This section does none of that. It repeats homepage messaging, adding zero new information for someone in evaluation/decision stage.
- Fix: Replace the market-context paragraph with a 3-step value ladder: **"1. Connect your systems (Jonas, ClubEssential, Lightspeed). 2. Get a ranked member brief every morning. 3. Act before members leave."** Then drop directly into plan cards.

## Copy/Voice
**Grade: C**
- What's working: "The window is open. For a little while longer." has craft. It's memorable.
- What's broken: It's the wrong message for a pricing page. It sounds like scarcity marketing, not a confident platform. "For a little while longer" implies early-bird pricing that isn't mentioned — sets a false expectation. The sub-paragraph is dense and buries the LLM/AI differentiation.
- Fix: New headline: **"The platform that pays for itself."** New subhead: **"Most clubs recover Swoop's annual cost within 60 days of their first early intervention."** Keep the stats as proof. Drop the LLM infrastructure paragraph — it belongs on the Platform page.

## Technical Credibility
**Grade: D**
- What's working: Mentions "single intelligence layer" which implies integration depth.
- What's broken: Zero specifics. What systems does Swoop connect? What does "LLM infrastructure" mean in practice for a GM? No mention of API connections, data security, uptime, or existing integrations. Technical buyers (club IT, COO) get nothing here.
- Fix: Add a single trust bar below the stat cards: **"Connects with Jonas, ClubEssential, Lightspeed, Northstar, Foretees | SOC 2 Type II in progress | Data never sold or shared"** in small text on a slightly lighter dark background strip.

## Top 3 Priority Fixes for This Section
1. Add an in-section CTA that anchors to the plans — "See Plans & Pricing" and "Start Free" buttons below the stats. Every visitor needs a next step immediately visible.
2. Replace the hero headline/body with pricing-specific copy: "The platform that pays for itself" + 60-day ROI subhead. The current copy re-sells awareness to an evaluation-stage buyer.
3. Add source citations to all three stats. A $2.1B uncited claim actively damages credibility with a sceptical GM audience.
