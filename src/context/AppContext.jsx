import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getAgents, getAllActions, getPendingActions, approveAction as approveAgentServiceAction, dismissAction as dismissAgentServiceAction } from '@/services/agentService';

const PLAYBOOK_DEFS = {
  'slow-saturday': { monthly: 8400, annual: 100800 },
  'service-save': { monthly: 18000, annual: 216000 },
  'engagement-decay': { monthly: 9200, annual: 110400 },
  'staffing-gap': { monthly: 2100, annual: 25200 },
  'peak-demand-capture': { monthly: 6200, annual: 74400 },
};

const TRAIL_STEPS = {
  'slow-saturday': ['📡 Ranger dispatch sent to holes 4, 8, 12, 16', '📋 Saturday tee intervals updated: 8 → 10 min', '✉ Recovery offer template activated for 4:30+ rounds'],
  'service-save': ['🚩 James Whitfield flagged at front desk', '📢 F&B Director alerted with complaint details', '✉ GM personal alert: James Whitfield — 8K member, 4-day unresolved complaint', '🎁 Comp appetizer offer queued for James Whitfield'],
  'engagement-decay': ['📊 Weekly health scan scheduled (every Monday)', '✉ Personalized event invite campaign queued for 30 declining members', '🚩 Non-responder follow-up flagged for Week 3'],
  'staffing-gap': ['📊 72-hour shift gap detection enabled', '📢 Flex pool (4 staff) notified for Grill Room backup', '📅 Post-day audit report scheduled daily'],
  'peak-demand-capture': ['📊 5 at-risk members identified in Saturday AM waitlist', '📣 Priority cancellation alerts queued for retention-flagged members', '🎁 Post-round lunch reservation attached to waitlist notifications', '📢 F&B Director notified: prep for +15% Saturday covers', '📈 Visit session tracking enabled: tee fill → dining conversion → health delta'],
};

const defaultAgents = getAgents();
const defaultStatuses = Object.fromEntries(defaultAgents.map((agent) => [agent.id, agent.status]));

const initialState = {
  currentDate: '2026-01-17',
  playbooks: {
    'slow-saturday': { active: false, activatedAt: null },
    'service-save': { active: false, activatedAt: null },
    'engagement-decay': { active: false, activatedAt: null },
    'staffing-gap': { active: false, activatedAt: null },
    'peak-demand-capture': { active: false, activatedAt: null },
  },
  trailProgress: {
    'slow-saturday': 0,
    'service-save': 0,
    'engagement-decay': 0,
    'staffing-gap': 0,
    'peak-demand-capture': 0,
  },
  inbox: getAllActions(),
  pendingCount: getPendingActions().length,
  agentStatuses: defaultStatuses,
  agentConfigs: {},
};

function computePendingCount(inbox) {
  return inbox.filter((item) => item.status === 'pending').length;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ACTIVATE_PLAYBOOK':
      return {
        ...state,
        playbooks: { ...state.playbooks, [action.id]: { active: true, activatedAt: new Date().toISOString() } },
        trailProgress: { ...state.trailProgress, [action.id]: 0 },
      };
    case 'DEACTIVATE_PLAYBOOK':
      return {
        ...state,
        playbooks: { ...state.playbooks, [action.id]: { active: false, activatedAt: null } },
        trailProgress: { ...state.trailProgress, [action.id]: 0 },
      };
    case 'ADVANCE_TRAIL':
      return {
        ...state,
        trailProgress: {
          ...state.trailProgress,
          [action.id]: Math.min((state.trailProgress[action.id] ?? 0) + 1, (TRAIL_STEPS[action.id]?.length ?? 0)),
        },
      };
    case 'SET_INBOX': {
      return {
        ...state,
        inbox: action.inbox,
        pendingCount: computePendingCount(action.inbox),
      };
    }
    case 'APPROVE_ACTION':
    case 'APPROVE_AGENT_ACTION': {
      const inbox = state.inbox.map((item) => (item.id === action.id ? { ...item, status: 'approved' } : item));
      return { ...state, inbox, pendingCount: computePendingCount(inbox) };
    }
    case 'DISMISS_ACTION':
    case 'DISMISS_AGENT_ACTION': {
      const inbox = state.inbox.map((item) => (item.id === action.id ? { ...item, status: 'dismissed' } : item));
      return { ...state, inbox, pendingCount: computePendingCount(inbox) };
    }
    case 'TOGGLE_AGENT_STATUS': {
      const current = state.agentStatuses[action.id] ?? action.currentStatus ?? 'idle';
      return {
        ...state,
        agentStatuses: {
          ...state.agentStatuses,
          [action.id]: current === 'active' ? 'idle' : 'active',
        },
      };
    }
    case 'SAVE_AGENT_CONFIG':
      return {
        ...state,
        agentConfigs: { ...state.agentConfigs, [action.id]: action.config },
      };
    default:
      return state;
  }
}

const AppContext = createContext(null);

function loadPersistedState(base) {
  try {
    const inbox = JSON.parse(localStorage.getItem('swoop_agent_inbox') || 'null');
    const agentStatuses = JSON.parse(localStorage.getItem('swoop_agent_statuses') || 'null');
    const agentConfigs = JSON.parse(localStorage.getItem('swoop_agent_configs') || 'null');

    const nextInbox = Array.isArray(inbox) ? inbox : base.inbox;
    return {
      ...base,
      inbox: nextInbox,
      pendingCount: computePendingCount(nextInbox),
      agentStatuses: agentStatuses ?? base.agentStatuses,
      agentConfigs: agentConfigs ?? base.agentConfigs,
    };
  } catch {
    return base;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadPersistedState);

  const activePlaybooks = Object.entries(state.playbooks).filter(([, value]) => value.active);
  const totalRevenueImpact = {
    monthly: activePlaybooks.reduce((sum, [id]) => sum + (PLAYBOOK_DEFS[id]?.monthly ?? 0), 0),
    annual: activePlaybooks.reduce((sum, [id]) => sum + (PLAYBOOK_DEFS[id]?.annual ?? 0), 0),
  };

  useEffect(() => {
    activePlaybooks.forEach(([id]) => {
      const total = TRAIL_STEPS[id]?.length ?? 0;
      const current = state.trailProgress[id] ?? 0;
      if (current < total) {
        const timer = setTimeout(() => dispatch({ type: 'ADVANCE_TRAIL', id }), 700);
        return () => clearTimeout(timer);
      }
      return undefined;
    });
  }, [state.trailProgress, state.playbooks]);

  useEffect(() => {
    try {
      localStorage.setItem('swoop_agent_inbox', JSON.stringify(state.inbox));
      localStorage.setItem('swoop_agent_statuses', JSON.stringify(state.agentStatuses));
      localStorage.setItem('swoop_agent_configs', JSON.stringify(state.agentConfigs));
    } catch {}
  }, [state.inbox, state.agentStatuses, state.agentConfigs]);

  function approveAction(id) {
    approveAgentServiceAction(id);
    dispatch({ type: 'APPROVE_ACTION', id });
  }

  function dismissAction(id) {
    dismissAgentServiceAction(id);
    dispatch({ type: 'DISMISS_ACTION', id });
  }

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
        activeCount: activePlaybooks.length,
        totalPlaybooks: Object.keys(state.playbooks).length,
        totalRevenueImpact,
        playbookDefs: PLAYBOOK_DEFS,
        trailSteps: TRAIL_STEPS,
        getActionStatus: (id) => state.inbox.find((item) => item.id === id)?.status ?? 'pending',
        getAgentStatus: (id, fallback) => state.agentStatuses[id] ?? fallback,
        approveAction,
        dismissAction,
        toggleAgent: (id, currentStatus) => dispatch({ type: 'TOGGLE_AGENT_STATUS', id, currentStatus }),
        saveAgentConfig: (id, config) => dispatch({ type: 'SAVE_AGENT_CONFIG', id, config }),
        getAgentConfig: (id) => state.agentConfigs[id] ?? null,
        pendingAgentCount: state.pendingCount,
        getAllActions: () => state.inbox,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export { useAppContext as useApp };
