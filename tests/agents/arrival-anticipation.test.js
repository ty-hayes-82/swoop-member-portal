/**
 * Arrival Anticipation Engine — tests for arrival-trigger, staff-briefs, and cron scan.
 *
 * Tests the logic in api/agents/arrival-trigger.js, api/agents/staff-briefs.js,
 * and api/cron/arrival-scan.js.
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

function makeReq(body = {}, method = 'POST', query = {}, auth = { clubId: 'club_test', role: 'gm' }) {
  return { method, headers: { authorization: 'Bearer test_token' }, query, body, auth };
}

function makeRes() {
  const res = { _status: null, _json: null, status(code) { res._status = code; return res; }, json(data) { res._json = data; return res; } };
  return res;
}

function queueSqlResults(...results) {
  const q = [...results];
  sqlMock.mockImplementation(() => Promise.resolve(q.shift() ?? { rows: [] }));
}

function makeMemberRow(overrides = {}) {
  return {
    member_id: 'mbr_100',
    first_name: 'James',
    last_name: 'Whitfield',
    health_score: 72,
    annual_dues: 18000,
    archetype: 'Social Golfer',
    ...overrides,
  };
}

function makePreferencesRow(overrides = {}) {
  return {
    member_id: 'mbr_100',
    preferred_drink: 'Arnold Palmer',
    dietary_restrictions: 'None',
    cart_preference: 'riding',
    favorite_course: 'Championship',
    locker_number: 'A-42',
    ...overrides,
  };
}

function makePosHistoryRows() {
  return [
    { outlet: 'pro_shop', item: 'Titleist Pro V1', amount: 54.99, date: '2026-04-01' },
    { outlet: 'grill_room', item: 'Club Sandwich + Arnold Palmer', amount: 24.50, date: '2026-04-05' },
    { outlet: 'beverage_cart', item: 'Bottled Water x2', amount: 8.00, date: '2026-04-08' },
  ];
}

function makeComplaintRow(overrides = {}) {
  return {
    complaint_id: 'cmp_200',
    member_id: 'mbr_100',
    category: 'Pace of Play',
    status: 'open',
    created_at: '2026-04-09T10:00:00Z',
    description: 'Waited 25 minutes on hole 7',
    ...overrides,
  };
}

function makeBriefRow(role, overrides = {}) {
  return {
    brief_id: `brief_${role}_001`,
    member_id: 'mbr_100',
    club_id: 'club_test',
    role,
    tee_time: '2026-04-11T09:30:00Z',
    brief_text: `Prepared brief for ${role}`,
    created_at: '2026-04-11T07:00:00Z',
    read_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

let arrivalTriggerHandler;
let staffBriefsHandler;
let arrivalScanHandler;

beforeEach(async () => {
  vi.resetModules();
  sqlMock.mockReset();
  sqlMock.mockImplementation(() => Promise.resolve({ rows: [] }));

  const triggerMod = await import('../../api/agents/arrival-trigger.js');
  arrivalTriggerHandler = triggerMod.default;

  const briefsMod = await import('../../api/agents/staff-briefs.js');
  staffBriefsHandler = briefsMod.default;

  const scanMod = await import('../../api/cron/arrival-scan.js');
  arrivalScanHandler = scanMod.default;
});

// ===========================================================================
// 1. TRIGGER GENERATES 3 BRIEFS
// ===========================================================================

describe('Arrival Trigger', () => {
  it('1. generates pro_shop, grill_room, beverage_cart briefs', async () => {
    queueSqlResults(
      { rows: [makeMemberRow()] },               // member lookup
      { rows: [makePreferencesRow()] },           // preferences
      { rows: makePosHistoryRows() },             // POS history
      { rows: [] },                               // open complaints (none)
      { rows: [] },                               // existing briefs check (none)
      { rows: [makeBriefRow('pro_shop')] },       // INSERT pro_shop brief
      { rows: [makeBriefRow('grill_room')] },     // INSERT grill_room brief
      { rows: [makeBriefRow('beverage_cart')] },  // INSERT beverage_cart brief
    );
    const res = makeRes();
    await arrivalTriggerHandler(
      makeReq({ member_id: 'mbr_100', tee_time: '2026-04-11T09:30:00Z' }),
      res,
    );
    expect(res._status).toBe(200);
    expect(res._json.briefs).toHaveLength(3);
    const roles = res._json.briefs.map(b => b.role).sort();
    expect(roles).toEqual(['beverage_cart', 'grill_room', 'pro_shop']);
  });

  // ===========================================================================
  // 2. COMPLAINT WARNING
  // ===========================================================================

  it('2. includes complaint warning prefix in grill_room brief', async () => {
    queueSqlResults(
      { rows: [makeMemberRow()] },
      { rows: [makePreferencesRow()] },
      { rows: makePosHistoryRows() },
      { rows: [makeComplaintRow()] },             // open complaint
      { rows: [] },                               // no existing briefs
      { rows: [makeBriefRow('pro_shop')] },
      { rows: [makeBriefRow('grill_room', { brief_text: '\u26a0\ufe0f Open complaint: Pace of Play — Prepared brief for grill_room' })] },
      { rows: [makeBriefRow('beverage_cart')] },
    );
    const res = makeRes();
    await arrivalTriggerHandler(
      makeReq({ member_id: 'mbr_100', tee_time: '2026-04-11T09:30:00Z' }),
      res,
    );
    expect(res._status).toBe(200);
    const grillBrief = res._json.briefs.find(b => b.role === 'grill_room');
    expect(grillBrief.brief_text).toContain('\u26a0\ufe0f');
  });

  // ===========================================================================
  // 3. IDEMPOTENCY
  // ===========================================================================

  it('3. returns existing briefs without regenerating (idempotent)', async () => {
    const existingBriefs = [
      makeBriefRow('pro_shop'),
      makeBriefRow('grill_room'),
      makeBriefRow('beverage_cart'),
    ];
    queueSqlResults(
      { rows: [makeMemberRow()] },
      { rows: [makePreferencesRow()] },
      { rows: makePosHistoryRows() },
      { rows: [] },                               // complaints
      { rows: existingBriefs },                    // existing briefs found
    );
    const res = makeRes();
    await arrivalTriggerHandler(
      makeReq({ member_id: 'mbr_100', tee_time: '2026-04-11T09:30:00Z' }),
      res,
    );
    expect(res._status).toBe(200);
    expect(res._json.existing).toBe(true);
    expect(res._json.briefs).toHaveLength(3);
    // Should NOT have called any INSERT (only 5 queries consumed, not 8)
    expect(sqlMock).toHaveBeenCalledTimes(5);
  });

  // ===========================================================================
  // 4. MISSING PREFERENCES
  // ===========================================================================

  it('4. generates briefs with "No data available" when preferences missing', async () => {
    queueSqlResults(
      { rows: [makeMemberRow()] },
      { rows: [] },                               // no preferences
      { rows: [] },                               // no POS history
      { rows: [] },                               // no complaints
      { rows: [] },                               // no existing briefs
      { rows: [makeBriefRow('pro_shop', { brief_text: 'No data available — first-time visitor profile' })] },
      { rows: [makeBriefRow('grill_room', { brief_text: 'No data available — first-time visitor profile' })] },
      { rows: [makeBriefRow('beverage_cart', { brief_text: 'No data available — first-time visitor profile' })] },
    );
    const res = makeRes();
    await arrivalTriggerHandler(
      makeReq({ member_id: 'mbr_100', tee_time: '2026-04-11T09:30:00Z' }),
      res,
    );
    expect(res._status).toBe(200);
    expect(res._json.briefs).toHaveLength(3);
    for (const brief of res._json.briefs) {
      expect(brief.brief_text).toContain('No data available');
    }
  });
});

// ===========================================================================
// 5. STAFF BRIEFS GET BY ROLE
// ===========================================================================

describe('Staff Briefs API', () => {
  it('5. GET with role=pro_shop returns matching briefs', async () => {
    const proBriefs = [
      makeBriefRow('pro_shop', { brief_id: 'brief_ps_001', member_id: 'mbr_100' }),
      makeBriefRow('pro_shop', { brief_id: 'brief_ps_002', member_id: 'mbr_101' }),
      makeBriefRow('pro_shop', { brief_id: 'brief_ps_003', member_id: 'mbr_102' }),
    ];
    queueSqlResults(
      { rows: proBriefs },                        // SELECT by role + date
      { rows: [] },                               // UPDATE read_at
    );
    const res = makeRes();
    await staffBriefsHandler(
      makeReq({}, 'GET', { role: 'pro_shop', date: 'today' }),
      res,
    );
    expect(res._status).toBe(200);
    expect(res._json.briefs).toHaveLength(3);
    expect(res._json.briefs.every(b => b.role === 'pro_shop')).toBe(true);
  });

  // ===========================================================================
  // 6. MARKS AS READ
  // ===========================================================================

  it('6. GET marks returned briefs as read (sets read_at)', async () => {
    const briefs = [
      makeBriefRow('pro_shop', { brief_id: 'brief_ps_001', read_at: null }),
    ];
    queueSqlResults(
      { rows: briefs },
      { rows: [] },                               // UPDATE read_at
    );
    const res = makeRes();
    await staffBriefsHandler(
      makeReq({}, 'GET', { role: 'pro_shop', date: 'today' }),
      res,
    );
    expect(res._status).toBe(200);
    // The UPDATE query should have been called (2 total queries: SELECT + UPDATE)
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================
// 7. CRON SCAN — UPCOMING TEE TIMES
// ===========================================================================

describe('Arrival Scan Cron', () => {
  it('7. finds 2 bookings in 80-100 min window and triggers briefs', async () => {
    const now = new Date();
    const in90min = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
    const in85min = new Date(now.getTime() + 85 * 60 * 1000).toISOString();

    process.env.CRON_SECRET = 'test_secret';
    queueSqlResults(
      // Bookings in window
      { rows: [
        { member_id: 'mbr_200', tee_time: in90min, club_id: 'club_test' },
        { member_id: 'mbr_201', tee_time: in85min, club_id: 'club_test' },
      ] },
      // No existing briefs for mbr_200
      { rows: [] },
      // Member data for mbr_200
      { rows: [makeMemberRow({ member_id: 'mbr_200' })] },
      { rows: [makePreferencesRow({ member_id: 'mbr_200' })] },
      { rows: [] }, // POS
      { rows: [] }, // complaints
      { rows: [] }, // existing briefs
      { rows: [makeBriefRow('pro_shop')] },
      { rows: [makeBriefRow('grill_room')] },
      { rows: [makeBriefRow('beverage_cart')] },
      // No existing briefs for mbr_201
      { rows: [] },
      // Member data for mbr_201
      { rows: [makeMemberRow({ member_id: 'mbr_201' })] },
      { rows: [makePreferencesRow({ member_id: 'mbr_201' })] },
      { rows: [] }, // POS
      { rows: [] }, // complaints
      { rows: [] }, // existing briefs
      { rows: [makeBriefRow('pro_shop')] },
      { rows: [makeBriefRow('grill_room')] },
      { rows: [makeBriefRow('beverage_cart')] },
    );
    const req = { method: 'GET', headers: { authorization: 'Bearer test_secret' } };
    const res = makeRes();
    await arrivalScanHandler(req, res);
    expect(res._json.scanned).toBe(2);
    expect(res._json.briefsGenerated).toBe(2);
    delete process.env.CRON_SECRET;
  });

  // ===========================================================================
  // 8. CRON SCAN — SKIPS EXISTING
  // ===========================================================================

  it('8. skips bookings that already have briefs', async () => {
    const now = new Date();
    const in90min = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
    const in85min = new Date(now.getTime() + 85 * 60 * 1000).toISOString();

    process.env.CRON_SECRET = 'test_secret';
    queueSqlResults(
      // Bookings in window
      { rows: [
        { member_id: 'mbr_300', tee_time: in90min, club_id: 'club_test' },
        { member_id: 'mbr_301', tee_time: in85min, club_id: 'club_test' },
      ] },
      // mbr_300 already has briefs
      { rows: [makeBriefRow('pro_shop'), makeBriefRow('grill_room'), makeBriefRow('beverage_cart')] },
      // mbr_301 has no briefs
      { rows: [] },
      // Member data for mbr_301
      { rows: [makeMemberRow({ member_id: 'mbr_301' })] },
      { rows: [makePreferencesRow({ member_id: 'mbr_301' })] },
      { rows: [] }, // POS
      { rows: [] }, // complaints
      { rows: [] }, // existing briefs
      { rows: [makeBriefRow('pro_shop')] },
      { rows: [makeBriefRow('grill_room')] },
      { rows: [makeBriefRow('beverage_cart')] },
    );
    const req = { method: 'GET', headers: { authorization: 'Bearer test_secret' } };
    const res = makeRes();
    await arrivalScanHandler(req, res);
    expect(res._json.scanned).toBe(2);
    expect(res._json.briefsGenerated).toBe(1);
    delete process.env.CRON_SECRET;
  });

  // ===========================================================================
  // 9. CRON REJECTS UNAUTHORIZED
  // ===========================================================================

  it('9. rejects request without CRON_SECRET', async () => {
    delete process.env.CRON_SECRET;
    const req = { method: 'GET', headers: {} };
    const res = makeRes();
    await arrivalScanHandler(req, res);
    expect(res._status).toBe(401);
  });
});

// ===========================================================================
// 10. BRIEF TEXT WORD LIMIT
// ===========================================================================

describe('Brief Quality', () => {
  it('10. each role brief is under 100 words', async () => {
    const longButValid = Array(95).fill('word').join(' ');
    queueSqlResults(
      { rows: [makeMemberRow()] },
      { rows: [makePreferencesRow()] },
      { rows: makePosHistoryRows() },
      { rows: [] },                               // no complaints
      { rows: [] },                               // no existing briefs
      { rows: [makeBriefRow('pro_shop', { brief_text: longButValid })] },
      { rows: [makeBriefRow('grill_room', { brief_text: longButValid })] },
      { rows: [makeBriefRow('beverage_cart', { brief_text: longButValid })] },
    );
    const res = makeRes();
    await arrivalTriggerHandler(
      makeReq({ member_id: 'mbr_100', tee_time: '2026-04-11T09:30:00Z' }),
      res,
    );
    expect(res._status).toBe(200);
    for (const brief of res._json.briefs) {
      const wordCount = brief.brief_text.trim().split(/\s+/).length;
      expect(wordCount).toBeLessThan(100);
    }
  });
});
