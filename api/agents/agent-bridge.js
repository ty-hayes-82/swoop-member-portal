/**
 * api/agents/agent-bridge.js
 *
 * The bridge that connects member concierge actions to club-side agents.
 * After any concierge write operation (book_tee_time, make_dining_reservation,
 * rsvp_event), this module:
 *
 *   1. Checks if the member is at-risk (health_score < 50) → notifies Member Risk agent
 *   2. Checks staffing impact (large party, busy date) → notifies Staffing-Demand agent
 *   3. Checks for open complaints → flags for Game Plan agent
 *   4. Logs to agent_activity with phase='agent-bridge'
 */
import { sql } from '@vercel/postgres';
import { routeEvent } from './agent-events.js';

/**
 * Load a member's profile for bridge decisions.
 */
async function getMemberForBridge(memberId, clubId) {
  const result = await sql`
    SELECT member_id, first_name, last_name, health_score, health_tier, annual_dues
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;
  return result.rows[0] || null;
}

/**
 * Check if a member has any open complaints.
 */
async function hasOpenComplaints(memberId, clubId) {
  const result = await sql`
    SELECT COUNT(*)::int AS cnt FROM feedback
    WHERE member_id = ${memberId} AND club_id = ${clubId} AND status != 'resolved'
  `;
  return Number(result.rows[0]?.cnt ?? 0) > 0;
}

/**
 * Log an agent_activity entry for bridge actions.
 */
async function logBridgeActivity(clubId, actionType, description, memberId, details) {
  const result = await sql`
    INSERT INTO agent_activity (club_id, agent_id, action_type, description, member_id, phase, reasoning)
    VALUES (${clubId}, 'agent-bridge', ${actionType}, ${description}, ${memberId || null}, 'agent-bridge', ${details || null})
    RETURNING activity_id
  `;
  return result.rows[0]?.activity_id;
}

/**
 * Notify club agents after a concierge write operation.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @param {object} action - { type: 'book_tee_time'|'make_dining_reservation'|'rsvp_event'|'cancel_booking', details: {...} }
 * @returns {Promise<object>} summary of notifications sent
 */
export async function notifyClubAgents(clubId, memberId, action) {
  const notifications = [];

  // Load member profile
  const member = await getMemberForBridge(memberId, clubId);
  if (!member) {
    return { notifications: [], error: 'member_not_found' };
  }

  const healthScore = member.health_score != null ? Number(member.health_score) : null;
  const memberName = `${member.first_name} ${member.last_name}`.trim();

  // 1. At-risk member re-engagement → Member Risk agent
  if (healthScore !== null && healthScore < 50) {
    const result = await routeEvent(clubId, 'member_re_engaged', {
      member_id: memberId,
      action: action.type,
      health_score: healthScore,
    });
    notifications.push({ type: 'member_re_engaged', ...result });
  }

  // 2. Staffing impact → Staffing-Demand agent
  const isStaffingRelevant =
    action.type === 'make_dining_reservation' ||
    action.type === 'book_tee_time' ||
    action.type === 'rsvp_event';

  if (isStaffingRelevant) {
    const partySize = action.details?.party_size || action.details?.player_count || action.details?.guest_count || 1;
    const result = await routeEvent(clubId, 'concierge_booking', {
      booking_type: action.type,
      date: action.details?.date || action.details?.booking_date || action.details?.reservation_date,
      party_size: partySize,
      member_id: memberId,
    });
    notifications.push({ type: 'concierge_booking', ...result });
  }

  // 3. Open complaints → flag for Game Plan
  const complaintsOpen = await hasOpenComplaints(memberId, clubId);
  if (complaintsOpen) {
    notifications.push({
      type: 'complaint_flag',
      flagged: true,
      message: `${memberName} has open complaint(s) — priority service recommended`,
    });
  }

  // 4. Cancellation → Staffing-Demand + Game Plan
  if (action.type === 'cancel_booking') {
    const result = await routeEvent(clubId, 'booking_cancelled', {
      booking_type: action.details?.booking_type || 'unknown',
      date: action.details?.date,
      member_id: memberId,
    });
    notifications.push({ type: 'booking_cancelled', ...result });
  }

  // 5. Log bridge activity
  const activityId = await logBridgeActivity(
    clubId,
    'concierge_booking',
    `Concierge ${action.type} by ${memberName} → ${notifications.length} notification(s)`,
    memberId,
    JSON.stringify({ action: action.type, notifications: notifications.length, at_risk: healthScore !== null && healthScore < 50, has_complaints: complaintsOpen }),
  );

  return {
    activity_id: activityId,
    member_name: memberName,
    health_score: healthScore,
    at_risk: healthScore !== null && healthScore < 50,
    has_open_complaints: complaintsOpen,
    notifications,
  };
}

export { getMemberForBridge, hasOpenComplaints, logBridgeActivity };
