import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Constants — sourced from environment variables
// ---------------------------------------------------------------------------

export const MANAGED_AGENT_ID = process.env.MANAGED_AGENT_ID || '';
export const MANAGED_ENV_ID = process.env.MANAGED_ENV_ID || '';

// ---------------------------------------------------------------------------
// SDK client singleton
// ---------------------------------------------------------------------------

let _client = null;

/**
 * Returns a shared Anthropic SDK client instance.
 * Uses ANTHROPIC_API_KEY from env automatically.
 */
export function getAnthropicClient() {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Managed Agent helpers
// ---------------------------------------------------------------------------

/**
 * Create a new Managed Agent session.
 *
 * @param {string} [agentId] — defaults to MANAGED_AGENT_ID env var
 * @param {string} [envId]   — defaults to MANAGED_ENV_ID env var
 * @returns {Promise<object>} the session object from the API
 */
export async function createManagedSession(agentId = MANAGED_AGENT_ID, envId = MANAGED_ENV_ID) {
  const client = getAnthropicClient();
  const response = await client.post('/v1/agents/sessions', {
    body: {
      agent_id: agentId,
      environment_id: envId,
    },
  });
  return response;
}

/**
 * Send a wake event to an existing Managed Agent session.
 *
 * @param {string} sessionId — the session to wake
 * @param {object} event     — the event payload
 * @returns {Promise<object>} the API response
 */
export async function sendSessionEvent(sessionId, event) {
  const client = getAnthropicClient();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.post(`/v1/agents/sessions/${sessionId}/events`, {
        body: event,
      });
      return response;
    } catch (err) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
      else throw err;
    }
  }
}
