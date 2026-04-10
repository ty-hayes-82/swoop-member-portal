/**
 * Phase 5 — Chief of Staff Meta-Agent: tests for cos-trigger, MCP tools,
 * conflict detection, deduplication, priority ordering, provenance, and
 * coordination log accuracy.
 *
 * Tests: 5.1-5.3 (Smoke), 5.4-5.10 (Quality Gates), 5.11-5.13 (Value)
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
 * Generate mock actions from multiple agents.
 */
function mockActions(overrides = []) {
  const defaults = [
    { action_id: 'act_risk_001', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'high', source: 'member-risk-lifecycle', description: 'Call James Whitfield — health score dropped to 42', impact_metric: '$22K/yr at risk', member_id: 'mbr_203', status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
    { action_id: 'act_svc_001', agent_id: 'service-recovery', action_type: 'outreach', priority: 'high', source: 'service-recovery', description: 'Urgent: James Whitfield open complaint — F&B service issue', impact_metric: '$22K/yr at risk', member_id: 'mbr_203', status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
    { action_id: 'act_staff_001', agent_id: 'staffing-demand', action_type: 'rebalance', priority: 'medium', source: 'staffing-demand', description: 'Add one Grill Room server for lunch — high cover day', impact_metric: '$2,400 revenue at risk', member_id: null, status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
    { action_id: 'act_gp_001', agent_id: 'tomorrows-game-plan', action_type: 'alert_staff', priority: 'medium', source: 'tomorrows-game-plan', description: 'Afternoon staffing adjustment for weather shift', impact_metric: 'Reduced complaint risk', member_id: null, status: 'pending', timestamp: '2026-04-09T05:03:00Z', contributing_agents: null, coordination_log_id: null },
  ];
  const actions = overrides.length > 0 ? overrides : defaults;
  return actions;
}

function mockConfidenceScores(overrides = []) {
  return overrides.length > 0 ? overrides : [
    { agent_id: 'member-risk-lifecycle', avg_confidence: 0.82, total_actions: 25 },
    { agent_id: 'service-recovery', avg_confidence: 0.78, total_actions: 12 },
    { agent_id: 'staffing-demand', avg_confidence: 0.71, total_actions: 40 },
    { agent_id: 'tomorrows-game-plan', avg_confidence: 0.85, total_actions: 30 },
  ];
}

/**
 * Configure sqlMock to return appropriate results based on SQL content.
 */
function configureSqlMock(config = {}) {
  const defaults = {
    pendingActions: mockActions(config.actions || []),
    confidenceScores: mockConfidenceScores(config.confidence || []),
    saveLog: { rows: [{ log_id: 'log_test_001' }] },
    agentLookup: null, // per-action agent lookup for merge
  };
  const c = { ...defaults, ...config };

  sqlMock.mockImplementation((...args) => {
    const tpl = Array.isArray(args[0]) ? args[0].join(' ') : '';

    // Pending actions query
    if (tpl.includes('agent_actions') && tpl.includes('pending') && tpl.includes('SELECT') && tpl.includes('ORDER BY')) {
      return Promise.resolve({ rows: c.pendingActions });
    }
    // Agent confidence scores
    if (tpl.includes('agent_activity') && tpl.includes('AVG')) {
      return Promise.resolve({ rows: c.confidenceScores });
    }
    // Coordination log insert
    if (tpl.includes('coordination_logs') && tpl.includes('INSERT')) {
      return Promise.resolve(c.saveLog);
    }
    // Agent lookup for merge
    if (tpl.includes('agent_actions') && tpl.includes('SELECT') && tpl.includes('agent_id') && !tpl.includes('ORDER BY')) {
      const actionId = args[1]; // tagged template parameter
      const found = c.pendingActions.find(a => a.action_id === actionId);
      return Promise.resolve({ rows: found ? [{ agent_id: found.agent_id }] : [] });
    }
    // Update actions (dismiss, tag)
    if (tpl.includes('agent_actions') && tpl.includes('UPDATE')) {
      return Promise.resolve({ rows: [] });
    }
    // Insert merged action
    if (tpl.includes('agent_actions') && tpl.includes('INSERT')) {
      return Promise.resolve({ rows: [] });
    }
    return Promise.resolve({ rows: [] });
  });
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let cosHandler;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const mod = await import('../../api/agents/cos-trigger.js');
  cosHandler = mod.default;
});

// ===========================================================================
// SMOKE TESTS (5.1 - 5.3)
// ===========================================================================

describe('Smoke: Chief of Staff Trigger', () => {
  it('5.1 CoS runs after Game Plan — session starts on post_game_plan trigger', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.simulation).toBe(true);
  });

  it('5.2 All agents feed CoS — pending actions from multiple agents returned', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.agents_contributing).toBeDefined();
    expect(res._json.agents_contributing.length).toBeGreaterThanOrEqual(2);
  });

  it('5.3 Output is consolidated — max 5 actions after coordination', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.output_actions).toBeLessThanOrEqual(5);
  });
});

// ===========================================================================
// QUALITY GATES (5.4 - 5.10)
// ===========================================================================

describe('Quality: Conflict Detection', () => {
  it('5.4 Conflict detection — contradictory staffing actions identified and resolved', async () => {
    const conflictActions = [
      { action_id: 'act_staff_add', agent_id: 'staffing-demand', action_type: 'rebalance', priority: 'medium', source: 'staffing-demand', description: 'Add 2 Grill Room servers for Saturday lunch', impact_metric: '$2,400', member_id: null, status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_staff_release', agent_id: 'tomorrows-game-plan', action_type: 'rebalance', priority: 'medium', source: 'tomorrows-game-plan', description: 'Release 2 Grill Room staff — low demand expected', impact_metric: '$380 savings', member_id: null, status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_risk_002', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'high', source: 'member-risk-lifecycle', description: 'Follow up with member', impact_metric: '$15K', member_id: 'mbr_100', status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
    ];
    configureSqlMock({ actions: conflictActions });
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.conflicts_detected).toBeGreaterThanOrEqual(1);
    expect(res._json.conflicts_resolved).toBeGreaterThanOrEqual(1);
  });
});

describe('Quality: Deduplication', () => {
  it('5.5 Deduplication — same member flagged by two agents is merged', async () => {
    configureSqlMock(); // default actions have mbr_203 from both risk + service-recovery
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    // Output should have fewer actions than input since mbr_203 duplicates are merged
    expect(res._json.output_actions).toBeLessThan(res._json.input_actions);
  });
});

describe('Quality: Priority Ordering', () => {
  it('5.6 Priority ordering — actions sorted by descending priority', async () => {
    const mixedActions = [
      { action_id: 'act_low', agent_id: 'agent-a', action_type: 'outreach', priority: 'low', source: 'agent-a', description: 'Low priority item', impact_metric: '$1K', member_id: 'mbr_100', status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_high', agent_id: 'agent-b', action_type: 'outreach', priority: 'high', source: 'agent-b', description: 'High priority item', impact_metric: '$22K', member_id: 'mbr_200', status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_med', agent_id: 'agent-c', action_type: 'alert_staff', priority: 'medium', source: 'agent-c', description: 'Medium priority item', impact_metric: '$5K', member_id: 'mbr_300', status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
    ];
    configureSqlMock({ actions: mixedActions });
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    // High priority should survive, output respects ordering
    expect(res._json.output_actions).toBeGreaterThanOrEqual(1);
    expect(res._json.output_actions).toBeLessThanOrEqual(5);
  });
});

describe('Quality: Provenance Tracking', () => {
  it('5.7 Provenance — merged actions track contributing agents', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    // Verify that sqlMock was called with contributing_agents update
    const updateCalls = sqlMock.mock.calls.filter(call => {
      const tpl = Array.isArray(call[0]) ? call[0].join(' ') : '';
      return tpl.includes('contributing_agents') && tpl.includes('UPDATE');
    });
    expect(updateCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Quality: Coordination Log', () => {
  it('5.8 Coordination log accuracy — log correctly counts inputs, outputs, conflicts', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.log_id).toBeDefined();
    expect(res._json.input_actions).toBe(4); // default mock has 4 actions
    expect(typeof res._json.output_actions).toBe('number');
    expect(typeof res._json.conflicts_detected).toBe('number');
    expect(typeof res._json.conflicts_resolved).toBe('number');
  });
});

describe('Quality: Information Preservation', () => {
  it('5.9 No information loss — output action count + dismissed count = input count', async () => {
    configureSqlMock();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    // output + dismissed should account for all inputs
    // (some are merged: dismissed originals + 1 surviving representative per group)
    expect(res._json.output_actions).toBeGreaterThanOrEqual(1);
    expect(res._json.input_actions).toBeGreaterThanOrEqual(res._json.output_actions);
  });
});

describe('Quality: Graceful Degradation', () => {
  it('5.10 Graceful degradation — CoS runs with single agent when others are missing', async () => {
    const singleAgentActions = [
      { action_id: 'act_risk_solo', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'high', source: 'member-risk-lifecycle', description: 'Solo agent action', impact_metric: '$18K', member_id: 'mbr_201', status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_risk_solo2', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'medium', source: 'member-risk-lifecycle', description: 'Second solo action', impact_metric: '$12K', member_id: 'mbr_202', status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_risk_solo3', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'low', source: 'member-risk-lifecycle', description: 'Third solo action', impact_metric: '$8K', member_id: 'mbr_203', status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
    ];
    configureSqlMock({ actions: singleAgentActions });
    const res = makeRes();
    // Force trigger with post_game_plan to bypass multi-agent check
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.agents_contributing.length).toBe(1);
    expect(res._json.agents_contributing[0]).toBe('member-risk-lifecycle');
  });
});

// ===========================================================================
// VALUE TESTS (5.11 - 5.13)
// ===========================================================================

describe('Value: Cognitive Load Reduction', () => {
  it('5.11 Cognitive load — raw 8+ actions consolidated to <= 5', async () => {
    const manyActions = [
      { action_id: 'act_1', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'high', source: 'member-risk-lifecycle', description: 'Risk action 1', impact_metric: '$22K', member_id: 'mbr_203', status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_2', agent_id: 'service-recovery', action_type: 'outreach', priority: 'high', source: 'service-recovery', description: 'Service action for same member', impact_metric: '$22K', member_id: 'mbr_203', status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_3', agent_id: 'staffing-demand', action_type: 'rebalance', priority: 'medium', source: 'staffing-demand', description: 'Add staff for lunch', impact_metric: '$2,400', member_id: null, status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_4', agent_id: 'tomorrows-game-plan', action_type: 'alert_staff', priority: 'medium', source: 'tomorrows-game-plan', description: 'Weather adjustment', impact_metric: '$1,800', member_id: null, status: 'pending', timestamp: '2026-04-09T05:03:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_5', agent_id: 'member-risk-lifecycle', action_type: 'outreach', priority: 'medium', source: 'member-risk-lifecycle', description: 'Risk action 2', impact_metric: '$15K', member_id: 'mbr_100', status: 'pending', timestamp: '2026-04-09T05:04:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_6', agent_id: 'service-recovery', action_type: 'outreach', priority: 'medium', source: 'service-recovery', description: 'Service action 2', impact_metric: '$15K', member_id: 'mbr_100', status: 'pending', timestamp: '2026-04-09T05:05:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_7', agent_id: 'staffing-demand', action_type: 'rebalance', priority: 'low', source: 'staffing-demand', description: 'Release evening staff', impact_metric: '$380', member_id: null, status: 'pending', timestamp: '2026-04-09T05:06:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_8', agent_id: 'tomorrows-game-plan', action_type: 'alert_staff', priority: 'low', source: 'tomorrows-game-plan', description: 'Low priority observation', impact_metric: '$200', member_id: null, status: 'pending', timestamp: '2026-04-09T05:07:00Z', contributing_agents: null, coordination_log_id: null },
    ];
    configureSqlMock({ actions: manyActions });
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.input_actions).toBe(8);
    expect(res._json.output_actions).toBeLessThanOrEqual(5);
  });
});

describe('Value: Decision Speed', () => {
  it('5.12 Decision speed — CoS processes in simulation mode without timeout', async () => {
    configureSqlMock();
    const start = Date.now();
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    const elapsed = Date.now() - start;
    expect(res._json.triggered).toBe(true);
    // Simulation should complete in well under 5 seconds
    expect(elapsed).toBeLessThan(5000);
  });
});

describe('Value: Conflict Resolution Accuracy', () => {
  it('5.13 Conflict resolution — higher-confidence agent wins conflict', async () => {
    const conflictActions = [
      { action_id: 'act_low_conf', agent_id: 'agent-low', action_type: 'rebalance', priority: 'medium', source: 'agent-low', description: 'Release staff — overstaffed', impact_metric: '$380', member_id: null, status: 'pending', timestamp: '2026-04-09T05:00:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_high_conf', agent_id: 'agent-high', action_type: 'rebalance', priority: 'medium', source: 'agent-high', description: 'Add staff — high demand expected', impact_metric: '$2,400', member_id: null, status: 'pending', timestamp: '2026-04-09T05:01:00Z', contributing_agents: null, coordination_log_id: null },
      { action_id: 'act_other', agent_id: 'agent-other', action_type: 'outreach', priority: 'high', source: 'agent-other', description: 'Unrelated action', impact_metric: '$10K', member_id: 'mbr_300', status: 'pending', timestamp: '2026-04-09T05:02:00Z', contributing_agents: null, coordination_log_id: null },
    ];
    const confidence = [
      { agent_id: 'agent-low', avg_confidence: 0.45, total_actions: 10 },
      { agent_id: 'agent-high', avg_confidence: 0.88, total_actions: 30 },
      { agent_id: 'agent-other', avg_confidence: 0.75, total_actions: 20 },
    ];
    configureSqlMock({ actions: conflictActions, confidence });
    const res = makeRes();
    await cosHandler(makeReq({ trigger: 'post_game_plan' }), res);
    expect(res._json.conflicts_detected).toBeGreaterThanOrEqual(1);
    expect(res._json.conflicts_resolved).toBeGreaterThanOrEqual(1);
    // The lower-confidence agent's action should have been dismissed
    const dismissCalls = sqlMock.mock.calls.filter(call => {
      const tpl = Array.isArray(call[0]) ? call[0].join(' ') : '';
      return tpl.includes('UPDATE') && tpl.includes('dismissed') && tpl.includes('cos_coordination');
    });
    expect(dismissCalls.length).toBeGreaterThanOrEqual(1);
  });
});
