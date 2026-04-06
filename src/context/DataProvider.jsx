// DataProvider.jsx — Phase 2 hydration layer
// Calls _init() on every service before rendering children.
// If any API call fails (Phase 1 mode / no DB), services fall back to static data silently.
// Components never change — they call the same synchronous service functions as always.

import { useState, useEffect, createContext, useContext } from 'react';
import { _init as initOps }      from '@/services/operationsService';
import { _init as initFB }       from '@/services/fbService';
import { _init as initMembers }  from '@/services/memberService';
import { _init as initStaffing } from '@/services/staffingService';
import { _init as initTrends }   from '@/services/trendsService';
import { _init as initBriefing } from '@/services/briefingService';
import { _init as initBoardReport } from '@/services/boardReportService';
import { _init as initCockpit }     from '@/services/cockpitService';
import { _init as initExperience }  from '@/services/experienceInsightsService';
import { _init as initAgents }      from '@/services/agentService';
import { _init as initIntegrations } from '@/services/integrationsService';
import { _init as initWeather }      from '@/services/weatherService';
// Removed from MVP init: pipeline, waitlist, location, teeSheetOps

const DataCtx = createContext({ phase: 1 });
export const useDataContext = () => useContext(DataCtx);

export function DataProvider({ children }) {
  const [phase, setPhase] = useState(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const rawFlag = import.meta.env?.VITE_API_ENABLED;
    const normalized = typeof rawFlag === 'string' ? rawFlag.trim().toLowerCase() : undefined;
    const disabledValues = ['false', '0', 'off', 'no'];
    const apiEnabled = normalized ? !disabledValues.includes(normalized) : true;

    // In Phase 1 (explicitly disabled), skip fetching — go straight to static data
    if (!apiEnabled) {
      setReady(true);
      return;
    }

    // 10-second timeout — Neon cold-starts can take 3-5s
    const timeout = new Promise(resolve =>
      setTimeout(() => resolve('timeout'), 10000)
    );

    Promise.race([
      Promise.allSettled([
        initOps(), initFB(), initMembers(), initStaffing(),
        initTrends(), initBriefing(),
        initBoardReport(), initCockpit(), initExperience(),
        initAgents(), initIntegrations(), initWeather(),
      ]),
      timeout,
    ]).then(results => {
      if (results !== 'timeout') {
        const anySucceeded = results.some(r => r.status === 'fulfilled');
        if (anySucceeded) setPhase(2);
      } else {
        console.info('[DataProvider] API timeout — using static data');
      }
      setReady(true);
    }).catch(err => {
      console.warn('[DataProvider] API hydration failed, using static data:', err);
      setError(err?.message);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-success-500 animate-spin" />
        <p className="text-gray-400 text-sm font-sans">
          Loading your club data…
        </p>
      </div>
    );
  }

  return (
    <DataCtx.Provider value={{ phase, apiError: error }}>
      {children}
    </DataCtx.Provider>
  );
}
