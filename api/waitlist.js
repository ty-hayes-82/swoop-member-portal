// api/waitlist.js — Phase 3 stub
// This file defines the shape of the /api/waitlist endpoint for Phase 2 (live API) swap.
// In Phase 3, waitlistService.js replaces its data/ imports with fetch('/api/waitlist').
// The return shapes below are IDENTICAL to waitlistService.js return values — components never change.
//
// Database tables consumed (from Swoop_Data_Model_Reference.docx):
//   bookings              — cancellation risk scoring, slot availability
//   booking_players       — member identity per booking, is_warm_lead flag
//   waitlist_entries      — live queue (35 rows in Phase 1 sim)
//   member_engagement_weekly — engagement trajectory for cancel prediction
//   pos_checks            — revenue-per-slot attribution, post-round conversion
//   weather_daily         — weather × cancellation correlation
//   members               — health score context, archetype, risk level
//   visit_sessions        — full visit arc: booking → dining → total spend
//
// To activate Phase 3:
//   1. Uncomment the Vercel Postgres queries below
//   2. In waitlistService.js, replace each data/ import with:
//      const res = await fetch('/api/waitlist'); const data = await res.json();
//   3. Return shapes are identical — zero component changes required.

/*
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const queue = await sql`
    SELECT
      we.member_id,
      m.first_name || ' ' || m.last_name AS member_name,
      m.archetype,
      mew.engagement_score AS health_score,
      we.requested_slot,
      we.days_waiting,
      we.alternatives_accepted,
      m.last_round_date,
      CASE WHEN mew.engagement_score < 50 THEN 'HIGH' ELSE 'NORMAL' END AS retention_priority,
      CASE
        WHEN mew.engagement_score >= 70 THEN 'Healthy'
        WHEN mew.engagement_score >= 50 THEN 'Watch'
        WHEN mew.engagement_score >= 30 THEN 'At Risk'
        ELSE 'Critical'
      END AS risk_level
    FROM waitlist_entries we
    JOIN members m ON we.member_id = m.member_id
    JOIN member_engagement_weekly mew ON m.member_id = mew.member_id
    ORDER BY retention_priority DESC, health_score ASC
  `;

  const cancellationRisk = await sql`
    SELECT
      b.booking_id,
      bp.member_id,
      m.first_name || ' ' || m.last_name AS member_name,
      m.archetype,
      b.tee_time,
      mew.engagement_score,
      w.wind_mph,
      AVG(pc.total) FILTER (WHERE pc.post_round_dining = true) AS avg_post_round_spend
    FROM bookings b
    JOIN booking_players bp ON b.booking_id = bp.booking_id
    JOIN members m ON bp.member_id = m.member_id
    JOIN member_engagement_weekly mew ON m.member_id = mew.member_id
    LEFT JOIN weather_daily w ON b.booking_date = w.date
    LEFT JOIN pos_checks pc ON bp.member_id = pc.member_id
    WHERE b.booking_date = CURRENT_DATE + INTERVAL '1 day'
    AND bp.is_guest = false
    GROUP BY b.booking_id, bp.member_id, m.first_name, m.last_name, m.archetype, b.tee_time, mew.engagement_score, w.wind_mph
  `;

  res.json({ queue: queue.rows, cancellationRisk: cancellationRisk.rows });
}
*/

// Phase 3 endpoint shapes (for documentation):
//
// GET /api/waitlist
// {
//   queue: WaitlistEntry[],
//   summary: { total, highPriority, atRisk, avgDaysWaiting },
//   cancellationPredictions: CancellationPrediction[],
//   demandHeatmap: DemandCell[][],
//   revenueAttribution: { reactive, retentionPriority, upliftPct },
// }
//
// GET /api/waitlist/predictions
// {
//   bookingId: string,
//   memberId: string,
//   cancelProbability: number,   // 0.0–1.0
//   drivers: string[],
//   recommendedAction: string,
//   estimatedRevenueLost: number,
// }
