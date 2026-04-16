/**
 * scripts/agents/orchestrator.mjs
 *
 * Orchestrator agent — receives all 8 agent outputs, reconciles conflicts,
 * computes the weighted composite, and produces the final scorecard + report.
 *
 * Source: Swoop_Scoring_Agent_Plan.docx, Section 7.
 */

import { ANCHOR_BRIEF } from './anchor-brief.mjs';
import { AGENTS } from './agent-defs.mjs';
import { computeWeightedComposite, mergeRecommendations } from './scoring.mjs';
import { anthropicWithRetry } from '../lib/infra.mjs';

// ─── Orchestrator Prompt (from docx Section 7) ────────────────────────────────

const ORCHESTRATOR_SYSTEM = ANCHOR_BRIEF + `

---

ORCHESTRATOR ROLE

You are the lead product strategist at Swoop Golf. You have just received
eight scoring reports from eight specialist agents who each reviewed the
live Swoop app through a single lens. Your job is to produce the final
scorecard and the ranked roadmap delta.

INPUTS
  • The Anchor Brief (above in this conversation).
  • Eight agent outputs, each in the shared JSON contract.

TASK
  1. Validate the JSON contract for each agent. Flag any agent that
     returned malformed output.
  2. The weighted composite has already been computed in code and is
     provided to you. Verify it makes sense given the individual scores.
  3. Reconcile conflicts. When UX and Storyboard disagree (e.g. UX likes
     a page, Storyboard says it kills the narrative), state both views
     and make an explicit call. Do not average feelings.
  4. Collapse recommendations. Merge duplicates across agents. Preserve
     the highest priority when the same issue appears more than once.
  5. Honor the storyboard rule. Do NOT recommend removing a feature
     solely because it is not in the storyboard. Forward-looking features
     (AI outreach with one-click approval, predictive F&B, demand-driven
     staffing) stay in and should get evangelism recommendations —
     clearer copy, trust affordances, better onboarding — not removal.

OUTPUT FORMAT
Return a JSON object with this exact structure:

{
  "headline_verdict": "<1 paragraph, executive-grade>",
  "scorecard": [
    {
      "dimension": "<agent name>",
      "score": <0-10>,
      "weight": <0.00-1.00>,
      "weighted": <0.00-10.00>,
      "top_issue": "<1 sentence>"
    }
  ],
  "composite": <0.0-10.0>,
  "top_strengths": [
    { "strength": "...", "screenshot_ref": "..." }
  ],
  "top_issues": [
    { "issue": "...", "screenshot_ref": "...", "surface": "..." }
  ],
  "roadmap": {
    "P0": [
      {
        "change": "...",
        "surface": "...",
        "expected_lift": "...",
        "raising_agents": ["..."],
        "confidence": 0.0-1.0
      }
    ],
    "P1": [...],
    "P2": [...]
  },
  "forward_looking_audit": [
    {
      "capability": "...",
      "evangelism_quality": "strong/weak/absent",
      "recommended_copy_change": "..."
    }
  ],
  "counter_positioning": "<1 paragraph vs MetricsFirst>",
  "conflicts_reconciled": [
    { "agents": ["agent1", "agent2"], "conflict": "...", "resolution": "..." }
  ]
}

CONSTRAINTS
  • No em-dashes. Use commas or colons.
  • No marketing filler. No "genuinely / honestly / straightforward."
  • Executive tone. Every sentence should survive being read aloud to a board.
  • Every claim in top_strengths and top_issues must cite a screenshot_ref.
  • Return ONLY the JSON object. No markdown, no preamble.
`;

// ─── Main Orchestrator Function ───────────────────────────────────────────────

export async function runOrchestrator(anthropic, agentOutputs, runMeta) {

  // Pre-compute composite in code (orchestrator verifies, not computes)
  const { composite, contributions, agentAverages } = computeWeightedComposite(agentOutputs);
  const merged = mergeRecommendations(agentOutputs);

  // Build agent summary table for the prompt
  const agentSummary = AGENTS.map(a => {
    const avg = agentAverages[a.id];
    const out = agentOutputs[a.id];
    return `  ${a.name} (${Math.round(a.weight * 100)}%): avg=${avg !== null ? avg.toFixed(1) : 'ERROR'} | issues=${JSON.stringify(out?.top_issues?.slice(0, 2) ?? [])}`;
  }).join('\n');

  // Serialize agent outputs (truncated for token budget)
  const agentOutputsText = AGENTS.map(a => {
    const out = agentOutputs[a.id];
    if (!out) return `\n### ${a.name}\n[ERROR: no output]`;
    const serialized = JSON.stringify(out, null, 2);
    return `\n### ${a.name}\n${serialized.slice(0, 3000)}${serialized.length > 3000 ? '\n...[truncated]' : ''}`;
  }).join('\n');

  const userPrompt = `
Run: ${runMeta.run}
App: ${runMeta.app_url}
Club: ${runMeta.club_id}

PRE-COMPUTED COMPOSITE: ${composite ?? 'N/A'} / 10

AGENT AVERAGES:
${agentSummary}

MERGED RECOMMENDATIONS (${merged.length} total, pre-deduplicated):
${JSON.stringify(merged.slice(0, 30), null, 2)}

FULL AGENT OUTPUTS:
${agentOutputsText}

Produce the orchestrator JSON output described in your system prompt.
`.trim();

  const rawText = await anthropicWithRetry(async () => {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8096,
      system: ORCHESTRATOR_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content[0].text;
  });

  // Parse the orchestrator JSON
  let parsed = tryParseJSON(rawText);

  // Inject pre-computed composite if orchestrator didn't produce one
  if (!parsed.composite) parsed.composite = composite;

  return { parsed, raw: rawText, merged, composite, agentAverages };
}

function tryParseJSON(text) {
  try { return JSON.parse(text.trim()); } catch {}
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return { _parseError: true, _raw: text.slice(0, 500) };
}
