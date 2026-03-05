// api/briefing.js — Phase 2 backend for briefingService.js
// Aggregates: close_outs, bookings, members, feedback, member_engagement_weekly,
//             cancellation_risk, member_waitlist
// Return shape IDENTICAL to briefingService.js getDailyBriefing()

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const date = req.query.date ?? new Date().toISOString().slice(0, 10);

  try {
    const [yesterday, todayBookings, atRisk, openComplaints, cancelRisk, waitlistSummary, staffing] =
      await Promise.all([

      // Yesterday's close-out
      sql`
        SELECT date, golf_revenue, fb_revenue,
               golf_revenue + fb_revenue AS total,
               weather, is_understaffed,
               rounds_played, covers
        FROM close_outs
        ORDER BY date DESC LIMIT 2`,

      // At-risk tee times today — members with score < 50 booked
      sql`
        SELECT
          m.member_id, m.first_name || ' ' || m.last_name AS name, m.archetype,
          b.tee_time, w.engagement_score AS score,
          CASE WHEN w.engagement_score >= 30 THEN 'At Risk' ELSE 'Critical' END AS risk_level
        FROM bookings b
        JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
        JOIN members m ON bp.member_id = m.member_id
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        WHERE b.booking_date = ${date}
          AND b.status = 'confirmed'
          AND w.engagement_score < 50
        ORDER BY w.engagement_score ASC LIMIT 5`,

      // Active at-risk members
      sql`
        SELECT COUNT(*) AS cnt
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
          AND w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        WHERE w.engagement_score < 50 AND m.membership_status = 'active'`,

      // Open (unresolved) complaints
      sql`
        SELECT f.feedback_id, f.member_id,
               m.first_name || ' ' || m.last_name AS member_name,
               f.category, f.sentiment_score, f.status, f.submitted_at::date AS date
        FROM feedback f
        JOIN members m ON f.member_id = m.member_id
        WHERE f.status != 'resolved'
        ORDER BY f.sentiment_score ASC`,

      // Cancellation risk summary for today's bookings
      sql`
        SELECT COUNT(*) FILTER (WHERE cr.cancel_probability >= 0.60) AS high_risk,
               ROUND(SUM(cr.estimated_revenue_lost)
                 FILTER (WHERE cr.cancel_probability >= 0.60)::numeric, 0) AS rev_at_risk
        FROM cancellation_risk cr
        JOIN bookings b ON cr.booking_id = b.booking_id
        WHERE b.booking_date = ${date} AND b.status = 'confirmed'`,

      // Waitlist summary
      sql`
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE retention_priority = 'HIGH') AS high_priority
        FROM member_waitlist
        WHERE filled_at IS NULL`,

      // Staffing summary
      sql`
        SELECT COUNT(*) FILTER (WHERE is_understaffed = 1) AS understaffed_count
        FROM close_outs`,
    ]);

    const days = yesterday.rows;
    const yd   = days[1] ?? days[0];  // second-most-recent = yesterday
    const monthlyRevRow = await sql`SELECT SUM(golf_revenue + fb_revenue) AS total FROM close_outs`;
    const monthlyRevenue = Math.round(Number(monthlyRevRow.rows[0]?.total ?? 0));

    // Build incidents list from open complaints that touch yesterday's date
    const yesterdayComplaints = openComplaints.rows.filter(c => c.date === yd?.date);
    const incidents = yesterdayComplaints.map(c =>
      `${c.member_name} — ${c.category} complaint (${c.status})`
    );
    if (yd?.is_understaffed) incidents.unshift('Grill Room understaffed — extended ticket times');

    const highRisk = Number(cancelRisk.rows[0]?.high_risk ?? 0);
    const revAtRisk = Math.round(Number(cancelRisk.rows[0]?.rev_at_risk ?? 0));
    const atRiskCount = Number(atRisk.rows[0]?.cnt ?? 0);

    res.status(200).json({
      currentDate: date,

      yesterdayRecap: {
        date:           yd?.date,
        revenue:        Number(yd?.total ?? 0),
        revenueVsPlan:  -0.12,
        rounds:         Number(yd?.rounds_played ?? 0),
        covers:         Number(yd?.covers ?? 0),
        incidents,
        weather:        yd?.weather,
        isUnderstaffed: yd?.is_understaffed === 1,
      },

      todayRisks: {
        weather: 'perfect',
        tempHigh: 72,
        wind: 18,
        forecast: 'Wind advisory — 18 mph gusts expected by noon',
        atRiskTeetimes: todayBookings.rows.map(b => ({
          memberId:  b.member_id,
          name:      b.name,
          archetype: b.archetype,
          time:      b.tee_time,
          score:     Number(b.score),
          riskLevel: b.risk_level,
          topRisk:   b.risk_level === 'Critical'
            ? 'Critical — near-zero engagement across all domains'
            : 'Declining — engagement dropping month over month',
        })),
        staffingGaps:  [],
        fullyStaffed:  true,
        cancellationRisk: {
          highRiskBookings:    highRisk,
          totalRevAtRisk:      revAtRisk,
          driverSummary:       'Wind advisory + low-engagement members',
          suggestedAction:     'Send confirmation nudges to highest-risk bookings',
          estimatedRevenueSaved: Math.round(revAtRisk * 0.34),
        },
      },

      waitlistIntel: {
        total:           Number(waitlistSummary.rows[0]?.total ?? 0),
        highPriority:    Number(waitlistSummary.rows[0]?.high_priority ?? 0),
        atRisk:          0,
        avgDaysWaiting:  4,
      },

      pendingActions: [
        {
          playbookId: 'service-save',
          title:      'Service Save Protocol',
          status:     openComplaints.rows.some(c => c.sentiment_score <= -0.5) ? 'recommended' : 'available',
          urgency:    'high',
          reason:     openComplaints.rows.length > 0
            ? `${openComplaints.rows.length} unresolved complaint(s) — service recovery needed`
            : 'No open complaints at this time',
        },
        {
          playbookId: 'peak-demand-capture',
          title:      'Peak Demand Capture',
          status:     highRisk > 0 ? 'recommended' : 'available',
          urgency:    highRisk > 2 ? 'high' : 'medium',
          reason:     `${highRisk} high-risk bookings · $${revAtRisk} revenue at stake`,
        },
        {
          playbookId: 'slow-saturday',
          title:      'Slow Saturday Recovery',
          status:     'available',
          urgency:    'medium',
          reason:     'Pace data: 28% slow round rate — weekend pace deteriorating',
        },
        {
          playbookId: 'engagement-decay',
          title:      'Engagement Decay Intervention',
          status:     'available',
          urgency:    'medium',
          reason:     `${atRiskCount} members showing accelerated engagement decay`,
        },
      ],

      keyMetrics: {
        monthlyRevenue,
        revenueVsPlan:    +4.2,
        atRiskMembers:    atRiskCount,
        openComplaints:   openComplaints.rows.length,
        understaffedDays: Number(staffing.rows[0]?.understaffed_count ?? 0),
      },
    });
  } catch (err) {
    console.error('/api/briefing error:', err);
    res.status(500).json({ error: err.message });
  }
}
