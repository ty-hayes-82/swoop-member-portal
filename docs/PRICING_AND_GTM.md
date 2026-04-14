# Swoop Pricing + Go-to-Market Package

**What this is:** Market research, a specific pricing SKU, pilot structure, a signable one-page contract template, and an objection-handling cheat sheet. Ready to hand to the first 5 design-partner clubs.

**TL;DR recommendation:**
- **Core tier: $1,500/mo flat.** No per-member, no seat math, no modules.
- **Founding Member pricing: $750/mo** locked for 24 months, limited to first 5 clubs.
- **Pilot: 90 days free, opt-out auto-convert.** This is 4× better than opt-in per B2B benchmarks.
- **Contract: Common Paper Cloud Service Agreement (CSA) cover page,** 1 signed page, 30-day data export, cancel anytime. CC-licensed, free, created by dozens of SaaS lawyers.

---

## Part 1 — Market research summary

### 1.1 The TAM is real but small-denominated

Per CMAA's 2025 Economic Impact Report: there are approximately **5,659 private clubs in the US**, with **3,887 having revenue over $1M**. Of those, roughly 2,000–2,500 are golf-and-country clubs in the 300–1,500 member range — the exact ICP for Swoop. [^cmaa]

**Upper bound of TAM:** 2,500 clubs × $18K ARR = **$45M** in addressable revenue before any pricing expansion. Not a unicorn market on its own, but plenty of room for a focused startup to reach $5M+ ARR with 300 clubs (12% penetration) and scale via adjacent verticals (yacht clubs, city clubs, racquet clubs).

### 1.2 Competitor pricing — the market tolerates a wide range

| Competitor | Category | Published price | Typical real cost | Scope |
|---|---|---|---|---|
| **ClubExpress** | Full stack | Public, per-member | **$150–$210/mo** for 500-member club ($0.30–0.42/member/month) | Small/mid clubs, association-style |
| **Club Caddie** | Full stack | Custom | ~$500–$1,500/mo | Mid-market golf |
| **foreUP** | Tee sheet + POS | Custom (free trial) | $500–$1,500/mo estimated | Mid-market golf |
| **Lightspeed Golf (Chronogolf)** | Tee sheet + POS | Custom | $400–$1,200/mo estimated | Public + private golf |
| **Northstar Technologies** | Full stack | Custom | ~$2,000–$6,000/mo | Mid-large private clubs |
| **Clubessential** | Full stack | Custom, "pay as you go" OR flat | **$3,000–$10,000/mo** per G2/Capterra reviews | Large private clubs |
| **Jonas Club Software** | Full stack | Custom | **$4,000–$15,000/mo** + modules | Mid-large private clubs, enterprise |
| **ForeTees** | Tee sheet | Custom, $1K setup | $500–$2,000/mo estimated | Private golf |

**Key observation:** every incumbent except ClubExpress hides their price. That's a deliberate moat — it forces every prospect into a 30-minute sales call and anchors expectations at "this is going to be thousands per month". Swoop can **use that to its advantage**: publishing a clean number on the website ($1,500/mo) makes Swoop feel refreshingly transparent and **dramatically reduces friction** compared to every incumbent's opaque quote process.

**Important positioning insight:** Swoop is **not** a replacement for Jonas/Clubessential/ForeTees. It's a **layer on top**. The GM already has Jonas. Swoop adds cross-domain AI insights their existing stack can't produce. That means Swoop is **additive spend**, not replacement spend — which is a harder sell per-dollar but a much faster land because it doesn't require ripping out any system.

### 1.3 Private club technology budget context

- Mid-size private club (500 members) operates on **$2.5M–$8.5M annual opex** [^finmodel]
- Technology typically runs **1–2% of opex → $25K–$170K annual tech budget**
- A $18K annual line item is **0.2–0.7% of opex** — well inside "approve without a board vote" territory for most GMs
- For context: a single 55-gallon drum of Primo Cart Path paint costs $800. A single sprinkler head replacement runs $400. $1,500/mo is the cost of one slow Tuesday's lost F&B revenue.

### 1.4 Retention math — the ROI anchor

- Private clubs run **92–94% annual retention**, meaning **6–8% annual churn** [^retention]
- Average **golf club dues = $7,800/year**; higher-end clubs exceed $10K/year
- A 500-member club × $7,800 = **$3.9M annual dues revenue**
- 8% churn = **$312K/year in dues walking out the door**
- **Saving just 2 members/year ≈ $15,600** — slightly more than Swoop's entire annual subscription

**The close slide:** "Swoop pays for itself if it saves you 2.3 members per year. Our agents flag at-risk members 30-60 days earlier than your current process, so every save above 2 is pure margin." This is the only number a GM has to remember. Under-promise, over-deliver.

### 1.5 Pilot conversion benchmarks

B2B SaaS free trial conversion by structure [^userpilot]:

| Trial type | Avg conversion | Note |
|---|---|---|
| Opt-in (credit card required) | 14–25% | Industry average |
| **Opt-out (auto-convert)** | **~48%** | **Nearly 4× better — this is the big lever** |
| Opt-in, "good" threshold | 30%+ | Only top-decile B2B products |

**Conclusion:** an opt-out pilot where a credit card is required up-front but not charged until day 91 converts meaningfully better than a friction-free opt-in trial. For Swoop's first 5 clubs, consider a **"no credit card required during pilot, 30-day opt-out window at day 60"** variant — gives founding clubs a no-risk entry while still biasing toward conversion.

---

## Part 2 — The SKU

### Tiers

#### **Core — $1,500/mo**
*Everything Swoop does today.*

- Full CSV import pipeline (21 dataset types)
- 19-card Today view with headline insights per dataset
- 7 deep widgets: settlement mix, AR aging, course utilization, tier revenue, household composition, service tickets, member engagement timeline
- 8 AI agents calling real Anthropic API, producing live recommendations
- Auto-fire on import — upload a file, see agent recommendations within 30 seconds
- Imported Data Catalog with per-dataset row counts and sample peeks
- Unlimited GM + assistant GM seats
- Email support (best effort, 48h response)
- **No per-member charge. No module add-ons. No "enterprise tier" upsell.**

#### **Founding Member — $750/mo (50% off Core, locked for 24 months)**
*First 5 clubs only.*

- Everything in Core
- Price locked at $750/mo for 24 months from signature date
- Logo rights on the Swoop website as a launch partner
- Direct Slack/email to founder for feature requests
- Early access to new agents before general release
- At month 24, auto-transitions to then-current Core pricing (with 60 days notice)
- **Goal:** 5 clubs closed in 45 days. Total ARR from these 5 = $45K/yr for 24 months = $90K in contracted revenue + 5 logos + 5 case studies.

#### **Pro — $2,500/mo** *(roadmap, don't sell yet)*
*Reserved for when you have CSM capacity.*

- Everything in Core
- Dedicated customer success manager
- Quarterly business review (on-site or video) with ROI report
- Priority agent prompt tuning for club-specific language/brand
- Custom import connectors for 1 non-Jonas legacy system
- **Don't build this tier until you have a full-time CSM. Until then, Pro-buyers get Core pricing and you over-deliver by hand.**

### Why flat, not per-member

- **Boards hate per-seat math.** Per-member pricing makes the line item scale with club growth — GMs view that as a tax on success and fight it annually. Flat pricing creates no friction on renewal.
- **Your cost structure is largely fixed per tenant.** Anthropic API costs scale weakly with member count (8 agents × 1 call each per day regardless of whether the club has 300 or 1,200 members). A 1,200-member club doesn't cost you 4× what a 300-member club does — maybe 1.3×. Flat pricing captures that margin.
- **Simplifies procurement.** "$1,500/mo" is a sentence. "$3/member/month with a minimum of $450" is a negotiation.
- **ClubExpress is the only competitor doing per-member and they're the lowest-priced** — associating with their tier implicitly devalues Swoop. Don't anchor there.

### Why $1,500 specifically

- **Below the board-approval threshold.** Most GM signing authority is $2,000–$5,000/mo. $1,500 clears that bar with headroom, so a single email to the club president usually closes it without a board vote.
- **Above "toy software."** $500/mo signals a feature; $1,500/mo signals a platform. Private club GMs pattern-match software confidence to price.
- **$18K/yr = one saved member.** The simplest ROI story in the industry. If you can't save one $7,800–$18,000 member per year, Swoop isn't worth it — and that's a credible promise.
- **Anchors 3× below Jonas/Clubessential.** When a GM asks "how much?" and you say "$1,500/mo" after they just quoted Jonas at $5,000+, you're instantly "the affordable answer" without being "the cheap option."

---

## Part 3 — The pilot

### Structure

**90-day free pilot, opt-out auto-convert, no credit card required** (for the first 5 Founding Member clubs).

### Timeline

| Day | What happens |
|---|---|
| **Day 0** | GM signs cover page. You import first 2 files (members + tee sheet) during the call. They see stage-insights light up for the first time. |
| **Day 0–7** | GM uploads remaining files at their own pace. Each upload auto-fires the agents. You send a daily digest email: "Here's what the agents found today." |
| **Day 14** | First check-in call. Walk through Member Pulse at-risk list. **Show which members they would have lost.** |
| **Day 30** | 30-day report: total actions surfaced, dollar impact, members flagged, agent recommendations approved. Email to GM + club president. |
| **Day 60** | 30-day-to-decision email: "Pilot converts to paid Founding Member ($750/mo) on day 91 unless you reply NO. Here's the 60-day ROI report." Second check-in call. |
| **Day 75** | **Last chance to opt-out.** Send the cancellation link one more time. (High opt-out friction after this point is unethical; make it one click.) |
| **Day 91** | Auto-convert to $750/mo. First invoice issued. |

### Exit ramps (always visible, always one click)

1. **Cancel anytime during pilot** — zero questions, data export sent within 24h, account deleted within 7 days.
2. **Cancel during first paid month** — pro-rated refund for unused days.
3. **Cancel anytime thereafter** — month-to-month, no notice required beyond end of current month.

**Why all three matter:** "cancel anytime" is the single most powerful objection-crusher in B2B SaaS sales to risk-averse buyers. Private club GMs are the most risk-averse buyer segment in existence. Lean into it.

### What NOT to do during the pilot

- ❌ **Don't require a PO, purchase order, or finance review to start.** That adds 4–8 weeks and kills pilots before they begin.
- ❌ **Don't gate features behind a "talk to sales" wall.** The product speaks for itself — let the GM click every button.
- ❌ **Don't over-email.** One weekly digest, one 14-day call, one 30-day report, one 60-day decision email, one 75-day reminder. Six touches total.
- ❌ **Don't pitch "Pro" during the pilot.** Core is the SKU for the first 5 clubs. Period.
- ❌ **Don't offer free extensions.** If a club asks for +30 days, the answer is "yes for $375 — half a month's subscription." Signals value.

---

## Part 4 — The one-page contract

The contract goes in a separate file so you can print, sign, and send without editing the GTM document every time. See:

**📄 `docs/contracts/PILOT_AGREEMENT_TEMPLATE.md`**

It's built on the **Common Paper Cloud Service Agreement 2.0** (CC-BY licensed, free, created by a committee of dozens of SaaS lawyers) [^commonpaper]. The full 30-page legal terms are incorporated by reference to Common Paper's public document at `commonpaper.com/standards/cloud-service-agreement/` — **you never maintain that document**, it's maintained by a standards body. Your cover page is all you sign, all you send, and all the GM reads.

**Why Common Paper CSA vs a custom MSA:**

1. **Free and CC-licensed.** No lawyer fees for the template itself.
2. **Specifically scoped to SaaS** (unlike MSAs which try to cover everything). A CSA covers exactly the issues a SaaS contract needs: data usage, uptime, fees, termination, indemnification.
3. **Plain-language.** The standard terms are designed to be read by non-lawyers, which matters because a club GM's first instinct is to forward legal docs to their club president (who is often a retired lawyer).
4. **Industry-standard.** Stripe, Gusto, and hundreds of other SaaS companies use Common Paper. No GM-side lawyer will have an issue with it because they've seen it before.
5. **One page to sign.** The GM signs the cover page. The 30 pages of legal are a URL reference they never have to read.

---

## Part 5 — Objection handling cheat sheet

Top 10 objections a private club GM will raise in the first pilot call, and the one-sentence response to each.

| Objection | Response |
|---|---|
| **"We already have Jonas/Clubessential/ForeTees."** | "Perfect — Swoop sits on top of Jonas. We never ask you to replace it. We take your existing exports and add an intelligence layer Jonas can't give you." |
| **"Our board would have to approve a new vendor."** | "$1,500/mo is below most GM signing thresholds. If your board has to approve it, we'll happily wait until after your pilot converts — the 90-day pilot is free, so you're not committing them to anything." |
| **"I don't want to send my member list to a startup."** | "Data stays in US Neon and Vercel. You can export and delete everything with one click at any time. Here's our 1-page data handling sheet." *(Have this ready — even if it's scrappy.)* |
| **"AI hallucinates. I don't trust it."** | "Every agent recommendation cites the exact members and numbers it's based on. If it's wrong, it's wrong on data from the file *you* uploaded — we don't generate anything we can't trace back to a row." |
| **"How is this different from MetricsFirst / Clubessential Analytics?"** | "MetricsFirst gives you dashboards on data that's already in Jonas. Swoop joins data across Jonas, your POS, your tee sheet, and your complaint log — then recommends actions. Different category. Happy to show you the 3-view demo."
| **"We did a pilot with [other vendor] and it didn't go anywhere."** | "Most vendor pilots fail for two reasons: the product doesn't work end-to-end on day 1, or onboarding takes months. We import your data in the first 20 minutes of the pilot call and you see real insights the same session. Worst case, you waste 20 minutes." |
| **"How do I measure success?"** | "Three numbers: how many at-risk members Swoop flagged, how many of those you successfully retained, and the dues dollars saved. We send you that report every 30 days of the pilot." |
| **"Is this GDPR/CCPA compliant?"** | "Yes — data is stored in US regions, we have DPAs on request, and members can be exported or deleted on request within 7 days. The Common Paper CSA includes standard data-subject rights." |
| **"What if you go out of business?"** | "Your data is yours. We'll export everything on 24 hours notice in CSV or JSON. The contract includes a source escrow clause on request — that's a $0 add-on." |
| **"Can we get a discount?"** | "The first 5 clubs get Founding Member pricing at $750/mo locked for 24 months. You'd be #[N]. That's the only discount — after the first 5, Core is $1,500/mo." |

---

## Part 6 — Outreach to Founding Members

### The 3-sentence email

> **Subject:** 90-day free Swoop pilot — 5 founding clubs only
>
> We built an AI intelligence layer that sits on top of your Jonas and ForeTees data and flags at-risk members 30–60 days earlier than your current process. First 5 private clubs to sign up get 90 days free, no credit card, then 50% off locked for 2 years — hoping yours is one of them. 20-minute demo: [Calendly link].

That's it. Don't attach a deck. Don't CC a sales person. Don't pretend you're a team of 20. **You're the founder, you built the product, and you're personally offering free to 5 clubs for the first 2 months.** That's the story.

### Target list

Target GMs at clubs where the board has publicly mentioned member retention in the last 12 months. Search vectors:
- "[Club name] board minutes retention" site:.org (many clubs publish minutes)
- LinkedIn "GM, Country Club" + "member retention" in recent posts
- CMAA member directory (requires membership but worth joining — $500 annual)
- Private Club Marketing readers — subscribe to their newsletter, reply to their retention articles with "we've built something you might find interesting"

### What good looks like after 45 days

- **3+ Founding Members signed** → $2,250/mo MRR committed, 3 logos, 3 case studies starting
- **2 more pilots in progress** → closing pipeline through day 90
- **20+ GMs demoed** → top of funnel proof the positioning resonates
- **1 customer testimonial** → even a sentence from a real GM is gold

If you're below those numbers at day 45, the problem is either the product demo (not the pricing) or the outreach volume (not the ICP). Almost never the pricing.

---

## Part 7 — What to NOT do

- **Don't build self-serve signup until you have 5 paid customers.** Manual onboarding is a feature during the first 10 customers — you learn more from every session than any analytics dashboard would tell you.
- **Don't build a billing system.** Stripe invoice links with Net 30 are enough for the first 20 customers. You can add Stripe subscriptions when you have 10+ paying clubs.
- **Don't build a sales team.** The founder closes the first 20 customers personally. A SaaS startup that hires a salesperson before hitting $500K ARR almost never recovers from the CAC hit.
- **Don't price-test until you have 10 clubs on the current tier.** Three data points isn't enough signal to know whether $1,500 is right. Ten is.
- **Don't add a cheaper "Lite" tier when someone pushes back.** Push back instead: "The pilot is free for 90 days — if the product isn't worth $1,500/mo to you after 90 days of free use, then it isn't right for your club. But I'd be surprised."

---

[^cmaa]: Source: [CMAA 2023 Economic Impact Report Executive Summary](https://www.cmaa.org/media/01hnzs2i/economic-impact-report_executive-summary.pdf) and [CMAA Economic Impact Report Full PDF](https://www.cmaa.org/media/pnbkmnmv/2023-economic-impact-report-111524_rs.pdf)

[^finmodel]: Source: [Country Club Running Costs, FinancialModelsLab](https://financialmodelslab.com/blogs/operating-costs/country-club)

[^retention]: Sources: [Private Club Marketing — Member Retention](https://privateclubmarketing.com/member-retention-10-tips/) and [Private Club Marketing — How to Calculate Attrition](https://privateclubmarketing.com/how-to-calculate-membership-attrition-for-private-members-clubs/)

[^userpilot]: Source: [Userpilot — SaaS Average Free Trial Conversion Rate Benchmarks](https://userpilot.com/blog/saas-average-conversion-rate/)

[^commonpaper]: Source: [Common Paper — Cloud Service Agreement](https://commonpaper.com/standards/cloud-service-agreement/) · Licensed under CC BY 4.0

### Additional research sources

- ClubExpress pricing (public): [clubexpress.com/pricing](https://www.clubexpress.com/pricing)
- Jonas Club Software pricing (Capterra): [capterra.com/p/124932/Jonas-Club-Management](https://www.capterra.com/p/124932/Jonas-Club-Management/)
- Clubessential pricing (Capterra): [capterra.com/p/151992/Clubessential](https://www.capterra.com/p/151992/Clubessential/)
- Club Caddie pricing (Capterra): [capterra.com/p/186896/Club-Caddie](https://www.capterra.com/p/186896/Club-Caddie/)
- Northstar pricing (Capterra): [capterra.com/p/87109/Northstar-Club-Management](https://www.capterra.com/p/87109/Northstar-Club-Management/)

*Last updated: 2026-04-13*
