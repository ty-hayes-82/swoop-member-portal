/**
 * Track Outcomes Cron Job
 * Schedule: daily at 11 AM (after health-monitor at 10 AM has refreshed scores)
 *
 * Measures health score deltas for all interventions created in the last 60 days
 * that haven't been measured yet. Flags member saves for the Board Report.
 * Runs cross-club — processes every club that has pending interventions.
 */
import { sql } from '@vercel/postgres';
import { logInfo, logWarn } from '../lib/logger.js';

export default async function handler(req, res) {
  const auth = req.headers['authorization'] || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    logWarn('/api/cron/track-outcomes', 'unauthorized cron invocation', {
      ip: req.headers['x-forwarded-for'],
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  logInfo('/api/cron/track-outcomes', 'cron tick start');

  try {
    // All interventions from last 60 days without outcome measurement
    // that have at least 7 days of elapsed time and a health_score_before recorded
    const { rows: pending } = await sql`
      SELECT i.intervention_id, i.club_id, i.member_id, i.intervention_type,
             i.initiated_at, i.health_score_before, i.description,
             m.health_score AS current_score, m.annual_dues,
             m.first_name, m.last_name
      FROM interventions i
      JOIN members m ON i.member_id = m.member_id AND i.club_id = m.club_id
      WHERE i.outcome_measured_at IS NULL
        AND i.initiated_at >= NOW() - INTERVAL '60 days'
        AND i.initiated_at <= NOW() - INTERVAL '7 days'
        AND i.health_score_before IS NOT NULL
      LIMIT 200
    `;

    if (pending.length === 0) {
      logInfo('/api/cron/track-outcomes', 'no pending interventions');
      return res.status(200).json({ message: 'No interventions to measure', measured: 0, saves: 0 });
    }

    let measured = 0;
    let saves = 0;

    for (const intv of pending) {
      const scoreBefore = Number(intv.health_score_before);
      const scoreAfter = Number(intv.current_score);

      if (!Number.isFinite(scoreBefore) || !Number.isFinite(scoreAfter)) continue;

      const delta = scoreAfter - scoreBefore;

      let outcome;
      let isSave = false;
      let duesProtected = 0;
      let revenueRecovered = 0;

      if (delta >= 15) {
        outcome = 'Strong recovery — health score improved significantly';
        isSave = true;
        duesProtected = Number(intv.annual_dues) || 0;
        revenueRecovered = Math.round(duesProtected * 0.25);
      } else if (delta >= 5) {
        outcome = 'Moderate improvement — member showing re-engagement signals';
        isSave = scoreBefore < 45;
        duesProtected = isSave ? (Number(intv.annual_dues) || 0) : 0;
      } else if (delta >= 0) {
        outcome = 'Stabilized — no further decline detected';
        isSave = scoreBefore < 25 && scoreAfter >= 25;
        duesProtected = isSave ? (Number(intv.annual_dues) || 0) : 0;
      } else if (delta >= -10) {
        outcome = 'Continued decline — intervention may need escalation';
      } else {
        outcome = 'Significant decline despite intervention — urgent follow-up needed';
      }

      await sql`
        UPDATE interventions
        SET outcome              = ${outcome},
            outcome_measured_at  = NOW(),
            health_score_after   = ${scoreAfter},
            is_member_save       = ${isSave},
            dues_protected       = ${duesProtected},
            revenue_recovered    = ${revenueRecovered}
        WHERE intervention_id = ${intv.intervention_id}
      `;

      measured++;
      if (isSave) saves++;
    }

    logInfo('/api/cron/track-outcomes', `measured ${measured}, saves ${saves}`);
    return res.status(200).json({ measured, saves });
  } catch (e) {
    logWarn('/api/cron/track-outcomes', 'error', { message: e.message });
    return res.status(500).json({ error: e.message });
  }
}
