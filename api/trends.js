// api/trends.js — Phase 2 backend for trendsService.js
// Tables: close_outs, member_engagement_weekly, pos_checks, feedback, email_events
// Returns the same `trends` object shape that trendsService.js reads from data/trends.js
// MONTHS array: ['Aug','Sep','Oct','Nov','Dec','Jan'] — Jan = current (index 5)

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

// The DB only has January 2026 data. Aug–Dec are static prior-period values
// (identical to data/trends.js). This function merges them so chart shapes are unchanged.
const PRIOR_TRENDS = {
  postRoundConversion: [0.39, 0.40, 0.41, 0.38],
  slowRoundRate:       [0.19, 0.20, 0.22, 0.24],
  memberHealthAvg:     [72,   71,   70,   69],
  atRiskMemberCount:   [54,   58,   62,   66],
  fbRevenue:           [108000, 110000, 116000, 110000],
  golfRevenue:         [298000, 312000, 326000, 318000],
  avgDiningCheck:      [36.2, 37.0, 38.4, 37.8],
  emailOpenRateAvg:    [0.42, 0.41, 0.40, 0.38],
  complaintsPerMonth:  [18,   20,   22,   24],
  newMemberCount:      [3,    2,    4,    2],
  resignationCount:    [0,    1,    1,    2],
};

const PRIOR_OUTLET_TRENDS = {
  'Grill Room':        [38000, 40000, 42000, 41000, 43000],
  'Main Dining Room':  [28000, 29000, 31000, 30000, 32000],
  'Bar/Lounge':        [18000, 19000, 20000, 19500, 20000],
  'Halfway House':     [12000, 11000, 12000, 11500, 12000],
  'Pool Bar':          [14000, 13000, 11000,  9000,  8500],
};

export default withAuth(async function handler(req, res) {
  const clubId = getReadClubId(req);
  try {
    // January actuals
    const [monthlyRevenue, paceData, members, email, fbData, eventsData, outletRev] = await Promise.all([
      sql`
        SELECT
          DATE_TRUNC('month', date::date)::date AS month_start,
          COUNT(*)::int AS day_count,
          SUM(fb_revenue)::numeric AS fb,
          SUM(golf_revenue)::numeric AS golf
        FROM close_outs
        WHERE club_id = ${clubId}
          AND date::date >= '2025-12-01'::date
          AND date::date < '2026-02-01'::date
        GROUP BY 1
        ORDER BY 1`,
      sql`SELECT COUNT(*) AS total, SUM(is_slow_round) AS slow FROM pace_of_play WHERE club_id = ${clubId}`,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE membership_status = 'active')          AS active,
          COUNT(*) FILTER (WHERE membership_status = 'resigned')         AS resigned,
          COUNT(*) FILTER (WHERE join_date >= '2026-01-01')              AS new_this_month
        FROM members WHERE club_id = ${clubId}`,
      sql`
        SELECT
          ROUND(
            COUNT(*) FILTER (WHERE event_type='open')::numeric /
            NULLIF(COUNT(*) FILTER (WHERE event_type='send'), 0), 3
          ) AS open_rate
        FROM email_events WHERE club_id = ${clubId}`,
      sql`
        SELECT AVG(total) AS avg_check FROM pos_checks
        WHERE club_id = ${clubId} AND post_round_dining = 0`,
      sql`SELECT COUNT(*) AS cnt FROM feedback WHERE club_id = ${clubId}`,
      sql`
        SELECT o.name, ROUND(SUM(pc.total)::numeric, 0) AS revenue
        FROM pos_checks pc
        JOIN dining_outlets o ON pc.outlet_id = o.outlet_id
        WHERE pc.club_id = ${clubId}
          AND pc.opened_at::date >= '2026-01-01'::date
          AND pc.opened_at::date < '2026-02-01'::date
        GROUP BY o.name`,
    ]);

    // Latest week avg health score
    const healthRow = await sql`
      SELECT ROUND(AVG(engagement_score)::numeric, 0) AS avg_health,
             COUNT(*) FILTER (WHERE engagement_score < 50) AS at_risk
      FROM member_engagement_weekly
      WHERE club_id = ${clubId}
        AND week_number = (SELECT MAX(week_number) FROM member_engagement_weekly WHERE club_id = ${clubId})
        AND member_id IN (SELECT member_id FROM members WHERE club_id = ${clubId} AND membership_status = 'active')`;

    const monthly = new Map(monthlyRevenue.rows.map((row) => [String(row.month_start).slice(0, 10), row]));
    const decRaw = monthly.get('2025-12-01');
    const janRaw = monthly.get('2026-01-01');
    const monthProjection = (row, key) => {
      const total = Number(row?.[key] ?? 0);
      const dayCount = Math.max(1, Number(row?.day_count ?? 31));
      return Math.round((total / dayCount) * 31);
    };
    const decFb = monthProjection(decRaw, 'fb');
    const decGolf = monthProjection(decRaw, 'golf');
    const janFb = monthProjection(janRaw, 'fb');
    const janGolf = monthProjection(janRaw, 'golf');
    const janTotal      = Number(paceData.rows[0].total) || 1;
    const janSlow       = Number(paceData.rows[0].slow) || 0;
    const janHealth     = Number(healthRow.rows[0].avg_health) || 62;
    const janAtRisk     = Number(healthRow.rows[0].at_risk) || 0;
    const janOpenRate   = Number(email.rows[0].open_rate) || 0;
    const janAvgCheck   = Number(fbData.rows[0].avg_check) || 0;
    const janComplaints = Number(eventsData.rows[0].cnt) || 0;
    const janNewMembers = Number(members.rows[0].new_this_month) || 0;
    const janResigned   = Number(members.rows[0].resigned) || 0;

    // Build outlet map for January
    const janOutletMap = {};
    const canonicalOutletName = (name) => {
      if (name === 'The Grill Room' || name === 'Grill Room') return 'Grill Room';
      if (name === 'Main Dining' || name === 'Main Dining Room' || name === 'The Veranda') return 'Main Dining Room';
      if (name === 'Bar / Lounge' || name === 'Bar/Lounge' || name === 'The 19th Hole Bar') return 'Bar/Lounge';
      if (name === 'Halfway House') return 'Halfway House';
      if (name === 'Pool Bar') return 'Pool Bar';
      return name;
    };
    for (const r of outletRev.rows) janOutletMap[canonicalOutletName(r.name)] = Math.round(Number(r.revenue));

    // Assemble 6-month arrays (Aug–Dec from prior + Jan actuals)
    const trends = {
      postRoundConversion: [...PRIOR_TRENDS.postRoundConversion, 0.37, +(janSlow > 0 ? janSlow / janTotal : 0.35).toFixed(3)],
      slowRoundRate:       [...PRIOR_TRENDS.slowRoundRate,       0.26, +(janSlow / janTotal).toFixed(3)],
      memberHealthAvg:     [...PRIOR_TRENDS.memberHealthAvg,     67, janHealth],
      atRiskMemberCount:   [...PRIOR_TRENDS.atRiskMemberCount,   70, janAtRisk],
      fbRevenue:           [...PRIOR_TRENDS.fbRevenue,           decFb || 228000, janFb],
      golfRevenue:         [...PRIOR_TRENDS.golfRevenue,         decGolf || 335000, janGolf],
      avgDiningCheck:      [...PRIOR_TRENDS.avgDiningCheck,      38.0, Math.round(janAvgCheck)],
      emailOpenRateAvg:    [...PRIOR_TRENDS.emailOpenRateAvg,    0.37, +janOpenRate.toFixed(3)],
      complaintsPerMonth:  [...PRIOR_TRENDS.complaintsPerMonth,  28, janComplaints],
      newMemberCount:      [...PRIOR_TRENDS.newMemberCount,      3, janNewMembers],
      resignationCount:    [...PRIOR_TRENDS.resignationCount,    2, janResigned],
    };

    const outletTrends = {};
    for (const [outlet, priorVals] of Object.entries(PRIOR_OUTLET_TRENDS)) {
      outletTrends[outlet] = [...priorVals, janOutletMap[outlet] ?? 0];
    }

    res.status(200).json({
      trends,
      outletTrends,
      months: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
    });
  } catch (err) {
    console.error('/api/trends error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
