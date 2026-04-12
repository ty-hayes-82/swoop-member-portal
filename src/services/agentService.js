import { apiFetch } from './apiClient';
import { logError } from '@/utils/logError';
import { getDataMode, isGateOpen } from './demoGate';
import { agentDefinitions, agentActions, agentThoughtLogs } from '@/data/agents';

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {'active'|'learning'|'idle'|string} status
 * @property {string} lastAction                ISO timestamp
 * @property {number} accuracy                  0-100
 * @property {string} accentColor
 */

/**
 * @typedef {Object} AgentAction
 * @property {string} id
 * @property {string} [actionType]
 * @property {string} [status]                  'pending' | 'approved' | 'dismissed'
 * @property {string} [timestamp]
 * @property {string} [description]
 * @property {string} [impactMetric]
 * @property {Array<{system:string}>} [signals]
 * @property {string} [approvedAt]
 * @property {string|null} [approvalAction]
 * @property {string} [dismissedAt]
 * @property {string} [dismissalReason]
 */

/**
 * @typedef {Object} ThoughtLogEntry
 * @property {string} [timestamp]
 * @property {string} [message]
 */

/**
 * @typedef {Object} AgentSummary
 * @property {number} active
 * @property {number} total
 * @property {number} pending
 * @property {number} approved
 * @property {number} dismissed
 */

// Filter out decommissioned action types (waitlist removed from MVP)
const MVP_EXCLUDED_ACTIONS = new Set(['WAITLIST_PRIORITY', 'WAITLIST_BACKFILL']);
let actionStore = null;

function getActionStore() {
  if (!actionStore) {
    actionStore = agentActions
      .filter((a) => !MVP_EXCLUDED_ACTIONS.has(a.actionType))
      .map((action) => ({ ...action }));
  }
  return actionStore;
}

let _d = null;

export const _init = async () => {
  try {
    const data = await apiFetch('/api/agents');
    if (!data) return;
    _d = data;
    if (Array.isArray(_d.actions)) {
      actionStore = _d.actions.map(a => ({ ...a }));
    }
  } catch { /* keep static fallback */ }
};

const byNewest = (a, b) => {
  const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
  const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
  return tb - ta;
};

/** @returns {Agent[]} */
export function getAgents() {
  if (_d?.agents) return _d.agents;
  const mode = getDataMode();
  // In demo mode, always show agents. In guided mode, show when agents gate is open.
  if (mode === 'demo' || (mode === 'guided' && isGateOpen('agents'))) return agentDefinitions;
  return [];
}

/**
 * @param {string} id
 * @returns {Agent|null}
 */
export function getAgentById(id) {
  const agents = getAgents();
  return agents.find((agent) => agent.id === id) ?? null;
}

/** @returns {AgentAction[]} */
export function getAllActions() {
  if (_d?.actions) return [..._d.actions].sort(byNewest);
  const mode = getDataMode();
  if (mode === 'demo' || (mode === 'guided' && isGateOpen('agents'))) {
    return [...getActionStore()].sort(byNewest);
  }
  return [];
}

/** @returns {AgentAction[]} */
export function getPendingActions() {
  return getAllActions().filter((action) => action.status === 'pending');
}

/**
 * @param {string} id
 * @param {Object} [meta]
 * @returns {AgentAction|null}
 */
export function approveAction(id, meta = {}) {
  const store = getActionStore();
  actionStore = store.map((action) =>
    action.id === id
      ? {
          ...action,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvalAction: meta.approvalAction ?? action.approvalAction ?? null,
        }
      : action
  );
  // Keep _d.actions in sync so getAllActions() reflects the mutation
  if (_d?.actions) {
    const idx = _d.actions.findIndex(a => a.id === id);
    if (idx >= 0) _d.actions[idx] = { ..._d.actions[idx], status: 'approved', approvedAt: new Date().toISOString(), approvalAction: meta.approvalAction ?? _d.actions[idx].approvalAction ?? null };
  }
  // Fire-and-forget POST to persist
  apiFetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId: id, operation: 'approve', meta }),
  }).catch((err) => { logError(err, { service: 'agentService', op: 'approveAction', actionId: id }); });
  return actionStore.find((action) => action.id === id) ?? null;
}

/**
 * @param {string} id
 * @param {Object} [meta]
 * @returns {AgentAction|null}
 */
export function dismissAction(id, meta = {}) {
  const store = getActionStore();
  actionStore = store.map((action) =>
    action.id === id
      ? {
          ...action,
          status: 'dismissed',
          dismissedAt: new Date().toISOString(),
          dismissalReason: meta.reason ?? action.dismissalReason ?? '',
        }
      : action
  );
  // Keep _d.actions in sync so getAllActions() reflects the mutation
  if (_d?.actions) {
    const idx = _d.actions.findIndex(a => a.id === id);
    if (idx >= 0) _d.actions[idx] = { ..._d.actions[idx], status: 'dismissed', dismissedAt: new Date().toISOString(), dismissalReason: meta.reason ?? _d.actions[idx].dismissalReason ?? '' };
  }
  // Fire-and-forget POST to persist
  apiFetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId: id, operation: 'dismiss', meta }),
  }).catch((err) => { logError(err, { service: 'agentService', op: 'dismissAction', actionId: id }); });
  return actionStore.find((action) => action.id === id) ?? null;
}

/**
 * @param {string} agentId
 * @returns {ThoughtLogEntry[]}
 */
export function getThoughtLog(agentId) {
  if (_d?.thoughtLogs) return _d.thoughtLogs[agentId] ?? [];
  const mode = getDataMode();
  if (mode === 'demo' || (mode === 'guided' && isGateOpen('agents'))) {
    return agentThoughtLogs[agentId] ?? [];
  }
  return [];
}

/** @returns {AgentSummary} */
export function getAgentSummary() {
  const agents = getAgents();
  const actions = getAllActions();
  return {
    active: agents.filter((agent) => agent.status === 'active').length,
    total: agents.length,
    pending: actions.filter((action) => action.status === 'pending').length,
    approved: actions.filter((action) => action.status === 'approved').length,
    dismissed: actions.filter((action) => action.status === 'dismissed').length,
  };
}

/** @returns {AgentAction|null} */
export function getTopPendingAction() {
  return getPendingActions()[0] ?? null;
}

/**
 * Returns actions from OTHER agents that touch the same member as the given action.
 * This proves multi-agent coordination — agents share context on the same member.
 * @param {string} actionId
 * @returns {{ actionId: string, agentId: string, source: string, description: string }[]}
 */
export function getRelatedActions(actionId) {
  const all = getAllActions();
  const target = all.find(a => a.id === actionId);
  if (!target?.memberId) return [];
  return all
    .filter(a => a.id !== actionId && a.memberId === target.memberId && a.agentId !== target.agentId)
    .map(a => ({ actionId: a.id, agentId: a.agentId, source: a.source, description: a.description }));
}

/**
 * Returns the coordination graph — which agents are actively working together on shared members.
 * @returns {{ agentA: string, agentB: string, sharedMembers: string[] }[]}
 */
export function getCoordinationGraph() {
  const all = getAllActions();
  const byMember = {};
  for (const a of all) {
    if (!a.memberId) continue;
    if (!byMember[a.memberId]) byMember[a.memberId] = new Set();
    byMember[a.memberId].add(a.agentId);
  }
  const edges = {};
  for (const [memberId, agentSet] of Object.entries(byMember)) {
    const agents = [...agentSet].sort();
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const key = `${agents[i]}|${agents[j]}`;
        if (!edges[key]) edges[key] = { agentA: agents[i], agentB: agents[j], sharedMembers: [] };
        edges[key].sharedMembers.push(memberId);
      }
    }
  }
  return Object.values(edges);
}

export function __resetAgentActions() {
  actionStore = null;
}
