// api/fb.js — Phase 2 backend for fbService.js
// Tables: pos_checks, pos_line_items, dining_outlets, close_outs
// Return shapes IDENTICAL to fbService.js

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [outlets, rainRows, sunnyRows, prdByArch] = await Promise.all([
      // Outlet performance — revenue, covers, avg check, understaffed impact
      sql`
        SELECT
          o.outlet_id,
          o.name AS outlet,
          o.type,
          COUNT(DISTINCT pc.check_id)                              AS check_count,
          ROUND(SUM(pc.total)::numeric, 2)                        AS revenue,
          COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1) AS post_round_checks,
          ROUND(AVG(pc.total)::numeric, 2)                        AS avg_check,
          ROUND(SUM(CASE WHEN pc.is_understaffed_day = 1 THEN pc.total ELSE 0 END)::numeric, 2) AS understaffed_revenue,
          ROUND(AVG(
            EXTRACT(EPOCH FROM (pc.last_item_fulfilled_at::timestamptz -
                                pc.first_item_fired_at::timestamptz)) / 60.0
          )::numeric, 1)                                           AS avg_ticket_min,
          ROUND(AVG(
            CASE WHEN pc.is_understaffed_day = 1
            THEN EXTRACT(EPOCH FROM (pc.last_item_fulfilled_at::timestamptz -
                                     pc.first_item_fired_at::timestamptz)) / 60.0
            END
          )::numeric, 1)                                           AS understaffed_ticket_min
        FROM dining_outlets o
        LEFT JOIN pos_checks pc ON o.outlet_id = pc.outlet_id
        GROUP BY o.outlet_id, o.name, o.type
        ORDER BY revenue DESC`,

      // Rain-day revenue
      sql`SELECT c.fb_revenue, c.golf_revenue, c.weather, c.date
          FROM close_outs c WHERE c.weather = 'rainy'`,

      // Non-rain-day averages
      sql`SELECT AVG(c.golf_revenue) AS avg_golf, AVG(c.fb_revenue) AS avg_fb
          FROM close_outs c WHERE c.weather != 'rainy' AND c.golf_revenue > 0`,

      // Post-round dining conversion by archetype
      sql`
        SELECT
          m.archetype,
          COUNT(DISTINCT b.booking_id)                                          AS completed_rounds,
          COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1)  AS post_round_diners,
          ROUND(
            COUNT(DISTINCT pc.check_id) FILTER (WHERE pc.post_round_dining = 1)::numeric /
            NULLIF(COUNT(DISTINCT b.booking_id), 0), 3
          )                                                                     AS conversion_rate,
          ROUND(AVG(pc.total) FILTER (WHERE pc.post_round_dining = 1)::numeric, 2) AS avg_prd_check
        FROM bookings b
        JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
        JOIN members m ON bp.member_id = m.member_id
        LEFT JOIN pos_checks pc ON pc.linked_booking_id = b.booking_id
        WHERE b.status = 'completed'
        GROUP BY m.archetype
        ORDER BY conversion_rate DESC NULLS LAST`,
    ]);

    const avgGolf = Number(sunnyRows.rows[0]?.avg_golf ?? 0);
    const avgFb   = Number(sunnyRows.rows[0]?.avg_fb   ?? 0);

    const fbTotal     = outlets.rows.reduce((s, o) => s + Number(o.revenue), 0);
    const coversTotal = outlets.rows.reduce((s, o) => s + Number(o.check_count), 0);

    res.status(200).json({
      outlets: outlets.rows.map(o => ({
        outlet:             o.outlet,
        outletId:           o.outlet_id,
        type:               o.type,
        revenue:            Number(o.revenue),
        covers:             Number(o.check_count),
        avgCheck:           Number(o.avg_check),
        postRoundChecks:    Number(o.post_round_checks),
        avgTicketMin:       Number(o.avg_ticket_min),
        understaffedRevenue:Number(o.understaffed_revenue),
        understaffedImpact: -(Number(o.understaffed_revenue) * 0.08),
        understaffedTicketMin: Number(o.understaffed_ticket_min),
      })),

      fbSummary: {
        totalRevenue:       fbTotal,
        totalCovers:        coversTotal,
        understaffingLoss:  outlets.rows.reduce((s, o) => s + Number(o.understaffed_revenue) * 0.08, 0),
        overallAvgCheck:    coversTotal > 0 ? +(fbTotal / coversTotal).toFixed(2) : 0,
      },

      postRoundConversion: {
        overall: prdByArch.rows.reduce((s, r) => s + Number(r.post_round_diners), 0) /
                 Math.max(1, prdByArch.rows.reduce((s, r) => s + Number(r.completed_rounds), 0)),
        byArchetype: prdByArch.rows.map(r => ({
          archetype:      r.archetype,
          completedRounds:Number(r.completed_rounds),
          diners:         Number(r.post_round_diners),
          rate:           Number(r.conversion_rate),
          avgCheck:       Number(r.avg_prd_check),
        })),
      },

      rainDayImpact: rainRows.rows.map(d => ({
        date:        d.date,
        golfRevenue: Number(d.golf_revenue),
        fbRevenue:   Number(d.fb_revenue),
        golfVsAvg:   avgGolf > 0 ? Math.round(((Number(d.golf_revenue) - avgGolf) / avgGolf) * 100) : 0,
        fbVsAvg:     avgFb   > 0 ? Math.round(((Number(d.fb_revenue)   - avgFb)   / avgFb)   * 100) : 0,
        weather:     d.weather,
      })),
    });
  } catch (err) {
    console.error('/api/fb error:', err);
    res.status(500).json({ error: err.message });
  }
}
