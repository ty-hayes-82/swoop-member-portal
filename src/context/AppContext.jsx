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
import { apiFetch } from '@/services/apiClient';
import { trackAction, checkRecentOutreach } from '@/services/activityService';

const PLAYBOOK_DEFS = {
  'service-save': { monthly: 18000, annual: 216000 },
  'new-member-90day': { monthly: 22000, annual: 264000 },
  'staffing-gap': { monthly: 2100, annual: 25200 },
  'engagement-decay': { monthly: 9000, annual: 108000 },
};

const TRAIL_STEPS = {
  'service-save': ['🚩 James Whitfield flagged at front desk', '📢 F&B Director alerted with complaint details', '✉ GM personal alert: James Whitfield — 8K member, 4-day unresolved complaint', '🎁 Comp appetizer offer queued for James Whitfield'],
  'new-member-90day': ['🤝 Member matched with compatible golfers', '🎉 Family event invitation sent', '📞 Concierge check-in scheduled', '📋 90-day pulse survey queued'],
  'staffing-gap': ['📊 72-hour shift gap detection enabled', '📢 Flex pool (4 staff) notified for Grill Room backup', '📅 Post-day audit report scheduled daily'],
  'engagement-decay': ['📊 Weekly health scan flagged 30 declining members', '✉ 30 personalized re-engagement emails queued', '🚩 Non-responders flagged for GM personal outreach'],
};

const defaultAgents = getAgents();
const defaultStatuses = Object.fromEntries(defaultAgents.map((agent) => [agent.id, agent.status]));

// Start with static agent actions as inbox; overwritten by API data when available
const defaultInbox = getAllActions();
const initialState = {
  currentDate: new Date().toISOString().split('T')[0],
  playbooks: {
    'service-save': { active: false, activatedAt: null },
    'new-member-90day': { active: false, activatedAt: null },
    'staffing-gap': { active: false, activatedAt: null },
    'engagement-decay': { active: false, activatedAt: null },
  },
  trailProgress: {
    'service-save': 0,
    'new-member-90day': 0,
    'staffing-gap': 0,
    'engagement-decay': 0,
  },
  inbox: defaultInbox,
  pendingCount: defaultInbox.filter(a => a.status === 'pending').length,
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
    // In guided demo mode, don't load persisted inbox from a previous session
    // — start fresh so only activated gates produce data
    const isGuided = sessionStorage.getItem('swoop_demo_guided') === 'true';

    const inbox = isGuided ? null : JSON.parse(localStorage.getItem('swoop_agent_inbox') || 'null');
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

  async function approveAction(id, meta = {}) {
    approveAgentServiceAction(id, meta);
    dispatch({ type: 'APPROVE_ACTION', id, meta });

    const actionItem = state.inbox.find(a => a.id === id);
    trackAction({
      actionType: 'approve',
      actionSubtype: meta.executionType || 'general',
      memberId: meta.memberId || actionItem?.memberId || null,
      memberName: meta.memberName || actionItem?.memberName || null,
      agentId: actionItem?.agentId || null,
      referenceId: id,
      referenceType: 'action',
      description: `Approved: ${actionItem?.description || id}`,
    });

    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId) return;

    const execType = meta.executionType || 'staff_task';

    // Warn if member was recently contacted
    if (['email', 'sms', 'call'].includes(execType)) {
      const check = checkRecentOutreach(meta.memberId || actionItem?.memberId);
      if (check.recentlyContacted) {
        showToast(`Warning: ${meta.memberName || actionItem?.memberName || 'This member'} was last contacted ${check.hoursAgo}h ago (${check.lastContact?.type}). Proceeding anyway.`, 'warning');
      }
    }
    const demoEmail = localStorage.getItem('swoop_demo_email') || '';
    const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
    const emailSendMode = localStorage.getItem('swoop_email_send_mode') || 'local';
    const smsSendMode = localStorage.getItem('swoop_sms_send_mode') || 'local';

    // Use actionItem found above for local send
    const memberName = actionItem?.memberName || meta.memberName || 'Member';
    const description = meta.customMessage || actionItem?.description || '';

    // ── Gmail draft: AI-generated content opened in Gmail compose ──
    if (execType === 'email' && emailSendMode === 'gmail') {
      const toAddr = demoEmail || meta.memberEmail || '';
      try {
        const draft = await apiFetch('/api/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: meta.memberId,
            draftType: 'email',
            context: description,
            templateHint: meta.templateId,
          }),
        });
        const subject = encodeURIComponent(draft?.subject || `A note from your club`);
        const body = encodeURIComponent(draft?.body || description);
        const to = encodeURIComponent(toAddr || draft?.memberEmail || '');
        window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`, '_blank');
      } catch {
        // Fallback: open Gmail with generic content
        const subject = encodeURIComponent(`A personal note from your club`);
        const body = encodeURIComponent(`Dear ${memberName},\n\n${description}\n\nWarm regards`);
        window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(toAddr)}&su=${subject}&body=${body}`, '_blank');
      }
      return;
    }

    // ── Local email: AI-generated content in mailto: ──
    if (execType === 'email' && emailSendMode === 'local') {
      const toAddr = demoEmail || meta.memberEmail || '';
      try {
        const draft = await apiFetch('/api/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: meta.memberId,
            draftType: 'email',
            context: description,
            templateHint: meta.templateId,
          }),
        });
        const subject = encodeURIComponent(draft?.subject || `A personal note from your club`);
        const body = encodeURIComponent(draft?.body || `Dear ${memberName},\n\n${description}\n\nWarm regards`);
        window.open(`mailto:${toAddr}?subject=${subject}&body=${body}`, '_self');
      } catch {
        const subject = encodeURIComponent(`A personal note from your club`);
        const body = encodeURIComponent(`Dear ${memberName},\n\n${description}\n\nWe value your membership and would love to hear from you.\n\nWarm regards`);
        window.open(`mailto:${toAddr}?subject=${subject}&body=${body}`, '_self');
      }
      return;
    }

    // ── Local SMS: AI-generated content in sms: link ──
    if (execType === 'sms' && smsSendMode === 'local') {
      const toNum = demoPhone || meta.memberPhone || '';
      try {
        const draft = await apiFetch('/api/generate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: meta.memberId,
            draftType: 'sms',
            context: description,
          }),
        });
        const body = encodeURIComponent(draft?.body || description || `Hi ${memberName}, just checking in from the club.`);
        window.open(`sms:${toNum}?&body=${body}`, '_self');
      } catch {
        const body = encodeURIComponent(description || `Hi ${memberName}, just checking in from the club.`);
        window.open(`sms:${toNum}?&body=${body}`, '_self');
      }
      return;
    }

    // ── Cloud send: call API (SendGrid / Twilio) ──
    // Skip cloud send for quick actions with no real DB action record
    if (meta.skipCloudSend) return;
    const token = localStorage.getItem('swoop_auth_token');
    const authHeaders = token && token !== 'demo' ? { Authorization: `Bearer ${token}` } : { 'X-Demo-Club': clubId };
    fetch('/api/execute-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        actionId: id, clubId,
        executionType: execType,
        memberId: meta.memberId || null,
        senderName: meta.approvalAction || 'GM',
        customMessage: description,
        templateId: meta.templateId || 'personal_note',
        ...(demoEmail ? { demoOverrideEmail: demoEmail } : {}),
        ...(demoPhone ? { demoOverridePhone: demoPhone } : {}),
      }),
    }).then(r => {
      if (r && !r.ok) showToast('Action may not have been delivered — check status', 'error');
    }).catch(() => {
      showToast('Failed to send action — please retry', 'error');
    });
  }

  function dismissAction(id, meta = {}) {
    dismissAgentServiceAction(id, meta);
    dispatch({ type: 'DISMISS_ACTION', id, meta });

    const actionItem = state.inbox.find(a => a.id === id);
    trackAction({
      actionType: 'dismiss',
      actionSubtype: meta.reason || 'no_reason',
      memberId: actionItem?.memberId || null,
      memberName: actionItem?.memberName || null,
      agentId: actionItem?.agentId || null,
      referenceId: id,
      referenceType: 'action',
      description: `Dismissed: ${actionItem?.description || id}`,
    });
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
