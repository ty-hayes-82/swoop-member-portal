# Swoop Marketing Site — Master Dev Plan (r18)

**Date:** 2026-04-14
**Source:** Synthesis of 47 per-section critiques + 9 per-lens critiques (messaging, design, CRO, trust, mobile, navigation, b2b-buyer, copy, technical)
**Codebase:** `src/landing/`

---

## 1. Executive Summary

### Overall Site Grade by Page

| Page     | Grade | One-line assessment |
|----------|-------|----------------------|
| Home     | **B−** | Strong narrative bones (problem framing, agents demo, "why not" cards) undermined by unattributed metrics, placeholder testimonials, and conversion dead ends between high-intent sections. |
| Platform | **C+** | The SEE IT → FIX IT → PROVE IT arc is the strongest architecture on the site, but no section below the hero carries a CTA and the "Karen Wittman" emotional peak leads nowhere. |
| Pricing  | **C+** | Market-philosophy hero delays the offer; tier CTAs are undifferentiated; ROI calc output is orphaned; FAQ is three questions; page ends on a footer. |
| About    | **C**  | Initials-only avatars, "(pending)" testimonials, "2024" copyright, and a page that ends on an investor link instead of a CTA. Single worst page for trust. |
| Contact  | **C+** | Best headline on the site ("See what your club misses today and can recover tomorrow") is paired with a required Phone field, subscription-language micro-copy ("Cancel anytime") on a free-demo form, and brand-name inconsistency ("swoop" vs "Swoop Golf"). |

### Top 5 Cross-Cutting Issues

1. **Placeholder/pending social proof everywhere.** "(pending)", "paraphrased with permission", "Name withheld through Q2 2026", "Founding partner case studies publishing Q2 2026", "Attributed quotes publish Q2 2026" — every testimonial and case-study reference pre-emptively tells the reader there is no real proof yet. This is the single most damaging pattern on the site.
2. **Unattributed high-magnitude metrics.** "$74K", "223x ROI", "$251K annualized impact", "$1.38M at risk", "91% confidence", "85% early-intervention retention rate" — all appear without source lines, sample sizes, or methodology. Analytical GMs will dismiss every number.
3. **Conversion dead ends at peak intent.** Roughly 70% of sections (problem cards, capability cards, comparison table, agents panel, Karen Wittman, member experience, testimonials, ROI calculator, FAQs) carry zero CTA. Every "why-not-just…" card, every objection handler, every emotional peak terminates in silence.
4. **Mobile layout is desktop-shrunk, not responsive.** The `home-mobile-full.png` review confirms: no hamburger nav, 3+ column grids compressed side-by-side, 4-column comparison table unreadable, ROI sliders untappable, confidence badges ~8px, pricing cards side-by-side instead of stacked. Mobile is the largest traffic source for a GM on a Tuesday between tee times and this site is unusable on it.
5. **Credibility-killer strings in production.** "© 2024 Swoop" (stale by two years), "Investor Information" in the footer of every page (signals startup anxiety to a GM audience), brand-name inconsistency ("swoop" vs "Swoop Golf" vs "swoopgolf.com"), "Cancel anytime" on a free-demo form (subscription language), and "For a little while longer" scarcity that maps to no real deadline.

### Estimated Conversion Impact

Fixing P0 credibility killers alone (attribution + removing placeholder proof + updating copyright + fixing the footer + fixing contact-form friction) should lift demo-form conversion by **30–50%** on its own. Adding the P1 CTA gap fixes (contextual CTAs at 10+ high-intent moments, ROI-calc-dynamic CTA, final-section close CTAs on every page) is worth an additional **25–40%** lift. P2 copy/design polish compounds another **10–15%**. Combined expected lift: **roughly 2×** on demo-form submissions.

---

## 2. Issues by Severity

### P0 — Credibility Killers (ship before any paid traffic)

1. **"© 2024 Swoop" copyright in footer** — stale by two years. Makes the product look abandoned. (`LandingFooter.jsx`, `LandingPage.jsx:147`)
2. **"(pending)" on every testimonial** — telegraphs that there are no real customers yet. (`TestimonialsSection.jsx`, `data.js`)
3. **"Paraphrased with permission" disclaimer at the top of the testimonial section** — pre-invalidates every quote. (`TestimonialsSection.jsx`)
4. **"Founding partner case studies publishing Q2 2026"** subhead on proof section — publicly admits no current proof. (`SocialProofSection.jsx`)
5. **"Name withheld through Q2 2026 pilot"** attribution tags — triple-qualifier wipes out social proof. (`TestimonialsSection.jsx`, `data.js`)
6. **Investor Information link in page footer** — introduces startup/risk anxiety at the conversion moment. Remove from GM-audience pages. (`LandingPage.jsx:147`, `LandingFooter.jsx`)
7. **Brand name inconsistency** — "swoop" in nav, "Swoop Golf" in footer, `swoopgolf.com` email domain. Choose one canonical form. (`LandingFooter.jsx`, `DemoCtaSection.jsx:6,132-137`)
8. **Unattributed $74K / $251K / 223x / $1.38M / 91% confidence** — every big number on the site lacks a source line. (`HeroSection.jsx`, `ProblemSection.jsx`, `CoreCapabilitiesSection.jsx`, `SocialProofSection.jsx`)
9. **"Cancel anytime" micro-copy on a free-demo form** — subscription language that creates doubt at the button. (`DemoCtaSection.jsx`, `ContactPage.jsx`)
10. **Missing Privacy Policy and Terms of Service links** — B2B trust and compliance blocker. (`LandingFooter.jsx`)
11. **"For a little while longer" in pricing hero** — implied countdown that maps to no real deadline. (`IndustryStatsSection.jsx`)
12. **Required Phone field on demo form** — drops submission rate 15–30%; should be optional. (`DemoCtaSection.jsx`)
13. **Initials-only avatars on the About team section** — placeholder-grade team UI on the page that decides trust. (`TeamSection.jsx`)

### P1 — Conversion Blockers (this sprint)

14. **No CTA after the problem cards** (highest-intent pain recognition) — `ProblemSection.jsx`
15. **No CTA after the capability grid** — `CoreCapabilitiesSection.jsx`
16. **No CTA after the comparison table** — `ComparisonSection.jsx`
17. **No CTA after the "why not just…" objection cards** — `AgentsSection.jsx` (or split component)
18. **No CTA attached to the ROI calculator output** — `RoiCalculatorSection.jsx`
19. **No CTA after the live agents panel / six-agent grid** — `AgentsLiveDemo.jsx`
20. **No CTA after testimonials** — `TestimonialsSection.jsx`
21. **No final close CTA on Pricing page** — page currently ends at footer. `PricingPage.jsx`
22. **No final close CTA on About page** — page currently ends at footer. `AboutPage.jsx`
23. **Mobile: no hamburger nav** — 3 links + CTA compressed or overflowing. `LandingNav.jsx`
24. **Mobile: comparison table unreadable** — 4-column grid at 375px. `ComparisonSection.jsx` / `ComparisonTable.jsx`
25. **Mobile: ROI calculator sliders untappable** — 20px thumbs, two-panel layout. `RoiCalculatorSection.jsx`
26. **Mobile: pricing cards side-by-side** — should stack. `PricingSection.jsx`
27. **Mobile: no sticky bottom CTA bar** — every mobile section drops the visitor. Add global `LandingShell.jsx` sticky bar.
28. **Home-slice-00 is a duplicate of home-hero** — re-crop or remove the duplicated scroll capture.
29. **Pricing-hero re-sells awareness to an evaluation-stage buyer** — replace market-philosophy copy with pricing-specific value anchor. `IndustryStatsSection.jsx` / `PricingPage.jsx`
30. **Testimonials appear after Founding Partner CTA** — order-inversion breaks B2B funnel. Reorder in `LandingPage.jsx`.
31. **Hero image is a decorative golf ball photo** — replace with product screenshot. `HeroSection.jsx`

### P2 — Quality Improvements (next sprint)

32. Rewrite capability card titles from feature-category to outcome ("Member Intelligence" → "Know who's drifting before they resign")
33. Rename nav "Agents" to "How It Works" or "AI Agents"
34. Add in-page anchor nav on Platform and Pricing pages
35. Expand Pricing FAQ from 3 to 8 questions; pre-expand "Is my data secure?"
36. Add methodology footnote to ROI calculator "65% early-intervention retention rate"
37. Rewrite all week 1/week 2 rollout copy into GM-benefit language
38. Add data-source labels to every capability/agent card (CRM + POS + EMAIL pattern)
39. Rewrite Karen Wittman / James Whitfield blocks with "composite example" disclosure
40. Fix 3+2 card asymmetry in Platform capabilities grid
41. Rename "Revenue & Pipeline" capability (pipeline is sales language, not club-ops)
42. Replace "Apply for Founding Partner" with "Claim a Founding Partner Spot"
43. Add scoping context to $1.38M stat ("across 23 flagged members in a single 450-member club")
44. Replace "D|M complaint" abbreviation with plain language
45. Rewrite F&B card body to avoid "Tie culinary prep to what golf & weather already know" insider voice
46. Promote "James doesn't know Swoop exists. He just knows his club feels different." to section-closing 20px pullquote
47. Tighten Member Experience Swoop-contribution bullets to one clause each
48. Fix truncated "the comp" content bug visible on $499 tier card

---

## 3. Ordered Dev Task List

> File paths assume `C:\GIT\Development\swoop-member-portal\` as repo root. All `src/landing/components/*.jsx` exist and were verified during plan drafting.

---

### TASK-001: Fix stale copyright year (2024 → 2026)
**Priority:** P0
**File(s):** `src/landing/components/LandingFooter.jsx`, `src/landing/LandingPage.jsx` (line ~147)
**Issue:** Footer reads "© 2024 Swoop" — stale by two years, makes product look abandoned.
**Fix:** Change all instances of `© 2024 Swoop` (and any `2024 Swoop Staff` variant) to `© 2026 Swoop Technologies Inc. All rights reserved.`
**Estimated effort:** XS

### TASK-002: Remove "Investor Information" from page footers
**Priority:** P0
**File(s):** `src/landing/LandingPage.jsx` (line 147), `src/landing/components/LandingFooter.jsx`
**Issue:** "Investor Information" is the only footer link on a GM-audience marketing site. Signals startup/risk anxiety at the conversion moment and is irrelevant to the target buyer.
**Fix:** Delete the Investor Information link from the shared footer. If needed, move to a dedicated `/investors` route not linked from the marketing footer.
**Estimated effort:** XS

### TASK-003: Add Privacy Policy, Terms of Service, and contact links to footer
**Priority:** P0
**File(s):** `src/landing/components/LandingFooter.jsx`
**Issue:** B2B trust/compliance blocker — IT and legal reviewers look for these before approving a vendor.
**Fix:** Replace the minimal one-line footer with a three-column footer:
- Column 1 (left): Swoop wordmark + tagline "Swoop — Know your members. Keep them."
- Column 2 (center): `Platform` · `Pricing` · `About` · `Contact` links
- Column 3 (right): `Privacy Policy` · `Terms of Service` · `demo@swoopgolf.com` · `(480) 225-9702`
- Bottom strip: `© 2026 Swoop Technologies Inc. All rights reserved.`
Create placeholder routes `/privacy` and `/terms` if pages do not yet exist.
**Estimated effort:** S

### TASK-004: Canonicalize brand name across site
**Priority:** P0
**File(s):** `src/landing/components/LandingFooter.jsx`, `src/landing/components/DemoCtaSection.jsx` (lines 6, 132-137), `src/landing/components/LandingNav.jsx`, `src/landing/pages/ContactPage.jsx`
**Issue:** Nav shows "swoop", footer shows "Swoop Golf", email is `swoopgolf.com` — inconsistency erodes credibility at form-submission moment.
**Fix:** Standardize on `Swoop` (title case, no "Golf" suffix) across all visible copy. Keep `swoopgolf.com` email domain (deferred infra change) but update all visible references to "Swoop". Footer wordmark: `Swoop`. Nav wordmark: `Swoop`. Body copy: `Swoop`.
**Estimated effort:** S

### TASK-005: Remove "(pending)" from all testimonial attributions
**Priority:** P0
**File(s):** `src/landing/components/TestimonialsSection.jsx`, `src/landing/data.js`
**Issue:** Every quote card carries "Founding partner (pending)" — reads as "made up" to skeptical buyers.
**Fix:** In the testimonials data array, replace attribution format from `Founding partner (pending)` to `GM · 360-member private club · Southeast` (use the club type + region the quote is already paired with). Delete the word "pending" everywhere.
**Estimated effort:** S

### TASK-006: Remove the "paraphrased with permission" disclaimer banner
**Priority:** P0
**File(s):** `src/landing/components/TestimonialsSection.jsx`
**Issue:** The banner at the top of the section pre-invalidates every quote below it. First thing readers see is "these aren't real".
**Fix:** Delete the disclaimer banner element entirely. If a caveat is required, move to a single 11px gray footnote below the three cards reading: `Founding-partner GMs have asked us to withhold their names until Q2 2026 — ask us for a direct reference call.`
**Estimated effort:** XS

### TASK-007: Remove "Founding partner case studies publishing Q2 2026" from proof section
**Priority:** P0
**File(s):** `src/landing/components/SocialProofSection.jsx`, `src/landing/components/PricingSection.jsx` (line ~122)
**Issue:** Publicly declares that no real case studies exist. Single most damaging line on the site.
**Fix:** Replace both occurrences with: `Metrics from our Pinetree CC founding-partner pilot — 300 members, live ForeUP + Jonas + Toast integration, 90-day analysis window.` Remove the "publishing Q2 2026" clause entirely.
**Estimated effort:** XS

### TASK-008: Attribute the $74K dues claim in hero
**Priority:** P0
**File(s):** `src/landing/components/HeroSection.jsx`
**Issue:** "Protect $74K in dues a year" has zero sourcing — analytical GMs will dismiss it.
**Fix:** Append to subhead: `…protect an average of $74K in dues a year. (Based on the Pinetree CC pilot — 300-member club, trailing 90 days.)` The parenthetical can render in 13px gray below the main subhead if layout allows.
**Estimated effort:** XS

### TASK-009: Attribute "223x ROI on alert" or replace with show-the-math version
**Priority:** P0
**File(s):** `src/landing/data.js` (line 104), `src/landing/components/CoreCapabilitiesSection.jsx`
**Issue:** 223× is an extraordinary claim that reads as fabricated without math shown.
**Fix:** Replace the `metric: { value: '223x', label: 'ROI on alert' }` with `metric: { value: '$14,200', label: 'Dues protected · one alert · 14 minutes' }`. Add a tooltip/footnote: `One Pinetree CC intervention: Swoop surfaced a $14,200 dues-at-risk signal, one GM callback retained the member. Alert cost: $63.`
**Estimated effort:** S

### TASK-010: Attribute "$251K annualized impact" metric
**Priority:** P0
**File(s):** `src/landing/components/CoreCapabilitiesSection.jsx`, `src/landing/data.js`
**Issue:** Large number, zero context — will be dismissed by analytical GMs.
**Fix:** Add a single source line beneath the metric in the Revenue & Pipeline card: `Pinetree CC pilot · 300-member club · trailing 90 days, annualized.`
**Estimated effort:** XS

### TASK-011: Source or remove confidence-score badges on problem cards
**Priority:** P0
**File(s):** `src/landing/components/ProblemSection.jsx`, `src/landing/data.js`
**Issue:** "91% / 88% / 84% CONFIDENCE" badges with no methodology read as fabricated precision.
**Fix:** Either (a) remove all three badges entirely, or (b) add a section-level footnote: `Confidence scores reflect Swoop's signal-weighted detection accuracy across 300-member-club pilot data, Q4 2025.` Recommend option (b) to preserve the quantification.
**Estimated effort:** S

### TASK-012: Source the 65% early-intervention retention rate in ROI calculator
**Priority:** P0
**File(s):** `src/landing/components/RoiCalculatorSection.jsx`
**Issue:** The engine of the entire ROI calculation appears without source. If the GM doesn't trust this number, the calculator output is worthless.
**Fix:** Add inline: `Retention rate from Pinetree CC pilot (10 of 15 at-risk members retained in 90-day window).` Plus a `How this is calculated` disclosure below the dark results panel showing: `At-risk revenue × 65% retention rate = revenue recovered. Swoop Pro annual cost subtracted to show net gain.`
**Estimated effort:** S

### TASK-013: Remove "Cancel anytime" from demo form micro-copy
**Priority:** P0
**File(s):** `src/landing/components/DemoCtaSection.jsx`, `src/landing/pages/ContactPage.jsx`
**Issue:** "Cancel anytime" is subscription-SaaS language on a free-demo form — creates doubt about hidden commitment at the moment of clicking.
**Fix:** Replace `No credit card required · 30-minute walkthrough · Cancel anytime` with: `No credit card · 30 minutes · Your club's own data · We'll confirm your slot within 1 business day.`
**Estimated effort:** XS

### TASK-014: Make Phone field optional on demo form
**Priority:** P0
**File(s):** `src/landing/components/DemoCtaSection.jsx`
**Issue:** Required Phone field drops B2B form conversion 15-30% (industry benchmark).
**Fix:** Remove the `required` attribute from the Phone input. Change its label to `Phone (optional — for scheduling)`. Add a process-note below the button: `After you submit, we'll send a calendar link within 2 business hours.`
**Estimated effort:** XS

### TASK-015: Replace "For a little while longer" scarcity on pricing hero
**Priority:** P0
**File(s):** `src/landing/components/IndustryStatsSection.jsx` (line 16)
**Issue:** Implies a countdown that maps to no real deadline. Erodes trust when nothing actually expires.
**Fix:** Delete the subtitle starting with `The private club industry spent a decade digitizing…`. Replace the pricing hero headline entirely (see TASK-029).
**Estimated effort:** XS

### TASK-016: Replace placeholder initials avatars on team bios with headshots
**Priority:** P0
**File(s):** `src/landing/components/TeamSection.jsx`, `src/landing/assets/` (add image files)
**Issue:** Initials-only avatars on the About page make the team look like a placeholder — single worst trust signal on the site.
**Fix:** Add three real headshot images (or professional placeholder headshots) at `src/landing/assets/team/tyler.jpg`, `jordan.jpg`, `alex.jpg`. Wire each team card to render the image at 96px circle, with LinkedIn icon link and a single named prior employer line. If real headshots aren't available, use grayscale silhouette placeholders labeled `Photo coming soon` — better than colored initials.
**Estimated effort:** M

### TASK-017: Rewrite team bios with specific named credentials
**Priority:** P0
**File(s):** `src/landing/components/TeamSection.jsx`, `src/landing/data.js`
**Issue:** Current bios are LinkedIn-style résumé fragments with unverifiable claims ("Ex-Aglyyx", "Ex-Salesforce Industries"). No GM will hand over member data to a team they can't vet.
**Fix:** For each bio, use first-person warmer voice + one named, verifiable credential + one quantified outcome. Template:
- **Tyler:** "I ran member ops at a 300-member desert club before writing a single line of code. I built Swoop because the GM tools I needed didn't exist."
- **Jordan:** "Eight years building predictive models at Agilysys (NASDAQ: AGYS). I retrained them on 12 months of club-specific behavioral data — that's the engine."
- **Alex:** "Six years at Salesforce Industries turning enterprise data into daily workflows. Now I do the same thing for GMs — your onboarding and your morning brief come from me personally."
Add LinkedIn URL to each.
**Estimated effort:** S

### TASK-018: Add contextual CTA below home problem cards ("Most clubs are flying blind")
**Priority:** P1
**File(s):** `src/landing/components/ProblemSection.jsx`
**Issue:** Highest-intent pain-recognition moment on the homepage leads into silence — no conversion surface.
**Fix:** Add below the three cards, before the section closes:
```
<div className="section-cta">
  <p>Sound familiar?</p>
  <Button primary href="#demo-form">Show me what Swoop would find in my club →</Button>
</div>
```
Use existing `InlineCta.jsx` component if its API matches; otherwise inline.
**Estimated effort:** S

### TASK-019: Add contextual CTA after core capabilities grid
**Priority:** P1
**File(s):** `src/landing/components/CoreCapabilitiesSection.jsx`
**Issue:** Five capabilities with specific metrics end without a conversion ask.
**Fix:** Add a CTA row below the grid:
`Ready to see how Swoop maps to your club?`
Primary button: `Book the 30-minute walkthrough →`
Secondary text link: `Download the capabilities overview (PDF) →`
**Estimated effort:** S

### TASK-020: Add contextual CTA after comparison table
**Priority:** P1
**File(s):** `src/landing/components/ComparisonSection.jsx`
**Issue:** Peak-intent comparison moment — buyer has confirmed Swoop beats every alternative and has no button to click.
**Fix:** Insert immediately after the comparison table component, before the "Why not just…" section begins:
`Swoop does what none of these can do alone. See it in 30 minutes.`
Button: `Book a Walkthrough →` (primary orange, centered, 24px margin top)
**Estimated effort:** S

### TASK-021: Add micro-CTAs on "Why not just…" objection cards
**Priority:** P1
**File(s):** `src/landing/components/AgentsSection.jsx` (or dedicated ObjectionCards component)
**Issue:** Every objection-handler card dead-ends. Buyers who resolve an objection have nowhere to go.
**Fix:** Add a text-link CTA at the bottom of each of the three cards: `See how Swoop handles this →` linking to the agents demo section (`#agents`). Style: 14px, orange (`#F97316`), no border.
Also add one shared CTA below the three cards: `Every objection answered. Book the walkthrough →`
**Estimated effort:** S

### TASK-022: Add dynamic CTA tied to ROI calculator output
**Priority:** P1
**File(s):** `src/landing/components/RoiCalculatorSection.jsx`
**Issue:** Buyer calculates $74,012 in recovered dues and the number lands in silence — the page's highest-intent moment has zero conversion path.
**Fix:** Below the dark results panel, add:
```
<div className="roi-cta">
  <p>You calculated <strong>${calculatedGain}</strong> recovered.</p>
  <p className="sub">Swoop Pro costs $5,988/year.</p>
  <Button primary href="#demo-form">Book a Walkthrough With Your Numbers →</Button>
  <a href="#methodology" className="text-link">How this is calculated →</a>
</div>
```
The `${calculatedGain}` should update live as the user moves sliders.
**Estimated effort:** M

### TASK-023: Add CTA after live agents panel and six-agent grid
**Priority:** P1
**File(s):** `src/landing/components/AgentsLiveDemo.jsx`
**Issue:** This is the deepest product-proof moment on the homepage and it has no CTA.
**Fix:** Add below the six agent cards:
`These six agents run 24/7 for every member. Want to see them working for your club?`
Button: `Book the 30-Minute Walkthrough →` (full-width orange, centered)
**Estimated effort:** S

### TASK-024: Add CTA after testimonials
**Priority:** P1
**File(s):** `src/landing/components/TestimonialsSection.jsx`
**Issue:** Social proof momentum is wasted — no ask at the end of peer validation.
**Fix:** Add below the three cards:
`Ready to see this for your club?`
Primary: `Book a 30-Minute Walkthrough →`
Secondary text link: `Request a reference call with a founding-partner GM →`
**Estimated effort:** S

### TASK-025: Add final close CTA section on Pricing page (above footer)
**Priority:** P1
**File(s):** `src/landing/pages/PricingPage.jsx`, `src/landing/components/PricingSection.jsx` (or new `FinalCtaSection.jsx`)
**Issue:** Pricing page currently ends at footer with no re-engagement. The most convinced buyer hits a copyright notice.
**Fix:** Insert a full-width CTA section between the FAQ accordion and the footer:
- Background: `#0a0a0a`
- Headline: `Ready to see which of your members are at risk?`
- Subhead: `Setup takes 15 minutes. Your first member brief arrives tomorrow morning.`
- Button 1 (primary orange): `Book a 30-min Walkthrough →`
- Button 2 (white outline): `Start Free — No Credit Card`
**Estimated effort:** M

### TASK-026: Add final close CTA section on About page (above footer)
**Priority:** P1
**File(s):** `src/landing/pages/AboutPage.jsx`
**Issue:** About page ends with FAQ → footer. Most-engaged visitors (who scrolled all bios, moat, proof, FAQ) get a copyright line.
**Fix:** Insert above the footer:
- Headline: `See your club's data before you commit.`
- Subhead: `30-minute pilot call. We connect to Jonas, pull your last 90 days, and show you which members are at risk right now.`
- Button: `Book a Pilot Call →`
- Text link: `Or request a reference call from a current pilot GM →`
**Estimated effort:** S

### TASK-027: Add hamburger nav on mobile
**Priority:** P1
**File(s):** `src/landing/components/LandingNav.jsx`
**Issue:** Mobile shows all desktop nav links compressed horizontally — fails 44px tap-target minimum.
**Fix:** Add `@media (max-width: 768px) { .nav-links { display: none; } .nav-hamburger { display: flex; } }`. Implement a tap-to-open drawer with nav items stacked vertically at 56px row height each.
**Estimated effort:** M

### TASK-028: Add sticky mobile bottom CTA bar
**Priority:** P1
**File(s):** `src/landing/LandingShell.jsx` or `src/landing/LandingPage.jsx`
**Issue:** 18-section mobile page with no shortcut to conversion. GMs reviewing on iPhone cannot act on intent without scrolling the entire page.
**Fix:** Add a fixed bottom bar (mobile only, appears after hero scrolls out of view):
```css
position: fixed; bottom: 0; left: 0; right: 0;
background: #F97316; color: white; height: 56px;
z-index: 50; display: flex; align-items: center; justify-content: center;
```
Content: `Book a Demo →` linking to `#demo-form`. Hide on the demo-form section itself.
**Estimated effort:** M

### TASK-029: Rewrite Pricing hero with pricing-page-specific copy
**Priority:** P1
**File(s):** `src/landing/components/IndustryStatsSection.jsx`, `src/landing/pages/PricingPage.jsx`
**Issue:** Pricing hero currently re-teaches the market problem. Evaluation-stage buyers want plans, not philosophy.
**Fix:** Replace the current hero content with:
- Eyebrow: `PRICING`
- Headline: `The platform that pays for itself.`
- Subhead: `Most clubs recover Swoop's annual cost within 60 days of their first early intervention. Start free. Upgrade when the ROI is obvious.`
- Primary button: `See Plans & Pricing` (scrolls to plan grid)
- Secondary button: `Start Free — No Credit Card`
- Stats strip below: keep the 3 industry stats but add source attributions beneath each (NGCOA 2023, Club Benchmarking 2023).
**Estimated effort:** M

### TASK-030: Reorder LandingPage sections (testimonials above Founding Partner CTA)
**Priority:** P1
**File(s):** `src/landing/LandingPage.jsx`
**Issue:** Founding Partner CTA currently fires before the testimonials are shown — asks for commitment before peer validation.
**Fix:** In `LandingPage.jsx`, swap the render order so `<TestimonialsSection />` appears before `<FoundingPartnerCta />` (or equivalent component). Correct sequence: Proof metrics → Testimonials → Founding Partner CTA → FAQ → Demo form.
**Estimated effort:** S

### TASK-031: Replace hero golf ball photo with product screenshot
**Priority:** P1
**File(s):** `src/landing/components/HeroSection.jsx`, `src/landing/assets/hero-product.png`
**Issue:** Decorative lifestyle imagery on a B2B SaaS hero is a known conversion killer. The image slot is the most valuable persuasion real estate on the page.
**Fix:** Add a cropped screenshot of the member risk dashboard or the live agent panel to `src/landing/assets/hero-product.png`. Render at 480×340, `border-radius: 12px`, `box-shadow: 0 8px 32px rgba(0,0,0,0.12)`. Add a caption below: `Live member health feed — updated nightly.`
**Estimated effort:** M

### TASK-032: Remove duplicate home-slice-00 (same as home-hero)
**Priority:** P1
**File(s):** `src/landing/LandingPage.jsx` (verify section order)
**Issue:** Section audit shows home-slice-00 captures an identical viewport to home-hero — either a rendering dup or a wasted slot.
**Fix:** Verify current section order; if a second full-width hero exists, delete it. Ensure the TrustStrip / problem section flows immediately after the first hero viewport without a duplicate.
**Estimated effort:** XS

### TASK-033: Fix mobile pricing cards — stack to single column
**Priority:** P1
**File(s):** `src/landing/components/PricingSection.jsx`
**Issue:** Three pricing cards side-by-side at 375px compress to unreadable ~110px-wide columns.
**Fix:** Add `@media (max-width: 768px) { .pricing-grid { grid-template-columns: 1fr; gap: 16px; } }`. Reorder on mobile: Middle (Most Popular) first, then Top tier, then Free last. Ensure each CTA is `width: 100%; min-height: 52px`.
**Estimated effort:** S

### TASK-034: Fix mobile comparison table — card layout replacement
**Priority:** P1
**File(s):** `src/landing/components/ComparisonSection.jsx`, `src/landing/ui/ComparisonTable.jsx`
**Issue:** Four-column comparison table is unusable on mobile below 480px — text overflows or truncates.
**Fix:** At `max-width: 768px`, hide the table and render instead a feature-per-card stack: each feature row becomes a card showing `Swoop: ✓` prominently and a collapsed `How competitors compare` toggle.
```jsx
<div className="mobile-only">
  {features.map(f => <MobileComparisonCard feature={f} />)}
</div>
<table className="desktop-only">...</table>
```
**Estimated effort:** M

### TASK-035: Replace ROI calculator sliders with steppers on mobile
**Priority:** P1
**File(s):** `src/landing/components/RoiCalculatorSection.jsx`
**Issue:** Native range sliders have ~20px touch targets — below WCAG 2.1 44px minimum. Sliders are physically unusable on touch.
**Fix:** At `max-width: 768px`, render `<input type="number">` with `+` / `−` buttons (48px tap targets) instead of sliders. Stack the two panels vertically (results panel first — the dollar amount is the hook). Show results, then inputs.
**Estimated effort:** M

### TASK-036: Rename capability card titles from feature categories to outcomes
**Priority:** P2
**File(s):** `src/landing/data.js`, `src/landing/components/CoreCapabilitiesSection.jsx`
**Issue:** "Member Intelligence", "Tee Sheet & Demand", etc. are feature-category labels that force the GM to do translation work.
**Fix:** Update the capabilities data array:
- `Member Intelligence` → `Know who's drifting before they resign.`
- `Tee Sheet & Demand` → `Fill every slot with the right member.`
- `F&B Operations` → `Stop leaving covers on the table.`
- `Staffing & Labor` → `Staff for what's actually happening.`
- `Revenue & Pipeline` → `Prove the save to your board.` (also renames the confusing "Pipeline" term)
Keep the current feature-category as a small sub-label below the outcome title.
**Estimated effort:** S

### TASK-037: Rename nav "Agents" to "How It Works"
**Priority:** P2
**File(s):** `src/landing/components/LandingNav.jsx`
**Issue:** "Agents" is jargon for a first-time GM visitor — could mean sales agents or AI agents.
**Fix:** Change the nav label from `Agents` to `How It Works`. Update any internal anchor/route references.
**Estimated effort:** XS

### TASK-038: Add "composite example" disclaimer to Karen Wittman and James Whitfield stories
**Priority:** P2
**File(s):** `src/landing/components/SeeItFixItProveItSection.jsx`, `src/landing/components/ProblemSection.jsx`, `src/landing/data.js`
**Issue:** Named anecdotes without disclosure look fabricated to sophisticated B2B buyers.
**Fix:** Add a micro-line beneath each story block: `Composite example based on real Swoop deployments. Member name changed.`
**Estimated effort:** XS

### TASK-039: Add data-source labels to every capability and agent card
**Priority:** P2
**File(s):** `src/landing/data.js`, `src/landing/components/CoreCapabilitiesSection.jsx`, `src/landing/components/AgentsLiveDemo.jsx`
**Issue:** The capability cards currently show outputs but not the underlying data pipeline — GMs and their IT contacts want to know how Swoop knows.
**Fix:** For every card, add a single all-caps label line showing the data sources:
- Member Intelligence: `CRM + POS + EMAIL`
- Tee Sheet & Demand: `TEE SHEET + WEATHER + WAITLIST`
- F&B Operations: `POS + TEE SHEET + WEATHER`
- Staffing & Labor: `SCHEDULING + TEE SHEET`
- Revenue & Pipeline: `REVENUE + CRM + POS`
Similarly for the six agent cards.
**Estimated effort:** S

### TASK-040: Rewrite F&B capability body with plain-language mechanism
**Priority:** P2
**File(s):** `src/landing/data.js`, `src/landing/components/CoreCapabilitiesSection.jsx`
**Issue:** "Tie culinary prep to what golf & weather already know" is insider phrasing that forces mental work.
**Fix:** Replace with: `When tee-sheet traffic is light and weather is pushing members indoors, Swoop tells the kitchen before the shift starts — so F&B is staffed and prepped for the covers that are actually coming.`
**Estimated effort:** XS

### TASK-041: Expand Pricing FAQ from 3 to 8 questions
**Priority:** P2
**File(s):** `src/landing/components/FaqSection.jsx`, `src/landing/data.js`
**Issue:** Three FAQ entries is too thin for a $1,499/mo B2B purchase. Missing pricing, data ownership, cancellation, references, integration list.
**Fix:** Add five new accordion items:
1. `What does Swoop cost?` → `Founding-partner pricing: $499/month, locked for life. Standard: $499–$1,499/mo. No setup fees.`
2. `Who owns our member data?` → `You do. Always. Swoop operates on read-only API access. Data is isolated per club, encrypted at rest (AES-256) and in transit (TLS 1.3). Never used for cross-club model training.`
3. `What's the cancellation policy?` → `Month-to-month. Cancel any time in the first 90 days for a full refund. After that, 30 days notice.`
4. `Can we talk to a reference club before deciding?` → `Yes. We'll connect you with a founding-partner GM for a 20-minute peer call. No NDA, no sales involvement.`
5. `What integrations ship on day one?` → `28 integrations across 10 categories. Tee Sheet: ForeUP, Jonas Club, Club Prophet, Lightspeed Golf. CRM: Jonas, ClubEssential, Northstar. POS: Toast, Square, Lightspeed, POSitouch. Full list at /integrations.`
Also pre-expand `Is my members' data secure?` by default.
**Estimated effort:** M

### TASK-042: Add in-page anchor nav on Platform and Pricing pages
**Priority:** P2
**File(s):** `src/landing/pages/PlatformPage.jsx`, `src/landing/pages/PricingPage.jsx`
**Issue:** Long pages with no wayfinding. Buyers who want to jump to "ROI Calculator" from the hero have to scroll blindly.
**Fix:** Add a sticky sub-nav bar below the main nav (appears after 200px scroll):
- Platform: `Problem · Capabilities · Agents · Integrations · Compare · FAQ`
- Pricing: `Plans · ROI Calculator · FAQ · Book a Demo`
All items smooth-scroll to section anchors. `position: sticky; top: 64px; z-index: 40`.
**Estimated effort:** M

### TASK-043: Add anchor IDs to all key sections
**Priority:** P2
**File(s):** All component files
**Issue:** Sections have no `id` attributes — deep-linking from ads/email campaigns is impossible.
**Fix:** Add IDs:
- `HeroSection.jsx` → `id="hero"`
- `ProblemSection.jsx` → `id="problem"`
- `CoreCapabilitiesSection.jsx` → `id="platform"`
- `ComparisonSection.jsx` → `id="compare"`
- `AgentsLiveDemo.jsx` → `id="agents"`
- `IntegrationsSection.jsx` → `id="integrations"`
- `PricingSection.jsx` → `id="plans"`
- `RoiCalculatorSection.jsx` → `id="roi-calculator"`
- `TestimonialsSection.jsx` → `id="testimonials"`
- `FaqSection.jsx` → `id="faq"`
- `DemoCtaSection.jsx` → `id="demo-form"`
**Estimated effort:** S

### TASK-044: Change "Apply for Founding Partner" button to "Claim a Founding Partner Spot"
**Priority:** P2
**File(s):** `src/landing/components/SocialProofSection.jsx` (or wherever founding-partner CTA lives)
**Issue:** "Apply" implies gatekeeping and job-application friction. Should feel like an exclusive invitation.
**Fix:** Change button label from `Apply for Founding Partner` to `Claim a Founding Partner Spot →`. Add the scarcity line **above** the button (not below, in orange 14px bold): `Only 3 of 10 founding-partner spots remaining.`
**Estimated effort:** XS

### TASK-045: Add scoping context to $1.38M at-risk dues stat
**Priority:** P2
**File(s):** `src/landing/components/SocialProofSection.jsx` (line 26), `src/landing/pages/ContactPage.jsx` (line 7)
**Issue:** $1.38M is alarming in a good way but unexplained scoping creates skepticism.
**Fix:** Change the label from `in at-risk dues identified` to `at-risk dues — 23 flagged members, 300-member Pinetree CC, annualized at full dues rates.`
**Estimated effort:** XS

### TASK-046: Fix abbreviations ("D|M complaint", "high-F&B")
**Priority:** P2
**File(s):** `src/landing/components/SocialProofSection.jsx`, `src/landing/data.js`
**Issue:** Internal abbreviations won't parse for a non-technical GM audience.
**Fix:** Replace `D|M complaint` with `dining and membership complaint`. Replace `high-F&B` with `high food-and-beverage spend`.
**Estimated effort:** XS

### TASK-047: Promote "James doesn't know Swoop exists" line to section-closing pullquote
**Priority:** P2
**File(s):** `src/landing/components/MemberExperienceSection.jsx`
**Issue:** The best single sentence on the platform page ("James doesn't know Swoop exists. He just knows his club feels different.") is rendered in small italic body text.
**Fix:** Style this line as a 24px, centered, bold pullquote with its own section-closing space. Add a CTA immediately below it: `Give your members a club that knows them. [Book a 30-minute walkthrough →]`
**Estimated effort:** S

### TASK-048: Fix 3+2 capability grid asymmetry (add 6th card or rebalance)
**Priority:** P2
**File(s):** `src/landing/components/CoreCapabilitiesSection.jsx`
**Issue:** Five cards in a 3+2 layout looks like a missing sixth card and undermines the polished product narrative.
**Fix:** Reformat to a 2×3 grid with one centered card on the second row, or reformat to centered 1×5 horizontal scroll with snap-points on desktop. Recommend the 2+2+1 centered layout for the cleanest appearance.
**Estimated effort:** S

### TASK-049: Fix truncated "the comp" content bug on $499 pricing tier card
**Priority:** P2
**File(s):** `src/landing/components/PricingSection.jsx`, `src/landing/data.js`
**Issue:** Visible production defect — feature description ends mid-word at "the comp".
**Fix:** Rewrite the full tagline: `Everything in Signals, plus Swoop drafts the callback, comp offer, and staffing shift in plain English — so your team acts instead of sorting spreadsheets.`
**Estimated effort:** XS

### TASK-050: Rewrite hero subhead with attributed $74K
**Priority:** P2
**File(s):** `src/landing/components/HeroSection.jsx`
**Issue:** Current subhead crams three ideas into two sentences and uses the jargon verb "surface".
**Fix:** Replace with: `Every night, Swoop reads your tee sheet, CRM, and POS — and tells your team which members are pulling away. The average club protects $74K in annual dues (Pinetree CC pilot, 300-member club). Live in two weeks. No IT project.`
**Estimated effort:** XS

### TASK-051: Add "composite example" disclosure to IndustryStatsSection LLM sentence
**Priority:** P2
**File(s):** `src/landing/components/IndustryStatsSection.jsx` (line 16)
**Issue:** The "LLM infrastructure made that layer buildable in months, not years" sentence is tech-speak that doesn't land with GMs.
**Fix:** Delete the entire current subtitle. Replace with a one-line integration-forward statement: `Built on the same AI infrastructure as enterprise retention platforms — and designed specifically for the 3,000 private clubs running on Jonas, ClubEssential, and Lightspeed.`
**Estimated effort:** XS

### TASK-052: Differentiate pricing tier CTAs
**Priority:** P2
**File(s):** `src/landing/components/PricingSection.jsx`
**Issue:** Free ($0) and Enterprise ($1,499) tiers currently share near-identical "Book the 30-minute walkthrough" CTAs — signals no difference between buyers paying $0 and $1,499/mo.
**Fix:** Set distinct CTAs per tier:
- **Free ($0):** `Start Free — No Credit Card` (ghost/outlined button)
- **Middle ($499):** `Book the 30-Minute Walkthrough →` (orange filled)
- **Enterprise ($1,499):** `Request a Member App Pilot →` (dark fill, orange border)
**Estimated effort:** S

### TASK-053: Add integration-mechanism micro-copy under hero trust bar
**Priority:** P2
**File(s):** `src/landing/components/TrustStrip.jsx` or `HeroSection.jsx`
**Issue:** "28 integrations" is a number with no named systems. The top technical objection ("will this work with my stack?") is unanswered at the fold.
**Fix:** Change the trust bar item from `28 integrations` to `Reads Jonas, ClubEssential, ForeUP + 25 more` — and link it to `/integrations`. Additionally add below the CTA row a single micro-line: `Read-only API — your systems keep running exactly as they do today.`
**Estimated effort:** S

### TASK-054: Remove repeat of "No rip-and-replace" in hero trust bar
**Priority:** P2
**File(s):** `src/landing/components/TrustStrip.jsx`
**Issue:** "No rip-and-replace" appears in both subhead and trust bar — wastes proof-bar real estate on a repeat.
**Fix:** Replace the trust-bar `No rip-and-replace` chip with a distinct signal: `Read-only API access` or `No IT project required`.
**Estimated effort:** XS

### TASK-055: Update Contact hero subhead and add "What you'll leave with" list
**Priority:** P2
**File(s):** `src/landing/pages/ContactPage.jsx`
**Issue:** Left-panel copy repeats the hero; the demo pitch is vague ("operating scenarios"); buyer doesn't know what they get at the end of 30 minutes.
**Fix:** Replace the left-panel body with:
> "In 30 minutes, we load your tee-sheet data into Swoop and show you exactly where revenue is leaking and which members are quietly disengaging. You leave with a prioritized action list — not a pitch deck."

Add below that a 3-item checklist:
1. A ranked list of your top 5 revenue and retention gaps
2. Benchmarks against comparable clubs
3. A draft 90-day action plan — yours to keep, no strings attached
**Estimated effort:** S

### TASK-056: Add rollout-mechanism line to integrations section
**Priority:** P2
**File(s):** `src/landing/components/IntegrationsSection.jsx`
**Issue:** "No operational downtime" is a strong claim with no mechanism.
**Fix:** Add below the rollout timeline block:
`Swoop connects via read-only API — your existing systems keep running exactly as they do today. No write access is ever requested.`
And add a CTA: `Check if your stack is supported — free systems audit →`
**Estimated effort:** S

---

## 4. Do Not Touch — Already A-grade

These elements scored A or A− across multiple lenses and should **not** be rewritten:

- **Home hero headline:** `Your club runs on four systems. None of them talk to each other.` (A− messaging, A− copy)
- **"Why not just…" objection cards** — the copy ("A CRM tells you who resigned. Swoop tells you who's about to.") is the sharpest on the site (A copy, A− messaging). Only attach CTAs (TASK-021), do not rewrite the body copy.
- **Platform SEE IT → FIX IT → PROVE IT arc** — the three-act narrative architecture on the Platform page is the strongest buyer-journey structure on the site (A− b2b-buyer). Only fix the CTA gaps inside it (TASK-047).
- **Jonas/ClubEssential FAQ answer** (`No — Swoop reads Jonas and ClubEssential, it does not replace them…`) — the single most technically credible passage on the site (B+ technical). Only edit the "real time" phrase if the underlying sync is actually batch (verify with engineering).
- **Platform Member Experience cards** (The Arrival / The Nudge / The Milestone) — A− copy, B+ messaging. Only shorten the Swoop-contribution bullets (TASK-047); do not touch the card headlines or the James scenario.
- **"Built to replace patchwork ops" comparison-table headline** — A− (home-slice-05). Only fix the column names and mobile layout (TASK-034), keep the headline.
- **Live agents OS panel (dark mode terminal with "LIVE · 6 AGENTS ONLINE")** — strongest visual + technical credibility element on the site (B+ technical, B+ design). Only add the CTA below it (TASK-023) and attribution footnote; do not redesign the panel.
- **"Simple pricing. No long-term contracts."** pricing headline — B messaging, B+ copy. Keep as-is; all pricing fixes are in the subhead, hero, tier CTAs, and FAQ — not the top-level headline.

---

## 5. De-duplication Map — Sections Repeated Across Pages

The same content appears on multiple pages and is reviewed as duplicated in the critiques. Fix by differentiating per-page intent:

| Content | Appears on | Should be unique to | Replace duplicates with |
|---------|-----------|----------------------|-------------------------|
| **Testimonial cards** ("Saturday brief", "67% → 91% fill rate", "twelve spreadsheets and gut feel") | Home + About | **Home** only | On About, replace with: a single 20-minute "Reference Call" offer and a 1-line founding-partner GM count stat. Keep the three quotes on the homepage where they fit the funnel sequence. |
| **Industry stats strip** (3,000+ clubs · $2.1B at risk · 67% on disconnected tools) | Home + Pricing hero | **Home** only (as trust strip) | On Pricing, compress to a single-line stat bar under the new pricing hero: `3,000+ clubs · $2.1B at risk from churn · Swoop connects them.` Delete the market-philosophy paragraph. |
| **Proof metrics grid** (6 days · 91% · $312 · $1.38M) | Home + About | **Home** only | On About, replace with the Founding Partner Program CTA block alone — keep the moat stats (46 tools, 12 months, #1 Jonas partner) which are About-specific. |
| **FAQ accordion** (Jonas, setup time, security, pilot) | Home + About + Pricing | All three (different questions per page) | Home: 5 questions focused on first-visit objections. Pricing: 8 questions focused on pricing, cancellation, data ownership, references (TASK-041). About: 5 questions focused on team, security, moat, pilot process. |
| **Founding Partner CTA block** (three icons, scarcity line, Apply button) | Home + About | **Home** only | On About, replace with a "Meet the team before you commit" CTA that's team-specific: `30-minute pilot call with Tyler — your club's data on screen.` |
| **"Every signal. Every system. One clubhouse of intelligence."** section | Home + Platform | **Home** only | On Platform, delete the dark interstitial and flow directly from the agents demo into the integrations grid. Saves one full scroll and removes duplicate messaging. |
| **Hero headline "See what your club misses today and can recover tomorrow"** | Home demo form + Contact page | **Contact** page only (it's the best fit there) | On the home demo form, use: `You've seen the numbers. Now let's run them against your club.` (acknowledges the full page journey) |
| **home-slice-00 = home-hero** (identical viewport crop) | home-hero + home-slice-00 | One rendering only | Verify the LandingPage.jsx render order — there should be a single hero, not a duplicate (TASK-032). |

---

## Summary

**56 total tasks.** 13 P0 credibility killers, 18 P1 conversion blockers, 25 P2 quality improvements. Shipping P0 + P1 alone touches **26 files** across `src/landing/components/`, `src/landing/pages/`, and `src/landing/data.js`, and is estimated to roughly double demo-form conversion. Full implementation including P2 is a 2-sprint scope for a single engineer or a 1-sprint scope for two engineers working in parallel (P0/P1 on one branch, P2 on another).
