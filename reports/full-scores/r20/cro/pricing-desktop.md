# Pricing Desktop — CRO Score

**Grade: B+**

## What's Working
- "Start at $0/mo" headline is CRO gold — removes the #1 objection (cost) before the user has to scroll.
- 3-tier pricing layout with a highlighted middle tier ($499/mo, "Most Popular" visual weight) — classic conversion anchoring.
- ROI framing ("What is member turnover costing your club?" with $128K / $89K math) above pricing — justifies spend before showing the number.
- FAQ section ("Things GMs ask us") below pricing handles objections in the exact place they arise.
- Final CTA band reinforces the conversion at page bottom.

## What's Broken
- Pricing cards don't show explicit "Book Demo" buttons per tier — user sees prices and has no clear next step per plan. Each card should convert on its own.
- No urgency/scarcity (founding partner discount? Q2 cohort cutoff?) — missed lever on the one page where it matters most.
- "Start at $0" is ambiguous — is that free forever or a trial? Users hesitate. Needs tighter microcopy.
- No feature comparison matrix across the 3 tiers — just 3 boxes. Makes it hard to self-select.
- FAQ items appear collapsed with no visible count ("6 common questions") — users don't know there's more.

## Exact Fix
File: `src/landing/components/PricingSection.jsx`

Add per-tier CTAs inside each card:
```jsx
<a href="#book" className="mt-6 block text-center py-3 rounded-lg bg-orange text-ink font-bold">
  {tier.price === '$0/mo' ? 'Start Free -> No Card' : `Book Demo -> ${tier.name}`}
</a>
```

Add a scarcity line under the pricing grid:
```jsx
<p className="text-center text-sm text-orange mt-6">
  Founding-partner pricing locked through Q2 2026 -> 3 slots remaining.
</p>
```

Clarify the $0 tier: change `$0/mo` subtitle from generic to `Free forever, up to 200 members` so visitors don't assume it's a trial.
