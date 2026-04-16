/**
 * Migration 021: GM Concierge session tables
 *
 * Adds:
 *   - gm_concierge_sessions — per-GM durable session (one per GM per club)
 *   - gm_concierge_events   — append-only GM event log (decisions, delegations, preferences)
 *
 * Run via: GET /api/migrations/021-gm-session-tables
 */

import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

export default withAuth(async (req, res) => {
  const results = [];

  // ── gm_concierge_sessions ────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS gm_concierge_sessions (
        session_id  TEXT        PRIMARY KEY,
        club_id     UUID        NOT NULL,
        user_id     TEXT        NOT NULL,
        last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (club_id, user_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_gcs_club_user
      ON gm_concierge_sessions (club_id, user_id)`;
    results.push({ table: 'gm_concierge_sessions', status: 'ok' });
  } catch (err) {
    results.push({ table: 'gm_concierge_sessions', status: 'error', error: err.message });
  }

  // ── gm_concierge_events ──────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS gm_concierge_events (
        id          BIGSERIAL   PRIMARY KEY,
        session_id  TEXT        NOT NULL,
        club_id     UUID        NOT NULL,
        event_type  TEXT        NOT NULL,
        payload     JSONB       NOT NULL DEFAULT '{}',
        emitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_gce_session_time
      ON gm_concierge_events (session_id, emitted_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gce_session_type
      ON gm_concierge_events (session_id, event_type)`;
    results.push({ table: 'gm_concierge_events', status: 'ok' });
  } catch (err) {
    results.push({ table: 'gm_concierge_events', status: 'error', error: err.message });
  }

  const allOk = results.every(r => r.status === 'ok');
  return res.status(allOk ? 200 : 207).json({ migration: '021', results });
}, { requireAdmin: true });
