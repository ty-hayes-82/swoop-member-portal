# About Mobile — Design Score

**Grade: B**

## What's Working
- Clean editorial feel — "ABOUT SWOOP" eyebrow in orange, serif-weight "Built for the people who run private clubs" H1, generous whitespace.
- Typography hierarchy is the clearest of any page in the audit: eyebrow → H1 → supporting paragraph all have distinct sizes and weights.
- Subdued cream/off-white background gives the page an intentional, magazine-like quality vs the product pages.
- Second section ("Who you'll work with" / "The humans in your clubhouse for six months") repeats the eyebrow-H1-body pattern consistently.
- Mobile nav (Swoop wordmark + hamburger) is minimal and on-brand.

## What's Broken
- Only a glimpse of a photo/avatar appears at the very bottom edge — can't evaluate team imagery quality but it suggests a card is just below the fold.
- No visible CTA anywhere in the captured region — page feels like pure editorial with no conversion path until you scroll past the fold.
- Body copy line-length feels slightly too wide for mobile in the first section (mobile rag is a bit ragged on short words).
- Desktop equivalent renders blank (see about-desktop.md) — this is the only page where mobile outperforms desktop.

## Exact Fix
`src/landing/pages/AboutPage.jsx` — add an inline CTA after the opening section:
```jsx
<div className="mt-8">
  <a href="/contact" className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg">
    Book a 30-minute walkthrough
  </a>
</div>
```
`src/landing/landing.css` — tighten mobile body measure:
```css
@media (max-width: 640px) {
  .landing .prose p { max-width: 34ch; margin-inline: auto; }
}
```
And fix the desktop rendering bug documented in `about-desktop.md`.
