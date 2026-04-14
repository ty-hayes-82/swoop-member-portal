# About Desktop — Trust Score

**Grade: D**

## What's Working
- Page exists and is wired into routing — the About page is itself a trust signal many SaaS sites skip.
- Bottom CTA offers "request a reference call from a current pilot GM" — willingness to hand over a reference is a strong trust move.
- TeamSection (from source) names three real people (Tyler Hayes, Jordan Mitchell, Alex Chen) with specific bios.

## What's Broken
- The desktop capture rendered essentially blank (white). Regardless of cause, a blank About page on a 2880px capture is the worst possible trust outcome — a buyer who lands here sees nothing.
- Founder "avatars" in `TeamSection.jsx` are CSS circles with a single-letter monogram. No real photos, no LinkedIn links, no credentials, no prior employers named beyond "hospitality tech" and "a 300-member desert club" (unnamed).
- Moat stats "46 production tools", "12 mo of pilot data", "#1 preferred Jonas Club integration partner" have no source link or evidence — "#1 preferred" is the kind of superlative that demands a screenshot or partner letter.
- Testimonials section on About reuses the same anonymized quotes as Home. Same weakness compounded.
- No investor list, no advisor list, no board, no press mentions, no company incorporation date — About pages exist to answer "who are these people" and this one barely tries.

## Exact Fix
First diagnose and fix the blank-render bug — the capture script should fail loud if `AboutPage` renders no content. Then file: `src/landing/components/TeamSection.jsx`:

1. Replace the monogram `<div>` (lines 40-56) with real `<img>` tags pointing to `src/landing/assets/team/tyler.jpg`, `jordan.jpg`, `chen.jpg`. Ship the photos.
2. Add `linkedinUrl` and `priorRole` to each team entry. Example for Tyler:
```
{
  name: 'Tyler Hayes',
  title: 'Co-founder & CEO',
  linkedinUrl: 'https://linkedin.com/in/tylerhayes',
  priorRole: 'Former Member Ops Director, Desert Mountain Club (2019–2023)',
  bio: 'I ran member ops at Desert Mountain before writing a line of code. I built Swoop because the GM tools I needed didn\'t exist.',
}
```
Render `priorRole` as a named-employer line under the title, and make the name a link to LinkedIn.

3. Replace the moat claim `#1 preferred Jonas Club integration partner` with a direct quote and source: `"Preferred integration partner" — Jonas Club Software partner directory, Feb 2026 (screenshot available on request).`
