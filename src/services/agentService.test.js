import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// Wave 2 (SHIP_PLAN §2.1) — mock apiClient so _init() never hits the network
// and so the fire-and-forget POSTs from approve/dismiss don't log in tests.
const apiFetchMock = vi.fn().mockResolvedValue(null);
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshAgent() {
  vi.resetModules();
  return import('./agentService');
}

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

describe('agentService — _init + mock contract', () => {
  beforeEach(() => { apiFetchMock.mockReset(); apiFetchMock.mockResolvedValue(null); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('_init() fetches /api/agents and hydrates the cached agent + action lists', async () => {
    const payload = {
      agents: [{ id: 'agt_test', status: 'active', name: 'Test Agent' }],
      actions: [
        { id: 'act_1', status: 'pending', title: 'API action 1', timestamp: '2026-04-09T00:00:00Z' },
        { id: 'act_2', status: 'approved', title: 'API action 2', timestamp: '2026-04-08T00:00:00Z' },
      ],
    };
    apiFetchMock.mockResolvedValueOnce(payload);

    const svc = await freshAgent();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledWith('/api/agents');
    expect(svc.getAgents()).toEqual(payload.agents);
    const all = svc.getAllActions();
    expect(all).toHaveLength(2);
    expect(svc.getPendingActions()).toHaveLength(1);
  });

  it('getAgents() pre-_init returns the static definitions (demo mode default)', async () => {
    const svc = await freshAgent();
    const agents = svc.getAgents();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it('_init() swallows apiFetch rejection and leaves the service usable', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));
    const svc = await freshAgent();
    await expect(svc._init()).resolves.toBeUndefined();

    // Static fallback still works.
    expect(svc.getAgents().length).toBeGreaterThan(0);
    expect(svc.getAllActions().length).toBeGreaterThan(0);
  });
});
