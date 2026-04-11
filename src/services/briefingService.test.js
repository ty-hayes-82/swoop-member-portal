import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDailyBriefing } from './briefingService';

// Wave 2 (SHIP_PLAN §2.1): _init + apiFetch mock coverage.
const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));
vi.mock('./demoGate', () => ({
  getDataMode: () => 'demo',
  isGateOpen: () => true,
  isGuidedMode: () => false,
}));

async function freshBriefing() {
  vi.resetModules();
  return import('./briefingService');
}

describe('briefingService', () => {
  it('returns a daily briefing with required sections', () => {
    const briefing = getDailyBriefing();

    expect(briefing).toBeTruthy();

    // Must have yesterday recap
    expect(briefing.yesterdayRecap).toBeTruthy();
    expect(Number.isFinite(briefing.yesterdayRecap.revenue)).toBe(true);
    // rounds is null until computed from real tee sheet data
    expect(briefing.yesterdayRecap.rounds === null || Number.isFinite(briefing.yesterdayRecap.rounds)).toBe(true);

    // Must have today risks
    expect(briefing.todayRisks).toBeTruthy();
    expect(typeof briefing.todayRisks.weather).toBe('string');

    // Must have key metrics
    expect(briefing.keyMetrics).toBeTruthy();
    expect(Number.isFinite(briefing.keyMetrics.atRiskMembers)).toBe(true);
    expect(Number.isFinite(briefing.keyMetrics.openComplaints)).toBe(true);
  });

  it('returns a non-empty pending actions list', () => {
    const briefing = getDailyBriefing();
    expect(Array.isArray(briefing.pendingActions)).toBe(true);
    expect(briefing.pendingActions.length).toBeGreaterThan(0);

    // Each action should have required fields
    briefing.pendingActions.forEach((action) => {
      expect(action.title).toBeTruthy();
      expect(action.status).toBeTruthy();
    });
  });
});

describe('briefingService — _init + mock contract', () => {
  beforeEach(() => { apiFetchMock.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('_init() fetches /api/briefing and the cached payload shortcuts getDailyBriefing()', async () => {
    const payload = {
      keyMetrics: { atRiskMembers: 3, openComplaints: 1 },
      todayRisks: { atRiskTeetimes: [] },
      yesterdayRecap: null,
      comparisons: {},
      topCancellationRiskMembers: [],
      marker: 'from-api',
    };
    apiFetchMock.mockResolvedValueOnce(payload);

    const svc = await freshBriefing();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/briefing');
    expect(svc.getDailyBriefing()).toBe(payload);
  });

  it('getDailyBriefing() pre-_init returns the demo briefing (not null, does not throw)', async () => {
    const svc = await freshBriefing();
    const briefing = svc.getDailyBriefing();
    expect(briefing).not.toBeNull();
    expect(briefing.todayRisks).toBeDefined();
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('_init() swallows apiFetch rejection and leaves service usable (static fallback)', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshBriefing();
    await expect(svc._init()).resolves.toBeUndefined();

    const briefing = svc.getDailyBriefing();
    expect(briefing).not.toBeNull();
    expect(briefing.todayRisks).toBeDefined();
  });
});
