/**
 * Demo Gate — controls which data files are "imported" in guided demo mode.
 * Tracks individual file imports and resolves service-level gates from them.
 *
 * In full demo mode or authenticated mode, all sources return as loaded.
 * In guided demo mode, only explicitly imported files unlock their gate.
 */

const FILES_KEY = 'swoop_demo_files';
const GUIDED_KEY = 'swoop_demo_guided';

// Event name dispatched when files change (DemoWizardContext listens)
export const SOURCES_CHANGED_EVENT = 'swoop:demo-sources-changed';

// File-to-gate mapping (loaded lazily to avoid circular imports)
let _fileGateMap = null;
function getFileGateMap() {
  if (_fileGateMap) return _fileGateMap;
  // Build map from config — but avoid importing at module load to prevent circular deps
  // Instead, read from localStorage where we also store the gateId per file
  return {};
}

export function isGuidedMode() {
  try {
    return localStorage.getItem(GUIDED_KEY) === 'true';
  } catch { return false; }
}

function getLoadedFileSet() {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function getLoadedGateSet() {
  try {
    const raw = localStorage.getItem('swoop_demo_gates');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function persistFiles(fileSet, gateSet) {
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify([...fileSet]));
    localStorage.setItem('swoop_demo_gates', JSON.stringify([...gateSet]));
  } catch {}
}

/**
 * Check if a service-level gate is open.
 * Returns true if: not in guided mode, OR at least one file for this gate has been imported.
 */
export function isSourceLoaded(gateId) {
  if (!isGuidedMode()) return true;
  return getLoadedGateSet().has(gateId);
}

/**
 * Check if a specific file has been imported.
 */
export function isFileLoaded(fileId) {
  if (!isGuidedMode()) return true;
  return getLoadedFileSet().has(fileId);
}

/**
 * Import a file. Opens the corresponding gate.
 */
export function loadFile(fileId, gateId) {
  const files = getLoadedFileSet();
  const gates = getLoadedGateSet();
  files.add(fileId);
  if (gateId) gates.add(gateId);
  persistFiles(files, gates);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { fileId, gateId, action: 'load' } }));
}

/**
 * Remove a file import.
 */
export function unloadFile(fileId, gateId, allFilesForGate = []) {
  const files = getLoadedFileSet();
  const gates = getLoadedGateSet();
  files.delete(fileId);
  // Only close the gate if no other files for this gate are loaded
  if (gateId) {
    const otherFilesLoaded = allFilesForGate.some(f => f !== fileId && files.has(f));
    if (!otherFilesLoaded) gates.delete(gateId);
  }
  persistFiles(files, gates);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { fileId, gateId, action: 'unload' } }));
}

/**
 * Load all files and gates at once.
 */
export function loadAllFiles(fileIds, gateIds) {
  const files = new Set(fileIds);
  const gates = new Set(gateIds);
  persistFiles(files, gates);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { action: 'load-all' } }));
}

/**
 * Get lists of currently loaded file IDs and gate IDs.
 */
export function getLoadedFiles() {
  return [...getLoadedFileSet()];
}

export function getLoadedGates() {
  return [...getLoadedGateSet()];
}

/**
 * Reset guided mode (clear all loaded files and gates).
 */
export function resetGuidedMode() {
  try {
    localStorage.removeItem(FILES_KEY);
    localStorage.removeItem('swoop_demo_gates');
    localStorage.removeItem(GUIDED_KEY);
  } catch {}
}
