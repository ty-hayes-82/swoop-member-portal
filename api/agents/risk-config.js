/**
 * Agent definition and trigger evaluation for the member-risk-lifecycle agent.
 *
 * Exports:
 *  - RISK_AGENT config (agent_id, prompt, tools)
 *  - evaluateRiskTrigger(memberId, clubId) — checks health score crossing criteria
 */
import { sql } from '@vercel/postgres';
import MEMBER_RISK_PROMPT from '../../src/config/memberRiskPrompt.js';

// ---------------------------------------------------------------------------
// Agent definition
// ---------------------------------------------------------------------------

export const RISK_AGENT = {
  agent_id: 'member-risk-lifecycle',
  system_prompt: MEMBER_RISK_PROMPT,
  tools: [
    'get_member_profile',
    'get_member_list',
    'get_open_complaints',
    'create_action',
    'get_action_status',
    'record_agent_activity',
    'start_playbook_run',
    'update_playbook_step',
    'record_intervention_outcome',
    'draft_member_message',
  ],
};

// ---------------------------------------------------------------------------
// Trigger evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a member qualifies for the member-risk-lifecycle agent.
 *
 * Criteria (from spec):
 *   - current health_score < 50
 *   - annual_dues >= 8000
 *   - score delta > 15 pts in 30 days
 *
 * @param {string} memberId
 * @param {string} clubId
 * @returns {Promise<{shouldTrigger: boolean, reason: string, currentScore: number, previousScore: number|null, delta: number, dues: number}>}
 */
export async function evaluateRiskTrigger(memberId, clubId) {
  // 1. Current member data
  const { rows: memberRows } = await sql`
    SELECT health_score, annual_dues
    FROM members
    WHERE member_id = ${memberId} AND club_id = ${clubId}
  `;

  if (memberRows.length === 0) {
    return { shouldTrigger: false, reason: 'Member not found', currentScore: 0, previousScore: null, delta: 0, dues: 0 };
  }

  const currentScore = memberRows[0].health_score ?? 100;
  const dues = memberRows[0].annual_dues ?? 0;

  // 2. Historical score from ~30 days ago
  const { rows: historyRows } = await sql`
    SELECT score
    FROM health_scores
    WHERE member_id = ${memberId} AND club_id = ${clubId}
      AND recorded_at <= NOW() - INTERVAL '25 days'
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const previousScore = historyRows.length > 0 ? (historyRows[0].score ?? null) : null;
  const delta = previousScore !== null ? previousScore - currentScore : 0;

  // 3. Evaluate criteria
  const reasons = [];
  if (currentScore >= 50) reasons.push(`health_score ${currentScore} >= 50`);
  if (dues < 8000) reasons.push(`annual_dues ${dues} < 8000`);
  if (previousScore === null) reasons.push('no prior score history (new member or no baseline)');
  if (delta <= 15) reasons.push(`score delta ${delta} <= 15 (need > 15)`);

  const shouldTrigger = currentScore < 50 && dues >= 8000 && delta > 15;

  return {
    shouldTrigger,
    reason: shouldTrigger
      ? `health_score=${currentScore} (was ${previousScore}), delta=${delta}, dues=${dues}`
      : reasons.join('; '),
    currentScore,
    previousScore,
    delta,
    dues,
  };
}
