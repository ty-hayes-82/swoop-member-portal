/**
 * Migration 024: Event Bus Table
 *
 * Creates the event_bus table for persisting inter-agent routing events.
 * Referenced by api/agents/agent-events.js persistEvent() since migration 020
 * but never created — all cross-agent event routing was silently failing the
 * persistence step (caught in try-catch). This fixes that.
 *
 * Events routed here include:
 *   - booking_request_submitted  (concierge → pro shop / front desk)
 *   - complaint_filed_by_concierge (concierge → service recovery)
 *   - member_re_engaged          (concierge → member risk lifecycle)
 *   - booking_cancelled          (concierge → staffing demand)
 *   - fb_intelligence_update     (F&B agent → staffing demand)
 *   - proactive_outreach_sent    (member risk lifecycle → logging)
 */

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const results = [];

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS event_bus (
        event_id     BIGSERIAL    PRIMARY KEY,
        club_id      TEXT         NOT NULL,
        event_type   TEXT         NOT NULL,
        source_agent TEXT,
        member_id    TEXT,
        payload      JSONB        NOT NULL DEFAULT '{}',
        thread_id    TEXT,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_event_bus_club_type
        ON event_bus (club_id, event_type, created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_event_bus_member
        ON event_bus (club_id, member_id, created_at DESC)
    `;
    results.push({ table: 'event_bus', status: 'ok' });
  } catch (err) {
    results.push({ table: 'event_bus', status: 'error', error: err.message });
  }

  const allOk = results.every(r => r.status === 'ok');
  return res.status(allOk ? 200 : 500).json({ migration: '024-event-bus', results });
}
