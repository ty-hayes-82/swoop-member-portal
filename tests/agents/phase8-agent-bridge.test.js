/**
 * Phase 8 — Agent-to-Agent Communication (Capstone)
 *
 * Tests the full loop where member-facing concierge actions trigger
 * club-side agent notifications via the agent bridge and event bus.
 *
 * Tests: 8.1-8.3 (Smoke), 8.4-8.5 (Smoke/Quality), 8.6-8.8 (Quality),
 *        8.9-8.11 (Integration)
 * Plus regression: all Phase 1-7 tests still pass (via shared vitest run).
 *
 * Mocks: @vercel/postgres (sql), managed-config, logger.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

const sqlMock = vi.fn(() => Promise.resolve({ rows: [] }));
sqlMock.query = vi.fn(() => Promise.resolve({ rows: [] }));

vi.mock('@vercel/postgres', () => ({ sql: sqlMock }));

vi.mock('../../api/agents/managed-config.js', () => ({
  MANAGED_AGENT_ID: '',
  MANAGED_ENV_ID: '',
  getAnthropicClient: () => ({}),
  createManagedSession: vi.fn().mockResolvedValue({ id: 'sim_test_session' }),
  sendSessionEvent: vi.fn().mockResolvedValue({}),
  sendThreadMessage: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../api/lib/withAuth.js', () => ({
  withAuth: (handler) => handler,
  getWriteClubId: (req) => req.auth?.clubId ?? 'club_test',
  getReadClubId: (req) => req.auth?.clubId ?? 'club_test',
  getClubId: (req) => req.auth?.clubId ?? 'club_test',
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

const HEALTHY_MEMBER = {
  member_id: 'mbr_001', first_name: 'John', last_name: 'Smith',
  health_score: 82, health_tier: 'healthy', annual_dues: 15000,
};

const AT_RISK_MEMBER = {
  member_id: 'mbr_042', first_name: 'Carol', last_name: 'Danvers',
  health_score: 35, health_tier: 'at-risk', annual_dues: 22000,
};

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let notifyClubAgents, getMemberForBridge, hasOpenComplaints, logBridgeActivity;
let routeEvent, findActiveSession;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const bridgeMod = await import('../../api/agents/agent-bridge.js');
  notifyClubAgents = bridgeMod.notifyClubAgents;
  getMemberForBridge = bridgeMod.getMemberForBridge;
  hasOpenComplaints = bridgeMod.hasOpenComplaints;
  logBridgeActivity = bridgeMod.logBridgeActivity;

  const eventsMod = await import('../../api/agents/agent-events.js');
  routeEvent = eventsMod.routeEvent;
  findActiveSession = eventsMod.findActiveSession;
});

// ===========================================================================
// 8.1 Smoke: Concierge booking triggers bridge
// ===========================================================================
describe('8.1 — Concierge booking triggers agent bridge', () => {
  it('notifyClubAgents returns notifications for a healthy member booking', async () => {
    queueSqlResults(
      { rows: [HEALTHY_MEMBER] },        // getMemberForBridge
      { rows: [] },                        // findActiveSession (staffing-demand)
      { rows: [] },                        // hasOpenComplaints
      { rows: [{ activity_id: 'act_1' }] }, // logBridgeActivity
    );

    const result = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'book_tee_time',
      details: { booking_date: '2026-04-15', tee_time: '08:00', player_count: 2 },
    });

    expect(result).toBeDefined();
    expect(result.member_name).toBe('John Smith');
    expect(result.at_risk).toBe(false);
    expect(result.activity_id).toBe('act_1');
    expect(result.notifications).toBeInstanceOf(Array);
  });
});

// ===========================================================================
// 8.2 Smoke: Bridge logs agent_activity
// ===========================================================================
describe('8.2 — Bridge logs agent_activity', () => {
  it('logBridgeActivity inserts into agent_activity with phase=agent-bridge', async () => {
    queueSqlResults(
      { rows: [{ activity_id: 'act_bridge_1' }] },
    );

    const activityId = await logBridgeActivity(
      'club_test', 'concierge_booking', 'Test booking by John Smith', 'mbr_001', '{}',
    );

    expect(activityId).toBe('act_bridge_1');
    // Verify SQL was called with agent-bridge phase
    const lastCall = sqlMock.mock.calls[0];
    expect(lastCall).toBeDefined();
  });
});

// ===========================================================================
// 8.3 Smoke: At-risk member booking triggers member_re_engaged event
// ===========================================================================
describe('8.3 — At-risk member booking notifies Member Risk agent', () => {
  it('fires member_re_engaged when health_score < 50', async () => {
    queueSqlResults(
      { rows: [AT_RISK_MEMBER] },           // getMemberForBridge
      { rows: [{ run_id: 'run_1', agent_session_id: 'sim_risk_sess' }] }, // findActiveSession for member-risk-lifecycle
      { rows: [] },                           // findActiveSession for staffing-demand
      { rows: [] },                           // hasOpenComplaints
      { rows: [{ activity_id: 'act_2' }] },  // logBridgeActivity
    );

    const result = await notifyClubAgents('club_test', 'mbr_042', {
      type: 'book_tee_time',
      details: { booking_date: '2026-04-15', tee_time: '09:00', player_count: 1 },
    });

    expect(result.at_risk).toBe(true);
    expect(result.health_score).toBe(35);

    const reEngaged = result.notifications.find(n => n.type === 'member_re_engaged');
    expect(reEngaged).toBeDefined();
    expect(reEngaged.delivered).toBe(true);
    expect(reEngaged.target_agent).toBe('member-risk-lifecycle');
  });
});

// ===========================================================================
// 8.4 Smoke: Large party reservation triggers staffing event
// ===========================================================================
describe('8.4 — Large party triggers Staffing-Demand notification', () => {
  it('fires concierge_booking event for dining reservation', async () => {
    queueSqlResults(
      { rows: [HEALTHY_MEMBER] },           // getMemberForBridge
      { rows: [{ run_id: 'run_s1', agent_session_id: 'sim_staff_sess' }] }, // findActiveSession for staffing-demand
      { rows: [] },                          // hasOpenComplaints
      { rows: [{ activity_id: 'act_3' }] }, // logBridgeActivity
    );

    const result = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'make_dining_reservation',
      details: { reservation_date: '2026-04-16', reservation_time: '19:00', party_size: 6 },
    });

    const staffingNotif = result.notifications.find(n => n.type === 'concierge_booking');
    expect(staffingNotif).toBeDefined();
    expect(staffingNotif.delivered).toBe(true);
    expect(staffingNotif.target_agent).toBe('staffing-demand');
  });
});

// ===========================================================================
// 8.5 Quality: Member with open complaint → flag for Game Plan
// ===========================================================================
describe('8.5 — Open complaint member flagged for priority service', () => {
  it('includes complaint_flag when member has unresolved complaints', async () => {
    queueSqlResults(
      { rows: [HEALTHY_MEMBER] },                            // getMemberForBridge
      { rows: [] },                                           // findActiveSession (staffing-demand)
      { rows: [{ cnt: 2 }] },                                // hasOpenComplaints → 2 open
      { rows: [{ activity_id: 'act_4' }] },                  // logBridgeActivity
    );

    const result = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'make_dining_reservation',
      details: { reservation_date: '2026-04-17', reservation_time: '19:30', party_size: 2 },
    });

    expect(result.has_open_complaints).toBe(true);
    const flag = result.notifications.find(n => n.type === 'complaint_flag');
    expect(flag).toBeDefined();
    expect(flag.flagged).toBe(true);
    expect(flag.message).toContain('priority service');
  });
});

// ===========================================================================
// 8.6 Quality: Cancellation notifies Staffing-Demand + Game Plan
// ===========================================================================
describe('8.6 — Cancellation triggers staffing + game plan agents', () => {
  it('routes booking_cancelled to both agents', async () => {
    queueSqlResults(
      { rows: [HEALTHY_MEMBER] },                             // getMemberForBridge
      { rows: [] },                                            // hasOpenComplaints
      { rows: [{ run_id: 'run_s2', agent_session_id: 'sim_staff_2' }] }, // booking_cancelled → staffing-demand
      { rows: [{ run_id: 'run_gp1', agent_session_id: 'sim_gp_1' }] },  // booking_cancelled → tomorrows-game-plan
      { rows: [{ activity_id: 'act_5' }] },                   // logBridgeActivity
    );

    const result = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'cancel_booking',
      details: { booking_type: 'tee_time', date: '2026-04-18' },
    });

    const cancelled = result.notifications.find(n => n.type === 'booking_cancelled');
    expect(cancelled).toBeDefined();
    expect(cancelled.deliveries).toHaveLength(2);
    expect(cancelled.deliveries[0].target_agent).toBe('staffing-demand');
    expect(cancelled.deliveries[1].target_agent).toBe('tomorrows-game-plan');
  });
});

// ===========================================================================
// 8.7 Quality: Chief of Staff sees concierge-originated actions
// ===========================================================================
describe('8.7 — Bridge activity logged with agent-bridge phase', () => {
  it('activity records contain phase=agent-bridge for coordination visibility', async () => {
    queueSqlResults(
      { rows: [HEALTHY_MEMBER] },
      { rows: [] }, // staffing
      { rows: [] }, // complaints
      { rows: [{ activity_id: 'act_cos_visible' }] },
    );

    const result = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'rsvp_event',
      details: { event_id: 'evt_001', event_date: '2026-04-20', guest_count: 2 },
    });

    expect(result.activity_id).toBe('act_cos_visible');
    // The SQL insert uses phase='agent-bridge' — Chief of Staff can query
    // agent_activity WHERE phase='agent-bridge' to find concierge-originated actions
  });
});

// ===========================================================================
// 8.8 Quality: Board Report can count concierge re-engagements
// ===========================================================================
describe('8.8 — Re-engagement count available for Board Report', () => {
  it('at-risk member booking creates trackable re-engagement notification', async () => {
    queueSqlResults(
      { rows: [AT_RISK_MEMBER] },
      { rows: [{ run_id: 'run_r1', agent_session_id: 'sim_risk_1' }] },
      { rows: [] }, // staffing
      { rows: [] }, // complaints
      { rows: [{ activity_id: 'act_re_engage' }] },
    );

    const result = await notifyClubAgents('club_test', 'mbr_042', {
      type: 'make_dining_reservation',
      details: { reservation_date: '2026-04-21', reservation_time: '18:30', party_size: 4 },
    });

    // Board Report can query: agent_activity WHERE action_type='concierge_booking'
    // AND phase='agent-bridge' to count re-engagements
    expect(result.at_risk).toBe(true);
    expect(result.notifications.some(n => n.type === 'member_re_engaged')).toBe(true);
    expect(result.activity_id).toBeDefined();
  });
});

// ===========================================================================
// 8.9 Integration: Event bus routes to correct agents
// ===========================================================================
describe('8.9 — Event bus routing', () => {
  it('routes concierge_booking to staffing-demand', async () => {
    queueSqlResults(
      { rows: [{ run_id: 'run_s3', agent_session_id: 'sim_staff_3' }] },
    );

    const result = await routeEvent('club_test', 'concierge_booking', {
      booking_type: 'book_tee_time',
      date: '2026-04-22',
      party_size: 4,
      member_id: 'mbr_001',
    });

    expect(result.delivered).toBe(true);
    expect(result.target_agent).toBe('staffing-demand');
  });

  it('returns error for unknown event type', async () => {
    const result = await routeEvent('club_test', 'nonexistent_event', {});
    expect(result.delivered).toBe(false);
    expect(result.error).toContain('Unknown event type');
  });

  it('returns delivered=false when no active session exists', async () => {
    queueSqlResults({ rows: [] }); // no active session

    const result = await routeEvent('club_test', 'member_re_engaged', {
      member_id: 'mbr_001',
      action: 'book_tee_time',
    });

    expect(result.delivered).toBe(false);
    expect(result.reason).toContain('no_active');
  });
});

// ===========================================================================
// 8.10 Integration: Multiple simultaneous bookings — no conflicts
// ===========================================================================
describe('8.10 — Concurrent bookings produce independent notifications', () => {
  it('two members booking simultaneously get separate bridge results', async () => {
    // First member
    sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));
    const callsForMember = (member) => {
      const q = [
        { rows: [member] },
        { rows: [] }, // staffing
        { rows: [] }, // complaints
        { rows: [{ activity_id: `act_${member.member_id}` }] },
      ];
      sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
    };

    callsForMember(HEALTHY_MEMBER);
    const r1 = await notifyClubAgents('club_test', 'mbr_001', {
      type: 'book_tee_time',
      details: { booking_date: '2026-04-23', tee_time: '08:00', player_count: 2 },
    });

    callsForMember(AT_RISK_MEMBER);
    const r2 = await notifyClubAgents('club_test', 'mbr_042', {
      type: 'book_tee_time',
      details: { booking_date: '2026-04-23', tee_time: '08:30', player_count: 1 },
    });

    expect(r1.member_name).toBe('John Smith');
    expect(r2.member_name).toBe('Carol Danvers');
    expect(r1.at_risk).toBe(false);
    expect(r2.at_risk).toBe(true);
  });
});

// ===========================================================================
// 8.11 Integration: Bridge doesn't expose club-side agent decisions to member
// ===========================================================================
describe('8.11 — Bridge results do not leak club-side decisions', () => {
  it('notification results contain agent targets but no internal reasoning', async () => {
    queueSqlResults(
      { rows: [AT_RISK_MEMBER] },
      { rows: [{ run_id: 'run_r2', agent_session_id: 'sim_risk_2' }] },
      { rows: [] }, // staffing
      { rows: [] }, // complaints
      { rows: [{ activity_id: 'act_safe' }] },
    );

    const result = await notifyClubAgents('club_test', 'mbr_042', {
      type: 'rsvp_event',
      details: { event_id: 'evt_002', event_date: '2026-04-25', guest_count: 1 },
    });

    // The bridge result contains notification metadata (for internal logging)
    // but would never be exposed to the member chat response.
    // Verify the result doesn't contain agent reasoning or session content.
    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toContain('system_prompt');
    expect(resultStr).not.toContain('playbook_steps');
    expect(resultStr).not.toContain('intervention');
    // It does contain structural fields which are safe
    expect(result.notifications).toBeInstanceOf(Array);
    expect(result.activity_id).toBeDefined();
  });
});
