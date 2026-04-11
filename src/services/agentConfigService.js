/**
 * Agent Config Service — read and update per-club agent configuration.
 *
 * Uses the apiClient pattern (apiFetch + getClubId) to call the
 * /api/agent-config endpoint introduced in Sprint 1.
 */
import { apiFetch, getClubId } from './apiClient';

/**
 * Fetch the full config for a single agent.
 * Returns defaults from the server when no row exists yet.
 *
 * @param {string} clubId
 * @param {string} agentId
 * @returns {Promise<Object|null>}
 */
export async function getAgentConfig(clubId, agentId) {
  const cid = clubId || getClubId();
  if (!cid || !agentId) return null;
  return apiFetch(`/api/agent-config?clubId=${encodeURIComponent(cid)}&agentId=${encodeURIComponent(agentId)}`);
}

/**
 * Partial-update an agent's config.
 * Only the keys present in `updates` are merged server-side (JSONB ||).
 *
 * @param {string} clubId
 * @param {string} agentId
 * @param {Object} updates  — e.g. { tone: 'warm', auto_approve_threshold: 0.80 }
 * @returns {Promise<Object|null>}
 */
export async function updateAgentConfig(clubId, agentId, updates) {
  const cid = clubId || getClubId();
  if (!cid || !agentId) return null;
  return apiFetch('/api/agent-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, ...updates }),
  });
}
