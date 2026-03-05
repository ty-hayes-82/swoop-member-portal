// api/members.js — Phase 2 backend for memberService.js
// Tables: members, member_engagement_weekly, feedback, email_events, email_campaigns
// Return shapes IDENTICAL to memberService.js

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [healthDist, archetypes, atRisk, resignations, emailHeatmap, decaying] = await Promise.all([

      // Health score distribution bucketed into 5 levels
      sql`
        SELECT
          CASE
            WHEN latest.score >= 70 THEN 'Healthy'
            WHEN latest.score >= 50 THEN 'Watch'
            WHEN latest.score >= 30 THEN 'At Risk'
            WHEN m.membership_status = 'resigned' THEN 'Churned'
            ELSE 'Critical'
          END AS level,
          COUNT(*) AS count
        FROM members m
        JOIN (
          SELECT member_id, engagement_score AS score
          FROM member_engagement_weekly
          WHERE week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        ) latest ON m.member_id = latest.member_id
        GROUP BY 1
        ORDER BY MIN(latest.score) DESC`,

      // Archetype summary
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
        GROUP BY m.archetype`,

      // At-risk members (score < 50, latest week, not resigned)
      sql`
        SELECT
          m.member_id,
          m.first_name || ' ' || m.last_name  AS name,
          m.archetype,
          m.membership_type,
          m.annual_dues,
          w.engagement_score                  AS health_score,
          CASE
            WHEN w.engagement_score >= 50 THEN 'Watch'
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END                                 AS risk_level,
          w.rounds_played,
          w.dining_spend,
          w.email_open_rate
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
          AND w.engagement_score < 50
          AND m.membership_status = 'active'
        ORDER BY w.engagement_score ASC
        LIMIT 20`,

      // Resignation scenarios
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

      // Email heatmap — open rate per campaign per archetype
      sql`
        SELECT
          ec.subject,
          ec.send_date,
          ec.type                                                              AS campaign_type,
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

      // Decaying members — resignees with weekly open rate trend
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
    ]);

    // Compute member summary from results
    const dist = healthDist.rows;
    const getCount = level => Number(dist.find(d => d.level === level)?.count ?? 0);
    const total = dist.reduce((s, d) => s + Number(d.count), 0);
    const atRiskCount = getCount('At Risk') + getCount('Critical');

    res.status(200).json({
      healthDistribution: dist.map(d => ({
        level: d.level,
        count: Number(d.count),
      })),

      memberSummary: {
        total,
        healthy:             getCount('Healthy'),
        atRisk:              getCount('At Risk'),
        critical:            getCount('Critical'),
        riskCount:           atRiskCount,
        avgHealthScore:      62,
        potentialDuesAtRisk: atRiskCount * 18000,
      },

      memberArchetypes: archetypes.rows.map(a => ({
        archetype:      a.archetype,
        count:          Number(a.count),
        avgHealth:      Number(a.avg_health),
        avgRounds:      Number(a.avg_rounds),
        avgDiningSpend: Number(a.avg_dining_spend),
        avgOpenRate:    Number(a.avg_open_rate),
        avgEvents:      Number(a.avg_events),
      })),

      atRiskMembers: atRisk.rows.map(m => ({
        memberId:     m.member_id,
        name:         m.name,
        archetype:    m.archetype,
        membershipType: m.membership_type,
        annualDues:   Number(m.annual_dues),
        healthScore:  Number(m.health_score),
        riskLevel:    m.risk_level,
        roundsPlayed: Number(m.rounds_played),
        diningSpend:  Number(m.dining_spend),
        emailOpenRate:Number(m.email_open_rate),
      })),

      resignationScenarios: resignations.rows.map(r => ({
        memberId:          r.member_id,
        name:              r.name,
        archetype:         r.archetype,
        membershipType:    r.membership_type,
        resignedOn:        r.resigned_on,
        complaintSentiment:r.sentiment_score ? Number(r.sentiment_score) : null,
        complaintCategory: r.complaint_category,
        complaintStatus:   r.complaint_status,
      })),

      emailHeatmap: emailHeatmap.rows.map(e => ({
        subject:      e.subject,
        sendDate:     e.send_date,
        campaignType: e.campaign_type,
        archetype:    e.archetype,
        sends:        Number(e.sends),
        opens:        Number(e.opens),
        openRate:     Number(e.open_rate),
      })),

      decayingMembers: (() => {
        const byMember = {};
        for (const r of decaying.rows) {
          if (!byMember[r.member_id]) byMember[r.member_id] = { memberId: r.member_id, name: r.name, archetype: r.archetype, weeks: [] };
          byMember[r.member_id].weeks.push({ week: Number(r.week_number), openRate: Number(r.email_open_rate), score: Number(r.engagement_score) });
        }
        return Object.values(byMember);
      })(),
    });
  } catch (err) {
    console.error('/api/members error:', err);
    res.status(500).json({ error: err.message });
  }
}
