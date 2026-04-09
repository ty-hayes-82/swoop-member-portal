/**
 * Migration 015: Create cross_club_audit table
 *
 * SEC-2 follow-up to the B25 audit. SEC-1 hardened the admin-override path
 * in `getWriteClubId(req, { allowAdminOverride: true })`; SEC-2 makes every
 * use of that override observable by logging the divergence between an
 * admin's session clubId and the effective target clubId to this table.
 *
 * The `withAdminOverride` wrapper (api/lib/withAdminOverride.js) inserts
 * one row per divergent admin write. Rows capture forensic metadata only:
 * the actor, the two clubIds, method/path, a SHA-256 hash of the request
 * body (never the body itself — no PII at rest), IP, and user-agent.
 *
 * Retention is TBD — a future sprint should add a TTL job (90-day window
 * is a reasonable starting point).
 *
 * Fully idempotent — safe to re-run.
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
      results.push({ object: label, status: 'ok' });
    } catch (e) {
      results.push({ object: label, status: 'error', message: e.message });
    }
  };

  await run('cross_club_audit', sql`
    CREATE TABLE IF NOT EXISTS cross_club_audit (
      id BIGSERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id TEXT NOT NULL,
      session_club_id TEXT NOT NULL,
      target_club_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      reason TEXT,
      body_hash TEXT,
      ip TEXT,
      user_agent TEXT
    )
  `);

  await run('idx_cross_club_audit_user', sql`
    CREATE INDEX IF NOT EXISTS idx_cross_club_audit_user
      ON cross_club_audit (user_id, occurred_at DESC)
  `);
  await run('idx_cross_club_audit_target', sql`
    CREATE INDEX IF NOT EXISTS idx_cross_club_audit_target
      ON cross_club_audit (target_club_id, occurred_at DESC)
  `);
  await run('idx_cross_club_audit_occurred', sql`
    CREATE INDEX IF NOT EXISTS idx_cross_club_audit_occurred
      ON cross_club_audit (occurred_at DESC)
  `);

  const created = results.filter((r) => r.status === 'ok').length;
  const errors = results.filter((r) => r.status === 'error');

  res.status(200).json({
    migration: '015-cross-club-audit-table',
    created,
    results,
    errors,
    summary: `${created} objects ensured, ${errors.length} errors`,
  });
}
