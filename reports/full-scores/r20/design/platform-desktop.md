# Platform Desktop — Design Score

**Grade: B+**

## What's Working
- Best-designed page in the set: clear alternating light/dark rhythm between sections gives real pacing.
- Dark "daily brief" card and dark "six AI agents working your club — live" panel feel like legitimate product artifacts, not placeholders.
- Typography hierarchy is cleaner here — "Every signal. One operating view." reads as a proper H1 with supporting deck.
- Comparison table at the bottom has disciplined column alignment, bordered header row, and clean checkmark/X symbols.
- Orange CTA used sparingly (hero, mid-page, footer) — restraint pays off.

## What's Broken
- The "Six AI agents working your club — live" panel has placeholder content density — the live feed reads as a code-editor mock rather than a polished product UI.
- Below that there's another circular loader/spinner on the dark band mid-page — same unfinished-asset problem as home.
- Card-grid for the "Six jobs Swoop does" is clean but the icons are monochrome orange outlines that feel generic/lucide-default.
- The light beige background behind comparison sections is so close to white that the section boundary almost disappears.

## Exact Fix
`src/landing/components/AgentsLiveDemo.jsx` — replace the loading spinner fallback with a static pre-rendered SVG of the agent run state so the screenshot never shows a loader:
```jsx
{!isLoaded && <img src="/assets/agents-static.svg" alt="Agents running" className="w-full" />}
```
`src/landing/landing.css` — differentiate the beige section from white:
```css
.section-beige { background: #f5f1ea; }
.section-beige + .section-white { border-top: 1px solid #e8e2d6; }
```
Replace Lucide outline icons in `CoreCapabilitiesSection.jsx` with filled duotone variants:
```jsx
<Icon className="w-8 h-8 text-orange-500 fill-orange-100" strokeWidth={1.5} />
```
