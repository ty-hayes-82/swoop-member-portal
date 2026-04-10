// operationsService — service-layer test (SHIP_PLAN §2.1 Wave 2)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshService() {
  vi.resetModules();
  return import('./operationsService');
}

beforeEach(() => { apiFetchMock.mockReset(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('operationsService — _init + getter contract', () => {
  it('_init() fetches /api/operations and hydrates revenue + tee sheet caches', async () => {
    const payload = {
      revenueByDay: [{ date: '2026-04-09', golf: 6000, fb: 2000 }],
      monthlySummary: { total: 180000, golfTotal: 120000, fbTotal: 60000, dailyAvg: 6000, weekendAvg: 9000, weekdayAvg: 5000 },
      slowRoundStats: { totalRounds: 1000, slowRounds: 300, overallRate: 0.3, weekendRate: 0.4, weekdayRate: 0.22, threshold: 270 },
      bottleneckHoles: [{ hole: 12, course: 'Championship', avgDelay: 10, roundsAffected: 200 }],
      paceFBImpact: {
        fastConversionRate: 0.45, slowConversionRate: 0.2,
        avgCheckFast: 36, avgCheckSlow: 28,
        slowRoundsPerMonth: 300, revenueLostPerMonth: 4800,
      },
      todayTeeSheet: [{ time: '8:00 AM', players: 4 }],
      teeSheetSummary: { totalRounds: 210, weatherTemp: 72, weatherCondition: 'sunny' },
    };
    apiFetchMock.mockResolvedValueOnce(payload);

    const svc = await freshService();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/operations');
    expect(svc.getRevenueByDay()).toBe(payload.revenueByDay);
    expect(svc.getMonthlyRevenueSummary()).toBe(payload.monthlySummary);
    expect(svc.getTodayTeeSheet()).toBe(payload.todayTeeSheet);
    expect(svc.getTeeSheetSummary()).toBe(payload.teeSheetSummary);
  });

  it('getSlowRoundRate() after _init normalizes rates to [0,1] and rounds counts', async () => {
    apiFetchMock.mockResolvedValueOnce({
      slowRoundStats: { totalRounds: 1500.7, slowRounds: 450.4, overallRate: 0.3, weekendRate: 0.42, weekdayRate: 0.21, threshold: 270 },
    });

    const svc = await freshService();
    await svc._init();

    const stats = svc.getSlowRoundRate();
    expect(stats.totalRounds).toBe(1501);
    expect(stats.slowRounds).toBe(450);
    expect(stats.overallRate).toBeGreaterThanOrEqual(0);
    expect(stats.overallRate).toBeLessThanOrEqual(1);
    expect(stats.weekendRate).toBeCloseTo(0.42);
  });

  it('getters pre-_init return the static demo fallback (does not throw)', async () => {
    const svc = await freshService();

    // Demo mode default — shouldUseStatic('fb') / ('pace') / ('tee-sheet') all true.
    expect(Array.isArray(svc.getRevenueByDay())).toBe(true);
    expect(svc.getRevenueByDay().length).toBeGreaterThan(0);

    const paceFB = svc.getPaceFBImpact();
    expect(Number.isFinite(paceFB.fastConversionRate)).toBe(true);
    expect(paceFB.slowRoundsPerMonth).toBeGreaterThan(0);

    expect(Array.isArray(svc.getBottleneckHoles())).toBe(true);
    expect(svc.getBottleneckHoles().length).toBeGreaterThan(0);

    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('_init() swallows apiFetch rejection and leaves service usable', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshService();
    await expect(svc._init()).resolves.toBeUndefined();

    // Static fallback still delivered.
    expect(svc.getRevenueByDay().length).toBeGreaterThan(0);
    expect(svc.getBottleneckHoles().length).toBeGreaterThan(0);
  });
});
