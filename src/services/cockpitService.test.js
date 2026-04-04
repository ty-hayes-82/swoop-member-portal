import { describe, expect, it } from 'vitest';
import { getPriorityItems, getSinceLastLogin } from './cockpitService';

describe('cockpitService', () => {
  it('returns priority items with required fields', () => {
    const items = getPriorityItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    items.forEach((item) => {
      expect(item.headline).toBeTruthy();
      expect(item.urgency).toBeTruthy();
      expect(['urgent', 'warning', 'neutral', 'insight']).toContain(item.urgency);
    });
  });

  it('returns since-last-login summary with numeric counts', () => {
    const summary = getSinceLastLogin();
    expect(summary).toBeTruthy();
    expect(Number.isFinite(summary.newAlerts)).toBe(true);
    expect(Number.isFinite(summary.membersChanged)).toBe(true);
  });
});
