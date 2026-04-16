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

// ---------------------------------------------------------------------------
// Durable event log (Sprint B: member_concierge_events)
// ---------------------------------------------------------------------------

/**
 * Emit an event to the member's durable concierge event log.
 * Session ID convention: mbr_{memberId}_concierge — permanent, never rotated.
 *
 * @param {string} memberId
 * @param {string} clubId
 * @param {object} event - { type, ...payload }
 */
export async function emitConciergeEvent(memberId, clubId, event) {
  const sessionId = `mbr_${memberId}_concierge`;
  try {
    await sql`
      INSERT INTO member_concierge_events (session_id, club_id, event_type, payload)
      VALUES (${sessionId}, ${clubId}, ${event.type}, ${JSON.stringify(event)}::jsonb)
    `;
  } catch (err) {
    // Table may not exist yet — log and continue without blocking the concierge
    console.warn('[concierge-session] emitConciergeEvent failed (table missing?):', err.message);
  }
}

/**
 * Read events from the member's durable concierge event log.
 *
 * @param {string} memberId
 * @param {object} opts - { last?: number, types?: string[], since?: Date }
 * @returns {Promise<object[]>} event rows
 */
export async function getConciergeEvents(memberId, { last = 20, types = null, since = null } = {}) {
  const sessionId = `mbr_${memberId}_concierge`;
  try {
    if (types && types.length > 0 && since) {
      const r = await sql`
        SELECT id, event_type, payload, emitted_at
        FROM member_concierge_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types}) AND emitted_at >= ${since}
        ORDER BY emitted_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    if (types && types.length > 0) {
      const r = await sql`
        SELECT id, event_type, payload, emitted_at
        FROM member_concierge_events
        WHERE session_id = ${sessionId} AND event_type = ANY(${types})
        ORDER BY emitted_at DESC LIMIT ${last}
      `;
      return r.rows;
    }
    const r = await sql`
      SELECT id, event_type, payload, emitted_at
      FROM member_concierge_events
      WHERE session_id = ${sessionId}
      ORDER BY emitted_at DESC LIMIT ${last}
    `;
    return r.rows;
  } catch (err) {
    console.warn('[concierge-session] getConciergeEvents failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Member confirmation delivery (Sprint A: booking confirmation loop)
// ---------------------------------------------------------------------------

/**
 * Send a confirmation message back to a member via Twilio (or dry-run log).
 * Called by the booking_request_submitted event handler after simulating
 * staff confirmation.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @param {string|null} phone - member phone number (null = dry-run only)
 * @param {string} text - confirmation message text
 */
export async function sendMemberConfirmation(clubId, memberId, phone, text) {
  const isDryRun = process.env.SMS_DRY_RUN === 'true' || !phone;

  // Always emit to the durable event log
  await emitConciergeEvent(memberId, clubId, {
    type: 'staff_confirmed',
    text,
    delivered_via: isDryRun ? 'dry_run' : 'sms',
  });

  // Update session summary so the next concierge turn knows the request was confirmed
  try {
    await sql`
      UPDATE member_concierge_sessions
      SET conversation_summary = ${`[Staff confirmed]: ${text}`}, last_active = NOW()
      WHERE club_id = ${clubId} AND member_id = ${memberId}
    `;
  } catch (_) { /* session may not exist yet */ }

  if (isDryRun) {
    console.log(`[concierge-session] DRY RUN confirmation → ${memberId}: ${text}`);
    return { sent: false, dry_run: true, text };
  }

  // Live SMS via Twilio
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      body: text,
      from: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: phone,
    });
    return { sent: true, sid: msg.sid, text };
  } catch (err) {
    console.warn('[concierge-session] Twilio send failed:', err.message);
    return { sent: false, error: err.message, text };
  }
}
