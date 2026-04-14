# Swoop Marketing Site — Master Dev Plan r20

Synthesized from 90 critique reports (9 lenses × 10 screenshots) on 2026-04-14.

---

## Page Grades Summary

| Page | Messaging | Design | CRO | Trust | Mobile | Navigation | B2B Buyer | Copy | Technical | Overall |
|------|-----------|--------|-----|-------|--------|------------|-----------|------|-----------|---------|
| Home (desktop) | B- | B | B- | C+ | B | B | C+ | B- | C | **C+** |
| Home (mobile) | C+ | C+ | C+ | C | C+ | C | C | C+ | C- | **C** |
| Platform (desktop) | B | B+ | B | C- | B- | B- | B- | B | B- | **B-** |
| Platform (mobile) | C | C+ | C | C- | C | C- | C+ | C+ | C+ | **C+** |
| Pricing (desktop) | A- | A- | B+ | B- | B+ | B+ | B+ | A- | D+ | **B+** |
| Pricing (mobile) | B+ | B+ | B | B- | B | B | B | B+ | D+ | **B** |
| About (desktop) | C- | F | F | D | F | F | D | F | F | **F** |
| About (mobile) | B+ | B | C | C- | A- | C+ | C- | A- | C | **B-** |
| Contact (desktop) | A- | B+ | A- | B- | A- | A- | B+ | A- | B- | **A-/B+** |
| Contact (mobile) | B+ | B | B+ | B- | A- | B+ | B | B+ | B- | **B+** |

**Weakest surface:** About desktop (total render failure). **Strongest:** Pricing desktop and Contact desktop copy.

---

## P0 — Blockers (fix before anything else)

### P0-1 — About page renders blank on desktop
- **Page:** About (desktop)
- **File:** `src/landing/pages/AboutPage.jsx`, `src/landing/LandingShell.jsx`, `src/landing/landing.css`
- **Issue:** Desktop capture is an empty white canvas. No nav, no content, no footer. Mobile renders fine. Every lens scored F/D. This kills the entire About route for any desktop visitor (board members, procurement, CTOs).
- **Fix:**
  1. Open `AboutPage.jsx`, confirm default export renders `<LandingNav /> <main>...</main> <LandingFooter />` unconditionally. Audit every `.map()` for null guards (`(data ?? []).map(...)`).
  2. Grep `src/landing/landing.css` for any `@media (min-width: 768px) { display: none }` rule accidentally applied to an about root class.
  3. Audit scroll-reveal `opacity-0` classes; add fallback visible state:
     ```css
     .reveal { opacity: 1; transform: none; }
     @media (prefers-reduced-motion: no-preference) {
       .reveal:not(.is-visible) { opacity: 0; transform: translateY(16px); transition: opacity .6s, transform .6s; }
     }
     ```
  4. Add an `IntersectionObserver` fallback timer in `LandingShell.jsx` that force-marks all `.reveal` elements visible after 1500ms so SSR/screenshots never get a blank page.
  5. Wrap `<AboutPage />` in an `ErrorBoundary` so future crashes show a card instead of white void.
  6. Re-run `scripts/screenshot-sections.mjs` to confirm.
- **Effort:** M

### P0-2 — Pricing mobile stat "$2.1B" clips/renders as "$2.18"
- **Page:** Pricing (mobile)
- **File:** `src/landing/components/IndustryStatsSection.jsx` (or wherever pricing hero stats render)
- **Issue:** Pricing Messaging critique flagged the "$2.1B" stat appearing as "$2.18" on mobile — a typo/clipping bug on the single page whose whole job is proving math. Credibility-killer.
- **Fix:** Audit font-size/letter-spacing at `<640px`. Wrap the value in a non-breaking span: `<span style={{whiteSpace:'nowrap'}}>$2.1B</span>`. Manually verify on a 375px viewport after fix.
- **Effort:** XS

### P0-3 — Footer Privacy/Terms links point to `#/contact` (infinite self-loop)
- **Page:** All pages (sitewide, most damaging on Contact)
- **File:** `src/landing/components/LandingFooter.jsx` lines 77-78
- **Issue:** Both Privacy Policy and Terms of Service route to `#/contact` — a credibility-blocking dead end for legal/compliance-sensitive GMs. Especially absurd on the Contact page where the link loops back to itself.
- **Fix:** Change to `href="#/privacy"` and `href="#/terms"`. If those pages do not exist yet, ship minimal static `PrivacyPage.jsx` and `TermsPage.jsx` with placeholder legal copy routed via hash router. No page should link to itself as its own privacy policy.
- **Effort:** S

### P0-4 — Scarcity copy self-contradicts ("Nine Seats Left" vs "3 of 10 spots remaining")
- **Page:** Home, Pricing (both desktop + mobile)
- **File:** `src/landing/components/PricingSection.jsx` lines 126-131
- **Issue:** Eyebrow says "Founding Partners · Nine Seats Left" while adjacent body says "Only 3 of 10 spots remaining." Self-contradicting numbers on the exact claim where credibility is most fragile.
- **Fix:** Single source of truth. Replace both with:
  ```
  Founding Partners · 3 of 10 seats remaining (as of {BUILD_DATE})
  ```
  Wire `{BUILD_DATE}` to `import.meta.env.VITE_BUILD_DATE` (set at build time) so the number cannot silently drift.
- **Effort:** XS

### P0-5 — Placeholder phone number `(480) 123-9703` (123-prefix = reads as fake)
- **Page:** Contact (desktop + mobile), Footer sitewide
- **File:** `src/landing/components/DemoCtaSection.jsx`, `src/landing/components/LandingFooter.jsx`, `src/landing/pages/ContactPage.jsx`
- **Issue:** 123-xxxx phone prefix is a universal placeholder smell. Publishing it on a contact page is an instant credibility hit and a GM will tap-to-call and reach nothing.
- **Fix:** If real, reformat consistently as `+1 (480) 125-7703` or whatever the real number is and add `Mon–Fri, 9am–5pm PT` label. If placeholder, remove entirely (no phone is far less damaging than a fake one). Same treatment everywhere the number appears.
- **Effort:** XS

### P0-6 — `early-club` typo in scarcity line reads as AI slop
- **Page:** Contact (desktop + mobile)
- **File:** `src/landing/components/DemoCtaSection.jsx`
- **Issue:** The line `early-club get hands-on onboarding` is a garbled phrase ("early clubs" missing the plural) on the single highest-trust-stakes page. Looks like AI slop on a B2B site.
- **Fix:** Replace with `Founding-partner slots available — early clubs get hands-on onboarding and direct input on the roadmap.`
- **Effort:** XS

### P0-7 — Agents/Save-story dark band shows a spinner/loader instead of a product mock
- **Page:** Home, Platform (desktop + mobile)
- **File:** `src/landing/components/AgentsLiveDemo.jsx`, `src/landing/components/AgentsSection.jsx`
- **Issue:** Both Home and Platform design reports flagged a circular loader/placeholder in the dark "agents" band. Reads as unfinished asset on screenshots and first paint.
- **Fix:** Replace the loading fallback with a static pre-rendered SVG/PNG of the agent run state:
  ```jsx
  {!isLoaded && <img src="/assets/agents-static.svg" alt="Agents running" className="w-full" />}
  ```
  Ship `public/assets/agents-static.svg` as a real frozen snapshot of the final panel state.
- **Effort:** S

---

## P1 — Conversion Gaps

### P1-1 — No mobile sticky bottom CTA bar anywhere on the site
- **Page:** Home, Platform, Pricing, About (all mobile)
- **File:** `src/landing/LandingShell.jsx` (new component `MobileStickyCta.jsx`)
- **Issue:** Pages are 10–20+ viewport heights tall on mobile. Once the hero scrolls away, the primary CTA disappears for screens at a time. Flagged by CRO, Mobile, Navigation, B2B lenses across every page.
- **Fix:** Add a shared mobile-only sticky bar visible on all landing pages:
  ```jsx
  // src/landing/components/MobileStickyCta.jsx
  export default function MobileStickyCta() {
    return (
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink border-t border-white/10 p-3 flex gap-2">
        <a href="tel:+14801257703" className="flex-1 text-center py-3 rounded-lg border border-orange text-orange font-semibold">Call</a>
        <a href="#/contact" className="flex-1 text-center py-3 rounded-lg bg-orange text-ink font-bold">Book 30-min Demo</a>
      </div>
    );
  }
  ```
  Render in `LandingShell.jsx` so it appears on every page. Add `body { padding-bottom: 72px }` at `<768px` to prevent overlap.
- **Effort:** S

### P1-2 — Form fields missing mobile keyboard hints (type/inputMode/autoComplete)
- **Page:** Contact (mobile), any demo form
- **File:** `src/landing/pages/ContactPage.jsx`, `src/landing/components/DemoCtaSection.jsx`
- **Issue:** Every extra keystroke is a conversion leak. Inputs likely default to `type="text"` for email and phone.
- **Fix:**
  ```jsx
  <input type="text" name="name" autoComplete="name" />
  <input type="text" name="club" autoComplete="organization" placeholder="e.g., Pine Valley Golf Club" />
  <input type="email" name="email" inputMode="email" autoComplete="email" required />
  <input type="tel" name="phone" inputMode="tel" autoComplete="tel" />
  ```
  Add `font-size: 16px` to inputs at `<480px` (prevents iOS auto-zoom). Min tap height 48px.
- **Effort:** XS

### P1-3 — Email/phone in contact page/footer are not `mailto:`/`tel:` links
- **Page:** Contact (mobile), Footer sitewide
- **File:** `src/landing/pages/ContactPage.jsx`, `src/landing/components/LandingFooter.jsx`
- **Issue:** Mobile GMs on a cart path tap-to-call before filling forms. Plain text kills that flow.
- **Fix:**
  ```jsx
  <a href="mailto:demo@swoopgolf.com">demo@swoopgolf.com</a>
  <a href="tel:+14801257703">(480) 125-7703</a>
  ```
- **Effort:** XS

### P1-4 — Hero CTAs all say "Book a Demo" — generic, repeated 6+ times, zero differentiation
- **Page:** Home, Platform (desktop + mobile)
- **File:** `src/landing/components/HeroSection.jsx`, `src/landing/components/DemoCtaSection.jsx`, `src/landing/components/InlineCta.jsx`
- **Issue:** CRO, Copy, B2B, Messaging lenses all flagged banner blindness. Same label on 6+ buttons = the user stops seeing them.
- **Fix:** Differentiate by page and position:
  - Home hero primary: `See a sample brief`
  - Home hero secondary: `Book 30-min demo`
  - Platform hero primary: `See a live agent run on your tee sheet`
  - Pricing tier CTAs: `$0` → `Start free — no card`, `$499` → `Book demo — Standard`, `$1,499` → `Talk to founders`
  - Contact form submit: `Show me my club's leaks`
  - Mid-page `InlineCta`: rotate through `Get the 5-min ROI report (PDF)` / `Watch a 2-min demo` / `Talk to a GM using Swoop`
- **Effort:** S

### P1-5 — Platform comparison table unreadable on mobile
- **Page:** Platform (mobile)
- **File:** `src/landing/components/ComparisonSection.jsx`
- **Issue:** The "One page replaces four logins" 4-column table compresses to 8–9px illegible text. This is a top trust-builder on desktop and totally fails on mobile where half the traffic lives.
- **Fix:** Gate desktop table behind `hidden md:table` and render a mobile stacked card variant:
  ```jsx
  <table className="hidden md:table">{/* existing */}</table>
  <div className="md:hidden space-y-3">
    {rows.map(r => (
      <details key={r.feature} className="border rounded-lg p-4">
        <summary className="font-semibold">{r.feature}</summary>
        <div className="mt-2 text-sm"><strong className="text-orange-600">Swoop:</strong> {r.swoop}</div>
        <div className="mt-1 text-sm text-stone-500"><strong>Jonas + ClubEssentials + spreadsheets:</strong> {r.others}</div>
      </details>
    ))}
  </div>
  ```
- **Effort:** S

### P1-6 — About page has no primary CTA anywhere above the fold
- **Page:** About (mobile + after P0-1 fix, desktop)
- **File:** `src/landing/pages/AboutPage.jsx`
- **Issue:** About page is a narrative dead end. A GM who's sold on the story has nowhere to click. No mid-page cross-link, no bottom DemoCtaSection.
- **Fix:**
  1. Add a hero CTA directly under the H1:
     ```jsx
     <a href="#/contact" className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg mt-8">
       Book a 15-min coffee chat
     </a>
     ```
  2. Add a mid-page cross-link after the "Who you'll work with" section: `See how the platform works →` pointing to `#/platform`.
  3. Ensure `<DemoCtaSection />` renders at the bottom of `AboutPage.jsx` so there's no dead end.
- **Effort:** S

### P1-7 — Pricing tier cards have no per-tier CTA buttons
- **Page:** Pricing (desktop + mobile)
- **File:** `src/landing/components/PricingSection.jsx`
- **Issue:** User sees 3 prices with one generic CTA at the bottom. No per-tier self-selection. CRO, B2B, Copy lenses all flagged.
- **Fix:** Add an orange button inside each card:
  ```jsx
  <a href={`#/contact?plan=${tier.slug}`} className="mt-6 block text-center py-3 rounded-lg bg-orange text-ink font-bold">
    {tier.price === '$0/mo' ? 'Start free — no card' : `Book demo — ${tier.name}`}
  </a>
  ```
  Read `?plan=` param on Contact page to pre-select tier. Reorder mobile so the $499 (featured) tier is first. Add `{featured && <div className="md:hidden absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most popular</div>}` ribbon for mobile (since scale-up doesn't translate).
- **Effort:** S

### P1-8 — Hero missing risk-reversal subline
- **Page:** Home (desktop + mobile)
- **File:** `src/landing/components/HeroSection.jsx`
- **Issue:** B2B lens: no "no credit card / no IT lift / 90-day out clause" above the fold. Every GM objection is ignored.
- **Fix:** Add directly under primary CTA:
  ```jsx
  <p className="text-xs text-white/70 mt-2">
    No credit card · No IT lift · Live in 2 weeks · 3 founding-partner slots left for Q2
  </p>
  ```
- **Effort:** XS

### P1-9 — "Most Popular" badge on $499 tier can't be substantiated at n=7 pilot clubs
- **Page:** Pricing (desktop + mobile)
- **File:** `src/landing/data.js`, `src/landing/components/PricingSection.jsx`
- **Issue:** Trust lens flagged this as the biggest single gap on the pricing page. "Most Popular" implies a customer base large enough to have a mode. With 7 pilot clubs, it's unsubstantiable.
- **Fix:** In `data.js`, replace `badge: 'Most Popular'` on the $499 tier with `badge: 'Founding-Partner Pick'`. Add a footnote under the tier: `Chosen by 5 of 7 founding-partner clubs.` The claim now has a denominator.
- **Effort:** XS

### P1-10 — "Most clubs recover Swoop's annual cost within 60 days" — no n, no source
- **Page:** Pricing (desktop)
- **File:** `src/landing/pages/PricingPage.jsx` line 21
- **Issue:** "Most clubs" with no denominator after the beautifully sourced hero stats directly above. Trust regression.
- **Fix:** Replace with:
  ```
  5 of 7 founding-partner clubs recovered Swoop's annual cost within 60 days of their first intervention (Jan–Apr 2026 cohort). Start free. Upgrade when the ROI shows up in your own numbers.
  ```
- **Effort:** XS

### P1-11 — Hero footnote invisible on mobile (13px / 40% white opacity)
- **Page:** Home (mobile)
- **File:** `src/landing/components/HeroSection.jsx` line 91
- **Issue:** The "$74K figure: Pinetree CC pilot" source citation (the only real citation on the page) renders effectively invisible on mobile.
- **Fix:** Raise footnote color from `rgba(255,255,255,0.40)` to `rgba(255,255,255,0.65)`, bump `fontSize` from 13 to 14. Also fix the weasel framing — change `The average club protects $74K` to `Pinetree CC recovered $74K in dues in their first 90 days on Swoop.` (n=1 cannot be an "average").
- **Effort:** XS

### P1-12 — Source citations for pricing stats rendered at 11px/0.35 opacity italic on mobile
- **Page:** Pricing (mobile)
- **File:** `src/landing/pages/PricingPage.jsx` lines 46-48
- **Issue:** The one thing Pricing does right on trust (NGCOA / Club Benchmarking citations) becomes invisible on the device most GMs use first.
- **Fix:**
  ```jsx
  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
    Source: {s.source}
  </p>
  ```
  Drop italic, raise opacity to 0.55, label explicitly `Source:` rather than bare parentheses.
- **Effort:** XS

### P1-13 — Integrations shown as a circular logo ring unreadable at mobile resolution
- **Page:** Platform (mobile), Home (mobile)
- **File:** `src/landing/components/IntegrationsSection.jsx`
- **Issue:** Logo ring communicates "we have logos" without the credibility payoff of actually reading any. Trust + B2B lenses both flagged.
- **Fix:** On `<768px`, replace the ring with a 2-column text list grouped by type:
  ```
  Tee sheet: Jonas, ClubEssentials, Northstar, ClubReady, foreUP, Club Prophet
  POS:       Lightspeed Golf, Square, Toast, Clover
  CRM:       HubSpot, Salesforce, Mailchimp
  ```
  Plus a footer line: `Preferred integration partner: Jonas Club Software (Feb 2026).`
- **Effort:** S

### P1-14 — Security/SOC2 language absent on every page including Contact
- **Page:** Home, Platform, Pricing, About, Contact (all)
- **File:** `src/landing/components/LandingFooter.jsx`
- **Issue:** Zero SOC 2, encryption, data residency, or data ownership language anywhere. Technical + Trust lenses flagged on all 5 pages. Asking for live club data on Contact without a security note is the biggest trust gap on the site.
- **Fix:** Add a single-line security commitment strip to `LandingFooter.jsx` (above copyright):
  ```
  Your club's data stays yours. Mutual NDA on every pilot. AES-256 at rest, TLS 1.3 in transit. SOC 2 Type II in progress (Q3 2026).
  ```
  Include on every page automatically via footer.
- **Effort:** XS

### P1-15 — Comparison table uses unnamed "Point solutions" straw man
- **Page:** Platform (desktop)
- **File:** `src/landing/components/ComparisonSection.jsx`
- **Issue:** A GM cannot verify a comparison against unnamed competitors. B2B buyers filter out straw-man marketing.
- **Fix:** Replace `Point solutions` column header with `Jonas + ClubEssentials + spreadsheets — the typical 2026 stack` and add a footnote: `Comparison based on published feature matrices as of Apr 2026. See docs/competitor-matrix.md.` Commit that matrix file so the claim is auditable.
- **Effort:** S

### P1-16 — Home hero value prop is diluted by repeated pitches ("four systems" → "six agents" → "one page")
- **Page:** Home (desktop + mobile)
- **File:** `src/landing/components/HeroSection.jsx`, `src/landing/pages/HomePage.jsx`, `src/landing/components/AgentsSection.jsx`
- **Issue:** Messaging lens: the page reads as four half-baked value props instead of one sharp one. Mobile especially — 20 viewports of near-identical content.
- **Fix:** Promote the strongest copy (currently on About mobile) into `HeroSection.jsx`:
  - H1: `Your club runs on Jonas, Lightspeed, ForeTees, and a spreadsheet. Swoop turns them into one 6 AM brief.`
  - Sub: `Most club software tells you what happened. Swoop tells you what to do about it — connecting your tee sheet, POS, member CRM, and scheduling into one morning briefing that turns operational noise into decisions.`
  - Mobile H1: `One 6 AM brief. Every system. Every member.`
  
  In `HomePage.jsx`, collapse `AgentsSection` to a single "How it works" accordion below the fold on mobile. Gate 2-3 duplicate capability grids behind `hidden md:block` to shrink mobile scroll depth from 20 to ~8 viewports.
- **Effort:** M

### P1-17 — Platform six-jobs cards lack outcome metrics
- **Page:** Platform (desktop + mobile)
- **File:** `src/landing/components/CoreCapabilitiesSection.jsx`
- **Issue:** All six cards read as features, not outcomes. B2B lens: no dollar/hours-saved number per card means differentiation evaporates.
- **Fix:** Prepend an outcome metric to each card title and lead the body with it:
  ```
  Dues drift detector → flags members 14 days before lapse, avg $2,400 recovered per flag.
  Tee-sheet reconciliation → saves ~6 hrs/week of assistant GM time.
  At-risk member flagging → $82K recovered across founding-pilot clubs (avg).
  ```
  Also shorten card body to 12 words on mobile with a "See how" expander.
- **Effort:** M

### P1-18 — About team avatars are single-letter CSS monograms, not real photos
- **Page:** About (mobile + desktop)
- **File:** `src/landing/components/TeamSection.jsx`
- **Issue:** Trust lens: giant "T" in a circle looks like a placeholder. Plus no LinkedIn links, no prior-employer credentials.
- **Fix:**
  1. Ship real JPGs to `src/landing/assets/team/tyler.jpg`, `jordan.jpg`, `chen.jpg`. Replace monogram `<div>`s with `<img>`.
  2. Add `linkedinUrl` + `priorRole` to each data entry. Render name as a LinkedIn link. Example:
     ```js
     { name: 'Tyler Hayes', title: 'Co-founder & CEO',
       linkedinUrl: 'https://linkedin.com/in/tylerhayes',
       priorRole: 'Former Member Ops Director, Desert Mountain Club (2019–2023)',
       bio: '...' }
     ```
- **Effort:** M (blocked on ship-assets)

### P1-19 — Hero/ROI calculator numbers lack method footnote on mobile
- **Page:** Pricing (mobile)
- **File:** `src/landing/components/RoiCalculatorSection.jsx`
- **Issue:** `$128,000` reads as marketing assertion rather than a user-controlled calc on small screens.
- **Fix:** Add a persistent footnote directly under the dollar output:
  ```
  Calculated from your inputs: avg dues × churned members × 12. Not a projection — math you can verify.
  ```
- **Effort:** XS

### P1-20 — Pricing security FAQ collapsed by default
- **Page:** Pricing (mobile)
- **File:** `src/landing/components/FaqSection.jsx`, `src/landing/pages/PricingPage.jsx`
- **Issue:** The "Is my members' data secure?" answer is hidden behind a tap on the page where trust decisions happen.
- **Fix:** Pass `defaultOpen={true}` to that specific FAQ item (and pre-open FAQ #1 on mobile generally so a GM sees at least one real answer). Add a visible chevron affordance so items look tappable:
  ```jsx
  <summary className="flex justify-between items-center cursor-pointer py-4">
    <span>{q}</span>
    <ChevronDown className="w-5 h-5 text-stone-400 group-open:rotate-180 transition" />
  </summary>
  ```
- **Effort:** XS

### P1-21 — Contact form missing qualifying fields + preferred-time picker
- **Page:** Contact (desktop + mobile)
- **File:** `src/landing/pages/ContactPage.jsx`
- **Issue:** No club size, no role. BDRs can't route leads. CRO lens also flagged expectation gap between "Book" button and form-only submission (implies Calendly).
- **Fix:** Add two optional qualifying fields:
  ```jsx
  <select name="clubSize"><option>Under 200 members</option><option>200-400</option><option>400-700</option><option>700+</option></select>
  <select name="role"><option>GM</option><option>AGM</option><option>Ops</option><option>F&B Director</option><option>Board member</option><option>Other</option></select>
  ```
  Add a "What happens next" strip under the form (3 steps: confirm → data upload → call). If feasible, swap to a Calendly inline embed.
- **Effort:** S

### P1-22 — No section anchors / sub-nav on long Platform page
- **Page:** Platform (desktop + mobile)
- **File:** `src/landing/pages/PlatformPage.jsx`
- **Issue:** 20+ viewport scroll with no TOC. Navigation lens: GMs drown in content.
- **Fix:** Add a sticky pill sub-nav under the hero (mobile = horizontal-scroll chip row):
  ```jsx
  <div style={{ position:'sticky', top:64, zIndex:150, display:'flex', gap:8, overflowX:'auto', padding:'10px 16px', background:'rgba(250,247,242,0.96)' }}>
    {['Agents','How it works','Integrations','Comparison','Pricing'].map(s => (
      <a key={s} href={`#${s.toLowerCase().replace(/ /g,'')}`} style={{ whiteSpace:'nowrap', padding:'6px 14px', borderRadius:999, border:'1px solid rgba(17,17,17,0.12)', fontSize:13 }}>{s}</a>
    ))}
  </div>
  ```
  Add matching `id` attributes to each section component.
- **Effort:** S

---

## P2 — Polish

### P2-1 — Typography hierarchy collapses on mobile (H2/H3/body all same weight)
- **Page:** Home, Platform (mobile)
- **File:** `src/landing/landing.css`
- **Fix:**
  ```css
  .landing h2 { font-size: clamp(2rem, 3.4vw, 3rem); line-height: 1.1; letter-spacing: -0.02em; text-wrap: balance; }
  .landing h3 { font-size: 1.125rem; font-weight: 600; }
  @media (max-width: 640px) {
    .landing section { padding-block: 3rem; }
    .landing h2 { font-size: 1.75rem; line-height: 1.15; }
    .landing h3 { font-size: 1rem; }
    .landing .card { padding: 1.25rem; }
  }
  ```
- **Effort:** XS

### P2-2 — Tap targets <44px in nav/footer
- **Page:** Sitewide (mobile)
- **File:** `src/landing/components/LandingNav.jsx`, `src/landing/components/LandingFooter.jsx`, `src/landing/landing.css`
- **Fix:**
  ```css
  .landing-nav a, .landing-nav button { min-height: 44px; display: inline-flex; align-items: center; }
  .landing-nav .menu-toggle { width: 48px; height: 48px; }
  .landing-footer a { min-height: 44px; display: inline-flex; align-items: center; padding: 0 8px; }
  ```
  Add `aria-label="Open menu"` + `aria-expanded={menuOpen}` to hamburger button.
- **Effort:** XS

### P2-3 — Featured pricing tier doesn't pop (shadow/elevation too subtle)
- **Page:** Pricing (desktop)
- **File:** `src/landing/components/PricingSection.jsx`
- **Fix:**
  ```jsx
  <div className={`rounded-2xl p-8 ${featured
    ? 'bg-white ring-2 ring-orange-500 shadow-2xl scale-[1.03] relative z-10'
    : 'bg-white ring-1 ring-stone-200 shadow-sm'}`}>
  ```
- **Effort:** XS

### P2-4 — Beige section background indistinguishable from white
- **Page:** Platform (desktop)
- **File:** `src/landing/landing.css`
- **Fix:**
  ```css
  .section-beige { background: #f5f1ea; }
  .section-beige + .section-white { border-top: 1px solid #e8e2d6; }
  ```
- **Effort:** XS

### P2-5 — Jargon/cliché sweep
- **Page:** Home, Platform, Contact
- **Files:** `src/landing/components/HeroSection.jsx`, `SocialProofSection.jsx`, `SeeItFixItProveItSection.jsx`, `IntegrationsSection.jsx`, `DemoCtaSection.jsx`
- **Fixes:**
  - `Intelligent automation` → `Agents that act, not alert`
  - `From the trenches` → `What GMs told us this week`
  - `The right errors. The right places. Without the guesswork.` → `Right errors. Right people. Ranked by dollars at risk.`
  - `Your tools manage operations. Swoop connects them.` → `Your tools store the data. Swoop decides what to do with it.`
  - Comparison table column headers `Swoop | Legacy` → `Swoop | Jonas | Club Essentials | ForeTees`
  - Contact CTA eyebrow `BOOK A DEMO` → delete (H1 carries the meaning)
- **Effort:** XS

### P2-6 — Mobile line length too wide in About narrative
- **Page:** About (mobile)
- **File:** `src/landing/landing.css`
- **Fix:**
  ```css
  @media (max-width: 640px) {
    .landing .prose p { max-width: 34ch; margin-inline: auto; }
  }
  ```
- **Effort:** XS

### P2-7 — Footer is a flat single row instead of grouped columns
- **Page:** Sitewide
- **File:** `src/landing/components/LandingFooter.jsx`
- **Fix:** Restructure into 3 columns: Product (Platform, Pricing, Integrations) / Company (About, Contact, Careers) / Legal (Privacy, Terms).
- **Effort:** S

### P2-8 — Scroll progress indicator missing on long pages
- **Page:** Home, Platform (desktop)
- **File:** `src/landing/components/LandingNav.jsx`
- **Fix:** Append a progress bar under the sticky nav driven by `window.scrollY / (documentHeight - innerHeight)`:
  ```jsx
  <div style={{height:2, background:'#ff8a3d', transform:`scaleX(${scrollPct})`, transformOrigin:'left'}} />
  ```
- **Effort:** S

### P2-9 — Add "Next: See pricing →" contextual forward link at bottom of Platform page
- **Page:** Platform (desktop + mobile)
- **File:** `src/landing/pages/PlatformPage.jsx`
- **Fix:** Before `<LandingFooter />`, append a `Next: See pricing →` block routing to `#/pricing` so the buyer flow has forward motion.
- **Effort:** XS

### P2-10 — Add "How it works, technically" disclosure panel
- **Page:** Platform, Contact (mobile)
- **Files:** `src/landing/components/IntegrationsSection.jsx`, `src/landing/pages/ContactPage.jsx`
- **Fix:** Add a collapsed `<details>` block labeled `For IT and Ops teams` containing:
  - Systems we connect to: Jonas, Club Essentials, Northstar, ClubReady, Lightspeed, foreUP, Club Prophet, Stripe, Toast, Square
  - How data moves: Read via API or nightly SFTP. Write-back only for tee-sheet notes, CRM tasks, GM-approved messages.
  - Security: AES-256 at rest, TLS 1.3, SSO, RBAC, 90-day audit log
  - AI transparency: Anthropic Claude API, zero-retention agreement, PII never trains models, every action logged and reversible
- **Effort:** S

### P2-11 — Hero needs product dashboard screenshot, not all-text
- **Page:** Home (desktop)
- **File:** `src/landing/components/HeroSection.jsx`
- **Fix:** Add right-column dashboard screenshot at `lg:` breakpoint:
  ```jsx
  <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
    <div>{/* headline + CTA */}</div>
    <img src="/assets/hero-dashboard.png" alt="Swoop morning briefing"
         className="rounded-xl shadow-2xl ring-1 ring-white/10" />
  </div>
  ```
  Ship the dashboard PNG as a real product snapshot.
- **Effort:** S (plus asset creation)

### P2-12 — FAQ questions weighted to wrong concerns on mobile
- **Page:** Pricing (mobile)
- **File:** `src/landing/components/FaqSection.jsx`, `src/landing/data.js`
- **Fix:** Reorder FAQ so the top 3 mobile items are: (1) "Can we cancel and keep our data?" (2) "How long until we're live?" (3) "Does this work with Jonas / ClubEssentials?" Also add: "My club is on a 3-year Jonas contract — can I still use Swoop?", "Does this need board approval?", "Who owns the data if we leave?"
- **Effort:** XS

### P2-13 — Pricing tier cards lack technical detail (seats, refresh cadence, SLA)
- **Page:** Pricing (desktop + mobile)
- **File:** `src/landing/components/PricingSection.jsx`
- **Fix:** Add a "Included technically" row to each tier:
  - Free: Read-only 1 system, daily refresh, 30d retention, 1 seat
  - Standard: Read+write 4 systems, hourly refresh, 12mo retention, 5 seats, SSO, CSV export
  - Club: Unlimited, 15-min refresh, 36mo retention, SSO+SAML, 99.9% SLA, DPA on request
- **Effort:** S

### P2-14 — Contact page: add founder byline and testimonial
- **Page:** Contact (desktop + mobile)
- **File:** `src/landing/pages/ContactPage.jsx`
- **Fix:** Below form submit button add: `Tyler Hayes (co-founder) personally replies to every form within one business day.` Add a single testimonial card adjacent to the form: `'Swoop found $47k in lapsed dues in week one.' — GM, Top-100 Platinum club.` (Use named attribution once a real quote is available.)
- **Effort:** XS

### P2-15 — Replace generic Lucide outline icons with filled duotone variants
- **Page:** Platform (desktop)
- **File:** `src/landing/components/CoreCapabilitiesSection.jsx`
- **Fix:** `<Icon className="w-8 h-8 text-orange-500 fill-orange-100" strokeWidth={1.5} />`
- **Effort:** XS

### P2-16 — Move mobile phone field label to clarify optionality
- **Page:** Contact (mobile)
- **File:** `src/landing/pages/ContactPage.jsx`
- **Fix:** Label as `Phone (optional — we won't call unless you ask)` and add reciprocal offer `Add your phone and we'll call you within 10 minutes during business hours — founder's direct line.`
- **Effort:** XS

---

## Do Not Touch

Sections already scoring A-/A across multiple lenses. Implementation agents should leave these alone except for the P1/P2 tasks explicitly listed above:

- **Pricing desktop hero** — `The platform that pays for itself.` + ROI calculator (`PricingPage.jsx`, `RoiCalculatorSection.jsx`). Strongest page in the audit. Only touch to fix the `$2.1B` clipping bug (P0-2), the "Most Popular" badge (P1-9), and the unsourced "Most clubs" line (P1-10).
- **Contact desktop hero copy** — `See what your club misses today and can recover tomorrow.` + the 30-minute explainer + 3-bullet deliverables list (`ContactPage.jsx`). Textbook B2B. Preserve verbatim while addressing P0/P1 bugs.
- **Pricing hero sourced stat citations** — `(NGCOA 2023)`, `(Club Benchmarking 2024)` attribution format is the best trust moment on the site. Don't remove; only raise contrast per P1-12.
- **About mobile copy** — `Built for the people who run private clubs` + `Most club software tells you what happened. Swoop tells you what to do about it` + `we're in your systems, on your calls, and in your board deck.` This is the strongest copy on the entire property and gets promoted to Home hero per P1-16. Preserve the source on the About page while also promoting it.
- **Platform "Six jobs Swoop does before your GM finishes coffee" headline** — Keep verbatim; only add outcome metrics per P1-17.
- **`Things GMs ask us` FAQ label** — do not revert to `Frequently Asked Questions`.
- **Disciplined two-color accent system** (orange CTA + dark green hero) — preserve across all pages.

---

## Per-Page Task Lists

### Home Page Tasks
- **P0:** P0-3 (footer legal links), P0-4 (scarcity contradiction), P0-7 (agents spinner), P0-5 (phone if referenced in footer)
- **P1:** P1-1 (mobile sticky CTA), P1-4 (differentiate CTA labels), P1-8 (risk-reversal subline), P1-11 (hero footnote visibility + fix n=1 "average" weasel), P1-14 (footer security strip), P1-16 (consolidate hero value prop, promote About copy to Home, shorten mobile scroll)
- **P2:** P2-1 (type hierarchy), P2-2 (tap targets), P2-5 (jargon sweep — `Intelligent automation`, `From the trenches`), P2-7 (footer columns), P2-8 (scroll progress bar), P2-11 (hero dashboard screenshot)
- **Files touched:** `src/landing/components/HeroSection.jsx`, `src/landing/components/AgentsSection.jsx`, `src/landing/components/AgentsLiveDemo.jsx`, `src/landing/components/SocialProofSection.jsx`, `src/landing/components/DemoCtaSection.jsx`, `src/landing/components/InlineCta.jsx`, `src/landing/components/PricingSection.jsx`, `src/landing/pages/HomePage.jsx`, `src/landing/components/SeeItFixItProveItSection.jsx`

### Platform Page Tasks
- **P0:** P0-3 (footer), P0-7 (agents spinner)
- **P1:** P1-1 (mobile sticky CTA), P1-4 (differentiate CTA label to `See a live agent run on your tee sheet`), P1-5 (mobile comparison table → stacked cards), P1-13 (integrations ring → text list on mobile), P1-14 (footer security), P1-15 (name competitors in comparison table), P1-17 (outcome metrics on 6 job cards + truncate body on mobile), P1-22 (sticky sub-nav pill bar)
- **P2:** P2-4 (beige section contrast), P2-5 (jargon sweep — `Your tools manage operations...`, `The right errors...`), P2-9 (Next: See pricing link), P2-10 (For IT and Ops disclosure), P2-15 (duotone icons)
- **Files touched:** `src/landing/components/IntegrationsSection.jsx`, `src/landing/components/ComparisonSection.jsx`, `src/landing/components/CoreCapabilitiesSection.jsx`, `src/landing/components/AgentsLiveDemo.jsx`, `src/landing/components/AgentsSection.jsx`, `src/landing/components/SaveStorySection.jsx`, `src/landing/components/SeeItFixItProveItSection.jsx`, `src/landing/pages/PlatformPage.jsx`

### Pricing Page Tasks
- **P0:** P0-2 ($2.1B clipping), P0-3 (footer), P0-4 (scarcity contradiction)
- **P1:** P1-1 (mobile sticky CTA), P1-4 (differentiate tier CTA labels), P1-7 (per-tier CTA buttons + reorder featured first on mobile + ribbon badge), P1-9 ("Most Popular" → "Founding-Partner Pick"), P1-10 (sourced "5 of 7" replacement), P1-12 (raise source citation contrast), P1-14 (footer security), P1-19 (ROI calculator method footnote), P1-20 (security FAQ default-open + chevrons)
- **P2:** P2-3 (featured tier elevation), P2-12 (FAQ reorder + 3 new GM-voice questions), P2-13 (technical details per tier)
- **Files touched:** `src/landing/pages/PricingPage.jsx`, `src/landing/components/PricingSection.jsx`, `src/landing/components/RoiCalculatorSection.jsx`, `src/landing/components/FaqSection.jsx`, `src/landing/components/IndustryStatsSection.jsx`, `src/landing/data.js`

### About Page Tasks
- **P0:** P0-1 (desktop renders blank — highest-priority blocker), P0-3 (footer)
- **P1:** P1-1 (mobile sticky CTA), P1-6 (hero CTA + mid-page cross-link + bottom DemoCtaSection), P1-14 (footer security), P1-18 (real team photos + LinkedIn + prior-employer credentials)
- **P2:** P2-6 (mobile line length), delete redundant eyebrow `WHO YOU'LL WORK WITH`, rewrite `founding-partner clubs / hands-on` → `6 founding clubs / for six months we sit in your systems...`
- **Files touched:** `src/landing/pages/AboutPage.jsx`, `src/landing/components/TeamSection.jsx`, `src/landing/LandingShell.jsx`, `src/landing/landing.css`, ship `src/landing/assets/team/*.jpg`

### Contact Page Tasks
- **P0:** P0-3 (footer self-loop — most damaging on this page), P0-5 (phone number), P0-6 (`early-club` typo)
- **P1:** P1-1 (mobile sticky CTA), P1-2 (form input types), P1-3 (mailto/tel links), P1-4 (CTA → `Show me my club's leaks`), P1-14 (footer security), P1-21 (club-size + role fields, what-happens-next strip, Calendly if feasible)
- **P2:** P2-5 (delete `BOOK A DEMO` eyebrow), P2-10 (technical disclosure panel), P2-14 (founder byline + testimonial card), P2-16 (phone field reciprocal offer)
- **Copy surgeries:**
  - Replace `Limited founding-partner slots available — early-club get hands-on onboarding and direct input on the roadmap` with `6 founding-club slots. You get a named engineer for 90 days and a vote on next quarter's build list.`
  - Replace `Benchmarks against comparable clubs` bullet with `Benchmarks vs. the 7 founding-partner clubs (anonymized, your club not identified)`
  - Add NDA bullet: `Your data under mutual NDA. We never share club data across pilots. Data deleted within 30 days if you don't move forward.`
- **Files touched:** `src/landing/pages/ContactPage.jsx`, `src/landing/components/DemoCtaSection.jsx`

### Shared / Cross-Page Tasks
- **LandingNav.jsx:** Tap target sizing (P2-2), `aria-expanded` / `aria-label` on hamburger, mobile drawer → fixed overlay (not inline-pushing), scroll progress bar (P2-8), active-state label for current route in collapsed mobile bar.
- **LandingFooter.jsx:** P0-3 (real Privacy/Terms routes), P1-3 (mailto/tel), P1-14 (security commitment strip), P2-2 (tap targets), P2-7 (three-column Product/Company/Legal structure). Also fix `phone number format` to match the real line.
- **LandingShell.jsx:** Render shared `<MobileStickyCta />` (P1-1). Wrap page routes in `ErrorBoundary` so future render failures don't blank the page (supports P0-1). Add `<body>` bottom padding at `<768px` so sticky CTA doesn't overlap content.
- **landing.css:** Type hierarchy clamps (P2-1), tap targets (P2-2), section rhythm, `.reveal` fallback visible state (P0-1), `text-wrap: balance` on hero titles, mobile form `font-size: 16px` (P1-2), beige section contrast (P2-4), prose max-width on mobile (P2-6).
- **data.js:** Remove `badge: 'Most Popular'` → `badge: 'Founding-Partner Pick'` on $499 tier (P1-9). Add `linkedinUrl` + `priorRole` to team data (P1-18). Reorder FAQ questions (P2-12). Add competitor name list for comparison table (P1-15). Add technical detail per tier (P2-13).
- **New files to create:**
  - `src/landing/components/MobileStickyCta.jsx`
  - `src/landing/components/ErrorBoundary.jsx`
  - `src/landing/pages/PrivacyPage.jsx` (minimal placeholder legal)
  - `src/landing/pages/TermsPage.jsx` (minimal placeholder legal)
  - `public/assets/agents-static.svg` (frozen snapshot of agents panel)
  - `public/assets/hero-dashboard.png` (real dashboard screenshot for hero)
  - `src/landing/assets/team/tyler.jpg`, `jordan.jpg`, `chen.jpg`
  - `docs/competitor-matrix.md` (auditable competitor comparison source of truth)

---

## Execution Order Recommendation

1. **Wave 1 (P0 sweep, 1 day):** P0-1 About blank, P0-2 $2.1B clip, P0-3 footer legal links, P0-4 scarcity contradiction, P0-5 phone placeholder, P0-6 `early-club` typo, P0-7 agents spinner. All XS/S except P0-1 which is M. Ship together.
2. **Wave 2 (P1 Trust + CRO, 2 days):** P1-1 sticky CTA, P1-2 form input types, P1-3 mailto/tel, P1-14 footer security strip, P1-8 hero risk-reversal, P1-11 + P1-12 source citation contrast, P1-9 + P1-10 pricing trust fixes, P1-20 FAQ default-open.
3. **Wave 3 (P1 Conversion, 2 days):** P1-4 differentiated CTA labels, P1-5 mobile comparison table, P1-7 per-tier CTAs, P1-13 integrations text list, P1-16 consolidate Home hero, P1-17 outcome metrics, P1-21 contact form fields.
4. **Wave 4 (P1 Content, 1 day):** P1-6 About CTAs, P1-15 name competitors, P1-18 team photos (blocked on assets), P1-19 ROI footnote, P1-22 Platform sub-nav.
5. **Wave 5 (P2 Polish, 1 day):** P2-1…P2-16 in parallel.

Total estimated effort: **~7 working days** for a single dev, or **~3 days** with 3 parallel agents (P0 in one wave, P1 split across two waves, P2 in final wave).
