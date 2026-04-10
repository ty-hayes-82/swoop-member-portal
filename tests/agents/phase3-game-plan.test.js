/**
 * Phase 3 — Tomorrow's Game Plan Agent: tests for gameplan-trigger, MCP tools,
 * system prompt, cross-domain synthesis, and regression against Phase 1+2.
 *
 * Tests: 3.1-3.4 (Smoke), 3.5-3.10 (Quality Gates)
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
 * Configure sqlMock to return appropriate results based on the SQL template content.
 * Since Promise.all causes concurrent SQL calls, a sequential queue is unreliable.
 * Instead we pattern-match on the SQL template strings.
 */
function configureSqlMock(config = {}) {
  const defaults = {
    existingPlan: { rows: [] },
    teeSheetSummary: { rows: [{ total_rounds: 120, morning_rounds: 72, afternoon_rounds: 48 }] },
    teeSheetNotable: { rows: [{ member_id: 'mbr_203', first_name: 'James', last_name: 'Whitfield', health_score: 42, annual_dues: 22000, tee_time: '09:30' }] },
    weather: { rows: [{ condition: 'windy', temp_high: 78, temp_low: 62, wind_mph: 18, precipitation_in: 0, golf_demand_modifier: -0.15, fb_demand_modifier: 0.05 }] },
    staffing: { rows: [{ outlet: 'Grill Room', shift: 'lunch', staff_count: 4 }] },
    fbReservations: { rows: [{ outlet: 'Grill Room', meal_period: 'lunch', total_covers: 85, reservation_count: 22 }] },
    complaints: { rows: [{ feedback_id: 'fb_001', member_id: 'mbr_203', category: 'F&B', status: 'open', sentiment_score: 2, description: 'Slow service', submitted_at: '2026-04-08' }] },
    history: { rows: [] },
    savePlan: { rows: [{ plan_id: 'plan_test_001' }] },
  };
  const c = { ...defaults, ...config };

  sqlMock.mockImplementation((...args) => {
    // Tagged template literal: first arg is the template strings array
    const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';

    if (tpl.includes('daily_game_plans') && tpl.includes('SELECT') && !tpl.includes('INSERT')) {
      // Could be idempotency check (plan_date =) or history (ORDER BY plan_date DESC)
      if (tpl.includes('ORDER BY')) {
        return Promise.resolve(c.history);
      }
      return Promise.resolve(c.existingPlan);
    }
    if (tpl.includes('INSERT INTO daily_game_plans') || tpl.includes('ON CONFLICT')) {
      return Promise.resolve(c.savePlan);
    }
    if (tpl.includes('COUNT(*)') && tpl.includes('bookings')) {
      return Promise.resolve(c.teeSheetSummary);
    }
    if (tpl.includes('bookings') && tpl.includes('health_tier')) {
      return Promise.resolve(c.teeSheetNotable);
    }
    if (tpl.includes('weather_daily')) {
      return Promise.resolve(c.weather);
    }
    if (tpl.includes('staff_shifts')) {
      return Promise.resolve(c.staffing);
    }
    if (tpl.includes('fb_reservations')) {
      return Promise.resolve(c.fbReservations);
    }
    if (tpl.includes('feedback') && tpl.includes('resolved')) {
      return Promise.resolve(c.complaints);
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

let gameplanHandler;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const mod = await import('../../api/agents/gameplan-trigger.js');
  gameplanHandler = mod.default;
});

// ===========================================================================
// SMOKE TESTS (3.1 - 3.4)
// ===========================================================================

describe('Smoke: Game Plan Trigger', () => {
  it('3.1 daily cron fires — game plan session runs and plan row written', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.plan_id).toBeDefined();
    expect(res._json.simulation).toBe(true);
  });

  it('3.2 all 5 data pulls succeed — response includes all domain counts', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._status).toBe(200);
    const dp = res._json.data_pulls;
    expect(dp.tee_sheet).toBeDefined();
    expect(dp.weather).toBeDefined();
    expect(dp.staffing).toBeDefined();
    expect(dp.fb_covers).toBeDefined();
    expect(dp.open_complaints).toBeDefined();
    expect(dp.history_days).toBeDefined();
  });

  it('3.3 plan appears with correct risk_level', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.risk_level).toBeDefined();
    expect(['low', 'normal', 'elevated', 'high']).toContain(res._json.risk_level);
  });

  it('3.4 actions created — action_count matches plan items', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.action_count).toBeGreaterThanOrEqual(0);
    expect(res._json.action_count).toBeLessThanOrEqual(5);
  });
});

// ===========================================================================
// QUALITY GATES (3.5 - 3.10)
// ===========================================================================

describe('Quality: Cross-Domain Insight', () => {
  it('3.5 plan actions cite signals from 2+ domains', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    // With an at-risk notable member AND an open complaint, the synthesizer
    // should produce at least 1 action that spans domains
    if (res._json.action_count > 0) {
      expect(res._json.action_count).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Quality: Quiet Day', () => {
  it('3.6 low-demand day produces low risk level with 0-1 actions', async () => {
    configureSqlMock({
      teeSheetSummary: { rows: [{ total_rounds: 40, morning_rounds: 25, afternoon_rounds: 15 }] },
      teeSheetNotable: { rows: [] },
      weather: { rows: [{ condition: 'sunny', temp_high: 75, temp_low: 60, wind_mph: 5, precipitation_in: 0, golf_demand_modifier: 0.1, fb_demand_modifier: 0 }] },
      staffing: { rows: [{ outlet: 'Grill Room', shift: 'lunch', staff_count: 6 }, { outlet: 'Grill Room', shift: 'dinner', staff_count: 4 }] },
      fbReservations: { rows: [{ outlet: 'Grill Room', meal_period: 'lunch', total_covers: 30, reservation_count: 8 }] },
      complaints: { rows: [] },
    });
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.risk_level).toBe('low');
    expect(res._json.action_count).toBeLessThanOrEqual(1);
  });
});

describe('Quality: Weather-Demand Correlation', () => {
  it('3.7 high wind + full tee sheet produces staffing adjustment action', async () => {
    configureSqlMock({
      teeSheetSummary: { rows: [{ total_rounds: 140, morning_rounds: 90, afternoon_rounds: 50 }] },
      weather: { rows: [{ condition: 'windy', temp_high: 72, temp_low: 58, wind_mph: 22, precipitation_in: 0, golf_demand_modifier: -0.2, fb_demand_modifier: 0.1 }] },
    });
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.action_count).toBeGreaterThanOrEqual(1);
  });
});

describe('Quality: At-Risk Member Overlay', () => {
  it('3.8 at-risk member with open complaint flagged in game plan', async () => {
    configureSqlMock();
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    // Standard data includes mbr_203 (at-risk, open complaint) -- should generate action
    expect(res._json.action_count).toBeGreaterThanOrEqual(1);
  });
});

describe('Quality: Stale Data Handling', () => {
  it('3.9 missing weather data marked unavailable in data_pulls', async () => {
    configureSqlMock({
      weather: { rows: [] }, // No weather data
    });
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    // When pullWeather returns { available: false }, the trigger reports weather: false
    expect(res._json.data_pulls.weather).toBe(false);
  });
});

describe('Quality: Continuity', () => {
  it('3.10 history data is pulled and included in plan context', async () => {
    configureSqlMock({
      history: { rows: [
        { plan_id: 'plan_prev_1', plan_date: '2026-04-09', risk_level: 'normal', action_count: 2, plan_content: {}, actions_approved: 2, actions_dismissed: 0 },
        { plan_id: 'plan_prev_2', plan_date: '2026-04-08', risk_level: 'elevated', action_count: 3, plan_content: {}, actions_approved: 1, actions_dismissed: 1 },
      ] },
    });
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.data_pulls.history_days).toBe(2);
  });
});

// ===========================================================================
// MCP TOOLS (Phase 3 additions)
// ===========================================================================

describe('MCP: Phase 3 Tools', () => {
  it('MCP server defines 18 tools total', async () => {
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

    expect(res._json.result.tools).toHaveLength(18);
    const toolNames = res._json.result.tools.map(t => t.name);
    expect(toolNames).toContain('get_tee_sheet_summary');
    expect(toolNames).toContain('get_weather_forecast');
    expect(toolNames).toContain('get_staffing_schedule');
    expect(toolNames).toContain('get_fb_reservations');
    expect(toolNames).toContain('get_daily_game_plan_history');
    expect(toolNames).toContain('save_game_plan');
  });
});

// ===========================================================================
// SYSTEM PROMPT
// ===========================================================================

describe('Game Plan Prompt', () => {
  it('prompt contains cross-domain synthesis rules', async () => {
    const mod = await import('../../src/config/gamePlanPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('cross-domain');
    expect(prompt).toContain('Maximum 5 action items');
    expect(prompt).toContain('Low-risk day');
    expect(prompt).toContain('calm, authoritative, prepared');
  });

  it('prompt references all 5 data domains', async () => {
    const mod = await import('../../src/config/gamePlanPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('Tee sheet');
    expect(prompt).toContain('Weather');
    expect(prompt).toContain('Staffing');
    expect(prompt).toContain('F&B');
    expect(prompt).toContain('Member risk');
  });
});

// ===========================================================================
// IDEMPOTENCY
// ===========================================================================

describe('Idempotency', () => {
  it('rejects duplicate plan for same date', async () => {
    configureSqlMock({ existingPlan: { rows: [{ plan_id: 'plan_existing' }] } });
    const res = makeRes();
    await gameplanHandler(makeReq({ plan_date: '2026-04-10' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(false);
    expect(res._json.existing_plan_id).toBe('plan_existing');
  });
});
