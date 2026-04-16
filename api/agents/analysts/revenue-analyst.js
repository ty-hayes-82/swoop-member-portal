/**
 * api/agents/analysts/revenue-analyst.js
 *
 * Type 2 Analyst: Revenue Analyst
 *
 * Scans tee sheet utilization, F&B margin trends, and post-round conversion gaps.
 * Surfaces pricing opportunities and revenue leakage. Routes findings to
 * GM concierge, head_pro, and fb_director.
 *
 * Signal sources:
 *   - bookings: tee sheet fill rates, morning vs afternoon split
 *   - pos_checks: F&B revenue per round
 *   - fb_reservations: cover forecast vs actuals
 *   - weather_daily: demand modifiers
 *
 * Trigger: daily cron (runs against yesterday's data + 7-day lookahead)
 * Session ID: revenue_analyst_{clubId}
 */

import { sql } from '@vercel/postgres';
import { runAnalyst } from '../analyst-harness.js';

const ANALYST_NAME = 'revenue_analyst';
const TARGET_ROLES = ['gm', 'head_pro', 'fb_director'];

// Revenue analysis benefits from sonnet-level reasoning
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are the Revenue Analyst for a private golf and country club.

Your job is to scan tee sheet utilization, F&B conversion, and margin data to surface revenue opportunities and leakage. You do not act directly — you produce recommendations for the GM, Head Pro, and F&B Director.

Analyze the signal data and produce:
1. TEE SHEET: Fill rate for yesterday and the next 7 days. Identify underfilled slots (< 60%) and the revenue at stake. Recommend pricing adjustments or targeted promotion for specific time slots.
2. F&B CONVERSION: What percentage of rounds yesterday converted to a dining check? Name the gap and the dollar opportunity.
3. POST-ROUND TARGETS: If specific high-dues members played but did not dine, name them as outreach candidates.
4. MARGIN FLAG: If F&B margin is outside expected range, identify the most likely cause.
5. ONE REVENUE ACTION: The single highest-impact action the club can take in the next 48 hours.

Use specific numbers. Name time slots, dates, amounts.
Never use em-dashes. Use commas or colons instead.`;

// ---------------------------------------------------------------------------
// Data pull
// ---------------------------------------------------------------------------

export async function pullRevenueSignals(clubId, targetDate = null) {
  const date = targetDate || new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [teeSheetYesterday, teeSheet7Day, fbPerf, nonDiners, weatherResult] = await Promise.all([
    // Yesterday tee sheet summary
    sql`
      SELECT
        COUNT(*) AS total_slots,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS filled_slots,
        SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
        SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
      FROM bookings
      WHERE booking_date = ${date} AND club_id = ${clubId}
    `,
    // 7-day lookahead fill rates
    sql`
      SELECT
        booking_date::text AS date,
        COUNT(*) AS total_slots,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS filled_slots,
        ROUND(100.0 * COUNT(CASE WHEN status = 'confirmed' THEN 1 END) / NULLIF(COUNT(*), 0), 1) AS fill_rate_pct
      FROM bookings
      WHERE club_id = ${clubId}
        AND booking_date > CURRENT_DATE
        AND booking_date <= CURRENT_DATE + INTERVAL '7 days'
      GROUP BY booking_date
      ORDER BY booking_date
    `.catch(() => ({ rows: [] })),
    // F&B performance yesterday
    sql`
      SELECT
        COUNT(DISTINCT pc.check_id) AS dining_checks,
        SUM(pc.total_amount) AS fb_revenue,
        AVG(pc.total_amount) AS avg_check
      FROM pos_checks pc
      WHERE pc.club_id = ${clubId}
        AND pc.opened_at::date = ${date}
    `.catch(() => ({ rows: [{}] })),
    // High-dues members who played yesterday but did not dine
    sql`
      SELECT DISTINCT m.member_id::text, m.first_name || ' ' || m.last_name AS name, m.annual_dues
      FROM bookings b
      JOIN booking_players bp ON bp.booking_id = b.booking_id
      JOIN members m ON m.member_id = bp.member_id AND m.club_id = b.club_id
      LEFT JOIN pos_checks pc ON pc.member_id = m.member_id
        AND pc.club_id = m.club_id
        AND pc.opened_at::date = b.booking_date
      WHERE b.booking_date = ${date}
        AND b.club_id = ${clubId}
        AND b.status = 'confirmed'
        AND pc.check_id IS NULL
        AND m.annual_dues >= 10000
      ORDER BY m.annual_dues DESC
      LIMIT 10
    `.catch(() => ({ rows: [] })),
    // Weather context
    sql`
      SELECT condition, temp_high, golf_demand_modifier, fb_demand_modifier
      FROM weather_daily
      WHERE date = ${date} AND club_id = ${clubId}
      LIMIT 1
    `.catch(() => ({ rows: [] })),
  ]);

  const ts = teeSheetYesterday.rows[0] || {};
  const totalSlots = Number(ts.total_slots ?? 0);
  const filledSlots = Number(ts.filled_slots ?? 0);
  const fillRate = totalSlots > 0 ? Math.round(filledSlots / totalSlots * 100) : 0;

  const fbRow = fbPerf.rows[0] || {};
  const diningChecks = Number(fbRow.dining_checks ?? 0);
  const fbRevenue = Number(fbRow.fb_revenue ?? 0);
  const avgCheck = Number(fbRow.avg_check ?? 0);
  const rounds = Number(ts.morning_rounds ?? 0) + Number(ts.afternoon_rounds ?? 0);
  const conversionRate = rounds > 0 ? Math.round(diningChecks / rounds * 100) : 0;
  const conversionGap = Math.max(0, rounds - diningChecks);
  const revenueOpportunity = Math.round(conversionGap * (avgCheck || 28));

  return {
    date,
    tee_sheet_yesterday: {
      total_slots: totalSlots,
      filled_slots: filledSlots,
      fill_rate_pct: fillRate,
      morning_rounds: Number(ts.morning_rounds ?? 0),
      afternoon_rounds: Number(ts.afternoon_rounds ?? 0),
    },
    tee_sheet_7day_lookahead: teeSheet7Day.rows.map(r => ({
      date: r.date,
      fill_rate_pct: Number(r.fill_rate_pct ?? 0),
      filled: Number(r.filled_slots ?? 0),
      total: Number(r.total_slots ?? 0),
    })),
    fb_performance: {
      dining_checks: diningChecks,
      fb_revenue: Math.round(fbRevenue * 100) / 100,
      avg_check: Math.round(avgCheck * 100) / 100,
    },
    post_round_conversion: {
      rounds_played: rounds,
      dining_covers: diningChecks,
      conversion_rate_pct: conversionRate,
      gap: conversionGap,
      revenue_opportunity: revenueOpportunity,
    },
    non_dining_high_dues: nonDiners.rows.map(r => ({
      member_id: r.member_id,
      name: r.name,
      annual_dues: Number(r.annual_dues ?? 0),
    })),
    weather: weatherResult.rows[0] ? {
      condition: weatherResult.rows[0].condition,
      temp_high: weatherResult.rows[0].temp_high,
      golf_demand_modifier: Number(weatherResult.rows[0].golf_demand_modifier ?? 0),
    } : null,
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function run(clubId, opts = {}) {
  const signals = await pullRevenueSignals(clubId, opts.targetDate);
  return runAnalyst({
    analystName: ANALYST_NAME,
    clubId,
    systemPrompt: SYSTEM_PROMPT,
    contextData: signals,
    targetRoles: TARGET_ROLES,
    modelOverride: MODEL,
    triggerType: opts.triggerType || 'scheduled',
  });
}
