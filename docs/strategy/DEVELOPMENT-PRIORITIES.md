# Swoop Golf — Development Priorities Guide

> **Last updated:** April 8, 2026
> **Governed by:** [NORTH-STAR.md](./NORTH-STAR.md)

---

## How to Use This Document

Before starting any feature, bug fix, or design work, check it against this guide. The three pillars are not suggestions — they are the filter through which every development decision passes.

---

## Pillar-to-Feature Map

### PILLAR 1: SEE IT — Operational Visibility

| Feature Area | Core / Supporting | What It Must Do |
|---|---|---|
| **Today View** | CORE | Synthesize tee sheet + weather + member health + staffing + dining into one morning briefing |
| **Morning Briefing Banner** | CORE | Show rounds booked, weather, at-risk count, staffing gaps — in one glance |
| **Cross-Domain Alerts** | CORE | Surface status changes (Healthy → At-Risk) that no single system would flag |
| **Source System Badges** | CORE | Every data point shows its origin: [Tee Sheet] [POS] [Email] [CRM] |
| Data import pipelines | Supporting | Must feed the Today View with fresh, reliable data from all source systems |
| Weather integration | Supporting | Enables staffing and demand projections |
| Tee sheet sync | Supporting | Feeds round counts, pace of play, member tee times |

### PILLAR 2: FIX IT — Proactive Action

| Feature Area | Core / Supporting | What It Must Do |
|---|---|---|
| **Composite Health Score** | CORE | Multi-domain score drawing on email + golf + dining + events. Detect decay before any single system would flag it |
| **Decay Sequence / First Domino** | CORE | Visualize the order of disengagement: email → golf → dining. Show when the first domino fell |
| **Action Queue** | CORE | Surface recommended actions (call member, add server, deploy ranger) with one-tap approve |
| **Member Profile (Cross-Domain)** | CORE | Full engagement picture across all domains with source badges and trend lines |
| Playbooks / Automations | Supporting | Pre-built response templates for common situations (welcome-back, staffing adjust) |
| Action completion logging | Supporting | GM marks actions complete, logs notes. Feeds back into health score |
| Notification system | Supporting | Alert the GM to status changes. Must not auto-execute |

### PILLAR 3: PROVE IT — Revenue Attribution

| Feature Area | Core / Supporting | What It Must Do |
|---|---|---|
| **Revenue Leakage Decomposition** | CORE | Break F&B losses into root causes: pace-to-dining, understaffing, weather no-shows. Dollar values on every line |
| **$31/Slow Round Insight** | CORE | The proprietary cross-domain metric: pace of play → dining conversion → dollar gap |
| **Scenario Slider** | CORE | "If we reduce slow rounds by X%, we recover $Y/month." Interactive, real-time |
| **Board Report Generator** | CORE | One-click, 4-tab report: Summary, Member Saves, Operational Saves, What We Learned |
| Benchmarking | Supporting | Compare club metrics to industry averages. Adds context to board presentations |
| Historical trending | Supporting | Show improvement over time. Proves ROI of Swoop itself |
| Export / PDF | Supporting | Board members need printable/shareable output |

---

## Priority Tiers

### Tier 1 — Core Pillar Work (Always First)

Work that directly delivers a See It, Fix It, or Prove It capability. This is never deprioritized in favor of Tier 2 or Tier 3 work.

Examples:
- Building the Today View morning briefing
- Implementing the composite health score
- Building the revenue leakage decomposition
- Adding source system badges to every insight
- Building the action queue with one-tap approval

### Tier 2 — Enabling Work (Scheduled, Never Above Tier 1)

Work that unblocks or improves a core pillar but isn't user-facing pillar delivery itself.

Examples:
- Data import pipeline improvements
- API integrations with source systems (Jonas, ForeTees, etc.)
- Database schema work to support cross-domain queries
- Performance optimization on cross-domain calculations
- Authentication and multi-tenancy infrastructure

### Tier 3 — Second Fiddle (Backlog)

Everything else. This includes work that is genuinely useful but does not directly serve the three core questions.

Examples:
- UI polish and visual refinement (unless it blocks a Tier 1 demo)
- Admin panels and settings pages
- Nice-to-have analytics that don't cross domain boundaries
- Marketing site features
- Developer tooling improvements

**Rule:** Tier 3 work should never displace Tier 1 work in a sprint. If a sprint has leftover capacity after Tier 1 and Tier 2 commitments, Tier 3 can fill it.

---

## The Decision Checklist

Use this for every feature request, bug priority, or design decision:

```
[ ] Which pillar does this serve? (See It / Fix It / Prove It)
[ ] Does it require cross-domain data? (If no, ask: why us and not the source vendor?)
[ ] Does it carry a dollar value or connect to one? (If no, can we add one?)
[ ] Does the GM stay in control? (No auto-execution without approval)
[ ] Does it show its sources? (Source system badges on every data point)
[ ] Does it move us closer to delivering one of the three demo stories live?
```

---

## The Three Demo Stories as Sprint Acceptance Tests

These are not just sales demos. They are the product acceptance criteria.

### Story 1: The Saturday Morning Briefing
**Sprint test:** Can a user open the Today View and see rounds booked, weather, at-risk members on today's tee sheet, and staffing gap — all synthesized from different source systems — in one screen? Can they approve recommended actions with one tap?

### Story 2: The Quiet Resignation Catch
**Sprint test:** Can a user see a member's status change from Healthy to At-Risk? Can they click into the member profile and see the decay sequence across email, golf, dining, and events? Can they approve a recommended outreach action?

### Story 3: The Revenue Leakage Discovery
**Sprint test:** Can a user open the Revenue view, see a dollar-quantified breakdown of F&B leakage by root cause, use the scenario slider to model recovery, and generate a Board Report in one click?

---

## What "Done" Looks Like for Each Pillar

### See It is done when:
- The Today View is the first thing a GM sees and it answers "what do I need to know right now?" with cross-domain data
- Every data point carries a source system badge
- The GM doesn't need to open any other system to understand their morning

### Fix It is done when:
- The health score catches decay patterns weeks before resignation
- The first-domino visualization shows the order of disengagement
- The action queue surfaces recommendations with one-tap approval
- The GM can act in under 30 seconds from insight to action

### Prove It is done when:
- Revenue leakage is decomposed to specific root causes with dollar values
- The scenario slider models recovery in real-time
- The Board Report generates in one click with 4 tabs
- Every number in the report traces back to a source system
