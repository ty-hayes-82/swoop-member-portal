import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPriorityItems, getSinceLastLogin } from './cockpitService';

// Wave 2 (SHIP_PLAN §2.1) mock + _init coverage.
const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshCockpit() {
  vi.resetModules();
  return import('./cockpitService');
}

describe('cockpitService', () => {
  it('returns priority items with required fields', () => {
    const items = getPriorityItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    items.forEach((item) => {
      expect(item.headline).toBeTruthy();
      expect(item.urgency).toBeTruthy();
      expect(['urgent', 'high', 'warning', 'neutral', 'insight']).toContain(item.urgency);
    });
  });

  it('returns since-last-login summary with numeric counts', () => {
    const summary = getSinceLastLogin();
    expect(summary).toBeTruthy();
    expect(Number.isFinite(summary.newAlerts)).toBe(true);
    expect(Number.isFinite(summary.membersChanged)).toBe(true);
  });
});

describe('cockpitService — _init + mock contract', () => {
  beforeEach(() => { apiFetchMock.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('_init() fetches /api/cockpit and the cached payload feeds getPriorityItems()', async () => {
    const payload = {
      priorities: [{ id: 'p1', headline: 'API priority', urgency: 'urgent' }],
      sinceLastLogin: [{ label: 'New complaints', value: 3 }],
    };
    apiFetchMock.mockResolvedValueOnce(payload);

    const svc = await freshCockpit();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/cockpit');
    expect(svc.getPriorityItems()).toStrictEqual(payload.priorities);
    expect(svc.getSinceLastLogin()).toStrictEqual(payload.sinceLastLogin);
  });

  it('getPriorityItems() pre-_init returns the static fallback (demo mode default)', async () => {
    const svc = await freshCockpit();
    const items = svc.getPriorityItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('_init() swallows apiFetch rejection and leaves service usable', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshCockpit();
    await expect(svc._init()).resolves.toBeUndefined();

    // Static demo fallback still delivered.
    expect(svc.getPriorityItems().length).toBeGreaterThan(0);
  });
});
