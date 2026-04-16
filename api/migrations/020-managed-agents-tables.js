/**
 * Migration 020: Managed Agents tables
 *
 * Adds:
 *   - member_concierge_events  — durable per-member event log (Sprint B)
 *   - club_credentials         — encrypted vendor token vault (Sprint C)
 *
 * Run via: GET /api/migrations/020-managed-agents-tables
 */

import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

export default withAuth(async (req, res) => {
  const results = [];

  // ── member_concierge_events ──────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS member_concierge_events (
        id          BIGSERIAL PRIMARY KEY,
        session_id  TEXT        NOT NULL,
        club_id     UUID        NOT NULL,
        event_type  TEXT        NOT NULL,
        payload     JSONB       NOT NULL DEFAULT '{}',
        emitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mce_session_time
      ON member_concierge_events (session_id, emitted_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mce_session_type
      ON member_concierge_events (session_id, event_type)`;
    results.push({ table: 'member_concierge_events', status: 'ok' });
  } catch (err) {
    results.push({ table: 'member_concierge_events', status: 'error', error: err.message });
  }

  // ── club_credentials ─────────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS club_credentials (
        club_id     UUID        NOT NULL,
        vendor      TEXT        NOT NULL,
        token_enc   TEXT        NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (club_id, vendor)
      )
    `;
    results.push({ table: 'club_credentials', status: 'ok' });
  } catch (err) {
    results.push({ table: 'club_credentials', status: 'error', error: err.message });
  }

  const allOk = results.every(r => r.status === 'ok');
  return res.status(allOk ? 200 : 207).json({ migration: '020', results });
}, { requireAdmin: true });
