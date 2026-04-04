// api/staffing.js — Phase 2 backend for staffingService.js
// Tables: staff_shifts, feedback, service_requests, close_outs, dining_outlets
// Return shapes IDENTICAL to staffingService.js

import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);
  try {
    const [understaffed, feedback, shiftCoverage] = await Promise.all([

      // Understaffed days — revenue impact via close_outs + weather context
      sql`
        SELECT
          co.date,
          co.fb_revenue,
          co.is_understaffed,
          ROUND(AVG(co2.fb_revenue)::numeric, 2) AS normal_avg_fb,
          COUNT(DISTINCT f.feedback_id)          AS complaint_count,
          ROUND(AVG(
            EXTRACT(EPOCH FROM (pc.last_item_fulfilled_at::timestamptz -
                                pc.first_item_fired_at::timestamptz)) / 60.0
          )::numeric, 1)                         AS avg_ticket_min,
          wdl.conditions_text AS wx_conditions,
          wdl.high_temp       AS wx_high_temp,
          wdl.wind_max_mph    AS wx_wind,
          wdl.wind_gust_max_mph AS wx_gusts,
          wdl.precip_total_in AS wx_precip,
          wd.condition        AS wx_condition_legacy
        FROM close_outs co
        CROSS JOIN (
          SELECT AVG(fb_revenue) AS fb_revenue
          FROM close_outs WHERE club_id = ${clubId} AND is_understaffed = 0 AND fb_revenue > 0
        ) co2
        LEFT JOIN feedback f ON f.submitted_at::date = co.date::date
        LEFT JOIN pos_checks pc ON pc.opened_at::date = co.date::date
                                 AND pc.is_understaffed_day = 1
        LEFT JOIN weather_daily_log wdl ON wdl.date = co.date::date AND wdl.club_id = ${clubId}
        LEFT JOIN weather_daily wd ON wd.date = co.date
        WHERE co.club_id = ${clubId} AND co.is_understaffed = 1
        GROUP BY co.date, co.fb_revenue, co.is_understaffed, co2.fb_revenue,
                 wdl.conditions_text, wdl.high_temp, wdl.wind_max_mph,
                 wdl.wind_gust_max_mph, wdl.precip_total_in, wd.condition
        ORDER BY co.date`,

      // Feedback — all records with understaffed flag + weather context
      sql`
        SELECT
          f.feedback_id,
          f.member_id,
          m.first_name || ' ' || m.last_name AS member_name,
          m.archetype,
          f.submitted_at::date               AS date,
          f.category,
          f.sentiment_score                  AS sentiment,
          f.status,
          f.description,
          f.resolved_at,
          f.is_understaffed_day,
          cwc.is_weather_impacted,
          cwc.impact_reason    AS weather_impact_reason,
          cwc.conditions_text  AS weather_conditions,
          cwc.high_temp        AS weather_high_temp,
          cwc.wind_mph         AS weather_wind,
          cwc.wind_gust_mph    AS weather_gusts,
          cwc.precip_in        AS weather_precip
        FROM feedback f
        JOIN members m ON f.member_id = m.member_id
        LEFT JOIN complaint_weather_context cwc ON cwc.complaint_id = f.feedback_id
        WHERE f.club_id = ${clubId}
        ORDER BY f.submitted_at DESC`,

      // Shift coverage by department and date
      sql`
        SELECT
          ss.shift_date   AS date,
          s.department,
          COUNT(*)        AS staff_count,
          SUM(ss.hours_worked) AS total_hours,
          ss.is_understaffed_day
        FROM staff_shifts ss
        JOIN staff s ON ss.staff_id = s.staff_id
        WHERE ss.club_id = ${clubId}
        GROUP BY ss.shift_date, s.department, ss.is_understaffed_day
        ORDER BY ss.shift_date, s.department`,
    ]);

    const understaffedDays = understaffed.rows;
    const feedbackRows = feedback.rows;
    const unresolvedCount = feedbackRows.filter(f => f.status !== 'resolved').length;

    const totalRevenueLoss = understaffedDays.reduce((s, d) => {
      const loss = Math.max(0, Number(d.normal_avg_fb) - Number(d.fb_revenue));
      return s + loss;
    }, 0);

    // Feedback summary stats
    const totalFeedback = feedbackRows.length;
    const avgSentiment = totalFeedback > 0
      ? feedbackRows.reduce((s, f) => s + Number(f.sentiment), 0) / totalFeedback
      : 0;
    const byCat = feedbackRows.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] ?? 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      understaffedDays: understaffedDays.map(d => ({
        date:               d.date,
        outlet:             'Grill Room',
        fbRevenue:          Number(d.fb_revenue),
        normalAvgFb:        Number(d.normal_avg_fb),
        revenueLoss:        Math.max(0, Number(d.normal_avg_fb) - Number(d.fb_revenue)),
        complaintCount:     Number(d.complaint_count),
        avgTicketMin:       Number(d.avg_ticket_min),
        scheduledStaff:     2,
        requiredStaff:      4,
        ticketTimeIncrease: 0.20,
        complaintMultiplier: Number(d.complaint_count) > 0 ? 2.0 : 1.0,
        weather: {
          conditions: d.wx_conditions || d.wx_condition_legacy || null,
          highTemp:   d.wx_high_temp != null ? Number(d.wx_high_temp) : null,
          wind:       d.wx_wind != null ? Number(d.wx_wind) : null,
          gusts:      d.wx_gusts != null ? Number(d.wx_gusts) : null,
          precip:     d.wx_precip != null ? Number(d.wx_precip) : null,
        },
      })),

      feedbackRecords: feedbackRows.map(f => ({
        feedbackId:       f.feedback_id,
        memberId:         f.member_id,
        memberName:       f.member_name,
        archetype:        f.archetype,
        date:             f.date,
        category:         f.category,
        sentiment:        Number(f.sentiment),
        status:           f.status,
        description:      f.description,
        resolvedAt:       f.resolved_at,
        isUnderstaffed:   f.is_understaffed_day === 1,
        weatherContext: f.is_weather_impacted != null ? {
          isWeatherImpacted: f.is_weather_impacted,
          impactReason:      f.weather_impact_reason,
          conditions:        f.weather_conditions,
          highTemp:          f.weather_high_temp != null ? Number(f.weather_high_temp) : null,
          wind:              f.weather_wind != null ? Number(f.weather_wind) : null,
          gusts:             f.weather_gusts != null ? Number(f.weather_gusts) : null,
          precip:            f.weather_precip != null ? Number(f.weather_precip) : null,
        } : null,
      })),

      // feedbackSummary must be an array to match the static data shape
      feedbackSummary: Object.entries(byCat).map(([category, count]) => {
        const catRows = feedbackRows.filter(f => f.category === category);
        const avgSent = catRows.length > 0
          ? catRows.reduce((s, f) => s + Number(f.sentiment), 0) / catRows.length
          : 0;
        const unresolved = catRows.filter(f => f.status !== 'resolved').length;
        return {
          category,
          count,
          avgSentiment:   +avgSent.toFixed(2),
          unresolvedCount: unresolved,
        };
      }),

      shiftCoverage: shiftCoverage.rows.map(s => ({
        date:             s.date,
        department:       s.department,
        staffCount:       Number(s.staff_count),
        totalHours:       Number(s.total_hours),
        isUnderstaffed:   s.is_understaffed_day === 1,
      })),

      staffingSummary: {
        understaffedDaysCount: understaffedDays.length,
        totalRevenueLoss:      Math.round(totalRevenueLoss),
        annualizedLoss:        Math.round(totalRevenueLoss * 12),
        unresolvedComplaints:  unresolvedCount,
      },
    });
  } catch (err) {
    console.error('/api/staffing error:', err);
    res.status(500).json({ error: err.message });
  }
}, { allowDemo: true });
