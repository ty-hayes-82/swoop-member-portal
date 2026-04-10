import { describe, it, expect } from 'vitest';
import { DEMO_BRIEFING } from './briefingService';

// Story 1 narration says "3 at-risk members on today's tee sheet" — lock the static DEMO_BRIEFING
// fallback at 3 entries, with Robert Callahan (mbr_271) as the canonical third per cockpit.js + agents.js.

describe('DEMO_BRIEFING.todayRisks.atRiskTeetimes', () => {
  it('has exactly 3 at-risk tee times', () => {
    expect(DEMO_BRIEFING.todayRisks.atRiskTeetimes).toHaveLength(3);
  });

  it('includes Robert Callahan (mbr_271) as the third entry', () => {
    const third = DEMO_BRIEFING.todayRisks.atRiskTeetimes[2];
    expect(third.memberId).toBe('mbr_271');
    expect(third.name).toBe('Robert Callahan');
  });
});
