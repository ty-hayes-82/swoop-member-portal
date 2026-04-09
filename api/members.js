// api/members.js — Phase 2 backend for memberService.js
// Tables: members, member_engagement_weekly, feedback, email_events, email_campaigns
// Return shapes IDENTICAL to memberService.js

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';
import { theme } from '../src/config/theme.js';
import { logError } from './lib/logger.js';

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};
const formatCurrency = (value) => {
  const numeric = toNumber(value, null);
  if (numeric === null) return '—';
  return `$${Math.round(numeric).toLocaleString('en-US')}`;
};
const formatPercent = (value) => `${Math.max(0, Math.round(value))}%`;

const archetypeBaselines = {
  'Die-Hard Golfer':  { rounds: 8,  dining: 140, events: 1, email: 0.42 },
  'Social Butterfly': { rounds: 3,  dining: 260, events: 3, email: 0.55 },
  'Balanced Active':  { rounds: 6,  dining: 180, events: 2, email: 0.48 },
  'Weekend Warrior':  { rounds: 5,  dining: 120, events: 1, email: 0.36 },
  'Declining':        { rounds: 4,  dining: 90,  events: 1, email: 0.22 },
  'New Member':       { rounds: 4,  dining: 150, events: 2, email: 0.52 },
  'Ghost':            { rounds: 2,  dining: 60,  events: 0, email: 0.18 },
  'Snowbird':         { rounds: 6,  dining: 210, events: 2, email: 0.44 },
  default:            { rounds: 4,  dining: 150, events: 1, email: 0.4 },
};

export default withAuth(async function handler(req, res) {
  const clubId = getReadClubId(req);
  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS latest_week FROM member_engagement_weekly WHERE club_id = ${clubId}`;
    const latestWeek = toNumber(latestWeekResult.rows[0]?.latest_week, 0);

    if (!latestWeek) {
      // No engagement_weekly data — use health scores computed directly on the members table
      const rosterResult = await sql`
        SELECT member_id::text AS member_id,
          COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), 'Member ' || RIGHT(member_id::text, 3)) AS name,
          first_name, last_name, email, phone, membership_type, annual_dues, join_date,
          COALESCE(membership_status, 'active') AS status, household_id,
          health_score, health_tier, archetype
        FROM members WHERE club_id = ${clubId} AND COALESCE(membership_status, 'active') != 'resigned'
        ORDER BY last_name, first_name
        LIMIT 1000`;
      const total = rosterResult.rows.length;
      const hasScores = rosterResult.rows.some(r => r.health_score != null || r.health_tier != null);

      const roster = rosterResult.rows.map(r => ({
        memberId: r.member_id, name: r.name, firstName: r.first_name, lastName: r.last_name,
        email: r.email, phone: r.phone, membershipType: r.membership_type,
        annualDues: toNumber(r.annual_dues), joinDate: r.join_date, status: r.status,
        householdId: r.household_id,
        score: r.health_score != null ? toNumber(r.health_score) : null,
        archetype: r.archetype || null,
        tier: r.health_tier || 'Insufficient Data',
        trend: 'stable',
        topRisk: r.health_score != null && toNumber(r.health_score) < 50
          ? 'Engagement declining across systems'
          : (r.health_score == null ? 'Health score requires golf + dining data' : 'No current risks'),
      }));

      // Build health distribution from members table if scores exist
      let healthDistribution = [];
      let memberArchetypes = [];
      let atRiskMembers = [];
      let summaryData = { total, healthy: 0, atRisk: 0, critical: 0, riskCount: 0, avgHealthScore: 0, potentialDuesAtRisk: 0 };

      if (total > 0) {
        const tierCounts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0, 'Insufficient Data': 0 };
        const archetypeCounts = {};
        let scoreSum = 0, scoreCount = 0;
        for (const r of rosterResult.rows) {
          const tier = r.health_tier || 'Insufficient Data';
          tierCounts[tier] = (tierCounts[tier] || 0) + 1;
          if (r.archetype) archetypeCounts[r.archetype] = (archetypeCounts[r.archetype] || 0) + 1;
          if (r.health_score != null) { scoreSum += toNumber(r.health_score); scoreCount++; }
        }
        const levelColors = { Healthy: '#22C55E', Watch: '#EAB308', 'At Risk': '#B45309', Critical: '#B91C1C', 'Insufficient Data': '#D4D4D8' };
        healthDistribution = Object.entries(tierCounts)
          .filter(([, count]) => count > 0)
          .map(([level, count]) => ({ level, count, percentage: total > 0 ? count / total : 0, color: levelColors[level] || '#D4D4D8' }));

        const radarProfiles = {
          'Die-Hard Golfer': { golf: 88, dining: 42, events: 28, email: 32, trend: 4 },
          'Social Butterfly': { golf: 18, dining: 82, events: 78, email: 72, trend: 6 },
          'Balanced Active': { golf: 68, dining: 62, events: 54, email: 55, trend: -2 },
          'Weekend Warrior': { golf: 52, dining: 44, events: 32, email: 28, trend: -8 },
          'Declining': { golf: 24, dining: 18, events: 8, email: 22, trend: -18 },
          'New Member': { golf: 42, dining: 48, events: 38, email: 68, trend: 14 },
          'Ghost': { golf: 4, dining: 6, events: 2, email: 8, trend: -4 },
          'Snowbird': { golf: 62, dining: 52, events: 34, email: 44, trend: 2 },
        };
        memberArchetypes = Object.entries(archetypeCounts).map(([archetype, count]) => ({
          archetype, count, ...(radarProfiles[archetype] || { golf: 50, dining: 50, events: 50, email: 50, trend: 0 }),
        }));

        atRiskMembers = roster.filter(r => r.score != null && r.score < 50).map(r => ({
          memberId: r.memberId, name: r.name, archetype: r.archetype, membershipType: r.membershipType,
          annualDues: r.annualDues, duesAnnual: r.annualDues, healthScore: r.score, score: r.score,
          riskLevel: r.score < 30 ? 'Critical' : 'At Risk', trend: 'declining', topRisk: r.topRisk,
        }));

        summaryData = {
          total, healthy: tierCounts.Healthy || 0,
          atRisk: tierCounts['At Risk'] || 0, critical: tierCounts.Critical || 0,
          riskCount: (tierCounts['At Risk'] || 0) + (tierCounts.Critical || 0),
          avgHealthScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount * 10) / 10 : 0,
          potentialDuesAtRisk: rosterResult.rows.filter(r => (r.health_tier === 'At Risk' || r.health_tier === 'Critical') || (r.health_score != null && toNumber(r.health_score) < 50)).reduce((s, r) => s + toNumber(r.annual_dues), 0),
        };
      }

      return res.status(200).json({
        total,
        memberRoster: roster,
        healthDistribution,
        memberSummary: summaryData,
        memberArchetypes,
        atRiskMembers,
        resignationScenarios: [],
        emailHeatmap: [],
        decayingMembers: [],
      });
    }

    const [healthDist, archetypes, atRisk, resignations, emailHeatmap, summaryStats, rosterResult] = await Promise.all([
      sql`
        WITH latest_scores AS (
          SELECT member_id, engagement_score AS score
          FROM member_engagement_weekly
          WHERE week_number = ${latestWeek} AND club_id = ${clubId}
        )
        SELECT
          CASE
            WHEN ls.score >= 70 THEN 'Healthy'
            WHEN ls.score >= 50 THEN 'Watch'
            WHEN ls.score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS level,
          COUNT(*) AS count
        FROM members m
        LEFT JOIN latest_scores ls ON ls.member_id::text = m.member_id::text
        WHERE m.club_id = ${clubId}
          AND COALESCE(m.membership_status, 'active') <> 'resigned'
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
        JOIN member_engagement_weekly w ON m.member_id::text = w.member_id::text
        WHERE w.week_number = ${latestWeek} AND m.club_id = ${clubId}
        GROUP BY m.archetype`,

      sql`
        SELECT
          m.member_id::text AS member_id,
          COALESCE(NULLIF(TRIM(m.first_name || ' ' || m.last_name), ''), 'Member ' || RIGHT(m.member_id::text, 3)) AS name,
          m.archetype,
          m.membership_type,
          m.annual_dues,
          w.engagement_score                 AS health_score,
          CASE
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END                                AS risk_level,
          w.rounds_played,
          w.dining_visits,
          w.dining_spend,
          w.events_attended,
          w.email_open_rate,
          f.category                         AS open_complaint_category,
          f.days_open                        AS open_complaint_days_open
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id::text = w.member_id::text
        LEFT JOIN LATERAL (
          SELECT
            fb.category,
            (CURRENT_DATE - fb.submitted_at::date) AS days_open
          FROM feedback fb
          WHERE fb.member_id = m.member_id
            AND fb.status IN ('acknowledged', 'in_progress', 'escalated')
          ORDER BY fb.submitted_at DESC
          LIMIT 1
        ) f ON TRUE
        WHERE w.week_number = ${latestWeek}
          AND w.engagement_score < 50
          AND COALESCE(m.membership_status, 'active') <> 'resigned'
          AND m.club_id = ${clubId}
        ORDER BY w.engagement_score ASC`,

      sql`
        SELECT
          m.member_id::text AS member_id,
          COALESCE(NULLIF(TRIM(m.first_name || ' ' || m.last_name), ''), 'Member ' || RIGHT(m.member_id::text, 3)) AS name,
          m.archetype,
          m.membership_type,
          m.annual_dues,
          m.resigned_on,
          f.sentiment_score,
          f.category                          AS complaint_category,
          f.status                            AS complaint_status
        FROM members m
        LEFT JOIN feedback f ON m.member_id = f.member_id
          AND f.sentiment_score <= -0.5
        WHERE m.membership_status = 'resigned' AND m.club_id = ${clubId}
        ORDER BY m.resigned_on`,

      sql`
        SELECT
          ec.subject,
          ec.send_date,
          ec.type                                                             AS campaign_type,
          m.archetype,
          COUNT(*) FILTER (WHERE ee.event_type = 'sent')                     AS sends,
          COUNT(*) FILTER (WHERE ee.event_type = 'opened')                     AS opens,
          ROUND(
            COUNT(*) FILTER (WHERE ee.event_type = 'opened')::numeric /
            NULLIF(COUNT(*) FILTER (WHERE ee.event_type = 'sent'), 0), 3
          )                                                                   AS open_rate
        FROM email_campaigns ec
        JOIN email_events ee ON ec.campaign_id = ee.campaign_id
        JOIN members m ON ee.member_id::text = m.member_id::text
        WHERE m.club_id = ${clubId}
        GROUP BY ec.campaign_id, ec.subject, ec.send_date, ec.type, m.archetype
        ORDER BY ec.send_date, m.archetype`,

      sql`
        SELECT
          ROUND(AVG(w.engagement_score)::numeric, 1)                            AS avg_health_score,
          SUM(CASE WHEN w.engagement_score < 50 THEN m.annual_dues ELSE 0 END) AS dues_at_risk
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id::text = w.member_id::text
        WHERE w.week_number = ${latestWeek}
          AND COALESCE(m.membership_status, 'active') <> 'resigned'
          AND m.club_id = ${clubId}`,

      sql`
        SELECT
          m.member_id::text AS member_id,
          COALESCE(NULLIF(TRIM(m.first_name || ' ' || m.last_name), ''), 'Member ' || RIGHT(m.member_id::text, 3)) AS name,
          m.first_name, m.last_name, m.email, m.phone,
          m.membership_type, m.annual_dues, m.join_date,
          COALESCE(m.membership_status, 'active') AS status,
          m.household_id, m.archetype,
          w.engagement_score AS score,
          CASE
            WHEN w.engagement_score >= 70 THEN 'Healthy'
            WHEN w.engagement_score >= 50 THEN 'Watch'
            WHEN w.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS tier
        FROM members m
        LEFT JOIN member_engagement_weekly w ON m.member_id::text = w.member_id::text
          AND w.week_number = ${latestWeek}
        WHERE COALESCE(m.membership_status, 'active') <> 'resigned'
          AND m.club_id = ${clubId}
        ORDER BY m.last_name, m.first_name
        LIMIT 1000`,
    ]);

    // Decaying members: find members whose email open rate dropped 25%+ over 3 weeks
    const decaying = await sql`
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
        JOIN members m ON m.member_id::text = w.member_id::text
        WHERE w.week_number >= ${Math.max(1, latestWeek - 8)}
          AND COALESCE(m.membership_status, 'active') <> 'resigned'
          AND m.club_id = ${clubId}
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
          AND open_three_weeks_ago > 0.05
          AND latest_open <= open_three_weeks_ago * 0.75
        ORDER BY latest_open ASC
        LIMIT 8
      )
      SELECT
        rw.member_id,
        rw.name,
        rw.archetype,
        rw.week_number,
        rw.email_open_rate,
        rw.engagement_score
      FROM recent_weeks rw
      WHERE rw.member_id IN (SELECT member_id FROM decaying_ids)
      ORDER BY rw.member_id, rw.week_number`;

    const dist = healthDist.rows;
    const getCount = (level) => toNumber(dist.find((row) => row.level === level)?.count, 0);
    const total = dist.reduce((sum, row) => sum + toNumber(row.count), 0);
    const atRiskCount = getCount('At Risk') + getCount('Critical');
    const summaryRow = summaryStats.rows[0] ?? {};
    const duesAtRiskFromRoster = atRisk.rows.reduce((sum, row) => sum + toNumber(row.annual_dues), 0);

    const levelColors = {
      Healthy: theme.colors.success,
      Watch: theme.colors.warning,
      'At Risk': theme.colors.riskAtRiskAlt,
      Critical: theme.colors.urgent,
      Churned: theme.colors.urgent,
    };

    res.status(200).json({
      total,

      memberRoster: rosterResult.rows.map((r) => ({
        memberId: r.member_id,
        name: r.name,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        membershipType: r.membership_type,
        annualDues: toNumber(r.annual_dues),
        memberValueAnnual: toNumber(r.annual_dues),
        joinDate: r.join_date,
        status: r.status,
        householdId: r.household_id,
        score: toNumber(r.score),
        archetype: r.archetype || null,
        tier: r.tier || 'Insufficient Data',
        trend: 'stable',
        topRisk: r.score != null && toNumber(r.score) < 50
          ? 'Engagement declining across systems'
          : 'No current risks',
      })),

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
        potentialDuesAtRisk: Math.round(duesAtRiskFromRoster || toNumber(summaryRow.dues_at_risk)),
      },

      memberArchetypes: (() => {
        const radarProfiles = {
          'Die-Hard Golfer':  { golf: 88, dining: 42, events: 28, email: 32, trend: +4 },
          'Social Butterfly': { golf: 18, dining: 82, events: 78, email: 72, trend: +6 },
          'Balanced Active':  { golf: 68, dining: 62, events: 54, email: 55, trend: -2 },
          'Weekend Warrior':  { golf: 52, dining: 44, events: 32, email: 28, trend: -8 },
          'Declining':        { golf: 24, dining: 18, events: 8,  email: 22, trend: -18 },
          'New Member':       { golf: 42, dining: 48, events: 38, email: 68, trend: +14 },
          'Ghost':            { golf: 4,  dining: 6,  events: 2,  email: 8,  trend: -4 },
          'Snowbird':         { golf: 62, dining: 52, events: 34, email: 44, trend: +2 },
        };
        return archetypes.rows.map((row) => {
          const profile = radarProfiles[row.archetype] || { golf: 50, dining: 50, events: 50, email: 50, trend: 0 };
          return {
            archetype: row.archetype,
            count: toNumber(row.count),
            ...profile,
          };
        });
      })(),

      atRiskMembers: atRisk.rows.map((row) => {
        const rounds = toNumber(row.rounds_played);
        const diningSpend = toNumber(row.dining_spend);
        const diningVisits = toNumber(row.dining_visits);
        const eventsAttended = toNumber(row.events_attended);
        const emailOpenRate = toNumber(row.email_open_rate);
        const annualDues = toNumber(row.annual_dues);
        const baseline = archetypeBaselines[row.archetype] || archetypeBaselines.default;
        const reasons = [];
        const addReason = (reason) => {
          if (!reason) return;
          if (!reasons.includes(reason)) reasons.push(reason);
        };

        if (row.open_complaint_category) {
          const daysOpen = toNumber(row.open_complaint_days_open, 0);
          const dayLabel = daysOpen > 0 ? `${daysOpen} day${daysOpen === 1 ? '' : 's'}` : 'today';
          addReason(`Open ${row.open_complaint_category.toLowerCase()} complaint ${dayLabel}`);
        }

        const roundDrop = baseline.rounds
          ? Math.round(Math.max(0, ((baseline.rounds - rounds) / baseline.rounds) * 100))
          : 0;
        if (rounds === 0) {
          addReason('Zero golf activity in 30 days');
        } else if (roundDrop >= 25) {
          addReason(`Golf frequency down ${roundDrop}%`);
        }

        const diningDrop = baseline.dining
          ? Math.round(Math.max(0, ((baseline.dining - diningSpend) / baseline.dining) * 100))
          : 0;
        if (diningDrop >= 30) {
          addReason(`Dining spend -${diningDrop}% vs usual`);
        } else if (diningSpend < 50) {
          addReason('Minimal dining activity');
        } else if (diningVisits === 0 && reasons.length < 2) {
          addReason('No recent dining visits logged');
        }

        if (baseline.events >= 1 && eventsAttended === 0) {
          addReason('No event attendance in 8 weeks');
        }

        const emailPercent = Math.round(emailOpenRate * 100);
        if (baseline.email && emailOpenRate < baseline.email * 0.6) {
          addReason(`Email opens down to ${emailPercent}%`);
        } else if (emailOpenRate < 0.15) {
          addReason('Email engagement dropped');
        }

        if (!reasons.length) {
          const fallbackDetails = [];
          if (rounds === 0) {
            fallbackDetails.push('Zero golf activity in 30 days');
          } else {
            fallbackDetails.push(`${rounds} round${rounds === 1 ? '' : 's'} logged in 30 days`);
          }

          if (diningSpend > 0) {
            fallbackDetails.push(`Dining spend ${formatCurrency(diningSpend)}`);
          }

          if (eventsAttended === 0) {
            fallbackDetails.push('No event attendance recorded');
          }

          fallbackDetails.push(`Email opens ${formatPercent(emailPercent)}`);
          reasons.push(...fallbackDetails);
        }

        const primaryRisk = reasons.length ? reasons.slice(0, 2).join(' • ') : 'Behavioral decay detected across systems';

        return {
          memberId: row.member_id,
          name: row.name,
          archetype: row.archetype,
          membershipType: row.membership_type,
          annualDues,
          duesAnnual: annualDues,
          healthScore: toNumber(row.health_score),
          score: toNumber(row.health_score),
          riskLevel: row.risk_level,
          roundsPlayed: rounds,
          diningSpend,
          emailOpenRate,
          trend: 'declining',
          topRisk: primaryRisk,
        };
      }),

      resignationScenarios: resignations.rows.map((row) => ({
        memberId: row.member_id,
        name: row.name,
        archetype: row.archetype,
        membershipType: row.membership_type,
        annualDues: toNumber(row.annual_dues),
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
    logError('/api/members', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
