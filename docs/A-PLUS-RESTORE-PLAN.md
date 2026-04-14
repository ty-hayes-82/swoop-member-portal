# A+ Landing Page Restoration Plan

Documented from `.screenshots/r14/` (the final A+ state, captured 12:28 PM Apr 13).
The critique session ran from ~9:37 AM to 12:38 PM. Rounds 1–15 earned:
- **Messaging: A+** (Round 4)
- **Design: A+** (Round 5+, confirmed final at Round 8)
- All 9 specialized critic agents scored A+ by r14

Code was never committed — lived only in the working directory and was overwritten by
evening restores. This plan rebuilds it from the screenshots.

---

## 1. Section Order — LandingPage.jsx

The A+ version is a **single-page site** with this exact order:

```
HeroSection
ProblemSection
CoreCapabilitiesSection
HowItWorksSection
AgentsSection
SaveStorySection
IntegrationsSection
ComparisonSection
RoiCalculatorSection
TeamSection
TestimonialsSection
PricingSection
FaqSection
DemoCtaSection
```

**Removed vs current `636dc84` state:**
- `TrustStrip` — removed as a section; trust signals moved into the Hero as bullet points
- `PhotoBand` — removed entirely
- `SocialProofSection` — removed (metric cards removed, data surfaced elsewhere)
- `MemberExperienceSection` — not present

---

## 2. Design System Changes

### Colors (update `src/config/theme.js`)
```js
// Add to theme.neutrals or theme.colors:
heroGreen: '#1B3228',        // Dark hunter green — hero bg, dark section bgs
darkSection: '#0D1A12',      // Very dark green — used on dark bands
brass: '#B5956A',            // Warm gold/brass — eyebrow labels, italic accents
```

### Typography
- **Headlines:** Add Fraunces (serif) for h1/h2. Load via Google Fonts in `index.html`:
  `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,800;1,700;1,800&display=swap" rel="stylesheet">`
- **Body/UI:** Plus Jakarta Sans (unchanged)
- **Mono numbers:** JetBrains Mono (unchanged)

### Italic accent pattern
Throughout the site, certain phrases appear in **italic serif + orange/gold** color.
In JSX this is: `<em style={{ fontStyle: 'italic', color: theme.colors.accent }}>phrase</em>`
Examples: "six days before they tell you", "Daniel opens one page", "every dollar, every action"

---

## 3. Component Changes (by file)

### 3a. `HeroSection.jsx` — Complete redesign

**Visual:** Dark hunter green full-bleed background. Serif headline. Agent console on right.

**Left side:**
- Eyebrow: `"MEMBER RETENTION, BUILT FOR PRIVATE-CLUB GMS"` (brass/gold color, uppercase, wide tracking)
- Headline (Fraunces, ~56px bold): `"See which members are about to resign —"` + line break +
  `<em style={{color: accent, fontStyle: 'italic'}}>six days before they tell you.</em>`
- Body: `"Swoop reads your tee sheet, CRM, and POS together, surfaces at-risk members, fills
  the waitlist with the right replacements, and protects $74K+ in dues a year. Live in fourteen days."`
- Primary CTA button: `"Book the 30-minute walkthrough"` (dark green bg, white text)
- Secondary link: `"or see the daily brief >"` (text link, white/muted, scrolls to HowItWorks)
- Trust bullets (3 × green dot + text):
  - `● Live in under 2 weeks`
  - `● No rip-and-replace`
  - `● 28 integrations`

**Right side — Agent Console Card:**
Dark card (#111 bg, rounded, shadow) showing:
```
BRIEF · 06:14 · DELIVERED                          tonight's brief
$42.2K
protected across 8 actions, delivered 06:14

Member Pulse      Callback queued · Mark Henderson    $9.4K
Service Recovery  Mid-comp drafted · Golf Room     69% $11K
Demand Optimizer  Full-fare slots routed to 5 members -$1.5K
Labor Optimizer   2 FOH shifts added · Get lunch      $3.2K
Engagement Autopilot  18 member outreach sequences  -$42.4K
Revenue Analyst   Board revenue report ready         $12K

sent to gm@pinetree.com — ready before the first tee time
```
Bottom: Swoop monogram icon (golden/brass circle)

---

### 3b. `ProblemSection.jsx` — Content update

- Eyebrow: `"SEE IT · THE PROBLEM"` (compound — first part brass, separator dot, second part lighter)
- Title: `"Most clubs are flying blind."` (large serif)
- Subtitle: `"Your tee sheet, CRM, and POS each hold a fragment. Nobody connects the dots until a member is already gone."`

**3 cards (elevated white on cream bg):**

Card 1 — Member risk blind spot
```
Icon badge (Users)   91% CONFIDENCE (right badge)
Title: Member risk blind spot
Desc: "Your systems see pieces. None of them see the resignation forming."
Bullets:
  • CRM sees complaints. Tee sheet sees no-shows. POS sees declining spend.
  • No shared timeline, so the GM reacts after the resignation letter arrives.
READS FROM: CRM + POS + Excel
```

Card 2 — Complaint follow-up gap
```
Icon badge (MessageSquare)   89% CONFIDENCE
Title: Complaint follow-up gap
Desc: "Acknowledged ≠ resolved. Your complaint inbox tracks tickets, not saves."
Bullets:
  • James Whitfield waited 42 minutes, filed a complaint, and sat in "Acknowledged" for 6 days.
  • No alert fired because the CRM saw a reply, not the absence of action.
READS FROM: Member CRM + Service Desk
```

Card 3 — Demand vs. experience disconnect
```
Icon badge (TrendingDown)   86% CONFIDENCE
Title: Demand vs. experience disconnect
Desc: "Tee sheet tools optimize fill rate, not retention outcomes."
Bullets:
  • FIFO waitlists keep healthy members happy while at-risk members walk away.
  • Wind advisory shifts bookings indoors, but staffing and F&B prep stay blind.
READS FROM: Tee Sheet + Weather + POS
```

---

### 3c. `CoreCapabilitiesSection.jsx` — Title + 6th card + READS FROM tags

- Eyebrow: `"THE PLATFORM"`
- Title: `"Six jobs Swoop does before your GM finishes coffee."`
- Subtitle: `"Member behavior, demand, service, labor, revenue, outreach — all surfaced on one page your team can act from before the first tee time."`
- Layout: 3×2 grid (existing auto-fit, now 6 cards fills it cleanly)

**Add 6th card to `data.js` coreCapabilities:**
```js
{
  icon: 'Mail',  // or 'Send'
  title: 'Engagement & Outreach',
  summary: 'The right message to the right member at the right moment.',
  bullets: [
    'Drafts callback scripts, comp offers, and re-engagement notes.',
    'Every outreach tracked back to the signal that triggered it.',
  ],
  source: 'Email + SMS + Member app',
},
```

**Update card rendering** — replace `confidence` badge with `source` "READS FROM:" tag at card bottom:
```jsx
<p style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700,
  color: theme.colors.textMuted, letterSpacing: '0.08em', margin: '12px 0 0' }}>
  READS FROM: {capability.source}
</p>
```
Remove metric stat display from cards (the `Stat` component at bottom).

---

### 3d. `HowItWorksSection.jsx` — Eyebrow + title update

- Eyebrow: `"FIX IT · THE MONDAY"` (compound, same brass/dot pattern)
- Title: `"The daily brief, written overnight."`
- Subtitle: `"Every morning, Swoop hands your GM a ranked list of members to call, slots to backfill, and service moves to make — with the math behind each recommendation."`
- Keep existing MorningBriefCard dark console design

---

### 3e. `AgentsSection.jsx` — Add agent detail panel above grid

**Add above the 6 agent cards** a full-width dark detail panel:

```
[Dark panel, full width]
  Left column — OVERNIGHT FINDINGS (list):
    Member Pulse  •  91 91 — Mark Henderson · rounds -42% · complaint unresolved 4d
    Revenue Analyst  •  91 91 — F&B range: -4.2% · beverage not-claimed last 3 weeks
    Engagement Autopilot  •  91 91 — 11 members · declining participation · 13 events attended (TY)
    Labor Optimizer  •  91 91 — Sat lunch: 20 covers vs 4 staff scheduled

  Right column — AGENT: Member Pulse (detail card):
    Header: "Member Pulse"  [SEE FULL DETAILS →]
    DETECTED SIGNAL: Mark Henderson · rounds -42% · complaint unresolved 4d
    RECOMMENDED ACTION: Draft GM callback + 2-guest pass offer
    PROJECTED IMPACT: $8,400 dues protected
    [Swoop monogram icon at bottom]
```

Keep existing 6 agent cards grid below (Member Pulse, Demand Optimizer, Service Recovery,
Labor Optimizer, Revenue Analyst, Engagement Autopilot).

---

### 3f. `SaveStorySection.jsx` — Narrative rewrite

- Eyebrow: `"THE SAVE, IN PLAIN ENGLISH"`
- Breadcrumb: `SEE IT · FIX IT · PROVE IT` (3 pills/chips)
- Title (large serif, ~40px):
  ```
  "It's Saturday. 220 rounds booked, 82° and clear. Daniel opens one page.
  The Hendersons — 14-year family members, rounds down 42%, one complaint
  aging four days — are on it. So is the two-server gap in the grill room at 12:30."
  ```
  "Daniel opens one page" = italic orange/gold
- Body paragraph:
  ```
  "He taps approve on a callback with two guest passes. He adds a floor server.
  By Monday afternoon the Hendersons have a tee time for next weekend. That save
  is worth $32K of dues. Daniel's Saturday started before 7am. Swoop's started at midnight."
  ```

**Bottom: Two dark side-by-side cards:**

Left card (dark bg, cream text):
```
SIX WEEKS NON-RENEWAL
Karen Wittman, nine years.

"CRM says active. POS says her last tab was 18 days ago. Tee sheet says no-show
three Wednesdays running. Not one system flagged her. Together they told a different
story — early enough to save."

[CROSS-DOMAIN CATCH →] button
```

Right card (dark bg, orange header):
```
MONTHLY F&B REVIEW
$9,580
/ MONTH F&B LEAK, TRACED

"Slow rounds skipping dining. Understaffed Fridays. Weather no-shows. Swoop
decomposes the drop into three root causes with a dollar-quantified remediation
plan, ready for the board packet."

[WATERFALL READY →] button
```

---

### 3g. `IntegrationsSection.jsx` — Add hub diagram intro section

**Add a new intro subsection ABOVE the existing integration grid:**

- Eyebrow: `"CROSS-DOMAIN · THE STACK"`
- Title: `"Your stack runs the club. Swoop reads it."`
- Subtitle: `"Jonas, ForeUP, Toast, and your member app already collect the signals. Swoop sits on top, connects them, and hands your GM the morning brief."`

Left: **Hub SVG diagram** — circle labeled "HUB" in center with 8 spokes to labeled nodes
(Jonas, ForeUP, Toast, Squirrel, ADP, QuickBooks, HubSpot, Brivo)

Right: **4 integration descriptions:**
```
Jonas Club / Club Essential — member identity
We read the member record: tenure, ties, household, and the complaint log.
Every risk alert we surface is traceable to a named member, not a segment.

ForeUP / Lightspeed Golf — play behavior
Rounds, cancellations, no-shows, guest play, and pace-of-play feed the risk
model. Drop of 30% in 6 weeks is a signal; we catch it the morning after.

Toast / Squirrel / POSitouch — spend behavior
F&B check count, tab size, and beverage mix inside the clubhouse. When a
"happy" member stops lingering on Fridays, Swoop notices before the GM does.

Swoop Member App — on-property + GPS
First-party behavioral data no point system captures: who actually walked to
the range, dined after the round, or lingered at the golf vs. left in 20 minutes.
```

Keep existing `28 INTEGRATIONS ACROSS 10 CATEGORIES` grid below.

---

### 3h. `ComparisonSection.jsx` — Title update

- Title: `"One page replaces four logins."`
- Subtitle: `"Waitlist tools fill slots. CRMs store records. Spreadsheets report the past. Swoop ranks today's members, today's demand, and today's moves."`
- Keep existing comparison table (Swoop vs Waitlist Tools vs Your CRM vs Spreadsheets)

---

### 3i. `RoiCalculatorSection.jsx` — Layout redesign

- Eyebrow: `"PROVE IT · THE MATH"`
- Title: `"What is member turnover costing your club?"`
- Subtitle: `"Your club's turnover math, in your numbers."`

**Two-column layout (left: inputs, right: results):**

Left column:
- Line chart card (cream bg): "DUES PROTECTED" — curved line from Jan→Dec, shows growth curve
- 3 sliders:
  1. "TOTAL MEMBERS" default 300
  2. "AVG ANNUAL DUES" default $8,000
  3. "ANNUAL TURNOVER RATE" default 5%

Right column:
- Top section "EXPOSURE TODAY":
  - `15` members at risk (large dark number)
  - `$120,000` Annual revenue at risk (large dark number)
- Divider line
- Bottom section "WITH SWOOP" (based on 65% early-intervention retention rate):
  - `$80,000` Dues protected (10.5 members retained)
- Results summary box (light border):
  - Swoop Intelligence annual cost: `-$1,988`
  - **Net revenue gain: `$74,012`** (bold dark)
  - 13× return on investment
- CTA button: `"Book the 30-minute walkthrough →"` (dark green, full width)

---

### 3j. `TeamSection.jsx` — Add board deck preview

- Eyebrow: `"WHO YOU'LL WORK WITH"`
- Title: `"The humans in your clubhouse for six months."`
- Subtitle: `"On-site, on Slack, in roadmap reviews — not a help-desk queue."`

**3 team member cards:**
```
[TH] Tyler Hayes  (Founder & CEO emoji)
     Former club-tech operator. Ran member experience at a 300-member smart club. Ten
     years building SaaS for private clubs.

[JM] Jordan Mitchell  (emoji)
     Ex-Agilysys (hospitality tech, NASDAQ: AGYS). Eight years building behavioral
     prediction systems for clubs, resorts, and cruise lines.

[AC] Alex Chen  (emoji)
     Ex-Salesforce Industries. Six years turning operational data into daily workflows.
     Your onboarding lead for the pilot.
```

**Add after team cards — board deck preview section:**
```
END OF PILOT · OCTOBER BOARD PREP          [right: Swoop pilot preview card]

"We ship the board deck. Every save,          ┌─────────────────────────┐
every dollar, every action."                  │ Fox Ridge Club — Pilot Summary  │
(italic orange: "Every save, every            │ ATTRIBUTION TREE         │
dollar, every action")                        │ 14 members flagged       │
                                              │  9 saves attributed      │
"At the end of your six-month pilot,          │ $67.2K dues protected    │
Swoop hands your GM a populated template      │ [bar chart]              │
with every at-risk member flagged, every      │ Henderson family  $14k   │
action approved, every dollar attributed.     │ Arden, S.J.    $12.4k    │
Your October board meeting runs 20 minutes,   │ Fall attrition   $9.8k   │
not 45."                                      └─────────────────────────┘
```

---

### 3k. `TestimonialsSection.jsx` — Single large quote

Replace multi-card layout with a single centered pull-quote:

```jsx
<div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
  <div style={{ fontSize: 80, color: theme.colors.accent, lineHeight: 0.5, marginBottom: 24 }}>"</div>
  <p style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontFamily: 'Fraunces, serif',
    fontWeight: 700, lineHeight: 1.45, color: theme.neutrals.ink }}>
    The Saturday brief is the first club-tech vendor deliverable I've ever forwarded
    to my board without rewriting.{' '}
    <em style={{ color: theme.colors.accent, fontStyle: 'italic' }}>
      Two members we were about to lose
    </em>
    {' '}are still here because of it.
  </p>
  <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.colors.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: 16 }}>DM</div>
    <div style={{ textAlign: 'left' }}>
      <p style={{ fontWeight: 700, margin: 0 }}>D. Marchetti · GM</p>
      <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: 0 }}>
        Founding partner · 600-member private club · Tenure withheld through Q2 2026 pilot
      </p>
    </div>
  </div>
</div>
```

---

### 3l. `PricingSection.jsx` — New title + founding partners banner

- Eyebrow: `"THE TERMS"`
- Title: `"Start at zero. Upgrade when the math shows up."`
- Subtitle: `"No long-term contract. Cancel at the end of any month."`

**Add founding partners banner ABOVE the pricing cards:**
```jsx
<div style={{ background: '#FAF7F2', border: '1px solid rgba(17,17,17,0.10)',
  borderRadius: 12, padding: '18px 24px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 32 }}>
  <div>
    <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.1em', color: theme.colors.accent, margin: '0 0 4px' }}>
      FOUNDING PARTNERS · NINE SEATS LEFT
    </p>
    <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
      Swoop is in closed pilot today — the first ten founding-partner clubs get hands-on
      onboarding, direct roadmap input, and locked-in pricing for life. Attributed case
      studies publish Q2 2026.
    </p>
  </div>
  <Button size="sm" style={{ whiteSpace: 'nowrap', marginLeft: 24 }}>
    Claim a founding seat
  </Button>
</div>
```

---

### 3m. `FaqSection.jsx` — Title + questions update

- Title: `"Things GMs ask us."`
- Questions to display (update filter or hardcode order):
  1. "Do I need to replace my current software?" (open by default)
  2. "How long does setup take?"
  3. "Is my members' data secure?"
  4. "What does a founding-partner pilot actually look like?"

**Add to `data.js` faqItems:**
```js
{
  question: 'What does a founding-partner pilot actually look like?',
  answer: 'Six months. Your data, your members, your systems. We connect your tee sheet, POS, and CRM in week one. Your GM gets a daily brief starting day two. At the end, you have a board deck with every save attributed, every dollar traced. Nine founding seats remain — first ten clubs get locked-in pricing for life.',
},
```

---

### 3n. `DemoCtaSection.jsx` — Eyebrow + title update

- Eyebrow: `"THE WALKTHROUGH"`
- Title (serif, large): `"See what your club misses today,"`
  + italic gold: `"and what you recover tomorrow."`
- Body: `"A 30-minute walkthrough on your club's real data — tee sheet leakage, at-risk members, F&B staffing pressure, revenue blind spots. Founding partners only. Nine seats left."`
- Background: Dark overlay on golf course photo (keep existing `photoKey="fairwayGreen"` or similar)
- Form fields: "YOUR CLUB EMAIL" + "CLUB NAME"
- Button: `"Book the 30-minute walkthrough"` (dark green)
- Fine print: `"No credit card required · 30-minute walkthrough · Cancel anytime"` + `"Or email us at"`
- Footer: swoop. logo + "Member Intelligence for Private Clubs" + hello@swoopgolf.com + © 2026 Swoop Golf

---

## 4. data.js Updates Summary

```js
// 1. Add 6th coreCapability (Engagement & Outreach) — see 3c above

// 2. Update pricingTiers names/descriptions:
{
  name: 'Signals',
  price: '$0/mo',
  description: 'Read-only alerts. Swoop reads your systems and surfaces member-risk, complaint, and demand signals daily.',
  features: ['Daily member health scores', 'Risk + complaint + demand alerts', 'Up to 3 system integrations', 'Email support'],
  cta: 'Start on Signals (free)',
},
{
  name: 'Signals + Actions',
  price: '$499/mo',
  badge: 'Most Popular',
  description: 'Everything in Signals, plus Swoop drafts the callback script, the comp offer, and the staffing shift in plain English — so your team acts instead of sorting spreadsheets.',
  features: ['Everything in Signals', 'Intelligence drafts the response', 'Retention-prioritized waitlist routing', 'Up to 10 integrations', 'Priority support'],
  cta: 'Book the 30-minute walkthrough',
},
{
  name: 'Signals + Actions + Member App',
  price: '$1,499/mo',
  description: 'Adds the Swoop member app — GPS + what members actually do on property, plus push notifications and attribution from signal to save.',
  features: ['Everything in Signals + Actions', 'Swoop member app included', 'GPS + on-property member behavior', 'Push notification channel', 'Save-attribution tracking', 'Dedicated success manager'],
  cta: 'Talk to us about Club',
},

// 3. Add founding-partner pilot FAQ — see 3m above
```

---

## 5. LandingPage.jsx — Section Removal

Remove these imports and JSX from `LandingPage.jsx`:
- `TrustStrip` (remove import + `<TrustStrip />`)
- `PhotoBand` (remove import + `<PhotoBand ... />`)
- `SocialProofSection` (remove import + `<SocialProofSection />`)
- `TestimonialsSection` — KEEP but replace with new single-quote version

The `MemberExperienceSection` was never in `636dc84` (it was added in `c4d3761`) — no action needed.

---

## 6. Multi-page Structure (PRIMARY TARGET)

The A+ content maps to 5 pages. All CTAs route to `#/contact`. Nav: Home | Platform | Pricing | About + "Book a Demo" button.

---

### `#/landing` — Home

1. **HeroSection** — Full A+ redesign (dark green, serif, agent console)
2. **ProblemSection** — Updated (confidence scores, READS FROM tags)
3. **CoreCapabilitiesSection** — 3-card teaser (first 3 capabilities only)
   - Add "See all six →" link to `#/platform` below grid
4. **HomeCtaStrip** (existing) — "See the Platform" → `#/platform`, "Book the Walkthrough" → `#/contact`

---

### `#/platform` — Platform

Page hero header:
- Eyebrow: "THE PLATFORM"
- Title: "Every signal. One operating view."
- Subtitle: "Six AI-powered lenses that connect your tee sheet, CRM, POS, staffing, and revenue — surfaced before 6:15 AM."
- CTA: "Book the 30-minute walkthrough" → `#/contact`

Sections (in order):
1. **CoreCapabilitiesSection** — Full 6-card version (updated title/copy + READS FROM)
2. **HowItWorksSection** — "FIX IT · THE MONDAY" / "The daily brief, written overnight."
3. **AgentsSection** — With agent detail panel above grid
4. **SaveStorySection** — "THE SAVE, IN PLAIN ENGLISH" narrative
5. **IntegrationsSection** — Hub diagram intro + 28-integration grid
6. **ComparisonSection** — "One page replaces four logins."

---

### `#/pricing` — Pricing

Page hero header:
- Eyebrow: "THE TERMS"
- Title: "Start at zero. Upgrade when the math shows up."
- Subtitle: "No long-term contract. Cancel at the end of any month."

Sections:
1. **RoiCalculatorSection** — "PROVE IT · THE MATH" redesign
2. **PricingSection** — Updated tiers + founding partners banner
3. **PricingFaqSection** — 4 questions: replace existing, use:
   - "Do I need to replace my current software?"
   - "How long does setup take?"
   - "Is my members' data secure?"
   - "What does a founding-partner pilot actually look like?"

---

### `#/about` — About

Page hero header (existing, keep):
- "Built for the people who run private clubs"

Sections:
1. **TeamSection** — "WHO YOU'LL WORK WITH" + board deck preview
2. **TestimonialsSection** — Single D. Marchetti pull-quote
3. **SocialProofSection** — Keep the Founding Partner Program box (remove metric cards or keep minimal)
4. **FaqSection** — "Things GMs ask us."

---

### `#/contact` — Contact

1. **PilotResultsStrip** (existing in ContactPage) — keep
2. **DemoCtaSection** — "THE WALKTHROUGH" redesign (dark bg, serif title, form)

---

## 7. Implementation Order

1. **data.js** — Add 6th capability, update pricing tier names, add FAQ question
2. **theme.js** — Add `heroGreen`, `darkSection`, `brass` colors; add Fraunces font import
3. **HeroSection.jsx** — Full redesign (most impactful, most complex)
4. **ProblemSection.jsx** — Card content update (confidence scores + READS FROM)
5. **CoreCapabilitiesSection.jsx** — Title + 6th card + READS FROM tags
6. **HowItWorksSection.jsx** — Eyebrow + title text only
7. **AgentsSection.jsx** — Add agent detail panel above grid
8. **SaveStorySection.jsx** — Narrative rewrite + two dark cards
9. **IntegrationsSection.jsx** — Add hub diagram intro
10. **ComparisonSection.jsx** — Title text only
11. **RoiCalculatorSection.jsx** — Layout redesign
12. **TeamSection.jsx** — Add board deck preview
13. **TestimonialsSection.jsx** — Single quote
14. **PricingSection.jsx** — Title + founding partners banner
15. **FaqSection.jsx** — Title + add question
16. **DemoCtaSection.jsx** — Eyebrow + title + styling
17. **LandingPage.jsx** — Remove TrustStrip, PhotoBand, SocialProofSection
