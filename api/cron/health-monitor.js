// SUPERSEDED: cron-member-pulse now handles this via member_pulse_analyst session. Remove after 7-day parallel-run validation.
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
import { sendStaffSms } from '../sms/send.js';

const MAX_CANDIDATES_PER_RUN = 25;

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
            AND hs.computed_at >= NOW() - INTERVAL '7 days'
        )
        AND NOT EXISTS (
          SELECT 1 FROM playbook_runs pr
          WHERE pr.member_id = m.member_id
            AND pr.club_id = m.club_id
            AND pr.playbook_id = 'member-risk-lifecycle'
            AND pr.status = 'active'
        )
      ORDER BY m.annual_dues DESC
      LIMIT ${MAX_CANDIDATES_PER_RUN}
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

    // --- Service recovery escalation SMS ---
    // Find critical members (health < 35) with complaints unresolved > 3 days
    // and SMS staff who have complaint_escalation in their alert categories.
    let escalationsSent = 0;
    try {
      const { rows: criticalMembers } = await sql`
        SELECT DISTINCT m.member_id, m.club_id, m.first_name, m.last_name,
               m.health_score, m.annual_dues,
               c.complaint_id,
               EXTRACT(DAY FROM NOW() - c.reported_at)::int AS days_open
        FROM members m
        JOIN complaints c ON c.member_id = m.member_id AND c.club_id = m.club_id
        WHERE m.health_score < 35
          AND c.status != 'resolved'
          AND c.reported_at <= NOW() - INTERVAL '3 days'
          AND m.annual_dues >= 5000
        ORDER BY m.health_score ASC, m.annual_dues DESC
        LIMIT 10
      `;

      for (const member of criticalMembers) {
        try {
          // Get club name
          const { rows: [clubRow] } = await sql`SELECT name FROM club WHERE club_id = ${member.club_id}`;
          const clubName = clubRow?.name || 'Your Club';

          // Find staff with complaint_escalation category
          const { rows: alertStaff } = await sql`
            SELECT user_id FROM users
            WHERE club_id = ${member.club_id}
              AND sms_alerts_enabled = TRUE
              AND 'complaint_escalation' = ANY(alert_categories)
            LIMIT 5
          `;

          for (const staffUser of alertStaff) {
            const result = await sendStaffSms({
              clubId: member.club_id,
              userId: staffUser.user_id,
              templateId: 'staff_complaint',
              variables: {
                club_name: clubName,
                member_name: `${member.first_name} ${member.last_name}`,
                health_score: Math.round(member.health_score),
                dues: Math.round(member.annual_dues / 1000) + 'K',
                days: member.days_open,
                action: 'Call before 10 AM',
                link: '',
              },
              priority: 'urgent',
            });
            if (result.sent) escalationsSent++;
          }
        } catch (err) {
          logWarn('/api/cron/health-monitor', `escalation SMS failed for ${member.member_id}`, { error: err.message });
        }
      }

      logInfo('/api/cron/health-monitor', `service recovery escalations sent: ${escalationsSent}`);
    } catch (err) {
      logWarn('/api/cron/health-monitor', 'service recovery escalation block failed', { error: err.message });
    }

    logInfo('/api/cron/health-monitor', 'cron tick complete', {
      candidatesChecked: candidates.length,
      triggered: results.filter(r => r.shouldTrigger).length,
      escalationsSent,
    });

    return res.json({
      candidatesChecked: candidates.length,
      triggered: results.filter(r => r.shouldTrigger).length,
      escalationsSent,
      results,
    });
  } catch (err) {
    console.error('Health monitor cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}
