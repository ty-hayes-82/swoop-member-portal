/**
 * Migration 016: Create pause_state table
 *
 * Moves the `CREATE TABLE IF NOT EXISTS pause_state` bootstrap that used to
 * live in the `api/pause-resume.js` request hot path into a proper migration.
 * Schema bootstrap belongs here, not in every POST /api/pause-resume call.
 *
 * `pause_state` tracks whether a given target (agent, playbook_run, etc.) is
 * currently paused, along with when it was paused, when it should auto-resume,
 * and who paused it. It is multi-tenant scoped by `club_id` (present in the
 * original inline bootstrap, preserved here).
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

  await run('pause_state', sql`
    CREATE TABLE IF NOT EXISTS pause_state (
      club_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      paused BOOLEAN DEFAULT FALSE,
      paused_at TIMESTAMPTZ,
      resume_at TIMESTAMPTZ,
      paused_by TEXT,
      PRIMARY KEY (club_id, target_type, target_id)
    )
  `);

  // The natural lookup key is already the PK (club_id, target_type, target_id),
  // so no extra composite index is needed for point lookups. Add an index on
  // scheduled auto-resume scans (check_scheduled action queries by club_id +
  // paused=TRUE + resume_at <= NOW()).
  await run('idx_pause_state_resume_at', sql`
    CREATE INDEX IF NOT EXISTS idx_pause_state_resume_at
      ON pause_state (club_id, resume_at)
      WHERE paused = TRUE AND resume_at IS NOT NULL
  `);

  const created = results.filter((r) => r.status === 'ok').length;
  const errors = results.filter((r) => r.status === 'error');

  res.status(errors.length > 0 ? 207 : 200).json({
    migration: '016-pause-state-table',
    created,
    results,
    errors,
    summary: `${created} objects ensured, ${errors.length} errors`,
    notes: [
      'Moved from inline bootstrap in api/pause-resume.js (SEC-2 follow-up).',
      'club_id was already present in the original inline CREATE; preserved as NOT NULL and as first PK column for multi-tenant isolation.',
    ],
  });
}
