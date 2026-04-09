import { describe, it, expect } from 'vitest';
import { DEMO_BRIEFING } from './briefingService';

// Lock in the 2026-04-09 demo-data audit fix: Story 1 narration says
// "3 at-risk members on today's tee sheet" but the static DEMO_BRIEFING
// fallback was previously only shipping 2 entries. Robert Callahan
// (mbr_271, $24K renewal risk) is the canonical 3rd at-risk member per
// cockpit.js + agents.js. If someone removes him again, this test blows
// up before the storyboard does.

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
