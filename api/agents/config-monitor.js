/**
 * GET /api/agents/config-monitor
 *
 * Sprint 6: Config health monitoring dashboard endpoint.
 *
 * GET ?clubId=xxx — Returns config health for a single club.
 * GET ?all=true   — (swoop_admin only) Returns config health across ALL clubs.
 *
 * @module api/agents/config-monitor
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { SWOOP_RECOMMENDED } from './config-templates.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute which fields in a config differ from the SWOOP_RECOMMENDED template.
 *
 * @param {string} agentId
 * @param {object} config — The stored config row
 * @returns {string[]} List of field paths that diverge from the recommended template.
 */
function computeDrift(agentId, config) {
  const recommended = SWOOP_RECOMMENDED[agentId];
  if (!recommended) return ['unknown_agent'];

  const drifts = [];

  // Compare top-level scalar fields
  if (config.tone && config.tone !== recommended.tone) {
    drifts.push(`tone: ${config.tone} (recommended: ${recommended.tone})`);
  }
  if (config.auto_approve_threshold != null &&
      Number(config.auto_approve_threshold) !== recommended.auto_approve_threshold) {
    drifts.push(`auto_approve_threshold: ${config.auto_approve_threshold} (recommended: ${recommended.auto_approve_threshold})`);
  }

  // Compare prompt_overrides
  const po = config.prompt_overrides || {};
  const recPo = recommended.prompt_overrides || {};
  if (po.model && po.model !== recPo.model) {
    drifts.push(`prompt_overrides.model: ${po.model} (recommended: ${recPo.model})`);
  }
  if (po.temperature != null && po.temperature !== recPo.temperature) {
    drifts.push(`prompt_overrides.temperature: ${po.temperature} (recommended: ${recPo.temperature})`);
  }

  // Compare validation rules
  const currentRules = (po.validation_rules || []).sort().join(',');
  const recRules = (recPo.validation_rules || []).sort().join(',');
  if (currentRules !== recRules) {
    drifts.push(`prompt_overrides.validation_rules: [${currentRules}] (recommended: [${recRules}])`);
  }

  // Compare tool_permissions
  const tp = config.tool_permissions || {};
  const recTp = recommended.tool_permissions || {};
  if (JSON.stringify(tp.denied || []) !== JSON.stringify(recTp.denied || [])) {
    drifts.push('tool_permissions.denied differs');
  }
  if (JSON.stringify((tp.requires_approval || []).sort()) !==
      JSON.stringify((recTp.requires_approval || []).sort())) {
    drifts.push('tool_permissions.requires_approval differs');
  }

  return drifts;
}

/**
 * Build health data for a single club's agent configs.
 */
async function getClubHealth(clubId) {
  const configResult = await sql`
    SELECT * FROM agent_configs
    WHERE club_id = ${clubId}
    ORDER BY agent_id
  `;

  const agents = [];

  for (const row of configResult.rows) {
    const drift = computeDrift(row.agent_id, row);

    // Fetch last QA score from agent_activity (if available)
    let lastQaScore = null;
    let alertFlag = false;
    try {
      const qaResult = await sql`
        SELECT description, created_at FROM agent_activity
        WHERE club_id = ${clubId}
          AND agent_id = ${row.agent_id}
          AND action_type = 'qa_score'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (qaResult.rows.length > 0) {
        const scoreMatch = qaResult.rows[0].description?.match(/([\d.]+)/);
        if (scoreMatch) {
          lastQaScore = parseFloat(scoreMatch[1]);
          // Alert if accuracy_score < 0.60 after recent config change
          if (lastQaScore < 0.60 && row.updated_at) {
            const updatedAt = new Date(row.updated_at);
            const qaAt = new Date(qaResult.rows[0].created_at);
            if (qaAt >= updatedAt) {
              alertFlag = true;
            }
          }
        }
      }
    } catch {
      // QA score lookup is optional
    }

    agents.push({
      agent_id: row.agent_id,
      config_version: row.config_version || 1,
      last_changed: row.updated_at,
      tone: row.tone,
      drift_from_recommended: drift,
      drift_count: drift.length,
      last_qa_score: lastQaScore,
      alert: alertFlag,
    });
  }

  return {
    club_id: clubId,
    agent_count: agents.length,
    agents,
    has_custom_configs: agents.length > 0,
    drift_summary: agents.reduce((sum, a) => sum + a.drift_count, 0),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // ---- All clubs (swoop_admin only) --------------------------------------
  if (req.query.all === 'true') {
    if (req.auth.role !== 'swoop_admin') {
      return res.status(403).json({ error: 'Only swoop_admin can view all club configs' });
    }

    try {
      const clubsResult = await sql`
        SELECT DISTINCT club_id FROM agent_configs ORDER BY club_id
      `;

      const clubs = [];
      for (const row of clubsResult.rows) {
        const health = await getClubHealth(row.club_id);
        clubs.push(health);
      }

      return res.status(200).json({
        total_clubs: clubs.length,
        clubs_with_custom: clubs.filter(c => c.has_custom_configs).length,
        clubs_with_drift: clubs.filter(c => c.drift_summary > 0).length,
        clubs,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch config health', detail: err.message });
    }
  }

  // ---- Single club -------------------------------------------------------
  const clubId = getReadClubId(req);

  try {
    const health = await getClubHealth(clubId);
    return res.status(200).json(health);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch config health', detail: err.message });
  }
}

export default withAuth(handler);
