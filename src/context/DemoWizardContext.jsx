/**
 * DemoWizardContext — React wrapper around demoGate for re-render triggers.
 * Tracks individual file imports and provides re-render on any change.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isGuidedMode, isFileLoaded, loadFile, unloadFile, loadAllFiles, resetGuidedMode, getLoadedFiles, getLoadedGates, SOURCES_CHANGED_EVENT } from '@/services/demoGate';
import { DEMO_FILES, ALL_FILE_IDS, ALL_SOURCE_IDS, FILE_GROUPS } from '@/config/demoSources';
import { refreshWeatherForLocation } from '@/services/weatherService';
import { apiFetch } from '@/services/apiClient';

const DemoWizardCtx = createContext(null);

export function DemoWizardProvider({ children }) {
  const guided = isGuidedMode();
  const [loadedFiles, setLoadedFiles] = useState(() => new Set(getLoadedFiles()));
  const [loadedGates, setLoadedGates] = useState(() => new Set(getLoadedGates()));
  const [wizardOpen, setWizardOpen] = useState(guided);
  const [renderKey, setRenderKey] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const handler = () => {
      setLoadedFiles(new Set(getLoadedFiles()));
      setLoadedGates(new Set(getLoadedGates()));
      setRenderKey(k => k + 1);
    };
    window.addEventListener(SOURCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SOURCES_CHANGED_EVENT, handler);
  }, []);

  const importFile = useCallback(async (fileId) => {
    const fileDef = DEMO_FILES.find(f => f.id === fileId);
    if (!fileDef) return;

    // Track file in UI via demoGate (sessionStorage)
    loadFile(fileId, fileDef.gateId);

    // Call real API to copy seed data for this category
    setImporting(true);
    try {
      await apiFetch('/api/guided-copy', {
        method: 'POST',
        body: JSON.stringify({ category: fileDef.gateId }),
      });
      window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: fileDef.gateId } }));
    } catch (err) {
      console.error('[DemoWizard] guided-copy failed:', err);
    } finally {
      setImporting(false);
    }

    // When club profile is imported, extract city/state and connect weather
    if (fileId === 'JCM_Club_Profile') {
      try {
        const res = await fetch('/demo-data/JCM_Club_Profile.csv');
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n');
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map(h => h.trim());
            const values = lines[1].split(',').map(v => v.trim());
            const cityIdx = headers.indexOf('City');
            const stateIdx = headers.indexOf('State');
            const nameIdx = headers.indexOf('Club Name');
            const latIdx = headers.indexOf('Latitude');
            const lngIdx = headers.indexOf('Longitude');
            const tzIdx = headers.indexOf('Timezone');
            if (cityIdx >= 0 && values[cityIdx] && values[cityIdx] !== 'Unknown') {
              localStorage.setItem('swoop_club_city', values[cityIdx]);
              if (stateIdx >= 0) localStorage.setItem('swoop_club_state', values[stateIdx]);
              if (nameIdx >= 0) localStorage.setItem('swoop_club_name', values[nameIdx]);
              if (latIdx >= 0 && values[latIdx]) localStorage.setItem('swoop_club_lat', values[latIdx]);
              if (lngIdx >= 0 && values[lngIdx]) localStorage.setItem('swoop_club_lng', values[lngIdx]);
              if (tzIdx >= 0 && values[tzIdx]) localStorage.setItem('swoop_club_tz', values[tzIdx]);
              refreshWeatherForLocation().then(() => {
                setRenderKey(k => k + 1);
              });
            }
          }
        }
      } catch {}
    }
  }, []);

  const removeFile = useCallback((fileId) => {
    const fileDef = DEMO_FILES.find(f => f.id === fileId);
    const siblingIds = DEMO_FILES.filter(f => f.gateId === fileDef?.gateId).map(f => f.id);
    if (fileDef) unloadFile(fileId, fileDef.gateId, siblingIds);
  }, []);

  const importAll = useCallback(async () => {
    // Track all files in UI via demoGate
    loadAllFiles(ALL_FILE_IDS, ALL_SOURCE_IDS);

    // Copy seed data category-by-category (order matters for FK dependencies)
    const categoryOrder = ['pipeline', 'members', 'tee-sheet', 'fb', 'complaints', 'email', 'weather', 'pace', 'agents'];
    setImporting(true);
    try {
      for (const category of categoryOrder) {
        await apiFetch('/api/guided-copy', {
          method: 'POST',
          body: JSON.stringify({ category }),
        });
      }
      window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: 'agents' } }));
    } catch (err) {
      console.error('[DemoWizard] guided-copy importAll failed:', err);
    } finally {
      setImporting(false);
    }
  }, []);

  const startOver = useCallback(() => {
    resetGuidedMode();
    // Clear persisted inbox and agent state
    localStorage.removeItem('swoop_agent_inbox');
    localStorage.removeItem('swoop_agent_statuses');
    localStorage.removeItem('swoop_agent_configs');
    // Clear club location so weather doesn't re-fetch on reload
    localStorage.removeItem('swoop_club_city');
    localStorage.removeItem('swoop_club_state');
    // Re-enter guided mode
    sessionStorage.setItem('swoop_demo_guided', 'true');
    // Reload the page to reset all service singletons
    window.location.reload();
  }, []);

  return (
    <DemoWizardCtx.Provider value={{
      isGuided: guided,
      loadedFiles,
      loadedGates,
      fileCount: loadedFiles.size,
      totalFiles: DEMO_FILES.length,
      isFileImported: (fileId) => loadedFiles.has(fileId),
      isGateOpen: (gateId) => loadedGates.has(gateId),
      importFile,
      removeFile,
      importAll,
      importing,
      startOver,
      wizardOpen,
      setWizardOpen,
      renderKey,
    }}>
      {children}
    </DemoWizardCtx.Provider>
  );
}

export function useDemoWizard() {
  return useContext(DemoWizardCtx);
}
