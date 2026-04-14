# Contact Mobile — Trust Score

**Grade: B-**

## What's Working
- Mobile preserves the "not a pitch deck" anti-weasel framing and the three "what you'll leave with" bullets.
- Form collapses cleanly to a single column — trust-wise that's important because cramped forms on mobile feel hostile.
- "No credit card · 30 minutes · Your club's own data" reassurance strip survives the reflow and stays visible above the submit button.
- Explicit fallback email `demo@swoopgolf.com` remains tappable — mailto fallbacks are trust signals.

## What's Broken
- On mobile the form owns the viewport and the NDA / data-handling gap becomes the dominant trust concern. A GM being asked for their club name and email, with zero data-handling text visible, is the highest-friction trust moment on the whole site.
- Phone number `(480) 123-9703` is even more suspect on mobile because tap-to-call is the natural interaction — dialing a fake 123-prefix number would be an instant credibility hit.
- The "early-club get hands-on onboarding" typo is still present and reads worse on mobile because the surrounding text is compressed.
- No named sender / founder byline on the form — mobile buyers more than desktop want to know "is a human reading this."
- Footer on mobile shows "demo@swoopgolf.com" twice (once in the CTA panel, once in the footer) without a consistent business hours / response time commitment.

## Exact Fix
File: `src/landing/components/DemoCtaSection.jsx`. Add a mobile-visible microcopy line under the submit button:
```
Tyler Hayes (co-founder) personally replies to every form within one business day. Your data stays under NDA and is deleted if we don't move forward within 30 days.
```

File: `src/landing/components/DemoCtaSection.jsx`. If `(480) 123-9703` is not a real line, remove it entirely — a missing phone number is far less damaging than a fake one. If real, format consistently as `+1 (480) 123-9703` and add `Mon–Fri, 9am–5pm PT` next to it.

File: `src/landing/components/LandingFooter.jsx`. Add a single-line security commitment at the bottom: `Your club's data stays yours. Mutual NDA on every pilot. SOC 2 Type I in progress (Q3 2026).` This gives every page — especially the highest-trust-stakes Contact page — a consistent security footer.
