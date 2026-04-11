/**
 * circuit-breaker.js — Grief circuit breaker for the Agent Config System.
 *
 * Sprint 6: Detects grief scenarios and returns canned responses that
 * bypass the LLM entirely. Logs circuit breaker activations to agent_activity.
 *
 * @module api/agents/circuit-breaker
 */
import { sql } from '@vercel/postgres';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HAIKU = 'claude-haiku-4-5-20251001';

const DEFAULT_GRIEF_RESPONSE =
  '{name}, {deceased} sounds like they were such a special person. ' +
  'I want to make sure you get the care you deserve — I\'m letting {staff_role} know, ' +
  'and they\'ll reach out personally. Whenever you\'re ready to come back, I\'m here.';

const DEFAULT_SCENARIO_RESPONSES = {
  grief: DEFAULT_GRIEF_RESPONSE,
  harassment: 'I\'m not able to continue this conversation in this direction. ' +
    'If you need assistance, please contact {staff_role} directly.',
  emergency: 'This sounds like it may require immediate attention. ' +
    'Please call 911 or your local emergency services. ' +
    'I\'m also alerting {staff_role} right away.',
};

// ---------------------------------------------------------------------------
// Grief detection
// ---------------------------------------------------------------------------

/**
 * Use the Haiku classifier to detect grief in a member message.
 *
 * @param {string} message — The member's incoming message.
 * @returns {Promise<{ isGrief: boolean, deceasedName: string|null, confidence: number }>}
 */
export async function detectGrief(message) {
  if (!message || typeof message !== 'string') {
    return { isGrief: false, deceasedName: null, confidence: 0 };
  }

  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: HAIKU,
      max_tokens: 200,
      temperature: 0,
      system: `You are a grief detection classifier. Analyze the user message and determine if it indicates someone has recently experienced a death or loss of a loved one. Respond with ONLY a JSON object: { "isGrief": boolean, "deceasedName": string or null, "confidence": number between 0 and 1 }. No other text.`,
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content?.find(c => c.type === 'text')?.text ?? '{}';
    const parsed = JSON.parse(text);
    return {
      isGrief: Boolean(parsed.isGrief),
      deceasedName: parsed.deceasedName || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
  } catch {
    // On classifier failure, default to not-grief (safe fallback)
    return { isGrief: false, deceasedName: null, confidence: 0 };
  }
}

// ---------------------------------------------------------------------------
// Canned response builder
// ---------------------------------------------------------------------------

/**
 * Get the circuit breaker response for a given scenario.
 *
 * Looks up behavioral_config.scenario_overrides for custom canned responses
 * per club. Falls back to built-in defaults.
 *
 * @param {object} member — { first_name, last_name, ... }
 * @param {string} scenarioType — 'grief' | 'harassment' | 'emergency'
 * @param {object} config — The agent config object (loaded via assemble.getConfig)
 * @param {object} [extra] — { deceasedName: string } for grief scenarios
 * @returns {string} The canned response text.
 */
export function getCircuitBreakerResponse(member, scenarioType, config, extra = {}) {
  const behavioral = config?.behavioral_config || {};
  const overrides = behavioral.scenario_overrides || {};

  // Check for club-specific override first
  let template = overrides[scenarioType] || DEFAULT_SCENARIO_RESPONSES[scenarioType];
  if (!template) {
    template = DEFAULT_SCENARIO_RESPONSES.grief; // ultimate fallback
  }

  const staffRole = config?.staff_role || behavioral.staff_role || 'our membership director';
  const memberName = member?.first_name || 'there';
  const deceasedName = extra.deceasedName || 'your loved one';

  return template
    .replace(/\{name\}/g, memberName)
    .replace(/\{deceased\}/g, deceasedName)
    .replace(/\{staff_role\}/g, staffRole);
}

// ---------------------------------------------------------------------------
// Activity logging
// ---------------------------------------------------------------------------

/**
 * Log a circuit breaker activation to agent_activity.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @param {string} scenarioType — 'grief' | 'harassment' | 'emergency'
 * @param {string} response — The canned response that was sent.
 * @returns {Promise<void>}
 */
export async function logCircuitBreaker(clubId, memberId, scenarioType, response) {
  try {
    await sql`
      INSERT INTO agent_activity (
        club_id, agent_id, action_type, description, member_id, reasoning
      ) VALUES (
        ${clubId},
        'circuit-breaker',
        'circuit_breaker',
        ${`Circuit breaker fired: ${scenarioType}`},
        ${memberId || null},
        ${response}
      )
    `;
  } catch {
    // Best-effort logging — don't let logging failures break the flow
  }
}
