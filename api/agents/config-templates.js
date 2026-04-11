/**
 * config-templates.js — Default configuration templates for the Agent Config System.
 *
 * Sprint 6: Provides baseline templates that clubs can apply as starting points.
 * Each template defines tone, model, temperature, tool permissions, validation
 * rules, and behavioral settings for every agent in the system.
 *
 * @module api/agents/config-templates
 */

// ---------------------------------------------------------------------------
// Model constants
// ---------------------------------------------------------------------------

const OPUS   = 'claude-opus-4-20250514';
const SONNET = 'claude-sonnet-4-20250514';
const HAIKU  = 'claude-haiku-4-5-20251001';

// ---------------------------------------------------------------------------
// Agent lists by tier
// ---------------------------------------------------------------------------

const OPUS_AGENTS   = ['personal-concierge', 'member-service-recovery', 'chief-of-staff'];
const SONNET_AGENTS = ['member-risk-lifecycle', 'service-recovery', 'tomorrows-game-plan',
  'fb-intelligence', 'board-report-compiler', 'revenue-analyst', 'growth-pipeline'];
const HAIKU_AGENTS  = ['booking-agent', 'staffing-demand'];

const ALL_AGENTS = [...OPUS_AGENTS, ...SONNET_AGENTS, ...HAIKU_AGENTS];

// ---------------------------------------------------------------------------
// Read-only vs write tools
// ---------------------------------------------------------------------------

const READ_ONLY_TOOLS = [
  'lookup_member', 'get_reservation', 'check_availability',
  'get_member_history', 'get_dining_menu', 'get_club_events',
  'get_weather', 'get_member_preferences', 'get_billing_summary',
];

const WRITE_TOOLS = [
  'create_reservation', 'cancel_reservation', 'modify_reservation',
  'send_notification', 'update_preferences', 'issue_comp',
  'escalate_to_staff', 'create_task', 'log_interaction',
];

// ---------------------------------------------------------------------------
// SWOOP_RECOMMENDED template
// ---------------------------------------------------------------------------

function _swoopRecommendedAgent(agentId) {
  const isOpus   = OPUS_AGENTS.includes(agentId);
  const isHaiku  = HAIKU_AGENTS.includes(agentId);

  const temperatures = {
    'chief-of-staff': 0.4,
    'personal-concierge': 0.6,
    'member-service-recovery': 0.6,
    'booking-agent': 0.1,
    'staffing-demand': 0.2,
    'member-risk-lifecycle': 0.3,
    'service-recovery': 0.4,
    'tomorrows-game-plan': 0.3,
    'fb-intelligence': 0.3,
    'board-report-compiler': 0.3,
    'revenue-analyst': 0.3,
    'growth-pipeline': 0.3,
  };

  return {
    agent_id: agentId,
    tone: 'warm',
    enabled: true,
    auto_approve_threshold: 0.85,
    behavioral_config: {
      custom_examples: [],
      brand_voice_notes: null,
      forbidden_actions: [],
      max_comp_amount: isOpus ? 100 : null,
      scenario_overrides: {},
    },
    tool_permissions: {
      auto_execute: READ_ONLY_TOOLS,
      requires_approval: isHaiku ? WRITE_TOOLS : [],
      denied: [],
    },
    prompt_overrides: {
      model: isOpus ? OPUS : isHaiku ? HAIKU : SONNET,
      temperature: temperatures[agentId] ?? 0.3,
      max_tokens: 4096,
      validation_rules: ['empathy_first', 'no_markdown'],
      prefill: null,
    },
  };
}

export const SWOOP_RECOMMENDED = Object.fromEntries(
  ALL_AGENTS.map(id => [id, _swoopRecommendedAgent(id)])
);

// ---------------------------------------------------------------------------
// CONSERVATIVE template
// ---------------------------------------------------------------------------

function _conservativeAgent(agentId) {
  const isOpus  = OPUS_AGENTS.includes(agentId);
  const isHaiku = HAIKU_AGENTS.includes(agentId);

  return {
    agent_id: agentId,
    tone: 'professional',
    enabled: true,
    auto_approve_threshold: 0.95,
    behavioral_config: {
      custom_examples: [],
      brand_voice_notes: null,
      forbidden_actions: [],
      max_comp_amount: 25,
      scenario_overrides: {},
    },
    tool_permissions: {
      auto_execute: READ_ONLY_TOOLS,
      requires_approval: WRITE_TOOLS,
      denied: [],
    },
    prompt_overrides: {
      model: isOpus ? OPUS : isHaiku ? HAIKU : SONNET,
      temperature: 0.2,
      max_tokens: 4096,
      validation_rules: [
        'empathy_first', 'no_markdown', 'no_forbidden_words',
        'response_length', 'asks_before_suggesting',
      ],
      prefill: null,
    },
  };
}

export const CONSERVATIVE = Object.fromEntries(
  ALL_AGENTS.map(id => [id, _conservativeAgent(id)])
);

// ---------------------------------------------------------------------------
// AGGRESSIVE template
// ---------------------------------------------------------------------------

function _aggressiveAgent(agentId) {
  const isOpus  = OPUS_AGENTS.includes(agentId);
  const isHaiku = HAIKU_AGENTS.includes(agentId);

  return {
    agent_id: agentId,
    tone: 'warm',
    enabled: true,
    auto_approve_threshold: 0.75,
    behavioral_config: {
      custom_examples: [],
      brand_voice_notes: null,
      forbidden_actions: [],
      max_comp_amount: 200,
      proactive_suggestions: true,
      scenario_overrides: {},
    },
    tool_permissions: {
      auto_execute: [...READ_ONLY_TOOLS, ...WRITE_TOOLS],
      requires_approval: [],
      denied: [],
    },
    prompt_overrides: {
      model: isOpus ? OPUS : isHaiku ? HAIKU : SONNET,
      temperature: isOpus ? 0.7 : isHaiku ? 0.2 : 0.5,
      max_tokens: 4096,
      validation_rules: ['no_markdown'],
      prefill: null,
    },
  };
}

export const AGGRESSIVE = Object.fromEntries(
  ALL_AGENTS.map(id => [id, _aggressiveAgent(id)])
);

// ---------------------------------------------------------------------------
// Template registry + apply function
// ---------------------------------------------------------------------------

const TEMPLATES = {
  SWOOP_RECOMMENDED,
  CONSERVATIVE,
  AGGRESSIVE,
};

/**
 * Return the full config object for a named template.
 *
 * @param {string} templateName — 'SWOOP_RECOMMENDED' | 'CONSERVATIVE' | 'AGGRESSIVE'
 * @returns {object} Map of agentId -> config object, or null if template unknown.
 */
export function applyTemplate(templateName) {
  const template = TEMPLATES[templateName];
  if (!template) return null;
  // Deep clone to prevent mutation of the canonical template
  return JSON.parse(JSON.stringify(template));
}
