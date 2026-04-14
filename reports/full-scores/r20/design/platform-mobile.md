# Platform Mobile — Design Score

**Grade: C+**

## What's Working
- The dark agent-panel sections retain their intended product feel at mobile width.
- Section alternation (light/dark) still creates usable scroll landmarks.
- Orange CTA visibility preserved at mobile breakpoints.

## What's Broken
- The comparison table at the bottom is completely unusable at 375px — columns compress into unreadable micro-text with overflow risk.
- The "agents live" panel that looks great on desktop becomes a cramped wall of tiny monospaced text on mobile.
- Card titles on the "Six jobs" grid wrap awkwardly into 3–4 lines each because desktop copy wasn't trimmed for mobile.
- Page length is punishing; no anchor nav or ToC to jump between sections.
- Dark sections and light sections both have the same ~80px top padding — mobile rhythm feels flat.

## Exact Fix
`src/landing/components/ComparisonSection.jsx` — swap to a stacked card layout below `md`:
```jsx
<div className="hidden md:block">{/* existing table */}</div>
<div className="md:hidden space-y-3">
  {rows.map(r => (
    <div key={r.label} className="border rounded-lg p-4">
      <div className="font-semibold">{r.label}</div>
      <div className="mt-2 text-sm"><span className="text-orange-600">Swoop:</span> {r.swoop}</div>
      <div className="text-sm text-stone-500">Others: {r.others}</div>
    </div>
  ))}
</div>
```
`src/landing/components/AgentsLiveDemo.jsx` — show a condensed 3-line summary on mobile:
```jsx
<div className="md:hidden text-xs font-mono leading-snug">{summary}</div>
<div className="hidden md:block">{/* full feed */}</div>
```
`landing.css`: `@media (max-width: 640px) { .landing section { padding-block: 2.5rem; } }`
