# Pricing Desktop — Design Score

**Grade: A-**

## What's Working
- Cleanest page in the audit. Dark hero "The platform that pays for itself" is confident and uncluttered.
- The three stat tiles (3,000+ / $2.1B / 67%) under the hero are beautifully spaced, with orange numerals providing a clean accent rhythm.
- ROI calculator card is the visual highlight: dark card + orange chart + bold "$120,000" / "$80,000" hierarchy reads like a real product screen.
- Three-tier pricing card layout is perfectly balanced — middle "Team" tier has correct elevated/highlighted treatment.
- FAQ section uses restrained dividers, good vertical rhythm.
- Final dark CTA band mirrors the hero — strong bookending.

## What's Broken
- The three stat tiles sit on pure black with no container — they float awkwardly and could use a subtle card background or divider rules.
- Pricing card shadow/elevation difference between tiers is too subtle — middle "featured" tier barely pops from the flanking cards.
- Pricing-card body copy is left-aligned but the "CTA" button is full-width — creates an uneven internal grid within each card.
- FAQ section has no visual interest beyond text — could use icon or accordion chevron styling.

## Exact Fix
`src/landing/components/PricingSection.jsx` — elevate the featured middle tier:
```jsx
<div className={`rounded-2xl p-8 ${featured
  ? 'bg-white ring-2 ring-orange-500 shadow-2xl scale-[1.03] relative z-10'
  : 'bg-white ring-1 ring-stone-200 shadow-sm'}`}>
```
And give the hero stat row containers:
```jsx
<div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
  {stats.map(s => (
    <div key={s.label} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 text-center">
      <div className="text-4xl font-bold text-orange-400">{s.value}</div>
      <div className="text-sm text-stone-300 mt-1">{s.label}</div>
    </div>
  ))}
</div>
```
