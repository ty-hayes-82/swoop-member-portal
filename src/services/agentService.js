import { agentDefinitions, agentActions, agentThoughtLogs } from '@/data/agents';

let actionStore = agentActions.map((action) => ({ ...action }));

const byNewest = (a, b) => b.timestamp.localeCompare(a.timestamp);

export function getAgents() {
  return agentDefinitions;
}

export function getAgentDefinitions() {
  return getAgents();
}

export function getAgentById(id) {
  return agentDefinitions.find((agent) => agent.id === id) ?? null;
}

export function getAllActions() {
  return [...actionStore].sort(byNewest);
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

export function getActivityLog() {
  return getAllActions().map((action) => ({
    id: `log_${action.id}`,
    timestamp: action.timestamp,
    type: action.actionType,
    agentId: action.agentId,
    summary: action.description,
    details: `${action.source} · ${action.impactMetric} · ${action.status}`,
    status: action.status,
  }));
}

export async function draftAgentMessage(memberContext, actionContext) {
  const recipientName = memberContext?.name ?? 'Member';
  const actionDetail = actionContext?.description ?? 'an important update';
  return `Hi ${recipientName},\n\nI wanted to personally follow up regarding ${actionDetail.toLowerCase()}.\n\nPlease reply if you would like me to handle this directly today.\n\nBest,\n[GM Name]`;
}

export async function explainAgentAction(action) {
  return `${action.source} recommended this based on cross-system signal correlation and expected impact: ${action.impactMetric}.`;
}

export function __resetAgentActions() {
  actionStore = agentActions.map((action) => ({ ...action }));
}
