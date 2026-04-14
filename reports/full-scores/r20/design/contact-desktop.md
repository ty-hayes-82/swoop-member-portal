# Contact Desktop — Design Score

**Grade: B+**

## What's Working
- Split hero treatment is the strongest moment: dark left panel with "See what your club misses today and can recover tomorrow." + orange eyebrow "BOOK A DEMO" paired with a translucent form card on the right.
- Form card uses dark glassmorphism over a subtle course-background image — feels intentional and premium vs the flat sections elsewhere.
- Orange "Book Your Demo" submit button is appropriately dominant, full-width inside the form card.
- Form fields are properly labeled (NAME / CLUB / EMAIL / PHONE) with clean uppercase micro-labels.
- Top action list ("A ranked list of top 5...", "Benchmarks...", "A draft 90-day action plan...") with orange checks gives a value-prop scannable column.
- Footer mirrors the rest of the site — consistent brand closure.

## What's Broken
- The hero copy block above the form ("In 30 minutes, we load your tee-sheet data...") sits on pure white with no visual anchor — feels disconnected from the dramatic dark form section below.
- Form card's course-background image is so dim it reads as noise rather than imagery; could be a subtle green gradient instead.
- Input fields are white against dark card with no border radius consistency vs the rounded orange button.
- "No credit card · 30 minutes · Your club's own data" microcopy under the button is washed out (low contrast gray on dark).
- No visible phone/email contact alternative for users who don't want to fill a form (only "Or email us at demo@...").

## Exact Fix
`src/landing/pages/ContactPage.jsx` — wrap the top copy block with a subtle background and move the value-prop list next to it:
```jsx
<section className="bg-stone-50 py-16">
  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 px-6">
    <div>{/* copy */}</div>
    <ul className="space-y-3">{checklistItems}</ul>
  </div>
</section>
```
`src/landing/landing.css` — lift microcopy contrast and unify input radius:
```css
.contact-form input { border-radius: .5rem; background: #fff; }
.contact-form .microcopy { color: #d4d4d8; }
.contact-hero-bg { background: linear-gradient(135deg,#0b1f14 0%,#1a3a28 100%); }
```
