/**
 * api/agents/agent-events.js
 *
 * Event bus that routes inter-agent notifications.
 * Each event type maps to a handler that finds the relevant active session
 * and sends a wake event to it.
 *
 * Thread-aware: when a playbook_run has a session_thread_id, events are
 * routed to that specific thread via routeToThread(). Otherwise they go
 * to the session's main thread.
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
import { sendSessionEvent, sendThreadMessage } from './managed-config.js';

// ---------------------------------------------------------------------------
// Thread lifecycle logging
// ---------------------------------------------------------------------------

/**
 * Log a thread lifecycle event (created, idle, message_sent) to agent_activity.
 */
async function logThreadEvent(clubId, eventType, details) {
  try {
    await sql`
      INSERT INTO agent_activity (club_id, agent_id, action_type, description, phase, reasoning)
      VALUES (
        ${clubId},
        'agent-events',
        ${eventType},
        ${`Thread event: ${eventType}`},
        'thread-lifecycle',
        ${JSON.stringify(details)}
      )
    `;
  } catch (err) {
    console.error(`[agent-events] Failed to log thread event ${eventType}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Route event to a specific thread within a coordinator session
// ---------------------------------------------------------------------------

/**
 * Route a domain event to a specific thread in a coordinator session.
 * Logs agent.thread_message_sent for observability.
 *
 * @param {string} sessionId — the coordinator session id
 * @param {string} threadId  — the target session_thread_id
 * @param {object} event     — the domain event payload
 * @param {string} [clubId]  — optional club id for logging
 * @returns {Promise<object>} the API response
 */
export async function routeToThread(sessionId, threadId, event, clubId) {
  const result = await sendThreadMessage(sessionId, threadId, event);

  if (clubId) {
    await logThreadEvent(clubId, 'agent.thread_message_sent', {
      session_id: sessionId,
      thread_id: threadId,
      event_type: event.event_type || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a proper user.message event with content blocks.
 * Optionally targets a specific thread via session_thread_id.
 */
function buildUserMessage(payload, threadId) {
  const event = {
    type: 'user.message',
    content: [{ type: 'text', text: JSON.stringify(payload) }],
  };
  if (threadId) event.session_thread_id = threadId;
  return event;
}

/**
 * Send a domain event to a session, routing to a thread if available.
 * Logs agent.thread_message_sent when a thread is targeted.
 */
async function deliverEvent(session, payload, clubId) {
  if (session.agent_session_id?.startsWith('sim_')) return;

  if (session.session_thread_id) {
    await routeToThread(session.agent_session_id, session.session_thread_id, payload, clubId);
  } else {
    await sendSessionEvent(session.agent_session_id, buildUserMessage(payload));
  }
}

// ---------------------------------------------------------------------------
// Find active session for a given agent playbook
// ---------------------------------------------------------------------------

async function findActiveSession(clubId, playbookId, memberId) {
  const filter = memberId
    ? await sql`
        SELECT run_id, agent_session_id, session_thread_id FROM playbook_runs
        WHERE club_id = ${clubId} AND playbook_id = ${playbookId}
          AND member_id = ${memberId} AND status = 'active'
        ORDER BY started_at DESC LIMIT 1
      `
    : await sql`
        SELECT run_id, agent_session_id, session_thread_id FROM playbook_runs
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

  await deliverEvent(session, {
    event_type: 'concierge_booking',
    booking_type: event.booking_type,
    date: event.date,
    party_size: event.party_size || 1,
    member_id: event.member_id,
    timestamp: new Date().toISOString(),
  }, clubId);

  return { delivered: true, target_agent: 'staffing-demand', session_id: session.agent_session_id, session_thread_id: session.session_thread_id };
}

async function handleMemberReEngaged(clubId, event) {
  const session = await findActiveSession(clubId, 'member-risk-lifecycle', event.member_id);
  if (!session) return { delivered: false, reason: 'no_active_risk_session' };

  await deliverEvent(session, {
    event_type: 'member_re_engaged',
    member_id: event.member_id,
    action: event.action,
    timestamp: new Date().toISOString(),
  }, clubId);

  return { delivered: true, target_agent: 'member-risk-lifecycle', session_id: session.agent_session_id, session_thread_id: session.session_thread_id };
}

async function handleComplaintFiledByConcierge(clubId, event) {
  const results = { delivered_to_session: false, complaint_trigger_fired: false };

  // 1. Deliver to active service-recovery session if one exists
  const session = await findActiveSession(clubId, 'service-recovery', event.member_id);
  if (session) {
    await deliverEvent(session, {
      event_type: 'complaint_filed_by_concierge',
      member_id: event.member_id,
      description: event.description,
      priority: event.priority || 'medium',
      category: event.category || null,
      timestamp: new Date().toISOString(),
    }, clubId);

    results.delivered_to_session = true;
    results.target_agent = 'service-recovery';
    results.session_id = session.agent_session_id;
    results.session_thread_id = session.session_thread_id;
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

  await deliverEvent(session, {
    event_type: 'fb_intelligence_update',
    date: event.date,
    actual_covers: event.actual_covers,
    forecast_accuracy: event.forecast_accuracy,
    post_round_conversion_rate: event.post_round_conversion_rate,
    non_diner_count: event.non_diner_count,
    timestamp: new Date().toISOString(),
  }, clubId);

  return { delivered: true, target_agent: 'staffing-demand', session_id: session.agent_session_id, session_thread_id: session.session_thread_id };
}

async function handleBookingCancelled(clubId, event) {
  const results = [];
  const payload = {
    event_type: 'booking_cancelled',
    booking_type: event.booking_type,
    date: event.date,
    member_id: event.member_id,
    timestamp: new Date().toISOString(),
  };

  const staffingSession = await findActiveSession(clubId, 'staffing-demand');
  if (staffingSession) {
    await deliverEvent(staffingSession, payload, clubId);
    results.push({ target_agent: 'staffing-demand', delivered: true });
  }

  const gamePlanSession = await findActiveSession(clubId, 'tomorrows-game-plan');
  if (gamePlanSession) {
    await deliverEvent(gamePlanSession, payload, clubId);
    results.push({ target_agent: 'tomorrows-game-plan', delivered: true });
  }

  return { deliveries: results, count: results.length };
}

async function handleProactiveOutreachSent(clubId, event) {
  // Notify the Member Risk agent that proactive outreach was sent to a member.
  // This is a positive signal — the concierge is actively engaging the member.
  const session = await findActiveSession(clubId, 'member-risk-lifecycle', event.member_id);
  if (!session) return { delivered: false, reason: 'no_active_risk_session' };

  await deliverEvent(session, {
    event_type: 'proactive_outreach_sent',
    member_id: event.member_id,
    outreach_type: event.outreach_type || 'general',
    message_preview: event.message_preview || null,
    channel: event.channel || 'concierge',
    timestamp: new Date().toISOString(),
  }, clubId);

  return { delivered: true, target_agent: 'member-risk-lifecycle', session_id: session.agent_session_id, session_thread_id: session.session_thread_id };
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
/**
 * Persist a publish event to the durable event_bus table BEFORE dispatch.
 * Append-only audit + replay source for downstream agents (CoS dedup,
 * flywheel calibration, sweep context). Failures here log and continue —
 * we never block the in-memory delivery on a persistence error.
 */
async function persistEvent(clubId, eventType, event) {
  try {
    const memberId = event?.member_id || event?.memberId || null;
    const sourceAgent = event?.source_agent || event?.sourceAgent || null;
    const threadId = event?.session_thread_id || event?.thread_id || null;
    await sql`
      INSERT INTO event_bus (club_id, event_type, source_agent, member_id, payload, thread_id)
      VALUES (${clubId}, ${eventType}, ${sourceAgent}, ${memberId}, ${JSON.stringify(event || {})}::jsonb, ${threadId})
    `;
  } catch (err) {
    console.warn(`[agent-events] persistEvent(${eventType}) failed:`, err.message);
  }
}

export async function routeEvent(clubId, eventType, event) {
  // Persist FIRST so the audit row exists even if delivery fails. Phase A
  // of the agent framework plan: durability for the in-memory bus.
  await persistEvent(clubId, eventType, event);

  const handler = EVENT_HANDLERS[eventType];
  if (!handler) {
    console.warn(`[agent-events] Unknown event type: ${eventType}`);
    return { error: `Unknown event type: ${eventType}`, delivered: false, persisted: true };
  }
  try {
    const result = await handler(clubId, event);
    return { ...result, persisted: true };
  } catch (err) {
    console.error(`[agent-events] Event handler failed for ${eventType}:`, err.message);
    return { delivered: false, error: err.message, event_type: eventType, persisted: true };
  }
}

/**
 * Read recent events from the bus for a club. Used by sweep / cos-dedup /
 * flywheel aggregator. Returns rows in reverse-chronological order.
 */
export async function readRecentEvents(clubId, { sinceHours = 24, eventType = null, memberId = null, limit = 200 } = {}) {
  try {
    if (eventType && memberId) {
      const r = await sql`
        SELECT event_id, event_type, source_agent, member_id, payload, thread_id, created_at
        FROM event_bus
        WHERE club_id = ${clubId}
          AND created_at >= NOW() - (${sinceHours} || ' hours')::interval
          AND event_type = ${eventType}
          AND member_id = ${memberId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return r.rows;
    }
    if (eventType) {
      const r = await sql`
        SELECT event_id, event_type, source_agent, member_id, payload, thread_id, created_at
        FROM event_bus
        WHERE club_id = ${clubId}
          AND created_at >= NOW() - (${sinceHours} || ' hours')::interval
          AND event_type = ${eventType}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return r.rows;
    }
    if (memberId) {
      const r = await sql`
        SELECT event_id, event_type, source_agent, member_id, payload, thread_id, created_at
        FROM event_bus
        WHERE club_id = ${clubId}
          AND created_at >= NOW() - (${sinceHours} || ' hours')::interval
          AND member_id = ${memberId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return r.rows;
    }
    const r = await sql`
      SELECT event_id, event_type, source_agent, member_id, payload, thread_id, created_at
      FROM event_bus
      WHERE club_id = ${clubId}
        AND created_at >= NOW() - (${sinceHours} || ' hours')::interval
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return r.rows;
  } catch (err) {
    console.warn('[agent-events] readRecentEvents failed:', err.message);
    return [];
  }
}

export { findActiveSession, EVENT_HANDLERS };
