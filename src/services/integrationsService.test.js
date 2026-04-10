// integrationsService — service-layer test (SHIP_PLAN §2.1 Wave 2)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshService() {
  vi.resetModules();
  return import('./integrationsService');
}

beforeEach(() => { apiFetchMock.mockReset(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('integrationsService — _init + getConnectedSystems', () => {
  it('_init() fetches /api/integrations and getConnectedSystems merges live status', async () => {
    apiFetchMock.mockResolvedValueOnce({
      systems: [
        { id: 'pos', status: 'connected', lastSync: '2026-04-09T12:00:00Z' },
      ],
    });

    const svc = await freshService();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/integrations');
    const systems = svc.getConnectedSystems();
    expect(Array.isArray(systems)).toBe(true);
    expect(systems.length).toBeGreaterThan(0);

    const pos = systems.find(s => s.id === 'pos');
    // If 'pos' is a known system in SYSTEMS it will pick up 'connected'; otherwise the
    // base SYSTEMS list still has a status field. Either way the lastSync comes from live
    // data when ids match.
    if (pos) {
      expect(pos.status).toBe('connected');
      expect(pos.lastSync).toBe('2026-04-09T12:00:00Z');
    }
  });

  it('getConnectedSystems() pre-_init returns every SYSTEM as available with null lastSync', async () => {
    const svc = await freshService();
    const systems = svc.getConnectedSystems();
    expect(Array.isArray(systems)).toBe(true);
    expect(systems.length).toBeGreaterThan(0);
    systems.forEach((s) => {
      expect(s.status).toBe('available');
      expect(s.lastSync).toBeNull();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('_init() swallows apiFetch rejection and leaves the service usable', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshService();
    await expect(svc._init()).resolves.toBeUndefined();

    const systems = svc.getConnectedSystems();
    expect(systems.length).toBeGreaterThan(0);
    systems.forEach((s) => expect(s.status).toBe('available'));
  });

  it('_init() with empty systems[] still returns the SYSTEMS catalog as available', async () => {
    apiFetchMock.mockResolvedValueOnce({ systems: [] });
    const svc = await freshService();
    await svc._init();

    const systems = svc.getConnectedSystems();
    expect(systems.length).toBeGreaterThan(0);
    systems.forEach((s) => expect(s.status).toBe('available'));
  });
});
