/**
 * GET /api/agents/session-events
 *
 * HTTP endpoint exposing the universal agent_session_events log to the frontend.
 * Used by the demo routing animation feed to poll for new events across all
 * sessions in a club, enabling the live "watch agents route in real time" demo.
 *
 * Query params:
 *   club_id   — required (or derived from auth session)
 *   since     — ISO timestamp, only return events after this (for polling)
 *   session_id — optional, filter to a single session
 *   limit     — default 20, max 100
 *
 * GET /api/agents/session-events?club_id=seed_pinetree&since=2026-04-16T12:00:00Z
 *
 * Auth: demo endpoints pass club_id directly; authenticated requests use session club.
 */

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

async function sessionEventsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  // Allow demo mode (no auth) via explicit club_id param
  const isDemoRequest = !req.auth && req.query.club_id;
  const clubId = isDemoRequest ? req.query.club_id : getReadClubId(req);

  const { since, session_id, include_bus, limit = '20' } = req.query;
  const maxLimit = Math.min(parseInt(limit, 10) || 20, 100);

  try {
    let rows;

    if (session_id && since) {
      const r = await sql`
        SELECT e.event_id, e.session_id, e.event_type, e.payload, e.source_agent,
               e.created_at, e.correlation_id,
               s.session_type, s.owner_id
        FROM agent_session_events e
        LEFT JOIN agent_sessions s ON s.session_id = e.session_id
        WHERE s.club_id = ${clubId}
          AND e.session_id = ${session_id}
          AND e.created_at > ${since}
        ORDER BY e.created_at ASC
        LIMIT ${maxLimit}
      `;
      rows = r.rows;
    } else if (session_id) {
      const r = await sql`
        SELECT e.event_id, e.session_id, e.event_type, e.payload, e.source_agent,
               e.created_at, e.correlation_id,
               s.session_type, s.owner_id
        FROM agent_session_events e
        LEFT JOIN agent_sessions s ON s.session_id = e.session_id
        WHERE s.club_id = ${clubId}
          AND e.session_id = ${session_id}
        ORDER BY e.created_at DESC
        LIMIT ${maxLimit}
      `;
      rows = r.rows;
    } else if (since) {
      const r = await sql`
        SELECT e.event_id, e.session_id, e.event_type, e.payload, e.source_agent,
               e.created_at, e.correlation_id,
               s.session_type, s.owner_id
        FROM agent_session_events e
        LEFT JOIN agent_sessions s ON s.session_id = e.session_id
        WHERE s.club_id = ${clubId}
          AND e.created_at > ${since}
        ORDER BY e.created_at ASC
        LIMIT ${maxLimit}
      `;
      rows = r.rows;
    } else {
      const r = await sql`
        SELECT e.event_id, e.session_id, e.event_type, e.payload, e.source_agent,
               e.created_at, e.correlation_id,
               s.session_type, s.owner_id
        FROM agent_session_events e
        LEFT JOIN agent_sessions s ON s.session_id = e.session_id
        WHERE s.club_id = ${clubId}
        ORDER BY e.created_at DESC
        LIMIT ${maxLimit}
      `;
      rows = r.rows;
    }

    // Shape events for frontend consumption: normalize payload to a flat object
    const events = rows.map(row => ({
      id: row.event_id?.toString(),
      sessionId: row.session_id,
      sessionType: row.session_type,
      ownerId: row.owner_id,
      eventType: row.event_type,
      sourceAgent: row.source_agent,
      correlationId: row.correlation_id,
      createdAt: row.created_at,
      payload: row.payload || {},
      // Convenience fields for UI display
      label: labelForEvent(row.event_type, row.payload),
      sessionLabel: labelForSession(row.session_id, row.payload),
      priority: row.payload?.priority || null,
    }));

    // Optionally include event_bus rows (cross-agent routing events)
    if (include_bus) {
      try {
        const busQuery = since
          ? await sql`SELECT event_id, club_id, event_type, source_agent, member_id, payload, thread_id, created_at FROM event_bus WHERE club_id = ${clubId} AND created_at > ${since} ORDER BY created_at ASC LIMIT ${maxLimit}`
          : await sql`SELECT event_id, club_id, event_type, source_agent, member_id, payload, thread_id, created_at FROM event_bus WHERE club_id = ${clubId} ORDER BY created_at DESC LIMIT ${maxLimit}`;
        const busEvents = busQuery.rows.map(row => ({
          id: `bus_${row.event_id}`,
          sessionId: row.thread_id || `bus_${clubId}`,
          sessionType: 'event_bus',
          ownerId: row.member_id || row.source_agent,
          eventType: row.event_type,
          sourceAgent: row.source_agent,
          correlationId: null,
          createdAt: row.created_at,
          payload: row.payload || {},
          label: labelForEvent(row.event_type, row.payload),
          sessionLabel: row.source_agent || 'Event Bus',
          priority: row.payload?.priority || null,
        }));
        events.push(...busEvents);
        events.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } catch (_) { /* event_bus table may not exist yet */ }
    }

    return res.status(200).json({
      events,
      count: events.length,
      club_id: clubId,
      latest_at: events[events.length - 1]?.createdAt || null,
    });
  } catch (err) {
    // Table may not exist yet in dev — return empty rather than crashing
    if (/does not exist|relation/.test(err.message)) {
      return res.status(200).json({ events: [], count: 0, club_id: clubId, latest_at: null });
    }
    console.error('[session-events] error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function labelForEvent(eventType, payload = {}) {
  switch (eventType) {
    // Canonical names (new)
    case 'user.message':              return `Message: ${(payload.text || '').slice(0, 60)}`;
    case 'agent.message':             return `Agent replied`;
    case 'agent.custom_tool_use':     return `Tool: ${payload.tool || 'unknown'}`;
    case 'agent.custom_tool_result':  return `Request submitted — ${payload.request_type || 'unknown'}`;
    case 'user.custom_tool_result':   return `Confirmed by staff`;
    case 'agent.thread_message_received': return payload.summary?.slice(0, 60) || 'Recommendation received';
    // Legacy names
    case 'user_message':              return `Message: ${(payload.text || '').slice(0, 60)}`;
    case 'agent_response':            return `Agent replied`;
    case 'tool_call':                 return `Tool: ${payload.tool || 'unknown'}`;
    case 'request_submitted':         return `Request submitted — ${payload.request_type || 'unknown'}`;
    case 'staff_notified':            return `Staff notified`;
    case 'staff_confirmed':           return `Confirmed by staff`;
    case 'staff_rejected':            return `Rejected by staff`;
    case 'recommendation_received':   return payload.summary || payload.recommendation?.slice(0, 60) || 'Recommendation received';
    case 'preference_observed':       return `Preference: ${payload.field || ''} = ${payload.value || ''}`;
    case 'outcome_tracked':           return `Outcome: ${payload.outcome || 'tracked'}`;
    default:                          return eventType.replace(/[._]/g, ' ');
  }
}

function labelForSession(sessionId, payload = {}) {
  if (payload.member_name) return payload.member_name;
  if (sessionId?.startsWith('mbr_')) return sessionId.replace('mbr_', 'Member ').replace('_concierge', '');
  if (sessionId?.startsWith('gm_')) return 'GM';
  if (sessionId?.startsWith('staff_maya')) return 'Maya Chen (F&B Director)';
  if (sessionId?.startsWith('staff_head_pro')) return 'Head Pro';
  if (sessionId?.startsWith('service_recovery')) return 'Service Recovery';
  if (sessionId?.startsWith('member_pulse')) return 'Member Pulse';
  if (sessionId?.startsWith('revenue_analyst')) return 'Revenue Analyst';
  return sessionId;
}

// Auth: allow authenticated club users OR demo pass-through (club_id in query)
export default async function handler(req, res) {
  // Demo pass-through: no auth needed if club_id provided explicitly
  if (req.query.club_id && !req.headers.authorization) {
    return sessionEventsHandler(req, res);
  }
  return withAuth(sessionEventsHandler, { allowDemo: true })(req, res);
}
