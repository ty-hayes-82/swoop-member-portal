import { apiFetch } from './apiClient';
import { shouldUseStatic } from './demoGate';
import { agentDefinitions, agentActions, agentThoughtLogs } from '@/data/agents';

// Filter out decommissioned action types (waitlist removed from MVP)
const MVP_EXCLUDED_ACTIONS = new Set(['WAITLIST_PRIORITY', 'WAITLIST_BACKFILL']);
let actionStore = agentActions
  .filter((a) => !MVP_EXCLUDED_ACTIONS.has(a.actionType))
  .map((action) => ({ ...action }));

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

export function getAgents() {
  if (_d?.agents) return _d.agents;
  if (!shouldUseStatic('agents')) return [];
  return agentDefinitions;
}

export function getAgentById(id) {
  const agents = getAgents();
  return agents.find((agent) => agent.id === id) ?? null;
}

// Map signal systems to gate IDs for filtering
const SYSTEM_TO_GATE = {
  'Complaint Log': 'complaints',
  'Tee Sheet': 'tee-sheet',
  'POS': 'fb',
  'Email': 'email',
};

function actionMatchesGates(action) {
  const signals = action.signals || [];
  for (const sig of signals) {
    const gate = SYSTEM_TO_GATE[sig.system];
    if (gate && !shouldUseStatic(gate)) return false;
  }
  // Also check description/impact text for ungated references
  const text = `${action.description || ''} ${action.impactMetric || ''}`;
  if (!shouldUseStatic('complaints') && /complaint/i.test(text)) return false;
  if (!shouldUseStatic('fb') && /F&B|dining|food|beverage/i.test(text)) return false;
  if (!shouldUseStatic('tee-sheet') && /tee sheet|tee time|round/i.test(text)) return false;
  return true;
}

export function getAllActions() {
  if (_d?.actions) return [...actionStore].sort(byNewest);
  // Actions reference members — require both agents AND members gates
  if (!shouldUseStatic('agents') || !shouldUseStatic('members')) return [];
  return [...actionStore].filter(actionMatchesGates).sort(byNewest);
}

export function getPendingActions() {
  return getAllActions().filter((action) => action.status === 'pending');
}

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
  }).catch((err) => { console.error('Failed to persist action approval:', err); });
  return actionStore.find((action) => action.id === id) ?? null;
}

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
  }).catch((err) => { console.error('Failed to persist action dismissal:', err); });
  return actionStore.find((action) => action.id === id) ?? null;
}

export function getThoughtLog(agentId) {
  return agentThoughtLogs[agentId] ?? [];
}

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

export function getTopPendingAction() {
  return getPendingActions()[0] ?? null;
}

export function __resetAgentActions() {
  actionStore = agentActions.map((action) => ({ ...action }));
}
