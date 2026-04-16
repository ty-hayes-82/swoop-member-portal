/**
 * api/agents/analyst-harness.js
 *
 * Shared harness for all Type 2 domain-analyst agents.
 *
 * Analyst agents are stateless brains with durable signal history.
 * They run on schedule or trigger, write findings to their own session log,
 * and publish recommendations to identity agent sessions via handoffs.
 *
 * They NEVER act directly. Every recommendation is delivered to an identity
 * agent (GM, staff role) which delivers it to a human who acts in source systems.
 *
 * Session ID conventions:
 *   member_pulse_{clubId}
 *   service_recovery_{clubId}    (analyst — distinct from specialist)
 *   revenue_analyst_{clubId}
 *   labor_optimizer_{clubId}
 *   engagement_autopilot_{clubId}
 *
 * Usage:
 *   import { runAnalyst } from '../agents/analyst-harness.js';
 *   const result = await runAnalyst({ analystName, clubId, systemPrompt, contextData, targetRoles });
 */

import { sql } from '@vercel/postgres';
import { getAnthropicClient } from './managed-config.js';
import {
  getOrCreateAgentSession,
  emitAgentEvent,
  getAgentEvents,
  createHandoff,
} from './session-core.js';

// Analysts use haiku by default — cost-sensitive, high-volume
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_MAX_TOKENS = 1024;

// ---------------------------------------------------------------------------
// Resolve target sessions from roles
// ---------------------------------------------------------------------------

/**
 * Given a list of role slugs, find all active users in the club and return
 * their canonical session IDs for handoff routing.
 *
 * GM concierge: gm_{userId}_concierge
 * Staff roles:  staff_{userId}_{role}
 *
 * @param {string} clubId
 * @param {string[]} roles - e.g. ['gm', 'membership_director', 'fb_director']
 * @returns {Promise<{ role: string, userId: string, sessionId: string }[]>}
 */
export async function resolveTargetSessions(clubId, roles) {
  if (!roles?.length) return [];
  try {
    const result = await sql`
      SELECT user_id, role FROM users
      WHERE club_id = ${clubId} AND role = ANY(${roles}) AND active = TRUE
    `;
    return result.rows.map(row => ({
      role: row.role,
      userId: row.user_id,
      sessionId: row.role === 'gm'
        ? `gm_${row.user_id}_concierge`
        : `staff_${row.user_id}_${row.role}`,
    }));
  } catch (err) {
    console.warn('[analyst-harness] resolveTargetSessions failed:', err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Memory guard: skip if a recommendation of this type was dismissed recently
// ---------------------------------------------------------------------------

/**
 * Returns true if the analyst has emitted a recommendation of this type in
 * the last `withinHours` hours that was subsequently rejected.
 *
 * Used to avoid nagging the GM about the same signal repeatedly.
 */
async function wasRecentlyDismissed(sessionId, recommendationType, withinHours = 48) {
  try {
    const since = new Date(Date.now() - withinHours * 3600 * 1000).toISOString();
    const events = await getAgentEvents(sessionId, {
      types: ['recommendation_dismissed'],
      since,
      last: 10,
    });
    return events.some(ev => ev.payload?.recommendation_type === recommendationType);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run a domain-analyst agent for one analysis cycle.
 *
 * @param {object} params
 * @param {string} params.analystName    - e.g. 'member_pulse'
 * @param {string} params.clubId         - Club UUID
 * @param {string} params.systemPrompt   - Full system prompt for this analyst
 * @param {object} params.contextData    - Structured data pulled from DB (injected as user message)
 * @param {string[]} [params.targetRoles] - Role slugs to route recommendations to
 * @param {string} [params.modelOverride] - Override default model
 * @param {string} [params.triggerType]  - 'scheduled' | 'event_driven' | 'manual'
 * @returns {Promise<{
 *   findings: string,
 *   session_id: string,
 *   handoff_ids: string[],
 *   targets_notified: number
 * }>}
 */
export async function runAnalyst({
  analystName,
  clubId,
  systemPrompt,
  contextData,
  targetRoles = [],
  modelOverride = null,
  triggerType = 'scheduled',
}) {
  const sessionId = `${analystName}_${clubId}`;

  // 1. Ensure session exists
  await getOrCreateAgentSession(sessionId, 'analyst', analystName, clubId);

  // 2. Fetch recent session events for memory (last 10 to avoid nagging)
  let recentEvents = [];
  try {
    recentEvents = await getAgentEvents(sessionId, { last: 10 });
  } catch (e) {
    console.warn('[analyst-harness] getAgentEvents failed:', e.message);
  }

  // Build memory context from recent recommendations
  const recentRecommendations = recentEvents
    .filter(ev => ev.event_type === 'recommendation_received')
    .slice(0, 5)
    .map(ev => `[${new Date(ev.created_at).toISOString().slice(0, 10)}] ${ev.payload?.summary || ''}`)
    .join('\n');

  const memoryBlock = recentRecommendations
    ? `\n\nYour recent recommendations (do not repeat unless signal has changed):\n${recentRecommendations}`
    : '';

  // 3. Build the user message from context data
  const userMessage = `Analyze the following signals for club ${clubId} and produce actionable recommendations.\n\n${JSON.stringify(contextData, null, 2)}`;

  // 4. Call the model
  const client = getAnthropicClient();
  const model = modelOverride || DEFAULT_MODEL;

  let findings = '';
  try {
    const result = await client.messages.create({
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: 0.2,
      system: systemPrompt + memoryBlock,
      messages: [{ role: 'user', content: userMessage }],
    });
    findings = result.content.find(c => c.type === 'text')?.text || '';
  } catch (err) {
    console.error(`[analyst-harness] Model call failed for ${analystName}:`, err.message);
    throw err;
  }

  // Remove em-dashes from findings
  findings = findings.replace(/\u2014/g, ',');

  // 5. Emit recommendation to own session log
  const summary = findings.slice(0, 200);
  emitAgentEvent(sessionId, clubId, {
    type: 'recommendation_received',
    source_agent: analystName,
    summary,
    full_text: findings,
    trigger_type: triggerType,
    context_snapshot: contextData,
  }).catch(() => {});

  // 6. Resolve target identity sessions and emit handoffs
  const targets = await resolveTargetSessions(clubId, targetRoles);
  const handoffIds = [];

  for (const target of targets) {
    // Emit recommendation_received to the target identity session
    emitAgentEvent(target.sessionId, clubId, {
      type: 'recommendation_received',
      source_agent: analystName,
      summary,
      full_text: findings,
      trigger_type: triggerType,
    }).catch(() => {});

    // Create a handoff record for audit trail
    try {
      const handoffId = await createHandoff({
        sourceSessionId: sessionId,
        targetSessionId: target.sessionId,
      });
      handoffIds.push(handoffId);
    } catch (e) {
      console.warn('[analyst-harness] createHandoff failed:', e.message);
    }
  }

  return {
    findings,
    session_id: sessionId,
    handoff_ids: handoffIds,
    targets_notified: targets.length,
  };
}
