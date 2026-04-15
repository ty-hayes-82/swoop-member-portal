// api/operations.js — Phase 2 backend for operationsService.js
// Tables: bookings, close_outs, pace_of_play, weather_daily, waitlist_entries
// Return shapes are IDENTICAL to operationsService.js — zero component changes on swap.

import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getReadClubId(req);
  try {
    const [closeouts, pace, bottlenecks, waitlist] = await Promise.all([
      sql`SELECT date, TO_CHAR(date::date, 'Dy') AS day, golf_revenue, fb_revenue,
                 golf_revenue + fb_revenue AS total, weather, is_understaffed
          FROM close_outs
          WHERE club_id = ${clubId}
            AND date::date >= '2026-01-01'::date
            AND date::date < '2026-02-01'::date
          ORDER BY date`,

      sql`SELECT
            CASE WHEN total_minutes < 240 THEN 'Under 4h'
                 WHEN total_minutes < 270 THEN '4h–4h30'
                 WHEN total_minutes < 300 THEN '4h30–5h'
                 ELSE 'Over 5h' END AS range,
            COUNT(*) AS count
          FROM pace_of_play WHERE club_id = ${clubId} GROUP BY 1 ORDER BY MIN(total_minutes)`,

      sql`SELECT hole_number, COUNT(*) AS count,
                 ROUND(AVG(segment_minutes)::numeric, 1) AS avg_minutes,
                 SUM(is_bottleneck) AS bottleneck_count
          FROM pace_hole_segments
          WHERE club_id = ${clubId}
          GROUP BY hole_number ORDER BY hole_number`,

      sql`SELECT we.requested_date AS date,
                 we.peak_slot AS slot,
                 we.waitlist_count,
                 we.has_event_overlap
          FROM waitlist_entries we
          WHERE we.club_id = ${clubId}
            AND we.requested_date::date >= '2026-01-01'::date
            AND we.requested_date::date < '2026-02-01'::date
          ORDER BY we.requested_date`,
    ]);

    // Monthly summary computed from close_outs
    const days = closeouts.rows;
    const operatingDays = days.filter(d => d.golf_revenue > 0);
    const total = days.reduce((s, d) => s + Number(d.total), 0);
    const weekendDays = days.filter(d => ['Sat', 'Sun'].includes(d.day));
    const weekdayDays = operatingDays.filter(d => !['Sat', 'Sun'].includes(d.day));

    // Pace summary
    const paceRows = await sql`SELECT total_minutes, is_slow_round FROM pace_of_play WHERE club_id = ${clubId}`;
    const rounds = paceRows.rows;
    const slowRounds = rounds.filter(r => r.is_slow_round === 1);

    // Pace × F&B impact — slow vs normal post-round conversion
    const paceFBImpact = await sql`
      SELECT
        ROUND(AVG(CASE WHEN p.is_slow_round = 1 THEN 1.0 ELSE 0 END)::numeric, 3) AS slow_prd_rate,
        ROUND(AVG(CASE WHEN p.is_slow_round = 0 THEN 1.0 ELSE 0 END)::numeric, 3) AS fast_prd_rate
      FROM pace_of_play p
      JOIN pos_checks pc ON pc.linked_booking_id = p.booking_id
      WHERE p.club_id = ${clubId} AND pc.post_round_dining = 1`;

    res.status(200).json({
      revenueByDay: days.map(d => ({
        date: d.date,
        day: d.day,
        golf: Number(d.golf_revenue),
        fb: Number(d.fb_revenue),
        total: Number(d.total),
        weather: d.weather,
        isUnderstaffed: d.is_understaffed === 1,
      })),

      monthlySummary: {
        total,
        golfTotal: days.reduce((s, d) => s + Number(d.golf_revenue), 0),
        fbTotal:   days.reduce((s, d) => s + Number(d.fb_revenue), 0),
        dailyAvg:  Math.round(total / (operatingDays.length || 1)),
        weekendAvg: Math.round(
          weekendDays.reduce((s, d) => s + Number(d.total), 0) / (weekendDays.length || 1)
        ),
        weekdayAvg: Math.round(
          weekdayDays.reduce((s, d) => s + Number(d.total), 0) / (weekdayDays.length || 1)
        ),
      },

      paceDistribution: pace.rows.map(r => ({
        range: r.range,
        count: Number(r.count),
      })),

      slowRoundStats: {
        total: rounds.length,
        slow: slowRounds.length,
        rate: rounds.length ? +(slowRounds.length / rounds.length).toFixed(3) : 0,
        avgSlowMinutes: slowRounds.length
          ? Math.round(slowRounds.reduce((s, r) => s + r.total_minutes, 0) / slowRounds.length)
          : 0,
      },

      bottleneckHoles: bottlenecks.rows.map(r => ({
        hole:          Number(r.hole_number),
        count:         Number(r.count),
        avgMinutes:    Number(r.avg_minutes),
        bottleneckCount: Number(r.bottleneck_count),
      })),

      // Null when no tee rounds exist — operationsService treats null as "no data"
      // and returns EMPTY_PACE_FB in live mode, triggering the Revenue empty state.
      paceFBImpact: rounds.length === 0 ? null : {
        slowPRDRate: Number(paceFBImpact.rows[0]?.slow_prd_rate ?? 0),
        fastPRDRate: Number(paceFBImpact.rows[0]?.fast_prd_rate ?? 0),
      },

      demandGaps: waitlist.rows.map(w => ({
        date:          w.date,
        slot:          w.slot,
        waitlistCount: Number(w.waitlist_count),
        eventOverlap:  w.has_event_overlap === 1,
      })),
    });
  } catch (err) {
    console.error('/api/operations error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
