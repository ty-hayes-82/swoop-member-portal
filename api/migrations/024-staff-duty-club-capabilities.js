/**
 * Migration 024: staff duty roster + club capability config
 *
 * staff_duty        — who is explicitly clocked in at each club right now
 * club_capability_config — permanent per-club toggles for which features are enabled
 *
 * Run: POST /api/migrations/024-staff-duty-club-capabilities
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const run = async (label, query) => {
    try {
      await query;
      results.push({ step: label, status: 'ok' });
    } catch (e) {
      results.push({ step: label, status: 'error', message: e.message });
    }
  };

  // -------------------------------------------------------------------------
  // staff_duty
  // -------------------------------------------------------------------------
  await run('create_staff_duty', sql`
    CREATE TABLE IF NOT EXISTS staff_duty (
      id           BIGSERIAL PRIMARY KEY,
      club_id      TEXT        NOT NULL,
      user_id      TEXT        NOT NULL,
      role         TEXT        NOT NULL,
      started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at     TIMESTAMPTZ,
      session_token TEXT
    )
  `);

  await run('idx_staff_duty_active_user', sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_duty_active_user
    ON staff_duty (club_id, user_id)
    WHERE ended_at IS NULL
  `);

  await run('idx_staff_duty_active_club', sql`
    CREATE INDEX IF NOT EXISTS idx_staff_duty_active_club
    ON staff_duty (club_id)
    WHERE ended_at IS NULL
  `);

  // -------------------------------------------------------------------------
  // club_capability_config
  // -------------------------------------------------------------------------
  await run('create_club_capability_config', sql`
    CREATE TABLE IF NOT EXISTS club_capability_config (
      club_id     TEXT        NOT NULL,
      capability  TEXT        NOT NULL,
      enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by  TEXT,
      PRIMARY KEY (club_id, capability)
    )
  `);

  const ok = results.every(r => r.status === 'ok');
  return res.status(ok ? 200 : 207).json({ results });
}
