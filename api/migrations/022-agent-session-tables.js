/**
 * Migration 022: Universal Agent Session Tables (Phase 1 Foundation)
 *
 * Adds the three core tables for the two-class agent architecture:
 *   - agent_sessions      — one row per session (identity or analyst)
 *   - agent_session_events — universal append-only event log
 *   - agent_handoffs       — explicit cross-session handoff records
 *
 * Session ID conventions:
 *   Identity agents:  mbr_{memberId}_concierge | gm_{userId}_concierge | staff_{userId}_agent
 *   Analyst agents:   revenue_analyst_{clubId}  | service_recovery_{clubId} | member_pulse_{clubId}
 *
 * Run via: GET /api/migrations/022-agent-session-tables
 */

import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

export default withAuth(async (req, res) => {
  const results = [];

  // ── agent_sessions ───────────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        session_id    TEXT        PRIMARY KEY,
        session_type  TEXT        NOT NULL CHECK (session_type IN ('identity', 'analyst')),
        owner_id      TEXT        NOT NULL,
        club_id       UUID        NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status        TEXT        NOT NULL DEFAULT 'active'
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_as_club_owner
      ON agent_sessions (club_id, owner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_as_club_type
      ON agent_sessions (club_id, session_type)`;
    results.push({ table: 'agent_sessions', status: 'ok' });
  } catch (err) {
    results.push({ table: 'agent_sessions', status: 'error', error: err.message });
  }

  // ── agent_session_events ─────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_session_events (
        event_id        BIGSERIAL   PRIMARY KEY,
        session_id      TEXT        NOT NULL,
        event_type      TEXT        NOT NULL,
        payload         JSONB       NOT NULL DEFAULT '{}',
        source_agent    TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id  TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ase_session_time
      ON agent_session_events (session_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ase_session_type
      ON agent_session_events (session_id, event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ase_correlation
      ON agent_session_events (correlation_id) WHERE correlation_id IS NOT NULL`;
    results.push({ table: 'agent_session_events', status: 'ok' });
  } catch (err) {
    results.push({ table: 'agent_session_events', status: 'error', error: err.message });
  }

  // ── agent_handoffs ───────────────────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_handoffs (
        handoff_id              TEXT        PRIMARY KEY,
        source_session_id       TEXT        NOT NULL,
        target_session_id       TEXT        NOT NULL,
        recommendation_event_id TEXT,
        status                  TEXT        NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'accepted', 'acted', 'confirmed', 'rejected')),
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_at            TIMESTAMPTZ,
        outcome                 JSONB
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ah_source
      ON agent_handoffs (source_session_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ah_target
      ON agent_handoffs (target_session_id, status)`;
    results.push({ table: 'agent_handoffs', status: 'ok' });
  } catch (err) {
    results.push({ table: 'agent_handoffs', status: 'error', error: err.message });
  }

  const allOk = results.every(r => r.status === 'ok');
  return res.status(allOk ? 200 : 207).json({ migration: '022', results });
}, { requireAdmin: true });
