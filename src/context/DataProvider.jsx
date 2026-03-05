// DataProvider.jsx — Phase 2 hydration layer
// Calls _init() on every service before rendering children.
// If any API call fails (Phase 1 mode / no DB), services fall back to static data silently.
// Components never change — they call the same synchronous service functions as always.

import { useState, useEffect, createContext, useContext } from 'react';
import { theme } from '@/config/theme';
import { _init as initOps }      from '@/services/operationsService';
import { _init as initFB }       from '@/services/fbService';
import { _init as initMembers }  from '@/services/memberService';
import { _init as initStaffing } from '@/services/staffingService';
import { _init as initPipeline } from '@/services/pipelineService';
import { _init as initTrends }   from '@/services/trendsService';
import { _init as initWaitlist } from '@/services/waitlistService';
import { _init as initBriefing } from '@/services/briefingService';

const DataCtx = createContext({ phase: 1 });
export const useDataContext = () => useContext(DataCtx);

export function DataProvider({ children }) {
  const [phase, setPhase] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In Phase 1 (no VITE_API_ENABLED), skip fetching — go straight to static data
    if (!import.meta.env.VITE_API_ENABLED) {
      setReady(true);
      return;
    }

    Promise.allSettled([
      initOps(), initFB(), initMembers(), initStaffing(),
      initPipeline(), initTrends(), initWaitlist(), initBriefing(),
    ]).then(results => {
      const anySucceeded = results.some(r => r.status === 'fulfilled');
      if (anySucceeded) setPhase(2);
      setReady(true);
    }).catch(err => {
      console.warn('[DataProvider] API hydration failed, using static data:', err);
      setError(err?.message);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `3px solid ${theme.colors.border}`,
          borderTopColor: theme.colors.operations,
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.sans }}>
          Loading Oakmont Hills…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <DataCtx.Provider value={{ phase, apiError: error }}>
      {children}
    </DataCtx.Provider>
  );
}
