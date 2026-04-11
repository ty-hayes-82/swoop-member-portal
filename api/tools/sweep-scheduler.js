/**
 * Sweep Scheduler API
 * GET/POST/PUT /api/tools/sweep-scheduler?action=schedule|history|configure
 *
 * Manages agent sweep schedules, execution history, and per-club cadence config.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from '../lib/withAuth.js';

const VALID_SWEEP_TYPES = ['daily_briefing', 'risk_monitor', 'staffing_check', 'board_digest', 'custom'];
const VALID_PRIORITIES = ['high', 'normal', 'low'];

/**
 * Compute a rough next-run timestamp from a cron expression.
 * This is a best-effort approximation — real scheduling is handled by the
 * cron infrastructure, but we surface an estimate so the UI can show it.
 */
function estimateNextRun(cronExpression) {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length < 5) return null;

    const [minute, hour] = parts;
    const now = new Date();
    const next = new Date(now);

    const m = minute === '*' ? 0 : parseInt(minute, 10);
    const h = hour === '*' ? now.getHours() : parseInt(hour, 10);

    next.setMinutes(m);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setHours(h);

    // If the computed time is in the past, push to the next day
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
  } catch {
    return null;
  }
}

// ── action: schedule (POST) ────────────────────────────────────────
async function handleSchedule(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required for schedule action' });

  const clubId = getWriteClubId(req);
  const { sweep_type, cron_expression, agents, priority, enabled } = req.body;

  if (!sweep_type || !VALID_SWEEP_TYPES.includes(sweep_type)) {
    return res.status(400).json({ error: `sweep_type must be one of: ${VALID_SWEEP_TYPES.join(', ')}` });
  }
  if (!cron_expression || typeof cron_expression !== 'string') {
    return res.status(400).json({ error: 'cron_expression is required' });
  }
  if (!Array.isArray(agents) || agents.length === 0) {
    return res.status(400).json({ error: 'agents must be a non-empty array' });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const safePriority = priority || 'normal';
  const safeEnabled = enabled !== false;
  const agentsJson = JSON.stringify(agents);
  const nextRun = estimateNextRun(cron_expression);

  const result = await sql`
    INSERT INTO sweep_schedules (
      club_id, sweep_type, cron_expression, agents, priority, enabled, next_run, created_at, updated_at
    ) VALUES (
      ${clubId}, ${sweep_type}, ${cron_expression}, ${agentsJson}::jsonb,
      ${safePriority}, ${safeEnabled}, ${nextRun}, NOW(), NOW()
    )
    ON CONFLICT (club_id, sweep_type) DO UPDATE SET
      cron_expression = EXCLUDED.cron_expression,
      agents = EXCLUDED.agents,
      priority = EXCLUDED.priority,
      enabled = EXCLUDED.enabled,
      next_run = EXCLUDED.next_run,
      updated_at = NOW()
    RETURNING *
  `;

  const row = result.rows[0];
  return res.status(200).json({
    ok: true,
    schedule: row,
    next_run: nextRun,
  });
}

// ── action: history (GET) ──────────────────────────────────────────
async function handleHistory(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required for history action' });

  const clubId = getReadClubId(req);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const sweepType = req.query.sweep_type || null;

  let result;
  if (sweepType) {
    result = await sql`
      SELECT sweep_id, sweep_type, started_at, completed_at,
             agents_invoked, actions_generated, actions_approved,
             actions_dismissed, duration_ms
      FROM sweep_history
      WHERE club_id = ${clubId} AND sweep_type = ${sweepType}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
  } else {
    result = await sql`
      SELECT sweep_id, sweep_type, started_at, completed_at,
             agents_invoked, actions_generated, actions_approved,
             actions_dismissed, duration_ms
      FROM sweep_history
      WHERE club_id = ${clubId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
  }

  return res.status(200).json({ history: result.rows });
}

// ── action: configure (PUT) ────────────────────────────────────────
async function handleConfigure(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'PUT required for configure action' });

  const clubId = getWriteClubId(req);
  const { config } = req.body;

  if (!config || typeof config !== 'object') {
    return res.status(400).json({ error: 'config object is required' });
  }

  const {
    daily_briefing_time,
    risk_monitor_interval_hours,
    board_digest_day,
    sweep_concurrency,
    quiet_hours,
  } = config;

  const configJson = JSON.stringify({
    daily_briefing_time: daily_briefing_time || '07:00',
    risk_monitor_interval_hours: risk_monitor_interval_hours || 4,
    board_digest_day: board_digest_day || 'monday',
    sweep_concurrency: sweep_concurrency || 2,
    quiet_hours: quiet_hours || { start: '22:00', end: '06:00' },
  });

  const result = await sql`
    INSERT INTO club_sweep_config (club_id, config, updated_at)
    VALUES (${clubId}, ${configJson}::jsonb, NOW())
    ON CONFLICT (club_id) DO UPDATE SET
      config = EXCLUDED.config,
      updated_at = NOW()
    RETURNING *
  `;

  return res.status(200).json({
    ok: true,
    config: result.rows[0]?.config ?? JSON.parse(configJson),
  });
}

// ── Router ─────────────────────────────────────────────────────────
export default withAuth(async function handler(req, res) {
  const action = req.query.action;

  try {
    switch (action) {
      case 'schedule':  return await handleSchedule(req, res);
      case 'history':   return await handleHistory(req, res);
      case 'configure': return await handleConfigure(req, res);
      default:
        return res.status(400).json({
          error: `Unknown or missing action. Use ?action=schedule|history|configure`,
        });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
