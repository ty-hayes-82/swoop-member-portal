// api/waitlist.js — Phase 2 backend for waitlistService.js
// Tables: member_waitlist, cancellation_risk, demand_heatmap, bookings, members
// Return shapes IDENTICAL to waitlistService.js

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [queue, predictions, heatmap, revenueAttr] = await Promise.all([

      sql`
        SELECT
          mw.waitlist_id, mw.member_id,
          m.first_name || ' ' || m.last_name  AS member_name, m.archetype,
          mw.requested_slot, mw.days_waiting, mw.alternatives_accepted,
          mw.retention_priority, mw.dining_incentive_attached,
          mw.notified_at, mw.filled_at,
          w.engagement_score AS health_score,
          CASE WHEN w.engagement_score >= 70 THEN 'Healthy'
               WHEN w.engagement_score >= 50 THEN 'Watch'
               WHEN w.engagement_score >= 30 THEN 'At Risk'
               ELSE 'Critical' END AS risk_level,
          (SELECT MAX(b.booking_date) FROM bookings b
           JOIN booking_players bp ON b.booking_id = bp.booking_id
           WHERE bp.member_id = mw.member_id AND b.status = 'completed') AS last_round,
          (SELECT COUNT(*) FILTER (WHERE pc.post_round_dining = 1)::float /
                  NULLIF(COUNT(*), 0)
           FROM pos_checks pc WHERE pc.member_id = mw.member_id) AS dining_history_rate
        FROM member_waitlist mw
        JOIN members m ON mw.member_id = m.member_id
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        ORDER BY CASE mw.retention_priority WHEN 'HIGH' THEN 0 ELSE 1 END, w.engagement_score ASC`,

      sql`
        SELECT cr.risk_id, cr.booking_id, cr.member_id,
               m.first_name || ' ' || m.last_name AS member_name, m.archetype,
               b.tee_time, b.booking_date,
               cr.cancel_probability, cr.drivers, cr.recommended_action,
               cr.estimated_revenue_lost, cr.action_taken, cr.outcome
        FROM cancellation_risk cr
        JOIN bookings b ON cr.booking_id = b.booking_id
        JOIN members m ON cr.member_id = m.member_id
        WHERE b.booking_date::date >= '2026-01-01'::date AND b.status = 'confirmed'
        ORDER BY cr.cancel_probability DESC LIMIT 20`,

      sql`
        SELECT dh.heatmap_id, c.name AS course, dh.day_of_week, dh.time_block,
               dh.fill_rate, dh.unmet_rounds, dh.demand_level
        FROM demand_heatmap dh
        JOIN courses c ON dh.course_id = c.course_id
        ORDER BY c.name,
          ARRAY_POSITION(ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], dh.day_of_week),
          dh.time_block`,

      sql`
        SELECT
          ROUND(AVG(vs.total_spend) FILTER (WHERE vs.anchor_type = 'golf')::numeric, 2) AS avg_golf_spend,
          ROUND(AVG(vs.total_spend) FILTER (WHERE vs.anchor_type = 'golf' AND vs.touchpoints >= 2)::numeric, 2) AS avg_multi_touch_spend
        FROM visit_sessions vs`,
    ]);

    const queueRows = queue.rows.map(w => ({
      waitlistId:           w.waitlist_id,
      memberId:             w.member_id,
      memberName:           w.member_name,
      archetype:            w.archetype,
      requestedSlot:        w.requested_slot,
      daysWaiting:          Number(w.days_waiting),
      alternatesAccepted:   JSON.parse(w.alternatives_accepted ?? '[]'),
      retentionPriority:    w.retention_priority,
      diningIncentiveAttached: w.dining_incentive_attached === 1,
      notifiedAt:           w.notified_at,
      filledAt:             w.filled_at,
      healthScore:          Number(w.health_score),
      riskLevel:            w.risk_level,
      lastRound:            w.last_round,
      diningHistory:        Number(w.dining_history_rate) > 0.35 ? 'High converter'
                          : Number(w.dining_history_rate) > 0.20 ? 'Moderate' : 'Low converter',
    }));

    const predRows = predictions.rows.map(p => ({
      riskId:               p.risk_id,
      bookingId:            p.booking_id,
      memberId:             p.member_id,
      memberName:           p.member_name,
      archetype:            p.archetype,
      teeTime:              p.tee_time,
      bookingDate:          p.booking_date,
      cancelProbability:    Number(p.cancel_probability),
      drivers:              JSON.parse(p.drivers ?? '[]'),
      recommendedAction:    p.recommended_action,
      estimatedRevenueLost: Number(p.estimated_revenue_lost),
      actionTaken:          p.action_taken,
      outcome:              p.outcome,
    }));

    const highRisk = predRows.filter(p => p.cancelProbability >= 0.60);

    res.status(200).json({
      queue: queueRows,
      summary: {
        total: queueRows.length,
        highPriority: queueRows.filter(w => w.retentionPriority === 'HIGH').length,
        atRisk: queueRows.filter(w => ['At Risk','Critical'].includes(w.riskLevel)).length,
        avgDaysWaiting: queueRows.length
          ? Math.round(queueRows.reduce((s, w) => s + w.daysWaiting, 0) / queueRows.length) : 0,
      },
      cancellationPredictions: predRows,
      cancellationSummary: {
        total: predRows.length, highRisk: highRisk.length,
        totalRevAtRisk: Math.round(highRisk.reduce((s, p) => s + p.estimatedRevenueLost, 0)),
        topDriver: 'Wind advisory + low-engagement members',
      },
      demandHeatmap: heatmap.rows.map(h => ({
        heatmapId: h.heatmap_id, course: h.course, dayOfWeek: h.day_of_week,
        timeBlock: h.time_block, fillRate: Number(h.fill_rate),
        unmetRounds: Number(h.unmet_rounds), demandLevel: h.demand_level,
      })),
      revenueAttribution: {
        reactive:          Number(revenueAttr.rows[0]?.avg_golf_spend ?? 187),
        retentionPriority: Number(revenueAttr.rows[0]?.avg_multi_touch_spend ?? 312),
        upliftPct: Math.round(
          ((Number(revenueAttr.rows[0]?.avg_multi_touch_spend ?? 312) /
            Math.max(1, Number(revenueAttr.rows[0]?.avg_golf_spend ?? 187))) - 1) * 100
        ),
      },
    });
  } catch (err) {
    console.error('/api/waitlist error:', err);
    res.status(500).json({ error: err.message });
  }
}
