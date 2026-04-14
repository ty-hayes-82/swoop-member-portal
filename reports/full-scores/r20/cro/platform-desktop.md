# Platform Desktop — CRO Score

**Grade: B**

## What's Working
- Hero lands with a visible primary CTA above the fold ("See the 6 jobs" or Book a Demo button in orange).
- Multiple InlineCta bands break up the long technical content — 4+ re-engagement points across the scroll.
- The "One page replaces four logins" comparison table creates a micro-conversion moment right above the final CTA, a textbook CRO stack.
- Final "Ready to see yours?" CTA block closes the page with a clear next step — no dead end.

## What's Broken
- Hero CTA copy is generic and doesn't match page intent — a Platform page visitor is further down-funnel and deserves a "See a live agent run on your data" or "Get sample brief" offer, not the same "Book a Demo" from home.
- No product screenshots/videos above the fold — the page is almost entirely text + code-looking boxes, which feels abstract for a GM who wants to see pixels.
- Zero micro-conversion options on the page — it's 100% demo-book or bounce. Missing: "Download the 6-agent architecture PDF", "Watch 2-min Daily Brief demo".
- The comparison table is a trust-builder but has no CTA in-table (e.g., "Start with Swoop -> Book Demo" in the winning column).
- Scroll depth to first CTA beyond hero is long — dense dark-mode sections delay the next orange button.

## Exact Fix
File: `src/landing/pages/PlatformPage.jsx`

Change the hero CTA passed into HeroSection from `Book a Demo` to `See a Live Agent Run on Your Tee Sheet` and add a secondary ghost button `Watch 90-sec Daily Brief`. In `src/landing/components/ComparisonSection.jsx`, add a CTA cell under the "Swoop" column:
```jsx
<a href="#book" className="mt-4 inline-block px-4 py-2 rounded bg-orange text-ink font-semibold">
  Replace your 4 logins -> Book Demo
</a>
```
This turns the comparison table from a passive read into an active conversion point.
