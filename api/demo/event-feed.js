/**
 * GET /api/demo/event-feed
 *
 * Multi-session event stream for the demo routing animation.
 * Returns events across all demo sessions since a given timestamp, merged and
 * sorted by created_at. The frontend polls this at 2-second intervals to
 * animate the cascade from member → analyst → staff role inboxes.
 *
 * Query params:
 *   since          ISO timestamp — only return events after this point
 *   correlation_id Optional — narrow to a single cascade (one trigger fire)
 *   include_history Boolean (default false) — include historical seeded events
 *
 * Response:
 *   {
 *     events: [{ session_id, session_label, session_type, event_type, payload, created_at }],
 *     latest_at: string,   // timestamp of the newest event returned
 *     count: number,
 *   }
 *
 * Auth: x-demo-key header or any authenticated staff role.
 */

import { sql } from '@vercel/postgres';

// ---------------------------------------------------------------------------
// Demo session registry — matches constants in api/demo/trigger.js
// ---------------------------------------------------------------------------

const DEMO_CLUB_ID = 'seed_pinetree';

const DEMO_SESSIONS = [
  { id: 'mbr_mbr_t01_concierge',                    label: 'James Whitfield',         type: 'member' },
  { id: 'gm_usr_sarah_gm_concierge',                 label: 'Sarah Mitchell (GM)',      type: 'gm' },
  { id: 'staff_usr_maya_fb_director',                label: 'Maya Chen (F&B Director)', type: 'staff' },
  { id: 'staff_usr_headpro_head_pro',                label: 'Head Pro',                 type: 'staff' },
  { id: 'staff_usr_membership_dir_membership_director', label: 'Membership Director',   type: 'staff' },
  { id: `service_recovery_${DEMO_CLUB_ID}`,          label: 'Service Recovery Agent',   type: 'analyst' },
  { id: `revenue_analyst_${DEMO_CLUB_ID}`,           label: 'Revenue Analyst',          type: 'analyst' },
  { id: `member_pulse_${DEMO_CLUB_ID}`,              label: 'Member Pulse Agent',        type: 'analyst' },
  { id: 'mbr_mbr_t05_concierge',                     label: 'Robert Callahan',          type: 'member' },
];

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function isAuthorized(req) {
  const demoKey = req.headers['x-demo-key'];
  if (demoKey && process.env.DEMO_SECRET && demoKey === process.env.DEMO_SECRET) return true;
  if (req.auth?.role && ['gm', 'assistant_gm', 'fb_director', 'head_pro', 'swoop_admin'].includes(req.auth.role)) return true;
  if (process.env.NODE_ENV !== 'production' && !process.env.DEMO_SECRET) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_ENDPOINTS) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { since, correlation_id, include_history } = req.query;
  const includeHistory = include_history === 'true' || include_history === '1';

  // Default `since` to 30 seconds ago if not provided (catches live events without
  // returning the full seeded history unless explicitly requested).
  const sinceTs = since
    ? new Date(since)
    : includeHistory
      ? new Date(0)
      : new Date(Date.now() - 30 * 1000);

  const sessionIds = DEMO_SESSIONS.map(s => s.id);
  const sessionLabelMap = Object.fromEntries(DEMO_SESSIONS.map(s => [s.id, { label: s.label, type: s.type }]));

  try {
    let rows;

    if (correlation_id) {
      // Narrow to a single cascade
      const r = await sql`
        SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
        FROM agent_session_events
        WHERE session_id = ANY(${sessionIds})
          AND correlation_id = ${correlation_id}
        ORDER BY created_at ASC
        LIMIT 100
      `;
      rows = r.rows;
    } else {
      const r = await sql`
        SELECT event_id, session_id, event_type, payload, source_agent, created_at, correlation_id
        FROM agent_session_events
        WHERE session_id = ANY(${sessionIds})
          AND created_at > ${sinceTs.toISOString()}
        ORDER BY created_at ASC
        LIMIT 200
      `;
      rows = r.rows;
    }

    const events = rows.map(row => ({
      event_id:      row.event_id,
      session_id:    row.session_id,
      session_label: sessionLabelMap[row.session_id]?.label || row.session_id,
      session_type:  sessionLabelMap[row.session_id]?.type || 'unknown',
      event_type:    row.event_type,
      payload:       row.payload,
      source_agent:  row.source_agent,
      correlation_id: row.correlation_id,
      created_at:    row.created_at,
    }));

    const latest_at = events.length > 0
      ? events[events.length - 1].created_at
      : new Date().toISOString();

    return res.status(200).json({
      events,
      latest_at,
      count: events.length,
    });
  } catch (err) {
    console.error('[demo/event-feed] error:', err);
    return res.status(500).json({ error: err.message, events: [], count: 0 });
  }
}
