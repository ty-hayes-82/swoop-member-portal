import { describe, expect, it } from 'vitest';
import { getDailyBriefing } from './briefingService';

describe('briefingService', () => {
  it('returns a daily briefing with required sections', () => {
    const briefing = getDailyBriefing();

    expect(briefing).toBeTruthy();

    // Must have yesterday recap
    expect(briefing.yesterdayRecap).toBeTruthy();
    expect(Number.isFinite(briefing.yesterdayRecap.revenue)).toBe(true);
    expect(Number.isFinite(briefing.yesterdayRecap.rounds)).toBe(true);

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
