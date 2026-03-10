// api/members.js — Phase 2 backend for memberService.js
// Tables: members, member_engagement_weekly, feedback, email_events, email_campaigns
// Return shapes IDENTICAL to memberService.js

import { sql } from '@vercel/postgres';
import { theme } from '../src/config/theme.js';

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export default async function handler(req, res) {
  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS latest_week FROM member_engagement_weekly`;
    const latestWeek = toNumber(latestWeekResult.rows[0]?.latest_week, 0);

    if (!latestWeek) {
      return res.status(200).json({
        healthDistribution: [],
        memberSummary: {
          total: 0,
          healthy: 0,
          atRisk: 0,
          critical: 0,
          riskCount: 0,
          avgHealthScore: 0,
          potentialDuesAtRisk: 0,
        },
        memberArchetypes: [],
        atRiskMembers: [],
        resignationScenarios: [],
        emailHeatmap: [],
        decayingMembers: [],
      });
    }

    const [healthDist, archetypes, atRisk, resignations, emailHeatmap, decayingInitial, summaryStats] = await Promise.all([
      sql`
        WITH latest_scores AS (
          SELECT member_id, engagement_score AS score
          FROM member_engagement_weekly
          WHERE week_number = ${latestWeek}
        )
        SELECT
          CASE
            WHEN m.membership_status = 'resigned' THEN 'Churned'
            WHEN ls.score >= 70 THEN 'Healthy'
            WHEN ls.score >= 50 THEN 'Watch'
            WHEN ls.score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS level,
          COUNT(*) AS count
        FROM members m
        LEFT JOIN latest_scores ls ON ls.member_id = m.member_id
        GROUP BY 1
        ORDER BY MIN(COALESCE(ls.score, 0)) DESC`,

      sql`
        SELECT
          m.archetype,
          COUNT(*)                                     AS count,
          ROUND(AVG(w.engagement_score)::numeric, 1)  AS avg_health,
          ROUND(AVG(w.rounds_played)::numeric, 1)     AS avg_rounds,
          ROUND(AVG(w.dining_spend)::numeric, 2)      AS avg_dining_spend,
          ROUND(AVG(w.email_open_rate)::numeric, 3)   AS avg_open_rate,
          ROUND(AVG(w.events_attended)::numeric, 2)   AS avg_events
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = ${latestWeek}
        GROUP BY m.archetype`,

      sql`
        SELECT
          m.member_id,
          m.first_name || ' ' || m.last_name AS name,
          m.archetype,
          m.membership_type,
          m.annual_dues,
          w.engagement_score                 AS health_score,
          CASE
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END                                AS risk_level,
          w.rounds_played,
          w.dining_spend,
          w.email_open_rate
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = ${latestWeek}
          AND w.engagement_score < 50
          AND m.membership_status <> 'resigned'
        ORDER BY w.engagement_score ASC`,

      sql`
        SELECT
          m.member_id,
          m.first_name || ' ' || m.last_name AS name,
          m.archetype,
          m.membership_type,
          m.resigned_on,
          f.sentiment_score,
          f.category                          AS complaint_category,
          f.status                            AS complaint_status
        FROM members m
        LEFT JOIN feedback f ON m.member_id = f.member_id
          AND f.sentiment_score <= -0.5
        WHERE m.membership_status = 'resigned'
        ORDER BY m.resigned_on`,

      sql`
        SELECT
          ec.subject,
          ec.send_date,
          ec.type                                                             AS campaign_type,
          m.archetype,
          COUNT(*) FILTER (WHERE ee.event_type = 'send')                     AS sends,
          COUNT(*) FILTER (WHERE ee.event_type = 'open')                     AS opens,
          ROUND(
            COUNT(*) FILTER (WHERE ee.event_type = 'open')::numeric /
            NULLIF(COUNT(*) FILTER (WHERE ee.event_type = 'send'), 0), 3
          )                                                                   AS open_rate
        FROM email_campaigns ec
        JOIN email_events ee ON ec.campaign_id = ee.campaign_id
        JOIN members m ON ee.member_id = m.member_id
        GROUP BY ec.campaign_id, ec.subject, ec.send_date, ec.type, m.archetype
        ORDER BY ec.send_date, m.archetype`,

      sql`
        SELECT
          m.member_id,
          m.first_name || ' ' || m.last_name AS name,
          m.archetype,
          w.week_number,
          w.email_open_rate,
          w.engagement_score
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE m.membership_status = 'resigned'
        ORDER BY m.member_id, w.week_number`,

      sql`
        SELECT
          ROUND(AVG(w.engagement_score)::numeric, 1)                            AS avg_health_score,
          SUM(CASE WHEN w.engagement_score < 50 THEN m.annual_dues ELSE 0 END) AS dues_at_risk
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = ${latestWeek}
          AND m.membership_status <> 'resigned'`,
    ]);

    let decaying = decayingInitial;
    if (!decaying?.rowCount) {
      decaying = await sql`
        WITH recent_weeks AS (
          SELECT
            w.member_id,
            m.first_name || ' ' || m.last_name AS name,
            m.archetype,
            w.week_number,
            w.email_open_rate,
            w.engagement_score,
            ROW_NUMBER() OVER (PARTITION BY w.member_id ORDER BY w.week_number DESC) AS week_rank
          FROM member_engagement_weekly w
          JOIN members m ON m.member_id = w.member_id
          WHERE w.week_number >= ${Math.max(1, latestWeek - 8)}
        ), trending AS (
          SELECT
            member_id,
            name,
            archetype,
            MAX(CASE WHEN week_rank = 1 THEN email_open_rate END) AS latest_open,
            MAX(CASE WHEN week_rank = 3 THEN email_open_rate END) AS open_three_weeks_ago
          FROM recent_weeks
          WHERE week_rank <= 6
          GROUP BY member_id, name, archetype
        ), decaying_ids AS (
          SELECT member_id
          FROM trending
          WHERE open_three_weeks_ago IS NOT NULL
            AND latest_open IS NOT NULL
            AND latest_open <= open_three_weeks_ago * 0.75
          ORDER BY latest_open ASC
          LIMIT 8
        )
        SELECT
          m.member_id,
          m.first_name || ' ' || m.last_name AS name,
          m.archetype,
          w.week_number,
          w.email_open_rate,
          w.engagement_score
        FROM member_engagement_weekly w
        JOIN members m ON m.member_id = w.member_id
        WHERE w.member_id IN (SELECT member_id FROM decaying_ids)
        ORDER BY m.member_id, w.week_number`;
    }

    const dist = healthDist.rows;
    const getCount = (level) => toNumber(dist.find((row) => row.level === level)?.count, 0);
    const total = dist.reduce((sum, row) => sum + toNumber(row.count), 0);
    const atRiskCount = getCount('At Risk') + getCount('Critical');
    const summaryRow = summaryStats.rows[0] ?? {};

    const levelColors = {
      Healthy: theme.colors.success,
      Watch: theme.colors.warning,
      'At Risk': theme.colors.riskAtRiskAlt,
      Critical: theme.colors.urgent,
      Churned: theme.colors.urgent,
    };

    res.status(200).json({
      healthDistribution: dist.map((row) => ({
        level: row.level,
        count: toNumber(row.count),
        percentage: total > 0 ? toNumber(row.count) / total : 0,
        color: levelColors[row.level] ?? theme.colors.info,
      })),

      memberSummary: {
        total,
        healthy: getCount('Healthy'),
        atRisk: getCount('At Risk'),
        critical: getCount('Critical'),
        riskCount: atRiskCount,
        avgHealthScore: toNumber(summaryRow.avg_health_score),
        potentialDuesAtRisk: Math.round(toNumber(summaryRow.dues_at_risk)),
      },

      memberArchetypes: archetypes.rows.map((row) => {
        const avgRounds = toNumber(row.avg_rounds);
        const avgDiningSpend = toNumber(row.avg_dining_spend);
        const avgEvents = toNumber(row.avg_events);
        const avgOpenRate = toNumber(row.avg_open_rate);
        return {
          archetype: row.archetype,
          count: toNumber(row.count),
          golf: Math.round(Math.min(100, (avgRounds / 4) * 100)),
          dining: Math.round(Math.min(100, (avgDiningSpend / 150) * 100)),
          events: Math.round(Math.min(100, avgEvents * 100)),
          email: Math.round(Math.min(100, avgOpenRate * 100)),
          trend: 0,
        };
      }),

      atRiskMembers: atRisk.rows.map((row) => {
        const rounds = toNumber(row.rounds_played);
        const diningSpend = toNumber(row.dining_spend);
        const emailOpenRate = toNumber(row.email_open_rate);
        const riskReasons = [];
        if (rounds === 0) riskReasons.push('Zero golf activity');
        if (emailOpenRate < 0.15) riskReasons.push('Email engagement dropped');
        if (diningSpend < 30) riskReasons.push('Minimal dining');

        return {
          memberId: row.member_id,
          name: row.name,
          archetype: row.archetype,
          membershipType: row.membership_type,
          annualDues: toNumber(row.annual_dues),
          healthScore: toNumber(row.health_score),
          score: toNumber(row.health_score),
          riskLevel: row.risk_level,
          roundsPlayed: rounds,
          diningSpend,
          emailOpenRate,
          trend: 'declining',
          topRisk: riskReasons.join('; ') || 'Monitoring',
        };
      }),

      resignationScenarios: resignations.rows.map((row) => ({
        memberId: row.member_id,
        name: row.name,
        archetype: row.archetype,
        membershipType: row.membership_type,
        resignedOn: row.resigned_on,
        complaintSentiment: row.sentiment_score ? toNumber(row.sentiment_score) : null,
        complaintCategory: row.complaint_category,
        complaintStatus: row.complaint_status,
      })),

      emailHeatmap: emailHeatmap.rows.map((row) => ({
        subject: row.subject,
        sendDate: row.send_date,
        campaignType: row.campaign_type,
        archetype: row.archetype,
        sends: toNumber(row.sends),
        opens: toNumber(row.opens),
        openRate: toNumber(row.open_rate),
      })),

      decayingMembers: (() => {
        const byMember = {};
        for (const row of decaying.rows) {
          if (!byMember[row.member_id]) {
            byMember[row.member_id] = {
              memberId: row.member_id,
              name: row.name,
              archetype: row.archetype,
              weeks: [],
            };
          }
          byMember[row.member_id].weeks.push({
            week: toNumber(row.week_number),
            openRate: toNumber(row.email_open_rate),
            score: toNumber(row.engagement_score),
          });
        }
        return Object.values(byMember);
      })(),
    });
  } catch (err) {
    console.error('/api/members error:', err);
    res.status(500).json({ error: err.message });
  }
}
