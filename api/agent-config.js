/**
 * GET/PATCH /api/agent-config
 *
 * Read and update per-club agent configuration.
 *
 * GET  ?clubId=xxx&agentId=yyy  — returns full config (or defaults)
 * PATCH body { club_id, agent_id, ...fields } — partial JSONB merge update
 *
 * Uses withAuth middleware and @vercel/postgres.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';

// ---------------------------------------------------------------------------
// Defaults — returned when no row exists for a club+agent pair
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
  tone: 'professional',
  auto_approve_threshold: 0.85,
  enabled: true,
  notification_channels: ['in_app'],
  config_version: 1,
  custom_instructions: null,
  schedule: null,
  guardrails: {},
};

// ---------------------------------------------------------------------------
// Validation constants
// ---------------------------------------------------------------------------

const VALID_TONES = ['warm', 'professional', 'direct'];
const THRESHOLD_MIN = 0.70;
const THRESHOLD_MAX = 0.95;

// ---------------------------------------------------------------------------
// Config cache — cleared on PATCH so agents pick up changes immediately
// ---------------------------------------------------------------------------

const _configCache = new Map();

/** Clear a single agent's cached config, or all if no args. */
export function clearConfigCache(clubId, agentId) {
  if (clubId && agentId) {
    _configCache.delete(`${clubId}:${agentId}`);
  } else {
    _configCache.clear();
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req, res) {
  // ---- GET ---------------------------------------------------------------
  if (req.method === 'GET') {
    const clubId  = getReadClubId(req);
    const agentId = req.query.agentId;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId query parameter is required' });
    }

    // Check cache first
    const cacheKey = `${clubId}:${agentId}`;
    if (_configCache.has(cacheKey)) {
      return res.status(200).json(_configCache.get(cacheKey));
    }

    try {
      const result = await sql`
        SELECT * FROM agent_configs
        WHERE club_id = ${clubId} AND agent_id = ${agentId}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        const defaults = { ...DEFAULT_CONFIG, club_id: clubId, agent_id: agentId };
        _configCache.set(cacheKey, defaults);
        return res.status(200).json(defaults);
      }

      const config = result.rows[0];
      _configCache.set(cacheKey, config);
      return res.status(200).json(config);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch agent config', detail: err.message });
    }
  }

  // ---- PATCH -------------------------------------------------------------
  if (req.method === 'PATCH') {
    const clubId = getWriteClubId(req);
    const { agent_id, ...fields } = req.body || {};

    if (!agent_id) {
      return res.status(400).json({ error: 'agent_id is required in body' });
    }

    // Validate tone
    if (fields.tone && !VALID_TONES.includes(fields.tone)) {
      return res.status(400).json({
        error: `tone must be one of: ${VALID_TONES.join(', ')}`,
      });
    }

    // Validate auto_approve_threshold
    if (fields.auto_approve_threshold != null) {
      const t = Number(fields.auto_approve_threshold);
      if (Number.isNaN(t) || t < THRESHOLD_MIN || t > THRESHOLD_MAX) {
        return res.status(400).json({
          error: `auto_approve_threshold must be between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}`,
        });
      }
      fields.auto_approve_threshold = t;
    }

    // Strip club_id from fields — it comes from auth, not body
    delete fields.club_id;

    try {
      // ----- Save previous config to history -----
      await sql`
        INSERT INTO agent_config_history (club_id, agent_id, config_snapshot, saved_at)
        SELECT club_id, agent_id, row_to_json(ac)::jsonb, NOW()
        FROM agent_configs ac
        WHERE club_id = ${clubId} AND agent_id = ${agent_id}
      `;

      // ----- Upsert with JSONB merge -----
      // Build the partial update as a JSONB blob; Postgres || merges top-level keys.
      const patch = JSON.stringify(fields);

      const result = await sql`
        INSERT INTO agent_configs (club_id, agent_id, config, config_version, created_at, updated_at)
        VALUES (
          ${clubId},
          ${agent_id},
          ${patch}::jsonb,
          1,
          NOW(),
          NOW()
        )
        ON CONFLICT (club_id, agent_id) DO UPDATE SET
          config         = agent_configs.config || ${patch}::jsonb,
          config_version = agent_configs.config_version + 1,
          updated_at     = NOW()
        RETURNING *
      `;

      // ----- Clear cache -----
      clearConfigCache(clubId, agent_id);

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update agent config', detail: err.message });
    }
  }

  // ---- Unsupported method ------------------------------------------------
  return res.status(405).json({ error: 'Method not allowed. Use GET or PATCH.' });
}

export default withAuth(handler);
