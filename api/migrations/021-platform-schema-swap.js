/**
 * Migration 021: swap legacy agent tables for platform-schema versions
 *
 * The tables agent_sessions, agent_session_events, agent_handoffs, event_bus,
 * and activity_log were created by earlier migrations with different column
 * layouts. swoop-agent-platform requires specific columns (session_key,
 * managed_session_id, confirmation_id, etc.) that don't exist on those tables.
 *
 * Renames each old table to *_v1 (preserves data), then creates the
 * platform-schema version. Also creates agent_registry from scratch.
 * Fully idempotent.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];
  const run = async (label, query) => {
    try {
      await query;
      results.push({ step: label, status: 'ok' });
    } catch (e) {
      results.push({ step: label, status: 'error', message: e.message });
    }
  };

  // ── Backup old tables ──────────────────────────────────────────────────────
  await run('backup_agent_sessions',       sql`ALTER TABLE IF EXISTS agent_sessions        RENAME TO agent_sessions_v1`);
  await run('backup_agent_session_events', sql`ALTER TABLE IF EXISTS agent_session_events  RENAME TO agent_session_events_v1`);
  await run('backup_agent_handoffs',       sql`ALTER TABLE IF EXISTS agent_handoffs        RENAME TO agent_handoffs_v1`);
  await run('backup_event_bus',            sql`ALTER TABLE IF EXISTS event_bus             RENAME TO event_bus_v1`);
  await run('backup_activity_log',         sql`ALTER TABLE IF EXISTS activity_log          RENAME TO activity_log_v1`);

  // ── agent_sessions ─────────────────────────────────────────────────────────
  await run('create_agent_sessions', sql`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      session_key        TEXT NOT NULL,
      managed_session_id TEXT NOT NULL,
      agent_id           TEXT NOT NULL,
      entity_type        TEXT NOT NULL,
      entity_id          TEXT NOT NULL,
      club_id            TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT 'active',
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      last_event_at      TIMESTAMPTZ,
      archived_at        TIMESTAMPTZ,
      archive_reason     TEXT,
      PRIMARY KEY (session_key)
    )
  `);
  await run('idx_agent_sessions_club',   sql`CREATE INDEX IF NOT EXISTS idx_agent_sessions_club   ON agent_sessions(club_id, status)`);
  await run('idx_agent_sessions_entity', sql`CREATE INDEX IF NOT EXISTS idx_agent_sessions_entity ON agent_sessions(entity_type, entity_id, club_id)`);

  // ── agent_session_events ───────────────────────────────────────────────────
  await run('create_agent_session_events', sql`
    CREATE TABLE IF NOT EXISTS agent_session_events (
      id          BIGSERIAL PRIMARY KEY,
      session_id  TEXT NOT NULL,
      event_type  TEXT NOT NULL,
      payload     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run('idx_ase_session_type', sql`CREATE INDEX IF NOT EXISTS idx_ase_session_type ON agent_session_events(session_id, event_type, created_at DESC)`);
  await run('idx_ase_club_payload', sql`CREATE INDEX IF NOT EXISTS idx_ase_club_payload ON agent_session_events((payload->>'club_id'), event_type, created_at DESC)`);

  // ── agent_handoffs ─────────────────────────────────────────────────────────
  await run('create_agent_handoffs', sql`
    CREATE TABLE IF NOT EXISTS agent_handoffs (
      id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      from_agent          TEXT NOT NULL,
      to_agent            TEXT NOT NULL,
      recommendation_type TEXT,
      summary             TEXT,
      payload             JSONB,
      priority            TEXT DEFAULT 'medium',
      member_id           TEXT,
      club_id             TEXT,
      dollar_impact       TEXT,
      status              TEXT DEFAULT 'pending',
      outcome             TEXT,
      outcome_at          TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run('idx_agent_handoffs_club', sql`CREATE INDEX IF NOT EXISTS idx_agent_handoffs_club ON agent_handoffs(club_id, status, created_at DESC)`);

  // ── event_bus ──────────────────────────────────────────────────────────────
  await run('create_event_bus', sql`
    CREATE TABLE IF NOT EXISTS event_bus (
      id          BIGSERIAL PRIMARY KEY,
      event_type  TEXT NOT NULL,
      payload     JSONB,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      processed   BOOLEAN DEFAULT FALSE
    )
  `);
  await run('idx_event_bus_unprocessed', sql`CREATE INDEX IF NOT EXISTS idx_event_bus_unprocessed ON event_bus(processed, created_at DESC) WHERE NOT processed`);

  // ── activity_log ───────────────────────────────────────────────────────────
  await run('create_activity_log', sql`
    CREATE TABLE IF NOT EXISTS activity_log (
      confirmation_id     TEXT PRIMARY KEY,
      action_type         TEXT NOT NULL DEFAULT 'human_confirmation_request',
      recipient_role      TEXT,
      description         TEXT,
      source_system       TEXT,
      context_data        JSONB,
      status              TEXT NOT NULL DEFAULT 'pending_confirmation',
      session_id          TEXT,
      agent_name          TEXT,
      expected_completion TEXT,
      resolved_at         TIMESTAMPTZ,
      executed_at         TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run('idx_activity_log_status', sql`CREATE INDEX IF NOT EXISTS idx_activity_log_status ON activity_log(status, created_at DESC)`);

  // ── agent_registry ─────────────────────────────────────────────────────────
  await run('create_agent_registry', sql`
    CREATE TABLE IF NOT EXISTS agent_registry (
      agent_name    TEXT PRIMARY KEY,
      agent_id      TEXT NOT NULL,
      tier          TEXT,
      registered_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run('idx_agent_registry_name', sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_registry_name ON agent_registry(agent_name)`);

  const errors = results.filter(r => r.status === 'error');
  return res.status(errors.length > 0 ? 207 : 200).json({ success: errors.length === 0, results });
}
