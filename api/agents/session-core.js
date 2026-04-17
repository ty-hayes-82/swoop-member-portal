/**
 * api/agents/session-core.js
 *
 * Universal session primitive for both Identity and Analyst agents.
 * Implements the Managed Agents pattern: stateless harness, durable event log.
 *
 * Every agent in the platform — member concierge, GM concierge, staff agents,
 * revenue analyst, service recovery — uses this same interface.
 *
 * Session ID conventions:
 *   Identity:  mbr_{memberId}_concierge | gm_{userId}_concierge | staff_{userId}_agent
 *   Analyst:   revenue_analyst_{clubId} | service_recovery_{clubId} | member_pulse_{clubId}
 *
 * Existing per-type tables (member_concierge_events, gm_concierge_events) are
 * preserved as-is during migration. New agents write directly to agent_session_events.
 * Migration path: backfill existing events into agent_session_events in a future sprint.
 */
import { sql } from '@vercel/postgres';

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

/**
 * Get or create a session for any agent type.
 *
 * @param {string} sessionId  - Canonical ID (e.g. 'mbr_t01_concierge')
 * @param {string} sessionType - 'identity' | 'analyst'
 * @param {string} ownerId    - user_id, member_id, or analyst_name
 * @param {string} clubId     - UUID
 * @returns {Promise<object>} session row
 */
export async function getOrCreateAgentSession(sessionId, sessionType, ownerId, clubId) {
  try {
    await sql`
      INSERT INTO agent_sessions (session_id, session_type, owner_id, club_id)
      VALUES (${sessionId}, ${sessionType}, ${ownerId}, ${clubId})
      ON CONFLICT (session_id) DO UPDATE SET last_active = NOW()
    `;
    const r = await sql`
      SELECT session_id, session_type, owner_id, club_id, created_at, last_active, status
      FROM agent_sessions WHERE session_id = ${sessionId}
    `;
    return r.rows[0] || { session_id: sessionId, session_type: sessionType, owner_id: ownerId, club_id: clubId };
  } catch (err) {
    console.warn('[session-core] getOrCreateAgentSession failed (table missing?):', err.message);
    return { session_id: sessionId, session_type: sessionType, owner_id: ownerId, club_id: clubId };
  }
}

// ---------------------------------------------------------------------------
// Event log — the core primitive
// ---------------------------------------------------------------------------

/**
 * Emit an event to the universal session event log.
 *
 * @param {string} sessionId
 * @param {string} clubId
 * @param {object} event - { type, source_agent?, correlation_id?, ...payload }
 */
export async function emitAgentEvent(sessionId, clubId, event) {
  const { type, source_agent = null, correlation_id = null, ...payload } = event;
  try {
    await sql`
      INSERT INTO agent_session_events (session_id, event_type, payload, source_agent, correlation_id)
      VALUES (${sessionId}, ${type}, ${JSON.stringify({ type, ...payload })}::jsonb, ${source_agent}, ${correlation_id})
    `;
  } catch (err) {
    console.warn('[session-core] emitAgentEvent failed (table missing?):', err.message);
  }
}

/**
 * Read events from the universal session event log.
 * Returns events newest-first by default so callers can take `last: N` efficiently.
 *
 * @param {string} sessionId
 * @param {object} opts - { last?, types?, since?, correlation_id? }
 * @returns {Promise<object[]>}
 */
export async function getAgentEvents(sessionId, { last = 20, types = null, since = null, correlation_id = null } = {}) {
  try {
    if (correlation_id) {
      const r = await sql`
        SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
        FROM agent_session_events
        WHERE correlation_id = ${correlation_id}
        ORDER BY created_at ASC LIMIT ${last}
      `;
      return r.rows;
    }
    if (types?.length && since) {
      const r = await sql`
        SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
        FROM agent_session_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types}) AND created_at >= ${since}
        ORDER BY created_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    if (types?.length) {
      const r = await sql`
        SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
        FROM agent_session_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types})
        ORDER BY created_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    const r = await sql`
      SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
      FROM agent_session_events
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC LIMIT ${last}
    `;
    return r.rows;
  } catch (err) {
    console.warn('[session-core] getAgentEvents failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cross-session handoffs
// ---------------------------------------------------------------------------

/**
 * Record a handoff from one session to another.
 * Used when analyst agents route recommendations to identity agents,
 * or when identity agents delegate to specialist brains.
 *
 * @param {object} handoff - { sourceSessionId, targetSessionId, recommendationEventId?, correlationId? }
 * @returns {Promise<string>} handoff_id
 */
export async function createHandoff(handoff) {
  const handoffId = `hndoff_${Date.now().toString(36)}`;
  try {
    await sql`
      INSERT INTO agent_handoffs (handoff_id, source_session_id, target_session_id, recommendation_event_id)
      VALUES (${handoffId}, ${handoff.sourceSessionId}, ${handoff.targetSessionId}, ${handoff.recommendationEventId || null})
    `;
  } catch (err) {
    console.warn('[session-core] createHandoff failed:', err.message);
  }
  return handoffId;
}

/**
 * Update a handoff status (accepted, acted, confirmed, rejected).
 */
export async function updateHandoff(handoffId, status, outcome = null) {
  try {
    await sql`
      UPDATE agent_handoffs
      SET status = ${status},
          confirmed_at = ${status === 'confirmed' ? new Date().toISOString() : null},
          outcome = ${outcome ? JSON.stringify(outcome) : null}::jsonb
      WHERE handoff_id = ${handoffId}
    `;
  } catch (err) {
    console.warn('[session-core] updateHandoff failed:', err.message);
  }
}

/**
 * Get pending handoffs targeting a session (tasks waiting for this agent/human).
 */
export async function getPendingHandoffs(targetSessionId) {
  try {
    const r = await sql`
      SELECT handoff_id, source_session_id, recommendation_event_id, status, created_at
      FROM agent_handoffs
      WHERE target_session_id = ${targetSessionId} AND status IN ('pending', 'accepted')
      ORDER BY created_at DESC LIMIT 20
    `;
    return r.rows;
  } catch (err) {
    console.warn('[session-core] getPendingHandoffs failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Convenience: session-aware event format (for context assembly in harness)
// ---------------------------------------------------------------------------

/**
 * Format an event slice as readable context for injection into a system prompt.
 * Used by assembleAgentCall() to hydrate context from the event log.
 *
 * @param {object[]} events - from getAgentEvents()
 * @returns {string}
 */
export function formatEventSliceAsContext(events) {
  if (!events?.length) return '';
  const lines = events
    .slice()
    .reverse()
    .map(ev => {
      const ts = ev.created_at ? new Date(ev.created_at).toISOString().slice(0, 16) : '';
      const p = ev.payload || {};
      switch (ev.event_type) {
        // Canonical names (new)
        case 'user.message':              return `[${ts}] Member: ${p.text || ''}`;
        case 'agent.message':             return `[${ts}] Agent: ${(p.text || '').slice(0, 200)}`;
        case 'agent.custom_tool_use':     return `[${ts}] Tool: ${p.tool}(${JSON.stringify(p.args || {})}) → ${p.status || 'ok'}`;
        case 'agent.custom_tool_result':  return `[${ts}] PENDING: ${p.request_id} via ${p.request_type} → ${p.routed_to}`;
        case 'user.custom_tool_result':   return `[${ts}] CONFIRMED: ${p.text || p.details || ''}`;
        case 'agent.thread_message_received': return `[${ts}] RECOMMENDATION: ${p.summary || ''}`;
        // Legacy names (kept for existing rows)
        case 'user_message':              return `[${ts}] Member: ${p.text || ''}`;
        case 'agent_response':            return `[${ts}] Agent: ${(p.text || '').slice(0, 200)}`;
        case 'tool_call':                 return `[${ts}] Tool: ${p.tool}(${JSON.stringify(p.args || {})}) → ${p.status || 'ok'}`;
        case 'request_submitted':         return `[${ts}] PENDING: ${p.request_id} via ${p.request_type} → ${p.routed_to}`;
        case 'staff_confirmed':           return `[${ts}] CONFIRMED: ${p.text || ''}`;
        case 'staff_rejected':            return `[${ts}] REJECTED: ${p.reason || ''}`;
        case 'recommendation_received':   return `[${ts}] RECOMMENDATION: ${p.summary || ''}`;
        case 'preference_observed':       return `[${ts}] Preference: ${p.field} = ${p.value} (confidence: ${p.confidence || '?'})`;
        case 'outcome_tracked':           return `[${ts}] Outcome: ${p.description || ''}`;
        default: return `[${ts}] ${ev.event_type}: ${JSON.stringify(p).slice(0, 100)}`;
      }
    });
  return lines.join('\n');
}
