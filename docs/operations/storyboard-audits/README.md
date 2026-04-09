# Storyboard Audits

> **Owner:** General Manager (Product & Ops). Run by the GM agent under the §10b standing assignment in [`../PRODUCT-FINALIZATION.md`](../PRODUCT-FINALIZATION.md).
> **Cadence:** at least once per Friday release-readiness review (§4 of PRODUCT-FINALIZATION) and always before any new pilot demo.
> **Created 2026-04-09** as part of the F1 autonomous sweep (criterion 10 standing input).

This directory holds the **historical record** of storyboard fidelity audits — the standing GM assignment that compares the live app against the canonical demo storyboard at [`../../swoop_demo_storyboard.html`](../../swoop_demo_storyboard.html) (and [`../../swoop_demo_storyboard.md`](../../swoop_demo_storyboard.md)).

The storyboard is not just sales narrative — per [`../../strategy/NORTH-STAR.md`](../../strategy/NORTH-STAR.md) §"The Three Demo Stories as Product Tests", **it is the acceptance test for the product**. If the live app cannot deliver any of the 3 storyboard moments end-to-end, the product is not ready for a paying pilot.

---

## File naming convention

Each audit produces **two** files per cadence run:

```
YYYY-MM-DD-fidelity.md     ← Part A (path fidelity scoring)
YYYY-MM-DD-demo-data.md    ← Part B (dramatic-effect data audit)
```

The date is the date of the audit, not the date of the next release. If two audits run on the same day, append `-am` / `-pm` or `-1` / `-2`.

---

## Part A — Path fidelity (`*-fidelity.md`)

Walks the 3 storyboard paths on the live dev preview and scores each 1–5 against the rubric defined in [`../PRODUCT-FINALIZATION.md`](../PRODUCT-FINALIZATION.md) §10b Part A.

**Required structure:**

```markdown
# Storyboard Fidelity Audit — YYYY-MM-DD

**Auditor:** <GM agent name or human GM>
**Live preview URL:** https://swoop-member-portal-dev.vercel.app
**Latest commit at audit time:** <SHA>
**Build:** <vitest pass count, smoke gate result>

---

## Story 1 — The Saturday Morning Briefing

**Storyboard moment:** <one-line summary>
**Time-to-insight observed:** <seconds>
**Source-badge coverage:** <fraction>
**"Feels off" log:**
- <bullet 1>
- <bullet 2>

**Score:** <1-5> / <rubric label>
**Justification:** <evidence with file:line citations>
**Recommended fixes:** <bulleted list>

## Story 2 — The Quiet Resignation Catch
... (same structure)

## Story 3 — The Revenue Leakage Discovery
... (same structure)

---

## Summary

| Story | Score | Time-to-insight | Verdict |
|---|---|---|---|
| 1 — Saturday Briefing | | | |
| 2 — Quiet Resignation | | | |
| 3 — Revenue Leakage | | | |

**Criterion 10 verdict:** <go / hold / fix>
**Sign-off rule reminder:** all 3 paths must score ≥ 4 for criterion 10 to flip green.
```

---

## Part B — Demo data dramatic-effect audit (`*-demo-data.md`)

Inventories every dollar literal, member count, and rate in the canonical demo seed files; proposes dramatic-but-realistic alternatives per the believe-it / care-about-it framework in §10b Part B.

**Required structure:**

```markdown
# Demo Data Dramatic-Effect Audit — YYYY-MM-DD

**Auditor:** <GM agent name or human GM>
**Scope:** <list of seed files audited>
**Total candidate values inventoried:** <count>

---

## Per-file inventories

### src/data/boardReport.js
**Current values:**
| Field | Current value | File:line |
|---|---|---|
| ... | ... | ... |

**Proposed bumps:**
| Field | Current → Proposed | Storyboard moment improved | Risk |
|---|---|---|---|
| ... | ... | ... | ... |

### src/data/pace.js
... (same structure)

### src/services/briefingService.js
... etc.

---

## Top 5 highest-leverage proposed bumps

1. <change> — improves <story> — risk: <level>
2. ...
3. ...
4. ...
5. ...

## "Apply now" recommended diffs

For the 3-5 changes the GM is confident about, write the literal git diff
that should be applied to the seed files. A follow-up agent can dispatch
these as a single commit.

```diff
--- a/src/services/revenueService.js
+++ b/src/services/revenueService.js
@@ ...
- PACE_LOSS: 5760,
+ PACE_LOSS: 8400,
```

## "Hold for design discussion"

Changes that need human alignment before applying.

## Cross-file reconciliation work

If you bump a value in one file, list every other file that holds the
same canonical value and must be updated together to keep numbers
consistent across surfaces (Today briefing, Admin Hub, storyboard HTML,
etc.). Storyboard divergence is a footgun.

## Risk flags

Any number that should NOT be touched, with reasoning.
```

---

## Cross-references

- [`../PRODUCT-FINALIZATION.md`](../PRODUCT-FINALIZATION.md) §10b — the standing assignment that creates these audits
- [`../../swoop_demo_storyboard.html`](../../swoop_demo_storyboard.html) — canonical storyboard (acceptance test)
- [`../../strategy/NORTH-STAR.md`](../../strategy/NORTH-STAR.md) — the 3 pillars that govern the audit's scoring
- [`../../strategy/NORTH-STAR-AUDIT.md`](../../strategy/NORTH-STAR-AUDIT.md) — the per-page pillar score audit (sister document, run quarterly)

---

## Why this directory exists

Most demo-data refactor PRs are one-and-done: someone bumps a literal because it "felt low," and three weeks later nobody remembers why. This directory makes the **rationale** persistent. Every future "should we change $9,580 → $14,800?" question can be answered by reading the most recent `*-demo-data.md` audit and seeing what the GM agent already considered.

The same applies to storyboard fidelity. If a feature ships that visibly breaks Story 2's decay chain, the next `*-fidelity.md` will catch it within a week. The audits are the **product's mirror** — the one the GM looks into before saying "yes, we can show this to a paying club."
