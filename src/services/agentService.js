// services/agentService.js — Phase A: serves static mock data
// Phase C: swap getPendingActions/runSweep to use /api/agents/sweep.js
// To enable Phase C: set VITE_AGENTS_LIVE=true in Vercel environment variables

import {
  agentDefinitions,
  agentActions,
  agentActivityLog,
  agentThoughtLogs,
} from '@/data/agents';

const PHASE_C = import.meta.env.VITE_AGENTS_LIVE === 'true';

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

// ─── Phase C: live API functions ───────────────────────────────────────────
// Return shapes are identical to Phase A — zero component changes required.

export async function runAgentSweep(agentId, context = {}) {
  if (!PHASE_C) {
    // Phase A/B: return mock pending actions for this agent
    return agentActions.filter(a => a.agentId === agentId && a.status === 'pending');
  }
  const res = await fetch('/api/agents/sweep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, context }),
  });
  const { actions } = await res.json();
  return actions;
}

export async function draftAgentMessage(memberContext, actionContext, tone) {
  if (!PHASE_C) {
    return actionContext.proposedAction?.body ?? actionContext.proposedAction?.message ?? '';
  }
  const res = await fetch('/api/agents/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberContext, actionContext, tone }),
  });
  const { draft } = await res.json();
  return draft;
}

export async function explainAgentAction(action, clubContext = {}) {
  if (!PHASE_C) return action.rationale;
  const res = await fetch('/api/agents/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, clubContext }),
  });
  const { explanation } = await res.json();
  return explanation;
}

