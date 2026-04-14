# r19 Navigation / UX Scorecard

Scoring dimension: Navigation completeness, wayfinding, section transitions, dead ends, info hierarchy, CTA presence.

Grades: A = excellent, B = good, C = acceptable gaps, D = notable failure, F = broken / absent.

---

## HOME page

| Section | Grade | One-line verdict |
|---|---|---|
| home-hero | B+ | Strong dual-CTA ("Book walkthrough" + "See it in action"), sticky nav present, but nav uses scroll-jump labels (Platform/Agents/Pricing) that diverge from the page-route nav on all other pages — a wayfinding inconsistency for multi-page visitors. |
| home-slice-00 (TrustStrip) | B | Four proof badges land immediately below the fold and reinforce the hero claim; no CTA needed here but no anchor ID is exposed to in-page nav. |
| home-slice-01 (Problem — Flying Blind) | B | Three problem cards with quantified stakes are clear and well-labeled; no CTA here is intentional, but the section has no "forward" arrow/link to Platform for users who want depth. |
| home-slice-02 (Problem card bottoms) | C | Continuation of the problem cards — feels like a partial slice with no heading or transition copy to bridge into the next section; users landing mid-scroll lose context. |
| home-slice-03 (Platform — Five Core Capabilities) | B | Section eyebrow "PLATFORM" with a clear header and three capability cards visible; consistent label with the nav item. Secondary CTA missing in this capability block. |
| home-slice-04 (Capability cards cont. — Staffing/Revenue) | C | No section header visible, no CTA, and the bottom of the capability grid has no forward link to the dedicated Platform page — dead end for users who want specifics. |
| home-slice-05 (Comparison table) | B | "COMPARE" eyebrow, clear competitor columns, good visual hierarchy; a "Why not just…" teaser at the bottom creates forward momentum. Missing a CTA to Platform page from this section. |
| home-slice-06 (Why not just… objection cards) | B | Three objection rebuttals are well-structured; no CTA at close of the objection block means persuaded visitors have nowhere to go before the Agents section loads. |
| home-slice-07 (Agents intro — Six AI Agents) | B | "AGENTS" eyebrow matches nav label exactly; descriptive subhead sets the demo context; good transition into the live-demo panel. |
| home-slice-08 (Agents Live Demo panel) | A- | Dark UI panel with "LIVE – 6 AGENTS ONLINE," breadcrumb-style path (swoop.io / agents / stream), cycling agent cards, and a projected-impact callout — outstanding contextual wayfinding within the section. Minor gap: no CTA to a dedicated Agents page (none exists as a routed page). |
| home-slice-09 (One Operating View + Integrations) | C | Two conceptual sections crammed into one viewport without distinct section breaks or eyebrow separation; the visual divider between "one operating view" dark band and the integrations copy is unclear. No CTA. |
| home-slice-10 (Integrations hub + categories + rollout timeline) | B | Hub diagram, 28 integrations in 10 category grid, and rollout timeline all present; good info density. The section ends in the dark band with no "next step" CTA anchoring users before the pricing tease begins. |
| home-slice-11 (ROI Calculator — slider widget) | A- | Interactive sliders with live output cards ("13x return on investment") — best conversion tool on the page; immediately leads into pricing below. No CTA on the calculator itself to trigger demo booking. |
| home-slice-12 (Proof — Live Demo Results) | B+ | "PROOF" eyebrow, four stat cards from Pinetree CC pilot with clear labels; honest qualification note ("paraphrase with permission"). Forward link into Founding Partner program is implicit but not a labelled CTA button. |
| home-slice-13 (Founding Partner Program callout) | A- | Bordered callout card with "FOUNDING PARTNER PROGRAM" tag, three benefit columns, and a primary "Apply for Founding Partner" CTA — clear, specific, scarcity-driven; transitions cleanly into testimonials. |
| home-slice-14 (Testimonials — Built with GMs) | B | Three quote cards with role/club attribution; good social proof; the section has no closing CTA or forward link — drops users into FAQ with no invitation to act. |
| home-slice-15 (FAQ) | B | Five accordion questions, first one open by default; standard pattern, well-labeled "FAQ" eyebrow. No CTA below the FAQ is the key miss — this is a high-intent moment with nowhere to go except scrolling. |
| home-slice-16 (Demo CTA + Footer) | A | Full demo booking form (Name, Club, Email, Phone + "Book Your Demo"), fallback email + phone, and a minimal footer with "Investor Information" link; completes the conversion loop. Logo click navigates home. |
| home-mobile-full | C+ | Mobile layout renders correctly — hero, trust strip, and problem section stack cleanly — but the hamburger menu is not visible in the full-page screenshot, suggesting the mobile nav is collapsed with no visible toggle state at initial scroll. Section-to-section flow is intact but nav accessibility depends entirely on a non-visible hamburger. |

---

## PLATFORM page

| Section | Grade | One-line verdict |
|---|---|---|
| platform-hero | A- | Full route nav (Home / **Platform** / Pricing / About) with active "Platform" highlighted orange; single primary CTA "Book the 30-minute walkthrough"; clean hierarchy. Minor: no secondary CTA or "learn more" anchor for users not yet ready to book. |
| platform-slice-00 (Platform hero duplicate / overlap) | B | Same hero frame captured again — confirms sticky nav persists on scroll; no new section content, so no score regression but confirms no layout shift on scroll entry. |
| platform-slice-01 (Problem — Flying Blind, reused) | B | Reuses the home page problem section verbatim with the same three cards; acceptable for depth page but adds zero net new context for users who came from home — a missed opportunity for Platform-specific framing. |
| platform-slice-02 (See It / Fix It narrative pair) | A- | Two-column layout with concrete GM workflow copy and a mock terminal UI showing agent-approved comp action — best "product in action" illustration on the site; clear "Fix It" framing aligns with North Star pillars. |
| platform-slice-03 (Five Core Capabilities) | B | "PLATFORM" eyebrow, same capability grid as home but with added detail visible; no CTA in this section. |
| platform-slice-04 (Capability grid — Staffing/Revenue) | C | Grid continues below the fold with no section CTA; the bottom of the capability grid has no forward link before the Agents section begins. |
| platform-slice-05 (Agents — Live Demo panel, cycling) | B+ | "AGENTS" eyebrow, live demo panel showing Service Recovery agent; six agent cards below. No dedicated /agents page to link to — the section is a dead end for deep-divers. |
| platform-slice-06 (Member Experience narrative) | A- | "MEMBER EXPERIENCE" eyebrow, three-column story (Arrival / The Nudge / The Milestone) with GM-visible signal callouts per column; excellent product storytelling with proof of system depth. No CTA to follow up. |
| platform-slice-07 (One Operating View + Integrations) | C | Same crammed double-section as on home — dark band quote then integrations copy without a clean visual divider; transition feels abrupt. |
| platform-slice-08 (Integrations hub grid + timeline) | B | Same hub + 28-integration grid; rollout timeline is reassuring; section ends in the dark band with no forward CTA. |
| platform-slice-09 (Comparison table) | B | "COMPARE" eyebrow, same competitive table; confirms consistent messaging across pages. No CTA attached to the comparison. |
| platform-slice-10 (Why not just… + Footer) | C | Objection cards close the Platform page without a terminal CTA or demo form — the page dead-ends at footer with only a passive "Investor Information" link. Platform page needs a closing conversion action. |

---

## PRICING page

| Section | Grade | One-line verdict |
|---|---|---|
| pricing-hero | B+ | Full route nav with "Pricing" active; dark hero with market-context header ("The window is open…") and three credibility stats — good emotional setup before plans are shown. No CTA above the fold on this page, relying on scroll to reach plans. |
| pricing-slice-00 (same hero capture) | B | Confirms sticky nav; hero stats (3,000+ clubs, $2.1B at risk, 67% disconnected) are persuasive context-setters. |
| pricing-slice-01 (ROI Calculator) | A- | "ROI CALCULATOR" eyebrow, interactive sliders leading directly into pricing cards below — perfect funnel positioning; calculator output creates a personalized value case before user sees a price. No CTA on the calculator widget itself. |
| pricing-slice-02 (Pricing cards — three tiers) | A | Three tiers (Signals $0/mo, Signals + Actions $499/mo highlighted, Full Suite $1,499/mo); "MOST POPULAR" badge on middle tier; distinct CTAs per tier ("Start on Signals (free)" vs "Book the 30-minute walkthrough" vs "Book the 30-minute walkthrough"). Excellent CTA differentiation. |
| pricing-slice-03 (Pricing tier features + FAQ intro) | B | Feature checklists visible for all tiers; FAQ section teased at bottom. The tier cards lack a feature comparison accordion or "compare tiers" shortcut — users must scan all three columns. |
| pricing-slice-04 (Pricing FAQ + Footer) | B | Three pricing-specific FAQ questions (fewer than the home FAQ's five); footer present. Page ends cleanly but there is no demo form on the Pricing page itself — a high-intent page that forces users to navigate away to convert. |

---

## ABOUT page

| Section | Grade | One-line verdict |
|---|---|---|
| about-hero | B+ | Full route nav with "About" active; "WHO YOU'LL WORK WITH" eyebrow; three team member cards (Tyler Hayes, Jordan Mitchell, Alex Chen) with roles and bios; strong trust-building entry. No CTA above the fold — intentionally relationship-first. |
| about-slice-00 (same hero capture) | B | Confirms sticky nav; hero content visible — consistent. |
| about-slice-01 (Moat — Why This Is Hard to Copy) | B+ | Dark panel with moat stats (46 production tools, 12 mo training, #1 Jonas partner) paired with specific differentiation copy; credibility is high. No CTA or link to Platform for users wanting product depth. |
| about-slice-02 (Testimonials — Built with GMs) | B | Same three testimonial cards as home; appropriate repetition on About for new-entry visitors. No CTA after testimonials. |
| about-slice-03 (Proof stats + Founding Partner CTA) | A- | Four live-demo result stats (6 days, 91%, $312, $1.38M) followed immediately by the Founding Partner program callout with "Apply for Founding Partner" CTA — good sequential proof-to-action flow. |
| about-slice-04 (Founding Partner CTA + FAQ) | B | FAQ section ("Frequently asked questions") follows the Founding Partner CTA naturally; five accordion questions. Transition from partner CTA to FAQ is logical. |
| about-slice-05 (FAQ close + Footer) | C | About page ends at FAQ with no terminal demo CTA or booking form — visitors who came to evaluate the team and are convinced have no in-page action available other than clicking the nav "Book a Demo" button. |

---

## CONTACT page

| Section | Grade | One-line verdict |
|---|---|---|
| contact-hero | A- | Full route nav; "PILOT RESULTS – FOX RIDGE COUNTRY CLUB (300 MEMBERS)" eyebrow (excellent specificity); headline, four social-proof stats above a dark lower panel; strong conversion-optimized hero. Only minor gap: no anchor for users who want to scroll directly to the form. |
| contact-slice-00 (same hero capture) | A- | Confirms sticky nav; four stat cards ($1.38M, 3 flagged, 91% fill rate, 9/14 retained) create immediate proof before the form — correct CRO order. |
| contact-slice-01 (Demo Form + Footer) | A | Form with Name, Club, Email, Phone fields; "Book Your Demo" primary CTA; fallback email and phone below; minimal footer. Closes the conversion loop cleanly. "Cancel anytime" reassurance present. |

---

## Summary stats

| Page | Sections | A/A- | B/B+ | C/C+ | D | F |
|---|---|---|---|---|---|---|
| Home | 19 | 4 | 10 | 4 | 0 | 0 |
| Platform | 11 | 2 | 6 | 3 | 0 | 0 |
| Pricing | 5 | 2 | 3 | 0 | 0 | 0 |
| About | 6 | 1 | 4 | 1 | 0 | 0 |
| Contact | 3 | 2 | 0 | 0 | 0 | 0 | (both hero captures score same) |
| **Total** | **44** | **11** | **23** | **8** | **0** | **0** |

Overall site grade: **B** — strong content and CTA architecture, meaningful UX gaps at section transitions and page terminals.

---

## Top 5 Remaining Nav / UX Fixes

### 1. Terminal CTAs missing on Platform and About pages (Priority: High)
Both `/platform` and `/about` end at the FAQ or objection cards with no demo form and no bottom-of-page CTA button. A user who reads to the end has no in-page conversion path. **Fix:** Add a `DemoCtaSection` (the form block already used on home and contact) as the final section on both Platform and About, or at minimum a single full-width "Book the 30-minute walkthrough" button row above each footer.

### 2. Home nav (scroll-jump) vs. secondary-page nav (route-based) inconsistency (Priority: High)
The home page uses `LandingPage.jsx`'s private `LandingNav` with scroll-jump links (Platform → #platform, Agents → #agents, Pricing → #pricing). Every other page uses `LandingNav.jsx` with route links (Home, Platform, Pricing, About, Contact). A user clicking "Platform" on the home page scrolls down; clicking it on any other page routes to `/platform`. The "Agents" item exists only on the home nav — it disappears on all other pages. **Fix:** Unify to a single nav component across all pages. On home, keep the scroll behavior for the non-routed sections or add Agents as an anchor on the Platform page instead.

### 3. "Agents" has no routed destination page (Priority: Medium)
The Agents section is prominent enough to earn a nav link on home but there is no `/agents` route. Users expecting a dedicated Agents page after clicking the nav link get scrolled to an on-page section. If Agents is a first-class pillar, it deserves a page; if it is a subsection of Platform, the nav link should read "Platform" with an anchor (`#/platform#agents`). **Fix:** Either create `/agents` as a route or fold the Agents nav label under Platform and add a within-page jump link.

### 4. No CTA after FAQ sections on Home and About (Priority: Medium)
The FAQ accordion is the last persuasion beat before the demo form on home (which does follow) but on About the FAQ is the literal last content before the footer with no action. FAQ closers are high-intent — the user has just resolved their final objection. **Fix:** On About, add a single CTA row ("Still have questions? Book a 30-minute walkthrough →") immediately below the accordion before the footer.

### 5. Platform page double-section collision (slices 07/09) creates undefined transitions (Priority: Medium)
The "One Operating View" dark band and the "Integrations" copy block are visually merged without distinct section breaks, eyebrow separation, or a forward CTA between them. The same issue appears on home (slices 09–10) but is worse on Platform where it is the only path forward on that page. **Fix:** Add a visible section divider (whitespace + eyebrow label) between the "One Operating View" quote band and the Integrations heading, and add a CTA ("See all 28 integrations →" scrolling to the grid, or linking to a `/platform#integrations` anchor) at the base of the dark band.

---

*Reviewed: r19 build · 2026-04-14 · 44 section captures across 5 pages*
