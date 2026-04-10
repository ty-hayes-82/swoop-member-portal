/**
 * Health Monitor Cron Job
 * Schedule: daily (runs alongside playbook-timers)
 *
 * Detects members whose health_score just crossed below 50 and
 * fires the risk-trigger endpoint for each qualifying member.
 */
import { sql } from '@vercel/postgres';
import { logWarn, logInfo } from '../lib/logger.js';
import { evaluateRiskTrigger } from '../agents/risk-config.js';

export default async function handler(req, res) {
  // Auth: same pattern as playbook-timers.js
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/health-monitor', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
      hasAuthHeader: !!req.headers['authorization'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  logInfo('/api/cron/health-monitor', 'cron tick start');

  const results = [];

  try {
    // 1. Find members whose current health_score is below 50
    //    AND who had a score >= 50 within the last 7 days (recent crossing).
    //    This avoids re-triggering members who have been at-risk for a long time.
    const { rows: candidates } = await sql`
      SELECT DISTINCT m.member_id, m.club_id, m.health_score, m.annual_dues
      FROM members m
      WHERE m.health_score < 50
        AND m.annual_dues >= 8000
        AND EXISTS (
          SELECT 1 FROM health_scores hs
          WHERE hs.member_id = m.member_id
            AND hs.club_id = m.club_id
            AND hs.score >= 50
            AND hs.recorded_at >= NOW() - INTERVAL '7 days'
        )
        AND NOT EXISTS (
          SELECT 1 FROM playbook_runs pr
          WHERE pr.member_id = m.member_id
            AND pr.club_id = m.club_id
            AND pr.playbook_id = 'member-risk-lifecycle'
            AND pr.status = 'active'
        )
    `;

    logInfo('/api/cron/health-monitor', `found ${candidates.length} crossing candidates`);

    // 2. Evaluate each candidate through the full trigger criteria
    for (const candidate of candidates) {
      try {
        const evaluation = await evaluateRiskTrigger(candidate.member_id, candidate.club_id);

        results.push({
          member_id: candidate.member_id,
          club_id: candidate.club_id,
          ...evaluation,
        });

        if (evaluation.shouldTrigger) {
          // 3. Fire the risk-trigger internally by calling the same logic
          //    We call the deployed endpoint via fetch so it goes through
          //    the full auth + idempotency + rate-limit pipeline.
          const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

          const triggerRes = await fetch(`${baseUrl}/api/agents/risk-trigger`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({
              member_id: candidate.member_id,
              club_id: candidate.club_id,
            }),
          });

          const triggerData = await triggerRes.json();
          results[results.length - 1].triggerResponse = triggerData;

          logInfo('/api/cron/health-monitor', `triggered risk-trigger for ${candidate.member_id}`, triggerData);
        }
      } catch (err) {
        logWarn('/api/cron/health-monitor', `error evaluating ${candidate.member_id}`, { error: err.message });
        results.push({
          member_id: candidate.member_id,
          club_id: candidate.club_id,
          error: err.message,
        });
      }
    }

    logInfo('/api/cron/health-monitor', 'cron tick complete', {
      candidatesChecked: candidates.length,
      triggered: results.filter(r => r.shouldTrigger).length,
    });

    return res.json({
      candidatesChecked: candidates.length,
      triggered: results.filter(r => r.shouldTrigger).length,
      results,
    });
  } catch (err) {
    console.error('Health monitor cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
