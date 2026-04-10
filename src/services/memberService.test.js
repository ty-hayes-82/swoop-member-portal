// memberService — service-layer test skeleton.
// Pattern to copy for SHIP_PLAN §2.1: briefingService, revenueService, cockpitService,
// agentService, integrationsService, apiHealthService, weatherService, operationsService, staffingService.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock apiClient so _init() never hits the real network. Each test sets the
// implementation via `apiFetchMock.mockImplementation(...)` below.
const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null, // skip the /api/dashboard-live branch in _init
}));

// Module-local `_d` persists across calls inside a single module instance, so
// we re-import the service fresh for every test via vi.resetModules().
async function freshService() {
  vi.resetModules();
  return import('./memberService');
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('memberService — _init + getter contract', () => {
  it('_init() fetches /api/members and populates the module cache', async () => {
    apiFetchMock.mockResolvedValueOnce({
      total: 42,
      atRiskMembers: [
        { memberId: 'mbr_1', name: 'Test Member', score: 25, archetype: 'Ghost', duesAnnual: 18000 },
      ],
      memberProfiles: { mbr_1: { healthScore: 25 } },
    });

    const svc = await freshService();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/members');
    expect(svc.hasRealMemberData()).toBe(true);

    // After the wave-2 fix, _init() patches BOTH .total and .totalMembers from
    // apiData.total — previously .total would have leaked the static seed (300).
    const summary = svc.getMemberSummary();
    expect(summary.totalMembers).toBe(42);
    expect(summary.total).toBe(42);
  });

  it('getAtRiskMembers() returns a normalized shape once _init populates _d', async () => {
    apiFetchMock.mockResolvedValueOnce({
      total: 1,
      atRiskMembers: [
        { id: 'mbr_9', firstName: 'Jane', lastName: 'Doe', healthScore: 33, segment: 'Declining', annualDues: 15000 },
      ],
    });

    const svc = await freshService();
    await svc._init();

    const atRisk = svc.getAtRiskMembers();
    expect(Array.isArray(atRisk)).toBe(true);
    expect(atRisk).toHaveLength(1);
    const [row] = atRisk;
    expect(row).toMatchObject({
      memberId: 'mbr_9',
      name: 'Jane Doe',
      score: 33,
      archetype: 'Declining',
      duesAnnual: 15000,
    });
    expect(typeof row.topRisk).toBe('string');
    expect(row.topRisk.length).toBeGreaterThan(0);
  });

  it('getter called before _init() returns the static demo fallback (does not throw, does not return null)', async () => {
    // No _init() call — assert current behavior: default data-mode is 'demo' so
    // isGateOpen('members') is true, and getters return the static seed.
    const svc = await freshService();

    const summary = svc.getMemberSummary();
    expect(summary).not.toBeNull();
    expect(Number.isFinite(summary.total)).toBe(true);
    expect(summary.total).toBeGreaterThan(0);

    // hasRealMemberData is still false — nothing came from the API.
    expect(svc.hasRealMemberData()).toBe(false);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('getDecayingMembers() transforms an API weeks[] array into nov/dec/jan fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      total: 1,
      decayingMembers: [
        {
          memberId: 'mbr_decay_1',
          name: 'Decay Test',
          archetype: 'Ghost',
          weeks: [
            { week: 1, openRate: 0.6 },
            { week: 2, openRate: 0.4 },
            { week: 3, openRate: 0.1 },
          ],
        },
      ],
    });

    const svc = await freshService();
    await svc._init();

    const [row] = svc.getDecayingMembers();
    expect(row.memberId).toBe('mbr_decay_1');
    expect(row.nov).toBeCloseTo(0.6);
    expect(row.dec).toBeCloseTo(0.4);
    expect(row.jan).toBeCloseTo(0.1);
    // baseline 0.6 → jan 0.1 → trend ≈ -83%, clamped to [-100, 100]
    expect(row.trend).toBeLessThan(0);
    expect(row.trend).toBeGreaterThanOrEqual(-100);
  });

  it('_init() with apiData = { total } preserves static seed summary fields (healthy/watch/atRisk/...)', async () => {
    // Bug fix: previously _init() replaced memberSummary with { total, totalMembers },
    // wiping the static seed's healthy/watch/atRisk/critical/riskCount/avgHealthScore/potentialDuesAtRisk.
    // After the fix, only .total and .totalMembers get patched — other fields survive.
    // Partial API payload: sets memberSummary but only includes `total` —
    // before the fix, the spread in _init() replaced the whole memberSummary,
    // zeroing healthy/watch/atRisk/critical/riskCount/avgHealthScore/duesAtRisk.
    apiFetchMock.mockResolvedValueOnce({ total: 50, memberSummary: { total: 50 } });

    const svc = await freshService();
    // Capture the static seed summary BEFORE _init so we have a reference value
    // that is independent of any future tweaks to src/data/members.js.
    const seedSummary = svc.getMemberSummary();
    await svc._init();

    const summary = svc.getMemberSummary();
    expect(summary.total).toBe(50);
    expect(summary.totalMembers).toBe(50);
    // These MUST NOT be zero — they should still match the static seed.
    expect(summary.healthy).toBe(seedSummary.healthy);
    expect(summary.healthy).toBeGreaterThan(0);
  });

  it('_init() swallows apiFetch rejection and leaves the service usable (static fallback)', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));

    const svc = await freshService();
    // Must not throw — callers (DataProvider) rely on this.
    await expect(svc._init()).resolves.toBeUndefined();

    // Static fallback still works for demo mode.
    const summary = svc.getMemberSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(svc.hasRealMemberData()).toBe(false);
  });
});
