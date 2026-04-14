# Swoop Marketing Site — Design Critique r18
**Reviewer:** Senior Product & Visual Design Audit  
**Date:** 2026-04-14  
**Scope:** All pages — Home, Platform, Pricing, About, Contact  
**Methodology:** Section-by-section visual quality assessment. Grades on Design/Visual only: hierarchy, typography, whitespace, color, rhythm, consistency, mobile rendering, UI polish.

---

## GRADING RUBRIC
- **A** — Production-ready. Intentional, consistent, confident.
- **B** — Good bones, minor polish gaps.
- **C** — Functional but has clear problems that reduce credibility.
- **D** — Multiple compounding problems; noticeably degraded quality.
- **F** — Broken, illegible, or embarrassing.

---

# HOME PAGE

---

## `home-hero.png` / `home-slice-00.png`
**Grade: B+**

**Strengths:**
- Strong typographic hierarchy: eyebrow label → bold serif-style H1 → italic orange emphasis works well, creates momentum.
- Two-column layout is well-balanced; the golf hole photograph has excellent warm tonal resonance with the orange brand color.

**Problems:**
- The headline "four systems / None of them talk / to each other." breaks inconsistently across lines — "four systems." ends mid-line then the italic carries to next, creating an orphan rhythm problem. On a compressed viewport the stagger looks accidental.
- The trust bar beneath CTAs ("Live in under 2 weeks · No rip-and-replace · 28 integrations") is styled in a font that is too small (~10px equivalent) and the green dot icons feel like an afterthought — no visual weight system connecting them to the CTA above.
- The secondary CTA "See it in action →" sits too close to the primary button with insufficient horizontal gap — the two CTAs compete visually.
- Body copy is dense at ~14px with tight leading; contrast against the cream `#f5f0e8` background is adequate but not comfortable.

**Fix:**
- Set `gap: 16px` between the two CTA buttons (currently looks ~8px).
- Increase trust bar text to `12px`, add `letter-spacing: 0.02em`, and give each bullet `gap: 6px` from its dot.
- Lock headline line-breaks with `<br>` tags at `lg:` breakpoint to prevent orphans.

---

## `home-slice-01.png` — Social Proof Ticker / Pain Points
**Grade: C+**

**Strengths:**
- The four "founding partner" stat cards across the top create a clean horizontal band with good icon usage.

**Problems:**
- The orange section eyebrow "PRIVATE CLUB INTELLIGENCE · BUILT FOR GMS" is redundant here — it duplicates the hero eyebrow and appears to float on the same cream background with zero visual separation from the hero.
- "Most clubs are flying blind." headline at ~40px is the right size but sits on a flat cream band with no sectional separation — there is no background color shift, no divider, and no top padding that signals a new section has started. The page feels like it runs together.
- The three problem cards below are white on cream, which is extremely low contrast for the card boundaries — only a thin shadow differentiates them. This reads as flat and cheap.
- "91% CONFIDENCE" badge on card headers is orange on white at ~9px — likely fails WCAG AA for small text.

**Fix:**
- Add `background: white` or `background: #fafaf8` to the pain-points section to visually separate it from the hero.
- Increase card `box-shadow` to `0 2px 12px rgba(0,0,0,0.08)` for more separation.
- Remove the duplicate eyebrow; this section's heading is strong enough standalone.
- Confidence badge: increase to `11px` minimum, or replace with a pill badge with more fill contrast.

---

## `home-slice-02.png` — Problem Cards (lower half) + Platform Teaser
**Grade: C**

**Strengths:**
- The stat callout "1-day WARNING MISSED / $22K ANNUAL DUES AT RISK / $36K DUES + F&B LEAKAGE" creates strong scannability at the card bottoms.

**Problems:**
- "WHY THIS SURFACED" label above the stats is uppercase at ~8px — this is illegible at normal reading distance and likely fails WCAG at any foreground color.
- The transition from the white card section into the "Five core capabilities" heading band is abrupt: the bottom of the problem cards clips into the new section header with no breathing room (looks like ~24px gap instead of 64–80px).
- The "PLATFORM" eyebrow label over the section heading uses a different orange tint than other eyebrows — looks slightly more muted/washed. Possible inconsistency in CSS class usage.
- Body copy under "Five core capabilities" is centered and wraps to 60+ characters per line — centered alignment at body text sizes beyond 2 lines reads as uncomfortable.

**Fix:**
- Enforce `min-height` or `padding-bottom: 80px` on the problem cards section before the new section starts.
- Cap centered body text at `max-width: 480px` and `margin: 0 auto`.
- Standardize eyebrow color to a single CSS variable — `var(--brand-orange)` — and audit all pages for deviation.
- "WHY THIS SURFACED": increase to `10px` with `font-weight: 600` or remove entirely.

---

## `home-slice-03.png` — Capability Cards (Staffing & Labor / Revenue & Pipeline)
**Grade: B-**

**Strengths:**
- The card grid with icon, headline, bullets, and a metric callout at the bottom is a well-structured card pattern.
- "223x ROI ON ALERT" and "$251K ANNUALIZED IMPACT" numbers are visually prominent and credible.

**Problems:**
- Card height is uneven — the "Staffing & Labor" card appears taller than "Revenue & Pipeline" due to differing body copy length, breaking the grid baseline.
- The metric callout at the bottom of each card ("SCHEDULING + TEE SHEET / Coverage model recalculated hourly") has font size ~9px — functionally invisible.
- Icon treatment is inconsistent: some capabilities use filled circle icons, others show outline strokes. The visual weight differs noticeably.

**Fix:**
- Use CSS Grid with `align-items: stretch` and ensure cards use `display: flex; flex-direction: column; justify-content: space-between` so metrics are pinned to the bottom.
- Increase metric callout labels to `10px` minimum, or convert the bottom area to a highlighted pill tag for scannability.
- Audit all 5 capability icons and enforce a single icon style — recommend all-fill at 20×20px.

---

## `home-slice-04.png` — Comparison Table
**Grade: B**

**Strengths:**
- Comparison table is a high-conversion pattern — the Swoop column highlighted in orange-tinted background with checkmarks vs. X's is clear and fast to scan.
- "COMPARE" eyebrow + bold headline at appropriate size.

**Problems:**
- "Waitlist Tools," "Your CRM," "Spreadsheets" column headers are identical in visual weight to the "FEATURE" column header — there's no visual hierarchy differentiating the competitor labels from the feature axis.
- "PARTIAL" in competitor cells uses gray text on white — the `PARTIAL` label font size (~9px) is too small for comfortable reading.
- The table bottom clips into a new "Why not just..." section with insufficient padding. The table feels truncated.
- Table row alternating banding is either absent or extremely subtle — hard to track rows across 4 columns.

**Fix:**
- Bold or uppercase-label competitor column headers distinctly; add `font-weight: 600` and slightly darker text color.
- Increase PARTIAL label to `11px` or replace with a half-filled icon (more scannable than text).
- Add `padding-bottom: 64px` below the table before the next section.
- Add subtle `background: #fafaf8` alternating row banding.

---

## `home-slice-05.png` — "Why Not Just..." + AI Agents Teaser
**Grade: C+**

**Strengths:**
- Three-column card layout for the objection-handling questions is appropriate and well-spaced.

**Problems:**
- Section has no visual section break from the comparison table above — flows directly into it without background change or whitespace reset.
- Card body text is dense — approximately 70 words per card with ~13px font size and tight `line-height`. Cognitive load is too high for a conversion site.
- "AGENTS" eyebrow before "Six AI agents working your club — live." is cropped at the bottom of this slice — the new section starts with insufficient top padding, making it feel glued to the objection cards.
- The objection card titles ("Why not just use a standalone waitlist tool?") could benefit from a question-mark icon or visual signal to differentiate them from benefit cards elsewhere.

**Fix:**
- Add `padding-top: 80px` to the objection section.
- Trim card body to ~40 words maximum; ruthlessly cut filler.
- Add a thin `border-top: 1px solid #e8e4dd` between sections as a separator.

---

## `home-slice-06.png` — AI Agents Live Panel (Dark UI Demo)
**Grade: A-**

**Strengths:**
- The dark terminal-style UI panel is the best-designed component on the entire home page — high visual contrast, distinctive brand moment, strong storytelling (LIVE status, agent feed, confidence badge, recommended action, projected NPS impact).
- The amber/orange on dark background for "NPS +14" is extremely legible and emotionally resonant.

**Problems:**
- The six agent cards below the dark panel (Member Pulse, Demand Optimizer, etc.) switch back to white-on-cream with very small label text (~10px descriptions) — there's a jarring quality drop when transitioning from the rich dark panel to these minimal cards.
- The "LIVE · 6 AGENTS ONLINE" header bar of the dark panel is tightly packed — the status dot, label, and breadcrumb all sit at ~11px and fight for attention.
- The dark panel's card corner radius doesn't match the white card corner radius — inconsistency in `border-radius` tokens.

**Fix:**
- Give the six agent summary cards a `background: #1a1a18` dark background to maintain visual continuity with the demo panel above, or give them significantly more visual weight on white with larger icons and more padding.
- Set consistent `border-radius: 12px` across all card components site-wide.
- Reduce breadcrumb "swoop.io / agents / stream" to a secondary opacity treatment.

---

## `home-slice-07.png` — "Every Signal. Every System." + Integrations Banner
**Grade: B-**

**Strengths:**
- Full-width dark banner with centered headline creates a strong visual pause in the page rhythm — "Every signal. Every system. One clubhouse of intelligence." is strong copy presented cleanly.

**Problems:**
- The banner's background appears to be a dark teal/stormy-sky photograph — at screenshot scale the image reads as a nearly-solid dark field, which loses texture and feels like it could simply be `background: #0f1a1a`. The image investment is not paying off at this density.
- The transition out of the banner into the Integrations section is too immediate — the "INTEGRATIONS" eyebrow appears very close to the bottom edge of the banner, not clearly on a new white panel.
- "Your tools manage operations. Swoop connects them." heading is repeated nearly identically across platform page — the headline is not meaningfully differentiated between pages.

**Fix:**
- Increase the hero image overlay opacity to ~60-70% so the background photograph texture reads clearly, or use a solid dark brand color and remove the image.
- Add `padding-top: 64px` on the Integrations section that follows.

---

## `home-slice-08.png` — Integrations Hub (Dark) + Category Grid
**Grade: B-**

**Strengths:**
- The hub-and-spoke integration diagram with orange center node is a strong conceptual visualization.
- The 7-category integration grid ("Tee Sheet & Booking," "Member CRM," etc.) with "X connected systems" green labels is clean and informative.

**Problems:**
- The dark background section mixes the hub diagram on the left with the feature bullets on the right — the right column text (white on near-black) has a font size of approximately 11-12px, which is too small for the primary feature communication in this section.
- "AI-Powered Predictive Recommendations" and the other bullet titles are `font-weight: 700` but the body descriptions are `font-weight: 400` at ~11px — too close in apparent weight at small sizes.
- "ROLLOUT TIMELINE" section appears as a darker card within the already-dark section — insufficient contrast between `#1a1a18` card and `#111` background.
- The "Typical launch: 10 business days." headline in orange on near-black is excellent, but the "No operational downtime." card beside it is white-on-dark with ~11px text and is nearly unreadable.

**Fix:**
- Increase feature bullet body text to `14px` minimum.
- Add `background: rgba(255,255,255,0.06)` to the ROLLOUT TIMELINE card for separation.
- Consider pulling the rollout timeline onto a white background section for better legibility and visual contrast with the dark integrations section.

---

## `home-slice-09.png` — Pricing Preview (within Home)
**Grade: B-**

**Strengths:**
- Clean three-tier pricing card layout; the "MOST POPULAR" badge on the middle card is visible.
- "$0/mo → $499/mo → $1,499/mo" price anchoring at large type is effective.

**Problems:**
- The pricing section here appears mid-page after the dark rollout timeline — the section break between dark and white is jarring without a sufficient transition.
- The "PRICING" eyebrow is in the same orange as all other eyebrows but sits on a white background with less top padding than other sections — it reads as if the section just starts without ceremony.
- "Signals + Actions + Member App" tier title overflows its card header area — the title is longer than the other two and breaks to two lines, making the cards visually uneven at the header level.

**Fix:**
- Add `padding-top: 96px` to the pricing preview section.
- Truncate or rewrite the third tier name to match character count of other tiers; consider "Pro + App" as a display label with full name below.

---

## `home-slice-10.png` — Pricing Cards (feature lists) + ROI Calculator Teaser
**Grade: C+**

**Strengths:**
- Checkmark lists are clean with good vertical rhythm.

**Problems:**
- Both the middle card CTA ("Book the 30-minute walkthrough") and the right card CTA ("Book the 30-minute walkthrough") are identical in label — but the left card has "Start on Signals (free)" as an outlined button while the other two have filled orange buttons. The right card button appears unstyled/ghost on white background — very low visual weight.
- The ROI Calculator section heading at the bottom of the slice ("What is member turnover costing your club?") starts without adequate visual separation from the pricing cards above.
- The ROI Calculator eyebrow "ROI CALCULATOR" is correct but orange on white at ~9px all-caps — the smallest label on the page.

**Fix:**
- Give the third tier CTA an orange border button style matching the ghost CTA hierarchy.
- Add minimum `padding-top: 80px` before ROI Calculator section.
- Increase all eyebrow labels site-wide to `11px` minimum with `letter-spacing: 0.08em`.

---

## `home-slice-11.png` — ROI Calculator Widget
**Grade: B+**

**Strengths:**
- The two-panel calculator layout (white input panel left, dark results panel right) is visually the most polished interactive element on the site — strong contrast, clear data hierarchy, monospaced number font for the calculated figures.
- Orange sliders against the white background are on-brand and immediately scannable.

**Problems:**
- "DUES PROTECTED" label on the chart is ~9px — the axis label is illegible at any normal reading distance.
- The dark results panel shows "EXPOSURE" and "WITH SWOOP" as section headers at ~9px uppercase — these could be `13px` with `letter-spacing: 0.1em` and would dramatically improve readability.
- "13× return on investment" in the results panel uses a smaller orange text and a lighter `font-weight` — this is the most important claim in the widget and should be the largest, boldest element in the dark panel.

**Fix:**
- ROI highlight: `font-size: 18px; font-weight: 800; color: var(--brand-orange)` and add a visual separator above it.
- Increase chart axis labels to `10px` minimum.
- Consider a sticky tooltip on the slider thumb showing the live value.

---

## `home-slice-12.png` — Proof / Live Demo Results
**Grade: B**

**Strengths:**
- Four-column stat grid (6 days / 91% / $312 / $1.38M) with bold orange numbers is extremely impactful — this is the strongest proof section on the site.
- Card descriptions beneath each stat are appropriately concise.

**Problems:**
- "EARLY WARNING SYSTEM," "WAITLIST PERFORMANCE," "REVENUE PER SLOT," "DUES AT RISK VISIBILITY" — stat category labels at the top of each card are ~9px uppercase — same illegibility problem as elsewhere.
- The "PROOF" eyebrow and "Intelligence in action: live demo results" headline could be larger — the heading is ~36px but on a white background it reads lighter than the same size on other sections because of the sparse surrounding whitespace.
- The orange CTA at the bottom ("FOUNDING PARTNER PROGRAM") is an outlined pill badge with light orange text on white — nearly invisible. This is a conversion point and it has the least visual weight of any CTA on the page.

**Fix:**
- Increase stat category labels to `11px` with `font-weight: 600`.
- The "FOUNDING PARTNER PROGRAM" pill: fill with `background: var(--brand-orange); color: white` to convert it from ghost to filled, or enlarge it to at least 40px height.

---

## `home-slice-13.png` — Founding Partner Program CTA Block
**Grade: B-**

**Strengths:**
- The three-column icon+benefit layout (Hands-on Onboarding / Shape the Roadmap / Locked-in Pricing) inside a rounded-border card is a clean, trustworthy pattern.
- "Apply for Founding Partner" orange filled CTA is well-sized and properly weighted.

**Problems:**
- The border of the founding partner card uses an orange dashed or thin outline that appears at low resolution as a sketchy/fragile border — it communicates urgency but reads visually cheap.
- The three benefit icons are small (~16px) orange outlines on white — they add almost no visual weight and could be removed without loss.
- Section below ("Built with the GMs who live it.") starts too close — insufficient padding bottom on the card.

**Fix:**
- Replace dashed orange border with `border: 2px solid var(--brand-orange)` (solid) and add a subtle `background: #fffaf5` fill to the card interior.
- Increase icons to 24×24px or replace with richer illustrated icons.
- Add `padding-bottom: 64px` after the card.

---

## `home-slice-14.png` — Testimonials
**Grade: B-**

**Strengths:**
- Three-column quote card layout is standard and appropriate.
- Large opening quotation mark (orange `"`) creates good visual entry points.

**Problems:**
- The testimonial attribution text ("G. Marchetti · GM · Founding partner · 380-member private club") is ~9px and uses a gray that renders as near-invisible on white background.
- "MEMBER RETENTION," "DEMAND OPTIMIZATION," "BOARD REPORTING" category labels on attribution rows are orange uppercase at ~8px — the smallest text on the site. These need to earn their space or be removed.
- The disclaimer text above the cards ("Swoop is in closed pilot with founding-partner clubs. Attributed quotes publish Q2 2026 — these are paraphrased with permission.") is centered at ~11px and reads like legal fine print dumped into the design.

**Fix:**
- Attribution text: `12px; color: #666; line-height: 1.5`.
- Category labels: increase to `10px` or replace with the category name as plain gray text.
- Disclaimer: left-align, reduce emphasis (e.g., `font-style: italic; color: #888`) and move to below the cards, not above.

---

## `home-slice-15.png` — FAQ
**Grade: B**

**Strengths:**
- Clean accordion pattern; open state with orange `—` and closed with `+` is standard and legible.
- Sufficient whitespace around the expanded answer text.

**Problems:**
- The FAQ section background is pure white (`#ffffff`) while the rest of the page uses cream (`#f5f0e8`) — this creates a harsh color inconsistency visible at the section boundary.
- Question text in collapsed state is approximately `15px` — slightly small for tap targets on mobile; iOS minimum recommended is 44px height per item.
- "FAQ" eyebrow before "Frequently asked questions" is redundant — the heading already communicates what it is.

**Fix:**
- Set FAQ section background to `var(--bg-cream)` to match the rest of the page.
- Ensure each accordion row has `min-height: 44px` and `padding: 16px 0`.
- Remove "FAQ" eyebrow; it adds noise.

---

## `home-slice-16.png` — Demo CTA / Footer
**Grade: B+**

**Strengths:**
- Full-bleed dark background with the golf silhouette photograph creates a strong emotional close — "See what your club misses today and can recover tomorrow." is the best headline on the site.
- The booking form (Name, Club, Email, Phone fields + orange CTA) is clean and compact.

**Problems:**
- Form field labels ("NAME," "CLUB," "EMAIL," "PHONE") are white uppercase at ~10px inside a dark card — adequate but sterile. The fields themselves are white-fill on the dark card which is good for contrast.
- The form's dark card has a lighter background than the hero backdrop — the visual hierarchy shows: dark photo bg > medium-dark form card > white inputs. This is correct layering but the medium card feels like an afterthought; it could be fully transparent with a subtle `backdrop-filter: blur(4px)` treatment.
- Footer is barebones — "swoop" wordmark, "Integrated Intelligence for Private Clubs," Investor Information link, copyright. No social links, no nav. For a B2B SaaS this is appropriate but there is excessive whitespace in the footer (the footer is roughly 40px tall with 40px of padding top and bottom — disproportionate to the page).

**Fix:**
- Form card: add `backdrop-filter: blur(8px); background: rgba(0,0,0,0.4)` for a more premium feel.
- Footer: reduce vertical padding to `24px top / 24px bottom`.

---

## `home-mobile-full.png` — Full Mobile View
**Grade: C**

**Strengths:**
- Hero section stacks well on mobile — headline and CTA are visible.
- Dark AI agents panel retains its visual distinctiveness even at mobile width.

**Problems:**
- The mobile view is extremely long — sections that work as 2-column grids on desktop collapse to single-column stacks without adequate section differentiation. Multiple consecutive white-on-cream sections blur together into an undifferentiated wall of cream text.
- The comparison table is not adapted for mobile — column headers and cells appear compressed to ~8px text, likely unusable on a real device.
- The ROI calculator widget does not appear to reflow properly for mobile — the two panels appear to stack, but the dark results panel appears to overflow or sit too close to the sliders.
- The agent demo panel on mobile loses most of its detail text — the "DETECTED SIGNAL" and "RECOMMENDED ACTION" content appears at ~8px equivalent.
- Several section eyebrows become entirely unreadable at mobile scale.

**Fix:**
- Comparison table: on mobile, collapse to a card-per-competitor layout using CSS `display: block` and hide the table entirely below `md:` breakpoint, replacing with a simplified card comparison.
- Set `font-size: 11px` minimum for all rendered text in production (enforce via `body { font-size: max(11px, 0.75rem) }`).
- ROI calculator: stack panels vertically with `flex-direction: column` at mobile, and ensure the dark results panel has `width: 100%`.

---

# PLATFORM PAGE

---

## `platform-hero.png` / `platform-slice-00.png`
**Grade: B**

**Strengths:**
- Centered single-column layout is clean and confident.
- Headline "Every signal. One operating view." is concise and well-sized (~44px).

**Problems:**
- The platform hero has no visual anchor or imagery — it's headline + subtext + single CTA on a plain cream background. Compared to the home hero's photograph, this feels sparse and less compelling.
- The CTA "Book the 30-minute walkthrough" is the same orange filled button but appears center-aligned on the page — fine, but it's visually disconnected from the subtext above (the gap between subtext and CTA is generous to the point of looking like two unrelated elements).
- Below the hero, "Most clubs are flying blind." section starts without any visual separation — it flows in the same cream background with no rhythm break.

**Fix:**
- Add a light UI screenshot or abstract data visualization above the fold on the platform hero to add visual anchoring.
- Reduce CTA top-margin to `32px` from the subtext (currently appears ~56px).

---

## `platform-slice-01.png` — Platform Problem Cards
**Grade: C+**

**Strengths:**
- Identical card grid to home page — recognizable component pattern.

**Problems:**
- This section is near-identical to the equivalent home page section. If a visitor navigates from Home to Platform, they see the same three problem cards repeated verbatim. This is a credibility problem disguised as a layout problem — it signals incomplete page differentiation.
- The "FIX IT" and "PROVE IT" labels at the bottom of the slice appear as tiny orange uppercase text floating in whitespace — they look like orphaned navigation labels with no visual context.

**Fix:**
- Replace or reduce the problem card section on Platform — show abbreviated versions or redirect focus to the platform-specific solution.
- Investigate the "FIX IT / PROVE IT" floating labels; if these are section anchors or labels they need far more visual treatment (background pill, larger size, contextual connection).

---

## `platform-slice-02.png` — Fix It / Prove It Column Layout
**Grade: B-**

**Strengths:**
- Two-column layout with the dark terminal/code mockup on the left (callback script approval UI) and the stat proof panel on the right creates a good "show + tell" pattern.

**Problems:**
- The dark code/terminal widget on the left is extremely dense — text inside it is ~9px and the syntax highlighting is compressed. At this rendered scale, the mockup communicates "there's a UI" but conveys no readable detail.
- The right column has "$32K / 9/14 members retained / $67K dues protected" stats and a Karen Wittman case study. The case study narrative text is ~11px in gray — too small and too light to anchor the proof story being told.
- "Not one system flagged her." in the Karen Wittman callout is bolded, which is good, but the surrounding text context buries it at small size.

**Fix:**
- Scale up the dark mockup terminal to show at minimum 2–3 readable lines of text; `font-size: 10px` minimum inside the code component.
- Increase case study narrative text to `14px` with `line-height: 1.6`.
- Consider pulling "Not one system flagged her." out as a pull-quote with `font-size: 18px; font-style: italic`.

---

## `platform-slice-03.png` — Five Core Capabilities Grid
**Grade: B-**

**Strengths:**
- Three-column grid with icon, headline, bullets, and a live metric callout is a solid repeating unit.

**Problems:**
- Same observations as home-slice-03: metric callout labels at the bottom of each card are ~9px.
- The grid at this screenshot shows 3 cards in top row — with only 5 total capabilities, the bottom row has 2 cards which creates an asymmetric grid (3+2). The two cards in the bottom row expand to fill the width, making them ~50% wider than the cards in the top row. This asymmetry is visually awkward.
- Icons are still inconsistent in fill vs. outline treatment.

**Fix:**
- Consider a 2+3 layout or a dedicated 5-column layout (each card narrower) rather than the 3+2 wrapping grid.
- Alternatively, add a 6th "Platform Overview" card as a visual placeholder to complete the grid.

---

## `platform-slice-04.png` — Capability Cards (partial) + Agents Section
**Grade: B-**

**Strengths:**
- Transition into the Agents section with "AGENTS" eyebrow and headline is well-paced.

**Problems:**
- The top of this slice shows the bottom of the capability cards cutting off — the grid is cropped mid-section, and the transition to agents lacks top padding that signals a new conceptual section.
- The dark agents panel here (Demand Optimizer selected) shows well at the section level but the caption text "Saturday tee block · 3 cancellations predicted · wind advisory" is ~9px inside the dark panel.

**Fix:**
- Ensure `padding-bottom: 80px` on capability cards section before agents section begins.

---

## `platform-slice-05.png` — Agents Panel (full) + Agent Summary Cards
**Grade: A-**

**Strengths:**
- The agents live-panel component is the strongest repeated design element across the site — dark, data-rich, on-brand.
- "91% fill" projected impact in orange on dark is immediately legible.

**Problems:**
- Same as home-slice-06: agent summary cards below the panel are visual anticlimaxes. The contrast between the rich dark panel and the minimal white summary cards is too severe.

**Fix:**
- Give agent summary cards a `border: 1px solid #e8e4dd` and `background: #fafaf8` with `padding: 20px` — add more presence.

---

## `platform-slice-06.png` — Member Experience Journey ("Your members feel it.")
**Grade: A-**

**Strengths:**
- Three-scenario narrative layout (01 Arrival / 02 The Nudge / 03 The Milestone) with numbered progression is distinctive — breaks the card-grid monotony.
- "James doesn't know Swoop exists. He just knows his club feels different." closing line is excellent copy presented well.
- The subtle numbered badge (01/02/03) in orange creates a visual rhythm across the row.

**Problems:**
- The scenario titles ("The club that knows you — before you walk in." etc.) vary in length significantly, causing the top of each card content to align inconsistently.
- The Swoop signal callouts beneath each story (the green dot + system action text) are ~10px and blend into the card body.

**Fix:**
- Set card title area to `min-height: 72px` with `align-items: flex-start` to enforce consistent card header height.
- Signal callouts: `font-size: 11px; background: #f0f7f0; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #4ade80`.

---

## `platform-slice-07.png` — One Operating View Banner + Integrations
**Grade: B-**

**Strengths:**
- Dark banner with centered headline creates the same strong visual pause as the home page.

**Problems:**
- This is the exact same dark-banner + integrations block from the home page, rendered identically on the platform page. Cross-page repetition at this scale is a structural design problem — visitors who read both pages see large duplicated sections.
- The platform page should use this space to show platform-specific detail (e.g., a deeper dive into how the intelligence layer works) rather than repeating the integration list.

**Fix:**
- On Platform, replace the integration category grid with a platform architecture diagram or a more detailed capabilities comparison. Keep the rollout timeline if useful.

---

## `platform-slice-08.png` — Integrations Hub (Platform) + Rollout Timeline
**Grade: B-**

Same observations as home-slice-08. The near-identical dark section appears on both pages. See home-slice-08 critique for specifics.

**Additional platform-specific problem:**
- The "ROLLOUT TIMELINE" sub-section on the platform page sits at the boundary where the page ends — the white footer immediately follows the dark section with no visual transition or padding, creating a harsh color jump.

**Fix:**
- Add `padding-bottom: 64px` to the integrations section before footer.

---

## `platform-slice-09.png` — Compare Table (Platform)
**Grade: B**

Same as home-slice-04. The comparison table is a valid and well-designed component. Issues (PARTIAL label size, column header hierarchy) carry over identically.

---

## `platform-slice-10.png` — "Why Not Just..." + Footer (Platform)
**Grade: C+**

**Strengths:**
- The three objection-handling cards are the same as home — consistent pattern.

**Problems:**
- The platform footer appears immediately after the three objection cards with no intervening CTA section — the platform page ends without a conversion moment. After all this content, there is no "Book a Demo" CTA before the footer. This is a structural conversion failure.
- The footer on platform is the same sparse two-line footer as the rest of the site.

**Fix:**
- Add a full-width CTA band before the platform footer — reuse the home page demo booking section or a condensed version ("Ready to see it with your data? → Book the walkthrough").

---

# PRICING PAGE

---

## `pricing-hero.png` / `pricing-slice-00.png`
**Grade: B+**

**Strengths:**
- Dark background hero with "The window is open. For a little while longer." headline is a strong urgency play, well-executed typographically.
- Three stat cards (3,000+ clubs / $2.1B / 67%) on dark background in orange numbers are instantly credible.

**Problems:**
- "WHY NOW" eyebrow appears at the top of the dark section in orange on dark — relatively low contrast given the dark background, not the bright orange of light-mode eyebrows.
- The dark hero background on the pricing page is the only page with a full-bleed dark hero — while distinctive, it's inconsistent with the cream/white hero pattern on all other pages. This inconsistency may be intentional (urgency framing) but it lacks visual connection to the brand system.
- Subtext body copy on the dark background (~14px, white/light gray) has adequate contrast but very long line length — at full width it appears to span 60+ characters.

**Fix:**
- Eyebrow on dark: use `color: #ff9f40` (lighter orange variant) or white for the eyebrow label for better dark-bg legibility.
- Cap subtext `max-width: 600px; margin: 0 auto` on the pricing hero.

---

## `pricing-slice-01.png` — ROI Calculator (Pricing Page)
**Grade: B+**

Identical component to home-slice-11. Grades and observations carry over. One pricing-page-specific note:

**Problems:**
- The calculator appears on both home and pricing pages identically. On pricing this is appropriate placement — a user deciding to buy should see ROI immediately. However, the transition from the dark "Why Now" hero to the white calculator section is abrupt without sufficient background transition or top padding.

**Fix:**
- Add a transitional `background: linear-gradient(to bottom, #1a1a18 0%, #ffffff 100%)` band between the dark hero and the white calculator section (approximately 80px height).

---

## `pricing-slice-02.png` — Pricing Cards
**Grade: B**

**Strengths:**
- The three-tier card layout is clean and well-proportioned; "MOST POPULAR" badge on middle card is a standard but effective conversion pattern.
- Feature checklist items are legible at this size.

**Problems:**
- Same CTA asymmetry as home-slice-10: middle card has filled orange CTA, third card has ghost button. The third tier at $1,499/mo is the premium tier — it should not have a weaker CTA treatment than the middle tier.
- The first card's "Start on Signals (free)" outlined CTA is correct hierarchy. But the third card button looks exactly like the first card's free tier button — visually suggesting they have equal value, which undermines the pricing ladder.

**Fix:**
- Third tier CTA: change to `background: #1a1a18; color: white; border: none` — a premium dark button that visually distinguishes it from both the mid-tier orange and the free-tier ghost.

---

## `pricing-slice-03.png` — Feature Lists (Continued) + FAQ Teaser
**Grade: B-**

**Strengths:**
- Checklist items are clean and the orange checkmark color is consistent.

**Problems:**
- The pricing FAQ section header ("Common questions") appears at the bottom of this slice with enormous top whitespace — the gap between the bottom of the pricing cards and "Common questions" appears to be ~120px, which is excessive and makes the page feel padded.
- "PRICING FAQ" eyebrow above "Common questions" is redundant — the context of being on the pricing page makes the label unnecessary.

**Fix:**
- Reduce `padding-top` before FAQ heading to `64px`.
- Remove "PRICING FAQ" eyebrow label; "Common questions" is sufficient.

---

## `pricing-slice-04.png` — Pricing FAQ + Footer
**Grade: B**

**Strengths:**
- Accordion pattern is consistent with home page.

**Problems:**
- The pricing FAQ has only 3 questions visible (Jonas/ClubEssential, setup time, founding partner pilot) — thinner than the home FAQ (5 questions). The section feels abbreviated on the page where buyers have the most objections.
- Footer immediately follows the FAQ — no conversion CTA. Same structural issue as the platform page.

**Fix:**
- Add 2–3 additional FAQ items specific to pricing (refund policy, per-seat vs. club pricing, integration costs).
- Add a final CTA band before footer: "Still have questions? Book a 15-minute call. → [Calendar link]".

---

# ABOUT PAGE

---

## `about-hero.png` / `about-slice-00.png`
**Grade: B+**

**Strengths:**
- "The humans in your clubhouse for six months." is a genuinely excellent headline — personal, specific, and differentiated from the rest of the marketing.
- Three team member cards (Tyler Hayes, Jordan Mitchell, Alex Chen) with orange avatar initials are clean and human.

**Problems:**
- The orange initial avatars (TH / JM / AC) are flat colored circles with white initials — they read as placeholder avatars, not intentional design. For a trust-building About page, actual photographs would dramatically increase perceived credibility.
- Team card body text at ~12px is small and the biographical descriptions feel truncated.
- Below the team cards a dark section ("MOAT") appears — the transition from the warm cream team section to the dark moat section has no intermediate visual bridge.

**Fix:**
- Replace initial avatars with actual photographs, or at minimum use a more designed avatar system (illustrated, gradient, or photographic silhouettes).
- Add `padding-bottom: 64px` on the team section before the dark moat section.

---

## `about-slice-01.png` — Moat Section (Dark) + Testimonials
**Grade: B-**

**Strengths:**
- The dark "Why this is hard to copy." section with "46 production tools / 12 months pilot data / #1 Jonas Club integration partner" stat grid is strong proof-of-moat.
- Orange numbers on dark are effective.

**Problems:**
- "Why this is hard to copy." headline at ~28px on dark background is significantly smaller than other page headlines (~40-44px) — it reads as a subheading, not a section headline, even though it's carrying heavy strategic weight.
- The "IN THEIR WORDS" section below starts with the same three testimonials seen on the home page — again, full content duplication.
- The moat section dark background and the testimonials light background transition abruptly.

**Fix:**
- Scale "Why this is hard to copy." to `font-size: 36px; font-weight: 800`.
- Differentiate testimonials on About — use different quotes, or show only the most board-level quote with a larger format.

---

## `about-slice-02.png` — Testimonials (lower) + Proof Section
**Grade: B-**

Same observations as home-slice-14 for testimonials. The "Intelligence in action: live demo results" proof section repeats from home page.

**Problems:**
- The "PROOF" section on the About page is complete content duplication of home-slice-12. A visitor coming from the home page to About sees this exact section a second time.

**Fix:**
- On About, replace the generic proof section with a single highlighted "Pinetree CC 300-member case study" narrative — specific story, specific numbers, specific GM quote. More personal than stat cards.

---

## `about-slice-03.png` — Proof Stat Cards + Founding Partner CTA
**Grade: B**

Same observations as home-slice-12. The founding partner card reappears here as well — this is the third appearance of this component (also on home).

**Fix:**
- The founding partner CTA is appropriate on About since the page is about who you work with. But differentiate the visual treatment — make it the full-width version on About, not the same card used on home.

---

## `about-slice-04.png` — Founding Partner (continued) + FAQ
**Grade: B-**

**Problems:**
- The FAQ on About is a fourth repetition of the same accordion component. Home, Platform, Pricing, and About all show substantially similar FAQ sections.
- The About FAQ has the same questions as all other pages — no About-specific questions (e.g., "What's the founding partner timeline?", "What happens after the pilot?").

**Fix:**
- About FAQ should contain About-specific questions only: What happens after the pilot?, Who manages the implementation?, What clubs are already in the program?.

---

## `about-slice-05.png` — FAQ (continued) + Footer
**Grade: C+**

**Problems:**
- The accordion questions here ("We already have Jonas and ClubEssential," "Do I need to replace my current software?," "How long does setup take?," "Is my members' data secure?," "What does a founding-partner pilot actually look like?") are identical to the home FAQ — word for word.
- The white FAQ section background is `#ffffff` while surrounding sections use cream — same background color inconsistency as home page.
- Footer ends the About page without a CTA — a page that sells the team and builds trust should close with the most personal CTA: "Talk to Tyler or Jordan directly → Book a call."

**Fix:**
- White FAQ background: `background: var(--bg-cream)`.
- Add a personalized CTA: "Have questions about the pilot? Book 20 minutes with the founder. → Tyler's calendar."

---

# CONTACT PAGE

---

## `contact-hero.png` / `contact-slice-00.png`
**Grade: B+**

**Strengths:**
- "See what your club misses today, and what you recover tomorrow." is the most compelling version of this headline across all pages.
- Four stat boxes ($1.38M / 3 / 91% / 9/14) below the headline are credible and specific — "pilot results · Fox Ridge Country Club (300 members)" attribution is excellent trust-building.
- Clean left-aligned layout.

**Problems:**
- The "PILOT RESULTS — FOX RIDGE COUNTRY CLUB (300 MEMBERS)" eyebrow is longer than any other eyebrow on the site (~60 characters) — at uppercase tracking it wraps to two lines at smaller viewports, breaking the eyebrow pattern.
- The stat boxes use a thin-border card on white background — same low-contrast card-on-white problem. On the contact page these need maximum visual impact.
- Transition from the white stats section into the dark form section (visible at the bottom of the slice) has no intermediate visual treatment.

**Fix:**
- Truncate eyebrow: "PILOT RESULTS — FOX RIDGE CC (300 MEMBERS)" or split into two lines intentionally.
- Stat cards: increase `box-shadow`, or place them on a light gray background for separation.

---

## `contact-slice-01.png` — Demo Booking Form (Dark)
**Grade: B+**

**Strengths:**
- Dark background with the golf action photograph backdrop creates a premium, confident close.
- Form is clean — 4 fields, 1 CTA, micro-copy ("No credit card required · 30-minute walkthrough · Cancel anytime").
- "Or email us at demo@swoopgolf.com · (800) 225-5102" provides a fallback CTA.

**Problems:**
- The form field borders (white on dark card) are extremely subtle — fields may feel invisible to users on certain monitors with brightness settings.
- The "Book Your Demo" button is a large filled orange button — correct and dominant. But it sits at the bottom of a 4-field form with no visual breathing room between the last input and the CTA (appears to be ~12px gap).
- "BOOK A DEMO" eyebrow in orange on dark — same low-contrast eyebrow issue from pricing-hero-dark.
- The overall form card has no visible `border-radius` differentiation from the outer dark panel — it blends into the background.

**Fix:**
- Form fields: add `border: 1px solid rgba(255,255,255,0.3)` for visible delineation on the dark card.
- Add `margin-top: 16px` before the submit button.
- Give the form card `background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px`.

---

# PRIORITIZED TOP-10 DESIGN FIXES (Ranked by Visual Impact)

---

### #1 — Micro-text Epidemic: Enforce 11px Minimum for All Labels
**Impact: Critical**  
**Affects:** Every page, every section.  
Eyebrow labels (~9px), card stat descriptors (~8-9px), "WHY THIS SURFACED" labels (~8px), attribution text (~9px), and confidence badges (~9px) are all rendered below the threshold of comfortable reading. This is a systemic problem that degrades perceived professionalism across the entire site.  
**Fix:** Add `font-size: max(11px, 0.7rem)` as a minimum floor to the `label`, `.eyebrow`, `.stat-label`, `.attribution` CSS classes. Audit every `text-xs` Tailwind class and bump to `text-sm` (14px) or `text-xs` constrained to minimum 11px.

---

### #2 — Cross-Page Content Duplication Destroys Page-Level Value
**Impact: High**  
**Affects:** Platform, About, Pricing.  
The problem cards, testimonials, proof stats, FAQ, comparison table, integration hub, and founding partner CTA appear nearly verbatim on 3–4 pages. A visitor reading more than one page sees the same content repeated, which destroys trust and suggests the site is thin. Each page should have at least 60% unique content.  
**Fix:** Audit all sections and assign ownership: Home = overview, Platform = deep capabilities, Pricing = ROI/comparison, About = team/moat/stories. Strip shared components down to abbreviated teasers on non-home pages.

---

### #3 — Section Background Rhythm: Break Up the Cream Monotony
**Impact: High**  
**Affects:** Home, Platform, About.  
Multiple consecutive sections share the same `#f5f0e8` cream background with white cards. Without background alternation, the page reads as a single undifferentiated block. The dark sections (AI agents, integrations) are islands of contrast — the sections between them need more rhythm.  
**Fix:** Alternate section backgrounds: cream → white → cream → dark. Apply `background: #ffffff` to every other light section. Establish a CSS custom property `--section-bg-alt: #ffffff` and apply systematically.

---

### #4 — Missing Mid-Page CTAs on Platform and About Pages
**Impact: High — Conversion**  
**Affects:** Platform (slice-10), About (slice-05), Pricing (slice-04).  
Three pages end without a conversion CTA before the footer. Platform ends with objection cards. About ends with FAQ. Pricing ends with 3 FAQ items. All three need a final CTA band.  
**Fix:** Add a standardized `<DemoCTABand />` component before each page's footer — "Book the 30-minute walkthrough" or page-specific variant (About: "Talk to the founder," Platform: "See it with your own data").

---

### #5 — Pricing Tier CTA Visual Hierarchy is Broken
**Impact: High — Conversion**  
**Affects:** Pricing, Home pricing preview.  
The $0/mo free tier and the $1,499/mo premium tier use the same ghost CTA button style, while only the $499/mo middle tier gets the filled orange button. This makes the premium tier look low-confidence.  
**Fix:** Assign three distinct button styles: Free tier → ghost outline, Mid tier → filled orange (current), Premium tier → filled dark (`#1a1a18` background, white text). This creates a visual ladder that matches the price ladder.

---

### #6 — Comparison Table PARTIAL Labels and Column Hierarchy
**Impact: Medium-High**  
**Affects:** Home, Platform.  
"PARTIAL" cell values in competitor columns are ~9px gray text — illegible. Competitor column headers have identical weight to the feature axis column. The table's scannability is compromised.  
**Fix:** Replace text "PARTIAL" with a half-filled circle icon (⬤ at 50% opacity) or a yellow warning icon. Set competitor column headers to `font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em` to differentiate them from feature row labels.

---

### #7 — Agent Summary Cards Visual Anticlimax After Dark Panel
**Impact: Medium**  
**Affects:** Home, Platform.  
The six agent summary cards that follow the dark live-demo panel are visually weak — white on cream with tiny text. The tonal drop from the rich dark UI to these minimal cards reads as "the exciting demo is over, here's boring documentation."  
**Fix:** Give agent cards a dark variant (`background: #1c1c1a; color: white; border: 1px solid rgba(255,165,0,0.2)`) or significantly increase card visual weight with larger icons (32px), larger type (15px), and more padding (24px).

---

### #8 — Team Member Avatars on About Page Look Placeholder
**Impact: Medium**  
**Affects:** About.  
The TH / JM / AC orange initial circles are the only human element on a page designed to sell the team. They communicate "we haven't gotten photos yet."  
**Fix:** Replace with actual founder photographs, or use a consistent illustrated avatar style (e.g., Notion-style illustrated portraits, or high-contrast black-and-white headshots in orange-tinted circle frames). If photos are unavailable, at minimum increase the avatar to 64×64px with a subtle shadow and the role label in a colored pill below the name.

---

### #9 — Mobile Comparison Table is Non-Functional
**Impact: Medium**  
**Affects:** Home, Platform (mobile views).  
The four-column feature comparison table is not adapted for mobile. Columns compress to illegible width. This is a dead zone on mobile — users who care enough to read the comparison table on mobile cannot.  
**Fix:** Below `md:` breakpoint, hide the table and show a mobile-optimized alternative: a card for each competitor with a "Swoop vs. [X]" toggle list. Or collapse to a 2-column "Swoop vs. Everything Else" comparison. Both approaches are easier to read on touch screens.

---

### #10 — FAQ Section Background Inconsistency Site-Wide
**Impact: Low-Medium**  
**Affects:** Home, About, Pricing, Platform.  
The FAQ section on every page uses `background: #ffffff` (pure white) while the rest of the page uses `background: #f5f0e8` (cream). This creates a visible color jump at every FAQ section boundary.  
**Fix:** Set `.faq-section { background: var(--bg-cream, #f5f0e8) }` globally. This single CSS change fixes the inconsistency on all four pages simultaneously.

---

# SUMMARY SCORECARD

| Page | Section | Grade |
|------|---------|-------|
| Home | Hero | B+ |
| Home | Social Proof / Problem Cards | C+ |
| Home | Problem Cards (lower) + Platform Teaser | C |
| Home | Capability Cards | B- |
| Home | Comparison Table | B |
| Home | Why Not Just + Agents Teaser | C+ |
| Home | AI Agents Live Panel | A- |
| Home | Every Signal Banner + Integrations | B- |
| Home | Integrations Hub + Category Grid | B- |
| Home | Pricing Preview | B- |
| Home | Pricing Feature Lists + ROI Teaser | C+ |
| Home | ROI Calculator | B+ |
| Home | Proof / Live Demo Results | B |
| Home | Founding Partner CTA | B- |
| Home | Testimonials | B- |
| Home | FAQ | B |
| Home | Demo CTA + Footer | B+ |
| Home | Mobile Full | C |
| Platform | Hero | B |
| Platform | Problem Cards | C+ |
| Platform | Fix It / Prove It Layout | B- |
| Platform | 5 Core Capabilities | B- |
| Platform | Agents Section | A- |
| Platform | Member Experience Journey | A- |
| Platform | Banner + Integrations | B- |
| Platform | Integrations Hub + Rollout | B- |
| Platform | Compare Table | B |
| Platform | Why Not Just + Footer | C+ |
| Pricing | Hero (Dark) | B+ |
| Pricing | ROI Calculator | B+ |
| Pricing | Pricing Cards | B |
| Pricing | Feature Lists + FAQ Teaser | B- |
| Pricing | FAQ + Footer | B |
| About | Hero + Team Cards | B+ |
| About | Moat + Testimonials | B- |
| About | Testimonials + Proof | B- |
| About | Proof Stats + Founding Partner | B |
| About | FAQ | B- |
| About | FAQ + Footer | C+ |
| Contact | Hero + Stats | B+ |
| Contact | Demo Form (Dark) | B+ |

**Overall Site Grade: B-**  
Strong visual identity and excellent individual components (AI agent panel, ROI calculator, dark CTA section). Degraded by systemic micro-text illegibility, pervasive content duplication across pages, and insufficient conversion architecture on secondary pages.
