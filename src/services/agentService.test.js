import { describe, expect, it, beforeEach } from 'vitest';
import {
  getAgents,
  getAgentById,
  getAllActions,
  getPendingActions,
  getAgentSummary,
  getTopPendingAction,
  getThoughtLog,
  approveAction,
  dismissAction,
  __resetAgentActions,
} from './agentService';

describe('agentService', () => {
  beforeEach(() => {
    __resetAgentActions();
  });

  it('getAgents returns agent definitions with required fields', () => {
    const agents = getAgents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);

    agents.forEach((agent) => {
      expect(agent.id).toBeTruthy();
      expect(agent.status).toBeTruthy();
    });
  });

  it('getAgentById returns a single agent or null for unknown ids', () => {
    const agents = getAgents();
    const first = agents[0];
    expect(getAgentById(first.id)).toEqual(first);
    expect(getAgentById('nonexistent_id_xyz')).toBeNull();
  });

  it('getAllActions and getPendingActions return shape-valid action lists', () => {
    const all = getAllActions();
    const pending = getPendingActions();

    expect(Array.isArray(all)).toBe(true);
    expect(Array.isArray(pending)).toBe(true);
    expect(all.length).toBeGreaterThan(0);

    // pending is a subset of all
    expect(pending.length).toBeLessThanOrEqual(all.length);
    pending.forEach((action) => {
      expect(action.status).toBe('pending');
    });

    // Each action has the core fields used by the UI
    all.forEach((action) => {
      expect(action.id).toBeTruthy();
      expect(action.status).toBeTruthy();
    });
  });

  it('getAgentSummary returns numeric counts that reconcile with action lists', () => {
    const summary = getAgentSummary();
    expect(Number.isFinite(summary.active)).toBe(true);
    expect(Number.isFinite(summary.total)).toBe(true);
    expect(Number.isFinite(summary.pending)).toBe(true);
    expect(Number.isFinite(summary.approved)).toBe(true);
    expect(Number.isFinite(summary.dismissed)).toBe(true);

    expect(summary.pending).toBe(getPendingActions().length);
    expect(summary.total).toBeGreaterThan(0);
  });

  it('approveAction and dismissAction mutate status and reduce pending count', () => {
    const top = getTopPendingAction();
    expect(top).toBeTruthy();

    const before = getPendingActions().length;
    const approved = approveAction(top.id);
    expect(approved?.status).toBe('approved');
    expect(getPendingActions().length).toBe(before - 1);

    // Dismiss another
    const next = getTopPendingAction();
    if (next) {
      const dismissed = dismissAction(next.id, { reason: 'not relevant' });
      expect(dismissed?.status).toBe('dismissed');
    }
  });

  it('getThoughtLog returns an array for known and unknown agent ids', () => {
    const knownId = getAgents()[0].id;
    expect(Array.isArray(getThoughtLog(knownId))).toBe(true);
    expect(Array.isArray(getThoughtLog('nonexistent_id'))).toBe(true);
    expect(getThoughtLog('nonexistent_id')).toEqual([]);
  });
});
