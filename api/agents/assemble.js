/**
 * assembleAgentCall() — Central pipeline that ALL agent API calls route through.
 *
 * Replaces hardcoded prompts/models/tools with a configurable pipeline that
 * loads per-club settings from the `agent_configs` database table, then layers
 * on tone, brand voice, custom examples, forbidden actions, tool permissions,
 * and model overrides before returning a ready-to-send payload.
 *
 * @module api/agents/assemble
 */
import { sql } from '@vercel/postgres';
import { getToneBlock } from './tone-presets.js';

// ---------------------------------------------------------------------------
// Model constants (defaults per agent tier)
// ---------------------------------------------------------------------------

const OPUS   = 'claude-opus-4-20250514';
const SONNET = 'claude-sonnet-4-20250514';
const HAIKU  = 'claude-haiku-4-5-20251001';

/** Default model assignments per agent. */
const DEFAULT_MODELS = {
  'chief-of-staff':          OPUS,
  'personal-concierge':      OPUS,
  'member-service-recovery':  OPUS,
  'booking-agent':           HAIKU,
  'staffing-demand':         HAIKU,
  'member-risk-lifecycle':   SONNET,
  'service-recovery':        SONNET,
  'tomorrows-game-plan':     SONNET,
  'fb-intelligence':         SONNET,
  'board-report-compiler':   SONNET,
  'revenue-analyst':         SONNET,
  'growth-pipeline':         SONNET,
};

/** Default temperature per agent. */
export const DEFAULT_TEMPERATURES = {
  'chief-of-staff':          0.4,
  'personal-concierge':      0.6,
  'member-service-recovery':  0.6,
  'booking-agent':           0.1,
  'staffing-demand':         0.2,
  'member-risk-lifecycle':   0.3,
  'service-recovery':        0.4,
  'tomorrows-game-plan':     0.3,
  'fb-intelligence':         0.3,
  'board-report-compiler':   0.3,
  'revenue-analyst':         0.3,
  'growth-pipeline':         0.3,
};

const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TONE = 'warm';

// ---------------------------------------------------------------------------
// Base prompt loaders — lazy-imported from src/config/*Prompt.js
// ---------------------------------------------------------------------------

/**
 * Map of agent IDs to async prompt loaders.
 *
 * Builder prompts (personal-concierge, member-service-recovery, concierge)
 * export functions that accept (memberContext, clubName). All others export
 * a default constant string.
 */
const BASE_PROMPTS = {
  'personal-concierge':      () => import('../../src/config/personalConciergePrompt.js'),
  'member-service-recovery':  () => import('../../src/config/memberServiceRecoveryPrompt.js'),
  'concierge':               () => import('../../src/config/conciergePrompt.js'),
  'booking-agent':           () => import('../../src/config/bookingAgentPrompt.js'),
  'member-risk-lifecycle':   () => import('../../src/config/memberRiskPrompt.js'),
  'service-recovery':        () => import('../../src/config/serviceRecoveryPrompt.js'),
  'tomorrows-game-plan':     () => import('../../src/config/gamePlanPrompt.js'),
  'staffing-demand':         () => import('../../src/config/staffingDemandPrompt.js'),
  'fb-intelligence':         () => import('../../src/config/fbIntelligencePrompt.js'),
  'board-report-compiler':   () => import('../../src/config/boardReportPrompt.js'),
  'chief-of-staff':          () => import('../../src/config/chiefOfStaffPrompt.js'),
  'revenue-analyst':         () => import('../../src/config/revenueAnalystPrompt.js'),
  'growth-pipeline':         () => import('../../src/config/growthPipelinePrompt.js'),
  'service-save':            () => import('../../src/config/serviceSavePrompt.js'),
};

/** Agent IDs whose prompt modules export a builder function (not a constant). */
const BUILDER_PROMPT_AGENTS = new Set([
  'personal-concierge',
  'member-service-recovery',
  'concierge',
]);

// ---------------------------------------------------------------------------
// Config cache — simple Map with 60-second TTL
// ---------------------------------------------------------------------------

/** @type {Map<string, { config: object, ts: number }>} */
const _configCache = new Map();
const CONFIG_TTL_MS = 60_000;

/**
 * Load the agent_configs row for a given club + agent.
 * Returns an empty-defaults object when no row exists (backward compatible).
 *
 * @param {string} clubId
 * @param {string} agentId
 * @returns {Promise<object>} The config row or empty defaults.
 */
export async function getConfig(clubId, agentId) {
  const cacheKey = `${clubId}:${agentId}`;
  const cached = _configCache.get(cacheKey);

  if (cached && Date.now() - cached.ts < CONFIG_TTL_MS) {
    return cached.config;
  }

  let config;
  try {
    const result = await sql`
      SELECT * FROM agent_configs
      WHERE club_id = ${clubId} AND agent_id = ${agentId}
    `;
    config = result.rows[0] || _emptyConfig();
  } catch {
    // Table may not exist yet — return empty defaults
    config = _emptyConfig();
  }

  _configCache.set(cacheKey, { config, ts: Date.now() });
  return config;
}

/**
 * Clear the entire config cache. Call after a PATCH to agent_configs.
 */
export function clearConfigCache() {
  _configCache.clear();
}

/** Returns a backward-compatible empty config shape. */
function _emptyConfig() {
  return {
    behavioral_config: {},
    tool_permissions: {},
    prompt_overrides: {},
    tone: null,
    sweep_cadence: null,
  };
}

// ---------------------------------------------------------------------------
// Prompt assembly helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the base system prompt for an agent.
 *
 * @param {string} agentId
 * @param {object} memberContext — { first_name, last_name, club_name, ... }
 * @returns {Promise<string>} The base prompt text.
 */
async function _resolveBasePrompt(agentId, memberContext) {
  const loader = BASE_PROMPTS[agentId];
  if (!loader) {
    return `You are the ${agentId} agent. Follow instructions carefully.`;
  }

  const mod = await loader();

  if (BUILDER_PROMPT_AGENTS.has(agentId)) {
    // Builder functions expect (member, clubName)
    const builderFn = mod.default || Object.values(mod).find(v => typeof v === 'function');
    if (typeof builderFn === 'function') {
      const clubName = memberContext?.club_name || 'the club';
      return builderFn(memberContext || {}, clubName);
    }
  }

  // Constant prompt — use the default export
  return mod.default || mod[Object.keys(mod).find(k => typeof mod[k] === 'string')] || '';
}

/**
 * Format custom few-shot examples into a prompt block.
 *
 * Supports both legacy { user, assistant } format and the Sprint 4
 * { scenario, input, ideal_response } format used by the CustomExamplesPanel.
 *
 * @param {Array<object>} examples
 * @param {string} [scenarioFilter] — Optional: only include examples matching this scenario type.
 * @returns {string}
 */
function _formatExamplesBlock(examples, scenarioFilter) {
  if (!examples?.length) return '';

  let filtered = examples;
  if (scenarioFilter) {
    filtered = examples.filter(ex => ex.scenario === scenarioFilter);
    // Fall back to all examples if no matches for the filter
    if (filtered.length === 0) filtered = examples;
  }

  const formatted = filtered
    .map((ex, i) => {
      // Sprint 4 format: { scenario, input, ideal_response }
      if (ex.input && ex.ideal_response) {
        const scenarioLine = ex.scenario ? `Scenario: ${ex.scenario}\n` : '';
        return `${scenarioLine}Member says: "${ex.input}"\nYou respond: "${ex.ideal_response}"`;
      }
      // Legacy format: { user, assistant }
      return `Example ${i + 1}:\nUser: ${ex.user}\nAssistant: ${ex.assistant}`;
    })
    .join('\n\n');

  return `\n\n--- Club-Specific Examples ---\n${formatted}`;
}

/**
 * Format brand voice notes into a prompt block.
 *
 * @param {string} notes
 * @returns {string}
 */
function _formatBrandVoiceBlock(notes) {
  if (!notes) return '';
  return `\n\n<club_communication_style>\n${notes}\n</club_communication_style>`;
}

/**
 * Format forbidden actions into a CRITICAL_INSTRUCTION block.
 *
 * @param {string[]} actions
 * @returns {string}
 */
function _formatForbiddenActionsBlock(actions) {
  if (!actions?.length) return '';

  const list = actions.map(a => `- ${a}`).join('\n');
  return `\n\n<CRITICAL_INSTRUCTION>\nYou MUST NEVER do any of the following:\n${list}\n</CRITICAL_INSTRUCTION>`;
}

/**
 * Format max comp amount into a guardrail block.
 *
 * @param {number|null|undefined} amount
 * @returns {string}
 */
function _formatMaxCompAmountBlock(amount) {
  if (amount == null) return '';
  return `\n\n<comp_guardrail>\nDo not offer complimentary items valued above $${amount} without GM approval.\n</comp_guardrail>`;
}

// ---------------------------------------------------------------------------
// Tool filtering
// ---------------------------------------------------------------------------

/**
 * Filter and annotate tools based on tool_permissions config.
 *
 * @param {Array<object>} tools — Full tool set for the agent.
 * @param {object} permissions — { denied: string[], requires_approval: string[], auto_execute: string[] }
 * @returns {Array<object>} Filtered and annotated tools.
 */
function _filterTools(tools, permissions) {
  if (!tools?.length || !permissions) return tools || [];

  const denied = new Set(permissions.denied || []);
  const requiresApproval = new Set(permissions.requires_approval || []);

  return tools
    .filter(t => !denied.has(t.name))
    .map(t => {
      if (requiresApproval.has(t.name)) {
        return {
          ...t,
          description: `${t.description} (REQUIRES GM APPROVAL \u2014 propose only, do not execute)`,
        };
      }
      return t;
    });
}

// ---------------------------------------------------------------------------
// Prefill interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate template variables in a prefill string.
 *
 * @param {string} prefill
 * @param {object} memberContext
 * @returns {string}
 */
function _interpolatePrefill(prefill, memberContext) {
  if (!prefill) return '';
  return prefill
    .replace(/\{member_first_name\}/g, memberContext?.first_name || '')
    .replace(/\{member_last_name\}/g, memberContext?.last_name || '')
    .replace(/\{club_name\}/g, memberContext?.club_name || 'the club');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Assemble a complete, ready-to-send Claude API payload for an agent call.
 *
 * Loads config from the database (cached 60 s), resolves the base prompt,
 * layers tone / brand voice / examples / forbidden actions, filters tools,
 * and selects the model + parameters. Returns the payload without executing it.
 *
 * @param {string} clubId        — Club UUID.
 * @param {string} agentId       — Agent slug (e.g. 'personal-concierge').
 * @param {object} memberContext  — { first_name, last_name, club_name, ... }
 * @param {string} userMessage    — The end-user or system message to send.
 * @param {object} [opts]         — Optional overrides.
 * @param {Array<object>} [opts.tools] — Full tool set for the agent (caller provides).
 * @param {string} [opts.scenarioFilter] — Only inject custom examples matching this scenario type.
 * @returns {Promise<object>} Assembled payload: { model, temperature, max_tokens, system, messages, tools, config }.
 */
export async function assembleAgentCall(clubId, agentId, memberContext, userMessage, opts = {}) {
  // 1. Load config
  const loadedConfig = await getConfig(clubId, agentId);
  const behavioral = loadedConfig.behavioral_config || {};
  const toolPerms  = loadedConfig.tool_permissions || {};
  const overrides  = loadedConfig.prompt_overrides || {};

  // 2. Resolve base prompt
  let assembledPrompt = await _resolveBasePrompt(agentId, memberContext);

  // 3. Inject tone
  const tone = loadedConfig.tone || DEFAULT_TONE;
  const toneBlock = getToneBlock(tone);
  assembledPrompt += `\n\n<communication_tone>\n${toneBlock}\n</communication_tone>`;

  // 4. Inject custom examples (optionally filtered by scenario type)
  assembledPrompt += _formatExamplesBlock(behavioral.custom_examples, opts.scenarioFilter);

  // 5. Inject brand voice
  assembledPrompt += _formatBrandVoiceBlock(behavioral.brand_voice_notes);

  // 6. Inject forbidden actions
  assembledPrompt += _formatForbiddenActionsBlock(behavioral.forbidden_actions);

  // 6b. Inject max comp amount guardrail
  assembledPrompt += _formatMaxCompAmountBlock(behavioral.max_comp_amount);

  // 7. Filter tools
  const filteredTools = _filterTools(opts.tools || [], toolPerms);

  // 8. Resolve model / temperature / max_tokens
  const model      = overrides.model       || DEFAULT_MODELS[agentId]       || SONNET;
  const temperature = overrides.temperature ?? DEFAULT_TEMPERATURES[agentId] ?? 0.3;
  const max_tokens = overrides.max_tokens  || DEFAULT_MAX_TOKENS;

  // 9. Handle prefill
  const messages = [];
  if (overrides.prefill) {
    const interpolated = _interpolatePrefill(overrides.prefill, memberContext);
    messages.push({ role: 'assistant', content: interpolated });
  }
  messages.push({ role: 'user', content: userMessage });

  // 10. Return payload (not executed)
  return {
    model,
    temperature,
    max_tokens,
    system: assembledPrompt,
    messages,
    tools: filteredTools,
    config: loadedConfig,
  };
}
