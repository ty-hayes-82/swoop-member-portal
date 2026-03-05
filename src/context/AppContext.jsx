import { createContext, useContext, useReducer, useEffect } from 'react';

const PLAYBOOK_DEFS = {
  'slow-saturday':       { monthly: 8400,  annual: 100800 },
  'service-save':        { monthly: 18000, annual: 216000 },
  'engagement-decay':    { monthly: 9200,  annual: 110400 },
  'staffing-gap':        { monthly: 2100,  annual: 25200  },
  'peak-demand-capture': { monthly: 6200,  annual: 74400  },
};

// Step labels that appear in the activation trail after pressing Activate
const TRAIL_STEPS = {
  'slow-saturday':    ['📡 Ranger dispatch sent to holes 4, 8, 12, 16', '📋 Saturday tee intervals updated: 8 → 10 min', '✉ Recovery offer template activated for 4:30+ rounds'],
  'service-save':     ['🚩 James Whitfield flagged at front desk', '📢 F&B Director alerted with complaint details', '✉ GM personal alert: James Whitfield — 8K member, 4-day unresolved complaint', '🎁 Comp appetizer offer queued for James Whitfield'],
  'engagement-decay': ['📊 Weekly health scan scheduled (every Monday)', '✉ Personalized event invite campaign queued for 30 declining members', '🚩 Non-responder follow-up flagged for Week 3'],
  'staffing-gap':     ['📊 72-hour shift gap detection enabled', '📢 Flex pool (4 staff) notified for Grill Room backup', '📅 Post-day audit report scheduled daily'],
  'peak-demand-capture': ['📊 5 at-risk members identified in Saturday AM waitlist', '📣 Priority cancellation alerts queued for retention-flagged members', '🎁 Post-round lunch reservation attached to waitlist notifications', '📢 F&B Director notified: prep for +15% Saturday covers', '📈 Visit session tracking enabled: tee fill → dining conversion → health delta'],
};

const initialState = {
  currentDate: '2026-01-17',
  playbooks: {
    'slow-saturday':       { active: false, activatedAt: null },
    'service-save':        { active: false, activatedAt: null },
    'engagement-decay':    { active: false, activatedAt: null },
    'staffing-gap':        { active: false, activatedAt: null },
    'peak-demand-capture': { active: false, activatedAt: null },
  },
  trailProgress: {
    'slow-saturday': 0, 'service-save': 0, 'engagement-decay': 0, 'staffing-gap': 0, 'peak-demand-capture': 0,
  },
};

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
          [action.id]: Math.min(
            (state.trailProgress[action.id] ?? 0) + 1,
            (TRAIL_STEPS[action.id]?.length ?? 0)
          ),
        },
      };
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const activePlaybooks = Object.entries(state.playbooks).filter(([, v]) => v.active);
  const totalRevenueImpact = {
    monthly: activePlaybooks.reduce((s, [id]) => s + (PLAYBOOK_DEFS[id]?.monthly ?? 0), 0),
    annual:  activePlaybooks.reduce((s, [id]) => s + (PLAYBOOK_DEFS[id]?.annual  ?? 0), 0),
  };

  // Auto-advance trail steps with staggered delays when a playbook is activated
  useEffect(() => {
    activePlaybooks.forEach(([id]) => {
      const total = TRAIL_STEPS[id]?.length ?? 0;
      const current = state.trailProgress[id] ?? 0;
      if (current < total) {
        const timer = setTimeout(() => dispatch({ type: 'ADVANCE_TRAIL', id }), 700);
        return () => clearTimeout(timer);
      }
    });
  }, [state.trailProgress, state.playbooks]);

  return (
    <AppContext.Provider value={{
      ...state,
      dispatch,
      activeCount: activePlaybooks.length,
      totalPlaybooks: Object.keys(state.playbooks).length,
      totalRevenueImpact,
      playbookDefs: PLAYBOOK_DEFS,
      trailSteps: TRAIL_STEPS,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
export { useAppContext as useApp };
