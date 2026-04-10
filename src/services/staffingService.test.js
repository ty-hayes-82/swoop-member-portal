import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Wave 2 (SHIP_PLAN §2.1) — mock apiClient for _init() tests.
const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshStaffing() {
  vi.resetModules();
  return import('./staffingService');
}

import {
  getUnderstaffedDays,
  getShiftCoverage,
  getFeedbackSummary,
  getComplaintCorrelation,
  getStaffingSummary,
} from './staffingService';

describe('staffingService', () => {
  it('getUnderstaffedDays returns dollar-quantified days in demo mode', () => {
    const days = getUnderstaffedDays();
    expect(Array.isArray(days)).toBe(true);
    expect(days.length).toBeGreaterThan(0);

    days.forEach((day) => {
      expect(day.date).toBeTruthy();
      expect(day.outlet).toBeTruthy();
      expect(Number.isFinite(day.revenueLoss)).toBe(true);
      expect(day.revenueLoss).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(day.scheduledStaff)).toBe(true);
      expect(Number.isFinite(day.requiredStaff)).toBe(true);
    });

    // Fix-It / Prove-It promise: non-zero dollar loss shown to GM
    const totalLoss = days.reduce((sum, d) => sum + d.revenueLoss, 0);
    expect(totalLoss).toBeGreaterThan(0);
  });

  it('getStaffingSummary reconciles with getUnderstaffedDays', () => {
    const summary = getStaffingSummary();
    const days = getUnderstaffedDays();

    expect(Number.isFinite(summary.understaffedDaysCount)).toBe(true);
    expect(Number.isFinite(summary.totalRevenueLoss)).toBe(true);
    expect(Number.isFinite(summary.annualizedLoss)).toBe(true);
    expect(Number.isFinite(summary.unresolvedComplaints)).toBe(true);

    expect(summary.understaffedDaysCount).toBe(days.length);
    expect(summary.totalRevenueLoss).toBe(days.reduce((s, d) => s + d.revenueLoss, 0));
    // Annualized = monthly × 12
    expect(summary.annualizedLoss).toBe(summary.totalRevenueLoss * 12);
    expect(summary.totalRevenueLoss).toBeGreaterThan(0);
  });

  it('getComplaintCorrelation returns feedback records with sentiment bounds', () => {
    const records = getComplaintCorrelation();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThan(0);

    records.forEach((record) => {
      expect(record.date).toBeTruthy();
      expect(record.status).toBeTruthy();
      expect(record.category).toBeTruthy();
      // sentiment sanitized to [-1, 1]
      expect(record.sentiment).toBeGreaterThanOrEqual(-1);
      expect(record.sentiment).toBeLessThanOrEqual(1);
      expect(typeof record.isUnderstaffedDay).toBe('boolean');
    });
  });

  it('getFeedbackSummary and getShiftCoverage return valid array shapes', () => {
    const summary = getFeedbackSummary();
    const coverage = getShiftCoverage();

    expect(Array.isArray(summary)).toBe(true);
    expect(Array.isArray(coverage)).toBe(true);
    expect(summary.length).toBeGreaterThan(0);

    summary.forEach((row) => {
      expect(row.category).toBeTruthy();
      expect(Number.isFinite(row.count)).toBe(true);
      expect(row.count).toBeGreaterThanOrEqual(0);
      expect(row.avgSentiment).toBeGreaterThanOrEqual(-1);
      expect(row.avgSentiment).toBeLessThanOrEqual(1);
    });

    coverage.forEach((shift) => {
      expect(Number.isFinite(shift.scheduled)).toBe(true);
      expect(Number.isFinite(shift.required)).toBe(true);
      expect(Number.isFinite(shift.gap)).toBe(true);
      // gap is non-negative and equals max(0, required - scheduled) unless overridden
      expect(shift.gap).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('staffingService — _init + mock contract', () => {
  beforeEach(() => { apiFetchMock.mockReset(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('_init() fetches /api/staffing and hydrates getUnderstaffedDays()', async () => {
    apiFetchMock.mockResolvedValueOnce({
      understaffedDays: [
        { date: '2026-02-01', outlet: 'Grill Room', revenueLoss: 2100, scheduledStaff: 3, requiredStaff: 6 },
      ],
      staffingSummary: { understaffedDaysCount: 1, totalRevenueLoss: 2100, annualizedLoss: 25200, unresolvedComplaints: 4 },
    });

    const svc = await freshStaffing();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/staffing');
    const days = svc.getUnderstaffedDays();
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({ date: '2026-02-01', revenueLoss: 2100 });

    const summary = svc.getStaffingSummary();
    expect(summary.understaffedDaysCount).toBe(1);
    expect(summary.totalRevenueLoss).toBe(2100);
    expect(summary.unresolvedComplaints).toBe(4);
  });

  it('getUnderstaffedDays() pre-_init returns static demo data', async () => {
    const svc = await freshStaffing();
    const days = svc.getUnderstaffedDays();
    expect(days.length).toBeGreaterThan(0);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('_init() swallows apiFetch rejection and leaves the service usable', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshStaffing();
    await expect(svc._init()).resolves.toBeUndefined();

    // Static fallback still usable.
    expect(svc.getUnderstaffedDays().length).toBeGreaterThan(0);
    expect(svc.getStaffingSummary().totalRevenueLoss).toBeGreaterThan(0);
  });
});
