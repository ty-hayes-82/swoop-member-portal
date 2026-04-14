# About Slice 00 (Team/Hero Duplicate) — Section Score

**Overall Grade: C+**

| Dimension | Grade | Key Issue |
|-----------|-------|-----------|
| Messaging/Positioning | C | Identical content to about-hero.png — this appears to be the same above-the-fold view, no new value introduced |
| Design/Visual | B- | Same initials-only avatars; dark MOAT section is partially visible but unreadable |
| CRO/Conversion | D+ | No CTA visible anywhere in this section |
| Trust/Credibility | D | Initials instead of photos; thin bios with no verifiable credentials |
| Mobile UX | C | Three-column card layout needs explicit mobile breakpoints |
| Navigation/UX | B | Nav is functional and consistent |
| B2B Buyer Journey | C- | No progression from "meet the team" to "next step" |
| Copy/Voice | C+ | Headline is strong; supporting bios are weak |
| Technical Credibility | D | No technical specifics visible |

## Messaging/Positioning
**Grade: C**
- What's working: "The humans in your clubhouse for six months" is a differentiating headline that promises human-led implementation, not just software
- What's broken: This screenshot appears to be a near-duplicate of about-hero.png, showing the same hero section with team cards. If this is intentional (two separate scroll positions), the section delivers no new message. The orange "MOAT" label peeking at the bottom is the first indication of what comes next but is not readable.
- Fix: If this section is a duplicate scroll capture, skip it. If it's a separate section, add a clear transitional signal: immediately above the dark MOAT panel, add a visual divider with the label "What makes this defensible →" to pull the eye downward.

## Design/Visual
**Grade: B-**
- What's working: Consistent brand colors (orange accents, clean white background); card grid is evenly spaced
- What's broken: The bottom dark section being partially visible creates a visual cut-off that looks like a rendering bug rather than intentional design. Initials-only avatars remain the dominant credibility problem.
- Fix: Ensure the MOAT dark section has a full-bleed top edge with at least 8px of dark background visible and a white-to-dark gradient fade (20px) that signals the user to scroll rather than looking like the page is broken.

## CRO/Conversion
**Grade: D+**
- What's working: "Book a Demo" CTA exists in the top nav
- What's broken: No conversion opportunity in or beneath the team section. After reading three bios, there's no logical next action. The CTA in the nav is too far away to feel contextually relevant.
- Fix: Add immediately below the three bio cards: a horizontal rule, then: `"Talk to the team before you commit — 30-minute pilot call, your club's data on screen."` + `[Book a Pilot Call →]` (orange button, full-width on mobile, centered on desktop).

## Trust/Credibility
**Grade: D**
- What's working: Role titles (Founder & CEO, Head of Club Success) indicate a deliberate team composition
- What's broken: All three bios use initials-only avatars, no photos, no external links (LinkedIn), and no named references to verifiable past employers or clubs
- Fix: For each team member, add: (1) headshot photo, (2) inline LinkedIn icon link, (3) one named, verifiable past company or club. For Tyler: "Desert Mountain Club (Scottsdale)". For Jordan: "Aglyyx (NASDAQ: AGYS) — enterprise hospitality analytics". For Alex: "Salesforce Industries — healthcare and financial services customer success".

## Mobile UX
**Grade: C**
- What's working: Text size appears readable; card layout has sufficient padding
- What's broken: Three-column grid will stack to one column on mobile with no visual separator between cards, making the section feel like a wall of text. The partially visible dark section below will render as a thin dark stripe on small screens, looking like a rendering error.
- Fix: On screens <768px: stack cards with `mb-6` gap, add a faint `border-b border-gray-200` between each card. Ensure the MOAT dark section has `min-h-[60px]` visible on mobile to cue scrolling.

## Navigation/UX
**Grade: B**
- What's working: Persistent top nav with active About state; clean and uncluttered
- What's broken: No in-page navigation for an About page that clearly has multiple sections below the fold (MOAT, testimonials, demo results, FAQ). A GM scrolling back to find the team section will have no reference point.
- Fix: Add sticky in-page anchor nav: `[Team] [Our Moat] [GM Testimonials] [Demo Results] [FAQ]` — horizontally scrollable on mobile, fixed at top of About page content area on desktop.

## B2B Buyer Journey
**Grade: C-**
- What's working: "Closed pilot with founding-partner clubs" language correctly positions this as exclusive and early-stage
- What's broken: A GM evaluating whether to give Swoop access to their member database needs to understand: who runs the company, what data security protocols exist, and what's their track record. None of this is answered by the current bios.
- Fix: Add a "Pilot Security Promise" micro-section beneath team bios: "Your member data never leaves your club's isolated environment. No cross-club training. No data resale. SOC 2 Type II audit in progress." One paragraph, no header needed.

## Copy/Voice
**Grade: C+**
- What's working: "We're in your systems, on your calls, and in your board deck" is strong, specific, and differentiating — it signals total commitment, not SaaS self-service
- What's broken: The three bios are written in third-person résumé voice, which creates distance. On an About page for a high-trust B2B product, first-person or at minimum warmer third-person is expected.
- Fix: Rewrite bios in warmer voice. Example for Alex Chen: "Alex spent six years at Salesforce Industries turning complex enterprise data into the one report that actually gets read. He does the same thing for GMs — your first board deck from Swoop is built by Alex personally."

## Technical Credibility
**Grade: D**
- What's working: Jordan's Aglyyx and NASDAQ reference implies enterprise-grade ML background
- What's broken: No mention of data architecture, integration method, security, or uptime. A GM being asked to connect member records to a new platform needs to know the technical bona fides.
- Fix: Add a single credential line beneath Jordan's bio: "Architect of Swoop's Jonas-native integration layer — the same infrastructure stack used across 400+ enterprise hospitality properties."

## Top 3 Priority Fixes for This Section
1. Replace initials with real headshots — this is the single highest-trust signal on an About page and it's currently missing entirely
2. Add a pilot security promise beneath the bios — GMs are giving Swoop access to member records; they need a data commitment before they scroll further
3. Add an in-section CTA — "Talk to the team before you commit" with a 30-minute call booking link; the section has no exit ramp to conversion
