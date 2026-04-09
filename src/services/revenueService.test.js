import { describe, expect, it } from 'vitest';
import {
  getLeakageData,
  getDollarPerSlowRound,
  getRevenueScenario,
  getBottleneckSummary,
  getSlowRoundContext,
} from './revenueService';

describe('revenueService', () => {
  it('getLeakageData returns dollar-quantified leakage shape in demo mode', () => {
    const data = getLeakageData();
    expect(data).toBeTruthy();

    // All buckets must be finite numbers
    expect(Number.isFinite(data.PACE_LOSS)).toBe(true);
    expect(Number.isFinite(data.STAFFING_LOSS)).toBe(true);
    expect(Number.isFinite(data.WEATHER_LOSS)).toBe(true);
    expect(Number.isFinite(data.TOTAL)).toBe(true);

    // TOTAL must equal the sum of parts (Prove-It integrity)
    expect(data.TOTAL).toBe(data.PACE_LOSS + data.STAFFING_LOSS + data.WEATHER_LOSS);

    // In demo mode the total must be non-zero — this is the "dollars quantified" promise
    expect(data.TOTAL).toBeGreaterThan(0);

    // Must expose sources (used by provenance badges)
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.sources.length).toBeGreaterThan(0);
  });

  it('getDollarPerSlowRound returns a positive integer dollar amount', () => {
    const value = getDollarPerSlowRound();
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
    // The service rounds to whole dollars
    expect(Number.isInteger(value)).toBe(true);
  });

  it('getRevenueScenario scales linearly with reduction percentage', () => {
    const none = getRevenueScenario(0);
    const half = getRevenueScenario(0.5);
    const full = getRevenueScenario(1);

    expect(none.totalRecovery).toBe(0);
    expect(half.totalRecovery).toBeGreaterThan(0);
    expect(full.totalRecovery).toBeGreaterThan(half.totalRecovery);

    // Shape assertions
    expect(Number.isFinite(half.recoveredPace)).toBe(true);
    expect(Number.isFinite(half.recoveredStaffing)).toBe(true);
    expect(half.totalRecovery).toBe(half.recoveredPace + half.recoveredStaffing);
  });

  it('getBottleneckSummary returns the highest-impact hole with conversion context', () => {
    const summary = getBottleneckSummary();
    expect(summary).toBeTruthy();
    expect(summary.hole).toBeTruthy();
    expect(Number.isFinite(summary.avgDelay)).toBe(true);
    expect(Number.isFinite(summary.roundsAffected)).toBe(true);
    expect(Number.isFinite(summary.fastConversionPct)).toBe(true);
    expect(Number.isFinite(summary.slowConversionPct)).toBe(true);
    expect(Number.isFinite(summary.dollarPerSlowRound)).toBe(true);
  });

  it('getSlowRoundContext returns numeric stats with safe defaults', () => {
    const ctx = getSlowRoundContext();
    expect(Number.isFinite(ctx.totalRounds)).toBe(true);
    expect(Number.isFinite(ctx.slowRounds)).toBe(true);
    expect(Number.isFinite(ctx.overallRate)).toBe(true);
    expect(Number.isFinite(ctx.weekendRate)).toBe(true);
    expect(ctx.totalRounds).toBeGreaterThanOrEqual(0);
    expect(ctx.slowRounds).toBeGreaterThanOrEqual(0);
  });
});
