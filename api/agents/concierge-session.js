/**
 * api/agents/concierge-session.js
 *
 * Helper to create or resume a member's persistent concierge session.
 * Each member gets one session per club (upserted on club_id + member_id).
 */
import { sql } from '@vercel/postgres';

/**
 * Get or create a concierge session for a member.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @returns {Promise<object>} session row
 */
export async function getOrCreateSession(clubId, memberId) {
  // Try to find existing session
  const existing = await sql`
    SELECT session_id, club_id, member_id, last_active, preferences_cache, conversation_summary, created_at
    FROM member_concierge_sessions
    WHERE club_id = ${clubId} AND member_id = ${memberId}
  `;

  if (existing.rows.length > 0) {
    // Touch last_active
    await sql`
      UPDATE member_concierge_sessions SET last_active = NOW()
      WHERE club_id = ${clubId} AND member_id = ${memberId}
    `;
    return existing.rows[0];
  }

  // Create new session
  const sessionId = `csess_${clubId}_${memberId}_${Date.now()}`;
  const result = await sql`
    INSERT INTO member_concierge_sessions (session_id, club_id, member_id)
    VALUES (${sessionId}, ${clubId}, ${memberId})
    ON CONFLICT (club_id, member_id) DO UPDATE SET last_active = NOW()
    RETURNING session_id, club_id, member_id, last_active, preferences_cache, conversation_summary, created_at
  `;

  return result.rows[0];
}

/**
 * Update the conversation summary for a session.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @param {string} summary
 */
export async function updateSessionSummary(clubId, memberId, summary) {
  await sql`
    UPDATE member_concierge_sessions
    SET conversation_summary = ${summary}, last_active = NOW()
    WHERE club_id = ${clubId} AND member_id = ${memberId}
  `;
}

/**
 * Update cached preferences for a session.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @param {object} preferences
 */
export async function updateSessionPreferences(clubId, memberId, preferences) {
  await sql`
    UPDATE member_concierge_sessions
    SET preferences_cache = ${JSON.stringify(preferences)}, last_active = NOW()
    WHERE club_id = ${clubId} AND member_id = ${memberId}
  `;
}
