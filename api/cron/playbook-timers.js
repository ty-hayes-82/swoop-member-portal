/**
 * Playbook Timers Cron Job
 * Schedule: 8 AM UTC daily (0 8 * * *)
 *
 * Checks active playbook runs and sends scheduled wake events
 * to their Managed Agent sessions when step due dates are reached.
 */
import { sql } from '@vercel/postgres';
import { sendSessionEvent } from '../agents/managed-config.js';
import { logWarn, logInfo } from '../lib/logger.js';

const STEP_SCHEDULE = [
  { key: 'day_7_survey', label: 'Follow-up survey', daysRequired: 7 },
  { key: 'day_14_checkin', label: 'Check-in note', daysRequired: 14 },
  { key: 'day_30_outcome', label: 'Outcome measurement', daysRequired: 30 },
];

export default async function handler(req, res) {
  // Auth: identical to weather-daily.js
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/playbook-timers', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  logInfo('/api/cron/playbook-timers', 'cron tick start');

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  const results = [];

  try {
    // 1. Get all active playbook runs
    const { rows: activeRuns } = await sql`
      SELECT *
      FROM playbook_runs
      WHERE status = 'active'
    `;

    if (!activeRuns.length) {
      logInfo('/api/cron/playbook-timers', 'no active playbook runs');
      return res.json({ message: 'No active playbook runs', results });
    }

    const now = new Date();

    for (const run of activeRuns) {
      const daysSinceStart = Math.floor(
        (now - new Date(run.started_at)) / (1000 * 60 * 60 * 24)
      );
      const runResult = {
        runId: run.run_id,
        daysSinceStart,
        hasSession: !!run.agent_session_id,
        eventsTriggered: [],
      };

      // 2. Get pending steps for this run
      const { rows: pendingSteps } = await sql`
        SELECT *
        FROM playbook_steps
        WHERE run_id = ${run.run_id}
          AND status = 'pending'
      `;

      // 3. Check each scheduled step against elapsed days
      for (const schedule of STEP_SCHEDULE) {
        if (daysSinceStart < schedule.daysRequired) continue;

        const matchingStep = pendingSteps.find(
          (s) =>
            s.step_key === schedule.key ||
            (s.title && s.title.toLowerCase().includes(schedule.label.toLowerCase()))
        );
        if (!matchingStep) continue;

        const event = {
          type: 'scheduled_check',
          step: schedule.key,
          run_id: run.run_id,
          days_elapsed: daysSinceStart,
        };

        if (run.agent_session_id) {
          // Live session — send wake event to Anthropic Managed Agent
          try {
            await sendSessionEvent(run.agent_session_id, event);
            runResult.eventsTriggered.push({ step: schedule.key, sent: true });
            logInfo('/api/cron/playbook-timers', `sent ${schedule.key} event`, {
              runId: run.run_id,
              sessionId: run.agent_session_id,
            });
          } catch (e) {
            runResult.eventsTriggered.push({
              step: schedule.key,
              sent: false,
              error: e.message,
            });
            logWarn('/api/cron/playbook-timers', `failed to send ${schedule.key}`, {
              runId: run.run_id,
              error: e.message,
            });
          }
        } else {
          // Simulation mode — log but don't call the API
          runResult.eventsTriggered.push({ step: schedule.key, sent: false, simulated: true });
          logInfo('/api/cron/playbook-timers', `simulated ${schedule.key} event (no session)`, {
            runId: run.run_id,
          });
        }
      }

      results.push(runResult);
    }

    logInfo('/api/cron/playbook-timers', 'cron tick complete', {
      runsChecked: activeRuns.length,
      totalEvents: results.reduce((sum, r) => sum + r.eventsTriggered.length, 0),
    });

    return res.json({ runsChecked: activeRuns.length, results });
  } catch (e) {
    console.error('Playbook timers cron error:', e);
    return res.status(500).json({ error: e.message });
  }
}
