/**
 * api/agents/gm-session.js
 *
 * GM concierge session — durable per-GM event log.
 * Each GM gets one session per club, accumulating every decision,
 * delegation, approval, dismissal, and learned preference over their tenure.
 *
 * Session ID convention: gm_{userId}_concierge — permanent, never rotated.
 * Tables: gm_concierge_sessions, gm_concierge_events (created by migration 021)
 */
import { sql } from '@vercel/postgres';

const GM_EVENT_TYPES = [
  'decision_made',       // GM approval, override, or dismissal
  'pattern_observed',    // Communication style, triage order, threshold behavior
  'briefing_delivered',  // What concierge surfaced; what GM engaged with
  'agent_delegated',     // Tool call to one of the 7 agents
  'outcome_tracked',     // What happened after a GM decision
  'preference_observed', // Inferred preference from repeated GM behavior
];

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function getOrCreateGmSession(clubId, userId) {
  try {
    const existing = await sql`
      SELECT session_id, club_id, user_id, last_active, created_at
      FROM gm_concierge_sessions
      WHERE club_id = ${clubId} AND user_id = ${userId}
    `;
    if (existing.rows.length > 0) {
      await sql`
        UPDATE gm_concierge_sessions SET last_active = NOW()
        WHERE club_id = ${clubId} AND user_id = ${userId}
      `;
      return existing.rows[0];
    }

    const sessionId = `gm_${userId}_concierge`;
    const result = await sql`
      INSERT INTO gm_concierge_sessions (session_id, club_id, user_id)
      VALUES (${sessionId}, ${clubId}, ${userId})
      ON CONFLICT (club_id, user_id) DO UPDATE SET last_active = NOW()
      RETURNING session_id, club_id, user_id, last_active, created_at
    `;
    return result.rows[0];
  } catch (err) {
    console.warn('[gm-session] getOrCreateGmSession failed (table missing?):', err.message);
    return { session_id: `gm_${userId}_concierge`, club_id: clubId, user_id: userId };
  }
}

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

/**
 * Emit an event to the GM's durable session log.
 *
 * @param {string} userId
 * @param {string} clubId
 * @param {object} event - { type, ...payload }
 */
export async function emitGmEvent(userId, clubId, event) {
  const sessionId = `gm_${userId}_concierge`;
  try {
    await sql`
      INSERT INTO gm_concierge_events (session_id, club_id, event_type, payload)
      VALUES (${sessionId}, ${clubId}, ${event.type}, ${JSON.stringify(event)}::jsonb)
    `;
  } catch (err) {
    console.warn('[gm-session] emitGmEvent failed (table missing?):', err.message);
  }
}

/**
 * Read events from the GM's session log.
 *
 * @param {string} userId
 * @param {object} opts - { last?, types?, since? }
 */
export async function getGmEvents(userId, { last = 20, types = null, since = null } = {}) {
  const sessionId = `gm_${userId}_concierge`;
  try {
    if (types?.length && since) {
      const r = await sql`
        SELECT id, event_type, payload, emitted_at
        FROM gm_concierge_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types}) AND emitted_at >= ${since}
        ORDER BY emitted_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    if (types?.length) {
      const r = await sql`
        SELECT id, event_type, payload, emitted_at
        FROM gm_concierge_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types})
        ORDER BY emitted_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    const r = await sql`
      SELECT id, event_type, payload, emitted_at
      FROM gm_concierge_events
      WHERE session_id = ${sessionId}
      ORDER BY emitted_at DESC LIMIT ${last}
    `;
    return r.rows;
  } catch (err) {
    console.warn('[gm-session] getGmEvents failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Preference learning — observe repeated GM behavior and emit preference events
// ---------------------------------------------------------------------------

/**
 * Record a GM decision and check if it reveals a preference pattern.
 * Called from Operations Center when a GM approves/dismisses an action.
 *
 * @param {string} userId
 * @param {string} clubId
 * @param {object} decision - { action_type, threshold?, outcome, context }
 */
export async function recordGmDecision(userId, clubId, decision) {
  await emitGmEvent(userId, clubId, {
    type: 'decision_made',
    action_type: decision.action_type,
    threshold: decision.threshold,
    outcome: decision.outcome,
    context: decision.context,
    timestamp: new Date().toISOString(),
  });

  // Check for emerging pattern: if GM has made 3+ decisions of same type,
  // emit a preference_observed event summarizing the pattern
  try {
    const recentSame = await getGmEvents(userId, {
      last: 10,
      types: ['decision_made'],
    });
    const matchingDecisions = recentSame.filter(
      e => e.payload?.action_type === decision.action_type
    );
    if (matchingDecisions.length >= 3) {
      const outcomes = matchingDecisions.map(e => e.payload?.outcome);
      const dominantOutcome = outcomes.sort((a, b) =>
        outcomes.filter(v => v === a).length - outcomes.filter(v => v === b).length
      ).pop();
      await emitGmEvent(userId, clubId, {
        type: 'preference_observed',
        field: decision.action_type,
        pattern: `GM consistently chooses "${dominantOutcome}" for ${decision.action_type}`,
        evidence_count: matchingDecisions.length,
        confidence: matchingDecisions.length >= 5 ? 0.9 : 0.7,
        source: 'behavior_pattern',
      });
    }
  } catch (_) { /* non-blocking */ }
}

/**
 * Get inferred GM preferences from session event log.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} preference events
 */
export async function getGmPreferences(userId) {
  return getGmEvents(userId, { types: ['preference_observed'], last: 50 });
}
