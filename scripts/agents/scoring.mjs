/**
 * scripts/agents/scoring.mjs
 *
 * JSON parsing, contract validation, and weighted composite computation
 * for the 8-agent scoring system.
 */

import { AGENTS } from './agent-defs.mjs';

// ─── JSON Extraction ──────────────────────────────────────────────────────────

/**
 * Extract a JSON object from a Gemini response that may contain markdown fences
 * or other surrounding text.
 */
export function parseAgentJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { _parseError: 'empty response', _raw: rawText };
  }

  // Strategy 1: direct parse
  try {
    return JSON.parse(rawText.trim());
  } catch {}

  // Strategy 2: extract from ```json ... ``` fences
  const fenceMatch = rawText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Strategy 3: extract from first { to last }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return { _parseError: 'could not extract JSON', _raw: rawText.slice(0, 500) };
}

// ─── Contract Validation ──────────────────────────────────────────────────────

/**
 * Validate that a parsed agent output matches the output contract.
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
export function validateContract(parsed, agentDef) {
  const errors = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['not an object'] };
  }
  if (parsed._parseError) {
    return { valid: false, errors: [`parse error: ${parsed._parseError}`] };
  }
  if (!parsed.agent || typeof parsed.agent !== 'string') {
    errors.push('missing agent name');
  }
  if (!parsed.scores || typeof parsed.scores !== 'object') {
    errors.push('missing scores object');
  } else {
    // Verify at least one dimension has a valid score
    const dims = Object.values(parsed.scores);
    const validScores = dims.filter(d => d && typeof d.score === 'number' && d.score >= 1 && d.score <= 10);
    if (validScores.length === 0) {
      errors.push('no valid dimension scores (expected 1-10)');
    }
  }
  if (!Array.isArray(parsed.top_strengths)) {
    errors.push('missing top_strengths array');
  }
  if (!Array.isArray(parsed.top_issues)) {
    errors.push('missing top_issues array');
  }
  if (!Array.isArray(parsed.recommendations)) {
    errors.push('missing recommendations array');
  } else {
    const badRecs = parsed.recommendations.filter(r =>
      !r.priority || !r.surface || !r.change
    );
    if (badRecs.length > 0) {
      errors.push(`${badRecs.length} recommendation(s) missing required fields`);
    }
  }
  if (typeof parsed.confidence !== 'number') {
    errors.push('missing confidence number');
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

// ─── Agent Score Extraction ───────────────────────────────────────────────────

/**
 * Extract numeric average score (1-10) from a validated agent output.
 * Returns null if no valid scores found.
 */
export function extractAgentAverage(parsed) {
  if (!parsed?.scores || typeof parsed.scores !== 'object') return null;
  const vals = Object.values(parsed.scores)
    .map(d => (d && typeof d.score === 'number' ? d.score : null))
    .filter(v => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Weighted Composite ───────────────────────────────────────────────────────

/**
 * Compute the weighted composite score (0-10) from all agent outputs.
 *
 * @param {Object} agentOutputs - map of agentId -> parsed JSON output
 * @returns {Object} { composite, contributions, agentAverages }
 */
export function computeWeightedComposite(agentOutputs) {
  let totalWeight = 0;
  let weightedSum = 0;
  const contributions = {};
  const agentAverages = {};

  for (const agent of AGENTS) {
    const output = agentOutputs[agent.id];
    const avg = output ? extractAgentAverage(output) : null;
    agentAverages[agent.id] = avg;

    if (avg !== null) {
      totalWeight += agent.weight;
      weightedSum += avg * agent.weight;
      contributions[agent.id] = {
        average: Math.round(avg * 10) / 10,
        weight: agent.weight,
        weighted: Math.round(avg * agent.weight * 100) / 100,
      };
    }
  }

  if (totalWeight === 0) return { composite: null, contributions, agentAverages };

  // Re-normalize if some agents were missing
  const composite = Math.round((weightedSum / totalWeight) * 10) / 10;
  return { composite, contributions, agentAverages };
}

// ─── Recommendations Merger ───────────────────────────────────────────────────

/**
 * Merge and deduplicate recommendations from all agent outputs.
 * Preserves highest priority when the same surface+change appears multiple times.
 *
 * @param {Object} agentOutputs - map of agentId -> parsed JSON output
 * @returns {Array} sorted recommendations array (P0 first, then P1, P2)
 */
export function mergeRecommendations(agentOutputs) {
  const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };
  const seen = new Map(); // key: surface+change fingerprint -> rec

  for (const [agentId, output] of Object.entries(agentOutputs)) {
    if (!output?.recommendations) continue;
    for (const rec of output.recommendations) {
      if (!rec.surface || !rec.change) continue;
      const key = `${rec.surface.toLowerCase()}|${rec.change.toLowerCase().slice(0, 60)}`;
      if (seen.has(key)) {
        const existing = seen.get(key);
        // Keep higher priority
        if (PRIORITY_ORDER[rec.priority] < PRIORITY_ORDER[existing.priority]) {
          existing.priority = rec.priority;
        }
        existing.raising_agents = [...new Set([...existing.raising_agents, agentId])];
      } else {
        seen.set(key, {
          priority: rec.priority || 'P2',
          surface: rec.surface,
          change: rec.change,
          expected_lift: rec.expected_lift || '',
          raising_agents: [agentId],
        });
      }
    }
  }

  return [...seen.values()].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
  );
}
