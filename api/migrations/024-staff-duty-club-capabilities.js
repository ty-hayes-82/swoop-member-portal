/**
 * Migration 024: club capability config
 *
 * club_capability_config — per-club permanent toggles for which features are enabled.
 * All capabilities default to enabled; GMs opt-out specific ones.
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
