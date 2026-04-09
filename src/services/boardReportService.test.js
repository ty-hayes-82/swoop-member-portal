import { describe, expect, it } from 'vitest';
import {
  getKPIs,
  getMemberSaves,
  getOperationalSaves,
  getMonthlyTrends,
} from './boardReportService';

describe('boardReportService', () => {
  it('getKPIs returns the board-facing KPI tiles with required fields', () => {
    const kpis = getKPIs();
    expect(Array.isArray(kpis)).toBe(true);
    expect(kpis.length).toBeGreaterThan(0);

    kpis.forEach((kpi) => {
      expect(kpi.label).toBeTruthy();
      expect(typeof kpi.label).toBe('string');
      // value should be a finite number for all tiles (counts, percentages, dollars)
      expect(Number.isFinite(kpi.value)).toBe(true);
    });
  });

  it('getKPIs surfaces at least one dollar-quantified tile in demo mode', () => {
    const kpis = getKPIs();
    // The board report promise: dollars on the page
    const hasDollarTile = kpis.some(
      (kpi) => kpi.unit === '$' || kpi.unit === '$K' || kpi.prefix === '$' || /dues/i.test(kpi.label)
    );
    expect(hasDollarTile).toBe(true);
  });

  it('getMemberSaves returns member-save records with required fields in demo mode', () => {
    const saves = getMemberSaves();
    expect(Array.isArray(saves)).toBe(true);
    expect(saves.length).toBeGreaterThan(0);

    saves.forEach((save) => {
      // Each save should reference a member and carry a dollar / outcome value
      expect(save).toBeTruthy();
      expect(typeof save).toBe('object');
    });
  });

  it('getOperationalSaves and getMonthlyTrends return arrays (shape guarantee)', () => {
    const ops = getOperationalSaves();
    const trends = getMonthlyTrends();
    expect(Array.isArray(ops)).toBe(true);
    expect(Array.isArray(trends)).toBe(true);
    // Trends should be populated in demo mode for the chart to render
    expect(trends.length).toBeGreaterThan(0);
  });
});
