/**
 * api/concierge/confirm-action.js
 *
 * Staff confirmation webhook — closes the human-in-the-loop booking loop.
 *
 * When staff confirm or deny a member request in the source system
 * (tee sheet, POS, Jonas), they POST here with the request_id.
 * This writes a confirmation_received event to the member's session,
 * enabling the concierge to answer "was my request confirmed?" with
 * specifics instead of re-routing to staff.
 *
 * POST /api/concierge/confirm-action
 *   Body: {
 *     request_id: string,       -- the RQ-/req_tt_/req_dr_ ID from the booking tool
 *     member_id: string,
 *     status: 'confirmed' | 'denied' | 'modified',
 *     text?: string,            -- human-readable confirmation text to send member
 *     details?: object,         -- any additional details (modified time, etc.)
 *   }
 *   Auth: gm, assistant_gm, head_pro, fb_director, dining_room_manager, membership_director, swoop_admin
 *
 * Also writes a confirmation_received event to agent_session_events
 * (universal session log) for downstream analyst visibility.
 */

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { emitConciergeEvent, sendMemberConfirmation } from '../agents/concierge-session.js';
import { emitAgentEvent } from '../agents/session-core.js';

async function confirmActionHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { request_id, member_id, status = 'confirmed', text, details = {} } = req.body;

  if (!request_id || !member_id) {
    return res.status(400).json({ error: 'request_id and member_id are required' });
  }
  if (!['confirmed', 'denied', 'modified'].includes(status)) {
    return res.status(400).json({ error: 'status must be confirmed, denied, or modified' });
  }

  const confirmedBy = req.auth?.userId || 'staff';
  const confirmationText = text || `Your request ${request_id} has been ${status}.`;

  // 1. Update activity_log entry
  try {
    await sql`
      UPDATE activity_log
      SET status = ${status === 'confirmed' ? 'staff_confirmed' : status === 'denied' ? 'staff_rejected' : 'staff_modified'},
          meta = COALESCE(meta, '{}'::jsonb)
            || ${JSON.stringify({ confirmed_by: confirmedBy, confirmed_at: new Date().toISOString(), status, text: confirmationText, ...details })}::jsonb
      WHERE reference_id = ${request_id}
    `;
  } catch (e) {
    console.warn('[confirm-action] activity_log update failed:', e.message);
  }

  // 2. Write confirmation_received event to member's concierge session
  const eventType = status === 'confirmed' ? 'staff_confirmed'
    : status === 'denied' ? 'staff_rejected'
    : 'staff_modified';

  try {
    await emitConciergeEvent(member_id, clubId, {
      type: eventType,
      text: confirmationText,
      request_id,
      confirmed_by: confirmedBy,
      details,
    });
  } catch (e) {
    console.warn('[confirm-action] emitConciergeEvent failed:', e.message);
  }

  // 3. Dual-write to universal agent session log
  emitAgentEvent(`mbr_${member_id}_concierge`, clubId, {
    type: 'confirmation_received',
    request_id,
    status,
    text: confirmationText,
    confirmed_by: confirmedBy,
    details,
    source_agent: 'staff_confirmation',
  }).catch(() => {});

  // 4. Deliver SMS confirmation to member (dry-run in dev)
  let delivery = { sent: false, dry_run: true };
  try {
    const memberResult = await sql`
      SELECT phone FROM members WHERE member_id = ${member_id} AND club_id = ${clubId}
    `;
    const phone = memberResult.rows[0]?.phone || null;
    if (status === 'confirmed') {
      delivery = await sendMemberConfirmation(clubId, member_id, phone, confirmationText);
    }
  } catch (e) {
    console.warn('[confirm-action] SMS delivery failed:', e.message);
  }

  return res.status(200).json({
    ok: true,
    request_id,
    member_id,
    status,
    event_written: eventType,
    sms_delivered: delivery.sent || delivery.dry_run,
  });
}

export default withAuth(confirmActionHandler, {
  roles: ['gm', 'assistant_gm', 'head_pro', 'fb_director', 'dining_room_manager', 'membership_director', 'swoop_admin'],
});
