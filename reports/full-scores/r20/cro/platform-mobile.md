# Platform Mobile — CRO Score

**Grade: C**

## What's Working
- CTAs are full-width and tappable, repeated at regular intervals through the scroll.
- Dark-theme agent section breaks visual rhythm and acts as an attention reset before the comparison table.
- Sticky top nav keeps Book Demo accessible throughout the scroll.

## What's Broken
- Comparison table on mobile is functionally unreadable — 4-column grid squeezes to illegible text, killing what's a key trust-builder on desktop.
- Hero CTA visible but hero subheadline wraps awkwardly and pushes the button below fold on smaller phones (375px).
- Same "Book a Demo" CTA repeated 6+ times with identical copy — no variation, classic banner blindness.
- No click-to-call or sticky bottom CTA for mobile context.
- The "six jobs" grid becomes a 6-item vertical scroll without anchors/jumps — user has to thumb through before reaching any CTA.

## Exact Fix
File: `src/landing/components/ComparisonSection.jsx`

Replace the 4-column table on mobile with a swipeable carousel or collapse to a "Swoop vs Legacy" two-column diff with vertical feature rows:
```jsx
<div className="md:hidden space-y-2">
  {rows.map(r => (
    <details key={r.feature} className="border rounded p-3">
      <summary className="font-semibold">{r.feature}</summary>
      <div className="mt-2 text-sm"><strong>Swoop:</strong> {r.swoop}</div>
      <div className="mt-1 text-sm text-muted"><strong>Others:</strong> {r.legacy}</div>
    </details>
  ))}
</div>
```

Also add the same mobile sticky bottom CTA bar from home-mobile.md to `src/landing/pages/PlatformPage.jsx`.
