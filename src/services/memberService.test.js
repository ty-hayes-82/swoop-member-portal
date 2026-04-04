import { describe, expect, it } from 'vitest';
import {
  getArchetypeProfiles,
  getHealthDistribution,
  getMemberSummary,
  getDecayingMembers,
  getAtRiskMembers,
} from './memberService';

describe('memberService integrity helpers', () => {
  it('keeps health distribution aligned to total members', () => {
    const archetypes = getArchetypeProfiles();
    const dist = getHealthDistribution();

    const totalMembers = archetypes.reduce((sum, item) => sum + item.count, 0);
    const distTotal = dist.reduce((sum, item) => sum + item.count, 0);

    expect(totalMembers).toBeGreaterThan(0);
    expect(distTotal).toBe(totalMembers);

    // Verify all tiers exist and have non-negative counts
    const tiers = ['Healthy', 'Watch', 'At Risk', 'Critical'];
    for (const tier of tiers) {
      const row = dist.find((r) => r.level === tier);
      expect(row).toBeTruthy();
      expect(row.count).toBeGreaterThanOrEqual(0);
    }

    // Healthy should be the largest group (majority of members are engaged)
    const healthy = dist.find((r) => r.level === 'Healthy');
    expect(healthy.count).toBeGreaterThan(totalMembers * 0.5);
  });

  it('returns numeric-safe member summary values', () => {
    const summary = getMemberSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(Number.isFinite(summary.riskCount)).toBe(true);
    expect(Number.isFinite(summary.potentialDuesAtRisk)).toBe(true);
    expect(Number.isFinite(summary.avgHealthScore)).toBe(true);
  });

  it('normalizes decaying members and at-risk members', () => {
    const decaying = getDecayingMembers();
    const atRisk = getAtRiskMembers();

    expect(decaying.length).toBeGreaterThan(0);
    decaying.forEach((member) => {
      expect(Number.isFinite(member.nov)).toBe(true);
      expect(Number.isFinite(member.dec)).toBe(true);
      expect(Number.isFinite(member.jan)).toBe(true);
      expect(Number.isFinite(member.trend)).toBe(true);
      expect(member.nov).toBeGreaterThanOrEqual(0);
      expect(member.jan).toBeLessThanOrEqual(1);
    });

    expect(atRisk.length).toBeGreaterThan(0);
    atRisk.forEach((member) => {
      expect(member.memberId).toBeTruthy();
      expect(member.name).toBeTruthy();
      expect(member.score).toBeGreaterThanOrEqual(0);
      expect(member.score).toBeLessThanOrEqual(100);
    });
  });
});
