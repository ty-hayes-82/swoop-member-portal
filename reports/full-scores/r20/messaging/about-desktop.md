# About Desktop — Messaging Score

**Grade: C-**

## What's Working
- The screenshot appears to render mostly blank — which, if this is what a buyer sees, is effectively a 0. Assuming the page has content below the viewport, the concept of an About page for a B2B buyer is at least the right intent.
- Domain (swoopgolf) and brand are presumably present in the nav.

## What's Broken
- PAGE APPEARS BLANK in the captured viewport. Whatever is at the top of the About page is not rendering above the fold on desktop — that's either a hero-image load failure, a section with white text on white background, or a missing component. A blank About page reads as "this company is not real" to a GM doing vendor due diligence. This is a credibility emergency, not a copy polish.
- No visible founder story, team photos, pilot-partner logos, or origin narrative — all of which are the four things a GM About page MUST deliver to pass a "is this a fly-by-night startup" gut check.
- No visible positioning statement ("Swoop exists because...") — About pages are the last chance to own a category POV.
- No visible proof of domain expertise (ex-club GMs on team? ex-Jonas engineers? ex-USGA?) — critical for a private-club buyer.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx` and `src/landing/components/TeamSection.jsx`

- FIRST: diagnose why the desktop screenshot is blank. Check for `min-h-screen` white hero with no text fallback, check image paths in `AboutPage.jsx`, check if `TeamSection.jsx` is gated behind a conditional that fails in static export.
- Add an above-the-fold hero: "Built by operators who've run private clubs — and the engineers who've rebuilt Jonas integrations. We started Swoop because every GM we talked to was copy-pasting between four systems at 5 AM."
- Add a three-card team section: name, role, one-line "previously" credential (e.g., "Previously: GM, [Club Name]" / "Previously: Integrations lead, [Platform]").
- Add a founding-pilot logo strip with 3-5 real pilot club names (redacted to "Top-100 Platinum club, Midwest" if NDA'd — but SOMETHING).
- Add a one-paragraph "Why Swoop exists" manifesto that names the pain: "Club GMs spend 6 hours a week exporting CSVs from systems that refuse to talk to each other. We fix that."
