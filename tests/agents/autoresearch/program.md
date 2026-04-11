# autoresearch for swoop agents

Autonomous optimization of AI concierge + club agents for a private golf club member portal. Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch) and [hwchase17/autoresearch-agents](https://github.com/hwchase17/autoresearch-agents).

## Setup

To set up a new experiment, work with the user to:

1. **Agree on a run tag**: propose a tag based on today's date (e.g. `apr11`). The branch `autoresearch/<tag>` must not already exist.
2. **Create the branch**: `git checkout -b autoresearch/<tag>` from current branch.
3. **Read the in-scope files**: The project is small. Read these files for full context:
   - `agent.js` — the file you modify. Contains concierge prompt, club agent prompts, and model config.
   - `run_eval.js` — evaluation harness (FIXED, do not modify). Runs 10 scenarios through concierge + club agents + critic.
   - `dataset.json` — 10 test scenarios (FIXED, do not modify). 3 members, diverse interactions.
4. **Verify setup**: Check that `ANTHROPIC_API_KEY` is set in `.env.local`.
5. **Run the baseline**: `node tests/agents/autoresearch/run_eval.js > eval.log 2>&1`
6. **Initialize results.tsv**: Create `results.tsv` with header row and the baseline entry.
7. **Confirm and go**: Confirm setup looks good.

## Project context

This is a golf club member portal with 8 AI agents:
- **Member Concierge** — personal AI assistant for members (books tee times, dining, events, files complaints)
- **5 Club Agents** — internal agents (staffing-demand, service-recovery, member-risk, game-plan, fb-intelligence)

The concierge texts like a friend who works at the club. It must:
- Lead with empathy on complaints (FIRST WORD = member's name)
- Cross-sell after every booking (suggest dining after golf, etc.)
- Never reveal health scores, risk tiers, or internal analytics
- Handle grief/loss with sensitivity (no bookings, acknowledge by name)
- Use casual, warm language (no markdown, no bullet points)

Club agents must produce structured, dollar-quantified insights connecting multiple data domains.

## Evaluation

Each eval run tests 10 scenarios across 3 members:
- **James Whitfield** — high-value ($18.5K), at-risk (health 44), Full Golf. Tests: booking, complaint, corporate dinner, re-engagement.
- **Anne Jordan** — Weekend Warrior ($12K), health 28. Tests: booking, pace complaint, health cancellation.
- **Sandra Chen** — Social ($9K), health 36, family. Tests: events, RSVP, grief re-engagement.

Each scenario is scored by a Claude critic on 5 dimensions (1-10):
- **NATURAL** — sounds like a friend texting, not corporate
- **HELPFUL** — actually did something useful, called tools
- **ACCURATE** — correct tool calls, dates, details
- **PROACTIVE** — anticipated unasked needs, cross-sold
- **CLUB_IMPACT** — club agents produced actionable, dollar-quantified insights

**The goal: maximize `overall_score` (average of all 5 dimensions across all 10 scenarios). Target: 9.5+**

## Output format

The eval prints:

```
---
avg_natural: 8.900000
avg_helpful: 8.800000
avg_accurate: 9.100000
avg_proactive: 8.400000
avg_club_impact: 9.000000
overall_score: 8.840000
num_examples: 10
num_errors: 0
num_perfect: 1
```

Extract the key metric: `grep "^overall_score:" eval.log`

## Logging results

Log every experiment to `results.tsv` (tab-separated):

```
commit	overall_score	natural	helpful	accurate	proactive	club_impact	status	description
```

1. git commit hash (short, 7 chars)
2. overall_score (e.g. 8.840000) — use 0.000000 for crashes
3-7. dimension averages
8. status: `keep`, `discard`, or `crash`
9. short description of what this experiment tried

## The experiment loop

LOOP FOREVER:

1. Look at the current results in `results.tsv`
2. Think about what to try next. Consider:
   - **Prompt engineering**: More specific complaint handling, better cross-sell instructions, grief sensitivity
   - **Proactive rules**: Add specific cross-sell triggers for each scenario type
   - **Model selection**: Try switching concierge or club agents between Opus and Sonnet
   - **Structure changes**: Reorder prompt sections, add/remove rules, change emphasis
   - **Club agent formatting**: Tighter output templates, more specific dollar quantification
   - **Negative examples**: Add more BAD/GOOD examples to prevent common failures
   - **Simplification**: Remove rules that aren't helping, reduce prompt length
3. Edit `agent.js` with your experimental idea
4. `git commit -am "description of change"`
5. Run: `node tests/agents/autoresearch/run_eval.js > eval.log 2>&1`
6. Read results: `grep "^overall_score:\|^avg_" eval.log`
7. If grep output is empty, the run crashed. Run `tail -n 50 eval.log` to debug.
8. Record results in `results.tsv`
9. If overall_score improved → keep the commit
10. If overall_score is equal or worse → `git reset --hard HEAD~1` (discard)

## What you CAN do
- Modify `agent.js` — this is the only file you edit. Everything is fair game: prompts, model choice, structure, rules.

## What you CANNOT do
- Modify `run_eval.js` — it is fixed. It contains the eval harness and critic.
- Modify `dataset.json` — it is fixed. It contains the test scenarios.
- Install new packages.

## Simplicity criterion

All else equal, simpler is better. A 0.01 improvement that adds 30 lines of hacky prompt is not worth it. A 0.01 improvement from simplifying the prompt? Definitely keep. Removing something and getting equal or better results is a great outcome.

## Cost constraint

Using Opus for all agents is acceptable for score gains. But if you can achieve the same score with Sonnet on some agents, prefer Sonnet (cheaper). Test model downgrades as experiments.

## Ideas to try

- **Complaint empathy**: Stronger CRITICAL_INSTRUCTION with more bad examples
- **Cross-sell specificity**: Named dishes, wines, times in every cross-sell
- **Grief handling**: More sensitive language, longer pause before any suggestion
- **Club agent structure**: Stricter output templates that force dollar quantification
- **Model mix**: Opus for concierge, Sonnet for club agents (cost optimization)
- **Prompt ordering**: Put most-violated rules at the very top
- **Few-shot examples**: Add complete good/bad response examples for each scenario type
- **Temperature**: Try temperature=0 for more consistent outputs
- **Shorter prompts**: Remove redundant rules, test if scores hold

## NEVER STOP

Once the loop begins, do NOT pause to ask the human anything. Run autonomously until manually interrupted. If you run out of ideas, re-read agent.js, look at which dimensions are lowest, try combining previous near-misses, try more radical changes.
