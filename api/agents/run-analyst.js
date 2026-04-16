/**
 * api/agents/run-analyst.js
 *
 * POST /api/agents/run-analyst
 *
 * Trigger any Type 2 domain-analyst agent by name.
 *
 * Body:
 *   {
 *     analyst: 'member_pulse' | 'service_recovery' | 'revenue_analyst' |
 *              'labor_optimizer' | 'engagement_autopilot',
 *     opts?: {
 *       targetDate?: 'YYYY-MM-DD',   // revenue_analyst, labor_optimizer
 *       triggerType?: 'scheduled' | 'manual' | 'event_driven'
 *     }
 *   }
 *
 * Response:
 *   {
 *     analyst,
 *     session_id,
 *     findings,
 *     handoff_ids,
 *     targets_notified
 *   }
 *
 * Auth: GM, assistant_gm, swoop_admin, or CRON_SECRET header.
 */

import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { run as runMemberPulse } from './analysts/member-pulse.js';
import { run as runServiceRecovery } from './analysts/service-recovery.js';
import { run as runRevenueAnalyst } from './analysts/revenue-analyst.js';
import { run as runLaborOptimizer } from './analysts/labor-optimizer.js';
import { run as runEngagementAutopilot } from './analysts/engagement-autopilot.js';

const ANALYSTS = {
  member_pulse:          runMemberPulse,
  service_recovery:      runServiceRecovery,
  revenue_analyst:       runRevenueAnalyst,
  labor_optimizer:       runLaborOptimizer,
  engagement_autopilot:  runEngagementAutopilot,
};

async function runAnalystHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const { analyst, opts = {} } = req.body;

  if (!analyst) {
    return res.status(400).json({
      error: 'analyst is required',
      valid_analysts: Object.keys(ANALYSTS),
    });
  }

  const runFn = ANALYSTS[analyst];
  if (!runFn) {
    return res.status(400).json({
      error: `Unknown analyst: ${analyst}`,
      valid_analysts: Object.keys(ANALYSTS),
    });
  }

  try {
    const result = await runFn(clubId, opts);
    return res.status(200).json({
      analyst,
      session_id: result.session_id,
      findings: result.findings,
      handoff_ids: result.handoff_ids,
      targets_notified: result.targets_notified,
    });
  } catch (err) {
    console.error(`[run-analyst] ${analyst} failed:`, err.message);
    return res.status(500).json({ error: `Analyst ${analyst} failed: ${err.message}` });
  }
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return runAnalystHandler(req, res);
  }
  return withAuth(runAnalystHandler, {
    roles: ['gm', 'assistant_gm', 'swoop_admin'],
  })(req, res);
}
