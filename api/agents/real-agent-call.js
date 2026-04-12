/**
 * Real Anthropic API call wrapper for agent triggers.
 *
 * Replaces simulation/recordSimAction. Each trigger passes a system prompt,
 * data context, and expected output shape; this wraps client.messages.create
 * with JSON-mode tool-use, parses the result, and writes a row to
 * agent_actions. Deterministic action_id keyed by (agent, scope, day) so
 * re-firing the same trigger today is a no-op via ON CONFLICT.
 *
 * Env required: ANTHROPIC_API_KEY. No Managed Agent platform needed.
 */
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';

let _client = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

const DEFAULT_MODEL = process.env.AGENT_MODEL || 'claude-haiku-4-5-20251001';

const ACTION_TOOL = {
  name: 'record_action',
  description: 'Record a single concrete recommended action for the GM. Always call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
      description: {
        type: 'string',
        description: 'One-paragraph concrete recommendation. Must reference real numbers from the input data.',
      },
      impact_metric: {
        type: 'string',
        description: 'Quantified impact, e.g. "$18,000/yr at risk" or "5h staffing gap".',
      },
      rationale: {
        type: 'string',
        description: 'One-sentence reason this action is needed. Reference the data signal.',
      },
    },
    required: ['priority', 'description', 'impact_metric', 'rationale'],
  },
};

/**
 * @typedef {Object} RealAgentCallInput
 * @property {string} clubId
 * @property {string} agentId           — e.g. 'service-recovery'
 * @property {string} actionType        — e.g. 'complaint_resolution'
 * @property {string} systemPrompt      — agent role + decision criteria
 * @property {object} contextData       — structured data the agent reasons over
 * @property {string} [memberId]
 * @property {string} [scope]           — secondary key for non-member triggers
 * @property {string} [model]
 * @property {string[]} [contributingAgents]
 */

/**
 * @param {RealAgentCallInput} input
 * @returns {Promise<{action_id: string|null, inserted: boolean, action: object|null, error?: string}>}
 */
export async function realAgentCall(input) {
  const {
    clubId, agentId, actionType, systemPrompt, contextData,
    memberId = null, scope = null, model = DEFAULT_MODEL,
    contributingAgents = null,
  } = input;

  if (!clubId || !agentId || !actionType || !systemPrompt) {
    return { action_id: null, inserted: false, action: null, error: 'missing required fields' };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { action_id: null, inserted: false, action: null, error: 'ANTHROPIC_API_KEY not set' };
  }

  let action;
  try {
    const response = await client().messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [ACTION_TOOL],
      tool_choice: { type: 'tool', name: 'record_action' },
      messages: [
        {
          role: 'user',
          content: `Here is the situation data. Call record_action exactly once with your recommendation.\n\n${JSON.stringify(contextData, null, 2)}`,
        },
      ],
    });
    const toolUse = response.content.find(b => b.type === 'tool_use' && b.name === 'record_action');
    if (!toolUse) {
      return { action_id: null, inserted: false, action: null, error: 'no tool_use in response' };
    }
    action = toolUse.input;
  } catch (err) {
    return { action_id: null, inserted: false, action: null, error: `anthropic: ${err.message}` };
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const scopeKey = memberId
    ? memberId.split('_').pop()
    : (scope || 'club').replace(/[^a-z0-9]/gi, '');
  const actionId = `live_${agentId}_${scopeKey}_${today}`;

  try {
    const result = await sql`
      INSERT INTO agent_actions (
        action_id, club_id, agent_id, action_type, priority, source,
        description, impact_metric, member_id, status, timestamp,
        contributing_agents
      ) VALUES (
        ${actionId}, ${clubId}, ${agentId}, ${actionType}, ${action.priority}, 'anthropic',
        ${action.description}, ${action.impact_metric}, ${memberId}, 'pending', NOW(),
        ${contributingAgents ? JSON.stringify(contributingAgents) : null}
      )
      ON CONFLICT (action_id) DO UPDATE SET
        description = EXCLUDED.description,
        impact_metric = EXCLUDED.impact_metric,
        priority = EXCLUDED.priority,
        contributing_agents = EXCLUDED.contributing_agents,
        timestamp = NOW()
      RETURNING (xmax = 0) AS inserted
    `;
    return {
      action_id: actionId,
      inserted: result.rows[0]?.inserted === true,
      action,
    };
  } catch (err) {
    return { action_id: actionId, inserted: false, action, error: `db: ${err.message}` };
  }
}
