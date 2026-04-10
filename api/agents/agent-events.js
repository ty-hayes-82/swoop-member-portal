/**
 * api/agents/agent-events.js
 *
 * Event bus that routes inter-agent notifications.
 * Each event type maps to a handler that finds the relevant active session
 * and sends a wake event to it.
 *
 * Event types:
 *   concierge_booking    → Staffing-Demand agent (demand changed)
 *   member_re_engaged    → Member Risk agent (positive signal)
 *   complaint_filed_by_concierge → Service Recovery agent
 *   booking_cancelled    → Staffing-Demand + Game Plan
 *   fb_intelligence_update → Staffing-Demand (confidence calibration from F&B analysis)
 */
import { sql } from '@vercel/postgres';
import { sendSessionEvent } from './managed-config.js';

// ---------------------------------------------------------------------------
// Find active session for a given agent playbook
// ---------------------------------------------------------------------------

async function findActiveSession(clubId, playbookId, memberId) {
  const filter = memberId
    ? await sql`
        SELECT run_id, agent_session_id FROM playbook_runs
        WHERE club_id = ${clubId} AND playbook_id = ${playbookId}
          AND member_id = ${memberId} AND status = 'active'
        ORDER BY started_at DESC LIMIT 1
      `
    : await sql`
        SELECT run_id, agent_session_id FROM playbook_runs
        WHERE club_id = ${clubId} AND playbook_id = ${playbookId}
          AND status = 'active'
        ORDER BY started_at DESC LIMIT 1
      `;
  return filter.rows[0] || null;
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleConciergeBooking(clubId, event) {
  const session = await findActiveSession(clubId, 'staffing-demand');
  if (!session) return { delivered: false, reason: 'no_active_staffing_session' };

  if (!session.agent_session_id?.startsWith('sim_')) {
    await sendSessionEvent(session.agent_session_id, {
      type: 'user.message',
      content: JSON.stringify({
        event_type: 'concierge_booking',
        booking_type: event.booking_type,
        date: event.date,
        party_size: event.party_size || 1,
        member_id: event.member_id,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  return { delivered: true, target_agent: 'staffing-demand', session_id: session.agent_session_id };
}

async function handleMemberReEngaged(clubId, event) {
  const session = await findActiveSession(clubId, 'member-risk-lifecycle', event.member_id);
  if (!session) return { delivered: false, reason: 'no_active_risk_session' };

  if (!session.agent_session_id?.startsWith('sim_')) {
    await sendSessionEvent(session.agent_session_id, {
      type: 'user.message',
      content: JSON.stringify({
        event_type: 'member_re_engaged',
        member_id: event.member_id,
        action: event.action,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  return { delivered: true, target_agent: 'member-risk-lifecycle', session_id: session.agent_session_id };
}

async function handleComplaintFiledByConcierge(clubId, event) {
  const session = await findActiveSession(clubId, 'service-recovery', event.member_id);
  if (!session) return { delivered: false, reason: 'no_active_service_recovery_session' };

  if (!session.agent_session_id?.startsWith('sim_')) {
    await sendSessionEvent(session.agent_session_id, {
      type: 'user.message',
      content: JSON.stringify({
        event_type: 'complaint_filed_by_concierge',
        member_id: event.member_id,
        description: event.description,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  return { delivered: true, target_agent: 'service-recovery', session_id: session.agent_session_id };
}

async function handleFbIntelligenceUpdate(clubId, event) {
  const session = await findActiveSession(clubId, 'staffing-demand');
  if (!session) return { delivered: false, reason: 'no_active_staffing_session' };

  if (!session.agent_session_id?.startsWith('sim_')) {
    await sendSessionEvent(session.agent_session_id, {
      type: 'user.message',
      content: JSON.stringify({
        event_type: 'fb_intelligence_update',
        date: event.date,
        actual_covers: event.actual_covers,
        forecast_accuracy: event.forecast_accuracy,
        post_round_conversion_rate: event.post_round_conversion_rate,
        non_diner_count: event.non_diner_count,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  return { delivered: true, target_agent: 'staffing-demand', session_id: session.agent_session_id };
}

async function handleBookingCancelled(clubId, event) {
  const results = [];

  const staffingSession = await findActiveSession(clubId, 'staffing-demand');
  if (staffingSession) {
    if (!staffingSession.agent_session_id?.startsWith('sim_')) {
      await sendSessionEvent(staffingSession.agent_session_id, {
        type: 'user.message',
        content: JSON.stringify({
          event_type: 'booking_cancelled',
          booking_type: event.booking_type,
          date: event.date,
          member_id: event.member_id,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    results.push({ target_agent: 'staffing-demand', delivered: true });
  }

  const gamePlanSession = await findActiveSession(clubId, 'tomorrows-game-plan');
  if (gamePlanSession) {
    if (!gamePlanSession.agent_session_id?.startsWith('sim_')) {
      await sendSessionEvent(gamePlanSession.agent_session_id, {
        type: 'user.message',
        content: JSON.stringify({
          event_type: 'booking_cancelled',
          booking_type: event.booking_type,
          date: event.date,
          member_id: event.member_id,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    results.push({ target_agent: 'tomorrows-game-plan', delivered: true });
  }

  return { deliveries: results, count: results.length };
}

// ---------------------------------------------------------------------------
// Event router
// ---------------------------------------------------------------------------

const EVENT_HANDLERS = {
  concierge_booking: handleConciergeBooking,
  member_re_engaged: handleMemberReEngaged,
  complaint_filed_by_concierge: handleComplaintFiledByConcierge,
  booking_cancelled: handleBookingCancelled,
  fb_intelligence_update: handleFbIntelligenceUpdate,
};

/**
 * Route an event to the appropriate agent handler(s).
 *
 * @param {string} clubId
 * @param {string} eventType - one of: concierge_booking, member_re_engaged, complaint_filed_by_concierge, booking_cancelled
 * @param {object} event - event payload
 * @returns {Promise<object>} delivery result
 */
export async function routeEvent(clubId, eventType, event) {
  const handler = EVENT_HANDLERS[eventType];
  if (!handler) {
    return { error: `Unknown event type: ${eventType}`, delivered: false };
  }
  return handler(clubId, event);
}

export { findActiveSession, EVENT_HANDLERS };
