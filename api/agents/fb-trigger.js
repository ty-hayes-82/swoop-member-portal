/**
 * POST /api/agents/fb-trigger
 *
 * Daily trigger for the fb-intelligence agent.
 * Called by cron each morning. Analyzes yesterday's F&B performance vs
 * forecast, surfaces root causes, detects post-round conversion gaps,
 * and feeds accuracy data to the staffing-demand agent.
 *
 * Simulation mode: when MANAGED_AGENT_ID or MANAGED_ENV_ID are unset,
 * runs deterministic analysis without calling the LLM.
 */
import { sql } from '@vercel/postgres';
import { withAuth, getWriteClubId } from '../lib/withAuth.js';
import { createManagedSession, sendSessionEvent, MANAGED_AGENT_ID, MANAGED_ENV_ID } from './managed-config.js';

const SIMULATION_MODE = !MANAGED_AGENT_ID || !MANAGED_ENV_ID;

// ---------------------------------------------------------------------------
// Data pull functions (reused by MCP tool handlers in api/mcp.js)
// ---------------------------------------------------------------------------

/**
 * Pull daily F&B performance: revenue, covers, margin by outlet and meal period.
 */
export async function pullDailyFbPerformance(clubId, date) {
  const result = await sql`
    SELECT outlet, meal_period,
      SUM(revenue) AS revenue,
      SUM(covers) AS covers,
      AVG(margin_pct) AS margin_pct,
      SUM(cost_of_goods) AS cogs
    FROM fb_daily_performance
    WHERE date = ${date} AND club_id = ${clubId}
    GROUP BY outlet, meal_period
    ORDER BY outlet, meal_period
  `;

  const rows = result.rows.map(r => ({
    outlet: r.outlet,
    meal_period: r.meal_period,
    revenue: Number(r.revenue ?? 0),
    covers: Number(r.covers ?? 0),
    margin_pct: Number(r.margin_pct ?? 0),
    cogs: Number(r.cogs ?? 0),
  }));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCovers = rows.reduce((s, r) => s + r.covers, 0);
  const avgMargin = rows.length > 0
    ? rows.reduce((s, r) => s + r.margin_pct, 0) / rows.length
    : 0;

  return {
    date,
    outlets: rows,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    total_covers: totalCovers,
    avg_margin_pct: Math.round(avgMargin * 100) / 100,
  };
}

/**
 * Pull menu mix analysis: item-level sales and margin contribution.
 */
export async function pullMenuMixAnalysis(clubId, date) {
  const result = await sql`
    SELECT item_name, category, quantity_sold, revenue, margin_pct,
      revenue * margin_pct / 100.0 AS margin_contribution
    FROM fb_menu_mix
    WHERE date = ${date} AND club_id = ${clubId}
    ORDER BY revenue DESC
    LIMIT 20
  `;

  const items = result.rows.map(r => ({
    item_name: r.item_name,
    category: r.category,
    quantity_sold: Number(r.quantity_sold ?? 0),
    revenue: Number(r.revenue ?? 0),
    margin_pct: Number(r.margin_pct ?? 0),
    margin_contribution: Number(r.margin_contribution ?? 0),
  }));

  const highMargin = items.filter(i => i.margin_pct >= 60);
  const lowMargin = items.filter(i => i.margin_pct < 40);

  return {
    date,
    items,
    high_margin_count: highMargin.length,
    low_margin_count: lowMargin.length,
    high_margin_revenue_share: items.length > 0
      ? Math.round(highMargin.reduce((s, i) => s + i.revenue, 0) / items.reduce((s, i) => s + i.revenue, 0) * 100) / 100
      : 0,
  };
}

/**
 * Pull cover vs reservation delta: no-show rate, walk-in rate.
 */
export async function pullCoverVsReservationDelta(clubId, date) {
  const [resvResult, actualResult] = await Promise.all([
    sql`
      SELECT outlet, meal_period,
        SUM(covers) AS reserved_covers,
        COUNT(*) AS reservation_count
      FROM fb_reservations
      WHERE date = ${date} AND club_id = ${clubId}
      GROUP BY outlet, meal_period
    `,
    sql`
      SELECT outlet, meal_period,
        SUM(covers) AS actual_covers
      FROM fb_daily_performance
      WHERE date = ${date} AND club_id = ${clubId}
      GROUP BY outlet, meal_period
    `,
  ]);

  const reserved = resvResult.rows.map(r => ({
    outlet: r.outlet,
    meal_period: r.meal_period,
    reserved_covers: Number(r.reserved_covers ?? 0),
    reservation_count: Number(r.reservation_count ?? 0),
  }));

  const actual = actualResult.rows.map(r => ({
    outlet: r.outlet,
    meal_period: r.meal_period,
    actual_covers: Number(r.actual_covers ?? 0),
  }));

  const deltas = reserved.map(rv => {
    const act = actual.find(a => a.outlet === rv.outlet && a.meal_period === rv.meal_period);
    const actualCovers = act ? act.actual_covers : 0;
    const delta = actualCovers - rv.reserved_covers;
    const noShowRate = rv.reserved_covers > 0
      ? Math.max(0, Math.round((1 - actualCovers / rv.reserved_covers) * 100)) / 100
      : 0;
    return {
      outlet: rv.outlet,
      meal_period: rv.meal_period,
      reserved_covers: rv.reserved_covers,
      actual_covers: actualCovers,
      delta,
      no_show_rate: noShowRate,
    };
  });

  const totalReserved = reserved.reduce((s, r) => s + r.reserved_covers, 0);
  const totalActual = actual.reduce((s, r) => s + r.actual_covers, 0);

  return {
    date,
    deltas,
    total_reserved: totalReserved,
    total_actual: totalActual,
    overall_delta: totalActual - totalReserved,
    overall_no_show_rate: totalReserved > 0
      ? Math.round(Math.max(0, (1 - totalActual / totalReserved)) * 100) / 100
      : 0,
  };
}

// ---------------------------------------------------------------------------
// Simulation logic
// ---------------------------------------------------------------------------

/**
 * Build root cause analysis from correlated data pulls.
 */
function buildRootCauseAnalysis(fbPerf, menuMix, coverDelta, weather, staffing, teeSheet) {
  const insights = [];
  const causes = [];

  // Check margin vs baseline (assume 65% is normal)
  const marginDelta = fbPerf.avg_margin_pct - 65;
  if (Math.abs(marginDelta) > 2) {
    const direction = marginDelta > 0 ? 'up' : 'down';
    let cause = `F&B margin ${direction} ${Math.abs(marginDelta).toFixed(1)} points.`;
    const correlations = [];

    // Correlate with staffing
    if (staffing.length > 0) {
      const understaffed = staffing.filter(s => s.gap && s.gap < 0);
      if (understaffed.length > 0 && marginDelta < 0) {
        correlations.push(`understaffing in ${understaffed.map(s => `${s.outlet} ${s.shift}`).join(', ')}`);
        causes.push('understaffing');
      }
    }

    // Correlate with weather
    if (weather.available && weather.golf_demand_modifier) {
      if (Math.abs(weather.golf_demand_modifier) > 0.1) {
        correlations.push(`weather impact (${weather.condition}, demand modifier ${weather.golf_demand_modifier > 0 ? '+' : ''}${(weather.golf_demand_modifier * 100).toFixed(0)}%)`);
        causes.push('weather');
      }
    }

    // Correlate with menu mix
    if (menuMix.high_margin_revenue_share < 0.4 && marginDelta < 0) {
      correlations.push(`low high-margin item share (${(menuMix.high_margin_revenue_share * 100).toFixed(0)}% of revenue)`);
      causes.push('menu_mix');
    }

    if (correlations.length > 0) {
      cause += ` Root causes: ${correlations.join('; ')}.`;
    }
    insights.push({ type: 'margin_analysis', direction, delta: marginDelta, cause, correlations: causes });
  }

  // Post-round conversion analysis
  const roundsPlayed = teeSheet.total_rounds ?? 0;
  const fbCovers = fbPerf.total_covers;
  const conversionRate = roundsPlayed > 0 ? fbCovers / roundsPlayed : 0;
  const conversionGap = roundsPlayed - fbCovers;
  const avgCheck = 28;
  const revenueOpportunity = Math.max(0, conversionGap) * avgCheck;

  insights.push({
    type: 'post_round_conversion',
    rounds_played: roundsPlayed,
    fb_covers: fbCovers,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    conversion_gap: Math.max(0, conversionGap),
    revenue_opportunity: revenueOpportunity,
    detected: conversionGap > 5,
  });

  // Cover vs reservation delta
  if (coverDelta.overall_no_show_rate > 0.15) {
    insights.push({
      type: 'high_no_show_rate',
      no_show_rate: coverDelta.overall_no_show_rate,
      reserved: coverDelta.total_reserved,
      actual: coverDelta.total_actual,
    });
  }

  return { insights, cause_count: causes.length };
}

/**
 * Build actions from insights.
 */
function buildFbActions(insights) {
  const actions = [];

  const conversion = insights.find(i => i.type === 'post_round_conversion');
  if (conversion && conversion.detected) {
    actions.push({
      action_type: 'outreach',
      priority: conversion.revenue_opportunity > 500 ? 'high' : 'medium',
      description: `Post-round F&B conversion gap: ${conversion.conversion_gap} rounds without dining. $${Math.round(conversion.revenue_opportunity)} revenue opportunity. Propose targeted dining outreach for non-converters.`,
      impact_metric: `$${Math.round(conversion.revenue_opportunity)} opportunity`,
    });
  }

  const margin = insights.find(i => i.type === 'margin_analysis');
  if (margin && margin.direction === 'down' && margin.correlations.length > 0) {
    actions.push({
      action_type: 'alert_staff',
      priority: Math.abs(margin.delta) > 5 ? 'high' : 'medium',
      description: `${margin.cause} Recommend addressing: ${margin.correlations.join(', ')}.`,
      impact_metric: `${Math.abs(margin.delta).toFixed(1)}pt margin decline`,
    });
  }

  return actions.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

async function fbTriggerHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getWriteClubId(req);
  const { target_date } = req.body;

  if (!target_date) {
    return res.status(400).json({ error: 'target_date is required (YYYY-MM-DD)' });
  }

  try {
    // 1. Pull all data in parallel
    const [fbPerf, menuMix, coverDelta, weatherResult, staffingResult, teeSheetResult] = await Promise.all([
      pullDailyFbPerformance(clubId, target_date),
      pullMenuMixAnalysis(clubId, target_date),
      pullCoverVsReservationDelta(clubId, target_date),
      sql`
        SELECT condition, temp_high, temp_low, wind_mph, precipitation_in,
          golf_demand_modifier, fb_demand_modifier
        FROM weather_daily
        WHERE date = ${target_date} AND club_id = ${clubId}
        LIMIT 1
      `.then(r => {
        if (r.rows.length === 0) return { available: false };
        const w = r.rows[0];
        return {
          available: true,
          condition: w.condition,
          wind_mph: Number(w.wind_mph),
          golf_demand_modifier: Number(w.golf_demand_modifier),
          fb_demand_modifier: Number(w.fb_demand_modifier),
        };
      }),
      sql`
        SELECT outlet, shift, staff_count,
          staff_count - CEIL(projected_covers / 10.0) AS gap,
          projected_covers
        FROM staff_shifts ss
        LEFT JOIN (
          SELECT outlet, meal_period, SUM(covers) AS projected_covers
          FROM fb_reservations
          WHERE date = ${target_date} AND club_id = ${clubId}
          GROUP BY outlet, meal_period
        ) d ON ss.outlet = d.outlet AND ss.shift = d.meal_period
        WHERE ss.date = ${target_date} AND ss.club_id = ${clubId}
      `.then(r => r.rows.map(row => ({
        outlet: row.outlet,
        shift: row.shift,
        staff_count: Number(row.staff_count ?? 0),
        gap: row.gap != null ? Number(row.gap) : null,
      }))),
      sql`
        SELECT COUNT(*) AS total_rounds,
          SUM(CASE WHEN tee_time < '12:00' THEN 1 ELSE 0 END) AS morning_rounds,
          SUM(CASE WHEN tee_time >= '12:00' THEN 1 ELSE 0 END) AS afternoon_rounds
        FROM bookings
        WHERE booking_date = ${target_date} AND club_id = ${clubId} AND status = 'confirmed'
      `.then(r => ({
        total_rounds: Number(r.rows[0]?.total_rounds ?? 0),
        morning_rounds: Number(r.rows[0]?.morning_rounds ?? 0),
        afternoon_rounds: Number(r.rows[0]?.afternoon_rounds ?? 0),
      })),
    ]);

    // 2. Managed session or simulation
    if (!SIMULATION_MODE) {
      const session = await createManagedSession();
      await sendSessionEvent(session.id, {
        type: 'user.message',
        content: JSON.stringify({
          trigger: 'fb_intelligence_daily',
          club_id: clubId,
          target_date,
          fb_performance: fbPerf,
          menu_mix: menuMix,
          cover_delta: coverDelta,
          weather: weatherResult,
          staffing: staffingResult,
          tee_sheet: teeSheetResult,
          timestamp: new Date().toISOString(),
        }),
      });

      return res.status(200).json({
        triggered: true,
        session_id: session.id,
        simulation: false,
      });
    }

    // Simulation mode
    const sessionId = `sim_fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const analysis = buildRootCauseAnalysis(fbPerf, menuMix, coverDelta, weatherResult, staffingResult, teeSheetResult);
    const actions = buildFbActions(analysis.insights);

    // Save actions
    for (const action of actions) {
      await sql`
        INSERT INTO agent_actions (action_id, club_id, agent_id, action_type, priority, source, description, impact_metric, status, timestamp)
        VALUES (
          ${`act_fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
          ${clubId}, 'fb-intelligence', ${action.action_type},
          ${action.priority}, 'fb-intelligence',
          ${action.description}, ${action.impact_metric},
          'pending', NOW()
        )
      `;
    }

    // Log activity
    await sql`
      INSERT INTO agent_activity (activity_id, club_id, agent_id, action_type, description, phase, created_at)
      VALUES (
        ${`aa_fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`},
        ${clubId}, 'fb-intelligence', 'daily_analysis',
        ${`Analyzed ${target_date}: ${analysis.insights.length} insights, ${actions.length} actions proposed.`},
        '6', NOW()
      )
    `;

    // Build staffing feed (cross-agent data sharing)
    const conversion = analysis.insights.find(i => i.type === 'post_round_conversion');
    const staffingFeed = {
      date: target_date,
      actual_covers: fbPerf.total_covers,
      forecast_accuracy: coverDelta.total_reserved > 0
        ? Math.round(coverDelta.total_actual / coverDelta.total_reserved * 100) / 100
        : null,
      post_round_conversion_rate: conversion ? conversion.conversion_rate : null,
    };

    return res.status(200).json({
      triggered: true,
      session_id: sessionId,
      simulation: true,
      analysis: {
        insights: analysis.insights,
        cause_count: analysis.cause_count,
        actions_proposed: actions.length,
      },
      staffing_feed: staffingFeed,
      data_pulls: {
        fb_revenue: fbPerf.total_revenue,
        fb_covers: fbPerf.total_covers,
        fb_margin: fbPerf.avg_margin_pct,
        menu_items: menuMix.items.length,
        cover_delta: coverDelta.overall_delta,
        weather: weatherResult.available,
        rounds: teeSheetResult.total_rounds,
      },
    });
  } catch (err) {
    console.error('/api/agents/fb-trigger error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || 'unknown', role: 'system' };
    return fbTriggerHandler(req, res);
  }
  return withAuth(fbTriggerHandler, { roles: ['gm', 'admin'] })(req, res);
}
