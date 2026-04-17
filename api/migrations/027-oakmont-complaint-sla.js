/**
 * Migration 027: set sla_hours on Oakmont open complaints.
 *
 * Complaints copied from feedback (migration 026) have NULL sla_hours,
 * which prevents the service_recovery autonomous agent from generating
 * proposals. Set a 72-hour SLA on all Oakmont open complaints so the
 * agent can detect aging tickets.
 *
 * Safe to run multiple times (WHERE sla_hours IS NULL guard).
 *
 * Run: POST /api/migrations/027-oakmont-complaint-sla
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

  await run('set_sla_hours', sql`
    UPDATE complaints
    SET sla_hours = 72
    WHERE club_id = 'oakmont_cc'
      AND status = 'open'
      AND sla_hours IS NULL
  `);

  const ok = results.every(r => r.status === 'ok');
  return res.status(ok ? 200 : 207).json({ results });
}
