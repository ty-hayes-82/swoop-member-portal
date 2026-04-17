/**
 * Migration 025: backfill club_id on pos_checks rows seeded without it.
 *
 * Sets club_id on pos_checks rows where outlet_id matches a known club's dining_outlets.
 * Safe to run multiple times (WHERE clause skips rows already populated).
 *
 * Run: POST /api/migrations/025-backfill-pos-checks-club-id
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const run = async (label, query) => {
    try {
      const r = await query;
      results.push({ step: label, status: 'ok', rowCount: r.rowCount ?? 0 });
    } catch (e) {
      results.push({ step: label, status: 'error', message: e.message });
    }
  };

  await run('backfill_pos_checks_club_id', sql`
    UPDATE pos_checks pc
    SET    club_id = do.club_id
    FROM   dining_outlets do
    WHERE  pc.outlet_id = do.outlet_id
      AND  pc.club_id IS NULL
  `);

  const ok = results.every(r => r.status === 'ok');
  return res.status(ok ? 200 : 207).json({ results });
}
