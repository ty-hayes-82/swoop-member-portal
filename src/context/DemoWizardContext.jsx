/**
 * DemoWizardContext — React wrapper around demoGate for re-render triggers.
 * Tracks individual file imports and provides re-render on any change.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isGuidedMode, isFileLoaded, loadFile, unloadFile, loadAllFiles, getLoadedFiles, getLoadedGates, SOURCES_CHANGED_EVENT } from '@/services/demoGate';
import { DEMO_FILES, ALL_FILE_IDS, ALL_SOURCE_IDS } from '@/config/demoSources';

const DemoWizardCtx = createContext(null);

export function DemoWizardProvider({ children }) {
  const guided = isGuidedMode();
  const [loadedFiles, setLoadedFiles] = useState(() => new Set(getLoadedFiles()));
  const [loadedGates, setLoadedGates] = useState(() => new Set(getLoadedGates()));
  const [wizardOpen, setWizardOpen] = useState(guided);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    const handler = () => {
      setLoadedFiles(new Set(getLoadedFiles()));
      setLoadedGates(new Set(getLoadedGates()));
      setRenderKey(k => k + 1);
    };
    window.addEventListener(SOURCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(SOURCES_CHANGED_EVENT, handler);
  }, []);

  const importFile = useCallback((fileId) => {
    const fileDef = DEMO_FILES.find(f => f.id === fileId);
    if (fileDef) loadFile(fileId, fileDef.gateId);
  }, []);

  const removeFile = useCallback((fileId) => {
    const fileDef = DEMO_FILES.find(f => f.id === fileId);
    const siblingIds = DEMO_FILES.filter(f => f.gateId === fileDef?.gateId).map(f => f.id);
    if (fileDef) unloadFile(fileId, fileDef.gateId, siblingIds);
  }, []);

  const importAll = useCallback(() => {
    loadAllFiles(ALL_FILE_IDS, ALL_SOURCE_IDS);
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
