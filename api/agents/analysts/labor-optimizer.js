/**
 * api/agents/analysts/labor-optimizer.js
 *
 * Type 2 Analyst: Labor Optimizer
 *
 * Scans staffing schedules against projected demand (covers, rounds) to
 * surface coverage gaps and overstaffing before the shift. Routes findings
 * to dining_room_manager and fb_director.
 *
 * Signal sources:
 *   - staff_shifts: scheduled headcount per outlet per shift window
 *   - fb_reservations: projected covers by outlet and meal period
 *   - bookings: rounds forecast (drives post-round dining surge)
 *   - weather_daily: demand modifiers
 *
 * Trigger: daily cron (runs for today + tomorrow)
 * Session ID: labor_optimizer_{clubId}
 */

import { sql } from '@vercel/postgres';
import { runAnalyst } from '../analyst-harness.js';

const ANALYST_NAME = 'labor_optimizer';
const TARGET_ROLES = ['dining_room_manager', 'fb_director'];

const SYSTEM_PROMPT = `You are the Labor Optimizer analyst for a private golf and country club.

Your job is to compare the scheduled staffing against projected demand and flag coverage gaps or overstaffing before the shift begins. You do not act directly — you produce recommendations for the Dining Room Manager and F&B Director.

Analyze the signal data and produce:
1. COVERAGE GAPS: Which outlets and shifts are understaffed relative to projected covers? (staff_count vs covers / 10 ratio as baseline). Quantify the risk.
2. OVERSTAFFING: Where is staffing above demand? Name the dollar cost in labor.
3. ROUNDS SURGE RISK: If afternoon rounds are high, flag that post-round dining demand may spike. Which shifts need to be prepared?
4. WEATHER ADJUSTMENT: If weather modifier is significant, note the demand impact on staffing needs.
5. ONE ADJUSTMENT: The single most important staffing pivot for today.

Be specific: name outlets, shifts, headcounts, cover projections.
Never use em-dashes. Use commas or colons instead.`;

// ---------------------------------------------------------------------------
// Data pull
// ---------------------------------------------------------------------------

export async function pullLaborSignals(clubId, targetDate = null) {
  const date = targetDate || new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [staffToday, coversForecastToday, roundsForecast, weatherToday,
         staffTomorrow, coversForecastTomorrow] = await Promise.all([
    // Today's staffing schedule
    sql`
      SELECT
        outlet_id AS outlet,
        CASE
          WHEN EXTRACT(HOUR FROM start_time::time) < 11 THEN 'morning'
          WHEN EXTRACT(HOUR FROM start_time::time) < 16 THEN 'lunch'
          ELSE 'dinner'
        END AS shift,
        COUNT(*)::int AS staff_count
      FROM staff_shifts
      WHERE shift_date = ${date} AND club_id = ${clubId}
      GROUP BY outlet_id, shift
      ORDER BY outlet, shift
    `.catch(() => ({ rows: [] })),
    // Projected covers today
    sql`
      SELECT outlet, meal_period AS shift, SUM(covers)::int AS projected_covers
      FROM fb_reservations
      WHERE reservation_date = ${date} AND club_id = ${clubId}
      GROUP BY outlet, meal_period
    `.catch(() => ({ rows: [] })),
    // Today's round forecast (afternoon rounds drive post-round dining)
    sql`
      SELECT
        COUNT(*) AS total_rounds,
        SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
      FROM bookings
      WHERE booking_date = ${date} AND club_id = ${clubId} AND status = 'confirmed'
    `.catch(() => ({ rows: [{}] })),
    // Weather today
    sql`
      SELECT condition, temp_high, golf_demand_modifier, fb_demand_modifier
      FROM weather_daily
      WHERE date = ${date} AND club_id = ${clubId}
      LIMIT 1
    `.catch(() => ({ rows: [] })),
    // Tomorrow's staffing
    sql`
      SELECT
        outlet_id AS outlet,
        CASE
          WHEN EXTRACT(HOUR FROM start_time::time) < 11 THEN 'morning'
          WHEN EXTRACT(HOUR FROM start_time::time) < 16 THEN 'lunch'
          ELSE 'dinner'
        END AS shift,
        COUNT(*)::int AS staff_count
      FROM staff_shifts
      WHERE shift_date = ${tomorrow} AND club_id = ${clubId}
      GROUP BY outlet_id, shift
      ORDER BY outlet, shift
    `.catch(() => ({ rows: [] })),
    // Tomorrow's projected covers
    sql`
      SELECT outlet, meal_period AS shift, SUM(covers)::int AS projected_covers
      FROM fb_reservations
      WHERE reservation_date = ${tomorrow} AND club_id = ${clubId}
      GROUP BY outlet, meal_period
    `.catch(() => ({ rows: [] })),
  ]);

  // Build gap analysis for a date's staff + covers
  function buildGapAnalysis(staffRows, coverRows) {
    return staffRows.map(s => {
      const demand = coverRows.find(
        c => c.outlet === s.outlet && c.shift === s.shift
      );
      const projectedCovers = Number(demand?.projected_covers ?? 0);
      const staffNeeded = Math.ceil(projectedCovers / 10);
      const staffCount = Number(s.staff_count ?? 0);
      const gap = staffCount - staffNeeded;
      return {
        outlet: s.outlet,
        shift: s.shift,
        staff_scheduled: staffCount,
        projected_covers: projectedCovers,
        staff_needed: staffNeeded,
        gap, // negative = understaffed, positive = overstaffed
        status: gap < 0 ? 'understaffed' : gap > 2 ? 'overstaffed' : 'adequate',
      };
    });
  }

  const roundsRow = roundsForecast.rows[0] || {};

  return {
    date,
    tomorrow,
    today: {
      gaps: buildGapAnalysis(staffToday.rows, coversForecastToday.rows),
      rounds_total: Number(roundsRow.total_rounds ?? 0),
      rounds_afternoon: Number(roundsRow.afternoon_rounds ?? 0),
      weather: weatherToday.rows[0] ? {
        condition: weatherToday.rows[0].condition,
        fb_demand_modifier: Number(weatherToday.rows[0].fb_demand_modifier ?? 0),
      } : null,
    },
    tomorrow: {
      gaps: buildGapAnalysis(staffTomorrow.rows, coversForecastTomorrow.rows),
    },
    generated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export async function run(clubId, opts = {}) {
  const signals = await pullLaborSignals(clubId, opts.targetDate);
  return runAnalyst({
    analystName: ANALYST_NAME,
    clubId,
    systemPrompt: SYSTEM_PROMPT,
    contextData: signals,
    targetRoles: TARGET_ROLES,
    triggerType: opts.triggerType || 'scheduled',
  });
}
