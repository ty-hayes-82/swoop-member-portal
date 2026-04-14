# About Desktop — CRO Score

**Grade: F**

## What's Working
- Nothing. The screenshot renders as a blank white/off-white canvas with no content, no nav, no CTA, no footer visible.

## What's Broken
- CRITICAL RENDER FAILURE: the About page on desktop is effectively blank. Zero CTAs, zero content, zero conversion surface. This is a total dead end and will lose every GM who clicks "About" from the nav.
- No nav, no hero, no "Meet the team", no trust-building story — the page that's supposed to humanize the company delivers nothing.
- Bounce rate on this page is likely 100% until fixed. Every nav link to "About" is a conversion leak.
- Likely causes: hydration error, missing section components, a guard returning null, or the page exporting an empty fragment.

## Exact Fix
File: `src/landing/pages/AboutPage.jsx`

First debug: open the page in dev and check the console. Most likely culprit is a broken import or a `data.js` lookup returning undefined. Verify the page actually mounts `TeamSection`, `HeroSection` with About copy, and a `DemoCtaSection` at the bottom. Minimum viable fix:

```jsx
import HeroSection from '../components/HeroSection';
import TeamSection from '../components/TeamSection';
import DemoCtaSection from '../components/DemoCtaSection';
import LandingNav from '../components/LandingNav';
import LandingFooter from '../components/LandingFooter';

export default function AboutPage() {
  return (
    <>
      <LandingNav />
      <HeroSection
        eyebrow="About Swoop"
        title="Built for the people who run private clubs"
        subtitle="Most club software tells you what happened. Swoop tells you what to do about it."
        primaryCta={{ label: 'Book 30-min Demo', href: '#book' }}
      />
      <TeamSection />
      <DemoCtaSection />
      <LandingFooter />
    </>
  );
}
```

This is a P0 blocker — nothing else on this page matters until it renders.
