/**
 * Migration 018: Extend agent_configs with JSONB columns for managed config system
 *
 * 1. Ensure agent_configs table exists with base columns
 * 2. Add behavioral_config, tool_permissions, prompt_overrides JSONB columns
 * 3. Add sweep_cadence, tone, config_version columns
 * 4. Add UNIQUE constraint on (club_id, agent_id)
 * 5. Create agent_config_history table
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
      results.push({ step: label, status: 'ok' });
    } catch (e) {
      results.push({ step: label, status: 'error', message: e.message });
    }
  };

  // 1. Ensure agent_configs table exists with base columns
  await run('create_agent_configs_table', sql`
    CREATE TABLE IF NOT EXISTS agent_configs (
      config_id TEXT PRIMARY KEY,
      club_id TEXT,
      agent_id TEXT,
      enabled BOOLEAN DEFAULT true,
      auto_approve_threshold NUMERIC DEFAULT 0.80,
      notification_channels JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 2. Add JSONB config columns
  await run('add_behavioral_config', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS behavioral_config JSONB DEFAULT '{}'
  `);
  await run('add_tool_permissions', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS tool_permissions JSONB DEFAULT '{}'
  `);
  await run('add_prompt_overrides', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS prompt_overrides JSONB DEFAULT '{}'
  `);

  // 3. Add scalar config columns
  await run('add_sweep_cadence', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS sweep_cadence TEXT DEFAULT 'morning'
  `);
  await run('add_tone', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'warm'
  `);
  await run('add_config_version', sql`
    ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS config_version INTEGER DEFAULT 1
  `);

  // 4. Add UNIQUE constraint on (club_id, agent_id)
  await run('add_club_agent_unique', sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_configs_club_agent ON agent_configs(club_id, agent_id)
  `);

  // 5. Create agent_config_history table
  await run('create_agent_config_history', sql`
    CREATE TABLE IF NOT EXISTS agent_config_history (
      history_id TEXT PRIMARY KEY,
      club_id TEXT,
      agent_id TEXT,
      config_version INTEGER,
      config_snapshot JSONB,
      changed_at TIMESTAMPTZ DEFAULT NOW(),
      changed_by TEXT
    )
  `);

  return res.status(200).json({ success: true, results });
}
