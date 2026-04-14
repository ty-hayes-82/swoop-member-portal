# Mobile UX Critique — r18
**Date:** 2026-04-14
**Reviewer:** Mobile UX Audit (claude-sonnet-4-6)
**Scope:** All pages — Home, Platform, Pricing, About, Contact
**Primary focus:** `home-mobile-full.png` + all section slices

---

## CRITICAL UP-FRONT FINDING

The `home-mobile-full.png` screenshot is the most damning single artifact in this review. It reveals the actual rendered mobile experience: the layout compresses the desktop grid into a narrow viewport but multiple sections fail to reflow to single-column properly. Navigation is hamburger-less (full desktop nav visible, horizontally compressed). The hero's two CTAs appear stacked correctly but the font sizes for body copy appear to render at ~11–12px. The social-proof ticker bar (4 items horizontal) does not reflow. The pricing cards (3-column) compress side-by-side instead of stacking. The ROI calculator's dual-panel layout is clearly cut off on the right side. This is not a responsive site — it is a desktop site that shrinks.

---

## HOME PAGE

### home-hero.png / home-slice-00.png — Hero Section
**Grade: C**

**Mobile strengths:**
- Headline copy is large and punchy — scales well at reduced size
- Primary CTA "Book the 30-minute walkthrough" uses a filled button that maintains visual weight

**Mobile failures:**
- Desktop nav with 3 text links + CTA all visible in one row — no hamburger menu. At 390px this will either overflow or compress to ~10px link text, far below the 44px tap target minimum
- Two-column layout (text left, hero image right) does not appear to reflow to single column. Image will be ~50% width on mobile, making headline copy compete for horizontal space
- Subtitle body text appears at approximately 13–14px desktop — will render below 12px on mobile if not clamped with a `clamp()` or `min-font-size`
- Social proof pills ("Live in under 2 weeks · No rip-and-replace · 28 integrations") are inline — will wrap awkwardly or overflow horizontally at 390px

**Fix:**
```css
/* Hamburger nav — required */
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-hamburger { display: flex; }

  /* Hero reflow */
  .hero-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  .hero-image { order: -1; max-height: 220px; object-fit: cover; }

  /* Pill row */
  .trust-pills {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
}
```

---

### home-slice-01.png — "Most clubs are flying blind" + Trust Banner
**Grade: D**

**Mobile strengths:**
- Section headline is bold, high contrast, reads at any scale
- Three problem cards have clear titles

**Mobile failures:**
- Trust ticker at top (4 items: "Founding partner program", "300-member Pinetree CC", "28 integrations", "Live in under 2 weeks") is a horizontal 4-column flex row. On mobile this becomes 4 items at ~85px each — text is illegible (~9px) or forces horizontal scroll
- Three problem cards render as a 3-column grid — on 390px this compresses card body text to approximately 11px, well below the 16px minimum for legibility
- Confidence badge labels ("91% CONFIDENCE", "68% CONFIDENCE") are ~8px uppercase — invisible on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .trust-ticker {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .problem-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .confidence-badge {
    font-size: 10px; /* increase from implied ~8px */
  }
}
```

---

### home-slice-02.png / home-slice-03.png — Platform Capabilities (5-card grid)
**Grade: D**

**Mobile strengths:**
- Card titles ("Member Intelligence", "Tee Sheet & Demand", etc.) are legible at section level
- Metric callouts ("6.4 wks", "91%", "$5.7K") are large and high-contrast

**Mobile failures:**
- Five capability cards render as a 3+2 grid. On mobile this compresses to unreadable — body text at ~11px with 3 items on a 390px row is ~120px per card, far too narrow
- "Five core capabilities. One operating view." headline appears to be a desktop-size h2 (~36px) — no `clamp()` observed, likely renders at oversized or unscaled on mobile
- Data source labels ("CRM + POS + EMAIL", "TEE SHEET + WEATHER + WAITLIST") are micro-text (~9px) — invisible on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .capabilities-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  h2.section-headline {
    font-size: clamp(1.75rem, 6vw, 3rem);
  }

  .data-source-label {
    font-size: 11px;
    letter-spacing: 0.05em;
  }
}
```

---

### home-slice-04.png — Comparison Table ("Built to replace patchwork ops")
**Grade: F**

**Mobile strengths:**
- Section headline reads clearly at desktop scale

**Mobile failures:**
- Comparison table has 5 columns (Feature, Swoop, Waitlist Tools, Your CRM, Spreadsheets) — this is a catastrophic mobile pattern. At 390px each column is ~78px wide. Column headers become illegible (~9px), checkmarks and "PARTIAL" text compress to unreadable
- No horizontal scroll hint, no sticky first column, no accordion fallback
- "PARTIAL" text labels are ~9px — invisible even on 2x retina
- Table row tap height appears to be ~28px — below the 44px minimum for interactive rows if these are ever made tappable (e.g., for accordion)

**Fix — rethink the pattern entirely on mobile:**
```css
@media (max-width: 768px) {
  /* Option A: Convert to stacked comparison cards */
  .comparison-table { display: none; }
  .comparison-mobile-cards { display: block; }

  /* Option B: Horizontal scroll with sticky first column */
  .comparison-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .comparison-table td:first-child {
    position: sticky;
    left: 0;
    background: #fff;
    z-index: 1;
    min-width: 120px;
  }
}
```

---

### home-slice-05.png — "Why not just..." Objection Cards + Agents Intro
**Grade: C**

**Mobile strengths:**
- Three objection-handling cards are copy-rich and clearly delineated
- Section transitions via clean heading with neutral background

**Mobile failures:**
- Three cards side-by-side at desktop — on mobile at ~120px each width, body text is illegible (~10px)
- "Six AI agents working your club — live." headline spans well but the subheader body copy below is ~14px desktop — likely 11–12px mobile

**Fix:**
```css
@media (max-width: 768px) {
  .objection-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
```

---

### home-slice-06.png — AI Agents Live Panel
**Grade: C**

**Mobile strengths:**
- Dark terminal UI panel is visually striking and dense — creates visual intrigue
- Activity feed on left, detail panel on right creates hierarchy

**Mobile failures:**
- The agent panel is a side-by-side dark UI component: activity feed (left ~40%) and agent detail (right ~60%). On mobile this will either compress both to unreadable widths or overflow the viewport
- Dot navigation (5 dots) below panel renders at ~6px each — no tap target
- Agent card grid below (6 cards, 4-per-row) will compress to illegible widths on mobile
- Text inside the dark panel ("DETECTED SIGNAL", "RECOMMENDED ACTION") appears at ~10px — invisible on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .agent-panel {
    flex-direction: column;
  }
  .agent-panel__feed {
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
  }
  .agent-panel__detail {
    width: 100%;
  }

  .agent-cards-grid {
    grid-template-columns: 1fr 1fr; /* 2-col on mobile */
    gap: 12px;
  }

  .dot-nav button {
    width: 12px;
    height: 12px; /* still below 44px — wrap in larger hit area */
    padding: 16px 8px;
  }
}
```

---

### home-slice-07.png / home-slice-08.png — Integrations (Hub Diagram + Category Grid)
**Grade: D**

**Mobile strengths:**
- "Every signal. Every system." headline has strong visual weight
- Integration category grid uses clear category labels

**Mobile failures:**
- Hub-and-spoke diagram is a radial SVG/canvas graphic. On mobile at 390px this becomes either very small (hub nodes unreadable) or overflows horizontally with no scroll
- 7-column integration category grid (Tee Sheet & Booking, Member CRM, POS & F&B, Communications, Staffing & Payroll, Finance & BI, Web & Lead Capture, Access & Activity) — 8 categories in what appears to be a 4-column dark grid. At mobile this likely becomes 2-column with very small text (~11px)
- Integration partner names within each category ("ForePi, Lightspeed Golf, Club Prophet, Tee-On") appear at ~10px — invisible on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .hub-diagram { display: none; } /* Replace with static list or simplified icon row */

  .integration-categories-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .integration-category-partners {
    font-size: 12px;
  }
}
```

---

### home-slice-09.png — Simple Pricing Preview + Pricing Intro
**Grade: C**

**Mobile strengths:**
- Pricing section headline is clean and large — "Simple pricing. No long-term contracts."
- Three-tier layout is recognizable pattern for mobile users

**Mobile failures:**
- Three pricing cards side-by-side: at 390px each card is ~120px wide — price text ($0/mo, $499/mo, $1,499/mo) will be cramped and feature bullet text (~11px) unreadable
- "MOST POPULAR" badge on middle card will have tap target issues (the badge is decorative, but visually it may clip)
- The $1,499/mo price wraps oddly ("Signals + Actions + Member App") which at mobile compression becomes a 3-line label in a tiny card

**Fix:**
```css
@media (max-width: 768px) {
  .pricing-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
    gap: 24px;
  }
}
```

---

### home-slice-10.png — Pricing Feature Lists + ROI Calculator Header
**Grade: C**

**Mobile strengths:**
- Checklist items are clearly formatted with check icons
- Two distinct CTAs ("Start on Signals (free)" vs "Book the 30-minute walkthrough") maintain visual difference

**Mobile failures:**
- CTA "Start on Signals (free)" appears as an outlined button — on mobile at compressed width this button may not meet 44px height
- ROI calculator intro headline is visible but without the interactive component it is meaningless — see slice-11

---

### home-slice-11.png — ROI Calculator (Interactive)
**Grade: F**

**Mobile strengths:**
- Visually striking dark/light split panel — creates strong visual contrast

**Mobile failures:**
- Two-column layout: left panel (chart + sliders) and right panel (results). On mobile this is a guaranteed failure — each panel at ~50% of 390px = ~190px, which cannot contain both the chart visualization and the slider controls legibly
- Slider controls (TOTAL MEMBERS, AVG ANNUAL DUES, ANNUAL TURNOVER RATE) — range input `<input type="range">` on mobile needs minimum 44px tap height; at desktop they appear to be ~20px track height
- The orange data labels ("300", "$8,000", "5%") alongside the sliders appear at ~11px — too small
- "$80,000" and "$74,012" large orange figures inside the dark panel — these are great on desktop but at half-width mobile they compete with each other
- Right panel likely clips horizontally — the "13x return on investment" label at the bottom of the dark card may be invisible

**Fix:**
```css
@media (max-width: 768px) {
  .roi-calculator {
    flex-direction: column;
  }
  .roi-left, .roi-right {
    width: 100%;
  }

  input[type="range"] {
    height: 44px; /* meet tap target */
    padding: 16px 0;
  }

  .roi-figure { font-size: clamp(1.5rem, 8vw, 3rem); }
}
```

---

### home-slice-12.png — "Intelligence in action: live demo results" (Proof Metrics)
**Grade: B**

**Mobile strengths:**
- Four metric cards ("6 days", "91%", "$312", "$1.38M") use very large orange numerals — legible at any mobile scale
- Descriptive subtext per card provides context without requiring density

**Mobile failures:**
- Four cards in a horizontal grid — on mobile these will compress to ~90px each with body text at ~10px; the metric itself remains legible but the explanation copy becomes invisible
- Supporting text ("23 members flagged across health score decline...") is already small at desktop (~12px), will be illegible on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .proof-metrics-grid {
    grid-template-columns: 1fr 1fr; /* 2×2 on mobile */
    gap: 16px;
  }

  .metric-description { font-size: 13px; }
}
```

---

### home-slice-13.png — Founding Partner CTA Box
**Grade: B**

**Mobile strengths:**
- Clear bordered CTA box with "Be one of our first ten clubs" headline — easily scannable
- "Apply for Founding Partner" is a clear orange button

**Mobile failures:**
- Three-column benefit grid (Hands-on Onboarding, Shape the Roadmap, Locked-in Pricing) inside the box — on mobile these three items need to stack to single column
- Button "Apply for Founding Partner" — need to confirm it reaches 44px tap height; visually appears ~40px at desktop
- Fine print text "Limited founding partner spots — early clubs get direct roadmap input" appears at ~11px — acceptable for legal text but may be cut off at mobile widths

**Fix:**
```css
@media (max-width: 768px) {
  .founding-partner-benefits {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .founding-partner-cta-btn {
    min-height: 44px;
    width: 100%;
  }
}
```

---

### home-slice-14.png — Testimonials ("Built with the GMs who live it")
**Grade: C**

**Mobile strengths:**
- Three testimonial cards with distinct colored "66" quote marks — visually distinct
- Attribution lines use consistent label formatting

**Mobile failures:**
- Three-column testimonial cards — on mobile these compress to ~120px each; quote text ("The Saturday brief is the first club-tech vendor deliverable I've ever forwarded to my board without rewriting.") becomes unreadable at ~10px
- Attribution metadata ("G. Marchetti · GM · Founding partner · 380-member private club · Name withheld through Q2 2026 pilot") is 4 lines of ~9px micro-text — completely invisible on mobile
- No card tap interaction — if a mobile user wants to read the full quote they have no expand affordance

**Fix:**
```css
@media (max-width: 768px) {
  .testimonials-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .testimonial-attribution {
    font-size: 12px;
    line-height: 1.5;
  }
}
```

---

### home-slice-15.png — FAQ
**Grade: B**

**Mobile strengths:**
- Accordion pattern is inherently mobile-friendly — tapping + and - to expand rows
- Question text is large enough (~15px) to read on mobile
- Single column layout is already correct for mobile

**Mobile failures:**
- Expand/collapse (+/-) icons at right edge appear to be ~16px — below the 44px tap target minimum. The tappable row needs the full row height to be ≥44px, not just the icon
- First FAQ item is expanded and shows dense body text (~13px) — acceptable but tight on narrow screens
- Last FAQ item "What does a founding-partner pilot actually look like?" — this long label wraps to two lines; the entire row needs to be tappable

**Fix:**
```css
@media (max-width: 768px) {
  .faq-row {
    min-height: 44px;
    padding: 12px 16px;
    cursor: pointer;
  }

  .faq-toggle-icon {
    /* Don't size the icon — size the hit area */
    padding: 12px;
    margin: -12px;
  }
}
```

---

### home-slice-16.png — Demo Form / Footer CTA
**Grade: D**

**Mobile strengths:**
- Dark background with overlaid form panel creates clear visual focus
- "Book Your Demo" CTA button is large and orange — high visibility

**Mobile failures:**
- Two-column layout: left side headline copy ("See what your club misses today and can recover tomorrow"), right side form panel. On mobile this 50/50 split is disastrous — form fields will be ~190px wide, and label text ("NAME", "CLUB", "EMAIL", "PHONE") appears at ~10px
- Form fields (NAME + CLUB on one row, EMAIL full-width, PHONE full-width) — the NAME/CLUB paired row at mobile will be two ~90px inputs side-by-side. Neither will be easily tappable or legible
- "Or email us at demo@swoopgolf.com · (480) 225-5102" is orange link text at ~11px on dark background — poor contrast AND too small
- Footer columns squished

**Fix:**
```css
@media (max-width: 768px) {
  .demo-cta-section {
    flex-direction: column;
  }
  .demo-copy, .demo-form-panel {
    width: 100%;
  }

  .form-row-paired {
    flex-direction: column; /* NAME and CLUB become separate full-width rows */
  }

  .form-input {
    min-height: 44px;
    font-size: 16px; /* prevent iOS zoom on focus */
    padding: 0 12px;
  }

  .demo-contact-alt {
    font-size: 14px;
  }
}
```

---

### home-mobile-full.png — FULL MOBILE COMPOSITE (Critical)
**Grade: D**

This is the ground truth. Analyzing the actual rendered mobile output:

**What is visibly wrong (top to bottom):**
1. **Navigation:** Desktop nav visible with all links — no hamburger menu. At actual 390px, links would be collapsed on top of each other or the logo is obscured
2. **Hero:** Text/image columns visible side-by-side — image is ~40% width. Headline is readable but the secondary CTA ("See it in action →") is only barely visible and trust pills below are wrapping incorrectly
3. **Trust ticker (4 columns):** Visible as a horizontal 4-cell row. Each cell appears to be ~90px — text is present but very small (~8–9px)
4. **Problem cards (3-col):** All three visible side-by-side. Text inside is ~9–10px — functionally illegible
5. **Capabilities grid:** Cards visible but body text is too small to read
6. **Agent panel:** Dark UI panel is visible but the activity feed + detail panel are both compressed — text inside is ~8px
7. **Integrations hub:** Hub graphic visible but node labels are invisible at this scale
8. **ROI Calculator:** Left panel (chart + sliders) and right panel (results) are side-by-side at ~50% width — the right panel results are clipped at the right edge
9. **Pricing cards (3-col):** All three visible horizontally — $1,499/mo price wraps to two lines inside a ~110px card
10. **Proof metrics (4-col):** Numerals visible but explanatory text is invisible
11. **Testimonials (3-col):** Three cards visible — quote text at ~9px

**Overall assessment:** This site is not responsive. It is a desktop layout that renders at reduced scale on mobile. Every multi-column section fails. The absence of a hamburger nav is the most severe issue because it signals no mobile breakpoints have been seriously implemented in the nav component.

---

## PLATFORM PAGE

### platform-hero.png / platform-slice-00.png — Platform Hero
**Grade: C**

**Mobile strengths:**
- Centered single-column layout — this is the rare section that will reflow correctly
- CTA "Book the 30-minute walkthrough" is clearly visible and sized appropriately

**Mobile failures:**
- Nav same issue as home — no hamburger visible, 4 links + CTA button in header row
- Body text ("Five AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue into a single intelligence layer") is ~14px — likely ~12px on mobile
- No mobile hero image — the empty space below the CTA on this text-only hero will create a significant blank area on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .platform-hero-cta {
    min-height: 52px;
    padding: 0 24px;
    width: 100%;
    max-width: 320px;
  }

  .platform-hero-body { font-size: 15px; }
}
```

---

### platform-slice-01.png — "Flying Blind" Problem Cards
**Grade: D**

Same 3-column problem as home. Three cards ("Member risk blind spot", "Complaint follow-up gap", "Demand vs. experience disconnect") appear side by side. Body text compresses to ~10px.

**Fix:** Same as home-slice-01 — `grid-template-columns: 1fr` on mobile.

---

### platform-slice-02.png — "Fix It / Prove It" Split Section
**Grade: C**

**Mobile strengths:**
- Dark terminal/code block component is visually distinct
- Headline copy is direct and scannable

**Mobile failures:**
- Left-right split layout: code block on left, metrics panel on right. At mobile the code block content will compress or overflow
- The code-like text block with highlighted JSON/actions ("APPROVED · $6,95 · complaint-aging-46") appears at ~10px inside a dark box — illegible on mobile
- "$32K", "9/14", "$67K" orange metrics on the right panel are large enough but the label text below each is ~11px

**Fix:**
```css
@media (max-width: 768px) {
  .fix-it-split { flex-direction: column; }
  .code-block { font-size: 12px; overflow-x: auto; }
  .metric-label { font-size: 13px; }
}
```

---

### platform-slice-03.png — Five Core Capabilities
**Grade: D**

Identical to home-slice-02/03 — same 3-column then 2-column capability cards. Same failures, same fix applies.

---

### platform-slice-04.png / platform-slice-05.png — Six AI Agents Panel
**Grade: C**

**Mobile failures:**
- Same side-by-side agent panel (feed left, detail right) — collapses poorly
- Six agent card grid is 4-per-row — on mobile these need to be 2×3

Same fix as home-slice-06.

---

### platform-slice-06.png — "Your members feel it. They just can't explain it." (Journey Story)
**Grade: C**

**Mobile strengths:**
- Three narrative cards with numbered steps ("01 THE ARRIVAL", "02 THE NUDGE", "03 THE MILESTONE") are well structured
- Body text appears slightly larger than other sections — still borderline at ~13px desktop

**Mobile failures:**
- Three-column layout — on 390px these columns will be ~120px each with full story paragraphs. Each card has 3–4 lines of prose plus a "Swoop detected…" callout — completely unreadable at compressed width
- Numbered step labels ("01", "02", "03") will render correctly but the "THE ARRIVAL" etc. secondary labels underneath are ~9px

**Fix:**
```css
@media (max-width: 768px) {
  .journey-cards {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
```

---

### platform-slice-07.png / platform-slice-08.png — Integrations Section
**Grade: D**

Same as home — hub diagram, dark 8-category grid, illegible partner names. Same failures and same fix.

---

### platform-slice-09.png — Comparison Table
**Grade: F**

Identical to home — 5-column comparison table. Same catastrophic mobile failure, same fix required.

---

### platform-slice-10.png — "Why not just..." + Footer
**Grade: C**

Same three-column objection cards, same failure pattern.

---

## PRICING PAGE

### pricing-hero.png / pricing-slice-00.png — Pricing Hero
**Grade: C**

**Mobile strengths:**
- Dark background with white headline creates strong contrast — readable at any size
- Three stat blocks ("3,000+", "$2.1B", "67%") use large orange numerals — highly legible

**Mobile failures:**
- Same nav issue — no hamburger
- Three stat blocks in a horizontal row — on mobile at 390px these are ~120px each with label text ("Private clubs in the US with 200+ members") at ~10px
- Body text block above stats is ~13px — will shrink to ~11px on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .pricing-stats-row {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .pricing-stat-label { font-size: 14px; }
}
```

---

### pricing-slice-01.png — ROI Calculator
**Grade: F**

Same as home — two-column ROI calculator fails catastrophically on mobile. Left panel chart + sliders vs. right panel results side by side at ~50% each. Same fix applies.

---

### pricing-slice-02.png / pricing-slice-03.png — Pricing Cards
**Grade: D**

**Mobile strengths:**
- "MOST POPULAR" badge on middle card draws attention

**Mobile failures:**
- Three pricing cards side-by-side: "Signals ($0/mo)", "Signals + Actions ($499/mo)", "Signals + Actions + Member App ($1,499/mo)". On mobile each card is ~120px — the tier name alone wraps to 3 lines inside the card
- Feature bullet text inside each card (~12px desktop) becomes ~10px on mobile
- "Book the 30-minute walkthrough" CTA inside the middle card appears appropriately sized at desktop (~44px height) — but on mobile if the card is 120px wide, the button text will either overflow or be cut off
- The right tier's CTA "Book the 30-minute walkthrough" uses an outlined (non-filled) button — less visible than the filled orange one on the middle card, and on mobile this distinction is further lost

**Fix:**
```css
@media (max-width: 768px) {
  .pricing-cards-grid {
    grid-template-columns: 1fr;
    max-width: 360px;
    margin: 0 auto;
    gap: 20px;
  }

  .pricing-card-cta {
    width: 100%;
    min-height: 48px;
    font-size: 15px;
  }
}
```

---

### pricing-slice-04.png — Pricing FAQ + Footer
**Grade: B**

**Mobile strengths:**
- Accordion pattern works on mobile — single column by default
- Minimal footer design (logo left, links right) is clean

**Mobile failures:**
- Footer: "Investor Information" + "© 2024 Swoop Golf" are placed right-aligned on one line. At 390px with the Swoop logo left, the available right space is approximately 200px. These two items may wrap or the copyright may clip
- Footer tap targets for "Investor Information" link are ~30px height — below 44px minimum
- Three FAQ items displayed — expand icon (+) is ~16px. Same tappable row issue as home FAQ

**Fix:**
```css
@media (max-width: 768px) {
  footer .footer-right {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  footer a {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}
```

---

## ABOUT PAGE

### about-hero.png / about-slice-00.png — Team Section
**Grade: C**

**Mobile strengths:**
- Three team member cards (Tyler Hayes, Jordan Mitchell, Alex Chen) have clear structure
- Initials avatar circles (TH, JM, AC) are large enough to be visible on mobile

**Mobile failures:**
- Three team cards side-by-side — on mobile these compress to ~120px each. Role tag ("HEAD OF CLUB SUCCESS") in small orange uppercase is ~9px inside a narrow card — invisible
- Name text ("Tyler Hayes") is ~14px desktop — legible, but the bio text below is ~11px and becomes 9px on mobile
- Nav — same issue, no hamburger

**Fix:**
```css
@media (max-width: 768px) {
  .team-cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
```

---

### about-slice-01.png — Moat / Why Hard to Copy
**Grade: C**

**Mobile strengths:**
- Dark panel with metrics ("46 production tools in orchestration", "12 mo of pilot data + model training", "#1 preferred Jonas Club integration partner") uses large numerals effectively

**Mobile failures:**
- Two-column layout: left side prose ("Why this is hard to copy"), right side metric stack. On mobile this halves available text width
- Metric labels alongside numbers are ~11px — below threshold on mobile

**Fix:**
```css
@media (max-width: 768px) {
  .moat-section { flex-direction: column; }
  .moat-metrics { display: flex; flex-direction: column; gap: 16px; }
}
```

---

### about-slice-02.png / about-slice-03.png — Testimonials + Proof Metrics
**Grade: C**

Same 3-column testimonial grid, same 4-column metric grid failures. Same fixes apply.

---

### about-slice-04.png — Founding Partner CTA + FAQ
**Grade: B**

**Mobile strengths:**
- Founding partner CTA box with orange border and orange CTA button is a high-value conversion unit
- FAQ section below uses correct accordion pattern

**Mobile failures:**
- Three-benefit grid inside CTA box needs to reflow to single column on mobile
- CTA button ("Apply for Founding Partner") full width at this desktop view — may not be full-width on mobile; confirm `width: 100%` applied

---

### about-slice-05.png — FAQ (Expanded)
**Grade: B**

Same as home FAQ — tap target issue on expand icons, otherwise acceptable.

---

## CONTACT PAGE

### contact-hero.png / contact-slice-00.png — Contact Hero (Social Proof)
**Grade: C**

**Mobile strengths:**
- Social proof metrics ($1.38M, 3, 91%, 9/14) are large orange numbers — legible on mobile
- "Pilot Results" label sets clear context

**Mobile failures:**
- Four metric stat blocks in a horizontal row — on mobile at 390px each stat is ~90px wide. Label text ("in-at-risk dues identified", "silent-churn members flagged") wraps inside tiny spaces
- Headline "See what your club misses today, and what you recover tomorrow." at desktop size will still be relatively large on mobile — acceptable if font-size clamped properly

**Fix:**
```css
@media (max-width: 768px) {
  .contact-proof-stats {
    grid-template-columns: 1fr 1fr; /* 2×2 */
    gap: 16px;
  }
}
```

---

### contact-slice-01.png — Demo Booking Form
**Grade: D**

**Mobile strengths:**
- Clear dark background + form panel creates focused conversion UI

**Mobile failures:**
- TWO-COLUMN LAYOUT: Left = copy text ("See what your club misses today and can recover tomorrow" + description), Right = form panel with NAME/CLUB (paired row), EMAIL, PHONE, CTA button
- Form inputs appear to be approximately 44px height at desktop — this is the ONE thing done correctly
- NAME + CLUB are on the same row — at mobile this is ~90px per input, too narrow and will trigger iOS auto-zoom if font-size < 16px on the input
- "Or email us at demo@swoopgolf.com · (480) 225-5102" link text at ~11px in light orange on dark — both too small and insufficient contrast
- The entire form panel appears as a dark rounded card overlaid on a dark photographic background — on mobile, if the panel does not go full width, it will appear as a floating island with clipped content on the right

**Critical — iOS input zoom:** If `<input>` font-size is less than 16px, iOS Safari forces a viewport zoom. This is likely happening on these form fields.

**Fix:**
```css
@media (max-width: 768px) {
  .contact-form-section {
    flex-direction: column;
  }

  .contact-copy,
  .contact-form-panel {
    width: 100%;
  }

  .contact-form-panel {
    border-radius: 12px;
    padding: 24px 20px;
  }

  .form-row-name-club {
    flex-direction: column;
  }

  input, select, textarea {
    font-size: 16px !important; /* iOS zoom prevention */
    min-height: 48px;
  }

  .contact-alt-text {
    font-size: 14px;
  }
}
```

---

## PRIORITIZED TOP-10 MOBILE FIXES (by conversion impact)

### #1 — Add Hamburger Navigation (All Pages) — CRITICAL
**Impact: Eliminates the most visible mobile design failure site-wide.**
No hamburger menu means the nav is either unusable or invisible on mobile. Every page starts with this broken pattern. Without it, the conversion funnel cannot even begin.
```css
/* Pattern: */
@media (max-width: 768px) {
  .nav-desktop-links { display: none; }
  .nav-hamburger-btn { display: flex; width: 44px; height: 44px; }
}
```

### #2 — Stack All Multi-Column Grids to Single Column (All Pages) — CRITICAL
**Impact: Makes body copy readable; addresses the #1 illegibility issue.**
Every 3+ column card grid across all pages needs `grid-template-columns: 1fr` at ≤768px. This includes: problem cards, capability cards, testimonial cards, objection cards, team cards, founding partner benefits. One stylesheet media query block can fix 80% of the issues.

### #3 — Fix Form Inputs for iOS (Contact Page, Demo Section) — HIGH
**Impact: Prevents iOS Safari forced viewport zoom — immediately kills conversion.**
All `<input>` and `<textarea>` elements must have `font-size: 16px` minimum. NAME/CLUB paired row must become single-column. This is the highest-friction conversion blocker on the contact form.

### #4 — Reflow ROI Calculator to Stacked Layout (Home + Pricing) — HIGH
**Impact: Most interactive conversion tool on the site is completely broken on mobile.**
The dual-panel ROI calculator (chart + sliders | results panel) must stack vertically on mobile. The slider controls must meet 44px tap height. This is a key conversion tool — a broken calculator = zero conversions from mobile visitors.

### #5 — Fix Pricing Cards to Single-Column Stack (Home + Pricing) — HIGH
**Impact: Pricing is a direct conversion decision point. Unreadable cards = no decision.**
Three pricing cards at 120px each with feature lists is unusable. Stack to `grid-template-columns: 1fr` with `max-width: 360px; margin: 0 auto`. Make all CTAs `width: 100%; min-height: 48px`.

### #6 — Replace Comparison Table with Mobile-Safe Alternative (Home + Platform) — HIGH
**Impact: 5-column table on 390px is the single worst-rendered component on the site.**
Either convert to a scrollable table with sticky first column, or build a `comparison-mobile-cards` component that shows feature rows as vertically stacked comparison blocks. The current table is functionally invisible on mobile.

### #7 — Fix Trust Ticker / Social Proof Bar to Vertical Stack (Home) — MEDIUM
**Impact: The trust signal at the top of the page communicates credibility — if it's illegible, trust is not built.**
The 4-item horizontal bar ("Founding partner program", "300-member Pinetree CC", etc.) should reflow to a 2×2 or vertical list on mobile.

### #8 — Stack Agent Panel (Feed + Detail) Vertically (Home + Platform) — MEDIUM
**Impact: The AI agents demo panel is a key differentiator — if it is unreadable it fails to convert.**
Flex column on mobile, full-width feed, full-width detail below. Agent card grid from 4-col to 2-col.

### #9 — Fix Demo Form Section Layout (Home footer + Contact) — MEDIUM
**Impact: Last-mile conversion form must work flawlessly. Two-column dark form on mobile is the worst place for layout failures.**
Stack left copy above right form panel. Full-width inputs. Paired NAME/CLUB row becomes single column. Font-size 16px on all inputs. CTA button `width: 100%`.

### #10 — Increase FAQ Tap Targets and Font Sizes (All Pages) — LOW-MEDIUM
**Impact: FAQ is an objection-handler — if it's hard to interact with, objections persist.**
Each FAQ row must be `min-height: 44px`. The expand/collapse icon must have `padding: 12px` hit area. Ensure the entire row is tappable, not just the icon.

---

## OVERALL SITE GRADE: D+

The site has strong visual design, a compelling value proposition, and well-structured content hierarchy. The mobile execution, however, is critically deficient. The site appears to have been designed desktop-first without systematic responsive implementation. The absence of a hamburger menu is the single most visible signal that mobile breakpoints have not been fully implemented. The ROI calculator, comparison table, and pricing cards are all conversion-critical components that are broken on mobile. Given that golf club GMs likely browse on their phones between rounds, this is a significant missed opportunity.

The fixes are well-defined and largely mechanical — they do not require design rethinks, just consistent application of media queries and mobile-first layout patterns. Estimated dev effort: 1 sprint to fix all Top-10 items.
