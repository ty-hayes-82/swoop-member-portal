import { apiFetch } from './apiClient';
import { logError } from '@/utils/logError';
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

import { getDataMode } from './demoGate';

// Filter out decommissioned action types (waitlist removed from MVP)
const MVP_EXCLUDED_ACTIONS = new Set(['WAITLIST_PRIORITY', 'WAITLIST_BACKFILL']);
let actionStore = getDataMode() === 'guided'
  ? []
  : agentActions
      .filter((a) => !MVP_EXCLUDED_ACTIONS.has(a.actionType))
      .map((action) => ({ ...action }));

let _d = getDataMode() === 'guided' ? {} : null;

// ── Guided data loader integration (Phase 1 — additive only) ──
import { registerService } from './guidedDataLoader';
export function _mergeData(partial) {
  _d = { ...(_d || {}), ...partial };
  if (Array.isArray(partial.actions)) {
    actionStore = partial.actions
      .filter((a) => !MVP_EXCLUDED_ACTIONS.has(a.actionType))
      .map((action) => ({ ...action }));
  }
}
export function _resetData() { _d = getDataMode() === 'guided' ? {} : null; actionStore = getDataMode() === 'guided' ? [] : agentActions.filter((a) => !MVP_EXCLUDED_ACTIONS.has(a.actionType)).map((a) => ({ ...a })); }
registerService('agentService', { mergeData: _mergeData, resetData: _resetData });

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
  return _d?.agents ?? (getDataMode() === 'guided' ? [] : agentDefinitions);
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
  return [...actionStore].sort(byNewest);
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
  actionStore = actionStore.map((action) =>
    action.id === id
      ? {
          ...action,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvalAction: meta.approvalAction ?? action.approvalAction ?? null,
        }
      : action
  );
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
  actionStore = actionStore.map((action) =>
    action.id === id
      ? {
          ...action,
          status: 'dismissed',
          dismissedAt: new Date().toISOString(),
          dismissalReason: meta.reason ?? action.dismissalReason ?? '',
        }
      : action
  );
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
  const logs = _d?.thoughtLogs ?? (getDataMode() === 'guided' ? {} : agentThoughtLogs);
  return logs[agentId] ?? [];
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

export function __resetAgentActions() {
  actionStore = getDataMode() === 'guided' ? [] : agentActions.map((action) => ({ ...action }));
}
