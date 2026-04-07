/**
 * DemoWizardContext — React wrapper around demoGate for re-render triggers.
 * When a source is loaded/unloaded, this context updates so components re-render
 * with the new data availability.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isGuidedMode, isSourceLoaded, loadSource, unloadSource, loadAllSources, getLoadedSources, SOURCES_CHANGED_EVENT } from '@/services/demoGate';
import { ALL_SOURCE_IDS } from '@/config/demoSources';

const DemoWizardCtx = createContext(null);

export function DemoWizardProvider({ children }) {
  const guided = isGuidedMode();
  const [loaded, setLoaded] = useState(() => new Set(getLoadedSources()));
  const [wizardOpen, setWizardOpen] = useState(guided);
  // renderKey forces child tree to re-mount when sources change,
  // so service getter functions re-execute with new gate state
  const [renderKey, setRenderKey] = useState(0);

  // Listen for source changes (from demoGate module)
  useEffect(() => {
    const handler = () => {
      setLoaded(new Set(getLoadedSources()));
      setRenderKey(k => k + 1);
    };
    window.addEventListener(SOURCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SOURCES_CHANGED_EVENT, handler);
  }, []);

  const load = useCallback((id) => {
    loadSource(id);
  }, []);

  const unload = useCallback((id) => {
    unloadSource(id);
  }, []);

  const loadAll = useCallback(() => {
    loadAllSources(ALL_SOURCE_IDS);
  }, []);

  return (
    <DemoWizardCtx.Provider value={{
      isGuided: guided,
      loaded,
      loadedCount: loaded.size,
      totalCount: ALL_SOURCE_IDS.length,
      isLoaded: (id) => loaded.has(id),
      load,
      unload,
      loadAll,
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
