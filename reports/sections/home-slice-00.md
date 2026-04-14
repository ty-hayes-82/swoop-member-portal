# Hero Section (Duplicate Slice) — Section Score

**Overall Grade: B-**

**Note:** home-slice-00.png renders identically to home-hero.png — it is the same hero viewport capture. The critique below is identical in substance. If this was intended to be a different slice, re-capture with a scroll offset.

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | B | Pain framing is strong but the payoff ("$74K") lacks attribution |
| Design/Visual | B+ | Clean layout; golf ball photo adds zero conversion value |
| CRO/Conversion | C+ | Two CTAs competing with near-equal visual weight |
| Trust/Credibility | C | "$74K" is unattributed — reads as made-up |
| Mobile UX | C | Desktop layout will stack awkwardly at 375px |
| Navigation/UX | B | Nav is minimal and clean; "Agents" label is cryptic |
| B2B Buyer Journey | B- | Speaks to pain but stops before proof — no TOFU social proof |
| Copy/Voice | B | Headline is punchy; subhead is weak and generic |
| Technical Credibility | C+ | "28 integrations" is buried; no integration logos visible |

## Messaging/Positioning
**Grade: B**
- What's working: "Your club runs on four systems. None of them talk to each other." names the exact operational pain a GM experiences daily. Eyebrow copy "PRIVATE CLUB INTELLIGENCE · BUILT FOR GMS" correctly targets the buyer role.
- What's broken: The bridge from pain to payoff is missing. "$74K in dues a year" appears without context — the reader doesn't know if that's average, median, top-quartile, or fabricated. The positioning also never states what category Swoop belongs to, making it hard to compare.
- Fix: Add one sentence before the CTA block: "Swoop is the member retention layer your existing systems are missing — not a replacement for any of them."

## Design/Visual
**Grade: B+**
- What's working: Off-white cream background, strong typographic hierarchy, and restrained orange accent are appropriate for a premium private club audience. The layout breathes.
- What's broken: The hero image (golf ball approaching cup) is purely decorative. It doesn't show the product, doesn't show outcomes, and creates a mismatch between "intelligence platform" messaging and "golf lifestyle" imagery.
- Fix: Replace with a 480×340px cropped product screenshot of the member alert feed or risk score dashboard. Apply `border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);`. Add alt text and a caption: "Member risk alerts — updated every night."

## CRO/Conversion
**Grade: C+**
- What's working: The primary CTA "Book the 30-minute walkthrough" is time-boxed, which reduces commitment anxiety. It is the correct primary action for a B2B demo-led sales motion.
- What's broken: "See it in action →" is styled as a secondary outlined button — nearly identical weight to the primary. This splits click intent. The trust micro-copy row ("Live in under 2 weeks · No rip-and-replace · 28 integrations") is rendered at ~11px and low contrast — invisible to a scanning reader.
- Fix: Demote "See it in action →" to an unstyled text link: `font-weight: 500; color: #1a1a1a; text-decoration: underline;` with no border. Increase trust badge font to 13px, color to `#555`, and separate items with a `·` character at higher contrast.

## Trust/Credibility
**Grade: C**
- What's working: Three trust signals are present (speed, no rip-and-replace, integrations count). These map directly to the top three GM objections.
- What's broken: All three are naked assertions. "$74K" has no source. "28 integrations" lists no names. "Live in under 2 weeks" has no case study link. A GM with a budget to protect will treat unattributed claims as vendor puffery.
- Fix: (1) Append to subhead: "(avg. across 300-member clubs)". (2) Change "28 integrations" badge to link to `/integrations` with tooltip listing top 5 systems. (3) Add "No credit card · Cancel anytime" in 12px gray below primary CTA.

## Mobile UX
**Grade: C**
- What's working: The two-column hero will reflow to single column on mobile without breakage.
- What's broken: The headline is 4–5 lines on mobile, consuming most of the above-fold space before the subhead or CTA is reached. The trust badge row wraps into multi-line clutter. The decorative image will either persist (wasting space) or disappear (losing any visual anchor).
- Fix: `@media (max-width: 768px) { h1 { font-size: 2rem; line-height: 1.2; } .hero-image { display: none; } .hero-trust-row { display: flex; flex-direction: column; gap: 6px; font-size: 12px; } }` — and swap the removed image space for one pull-quote from a real GM.

## Navigation/UX
**Grade: B**
- What's working: Minimal nav (3 items + CTA) is correct for B2B. "Book a Demo" in nav creates dual CTA reinforcement.
- What's broken: "Agents" is jargon without context for a first-visit GM. It reads as either AI agents (tech-forward) or sales/service agents (wrong meaning entirely). No indication of current page or active state.
- Fix: Rename nav item to "AI Automation" or "How It Works." If it links to the AI agents feature page, "AI Automation" is precise and differentiating without being confusing.

## B2B Buyer Journey
**Grade: B-**
- What's working: Pain-first headline respects buyer context. GMs are not looking for software — they're looking for a solution to a specific operational problem. This headline meets them there.
- What's broken: After the CTA, there is no external validation. No club names, no "X clubs use Swoop," no quote from a GM. A cold-traffic B2B visitor has no reason to trust the claims without third-party proof at the fold.
- Fix: Add a 1-line social proof strip below the trust badges: `"Used by general managers at [Club A], [Club B], and [Club C]"` — or if clubs request anonymity: `"Trusted by 40+ private clubs in the US and Canada."`

## Copy/Voice
**Grade: B**
- What's working: Headline voice is direct and non-jargony. "None of them talk to each other" is colloquial and accurate — GMs will recognize this immediately.
- What's broken: Subhead is three ideas in two sentences: integration capability + financial outcome + implementation speed. Each deserves its own beat. "Surface at-risk members" is inside language — GMs don't use "surface" as a verb.
- Fix: Rewrite subhead: "Every night, Swoop reads your tee sheet, CRM, and POS — and tells your team which members are pulling away. The average club protects $74K in annual dues. No IT project. Live in two weeks."

## Technical Credibility
**Grade: C+**
- What's working: "Live in under 2 weeks" is a technical implementation claim that addresses a real GM fear (long IT projects).
- What's broken: How Swoop reads the data is unexplained. Is it an API integration? File export? Does it require IT involvement? "28 integrations" without naming a single one is meaningless — if Jonas Golf and Foretees aren't listed, a GM managing one of those systems will assume Swoop doesn't work for them.
- Fix: Add beneath the trust badge row: "Connects to Jonas, Foretees, ClubWise + 25 more — read-only, no IT required." This single line eliminates the top technical objection before it's raised.

## Top 3 Priority Fixes for This Section
1. Replace the golf-ball hero image with an actual product screenshot (member risk dashboard or alert feed) — lifestyle imagery on a B2B SaaS hero is a conversion killer.
2. Attribute the $74K claim and rewrite the subhead using the replacement copy above — unattributed financial claims are disqualifying for analytical GM buyers.
3. Add a social proof strip below the trust badges naming clubs or citing an adoption number — zero external validation at the fold is the single biggest trust gap on this page.
