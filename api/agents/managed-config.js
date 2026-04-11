import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@vercel/postgres';

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
// Sub-agent IDs — env-var fallback (static). Prefer getAgentId() for DB lookup.
// ---------------------------------------------------------------------------

export const AGENT_IDS = {
  // Opus — orchestration + emotional intelligence
  'chief-of-staff':          process.env.COS_AGENT_ID          || MANAGED_AGENT_ID,
  'personal-concierge':      process.env.CONCIERGE_AGENT_ID    || MANAGED_AGENT_ID,
  'member-service-recovery': process.env.MSR_AGENT_ID          || MANAGED_AGENT_ID,
  // Haiku — transactional, high-volume
  'booking-agent':           process.env.BOOKING_AGENT_ID      || MANAGED_AGENT_ID,
  'staffing-demand':         process.env.STAFFING_AGENT_ID     || MANAGED_AGENT_ID,
  // Sonnet — analytical
  'member-risk-lifecycle':   process.env.RISK_AGENT_ID         || MANAGED_AGENT_ID,
  'service-recovery':        process.env.SR_AGENT_ID           || MANAGED_AGENT_ID,
  'tomorrows-game-plan':     process.env.GAMEPLAN_AGENT_ID     || MANAGED_AGENT_ID,
  'fb-intelligence':         process.env.FB_AGENT_ID           || MANAGED_AGENT_ID,
  'board-report-compiler':   process.env.BOARD_AGENT_ID        || MANAGED_AGENT_ID,
  'revenue-analyst':         process.env.REVENUE_AGENT_ID      || MANAGED_AGENT_ID,
  'growth-pipeline':         process.env.GROWTH_AGENT_ID       || MANAGED_AGENT_ID,
  // Legacy alias
  'member-concierge':        process.env.CONCIERGE_AGENT_ID    || MANAGED_AGENT_ID,
};

// ---------------------------------------------------------------------------
// Agent ID lookup — checks DB registry first, falls back to env vars
// ---------------------------------------------------------------------------

/** In-memory cache: { `${agentName}:${clubId}`: agentId } */
const _agentIdCache = new Map();

/**
 * Resolve the registered agent ID for a given agent name.
 *
 * Lookup order:
 *   1. In-memory cache (populated on first call per name+club)
 *   2. agent_registry Postgres table (written by register-agents.js)
 *   3. AGENT_IDS env-var map (static fallback)
 *
 * @param {string} agentName — e.g. 'member-risk-lifecycle'
 * @param {string} [clubId]  — optional club scope; omit for env-var-only lookup
 * @returns {Promise<string>} the agent ID
 */
export async function getAgentId(agentName, clubId) {
  const cacheKey = `${agentName}:${clubId || 'global'}`;

  if (_agentIdCache.has(cacheKey)) {
    return _agentIdCache.get(cacheKey);
  }

  // Try DB registry
  if (clubId) {
    try {
      const result = await sql`
        SELECT agent_id FROM agent_registry
        WHERE agent_name = ${agentName} AND club_id = ${clubId}
      `;
      if (result.rows[0]?.agent_id) {
        _agentIdCache.set(cacheKey, result.rows[0].agent_id);
        return result.rows[0].agent_id;
      }
    } catch {
      // Table may not exist yet; fall through to static map
    }
  }

  // Fall back to env-var static map
  const fallback = AGENT_IDS[agentName] || MANAGED_AGENT_ID;
  _agentIdCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Clear the in-memory agent ID cache (useful after re-registration).
 */
export function clearAgentIdCache() {
  _agentIdCache.clear();
}

// ---------------------------------------------------------------------------
// Managed Agent helpers
// ---------------------------------------------------------------------------

/**
 * Create a new Managed Agent session (basic, no callable_agents).
 * Uses the proper beta SDK method: client.beta.sessions.create()
 *
 * @param {string} [agentId] — defaults to MANAGED_AGENT_ID env var
 * @param {string} [envId]   — defaults to MANAGED_ENV_ID env var
 * @returns {Promise<object>} the session object from the API
 */
export async function createManagedSession(agentId = MANAGED_AGENT_ID, envId = MANAGED_ENV_ID) {
  const client = getAnthropicClient();
  const response = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
  });
  return response;
}

/**
 * Create a Chief-of-Staff coordinator session with callable_agents.
 *
 * Uses agent_toolset_20260401 so the CoS can delegate to sub-agents
 * and the platform spawns threads automatically.
 *
 * @param {string} [envId] — defaults to MANAGED_ENV_ID env var
 * @returns {Promise<object>} the session object (includes session.id)
 */
export async function createCoordinatorSession(envId = MANAGED_ENV_ID) {
  const client = getAnthropicClient();
  const callableAgents = Object.entries(AGENT_IDS)
    .filter(([key]) => key !== 'chief-of-staff')
    .map(([key, agentId]) => ({
      agent_id: agentId,
      name: key,
      description: `Delegate work to the ${key} agent`,
    }));

  const response = await client.beta.sessions.create({
    agent: AGENT_IDS['chief-of-staff'],
    environment_id: envId,
    agent_toolset_version: 'agent_toolset_20260401',
    callable_agents: callableAgents,
    metadata: {
      coordinator: 'chief-of-staff',
    },
  });
  return response;
}

/**
 * Create a thread within an existing coordinator session for sub-agent work.
 *
 * @param {string} sessionId — the coordinator session id
 * @param {string} agentName — logical agent name (e.g. 'member-risk-lifecycle')
 * @param {object} context   — initial context payload for the thread
 * @returns {Promise<object>} the thread object (includes thread.session_thread_id)
 */
export async function createAgentThread(sessionId, agentName, context) {
  const client = getAnthropicClient();
  const response = await client.post(`/v1/agents/sessions/${sessionId}/threads`, {
    body: {
      agent_id: AGENT_IDS[agentName] || MANAGED_AGENT_ID,
      name: agentName,
      metadata: { agent_name: agentName, created_at: new Date().toISOString() },
    },
  });

  // Send initial context to the new thread using proper content blocks
  if (context) {
    await sendSessionEvent(sessionId, {
      type: 'user.message',
      session_thread_id: response.session_thread_id,
      content: [{ type: 'text', text: JSON.stringify(context) }],
    });
  }

  return response;
}

/**
 * Send a wake event to an existing Managed Agent session.
 * Uses the proper beta SDK method: client.beta.sessions.events.send()
 *
 * @param {string} sessionId — the session to wake
 * @param {object} event     — the event payload (must include type + content)
 * @returns {Promise<object>} the API response
 */
export async function sendSessionEvent(sessionId, event) {
  const client = getAnthropicClient();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.beta.sessions.events.send(sessionId, {
        events: [event],
      });
      return response;
    } catch (err) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000));
      else throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Thread-aware messaging helpers
// ---------------------------------------------------------------------------

/**
 * Send a message to a specific thread within a coordinator session.
 *
 * @param {string} sessionId   — the coordinator session id
 * @param {string} toThreadId  — the target session_thread_id
 * @param {string|object} content — text string or structured content
 * @returns {Promise<object>} the API response
 */
export async function sendThreadMessage(sessionId, toThreadId, content) {
  const contentBlocks = typeof content === 'string'
    ? [{ type: 'text', text: content }]
    : Array.isArray(content) ? content : [{ type: 'text', text: JSON.stringify(content) }];

  return sendSessionEvent(sessionId, {
    type: 'user.message',
    session_thread_id: toThreadId,
    content: contentBlocks,
  });
}

/**
 * Retrieve a session, including its current status and metadata.
 *
 * @param {string} sessionId — the session to query
 * @returns {Promise<object>} session object including status, metadata, usage
 */
export async function getSessionThreads(sessionId) {
  const client = getAnthropicClient();
  return client.beta.sessions.retrieve(sessionId);
}

/**
 * Stream events from a session in real-time.
 * Returns an async iterable of server-sent events.
 *
 * @param {string} sessionId — the session to stream from
 * @returns {Promise<Stream>} SSE stream of session events
 */
export async function streamSessionEvents(sessionId) {
  const client = getAnthropicClient();
  return client.beta.sessions.events.stream(sessionId);
}
