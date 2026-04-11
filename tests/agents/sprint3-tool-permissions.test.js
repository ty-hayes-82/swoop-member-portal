/**
 * Sprint 3 — Tool Permissions & Forbidden Actions guardrails.
 *
 * Tests S3-03, S3-05, S3-07, S3-10 from the Agent Config roadmap.
 * Covers tool filtering, forbidden actions prompt injection, max comp amount,
 * and empty-permissions fallback behavior.
 *
 * Mocks: @vercel/postgres (sql), withAuth, managed-config, logger.
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

function makeTools() {
  return [
    { name: 'lookup_member', displayName: 'Lookup Member', description: 'Search member', category: 'read', riskLevel: 'low' },
    { name: 'send_message', displayName: 'Send Message', description: 'Send msg', category: 'communicate', riskLevel: 'medium' },
    { name: 'book_tee_time', displayName: 'Book Tee Time', description: 'Book tee', category: 'write', riskLevel: 'medium' },
    { name: 'file_complaint', displayName: 'File Complaint', description: 'File complaint', category: 'write', riskLevel: 'high' },
  ];
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let assembleAgentCall;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const assembleMod = await import('../../api/agents/assemble.js');
  assembleAgentCall = assembleMod.assembleAgentCall;
});

// ===========================================================================
// S3-03: Deny a tool -> assembly excludes it
// ===========================================================================

describe('S3-03: Denied tools are excluded from assembly', () => {
  it('should remove denied tools from the payload', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {},
        tool_permissions: {
          denied: ['send_message', 'file_complaint'],
          requires_approval: [],
          auto_execute: ['lookup_member', 'book_tee_time'],
        },
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const tools = makeTools();
    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello', { tools },
    );

    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain('lookup_member');
    expect(toolNames).toContain('book_tee_time');
    expect(toolNames).not.toContain('send_message');
    expect(toolNames).not.toContain('file_complaint');
    expect(result.tools).toHaveLength(2);
  });

  it('should annotate requires_approval tools with GM approval note', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {},
        tool_permissions: {
          denied: [],
          requires_approval: ['book_tee_time'],
          auto_execute: ['lookup_member', 'send_message', 'file_complaint'],
        },
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const tools = makeTools();
    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello', { tools },
    );

    const bookTool = result.tools.find((t) => t.name === 'book_tee_time');
    expect(bookTool).toBeDefined();
    expect(bookTool.description).toContain('REQUIRES GM APPROVAL');
    // Other tools should not have the annotation
    const lookupTool = result.tools.find((t) => t.name === 'lookup_member');
    expect(lookupTool.description).not.toContain('REQUIRES GM APPROVAL');
  });
});

// ===========================================================================
// S3-05: Forbidden actions inject into prompt
// ===========================================================================

describe('S3-05: Forbidden actions are injected into the system prompt', () => {
  it('should include CRITICAL_INSTRUCTION block with forbidden actions', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {
          forbidden_actions: ['offer_refund', 'cancel_membership', 'modify_dues'],
        },
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello',
    );

    expect(result.system).toContain('<CRITICAL_INSTRUCTION>');
    expect(result.system).toContain('You MUST NEVER do any of the following');
    expect(result.system).toContain('- offer_refund');
    expect(result.system).toContain('- cancel_membership');
    expect(result.system).toContain('- modify_dues');
    expect(result.system).toContain('</CRITICAL_INSTRUCTION>');
  });

  it('should not include CRITICAL_INSTRUCTION block when forbidden_actions is empty', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: { forbidden_actions: [] },
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello',
    );

    expect(result.system).not.toContain('<CRITICAL_INSTRUCTION>');
  });
});

// ===========================================================================
// S3-07: Max comp amount injects into prompt
// ===========================================================================

describe('S3-07: Max comp amount guardrail is injected into the system prompt', () => {
  it('should include comp_guardrail block with dollar amount', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {
          max_comp_amount: 75,
        },
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const result = await assembleAgentCall(
      'club_test', 'service-recovery', {}, 'A member is upset',
    );

    expect(result.system).toContain('<comp_guardrail>');
    expect(result.system).toContain('$75');
    expect(result.system).toContain('without GM approval');
    expect(result.system).toContain('</comp_guardrail>');
  });

  it('should not include comp_guardrail when max_comp_amount is null', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {},
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const result = await assembleAgentCall(
      'club_test', 'service-recovery', {}, 'A member is upset',
    );

    expect(result.system).not.toContain('<comp_guardrail>');
  });

  it('should handle max_comp_amount of 0', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: { max_comp_amount: 0 },
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const result = await assembleAgentCall(
      'club_test', 'service-recovery', {}, 'A member is upset',
    );

    expect(result.system).toContain('<comp_guardrail>');
    expect(result.system).toContain('$0');
  });
});

// ===========================================================================
// S3-10: Empty permissions = all tools enabled
// ===========================================================================

describe('S3-10: Empty permissions means all tools are enabled', () => {
  it('should return all tools when tool_permissions is empty object', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {},
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const tools = makeTools();
    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello', { tools },
    );

    expect(result.tools).toHaveLength(4);
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain('lookup_member');
    expect(toolNames).toContain('send_message');
    expect(toolNames).toContain('book_tee_time');
    expect(toolNames).toContain('file_complaint');
  });

  it('should return all tools when no config row exists (defaults)', async () => {
    // sqlMock returns empty rows by default -> _emptyConfig()
    const tools = makeTools();
    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello', { tools },
    );

    expect(result.tools).toHaveLength(4);
  });

  it('should return all tools unmodified (no approval annotations) when permissions empty', async () => {
    queueSqlResults({
      rows: [{
        behavioral_config: {},
        tool_permissions: {},
        prompt_overrides: {},
        tone: 'warm',
        sweep_cadence: null,
      }],
    });

    const tools = makeTools();
    const result = await assembleAgentCall(
      'club_test', 'booking-agent', {}, 'Hello', { tools },
    );

    for (const tool of result.tools) {
      expect(tool.description).not.toContain('REQUIRES GM APPROVAL');
    }
  });
});
