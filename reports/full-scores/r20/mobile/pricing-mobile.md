# Pricing Mobile — Mobile Score

**Grade: B**

## What's Working
- Pricing tiers cleanly stack 1-column with clear separation.
- Orange "Book a Demo" CTAs on each tier are full-width and appear tappable (~48px).
- The 3-metric hero strip (3,000+ / $2.1B / 67%) reflows to a horizontal row that fits 390px.
- ROI calculator chart appears to render without horizontal overflow.
- FAQ section is mobile-native (single column accordion).
- Hero headline "The platform that pays for itself" is readable and well-sized.

## What's Broken
- The middle ($499/mo) featured tier uses orange border highlighting that's correct, but the card appears slightly narrower than siblings — visually inconsistent stacking.
- Tier bullet copy ("Up to X members", "priority support", etc.) appears at ~13–14px — borderline below the 14px mobile body floor.
- ROI chart y-axis labels and legend text are very small (~10px) — hard to read.
- Stat row compresses "$2.1B" label text to near-unreadable.
- No sticky CTA bar; user must scroll back up after reading FAQ.
- Nav hamburger target looks small (<44px).

## Exact Fix
File: `src/landing/components/PricingSection.jsx`, `src/landing/components/RoiCalculatorSection.jsx`, `src/landing/landing.css`

```css
@media (max-width: 480px) {
  .pricing-tier { width: 100%; max-width: none; margin: 0; }
  .pricing-tier.featured { transform: none; }
  .pricing-tier li, .pricing-tier p { font-size: 16px; line-height: 1.55; }
  .pricing-tier .cta-btn { min-height: 48px; font-size: 16px; }
  .hero-stat-label { font-size: 13px; }
  .hero-stat-number { font-size: clamp(36px, 10vw, 56px); }
  .roi-chart svg text { font-size: 12px; }
  .roi-chart { min-height: 260px; padding: 12px; }
}
.landing-nav .menu-toggle { width: 48px; height: 48px; }
```

Render `<MobileStickyCta />` at `<768px` with "Book a Demo" anchored bottom.
