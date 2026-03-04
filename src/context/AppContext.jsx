import { createContext, useContext, useReducer } from 'react';

const PLAYBOOK_DEFS = {
  'slow-saturday':    { monthly: 8400,  annual: 100800 },
  'service-save':     { monthly: 18000, annual: 216000 },
  'engagement-decay': { monthly: 9200,  annual: 110400 },
  'staffing-gap':     { monthly: 2100,  annual: 25200  },
};

const initialState = {
  currentDate: '2026-01-17',
  playbooks: {
    'slow-saturday':    { active: false, activatedAt: null },
    'service-save':     { active: false, activatedAt: null },
    'engagement-decay': { active: false, activatedAt: null },
    'staffing-gap':     { active: false, activatedAt: null },
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'ACTIVATE_PLAYBOOK':
      return {
        ...state,
        playbooks: {
          ...state.playbooks,
          [action.id]: { active: true, activatedAt: new Date().toISOString() },
        },
      };
    case 'DEACTIVATE_PLAYBOOK':
      return {
        ...state,
        playbooks: {
          ...state.playbooks,
          [action.id]: { active: false, activatedAt: null },
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

  return (
    <AppContext.Provider value={{
      ...state,
      dispatch,
      activeCount: activePlaybooks.length,
      totalPlaybooks: Object.keys(state.playbooks).length,
      totalRevenueImpact,
      playbookDefs: PLAYBOOK_DEFS,
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
