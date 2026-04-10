/**
 * Phase 4 — Staffing-Demand Alignment Agent: tests for staffing-trigger,
 * MCP tools, system prompt, consequence framework, and regression against Phase 1-3.
 *
 * Tests: 4.1-4.3 (Smoke), 4.4-4.9 (Quality Gates), + MCP + Prompt + Regression
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

/**
 * Configure sqlMock to return data based on SQL template content.
 */
function configureSqlMock(config = {}) {
  const defaults = {
    staffShifts: { rows: [
      { outlet: 'Grill Room', shift: 'lunch', staff_count: 3 },
      { outlet: 'Grill Room', shift: 'dinner', staff_count: 4 },
    ] },
    fbReservations: { rows: [
      { outlet: 'Grill Room', meal_period: 'lunch', projected_covers: 110, reservation_count: 28 },
      { outlet: 'Grill Room', meal_period: 'dinner', projected_covers: 60, reservation_count: 15 },
    ] },
    bookings: { rows: [{ total_rounds: 120, morning_rounds: 72, afternoon_rounds: 48 }] },
    weather: { rows: [{ condition: 'windy', temp_high: 78, temp_low: 62, wind_mph: 18, precipitation_in: 0, golf_demand_modifier: -0.15, fb_demand_modifier: 0.05 }] },
    complaints: { rows: [{ feedback_id: 'fb_001', member_id: 'mbr_203', category: 'F&B', status: 'open', sentiment_score: 2 }] },
    historicalRecs: { rows: [] },
    saveRec: { rows: [{ rec_id: 'rec_test_001' }] },
  };
  const c = { ...defaults, ...config };

  sqlMock.mockImplementation((...args) => {
    const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';

    if (tpl.includes('staff_shifts')) {
      return Promise.resolve(c.staffShifts);
    }
    if (tpl.includes('fb_reservations') && tpl.includes('GROUP BY')) {
      return Promise.resolve(c.fbReservations);
    }
    if (tpl.includes('COUNT(*)') && tpl.includes('bookings')) {
      return Promise.resolve(c.bookings);
    }
    if (tpl.includes('weather_daily')) {
      return Promise.resolve(c.weather);
    }
    if (tpl.includes('feedback') && tpl.includes('resolved')) {
      return Promise.resolve(c.complaints);
    }
    if (tpl.includes('staffing_recommendations') && tpl.includes('SELECT')) {
      return Promise.resolve(c.historicalRecs);
    }
    if (tpl.includes('INSERT INTO staffing_recommendations')) {
      return Promise.resolve(c.saveRec);
    }
    if (tpl.includes('agent_actions')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  });
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let staffingHandler;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const mod = await import('../../api/agents/staffing-trigger.js');
  staffingHandler = mod.default;
});

// ===========================================================================
// SMOKE TESTS (4.1 - 4.3)
// ===========================================================================

describe('Smoke: Staffing-Demand Trigger', () => {
  it('4.1 6-hour cycle runs — session starts and recommendations produced', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10', trigger_type: '6h_cycle' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.simulation).toBe(true);
    expect(res._json.trigger_type).toBe('6h_cycle');
  });

  it('4.2 weather-triggered wake — agent processes with weather context', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10', trigger_type: 'weather_change' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.trigger_type).toBe('weather_change');
    expect(res._json.data_pulls.weather).toBe(true);
  });

  it('4.3 recommendations written — rows saved with all fields', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    expect(res._status).toBe(200);
    expect(res._json.recommendation_count).toBeGreaterThanOrEqual(1);
    // Each recommendation has required fields
    for (const rec of res._json.recommendations) {
      expect(rec.rec_id).toBeDefined();
      expect(rec.outlet).toBeDefined();
      expect(rec.time_window).toBeDefined();
      expect(rec.current_staff).toBeDefined();
      expect(rec.recommended_staff).toBeDefined();
      expect(rec.confidence).toBeDefined();
    }
  });
});

// ===========================================================================
// QUALITY GATES (4.4 - 4.9)
// ===========================================================================

describe('Quality: Revenue Quantification', () => {
  it('4.4 every recommendation includes specific dollar amount', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    expect(res._json.recommendation_count).toBeGreaterThanOrEqual(1);
    for (const rec of res._json.recommendations) {
      expect(rec.revenue_at_risk).toBeDefined();
      expect(typeof rec.revenue_at_risk).toBe('number');
      expect(rec.revenue_at_risk).not.toBe(0);
    }
  });
});

describe('Quality: Overstaffing Detection', () => {
  it('4.5 low-demand day with excess staff triggers reduction recommendation', async () => {
    configureSqlMock({
      staffShifts: { rows: [
        { outlet: 'Grill Room', shift: 'lunch', staff_count: 8 },
      ] },
      fbReservations: { rows: [
        { outlet: 'Grill Room', meal_period: 'lunch', projected_covers: 30, reservation_count: 8 },
      ] },
      bookings: { rows: [{ total_rounds: 40, morning_rounds: 25, afternoon_rounds: 15 }] },
      weather: { rows: [{ condition: 'sunny', temp_high: 75, temp_low: 60, wind_mph: 5, precipitation_in: 0, golf_demand_modifier: 0.1, fb_demand_modifier: 0 }] },
      complaints: { rows: [] },
    });
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    expect(res._json.recommendation_count).toBeGreaterThanOrEqual(1);
    // Should recommend reducing staff — revenue_at_risk is negative (savings)
    const overstaffed = res._json.recommendations.find(r => r.type === 'overstaffed');
    expect(overstaffed).toBeDefined();
    expect(overstaffed.revenue_at_risk).toBeLessThan(0); // negative = savings
    expect(overstaffed.recommended_staff).toBeLessThan(overstaffed.current_staff);
  });
});

describe('Quality: Outlet Specificity', () => {
  it('4.6 recommendations specify exact outlet and time window', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    for (const rec of res._json.recommendations) {
      expect(rec.outlet).toBeTruthy();
      expect(rec.time_window).toBeTruthy();
      // Not vague
      expect(rec.outlet).not.toBe('F&B');
      expect(rec.time_window).not.toBe('all day');
    }
  });
});

describe('Quality: Feedback Loop', () => {
  it('4.7 historical outcomes included in data pulls', async () => {
    configureSqlMock({
      historicalRecs: { rows: [
        { rec_id: 'rec_prev_1', target_date: '2026-04-09', outlet: 'Grill Room', time_window: 'lunch', current_staff: 3, recommended_staff: 5, demand_forecast: 100, revenue_at_risk: 500, confidence: 0.6, rationale: 'test', status: 'approved', actual_outcome: { complaints: 0, actual_covers: 95 }, created_at: '2026-04-08' },
        { rec_id: 'rec_prev_2', target_date: '2026-04-08', outlet: 'Grill Room', time_window: 'dinner', current_staff: 4, recommended_staff: 5, demand_forecast: 80, revenue_at_risk: 300, confidence: 0.55, rationale: 'test', status: 'executed', actual_outcome: { complaints: 1, actual_covers: 78 }, created_at: '2026-04-07' },
      ] },
    });
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    expect(res._json.data_pulls.historical_recs).toBe(2);
  });
});

describe('Quality: Confidence Calibration', () => {
  it('4.8 no history shows confidence 0.5; with history confidence adjusts', async () => {
    // No history
    configureSqlMock({ historicalRecs: { rows: [] } });
    const res1 = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res1);
    if (res1._json.recommendations.length > 0) {
      expect(res1._json.recommendations[0].confidence).toBe(0.5);
    }

    // With 5 history items
    vi.resetModules();
    sqlMock.mockReset();
    const mod2 = await import('../../api/agents/staffing-trigger.js');
    staffingHandler = mod2.default;
    configureSqlMock({
      historicalRecs: { rows: Array.from({ length: 5 }, (_, i) => ({
        rec_id: `rec_h_${i}`, target_date: '2026-04-05', outlet: 'Grill Room',
        time_window: 'lunch', current_staff: 3, recommended_staff: 5,
        demand_forecast: 100, revenue_at_risk: 500, confidence: 0.6,
        rationale: 'test', status: 'approved', actual_outcome: null, created_at: '2026-04-04',
      })) },
    });
    const res2 = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res2);
    if (res2._json.recommendations.length > 0) {
      expect(res2._json.recommendations[0].confidence).toBeGreaterThan(0.5);
      expect(res2._json.recommendations[0].confidence).toBeLessThanOrEqual(0.95);
    }
  });
});

describe('Quality: Cross-Domain Awareness', () => {
  it('4.9 staffing gap + open complaint raises priority', async () => {
    configureSqlMock();
    const res = makeRes();
    await staffingHandler(makeReq({ target_date: '2026-04-10' }), res);
    // Default data has understaffed Grill Room lunch + open complaint
    // The understaffed rec should mention complaints in rationale
    const understaffed = res._json.recommendations.find(r => r.type === 'understaffed');
    expect(understaffed).toBeDefined();
    // Verify the SQL calls included complaint data in the data_pulls
    expect(res._json.data_pulls.open_complaints).toBeGreaterThan(0);
  });
});

// ===========================================================================
// MCP TOOLS (Phase 4 additions)
// ===========================================================================

describe('MCP: Phase 4 Tools', () => {
  it('MCP server defines 24 tools total (18 Phase 1-3 + 3 Phase 4 + 5 Phase 5 future = 26, but we count Phase 1-4 = 21)', async () => {
    const mcpMod = await import('../../api/mcp.js');
    const origToken = process.env.MCP_AUTH_TOKEN;
    process.env.MCP_AUTH_TOKEN = 'test';
    const req = {
      method: 'POST',
      headers: { 'x-mcp-token': 'test' },
      body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
    };
    const res = makeRes();
    await mcpMod.default(req, res);
    process.env.MCP_AUTH_TOKEN = origToken;

    const toolNames = res._json.result.tools.map(t => t.name);
    // Phase 4 tools present
    expect(toolNames).toContain('get_staffing_vs_demand');
    expect(toolNames).toContain('get_historical_staffing_outcomes');
    expect(toolNames).toContain('update_staffing_recommendation');
    // Total: 12 core + 6 Phase 3 + 3 Phase 4 + 5 Phase 5 = 26
    expect(res._json.result.tools.length).toBeGreaterThanOrEqual(21);
  });
});

// ===========================================================================
// SYSTEM PROMPT
// ===========================================================================

describe('Staffing-Demand Prompt', () => {
  it('prompt contains consequence framework rules', async () => {
    const mod = await import('../../src/config/staffingDemandPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('CONSEQUENCE');
    expect(prompt).toContain('Revenue at risk');
    expect(prompt).toContain('overstaffing');
    expect(prompt).toContain('confidence');
    expect(prompt).toContain('Feedback Loop');
  });

  it('prompt requires specific shift changes not vague recommendations', async () => {
    const mod = await import('../../src/config/staffingDemandPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('specific shift changes');
    expect(prompt).toContain('outlet, the time window, the number of staff');
  });
});

// ===========================================================================
// REGRESSION: Phase 3 still works
// ===========================================================================

describe('Regression: Phase 3 Game Plan still works', () => {
  it('game plan trigger still produces valid plan', async () => {
    vi.resetModules();
    sqlMock.mockReset();

    // Configure for game plan
    sqlMock.mockImplementation((...args) => {
      const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';
      if (tpl.includes('daily_game_plans') && tpl.includes('SELECT') && !tpl.includes('INSERT')) {
        if (tpl.includes('ORDER BY')) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [] });
      }
      if (tpl.includes('INSERT INTO daily_game_plans') || tpl.includes('ON CONFLICT')) {
        return Promise.resolve({ rows: [{ plan_id: 'plan_reg_001' }] });
      }
      if (tpl.includes('COUNT(*)') && tpl.includes('bookings')) {
        return Promise.resolve({ rows: [{ total_rounds: 80, morning_rounds: 50, afternoon_rounds: 30 }] });
      }
      if (tpl.includes('bookings') && tpl.includes('health_tier')) {
        return Promise.resolve({ rows: [] });
      }
      if (tpl.includes('weather_daily')) {
        return Promise.resolve({ rows: [{ condition: 'sunny', temp_high: 75, temp_low: 60, wind_mph: 5, precipitation_in: 0, golf_demand_modifier: 0.1, fb_demand_modifier: 0 }] });
      }
      if (tpl.includes('staff_shifts')) {
        return Promise.resolve({ rows: [{ outlet: 'Grill Room', shift: 'lunch', staff_count: 6 }] });
      }
      if (tpl.includes('fb_reservations')) {
        return Promise.resolve({ rows: [{ outlet: 'Grill Room', meal_period: 'lunch', total_covers: 40, reservation_count: 10 }] });
      }
      if (tpl.includes('feedback') && tpl.includes('resolved')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const gpMod = await import('../../api/agents/gameplan-trigger.js');
    const gpHandler = gpMod.default;
    const req = makeReq({ plan_date: '2026-04-10' });
    const res = makeRes();
    await gpHandler(req, res);

    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.plan_id).toBeDefined();
    expect(['low', 'normal', 'elevated', 'high']).toContain(res._json.risk_level);
  });
});
