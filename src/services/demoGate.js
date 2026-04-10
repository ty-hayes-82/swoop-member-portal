/**
 * Demo Gate — single source of truth for data mode.
 *
 * Three modes:
 *   'live'    — Real authenticated club. API data only, zero static fallback.
 *   'demo'    — Full demo mode. All static data from src/data/ loaded.
 *   'guided'  — Guided demo. Static data gated per imported file.
 *
 * Every service getter should call getDataMode() and branch accordingly.
 */

import { invalidateGuidedScores } from './guidedScoring';

const FILES_KEY = 'swoop_demo_files';
const GUIDED_KEY = 'swoop_demo_guided';

// Event name dispatched when files change (DemoWizardContext listens)
export const SOURCES_CHANGED_EVENT = 'swoop:demo-sources-changed';

// Use sessionStorage for guided demo state — clears when browser closes
// This ensures each demo session starts fresh
const _store = typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;

export function isGuidedMode() {
  try {
    return _store.getItem(GUIDED_KEY) === 'true';
  } catch { return false; }
}

/**
 * Returns the current data mode: 'live' | 'demo' | 'guided'
 * Every service should branch on this instead of ad-hoc checks.
 */
export function getDataMode() {
  try {
    const clubId = localStorage.getItem('swoop_club_id');
    const isReal = !!clubId && clubId !== 'demo' && !clubId.startsWith('demo_');
    if (isReal) return 'live';
    if (isGuidedMode()) return 'guided';
    return 'demo';
  } catch { return 'demo'; }
}

/**
 * Shorthand: should this service return static data for the given gate?
 * Returns true if mode is demo, or mode is guided AND gate is open.
 * Returns false if mode is live (never use static) or gate is closed.
 */
export function shouldUseStatic(gateId) {
  // 'events' is an alias — event files use the 'email' gate
  if (gateId === 'events') gateId = 'email';
  const mode = getDataMode();
  if (mode === 'live') return false;
  if (mode === 'guided') return isSourceLoaded(gateId);
  return true; // demo mode — always use static
}

function getLoadedFileSet() {
  try {
    const raw = _store.getItem(FILES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function getLoadedGateSet() {
  try {
    const raw = _store.getItem('swoop_demo_gates');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function persistFiles(fileSet, gateSet) {
  try {
    _store.setItem(FILES_KEY, JSON.stringify([...fileSet]));
    _store.setItem('swoop_demo_gates', JSON.stringify([...gateSet]));
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
  // Invalidate guided scoring cache so scores recalculate with new data.
  // Static import below; the guidedScoring <-> demoGate cycle is safe because
  // guidedScoring only references demoGate exports inside function bodies.
  try { invalidateGuidedScores(); } catch {}
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
    _store.removeItem(FILES_KEY);
    _store.removeItem('swoop_demo_gates');
    _store.removeItem(GUIDED_KEY);
  } catch {}
}
