// services/agentService.js — Phase A: serves static mock data
// Phase C: replaced by /api/agents/sweep.js Anthropic API calls

import {
  agentDefinitions,
  agentActions,
  agentActivityLog,
  agentThoughtLogs,
} from '@/data/agents';

export function getAgentDefinitions() {
  return agentDefinitions;
}

export function getAgentById(id) {
  return agentDefinitions.find(a => a.id === id) ?? null;
}

export function getPendingActions() {
  return agentActions.filter(a => a.status === 'pending');
}

export function getAllActions() {
  return agentActions;
}

export function getAgentSummary() {
  const active = agentDefinitions.filter(a => a.status === 'active').length;
  const pending = agentActions.filter(a => a.status === 'pending').length;
  const highPriority = agentActions.filter(a => a.status === 'pending' && a.priority === 'high').length;
  const approved = agentActions.filter(a => a.status === 'approved').length;
  return { active, total: agentDefinitions.length, pending, highPriority, approved };
}

export function getActivityLog() {
  return [...agentActivityLog].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getThoughtLog(agentId) {
  return agentThoughtLogs[agentId] ?? [];
}

export function getTopPendingAction() {
  const pending = agentActions.filter(a => a.status === 'pending');
  const high = pending.filter(a => a.priority === 'high');
  return high[0] ?? pending[0] ?? null;
}
