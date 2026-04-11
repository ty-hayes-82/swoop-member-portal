/**
 * GET/POST /api/agents/config-export
 *
 * Sprint 6: Export and import agent configurations across clubs.
 *
 * GET  ?clubId=xxx — Export all agent configs for a club as JSON download.
 * POST { target_club_id, configs: [...] } — Import configs to a target club.
 *
 * @module api/agents/config-export
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from '../lib/withAuth.js';
import { clearConfigCache } from './assemble.js';
import { logError } from '../lib/logger.js';

// ---------------------------------------------------------------------------
// Validation constants (must match agent-config.js)
// ---------------------------------------------------------------------------

const VALID_TONES = ['warm', 'professional', 'direct'];

/**
 * Validate a single config object's schema before import.
 * Returns null if valid, or an error string describing the issue.
 */
function validateConfigSchema(config) {
  if (!config.agent_id || typeof config.agent_id !== 'string') {
    return 'Missing or invalid agent_id';
  }
  if (config.tone && !VALID_TONES.includes(config.tone)) {
    return `Invalid tone "${config.tone}" — must be one of: ${VALID_TONES.join(', ')}`;
  }
  if (config.auto_approve_threshold != null) {
    const t = Number(config.auto_approve_threshold);
    if (Number.isNaN(t) || t < 0 || t > 1) {
      return `Invalid auto_approve_threshold: ${config.auto_approve_threshold}`;
    }
  }
  if (config.prompt_overrides && typeof config.prompt_overrides !== 'object') {
    return 'prompt_overrides must be an object';
  }
  if (config.behavioral_config && typeof config.behavioral_config !== 'object') {
    return 'behavioral_config must be an object';
  }
  if (config.tool_permissions && typeof config.tool_permissions !== 'object') {
    return 'tool_permissions must be an object';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req, res) {
  // ---- GET: Export --------------------------------------------------------
  if (req.method === 'GET') {
    const clubId = getReadClubId(req);

    try {
      const result = await sql`
        SELECT * FROM agent_configs
        WHERE club_id = ${clubId}
        ORDER BY agent_id
      `;

      const exportData = {
        export_date: new Date().toISOString(),
        club_id: clubId,
        config_count: result.rows.length,
        configs: result.rows,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="agent-configs-${clubId}-${Date.now()}.json"`);
      return res.status(200).json(exportData);
    } catch (err) {
      logError('config-export/GET', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  // ---- POST: Import ------------------------------------------------------
  if (req.method === 'POST') {
    const { target_club_id, configs } = req.body || {};

    if (!target_club_id) {
      return res.status(400).json({ error: 'target_club_id is required' });
    }
    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({ error: 'configs must be a non-empty array' });
    }

    // Use getWriteClubId for the target club — swoop_admin can write cross-club
    const clubId = getWriteClubId(req, {
      allowAdminOverride: true,
      reason: 'Config import targets a specific club by target_club_id',
    });

    // For non-admin users, target_club_id must match their own club
    if (req.auth.role !== 'swoop_admin' && target_club_id !== req.auth.clubId) {
      return res.status(403).json({ error: 'Cannot import configs to another club' });
    }

    const effectiveClubId = req.auth.role === 'swoop_admin' ? target_club_id : clubId;

    // Validate all configs before applying any
    const errors = [];
    for (let i = 0; i < configs.length; i++) {
      const err = validateConfigSchema(configs[i]);
      if (err) errors.push({ index: i, agent_id: configs[i].agent_id, error: err });
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    try {
      const imported = [];

      for (const config of configs) {
        const { agent_id, tone, behavioral_config, tool_permissions, prompt_overrides,
                auto_approve_threshold, enabled, sweep_cadence } = config;

        // Save current config to history before overwriting
        await sql`
          INSERT INTO agent_config_history (club_id, agent_id, config_snapshot, saved_at)
          SELECT club_id, agent_id, row_to_json(ac)::jsonb, NOW()
          FROM agent_configs ac
          WHERE club_id = ${effectiveClubId} AND agent_id = ${agent_id}
        `;

        // Build the config JSONB for the upsert
        const configPayload = {};
        if (tone) configPayload.tone = tone;
        if (behavioral_config) configPayload.behavioral_config = behavioral_config;
        if (tool_permissions) configPayload.tool_permissions = tool_permissions;
        if (prompt_overrides) configPayload.prompt_overrides = prompt_overrides;
        if (auto_approve_threshold != null) configPayload.auto_approve_threshold = auto_approve_threshold;
        if (enabled != null) configPayload.enabled = enabled;
        if (sweep_cadence) configPayload.sweep_cadence = sweep_cadence;

        const patch = JSON.stringify(configPayload);

        const result = await sql`
          INSERT INTO agent_configs (club_id, agent_id, config, config_version, created_at, updated_at)
          VALUES (
            ${effectiveClubId},
            ${agent_id},
            ${patch}::jsonb,
            1,
            NOW(),
            NOW()
          )
          ON CONFLICT (club_id, agent_id) DO UPDATE SET
            config         = ${patch}::jsonb,
            config_version = agent_configs.config_version + 1,
            updated_at     = NOW()
          RETURNING *
        `;

        imported.push(result.rows[0]);
      }

      // Clear config cache for the target club
      clearConfigCache();

      return res.status(200).json({
        success: true,
        club_id: effectiveClubId,
        imported_count: imported.length,
        configs: imported,
      });
    } catch (err) {
      logError('config-export/POST', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
}

export default withAuth(handler);
