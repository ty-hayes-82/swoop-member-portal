# Home Mobile — Trust Score

**Grade: C**

## What's Working
- Same Pinetree CC source footnote survives the mobile reflow, so the one real citation is preserved.
- "Founding Partners · Nine Seats Left" scarcity copy in the pricing banner is specific (a number, not "limited").

## What's Broken
- On mobile the source footnote ("$74K figure: Pinetree CC pilot…") renders at 13px/40% white — effectively invisible. The headline number floats without visible sourcing on the device where most GMs will first read it.
- Testimonials stack vertically and the anonymous attributions ("General Manager · 280-member private club · Southeast") become the dominant visual element. Three in a row with no names reads as synthetic.
- The pricing banner says "Only 3 of 10 spots remaining" while the eyebrow says "Nine Seats Left" — self-contradicting scarcity copy is a major trust red flag.
- No SOC 2 / security / data-handling signal anywhere on the mobile scroll, and mobile is where the "is this safe?" reflex fires hardest.
- CTA strip at bottom says "Talk to a GM who's using it →" but there is no way to verify a GM is actually using it, given every testimonial is anonymous.

## Exact Fix
File: `src/landing/components/PricingSection.jsx` lines 126-131. Fix the self-contradicting scarcity. Replace:
```
Founding Partners · Nine Seats Left
...
A small founding cohort gets hands-on onboarding, direct roadmap influence, and
pricing locked for life. Only 3 of 10 spots remaining.
```
with:
```
Founding Partners · 3 of 10 seats remaining (as of {BUILD_DATE})
...
Seven founding clubs onboarded between Jan–Apr 2026. The final three seats include hands-on onboarding, direct roadmap influence, and pricing locked for life.
```
Wire `{BUILD_DATE}` to `import.meta.env.VITE_BUILD_DATE` so the number cannot silently drift out of date. Also in `src/landing/components/HeroSection.jsx` line 91, raise the footnote color from `rgba(255,255,255,0.40)` to `rgba(255,255,255,0.65)` and bump fontSize from 13 to 14 so the citation is actually legible on mobile.
