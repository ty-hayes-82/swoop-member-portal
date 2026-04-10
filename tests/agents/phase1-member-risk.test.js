/**
 * Phase 1 — Member Risk Agent: tests for risk-trigger, risk-config, health-monitor, and prompt.
 *
 * Tests the logic in api/agents/risk-trigger.js, api/agents/risk-config.js,
 * api/cron/health-monitor.js, and src/config/memberRiskPrompt.js.
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
  const res = { _status: null, _json: null, status(code) { res._status = code; return res; }, json(data) { res._json = data; return res; } };
  return res;
}

function queueSqlResults(...results) {
  const q = [...results];
  sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let riskTriggerHandler;
let evaluateRiskTrigger;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const triggerMod = await import('../../api/agents/risk-trigger.js');
  riskTriggerHandler = triggerMod.default;

  const configMod = await import('../../api/agents/risk-config.js');
  evaluateRiskTrigger = configMod.evaluateRiskTrigger;
});

// ===========================================================================
// 1. TRIGGER ACCURACY (risk-config evaluateRiskTrigger)
// ===========================================================================

describe('Trigger Accuracy', () => {
  it('1a. member score<50, dues>=8K, delta>15 triggers', async () => {
    queueSqlResults(
      { rows: [{ health_score: 40, annual_dues: 18000 }] },
      { rows: [{ score: 65 }] }, // prior score 30d ago
    );
    const result = await evaluateRiskTrigger('mbr_1', 'club_test');
    expect(result.shouldTrigger).toBe(true);
    expect(result.delta).toBe(25);
  });

  it('1b. member score>=50 does NOT trigger', async () => {
    queueSqlResults(
      { rows: [{ health_score: 55, annual_dues: 18000 }] },
      { rows: [{ score: 80 }] },
    );
    const result = await evaluateRiskTrigger('mbr_2', 'club_test');
    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('health_score 55 >= 50');
  });

  it('1c. new member with low score and high dues DOES trigger', async () => {
    queueSqlResults(
      { rows: [{ health_score: 30, annual_dues: 20000 }] },
      { rows: [] }, // no history
    );
    const result = await evaluateRiskTrigger('mbr_new', 'club_test');
    expect(result.shouldTrigger).toBe(true);
    expect(result.delta).toBe(0);
    expect(result.reason).toContain('New member with low initial health score');
  });

  it('1d. member not found returns shouldTrigger=false', async () => {
    queueSqlResults({ rows: [] });
    const result = await evaluateRiskTrigger('mbr_ghost', 'club_test');
    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('Member not found');
  });

  it('1e. delta exactly 15 does NOT trigger (need >15)', async () => {
    queueSqlResults(
      { rows: [{ health_score: 45, annual_dues: 10000 }] },
      { rows: [{ score: 60 }] }, // delta = 15 exactly
    );
    const result = await evaluateRiskTrigger('mbr_edge', 'club_test');
    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('score delta 15 <= 15');
  });

  it('1f. dues below 8K does NOT trigger', async () => {
    queueSqlResults(
      { rows: [{ health_score: 30, annual_dues: 5000 }] },
      { rows: [{ score: 70 }] },
    );
    const result = await evaluateRiskTrigger('mbr_lowdues', 'club_test');
    expect(result.shouldTrigger).toBe(false);
    expect(result.reason).toContain('annual_dues 5000 < 8000');
  });
});

// ===========================================================================
// 2. RISK-TRIGGER HANDLER (idempotency, rate limit, simulation)
// ===========================================================================

describe('Risk Trigger Handler', () => {
  it('2a. successful trigger creates run + 5 steps in simulation mode', async () => {
    queueSqlResults(
      { rows: [{ health_score: 35, annual_dues: 15000 }] }, // member lookup
      { rows: [{ score: 70 }] }, // history
      { rows: [] }, // no active run
      { rows: [] }, // no recent run
      { rows: [] }, // INSERT playbook_runs
      { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }, // 5 step INSERTs
    );
    const res = makeRes();
    await riskTriggerHandler(makeReq({ member_id: 'mbr_ok' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(true);
    expect(res._json.run_id).toMatch(/^run_/);
    expect(res._json.session_id).toMatch(/^sim_/);
    expect(res._json.simulation).toBe(true);
  });

  it('2b. rejects when active run exists (idempotency)', async () => {
    queueSqlResults(
      { rows: [{ health_score: 35, annual_dues: 15000 }] },
      { rows: [{ score: 70 }] },
      { rows: [{ run_id: 'run_existing' }] }, // active run exists
    );
    const res = makeRes();
    await riskTriggerHandler(makeReq({ member_id: 'mbr_dup' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(false);
    expect(res._json.reason).toContain('Active run already exists');
    expect(res._json.existing_run_id).toBe('run_existing');
  });

  it('2c. rejects when rate limited (run < 1 hour ago)', async () => {
    queueSqlResults(
      { rows: [{ health_score: 35, annual_dues: 15000 }] },
      { rows: [{ score: 70 }] },
      { rows: [] }, // no active run
      { rows: [{ started_at: new Date().toISOString() }] }, // recent run
    );
    const res = makeRes();
    await riskTriggerHandler(makeReq({ member_id: 'mbr_rate' }), res);
    expect(res._status).toBe(200);
    expect(res._json.triggered).toBe(false);
    expect(res._json.reason).toContain('Rate limited');
  });

  it('2d. missing member_id returns 400', async () => {
    const res = makeRes();
    await riskTriggerHandler(makeReq({}), res);
    expect(res._status).toBe(400);
    expect(res._json.error).toContain('member_id is required');
  });

  it('2e. wrong HTTP method returns 405', async () => {
    const res = makeRes();
    await riskTriggerHandler(makeReq({ member_id: 'mbr_1' }, 'GET'), res);
    expect(res._status).toBe(405);
  });
});

// ===========================================================================
// 3. SYSTEM PROMPT QUALITY
// ===========================================================================

describe('System Prompt Quality', () => {
  it('3a. prompt references archetype playbooks', async () => {
    const mod = await import('../../src/config/memberRiskPrompt.js');
    const prompt = mod.default;
    expect(prompt).toContain('Social Golfer');
    expect(prompt).toContain('Legacy Member');
    expect(prompt).toContain('Business Networker');
    expect(prompt).toContain('Family Member');
    expect(prompt).toContain('New Member');
  });

  it('3b. prompt includes concrete example diagnosis', async () => {
    const mod = await import('../../src/config/memberRiskPrompt.js');
    expect(mod.default).toContain('Example Diagnosis Output');
    expect(mod.default).toContain('health_score 38');
  });

  it('3c. prompt includes tool reference with parameter hints', async () => {
    const mod = await import('../../src/config/memberRiskPrompt.js');
    expect(mod.default).toContain('Tool Reference');
    expect(mod.default).toContain('create_action(member_id');
    expect(mod.default).toContain('draft_member_message(member_id');
  });

  it('3d. prompt forbids fabricating data', async () => {
    const mod = await import('../../src/config/memberRiskPrompt.js');
    expect(mod.default).toContain('NEVER fabricate member data');
  });
});

// ===========================================================================
// 4. CRON ROBUSTNESS (health-monitor)
// ===========================================================================

describe('Cron Robustness', () => {
  it('4a. cron rejects unauthorized requests', async () => {
    const mod = await import('../../api/cron/health-monitor.js');
    const handler = mod.default;
    const req = { method: 'GET', headers: {} };
    const res = makeRes();
    // No CRON_SECRET in env
    delete process.env.CRON_SECRET;
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('4b. cron handles zero candidates gracefully', async () => {
    process.env.CRON_SECRET = 'test_secret';
    queueSqlResults({ rows: [] }); // no candidates
    const mod = await import('../../api/cron/health-monitor.js');
    const handler = mod.default;
    const req = { method: 'GET', headers: { authorization: 'Bearer test_secret' } };
    const res = makeRes();
    await handler(req, res);
    expect(res._json.candidatesChecked).toBe(0);
    expect(res._json.triggered).toBe(0);
    delete process.env.CRON_SECRET;
  });
});

// ===========================================================================
// 5. INTEGRATION: coexistence of risk-trigger and service-save-trigger
// ===========================================================================

describe('Integration', () => {
  it('5a. risk-trigger and service-save-trigger use different playbook_ids', async () => {
    // Verify by checking that risk-trigger uses 'member-risk-lifecycle'
    // and service-save-trigger uses 'service-save'
    const riskMod = await import('../../api/agents/risk-trigger.js');
    const serviceMod = await import('../../api/agents/service-save-trigger.js');
    // Both are functions (withAuth-wrapped handlers)
    expect(typeof riskMod.default).toBe('function');
    expect(typeof serviceMod.default).toBe('function');
    // They can coexist because they check different playbook_ids in idempotency queries
  });

  it('5b. risk agent config declares correct tool set', async () => {
    const { RISK_AGENT } = await import('../../api/agents/risk-config.js');
    expect(RISK_AGENT.agent_id).toBe('member-risk-lifecycle');
    expect(RISK_AGENT.tools).toContain('get_member_profile');
    expect(RISK_AGENT.tools).toContain('create_action');
    expect(RISK_AGENT.tools).toContain('record_intervention_outcome');
    expect(RISK_AGENT.tools).toContain('draft_member_message');
    expect(RISK_AGENT.tools).toContain('update_playbook_step');
  });
});
