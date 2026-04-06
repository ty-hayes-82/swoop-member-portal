import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { getAgents, getAllActions, getPendingActions, approveAction as approveAgentServiceAction, dismissAction as dismissAgentServiceAction } from '@/services/agentService';
import {
  getConfirmations as getTSOConfirmations,
  updateConfirmation as updateTSOConfirmation,
  getReassignments as getTSOReassignments,
  createReassignment as createTSOReassignment,
  updateReassignment as updateTSOReassignment,
  getWaitlistConfig as getTSOConfig,
  updateWaitlistConfig as updateTSOConfig,
} from '@/services/teeSheetOpsService';
import { useToast } from '@/components/ui/Toast.jsx';

// V3: Only 3 core playbooks. Removed slow-saturday (renamed to staffing-gap),
// engagement-decay, peak-demand-capture.
const PLAYBOOK_DEFS = {
  'service-save': { monthly: 18000, annual: 216000 },
  'new-member-90day': { monthly: 22000, annual: 264000 },
  'staffing-gap': { monthly: 2100, annual: 25200 },
};

const TRAIL_STEPS = {
  'service-save': ['🚩 James Whitfield flagged at front desk', '📢 F&B Director alerted with complaint details', '✉ GM personal alert: James Whitfield — 8K member, 4-day unresolved complaint', '🎁 Comp appetizer offer queued for James Whitfield'],
  'new-member-90day': ['🤝 Member matched with compatible golfers', '🎉 Family event invitation sent', '📞 Concierge check-in scheduled', '📋 90-day pulse survey queued'],
  'staffing-gap': ['📊 72-hour shift gap detection enabled', '📢 Flex pool (4 staff) notified for Grill Room backup', '📅 Post-day audit report scheduled daily'],
};

const defaultAgents = getAgents();
const defaultStatuses = Object.fromEntries(defaultAgents.map((agent) => [agent.id, agent.status]));

// V4: All modes start empty — inbox populated from API via agentService._init()
const initialState = {
  currentDate: new Date().toISOString().split('T')[0],
  playbooks: {
    'service-save': { active: false, activatedAt: null },
    'new-member-90day': { active: false, activatedAt: null },
    'staffing-gap': { active: false, activatedAt: null },
  },
  trailProgress: {
    'service-save': 0,
    'new-member-90day': 0,
    'staffing-gap': 0,
  },
  inbox: [],
  pendingCount: 0,
  agentStatuses: defaultStatuses,
  agentConfigs: {},
  teeSheetOps: {
    confirmations: [],
    reassignments: [],
    config: getTSOConfig(),
  },
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
      const inbox = state.inbox.map((item) => (
        item.id === action.id
          ? {
              ...item,
              status: 'approved',
              approvalAction: action.meta?.approvalAction ?? item.approvalAction ?? null,
              approvedAt: new Date().toISOString(),
            }
          : item
      ));
      return { ...state, inbox, pendingCount: computePendingCount(inbox) };
    }
    case 'DISMISS_ACTION':
    case 'DISMISS_AGENT_ACTION': {
      const inbox = state.inbox.map((item) => (
        item.id === action.id
          ? {
              ...item,
              status: 'dismissed',
              dismissalReason: action.meta?.reason ?? item.dismissalReason ?? '',
              dismissedAt: new Date().toISOString(),
            }
          : item
      ));
      return { ...state, inbox, pendingCount: computePendingCount(inbox) };
    }
    case 'ADD_ACTION': {
      const newAction = {
        id: `agx_${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentId: action.agentId || 'member-pulse',
        source: action.source || 'Manual Action',
        actionType: action.actionType || 'RETENTION_OUTREACH',
        description: action.description,
        status: 'pending',
        impactMetric: action.impactMetric || '',
        priority: action.priority || 'medium',
        memberId: action.memberId,
        memberName: action.memberName,
        auditTrail: [{ id: 'rec', status: 'Created', owner: action.owner || 'Sarah Mitchell (GM)', timestamp: new Date().toISOString() }],
      };
      const inbox = [newAction, ...state.inbox];
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
    case 'UPDATE_CONFIRMATION': {
      const updated = updateTSOConfirmation(action.id, action.updates);
      return {
        ...state,
        teeSheetOps: {
          ...state.teeSheetOps,
          confirmations: getTSOConfirmations(),
        },
      };
    }
    case 'CREATE_REASSIGNMENT': {
      const newRa = createTSOReassignment(action.data);
      return {
        ...state,
        teeSheetOps: {
          ...state.teeSheetOps,
          reassignments: getTSOReassignments(),
        },
      };
    }
    case 'UPDATE_REASSIGNMENT': {
      const updatedRa = updateTSOReassignment(action.id, action.updates);
      return {
        ...state,
        teeSheetOps: {
          ...state.teeSheetOps,
          reassignments: getTSOReassignments(),
        },
      };
    }
    case 'UPDATE_WAITLIST_CONFIG': {
      const newConfig = updateTSOConfig(action.updates);
      return {
        ...state,
        teeSheetOps: {
          ...state.teeSheetOps,
          config: newConfig,
        },
      };
    }
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

    let nextInbox = Array.isArray(inbox) ? inbox : base.inbox;
    // V5 migration: replace "churn" with "resignation" in persisted inbox items
    if (Array.isArray(inbox)) {
      nextInbox = nextInbox.map(item => {
        if (item.impactMetric && item.impactMetric.includes('churn')) {
          return { ...item, impactMetric: item.impactMetric.replace(/churn/gi, 'resignation') };
        }
        return item;
      });
    }
    // V4: No static demo reset — all data comes from API
    // Merge any new default actions not present in persisted inbox (e.g., follow-up cards)
    if (Array.isArray(inbox)) {
      const existingIds = new Set(nextInbox.map(i => i.id));
      const newActions = base.inbox.filter(a => !existingIds.has(a.id));
      if (newActions.length > 0) {
        nextInbox = [...nextInbox, ...newActions];
      }
    }
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
  const { showToast, ToastContainer } = useToast();

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

  function approveAction(id, meta = {}) {
    approveAgentServiceAction(id, meta);
    dispatch({ type: 'APPROVE_ACTION', id, meta });

    // Wire to real execution API if club is configured
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (clubId) {
      const token = localStorage.getItem('swoop_auth_token');
      const demoEmail = localStorage.getItem('swoop_demo_email');
      const demoPhone = localStorage.getItem('swoop_demo_phone');
      fetch('/api/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          actionId: id, clubId,
          executionType: meta.executionType || 'staff_task',
          memberId: meta.memberId || null,
          senderName: meta.approvalAction || 'GM',
          ...(demoEmail ? { demoOverrideEmail: demoEmail } : {}),
          ...(demoPhone ? { demoOverridePhone: demoPhone } : {}),
        }),
      }).catch(() => {});
    }
  }

  function dismissAction(id, meta = {}) {
    dismissAgentServiceAction(id, meta);
    dispatch({ type: 'DISMISS_ACTION', id, meta });
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
        addAction: (data) => dispatch({ type: 'ADD_ACTION', ...data }),
        toggleAgent: (id, currentStatus) => dispatch({ type: 'TOGGLE_AGENT_STATUS', id, currentStatus }),
        saveAgentConfig: (id, config) => dispatch({ type: 'SAVE_AGENT_CONFIG', id, config }),
        getAgentConfig: (id) => state.agentConfigs[id] ?? null,
        pendingAgentCount: state.pendingCount,
        getAllActions: () => state.inbox,
        teeSheetOps: state.teeSheetOps,
        updateConfirmation: (id, updates) => dispatch({ type: 'UPDATE_CONFIRMATION', id, updates }),
        createReassignment: (data) => dispatch({ type: 'CREATE_REASSIGNMENT', data }),
        updateReassignment: (id, updates) => dispatch({ type: 'UPDATE_REASSIGNMENT', id, updates }),
        updateWaitlistConfig: (updates) => dispatch({ type: 'UPDATE_WAITLIST_CONFIG', updates }),
        showToast,
      }}
    >
      {children}
      <ToastContainer />
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export { useAppContext as useApp };
