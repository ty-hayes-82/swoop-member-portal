// api/trends.js — Phase 2 backend for trendsService.js
// Tables: close_outs, member_engagement_weekly, pos_checks, feedback, email_events
// Returns the same `trends` object shape that trendsService.js reads from data/trends.js
// MONTHS array: ['Aug','Sep','Oct','Nov','Dec','Jan'] — Jan = current (index 5)

import { sql } from '@vercel/postgres';

// The DB only has January 2026 data. Aug–Dec are static prior-period values
// (identical to data/trends.js). This function merges them so chart shapes are unchanged.
const PRIOR_TRENDS = {
  postRoundConversion: [0.31, 0.33, 0.35, 0.32, 0.34],
  slowRoundRate:       [0.24, 0.22, 0.26, 0.27, 0.25],
  memberHealthAvg:     [66,   65,   63,   61,   60],
  atRiskMemberCount:   [18,   20,   24,   28,   31],
  fbRevenue:           [48200,46800,51300,44100,49700],
  golfRevenue:         [82400,79600,88200,76300,85100],
  avgDiningCheck:      [34,   35,   36,   34,   37],
  emailOpenRateAvg:    [0.48, 0.46, 0.45, 0.43, 0.42],
  complaintsPerMonth:  [8,    7,    9,    11,   10],
  newMemberCount:      [4,    3,    5,    2,    4],
  resignationCount:    [1,    2,    1,    2,    2],
};

const PRIOR_OUTLET_TRENDS = {
  'Grill Room':        [14200, 13800, 15100, 12900, 14600],
  'Main Dining Room':  [19800, 18900, 21300, 17400, 20100],
  'Bar/Lounge':        [8400,  8100,  8900,  7600,  8700],
  'Halfway House':     [5100,  4800,  5600,  4200,  5300],
  'Pool Bar':          [1200,  900,   1400,  700,   1100],
};

export default async function handler(req, res) {
  try {
    // January actuals
    const [revenue, paceData, members, email, fbData, eventsData, outletRev] = await Promise.all([
      sql`SELECT SUM(fb_revenue) AS fb, SUM(golf_revenue) AS golf FROM close_outs`,
      sql`SELECT COUNT(*) AS total, SUM(is_slow_round) AS slow FROM pace_of_play`,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE membership_status = 'active')          AS active,
          COUNT(*) FILTER (WHERE membership_status = 'resigned')         AS resigned,
          COUNT(*) FILTER (WHERE join_date >= '2026-01-01')              AS new_this_month
        FROM members`,
      sql`
        SELECT
          ROUND(
            COUNT(*) FILTER (WHERE event_type='open')::numeric /
            NULLIF(COUNT(*) FILTER (WHERE event_type='send'), 0), 3
          ) AS open_rate
        FROM email_events`,
      sql`
        SELECT AVG(total) AS avg_check FROM pos_checks
        WHERE post_round_dining = 0`,
      sql`SELECT COUNT(*) AS cnt FROM feedback`,
      sql`
        SELECT o.name, ROUND(SUM(pc.total)::numeric, 0) AS revenue
        FROM pos_checks pc
        JOIN dining_outlets o ON pc.outlet_id = o.outlet_id
        GROUP BY o.name`,
    ]);

    // Latest week avg health score
    const healthRow = await sql`
      SELECT ROUND(AVG(engagement_score)::numeric, 0) AS avg_health,
             COUNT(*) FILTER (WHERE engagement_score < 50) AS at_risk
      FROM member_engagement_weekly
      WHERE week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        AND member_id IN (SELECT member_id FROM members WHERE membership_status = 'active')`;

    const janFb         = Math.round(Number(revenue.rows[0].fb));
    const janGolf       = Math.round(Number(revenue.rows[0].golf));
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
    for (const r of outletRev.rows) janOutletMap[r.name] = Math.round(Number(r.revenue));

    // Assemble 6-month arrays (Aug–Dec from prior + Jan actuals)
    const trends = {
      postRoundConversion: [...PRIOR_TRENDS.postRoundConversion, +(janSlow > 0 ? janSlow / janTotal : 0.35).toFixed(3)],
      slowRoundRate:       [...PRIOR_TRENDS.slowRoundRate,       +(janSlow / janTotal).toFixed(3)],
      memberHealthAvg:     [...PRIOR_TRENDS.memberHealthAvg,     janHealth],
      atRiskMemberCount:   [...PRIOR_TRENDS.atRiskMemberCount,   janAtRisk],
      fbRevenue:           [...PRIOR_TRENDS.fbRevenue,           janFb],
      golfRevenue:         [...PRIOR_TRENDS.golfRevenue,         janGolf],
      avgDiningCheck:      [...PRIOR_TRENDS.avgDiningCheck,      Math.round(janAvgCheck)],
      emailOpenRateAvg:    [...PRIOR_TRENDS.emailOpenRateAvg,    +janOpenRate.toFixed(3)],
      complaintsPerMonth:  [...PRIOR_TRENDS.complaintsPerMonth,  janComplaints],
      newMemberCount:      [...PRIOR_TRENDS.newMemberCount,      janNewMembers],
      resignationCount:    [...PRIOR_TRENDS.resignationCount,    janResigned],
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
}
