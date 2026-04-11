/**
 * GET /api/playbooks — playbook definitions + live metrics from DB
 *
 * Returns playbook catalog enriched with:
 *   - triggeredCount: how many active/completed runs exist per playbook type
 *   - runCount: total runs (all statuses)
 *   - trackRecord: per-quarter aggregation of runs + outcomes
 *
 * If playbook tables are empty or missing, returns definitions with zero metrics.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { PLAYBOOK_DEFINITIONS } from '../src/config/playbookDefinitions.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);

  // ── Query live metrics from DB ──────────────────────
  let runCounts = [];
  let quarterlyStats = [];
  let stepCompletion = [];

  try {
    // Run counts per playbook_id
    const runsResult = await sql`
      SELECT playbook_id,
             COUNT(*) AS total_runs,
             COUNT(*) FILTER (WHERE status = 'active') AS active_runs,
             COUNT(*) FILTER (WHERE status = 'completed') AS completed_runs
      FROM playbook_runs
      WHERE club_id = ${clubId}
      GROUP BY playbook_id
    `;
    runCounts = runsResult.rows;
  } catch (e) {
    // Table may not exist yet — that's fine, we return zeros
    console.error('playbooks: runCounts query error:', e.message);
  }

  try {
    // Quarterly track record: runs + outcomes per playbook per quarter
    const quarterlyResult = await sql`
      SELECT playbook_id,
             TO_CHAR(started_at, 'YYYY-"Q"Q') AS quarter,
             COUNT(*) AS runs,
             COUNT(*) FILTER (WHERE status = 'completed') AS completed,
             COUNT(*) FILTER (WHERE outcome IS NOT NULL) AS with_outcome
      FROM playbook_runs
      WHERE club_id = ${clubId}
      GROUP BY playbook_id, TO_CHAR(started_at, 'YYYY-"Q"Q')
      ORDER BY quarter DESC
    `;
    quarterlyStats = quarterlyResult.rows;
  } catch (e) {
    console.error('playbooks: quarterlyStats query error:', e.message);
  }

  try {
    // Step completion rates per playbook
    const stepsResult = await sql`
      SELECT pr.playbook_id,
             COUNT(ps.step_id) AS total_steps,
             COUNT(ps.step_id) FILTER (WHERE ps.status = 'completed') AS completed_steps
      FROM playbook_steps ps
      JOIN playbook_runs pr ON ps.run_id = pr.run_id
      WHERE pr.club_id = ${clubId}
      GROUP BY pr.playbook_id
    `;
    stepCompletion = stepsResult.rows;
  } catch (e) {
    console.error('playbooks: stepCompletion query error:', e.message);
  }

  // ── Build lookup maps ──────────────────────────────
  const runMap = {};
  for (const r of runCounts) {
    runMap[r.playbook_id] = {
      totalRuns: Number(r.total_runs),
      activeRuns: Number(r.active_runs),
      completedRuns: Number(r.completed_runs),
    };
  }

  const quarterMap = {};
  for (const q of quarterlyStats) {
    if (!quarterMap[q.playbook_id]) quarterMap[q.playbook_id] = [];
    quarterMap[q.playbook_id].push({
      period: q.quarter,
      runs: `${q.runs}x run`,
      result: `${q.completed} of ${q.runs} completed`,
      impact: q.with_outcome > 0 ? `${q.with_outcome} with recorded outcome` : '',
    });
  }

  const stepMap = {};
  for (const s of stepCompletion) {
    stepMap[s.playbook_id] = {
      totalSteps: Number(s.total_steps),
      completedSteps: Number(s.completed_steps),
    };
  }

  // ── Enrich definitions with live metrics ───────────
  const playbooks = PLAYBOOK_DEFINITIONS.map(def => {
    const runs = runMap[def.id] || { totalRuns: 0, activeRuns: 0, completedRuns: 0 };
    const steps = stepMap[def.id] || { totalSteps: 0, completedSteps: 0 };
    const trackRecord = quarterMap[def.id] || [];

    return {
      ...def,
      triggeredCount: runs.activeRuns + runs.completedRuns,
      runCount: runs.totalRuns,
      completedRuns: runs.completedRuns,
      stepCompletionRate: steps.totalSteps > 0
        ? Math.round((steps.completedSteps / steps.totalSteps) * 100)
        : 0,
      trackRecord,
    };
  });

  return res.status(200).json({ playbooks });
}, { allowDemo: true });
