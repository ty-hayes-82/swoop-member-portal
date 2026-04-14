# Pricing Mobile — Design Score

**Grade: B+**

## What's Working
- Pricing tiers stack gracefully as three full-width cards with preserved internal hierarchy.
- ROI calculator card survives the reflow — dark card + orange chart + big dollar figures still read as the focal point.
- Hero H1 "The platform that pays for itself" holds its weight at mobile size.
- Stat tiles (3,000+ / $2.1B / 67%) reflow cleanly into a 3-column mini-row without cramping.

## What's Broken
- The ROI calculator card retains desktop internal padding, making the chart feel squeezed against card edges.
- Featured middle pricing tier loses its "highlight" treatment when stacked — all three tiers look equivalent in importance.
- FAQ items are dense walls of text with no visible tap affordance (no chevron or + icon).
- Final CTA band text is slightly too wide for mobile — "Ready to see what it'd your numbers are like?" wraps awkwardly.

## Exact Fix
`src/landing/components/PricingSection.jsx` — add a mobile "Most popular" ribbon since scale-up doesn't translate:
```jsx
{featured && (
  <div className="md:hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
    Most popular
  </div>
)}
```
`src/landing/components/RoiCalculatorSection.jsx` — tighten mobile padding:
```jsx
<div className="rounded-xl bg-stone-900 p-4 md:p-8">
```
`src/landing/components/FaqSection.jsx` — add visible chevron:
```jsx
<summary className="flex justify-between items-center cursor-pointer py-4">
  <span>{q}</span>
  <ChevronDown className="w-5 h-5 text-stone-400 group-open:rotate-180 transition" />
</summary>
```
