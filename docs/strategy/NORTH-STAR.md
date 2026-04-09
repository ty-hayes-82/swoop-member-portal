# Swoop Golf — North Star Strategy

> **Last updated:** April 8, 2026
> **Status:** Ratified — this document governs all development priorities

---

## The One Sentence

**Swoop is the cross-domain intelligence layer that lets club operators See It, Fix It, and Prove It — turning scattered club data into decisions that save members and recover revenue.**

---

## The Three Core Pillars

Every feature, every sprint, every design decision must answer at least one of these three questions. If it doesn't clearly serve one of these pillars, it is secondary work.

### Pillar 1: SEE IT — Operational Visibility

> "220 rounds booked, 3 at-risk members on the tee sheet, 2 servers short for projected dining demand. No single system told him any of this."

**The question this answers:** Can the GM see what's actually happening across all their systems in one place, right now?

**What this means in practice:**
- The Today View is the product's front door. It must synthesize tee sheet, weather, member health, staffing, and dining data into one morning briefing.
- Cross-domain synthesis is the hero — not any single metric. The value is in the connections between systems that no single vendor can produce.
- Source system transparency (badges showing where each data point came from) is non-negotiable. "How do you know this?" must always be answered automatically.

**The bar:** A Director of Golf opens Swoop at 7:15 AM on a Saturday and knows everything he needs to know before his first cup of coffee. Four systems replaced by one screen.

---

### Pillar 2: FIX IT — Proactive Action

> "The CRM says she's an active member. The tee sheet says she booked today. Only the composite health score reveals that she's pulling away."

**The question this answers:** Can the GM act on what Swoop reveals before problems escalate — before the resignation letter, before the bad Saturday, before the board meeting goes sideways?

**What this means in practice:**
- The composite member health score is the core analytical engine. It must draw on email engagement, golf frequency, dining visits, and event attendance to detect decay patterns no single system can see.
- The "first domino" insight — seeing that email drops precede golf drops, which precede dining drops — is Swoop's unique analytical contribution.
- Recommended actions (call a member, add a server, deploy a ranger) must be surfaced with one-tap approval. Human in the loop. Always.
- 3 out of 4 club operators want full manual control. Auto-execution is OFF by default. Swoop recommends. The GM decides.

**The bar:** A GM catches a $32K/year member's disengagement in the first week of decay, not when the resignation letter lands.

---

### Pillar 3: PROVE IT — Revenue Attribution & Dollar Quantification

> "$9,580 per month in F&B revenue lost to operational failures he didn't know existed."

**The question this answers:** Can the GM walk into a board meeting with exact dollar figures, specific root causes, and a concrete remediation plan — backed by data from across every system?

**What this means in practice:**
- Revenue leakage decomposition must connect pace of play (tee sheet) to dining conversion (POS) to staffing gaps (scheduling). This is the Layer 3 insight no single vendor can produce.
- Every insight must carry a dollar value. "$31 per slow round" is the kind of proprietary cross-domain intelligence that justifies the platform.
- Scenario modeling (sliders showing "if we reduce slow rounds by 20%, we recover $X/month") turns insights into board-ready proposals.
- The Board Report — auto-generated, 4-tab, source-attributed — must replace the 6-hour manual report-pulling process.

**The bar:** A GM presents the board with a dollar-quantified remediation plan. Budget approved in 20 minutes instead of 45 because every number has a source.

---

## The Priority Filter

When evaluating any feature, bug fix, or design decision, apply this filter:

```
1. Does it directly serve See It, Fix It, or Prove It?
   → YES: This is core work. Prioritize it.
   → NO: Go to step 2.

2. Does it enable or unblock a core pillar?
   → YES: This is supporting work. Schedule it, but not above core work.
   → NO: Go to step 3.

3. Is it nice-to-have, polish, or exploratory?
   → It plays second fiddle. Backlog it. Do not let it compete with pillar work.
```

---

## The Layer 3 Differentiator

This is the competitive moat. Repeat it until it's muscle memory:

- **Layer 1** = Systems of Record (Jonas, ForeTees, Northstar). They store data.
- **Layer 2** = Single-domain analytics (Jonas MetricsFirst). They report within one silo.
- **Layer 3** = Cross-domain intelligence (Swoop). We connect the dots between systems and produce insights that are impossible within any single vendor's ecosystem.

Jonas sees tee times. Northstar sees POS. Swoop sees the $9,580/month they're losing together. That's the difference between a system of record and a system of intelligence.

---

## What Swoop Is NOT

- Swoop is not a tee sheet. We don't replace Jonas or ForeTees.
- Swoop is not a POS. We don't replace Northstar or Square.
- Swoop is not a CRM. We don't replace the club's member database.
- Swoop is not an automation platform that acts without human approval.
- Swoop is the intelligence layer that sits above all of them and makes the connections they can't.

---

## The Three Demo Stories as Product Tests

These three stories from the pilot storyboard are not just sales narratives — they are acceptance tests for the product. If Swoop can't deliver these experiences live, the product isn't ready.

| Story | Pillar | Product Test |
|---|---|---|
| **The Saturday Morning Briefing** | See It + Fix It | Today View synthesizes 4 data sources into one actionable briefing with staffing recs and at-risk alerts |
| **The Quiet Resignation Catch** | See It + Fix It | Health score detects multi-domain decay, surfaces first-domino insight, recommends action with one-tap approval |
| **The Revenue Leakage Discovery** | See It + Prove It | Revenue view decomposes $9,580/mo leakage to root causes, scenario slider models recovery, Board Report generates in one click |

---

## Guiding Principles

1. **Cross-domain or it's not Swoop.** If a feature can be built with data from a single system, ask why we're building it instead of that vendor.
2. **Dollar-quantified or it's not actionable.** Every insight should carry a revenue impact. "At-risk member" is good. "$32K/year in dues at risk" is Swoop.
3. **Human in the loop. Always.** Recommend, don't execute. The GM stays in control.
4. **Show your sources.** Every data point must trace back to its source system. Trust is built through transparency.
5. **One screen, not four logins.** Consolidation is the UX principle. If the GM has to leave Swoop to understand the insight, we failed.
