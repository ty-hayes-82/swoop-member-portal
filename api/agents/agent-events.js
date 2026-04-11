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
 *   proactive_outreach_sent → Member Risk agent (positive engagement signal)
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
  const results = { delivered_to_session: false, complaint_trigger_fired: false };

  // 1. Deliver to active service-recovery session if one exists
  const session = await findActiveSession(clubId, 'service-recovery', event.member_id);
  if (session) {
    if (!session.agent_session_id?.startsWith('sim_')) {
      await sendSessionEvent(session.agent_session_id, {
        type: 'user.message',
        content: JSON.stringify({
          event_type: 'complaint_filed_by_concierge',
          member_id: event.member_id,
          description: event.description,
          priority: event.priority || 'medium',
          category: event.category || null,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    results.delivered_to_session = true;
    results.target_agent = 'service-recovery';
    results.session_id = session.agent_session_id;
  }

  // 2. Also fire the complaint-trigger to potentially create a new playbook run
  //    (the trigger has its own idempotency guard, so double-firing is safe)
  try {
    const { evaluateComplaintTrigger } = await import('./complaint-trigger.js');
    const evaluation = await evaluateComplaintTrigger(
      event.member_id,
      clubId,
      event.priority || 'medium',
    );
    results.complaint_trigger_fired = true;
    results.trigger_evaluation = {
      should_trigger: evaluation.shouldTrigger,
      reason: evaluation.reason,
      repeat_complainant: evaluation.repeatComplainant || false,
    };
  } catch (triggerErr) {
    console.error('[agent-events] complaint-trigger evaluation failed:', triggerErr.message);
    results.complaint_trigger_fired = false;
    results.trigger_error = triggerErr.message;
  }

  return { delivered: results.delivered_to_session || results.complaint_trigger_fired, ...results };
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

async function handleProactiveOutreachSent(clubId, event) {
  // Notify the Member Risk agent that proactive outreach was sent to a member.
  // This is a positive signal — the concierge is actively engaging the member.
  const session = await findActiveSession(clubId, 'member-risk-lifecycle', event.member_id);
  if (!session) return { delivered: false, reason: 'no_active_risk_session' };

  if (!session.agent_session_id?.startsWith('sim_')) {
    await sendSessionEvent(session.agent_session_id, {
      type: 'user.message',
      content: JSON.stringify({
        event_type: 'proactive_outreach_sent',
        member_id: event.member_id,
        outreach_type: event.outreach_type || 'general',
        message_preview: event.message_preview || null,
        channel: event.channel || 'concierge',
        timestamp: new Date().toISOString(),
      }),
    });
  }

  return { delivered: true, target_agent: 'member-risk-lifecycle', session_id: session.agent_session_id };
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
  proactive_outreach_sent: handleProactiveOutreachSent,
};

/**
 * Route an event to the appropriate agent handler(s).
 *
 * Wrapped in try/catch so that a bridge/event failure never breaks the
 * calling concierge response — the member experience is always protected.
 *
 * @param {string} clubId
 * @param {string} eventType - one of: concierge_booking, member_re_engaged, complaint_filed_by_concierge, booking_cancelled, proactive_outreach_sent
 * @param {object} event - event payload
 * @returns {Promise<object>} delivery result
 */
export async function routeEvent(clubId, eventType, event) {
  const handler = EVENT_HANDLERS[eventType];
  if (!handler) {
    console.warn(`[agent-events] Unknown event type: ${eventType}`);
    return { error: `Unknown event type: ${eventType}`, delivered: false };
  }
  try {
    const result = await handler(clubId, event);
    return result;
  } catch (err) {
    console.error(`[agent-events] Event handler failed for ${eventType}:`, err.message);
    return { delivered: false, error: err.message, event_type: eventType };
  }
}

export { findActiveSession, EVENT_HANDLERS };
