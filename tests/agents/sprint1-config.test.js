/**
 * Sprint 1 — Agent Config System: assembly, tone presets, config loading.
 *
 * Tests S1-01 through S1-10 from the Agent Config roadmap.
 * Covers assembleAgentCall (api/agents/assemble.js) and tone-presets.js.
 *
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

function queueSqlResults(...results) {
  const q = [...results];
  sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let assembleAgentCall;
let TONE_PRESETS;
let getToneBlock;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const assembleMod = await import('../../api/agents/assemble.js');
  assembleAgentCall = assembleMod.assembleAgentCall;

  const toneMod = await import('../../api/agents/tone-presets.js');
  TONE_PRESETS = toneMod.TONE_PRESETS;
  getToneBlock = toneMod.getToneBlock;
});

// ===========================================================================
// S1-01 / S1-02: Migration tests — not testable in unit tests
// ===========================================================================

describe('S1-01 / S1-02: Migration (stub)', () => {
  it('S1-01: migration runs clean — skipped (requires DB)', () => {
    // Migration tests require a real database connection.
    // Covered by integration / deploy smoke tests.
    expect(true).toBe(true);
  });

  it('S1-02: migration is idempotent — skipped (requires DB)', () => {
    expect(true).toBe(true);
  });
});

// ===========================================================================
// S1-03: Assembly with empty config
// ===========================================================================

describe('S1-03: Assembly with empty config', () => {
  it('returns object with model, system, messages, tools keys', async () => {
    queueSqlResults({ rows: [] });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'test message');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('messages');
    expect(result).toHaveProperty('tools');
  });

  it('defaults to Sonnet model for member-risk-lifecycle', async () => {
    queueSqlResults({ rows: [] });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'test message');
    expect(result.model).toContain('sonnet');
  });

  it('system contains base prompt text', async () => {
    queueSqlResults({ rows: [] });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'test message');
    // The base prompt for member-risk should reference health score recovery
    expect(result.system.length).toBeGreaterThan(100);
    expect(result.system).toContain('health score');
  });
});

// ===========================================================================
// S1-04: Assembly with tone override
// ===========================================================================

describe('S1-04: Assembly with tone override', () => {
  it('system string contains professional tone preset text when tone=professional', async () => {
    queueSqlResults({
      rows: [{
        agent_id: 'member-risk-lifecycle',
        club_id: 'test_club',
        tone: 'professional',
        tool_permissions: null,
        prompt_overrides: null,
        behavioral_config: null,
      }],
    });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'test message');
    // Should include the professional tone preset text
    expect(result.system).toContain('polished, board-room-appropriate');
  });
});

// ===========================================================================
// S1-05: Assembly with tool filtering
// ===========================================================================

describe('S1-05: Assembly with tool filtering', () => {
  it('denied tools are excluded from returned tools array', async () => {
    queueSqlResults({
      rows: [{
        agent_id: 'personal-concierge',
        club_id: 'test_club',
        tone: null,
        tool_permissions: { denied: ['send_message'] },
        prompt_overrides: null,
        behavioral_config: null,
      }],
    });
    const result = await assembleAgentCall('test_club', 'personal-concierge', null, 'test message');
    // Flatten tool names — tools may be objects with a name property or strings
    const toolNames = result.tools.map(t => (typeof t === 'string' ? t : t.name));
    expect(toolNames).not.toContain('send_message');
  });
});

// ===========================================================================
// S1-06: Assembly with prefill
// ===========================================================================

describe('S1-06: Assembly with prefill', () => {
  it('messages array includes prefill with interpolated member name', async () => {
    queueSqlResults({
      rows: [{
        agent_id: 'member-risk-lifecycle',
        club_id: 'test_club',
        tone: null,
        tool_permissions: null,
        prompt_overrides: { prefill: 'Good morning, {member_first_name}' },
        behavioral_config: null,
      }],
    });
    const memberContext = { first_name: 'James', last_name: 'Whitfield' };
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', memberContext, 'test message');
    const assistantMessages = result.messages.filter(m => m.role === 'assistant');
    expect(assistantMessages.length).toBeGreaterThanOrEqual(1);
    expect(assistantMessages[0].content).toBe('Good morning, James');
  });
});

// ===========================================================================
// S1-07: Assembly with custom examples
// ===========================================================================

describe('S1-07: Assembly with custom examples', () => {
  it('system prompt contains club-specific examples from behavioral_config', async () => {
    queueSqlResults({
      rows: [{
        agent_id: 'member-risk-lifecycle',
        club_id: 'test_club',
        tone: null,
        tool_permissions: null,
        prompt_overrides: null,
        behavioral_config: {
          custom_examples: [{
            scenario: 'complaint',
            input: 'The wait was long',
            ideal_response: 'James, that stinks...',
          }],
        },
      }],
    });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'test message');
    expect(result.system).toContain('Club-Specific Examples');
    expect(result.system).toContain('The wait was long');
    expect(result.system).toContain('James, that stinks');
  });
});

// ===========================================================================
// S1-08: Tone presets all valid
// ===========================================================================

describe('S1-08: Tone presets all valid', () => {
  it('warm preset is a non-empty string with length > 50', () => {
    expect(typeof TONE_PRESETS.warm).toBe('string');
    expect(TONE_PRESETS.warm.length).toBeGreaterThan(50);
  });

  it('professional preset is a non-empty string with length > 50', () => {
    expect(typeof TONE_PRESETS.professional).toBe('string');
    expect(TONE_PRESETS.professional.length).toBeGreaterThan(50);
  });

  it('direct preset is a non-empty string with length > 50', () => {
    expect(typeof TONE_PRESETS.direct).toBe('string');
    expect(TONE_PRESETS.direct.length).toBeGreaterThan(50);
  });
});

// ===========================================================================
// S1-09: getToneBlock with invalid tone falls back to warm
// ===========================================================================

describe('S1-09: getToneBlock fallback', () => {
  it('invalid tone "aggressive" falls back to warm preset', () => {
    const result = getToneBlock('aggressive');
    expect(result).toBe(TONE_PRESETS.warm);
  });

  it('null tone falls back to warm preset', () => {
    const result = getToneBlock(null);
    expect(result).toBe(TONE_PRESETS.warm);
  });

  it('undefined tone falls back to warm preset', () => {
    const result = getToneBlock(undefined);
    expect(result).toBe(TONE_PRESETS.warm);
  });
});

// ===========================================================================
// S1-10: Assembly backward compat — no config row
// ===========================================================================

describe('S1-10: Assembly backward compat — no config row', () => {
  it('returns valid payload with defaults when no config row exists', async () => {
    queueSqlResults({ rows: [] });
    const result = await assembleAgentCall('test_club', 'member-risk-lifecycle', null, 'hello');
    // Should not crash, should return a well-formed object
    expect(result).toBeDefined();
    expect(result.model).toBeTruthy();
    expect(result.system).toBeTruthy();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(Array.isArray(result.tools)).toBe(true);
    // Messages should include the user message
    const userMessages = result.messages.filter(m => m.role === 'user');
    expect(userMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('works for any agent type without config', async () => {
    queueSqlResults({ rows: [] });
    const result = await assembleAgentCall('test_club', 'personal-concierge', null, 'hello');
    expect(result).toBeDefined();
    expect(result.model).toBeTruthy();
    expect(result.system).toBeTruthy();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(Array.isArray(result.tools)).toBe(true);
  });
});
