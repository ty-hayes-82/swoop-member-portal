import { describe, expect, it } from 'vitest';
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
