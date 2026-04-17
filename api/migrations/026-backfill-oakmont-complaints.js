/**
 * Migration 026: backfill complaints for Oakmont CC.
 *
 * The Oakmont seed inserted into feedback but not complaints.
 * Copy feedback rows for oakmont_cc into the complaints table.
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 *
 * Run: POST /api/migrations/026-backfill-oakmont-complaints
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

  await run('copy_feedback_to_complaints', sql`
    INSERT INTO complaints (complaint_id, club_id, member_id, category, description, status, reported_at, resolved_at)
    SELECT
      'cmp_' || feedback_id,
      club_id,
      member_id,
      category,
      description,
      status,
      submitted_at,
      resolved_at
    FROM feedback
    WHERE club_id = 'oakmont_cc'
    ON CONFLICT (complaint_id) DO NOTHING
  `);

  const ok = results.every(r => r.status === 'ok');
  return res.status(ok ? 200 : 207).json({ results });
}
