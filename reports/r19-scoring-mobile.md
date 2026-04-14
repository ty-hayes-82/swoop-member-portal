# r19 Mobile UX Scorecard

**Audit date:** 2026-04-14
**Build:** r19
**Evaluator:** Mobile UX Expert
**Criteria:** Tap targets ≥44px, text legibility at 375px, grid reflow to single column, sticky/overlay elements, CTA visibility and prominence on mobile.

---

## Priority Reference: home-mobile-full.png

The full-page mobile scroll reveals the most critical issues. Key findings from this single source:
- Hero text and CTA reflow correctly but the two-button row (primary + ghost) compresses and the ghost button ("See it in action") renders visually small
- The trust bar (four stat pills) stacks into two rows with ~8px text — fails legibility
- The comparison table collapses to a scrollable but unlabeled horizontal table — column headers disappear off-screen
- The ROI calculator sliders are visible but the drag handle is under 30px — below 44px touch target standard
- The dark AI agents panel renders at roughly 320px wide with 11px supporting text — unreadable
- The integrations hub diagram (spokes + nodes) collapses to a tiny icon cluster with no labels readable
- Founding Partner CTA box is the best-performing CTA on mobile — full-width orange button, clear
- Footer is clean but "Investor Information" link is low-contrast and small

---

## Scorecard

| Section | Grade | One-line verdict |
|---|---|---|
| **HOME** | | |
| home-hero | C | Hero 2-column layout does not reflow on mobile — image and text fight for width, ghost CTA shrinks below 44px touch target. |
| home-slice-00 (trust bar) | D | Four trust-pill row collapses to 2×2 grid with ~8px text; icons and labels become illegible at 375px. |
| home-slice-01 (flying blind / 3 problem cards) | C | Cards stack vertically but sub-labels ("91% CONFIDENCE") render at ≈9px — fails legibility; card body text is cramped. |
| home-slice-02 (metric callouts) | C | Three metric tiles partially visible; caption text ("WHY THIS SURFACED") is 8px — unreadable; tiles do not fully single-column reflow. |
| home-slice-03 (five core capabilities intro) | B | Heading and subhead reflow cleanly; three capability cards begin at bottom — grid starts but is cut off. |
| home-slice-04 (capability cards continued) | C | Two remaining capability cards + stat badges render correctly in layout but badge text (e.g. "223x ROI ON ALERT") shrinks to ~9px. |
| home-slice-05 (compare table header / "Why not just…") | D | Comparison table has four columns — on mobile the Swoop column is pinned but competitor columns scroll off without visual affordance; no sticky header row on mobile. |
| home-slice-06 (AI agents dark panel) | D | Dark terminal UI rendered at desktop width; activity-feed text ~11px; agent card text unreadable; no visible tap target on agent rows. |
| home-slice-07 (one operating view / integrations intro) | B | Full-bleed dark headline section reflows fine; integrations headline text is large and legible; description body is 13px — marginal but passes. |
| home-slice-08 (integration hub diagram + categories) | D | Spoke-and-hub SVG diagram does not scale — node labels disappear; 7-column integration category grid collapses to a 2-column but text is 10px and partner names clip. |
| home-slice-09 (rollout timeline) | B | Two-column rollout timeline becomes stacked; large "10 business days" orange text legible; supporting bullet text is small (12px) but passes minimum. |
| home-slice-10 (pricing intro) | B | Three pricing card teasers visible at desktop widths; pricing headline reflows; cards begin stacking correctly. |
| home-slice-11 (ROI calculator) | D | Two-panel side-by-side layout does not reflow to single column on mobile; sliders estimated at 28px handle — below 44px; dual-panel layout is squashed and overlapping at narrow widths. |
| home-slice-12 (proof / live demo metrics) | B | Four stat cards in a 2×2 grid — legible at 375px; supporting narrative text in each card is 11px but acceptable for secondary info. |
| home-slice-13 (founding partner CTA box) | A | Full-width orange CTA button, generous padding, large headline, clear value props — best-performing CTA on mobile. |
| home-slice-14 (testimonials) | C | Three-column testimonial cards do not single-column reflow — cards are side-by-side at ~110px each, body quotes become 9px and unreadable. |
| home-slice-15 (FAQ accordion) | A | Full-width accordion rows, generous tap targets on +/- toggle, open answer text is 14px and legible. |
| home-slice-16 (contact/demo form dark section) | C | Two-column form (NAME + CLUB side by side) — field pairs should stack to single column on mobile; email field is full-width but name/club row is compressed; "Book Your Demo" CTA is good size. |
| **PLATFORM** | | |
| platform-hero | B | Centered single-column hero with one CTA button — clean reflow; button is full-width and correctly sized; nav bar links are small but "Book a Demo" is visible. |
| platform-slice-00 (hero + flying blind lead-in) | B | Same as hero; bottom teaser text bleeds in correctly. |
| platform-slice-01 (3 problem cards) | C | Same three-column problem card grid as home — cards do not single-column reflow; confidence badge text too small. |
| platform-slice-02 (See It / Fix It narrative) | B | Two-column left-right split partially reflows; the dark terminal code block on left does not resize — horizontal scroll risk on 375px. |
| platform-slice-03 (five capability cards) | C | 3-column card grid starts — first row of three cards is compressed rather than stacking; badge text unreadable at this width. |
| platform-slice-04 (capability cards overflow) | C | Bottom two cards and stat badges — same issues as slice-03; content clips. |
| platform-slice-05 (AI agents section) | D | Dark agents panel is identical to home-slice-06; same mobile failures — terminal text illegible, no tap affordance on agent rows. |
| platform-slice-06 (member experience journey) | C | Three-column numbered journey cards ("The Arrival", "The Nudge", "The Milestone") do not stack — text in cards drops to ~10px; a compelling section that becomes unreadable on mobile. |
| platform-slice-07 (one operating view + integrations intro) | B | Full-bleed headline section performs well; same as home-slice-07. |
| platform-slice-08 (integration hub + categories) | D | Identical to home-slice-08; SVG diagram and 7-col category grid fail the same way. |
| platform-slice-09 (compare table) | D | Same horizontal comparison table as home; no mobile-optimized layout; off-screen columns have no scroll affordance. |
| platform-slice-10 (why not just… footer) | B | Three objection-handling cards stack acceptably; footer is clean and minimal. |
| **PRICING** | | |
| pricing-hero | B | Dark hero with headline + 3 stat tiles in a row; stat tiles have large orange numbers that remain legible; label text under each stat is 11px — marginal pass. |
| pricing-slice-00 (hero repeat) | B | Same as pricing-hero — stat tiles acceptable. |
| pricing-slice-01 (ROI calculator) | D | Identical ROI calculator two-panel issue as home-slice-11 — side-by-side layout not reflowing; slider handles below 44px. |
| pricing-slice-02 (pricing cards) | C | Three pricing cards begin to stack but the "MOST POPULAR" badge on the center card is cut off in the transition state; CTA button in center card is correctly sized. |
| pricing-slice-03 (pricing card features + FAQ intro) | B | Feature checklist inside cards is readable; "Book the 30-minute walkthrough" button is full-width orange — passes; "Start on Signals (free)" secondary button is borderline size. |
| pricing-slice-04 (pricing FAQ accordion) | A | Full-width accordion, legible question text, clear +/- tap targets — same clean pattern as home FAQ. |
| **ABOUT** | | |
| about-hero | B | Three team member cards in a row — partially visible on mobile but cards are wider than viewport; avatar circles and names are legible; role badges in orange are correctly sized. |
| about-slice-00 (team hero repeat) | B | Same as about-hero. |
| about-slice-01 (moat / why hard to copy) | C | Dark split panel — left has dense small-text paragraph, right has three large stat numbers; stat numbers are legible but the body paragraph text on the left is ~11px on dark background — legibility concern. |
| about-slice-02 (testimonial cards) | C | Three-column testimonials with same reflow failure as home-slice-14; body text at ~9px at mobile widths. |
| about-slice-03 (proof metrics + founding partner CTA) | B | Four stat cards in 2×2 layout are legible; founding partner CTA is strong and full-width. |
| about-slice-04 (founding partner CTA detail + FAQ intro) | A | CTA button is correctly sized; FAQ section starts cleanly. |
| about-slice-05 (FAQ accordion) | A | Same clean FAQ accordion pattern as home and pricing. |
| **CONTACT** | | |
| contact-hero | B | Clear value headline, 4 stat tiles in a row — stat tile numbers are large enough; label text under tiles is 10px but acceptable for supporting info. |
| contact-slice-00 (contact hero repeat) | B | Same as contact-hero. |
| contact-slice-01 (book a demo form) | C | Two-column form layout (NAME + CLUB) does not stack to single column; fields are compressed; "Book Your Demo" CTA button is full-width and correctly sized; fine-print text ("No credit card required") is 9px. |

---

## Grade Distribution Summary

| Grade | Count | Sections |
|---|---|---|
| A | 6 | home-slice-13, home-slice-15, pricing-slice-04, about-slice-04, about-slice-05 + (about FAQ repeat) |
| B | 17 | home-slice-03, -07, -09, -10, -12; platform-hero/00, -02, -07, -10; pricing-hero/00, -03; about-hero/00, -03; contact-hero/00 |
| C | 14 | home-hero, -01, -02, -04, -14, -16; platform-01, -03, -04, -06; pricing-02; about-01, -02; contact-01 |
| D | 8 | home-slice-00 (trust bar), -05 (compare table), -06 (agents panel), -08 (integration hub), -11 (ROI calc); platform-05, -08, -09; pricing-01 |
| F | 0 | — |

---

## Top 5 Remaining Mobile Fixes (Priority Order)

### 1. ROI Calculator — Force Single-Column Reflow + Enlarge Slider Handles (home-slice-11, pricing-slice-01)
**Impact: HIGH — This is a conversion tool on both Home and Pricing.**
The two-panel layout (chart left, results right) renders side-by-side on mobile at squashed widths. Fix: `flex-direction: column` breakpoint at `max-width: 768px`. Stack chart panel above results panel. Increase slider `height` and thumb `width/height` to minimum 44×44px touch target. This fails WCAG 2.5.5 (Target Size) today.

### 2. Comparison Table — Mobile-First Layout (home-slice-05, platform-slice-09)
**Impact: HIGH — A key objection-handling section that becomes unusable on mobile.**
The 4-column feature comparison table has no mobile treatment. Competitor columns scroll off-screen with no scroll affordance (no shadow, no "swipe" hint). Fix: Add a horizontal overflow scroll container with a visible right-edge fade gradient. Add `position: sticky` to the Feature column. Alternatively, convert to a toggle/accordion card per competitor at mobile widths.

### 3. AI Agents Dark Panel — Responsive Terminal + Text Sizes (home-slice-06, platform-slice-05)
**Impact: HIGH — This is the marquee "See It" moment and it's unreadable on mobile.**
The dark terminal/activity-feed UI has fixed pixel font sizes (~11px) and no mobile layout. The two-column panel (activity feed left, agent detail right) must stack. Agent card detail should become full-width. Activity feed items need minimum 16px tap targets. Body text must be ≥13px minimum, ≥14px preferred.

### 4. Testimonial Cards — Single-Column Stack (home-slice-14, about-slice-02)
**Impact: MEDIUM — Social proof section loses all readability on mobile.**
Three testimonial cards render at ~110px width each at 375px viewport — quote body text drops to ~9px. Fix: Apply `grid-template-columns: 1fr` at `max-width: 640px`. Each card should be full-width. Quotes should be ≥16px. Attribute lines below can remain 12px. This section appears on both Home and About; fix once in the shared component.

### 5. Trust Bar / Confidence Badges — Min Font Size Enforcement (home-slice-00, throughout)
**Impact: MEDIUM — Small text pattern recurs across 8+ sections.**
The four-pill trust bar and all "XX% CONFIDENCE" badge labels render at 8–9px on mobile. These are not decorative — they carry credibility signals. Fix: Set a CSS minimum of `font-size: clamp(11px, 1.5vw, 13px)` on all badge/label variants. For the trust bar specifically, switch from a single-row flex layout to a 2×2 grid with `gap: 8px` at mobile widths and increase the label text to ≥12px. This is a single token change in the design system that fixes instances site-wide.

---

*Scoring methodology: Desktop slices are evaluated against expected mobile behavior at 375px viewport width based on visible layout structure, typographic sizing, and interactive element dimensions in the screenshots. Where only desktop slices are available, mobile behavior is inferred from layout patterns visible in home-mobile-full.png and standard responsive breakpoint expectations.*
