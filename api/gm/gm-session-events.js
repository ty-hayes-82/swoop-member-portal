/**
 * api/gm/gm-session-events.js
 *
 * Foundational GM session event log. Every GM decision, approval, override,
 * dismissal, threshold setting, and briefing delivery is written here as an
 * immutable append-only event.
 *
 * This enables:
 *   - Morning briefings (query events since last session)
 *   - Preference learning (pattern detection over GM approvals/dismissals)
 *   - Board-level audit (why was $4K comped to the Jordans?)
 *   - GM concierge context window (what has the GM acted on recently?)
 *
 * Table schema (migration 024, created lazily on first write if absent):
 *   id              BIGSERIAL PRIMARY KEY
 *   gm_id           TEXT NOT NULL        -- user_id of the GM
 *   club_id         UUID NOT NULL
 *   event_type      TEXT NOT NULL        -- see EVENT_TYPES below
 *   payload         JSONB DEFAULT '{}'
 *   related_request_id TEXT              -- links back to concierge request_id
 *   created_at      TIMESTAMPTZ DEFAULT NOW()
 *
 * POST /api/gm/gm-session-events
 *   Body: { event_type, payload, related_request_id? }
 *   Auth: GM or assistant_gm only
 *
 * GET /api/gm/gm-session-events?since=&limit=&types=
 *   Returns events for the authenticated GM's club
 */

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

export const EVENT_TYPES = [
  'approval',           // GM approved a recommendation
  'override',           // GM overrode an agent recommendation
  'dismissal',          // GM dismissed a recommendation
  'threshold_set',      // GM set an auto-approve threshold
  'preference_observed',// Inferred preference from behavior pattern
  'briefing_delivered', // Morning briefing was delivered to this GM
  'note_added',         // GM added a freeform note
];

// ---------------------------------------------------------------------------
// Core write/read functions (used by other API routes)
// ---------------------------------------------------------------------------

/**
 * Emit a GM session event.
 *
 * @param {string} gmId - GM user_id
 * @param {string} clubId
 * @param {object} event - { type, payload?, related_request_id? }
 * @returns {Promise<string|null>} event id
 */
export async function emitGmEvent(gmId, clubId, event) {
  const { type, payload = {}, related_request_id = null } = event;
  try {
    const r = await sql`
      INSERT INTO gm_session_events (gm_id, club_id, event_type, payload, related_request_id)
      VALUES (${gmId}, ${clubId}, ${type}, ${JSON.stringify(payload)}::jsonb, ${related_request_id})
      RETURNING id
    `;
    return r.rows[0]?.id?.toString() || null;
  } catch (err) {
    if (/does not exist/.test(err.message)) {
      // Table missing — attempt lazy creation then retry once
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS gm_session_events (
            id              BIGSERIAL PRIMARY KEY,
            gm_id           TEXT NOT NULL,
            club_id         UUID NOT NULL,
            event_type      TEXT NOT NULL,
            payload         JSONB DEFAULT '{}',
            related_request_id TEXT,
            created_at      TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        await sql`CREATE INDEX IF NOT EXISTS idx_gm_session_events_gm_club ON gm_session_events(gm_id, club_id, created_at DESC)`;
        const r2 = await sql`
          INSERT INTO gm_session_events (gm_id, club_id, event_type, payload, related_request_id)
          VALUES (${gmId}, ${clubId}, ${type}, ${JSON.stringify(payload)}::jsonb, ${related_request_id})
          RETURNING id
        `;
        return r2.rows[0]?.id?.toString() || null;
      } catch (e2) {
        console.warn('[gm-session-events] lazy create failed:', e2.message);
      }
    } else {
      console.warn('[gm-session-events] emitGmEvent failed:', err.message);
    }
    return null;
  }
}

/**
 * Read GM session events.
 *
 * @param {string} gmId
 * @param {string} clubId
 * @param {object} opts - { since?, types?, limit? }
 * @returns {Promise<object[]>}
 */
export async function getGmEvents(gmId, clubId, { since = null, types = null, limit = 50 } = {}) {
  try {
    if (types?.length && since) {
      const r = await sql`
        SELECT id, event_type, payload, related_request_id, created_at
        FROM gm_session_events
        WHERE gm_id = ${gmId} AND club_id = ${clubId}
          AND event_type = ANY(${types})
          AND created_at >= ${since}
        ORDER BY created_at DESC LIMIT ${limit}
      `;
      return r.rows;
    }
    if (types?.length) {
      const r = await sql`
        SELECT id, event_type, payload, related_request_id, created_at
        FROM gm_session_events
        WHERE gm_id = ${gmId} AND club_id = ${clubId}
          AND event_type = ANY(${types})
        ORDER BY created_at DESC LIMIT ${limit}
      `;
      return r.rows;
    }
    if (since) {
      const r = await sql`
        SELECT id, event_type, payload, related_request_id, created_at
        FROM gm_session_events
        WHERE gm_id = ${gmId} AND club_id = ${clubId}
          AND created_at >= ${since}
        ORDER BY created_at DESC LIMIT ${limit}
      `;
      return r.rows;
    }
    const r = await sql`
      SELECT id, event_type, payload, related_request_id, created_at
      FROM gm_session_events
      WHERE gm_id = ${gmId} AND club_id = ${clubId}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
    return r.rows;
  } catch (err) {
    console.warn('[gm-session-events] getGmEvents failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// HTTP handler
// ---------------------------------------------------------------------------

async function gmSessionEventsHandler(req, res) {
  const clubId = getReadClubId(req);
  const gmId = req.auth?.userId;

  if (req.method === 'POST') {
    const { event_type, payload = {}, related_request_id } = req.body;
    if (!event_type) return res.status(400).json({ error: 'event_type required' });
    if (!EVENT_TYPES.includes(event_type)) {
      return res.status(400).json({ error: `Invalid event_type. Must be one of: ${EVENT_TYPES.join(', ')}` });
    }
    const id = await emitGmEvent(gmId, clubId, { type: event_type, payload, related_request_id });
    return res.status(201).json({ id, event_type, recorded: true });
  }

  if (req.method === 'GET') {
    const { since, limit = '50', types } = req.query;
    const typeList = types ? types.split(',').map(t => t.trim()) : null;
    const events = await getGmEvents(gmId, clubId, {
      since: since || null,
      types: typeList,
      limit: Math.min(parseInt(limit, 10) || 50, 200),
    });
    return res.status(200).json({ events, count: events.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(gmSessionEventsHandler, { roles: ['gm', 'assistant_gm', 'swoop_admin'] });
