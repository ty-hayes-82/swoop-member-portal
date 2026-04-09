// api/cron/purge-cross-club-audit.js
//
// Nightly retention purge for the cross_club_audit table (created by
// SEC-2 / migration 015). Deletes rows older than RETENTION_DAYS to cap
// growth without losing the recent forensic window. CRON_SECRET-gated;
// fail-closed if the secret isn't set.
//
// Schedule: vercel.json registers this at 0 4 * * * (4 AM UTC daily).
// 4 AM UTC = 12 AM ET = quiet hours for US clubs, and runs 1 hour after
// the weather-daily cron so the two don't contend for DB connections.

import { sql } from '@vercel/postgres';
import { logError, logInfo, logWarn } from '../lib/logger.js';

const RETENTION_DAYS = 90;

export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer ${CRON_SECRET}. Reject everything else.
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/purge-cross-club-audit', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startedAt = Date.now();
  logInfo('/api/cron/purge-cross-club-audit', 'cron tick start', { retentionDays: RETENTION_DAYS });

  try {
    // Compute the cutoff in JS and pass as a bound parameter. This avoids
    // any ambiguity with how @vercel/postgres tagged templates coerce
    // interval expressions, and keeps RETENTION_DAYS out of the SQL string.
    const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = new Date(cutoffMs).toISOString();
    const result = await sql`
      DELETE FROM cross_club_audit
      WHERE occurred_at < ${cutoff}
    `;
    const deleted = result.rowCount || 0;
    const elapsedMs = Date.now() - startedAt;
    logInfo('/api/cron/purge-cross-club-audit', 'purge complete', {
      deletedRows: deleted,
      retentionDays: RETENTION_DAYS,
      cutoff,
      elapsedMs,
    });
    return res.status(200).json({
      ok: true,
      deleted,
      retentionDays: RETENTION_DAYS,
      cutoff,
      elapsedMs,
    });
  } catch (err) {
    logError('/api/cron/purge-cross-club-audit', err, { phase: 'delete' });
    return res.status(500).json({ error: err.message });
  }
}
