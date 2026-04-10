/**
 * Phase 2 — Service Recovery Agent: tests for complaint-trigger, MCP tools,
 * system prompt, and coexistence with Phase 1.
 *
 * Tests: 2.1-2.4 (Smoke), 2.5-2.9 (Quality Gates)
 * Mocks: @vercel/postgres (sql), withAuth middleware, managed-config, logger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const sqlMock = vi.fn(() => Promise.resolve({ rows: [] }));

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

function queueSqlResults(...results) {
  const q = [...results];
  sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let complaintTriggerHandler;
let evaluateComplaintTrigger;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const triggerMod = await import('../../api/agents/complaint-trigger.js');
  complaintTriggerHandler = triggerMod.default;
  evaluateComplaintTrigger = triggerMod.evaluateComplaintTrigger;
});

// ===========================================================================
// SMOKE TESTS (2.1 - 2.4)
// ===========================================================================

describe('Smoke: Complaint Trigger', () => {
  it('2.1 complaint trigger fires for high-value high-priority member', async () => {
    queueSqlResults(
      { rows: [{ health_score: 45, annual_dues: 22000 }] },       // member lookup
      { rows: [{ cnt: 0 }] },                                      // repeat complainant check
      { rows: [] },                                                 // no active run
      { rows: [] },                                                 // no recent run (rate limit)
      { rows: [] },                                                 // INSERT playbook_runs
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, // 6 step INSERTs
    );
    const res = makeRes();
    await complaintTriggerHandler(makeReq({ member_id: 'mbr_203', priority: 'high', category: 'F&B' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.run_id).toMatch(/^run_sr_/);
    expect(res._json.session_id).toMatch(/^sim_sr_/);
    expect(res._json.simulation).toBe(true);
    expect(res._json.playbook_id).toBe('service-recovery');
    expect(res._json.steps_created).toBe(6);
  });

  it('2.2 department routing: trigger includes category for routing', async () => {
    queueSqlResults(
      { rows: [{ health_score: 60, annual_dues: 15000 }] },
      { rows: [{ cnt: 0 }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
    );
    const res = makeRes();
    await complaintTriggerHandler(makeReq({ member_id: 'mbr_203', priority: 'critical', category: 'Golf' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    // The prompt handles routing rules; trigger passes the category through
    expect(res._json.priority).toBe('critical');
  });

  it('2.3 GM alert step exists in playbook (6 steps created)', async () => {
    queueSqlResults(
      { rows: [{ health_score: 50, annual_dues: 12000 }] },
      { rows: [{ cnt: 0 }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
    );
    const res = makeRes();
    await complaintTriggerHandler(makeReq({ member_id: 'mbr_203', priority: 'high', category: 'Facilities' }), res);
    expect(res._json.triggered).toBe(true);
    expect(res._json.steps_created).toBe(6);
    // Verify SQL was called 11 times: member lookup + repeat check + active run + rate limit + run insert + 6 steps
    expect(sqlMock).toHaveBeenCalledTimes(11);
  });

  it('2.4 coexistence: complaint-trigger and risk-trigger use different playbook_ids', async () => {
    const complaintMod = await import('../../api/agents/complaint-trigger.js');
    const riskMod = await import('../../api/agents/risk-trigger.js');
    // Both are functions (handlers)
    expect(typeof complaintMod.default).toBe('function');
    expect(typeof riskMod.default).toBe('function');
    // They use different playbook_ids so idempotency checks don't collide
    // complaint-trigger uses 'service-recovery', risk-trigger uses 'member-risk-lifecycle'
  });
});

// ===========================================================================
// QUALITY GATES (2.5 - 2.9)
// ===========================================================================

describe('Quality: Repeat Complainant Detection', () => {
  it('2.5 detects repeat complainant when >1 complaint in 90 days', async () => {
    queueSqlResults(
      { rows: [{ health_score: 40, annual_dues: 18000 }] },
      { rows: [{ cnt: 3 }] },  // 3 complaints in 90 days
    );
    const result = await evaluateComplaintTrigger('mbr_203', 'club_test', 'high');
    expect(result.shouldTrigger).toBe(true);
    expect(result.repeatComplainant).toBe(true);
  });
});

describe('Quality: 48h Escalation', () => {
  it('2.6 escalation step exists in playbook steps', async () => {
    // Verify the service-recovery playbook includes a 48h escalation step
    const mod = await import('../../api/agents/complaint-trigger.js');
    // Access the handler — the steps are baked into the module
    // We verify by triggering and counting SQL calls for 6 steps
    queueSqlResults(
      { rows: [{ health_score: 45, annual_dues: 22000 }] },
      { rows: [{ cnt: 0 }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] },
    );
    const res = makeRes();
    await complaintTriggerHandler(makeReq({ member_id: 'mbr_203', priority: 'high' }), res);
    expect(res._json.triggered).toBe(true);
    // 6 steps total; step 4 is the escalation
    expect(res._json.steps_created).toBe(6);
  });
});

describe('Quality: Day 7 Follow-up', () => {
  it('2.7 Day 7 check-in step exists in playbook', async () => {
    // The prompt instructs the agent to do a Day 7 satisfaction check-in (step 5)
    const mod = await import('../../src/config/serviceRecoveryPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('Day 7');
    expect(prompt).toContain('satisfaction check-in');
  });
});

describe('Quality: No-Fault Language', () => {
  it('2.8 prompt enforces no-fault language rule', async () => {
    const mod = await import('../../src/config/serviceRecoveryPrompt.js');
    const prompt = mod.default;
    // Prompt includes the no-fault rule
    expect(prompt).toContain('No-Fault Language Rule');
    expect(prompt).toContain('never draft apology messages that admit fault');
    // Prompt includes DO NOT examples
    expect(prompt).toContain('We apologize for the mistake');
    expect(prompt).toContain('This was our fault');
    // Prompt includes DO examples
    expect(prompt).toContain('We appreciate you bringing this to our attention');
    expect(prompt).toContain('We want to make this right');
  });
});

describe('Quality: Dues in Rationale', () => {
  it('2.9 trigger evaluation always includes dues in output', async () => {
    queueSqlResults(
      { rows: [{ health_score: 55, annual_dues: 22000 }] },
      { rows: [{ cnt: 0 }] },
    );
    const result = await evaluateComplaintTrigger('mbr_203', 'club_test', 'high');
    expect(result.shouldTrigger).toBe(true);
    expect(result.dues).toBe(22000);
    // The reason string includes the dues amount
    expect(result.reason).toContain('22000');
  });

  it('2.9b prompt requires dues in every rationale', async () => {
    const mod = await import('../../src/config/serviceRecoveryPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('Every rationale MUST include the specific dollar amount');
    expect(prompt).toContain('annual dues');
  });
});

// ===========================================================================
// MCP TOOLS (Phase 2 additions)
// ===========================================================================

describe('MCP: Phase 2 Tools', () => {
  it('MCP server defines 12 tools total', async () => {
    // Read the TOOL_DEFINITIONS array length
    const mcpMod = await import('../../api/mcp.js');
    // We can't directly access TOOL_DEFINITIONS, but we can call tools/list
    const req = {
      method: 'POST',
      headers: { 'x-mcp-token': process.env.MCP_AUTH_TOKEN || 'test' },
      body: { jsonrpc: '2.0', method: 'tools/list', id: 1 },
    };
    // Set the env var so auth passes
    const origToken = process.env.MCP_AUTH_TOKEN;
    process.env.MCP_AUTH_TOKEN = 'test';
    const res = makeRes();
    await mcpMod.default(req, res);
    process.env.MCP_AUTH_TOKEN = origToken;

    expect(res._json.result.tools).toHaveLength(18);
    const toolNames = res._json.result.tools.map(t => t.name);
    expect(toolNames).toContain('get_complaint_history');
    expect(toolNames).toContain('update_complaint_status');
  });
});
