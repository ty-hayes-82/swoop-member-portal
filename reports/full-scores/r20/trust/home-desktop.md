# Home Desktop — Trust Score

**Grade: C+**

## What's Working
- Hero carries a sourced figure line: "$74K figure: Pinetree CC pilot · 300-member club · trailing 90 days." This is a rare, specific, named-club citation that materially lifts credibility.
- Trust bullets under the CTA ("Live in under 2 weeks · No rip-and-replace · 28 integrations") are concrete enough to be falsifiable.
- The "Board-ready attribution. Not a feeling." column reinforces a measurable posture rather than a vibe claim.

## What's Broken
- "The average club protects $74K in annual dues" is positioned as an average while the footnote reveals it's a single pilot club (n=1). That is a weasel framing — an n=1 cannot be an "average."
- No press logos, no partner logos (Jonas, Club Benchmarking, NGCOA), no security badges (SOC 2, encryption) anywhere above the fold.
- Testimonials section says "From the clubs in our founding pilot" but every attribution is anonymized ("General Manager · 280-member private club · Southeast"). Unnamed quotes read as fabricated to a GM audience that knows everyone.
- "28 integrations" is a bare number with no link to the integration list or partner attribution.
- No founder photos or LinkedIn links visible; "Built for the people who run private clubs" is unsupported by founder credibility signals on this page.

## Exact Fix
File: `src/landing/components/HeroSection.jsx` line 86-87. Replace:
```
Every night, Swoop reads your tee sheet, CRM, and POS — and tells your team which members are pulling away. The average club protects $74K in annual dues. Live in two weeks. No IT project.
```
with:
```
Every night, Swoop reads your tee sheet, CRM, and POS — and tells your team which members are pulling away. Pinetree CC recovered $74K in dues in their first 90 days on Swoop. Live in two weeks. No IT project.
```
Then on line 96 change the citation to:
```
$74K: Pinetree CC, 300-member club, Apr–Jun 2026 pilot. Ask us for a reference call.
```
Also add a logo strip component `src/landing/components/TrustStrip.jsx` immediately below the hero with: Jonas Club Software (Preferred Integration Partner), Club Benchmarking (Data Partner), NGCOA (Member), SOC 2 Type I (In Progress — Q3 2026). Label each logo with its exact relationship so nothing looks implied.
