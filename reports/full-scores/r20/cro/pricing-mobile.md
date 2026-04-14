# Pricing Mobile — CRO Score

**Grade: B**

## What's Working
- Pricing stacks vertically with the middle tier visually dominant — anchoring still works on mobile.
- $0 headline CTA visible within first viewport.
- ROI math ($128K / $89K) renders cleanly as stacked cards, keeping the justification above the prices.
- FAQ accordions below pricing convert objection-reads into tap interactions.

## What's Broken
- Same missing per-tier CTAs as desktop — user has to scroll past 3 price cards to find any button.
- No sticky bottom "Book Demo" on mobile — forces scroll-back-up for conversion.
- 3 tiers stacked means the $1,499/mo tier is last and looks "final" — reverses the intended anchor (middle should feel terminal).
- Price numbers are large but plan names are not — harder to distinguish tiers at-a-glance.
- No click-to-call for the "Enterprise" tier — high-ticket buyers expect a phone option.

## Exact Fix
File: `src/landing/components/PricingSection.jsx`

Reorder mobile display so the "Most Popular" tier is first on mobile viewport:
```jsx
<div className="md:hidden order-first">
  {/* popular tier first */}
</div>
```

Add a tel: link on the Enterprise tier:
```jsx
{tier.name === 'Enterprise' && (
  <a href="tel:+14805551234" className="mt-2 block text-center text-sm text-orange underline">
    Or call (480) 555-1234
  </a>
)}
```

Add sticky bottom CTA to `src/landing/pages/PricingPage.jsx` (same component used on home-mobile fix).
