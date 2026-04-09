import { describe, it, expect } from 'vitest';
import { computeRecoveryWeeks } from './MemberDecayChain';

// Pillar 2 / FIX IT: recovery timeline model.
// These tests lock in the deterministic linear model described inline in
// <RecoveryTimeline> so future tweaks to the constants can't silently drift.

describe('computeRecoveryWeeks', () => {
  it('computes the documented calibration case (score 30 → ~5 weeks)', () => {
    // gap = 40, base = 5.0, drag = 0, mod = 0 → 5
    const out = computeRecoveryWeeks({ score: 30, archetype: 'Die-Hard Golfer', decayChainLength: 2 });
    expect(out.gap).toBe(40);
    expect(out.baseWeeks).toBe(5);
    expect(out.dominoDrag).toBe(0);
    expect(out.archetypeMod).toBe(0);
    expect(out.weeks).toBe(5);
  });

  it('applies domino drag for chains longer than 2', () => {
    // gap = 40, base = 5, drag = (4 - 2) * 0.5 = 1, mod = 0 → 6
    const out = computeRecoveryWeeks({ score: 30, archetype: 'Die-Hard Golfer', decayChainLength: 4 });
    expect(out.dominoDrag).toBe(1);
    expect(out.weeks).toBe(6);
  });

  it('penalizes Ghost / Declining archetypes by +1 week', () => {
    const ghost = computeRecoveryWeeks({ score: 30, archetype: 'Ghost', decayChainLength: 2 });
    const declining = computeRecoveryWeeks({ score: 30, archetype: 'Declining', decayChainLength: 2 });
    expect(ghost.archetypeMod).toBe(1);
    expect(declining.archetypeMod).toBe(1);
    expect(ghost.weeks).toBe(6); // 5 + 1
  });

  it('rewards Weekend Warrior / Social Butterfly archetypes by -0.5 week', () => {
    const ww = computeRecoveryWeeks({ score: 30, archetype: 'Weekend Warrior', decayChainLength: 2 });
    const sb = computeRecoveryWeeks({ score: 30, archetype: 'Social Butterfly', decayChainLength: 2 });
    expect(ww.archetypeMod).toBe(-0.5);
    expect(sb.archetypeMod).toBe(-0.5);
    // 5 - 0.5 = 4.5 → rounds to 5 (banker's rounding note: Math.round(4.5) = 5)
    expect(ww.weeks).toBe(5);
  });

  it('clamps to floor (2 weeks) for near-healthy scores', () => {
    // gap = 2, base = 0.25 → round(0.25) = 0 → clamped to 2
    const out = computeRecoveryWeeks({ score: 68, archetype: 'Die-Hard Golfer', decayChainLength: 2 });
    expect(out.weeks).toBe(2);
  });

  it('clamps to ceiling (12 weeks) for deeply-decayed members', () => {
    // gap = 70, base = 8.75, drag = (10 - 2) * 0.5 = 4, mod = 1 → 13.75 → clamp 12
    const out = computeRecoveryWeeks({ score: 0, archetype: 'Ghost', decayChainLength: 10 });
    expect(out.rawWeeks).toBeGreaterThan(12);
    expect(out.weeks).toBe(12);
  });

  it('treats scores above the target as zero gap (no negative weeks)', () => {
    const out = computeRecoveryWeeks({ score: 85, archetype: 'Die-Hard Golfer', decayChainLength: 2 });
    expect(out.gap).toBe(0);
    expect(out.baseWeeks).toBe(0);
    expect(out.weeks).toBe(2); // clamped to floor
  });
});
