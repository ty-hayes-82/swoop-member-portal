/**
 * Phase 6 — F&B Intelligence Agent + Board Report Compiler: tests for
 * fb-trigger, board-report-trigger, MCP tools, root cause attribution,
 * post-round conversion, cross-agent feed, attribution chain,
 * no hallucinated numbers, narrative quality, and time saved.
 *
 * Tests: 6.1-6.3 (FB Smoke), 6.4-6.6 (FB Quality), 6.7-6.8 (FB Value),
 *        6.9-6.11 (Board Smoke), 6.12-6.14 (Board Quality), 6.15-6.16 (Board Value)
 * Mocks: @vercel/postgres (sql), withAuth middleware, managed-config, logger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const sqlMock = vi.fn(() => Promise.resolve({ rows: [] }));
sqlMock.query = vi.fn(() => Promise.resolve({ rows: [] }));

vi.mock('@vercel/postgres', () => ({ sql: sqlMock }));

vi.mock('../../api/lib/withAuth.js', () => ({
  withAuth: (handler) => handler,
  getWriteClubId: (req) => req.auth?.clubId ?? 'club_test',
  getReadClubId: (req) => req.auth?.clubId ?? 'club_test',
  getClubId: (req) => req.auth?.clubId ?? 'club_test',
}));

vi.mock('../../api/agents/managed-config.js', () => ({
  MANAGED_AGENT_ID: '',
  MANAGED_ENV_ID: '',
  getAnthropicClient: () => ({}),
  createManagedSession: vi.fn().mockResolvedValue({ id: 'sim_test_session' }),
  sendSessionEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/lib/logger.js', () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(body = {}, method = 'POST', auth = { clubId: 'club_test', role: 'gm' }) {
  return { method, headers: { authorization: 'Bearer test_token' }, query: {}, body, auth };
}

function makeRes() {
  const res = {
    _status: null, _json: null,
    status(code) { res._status = code; return res; },
    json(data) { res._json = data; return res; },
    setHeader() { return res; },
    end() { return res; },
  };
  return res;
}

// ---------------------------------------------------------------------------
// F&B Intelligence mock data builders
// ---------------------------------------------------------------------------

function configureFbSqlMock(config = {}) {
  const defaults = {
    fbPerformance: [
      { outlet: 'Grill Room', meal_period: 'lunch', revenue: 4200, covers: 85, margin_pct: 62, cost_of_goods: 1596 },
      { outlet: 'Grill Room', meal_period: 'dinner', revenue: 6800, covers: 120, margin_pct: 58, cost_of_goods: 2856 },
      { outlet: 'Terrace', meal_period: 'lunch', revenue: 1800, covers: 40, margin_pct: 70, cost_of_goods: 540 },
    ],
    menuMix: [
      { item_name: 'Club Burger', category: 'entree', quantity_sold: 45, revenue: 900, margin_pct: 55, margin_contribution: 495 },
      { item_name: 'Caesar Salad', category: 'appetizer', quantity_sold: 30, revenue: 450, margin_pct: 72, margin_contribution: 324 },
      { item_name: 'Filet Mignon', category: 'entree', quantity_sold: 20, revenue: 1200, margin_pct: 35, margin_contribution: 420 },
    ],
    reservations: [
      { outlet: 'Grill Room', meal_period: 'lunch', reserved_covers: 90, reservation_count: 22 },
      { outlet: 'Grill Room', meal_period: 'dinner', reserved_covers: 130, reservation_count: 30 },
    ],
    actualCovers: [
      { outlet: 'Grill Room', meal_period: 'lunch', actual_covers: 85 },
      { outlet: 'Grill Room', meal_period: 'dinner', actual_covers: 120 },
    ],
    weather: [{ condition: 'Sunny', temp_high: 78, temp_low: 62, wind_mph: 8, precipitation_in: 0, golf_demand_modifier: 0.1, fb_demand_modifier: 0.05 }],
    staffShifts: [
      { outlet: 'Grill Room', shift: 'lunch', staff_count: 4, gap: -2, projected_covers: 90 },
      { outlet: 'Grill Room', shift: 'dinner', staff_count: 6, gap: 0, projected_covers: 60 },
    ],
    rounds: [{ total_rounds: 140, morning_rounds: 95, afternoon_rounds: 45 }],
  };
  const c = { ...defaults, ...config };

  sqlMock.mockImplementation((...args) => {
    const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';

    // F&B daily performance
    if (tpl.includes('fb_daily_performance') && tpl.includes('GROUP BY') && tpl.includes('SUM(revenue)')) {
      return Promise.resolve({ rows: c.fbPerformance });
    }
    // F&B daily performance (cover delta actual)
    if (tpl.includes('fb_daily_performance') && tpl.includes('GROUP BY') && tpl.includes('actual_covers')) {
      return Promise.resolve({ rows: c.actualCovers });
    }
    // Menu mix
    if (tpl.includes('fb_menu_mix')) {
      return Promise.resolve({ rows: c.menuMix });
    }
    // Reservations
    if (tpl.includes('fb_reservations') && tpl.includes('GROUP BY')) {
      return Promise.resolve({ rows: c.reservations });
    }
    // Weather
    if (tpl.includes('weather_daily')) {
      return Promise.resolve({ rows: c.weather });
    }
    // Staff shifts
    if (tpl.includes('staff_shifts')) {
      return Promise.resolve({ rows: c.staffShifts });
    }
    // Bookings / rounds
    if (tpl.includes('bookings') && tpl.includes('total_rounds')) {
      return Promise.resolve({ rows: c.rounds });
    }
    // Insert agent_actions
    if (tpl.includes('agent_actions') && tpl.includes('INSERT')) {
      return Promise.resolve({ rows: [] });
    }
    // Insert agent_activity
    if (tpl.includes('agent_activity') && tpl.includes('INSERT')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  });
}

// ---------------------------------------------------------------------------
// Board Report mock data builders
// ---------------------------------------------------------------------------

function configureBoardSqlMock(config = {}) {
  const defaults = {
    interventions: [
      { intervention_id: 'int_001', member_id: 'mbr_203', playbook_type: 'service-save', status: 'saved', outcome: 'saved', started_at: '2026-03-05', completed_at: '2026-03-20', agent_id: 'member-risk-lifecycle', first_name: 'James', last_name: 'Whitfield', annual_dues: 22000, health_score: 68 },
      { intervention_id: 'int_002', member_id: 'mbr_100', playbook_type: 'service-save', status: 'saved', outcome: 'saved', started_at: '2026-03-12', completed_at: '2026-03-28', agent_id: 'service-recovery', first_name: 'Sarah', last_name: 'Mitchell', annual_dues: 18000, health_score: 55 },
      { intervention_id: 'int_003', member_id: 'mbr_300', playbook_type: 'service-save', status: 'in_progress', outcome: null, started_at: '2026-03-25', completed_at: null, agent_id: 'member-risk-lifecycle', first_name: 'Robert', last_name: 'Chen', annual_dues: 15000, health_score: 42 },
    ],
    staffingRecs: [
      { rec_id: 'rec_001', target_date: '2026-03-05', outlet: 'Grill Room', time_window: 'lunch', current_staff: 3, recommended_staff: 5, demand_forecast: 120, revenue_at_risk: 2400, confidence: 0.78, status: 'approved', actual_outcome: '{"covers": 115, "complaints": 0}' },
      { rec_id: 'rec_002', target_date: '2026-03-10', outlet: 'Terrace', time_window: 'lunch', current_staff: 4, recommended_staff: 3, demand_forecast: 40, revenue_at_risk: -380, confidence: 0.72, status: 'approved', actual_outcome: '{"covers": 38, "complaints": 0}' },
      { rec_id: 'rec_003', target_date: '2026-03-15', outlet: 'Grill Room', time_window: 'dinner', current_staff: 4, recommended_staff: 6, demand_forecast: 150, revenue_at_risk: 3200, confidence: 0.65, status: 'dismissed', actual_outcome: null },
    ],
    revenueActions: [
      { action_id: 'act_001', agent_id: 'member-risk-lifecycle', action_type: 'outreach', description: 'Called James Whitfield', impact_metric: '$22K/yr at risk', status: 'approved', timestamp: '2026-03-05', contributing_agents: null },
      { action_id: 'act_002', agent_id: 'staffing-demand', action_type: 'rebalance', description: 'Added 2 Grill Room servers', impact_metric: '$2,400 revenue protected', status: 'approved', timestamp: '2026-03-05', contributing_agents: null },
      { action_id: 'act_003', agent_id: 'service-recovery', action_type: 'outreach', description: 'Resolved complaint for Sarah Mitchell', impact_metric: '$18K/yr at risk', status: 'completed', timestamp: '2026-03-12', contributing_agents: null },
    ],
    saveReport: { rows: [{ report_id: 'rpt_test_001' }] },
  };
  const c = { ...defaults, ...config };

  sqlMock.mockImplementation((...args) => {
    const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';

    // Interventions
    if (tpl.includes('interventions') && tpl.includes('JOIN') && tpl.includes('members')) {
      return Promise.resolve({ rows: c.interventions });
    }
    // Staffing recommendations
    if (tpl.includes('staffing_recommendations') && tpl.includes('SELECT')) {
      return Promise.resolve({ rows: c.staffingRecs });
    }
    // Revenue attribution (agent_actions with approved/completed)
    if (tpl.includes('agent_actions') && tpl.includes('approved') && tpl.includes('completed')) {
      return Promise.resolve({ rows: c.revenueActions });
    }
    // Board report insert
    if (tpl.includes('board_reports') && tpl.includes('INSERT')) {
      return Promise.resolve(c.saveReport);
    }
    // Agent activity insert
    if (tpl.includes('agent_activity') && tpl.includes('INSERT')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  });
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let fbHandler, boardHandler;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const fbMod = await import('../../api/agents/fb-trigger.js');
  fbHandler = fbMod.default;

  const boardMod = await import('../../api/agents/board-report-trigger.js');
  boardHandler = boardMod.default;
});

// ===========================================================================
// F&B INTELLIGENCE — SMOKE TESTS (6.1 - 6.3)
// ===========================================================================

describe('Smoke: F&B Intelligence Trigger', () => {
  it('6.1 Daily trigger fires — session starts and returns analysis', async () => {
    configureFbSqlMock();
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.simulation).toBe(true);
  });

  it('6.2 All data pulls succeed — fb performance, menu mix, cover delta', async () => {
    configureFbSqlMock();
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    expect(res._json.data_pulls).toBeDefined();
    expect(res._json.data_pulls.fb_revenue).toBeGreaterThan(0);
    expect(res._json.data_pulls.fb_covers).toBeGreaterThan(0);
    expect(typeof res._json.data_pulls.fb_margin).toBe('number');
    expect(typeof res._json.data_pulls.rounds).toBe('number');
  });

  it('6.3 Rejects missing target_date', async () => {
    configureFbSqlMock();
    const res = makeRes();
    await fbHandler(makeReq({}), res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('target_date');
  });
});

// ===========================================================================
// F&B INTELLIGENCE — QUALITY GATES (6.4 - 6.6)
// ===========================================================================

describe('Quality: Root Cause Attribution', () => {
  it('6.4 Root cause attribution — margin drop correlates with multiple signals', async () => {
    configureFbSqlMock({
      fbPerformance: [
        { outlet: 'Grill Room', meal_period: 'lunch', revenue: 2800, covers: 60, margin_pct: 52, cost_of_goods: 1344 },
      ],
      staffShifts: [
        { outlet: 'Grill Room', shift: 'lunch', staff_count: 2, gap: -4, projected_covers: 60 },
      ],
      weather: [{ condition: 'Windy', temp_high: 68, temp_low: 55, wind_mph: 22, precipitation_in: 0, golf_demand_modifier: -0.25, fb_demand_modifier: 0.1 }],
    });
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    const marginInsight = res._json.analysis.insights.find(i => i.type === 'margin_analysis');
    expect(marginInsight).toBeDefined();
    expect(marginInsight.direction).toBe('down');
    // Must cite at least 2 correlated causes
    expect(marginInsight.correlations.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Quality: Post-Round Conversion', () => {
  it('6.5 Post-round conversion — detects gap when rounds > covers', async () => {
    configureFbSqlMock({
      rounds: [{ total_rounds: 140, morning_rounds: 95, afternoon_rounds: 45 }],
      fbPerformance: [
        { outlet: 'Grill Room', meal_period: 'lunch', revenue: 2000, covers: 50, margin_pct: 65, cost_of_goods: 700 },
      ],
    });
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    const conversion = res._json.analysis.insights.find(i => i.type === 'post_round_conversion');
    expect(conversion).toBeDefined();
    expect(conversion.detected).toBe(true);
    expect(conversion.conversion_gap).toBeGreaterThan(0);
    expect(conversion.revenue_opportunity).toBeGreaterThan(0);
  });
});

describe('Quality: Cross-Agent Feed', () => {
  it('6.6 Staffing feed — provides forecast accuracy data for staffing-demand agent', async () => {
    configureFbSqlMock();
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    expect(res._json.staffing_feed).toBeDefined();
    expect(typeof res._json.staffing_feed.actual_covers).toBe('number');
    expect(res._json.staffing_feed.date).toBe('2026-04-08');
  });
});

// ===========================================================================
// F&B INTELLIGENCE — VALUE TESTS (6.7 - 6.8)
// ===========================================================================

describe('Value: F&B Intelligence', () => {
  it('6.7 Actions capped at 3 — quality over quantity', async () => {
    configureFbSqlMock({
      fbPerformance: [
        { outlet: 'Grill Room', meal_period: 'lunch', revenue: 1500, covers: 30, margin_pct: 45, cost_of_goods: 825 },
      ],
      staffShifts: [
        { outlet: 'Grill Room', shift: 'lunch', staff_count: 1, gap: -2, projected_covers: 30 },
      ],
      rounds: [{ total_rounds: 160, morning_rounds: 100, afternoon_rounds: 60 }],
      weather: [{ condition: 'Stormy', temp_high: 55, temp_low: 42, wind_mph: 30, precipitation_in: 0.5, golf_demand_modifier: -0.4, fb_demand_modifier: 0.15 }],
    });
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    expect(res._json.analysis.actions_proposed).toBeLessThanOrEqual(3);
  });

  it('6.8 Simulation completes quickly — under 5 seconds', async () => {
    configureFbSqlMock();
    const start = Date.now();
    const res = makeRes();
    await fbHandler(makeReq({ target_date: '2026-04-08' }), res);
    expect(Date.now() - start).toBeLessThan(5000);
    expect(res._json.triggered).toBe(true);
  });
});

// ===========================================================================
// BOARD REPORT COMPILER — SMOKE TESTS (6.9 - 6.11)
// ===========================================================================

describe('Smoke: Board Report Trigger', () => {
  it('6.9 Monthly trigger fires — report compiled and saved', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.simulation).toBe(true);
    expect(res._json.report_id).toBeDefined();
  });

  it('6.10 All data pulls succeed — interventions, staffing, revenue', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    expect(res._json.data_pulls).toBeDefined();
    expect(res._json.data_pulls.interventions).toBeGreaterThanOrEqual(0);
    expect(res._json.data_pulls.staffing_recs).toBeGreaterThanOrEqual(0);
    expect(res._json.data_pulls.approved_actions).toBeGreaterThanOrEqual(0);
  });

  it('6.11 Rejects missing month', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({}), res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('month');
  });
});

// ===========================================================================
// BOARD REPORT COMPILER — QUALITY GATES (6.12 - 6.14)
// ===========================================================================

describe('Quality: Attribution Chain', () => {
  it('6.12 Every save traces to agent action — attribution chain complete', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    // Every saved member must have an attribution entry
    expect(res._json.report_summary.attribution_count).toBeGreaterThanOrEqual(
      res._json.report_summary.members_saved
    );
    // Members saved should match intervention data
    expect(res._json.report_summary.members_saved).toBe(2); // int_001 and int_002 have outcome='saved'
  });
});

describe('Quality: No Hallucinated Numbers', () => {
  it('6.13 No hallucinated numbers — dues protected matches source data', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    // $22,000 (Whitfield) + $18,000 (Mitchell) = $40,000
    expect(res._json.report_summary.dues_protected).toBe(40000);
    expect(res._json.report_summary.has_hallucinated_numbers).toBe(false);
  });
});

describe('Quality: Narrative Quality', () => {
  it('6.14 Narrative reads like a GM — headline present, sections structured', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    const summary = res._json.report_summary;
    // Headline should mention members saved and dollars
    expect(summary.headline).toContain('saved');
    expect(summary.headline).toContain('$');
    // Should have multiple sections
    expect(summary.sections).toBeGreaterThanOrEqual(3);
  });
});

// ===========================================================================
// BOARD REPORT COMPILER — VALUE TESTS (6.15 - 6.16)
// ===========================================================================

describe('Value: Board Report', () => {
  it('6.15 Time saved metric — reports manual vs agent-assisted time', async () => {
    configureBoardSqlMock();
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    expect(res._json.report_summary.time_saved).toBeDefined();
    expect(res._json.report_summary.time_saved.manual_estimate_hours).toBeGreaterThanOrEqual(3);
    expect(res._json.report_summary.time_saved.agent_assisted_minutes).toBeLessThanOrEqual(15);
  });

  it('6.16 Quiet month — report handles zero interventions gracefully', async () => {
    configureBoardSqlMock({
      interventions: [],
      staffingRecs: [],
      revenueActions: [],
    });
    const res = makeRes();
    await boardHandler(makeReq({ month: '2026-03' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.report_summary.members_saved).toBe(0);
    expect(res._json.report_summary.headline).toBeTruthy();
    // Should not crash or hallucinate numbers
    expect(res._json.report_summary.dues_protected).toBe(0);
  });
});
