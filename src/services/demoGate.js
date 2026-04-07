/**
 * Demo Gate — controls which data sources are "loaded" in guided demo mode.
 * Module-level (not React) so services can call it synchronously.
 *
 * In full demo mode or authenticated mode, all sources return as loaded.
 * In guided demo mode, only explicitly loaded sources return data.
 */

const STORAGE_KEY = 'swoop_demo_sources';
const GUIDED_KEY = 'swoop_demo_guided';

// Event name dispatched when sources change (DemoWizardContext listens)
export const SOURCES_CHANGED_EVENT = 'swoop:demo-sources-changed';

export function isGuidedMode() {
  try {
    return localStorage.getItem(GUIDED_KEY) === 'true';
  } catch { return false; }
}

function getLoadedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function persistSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

/**
 * Check if a data source is available.
 * Returns true if: not in guided mode, OR the source has been loaded.
 */
export function isSourceLoaded(sourceId) {
  if (!isGuidedMode()) return true;
  return getLoadedSet().has(sourceId);
}

/**
 * Load a data source (guided mode only).
 * Persists to localStorage and dispatches event for React re-render.
 */
export function loadSource(sourceId) {
  const set = getLoadedSet();
  set.add(sourceId);
  persistSet(set);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { sourceId, action: 'load' } }));
}

/**
 * Unload a data source.
 */
export function unloadSource(sourceId) {
  const set = getLoadedSet();
  set.delete(sourceId);
  persistSet(set);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { sourceId, action: 'unload' } }));
}

/**
 * Load all sources at once.
 */
export function loadAllSources(sourceIds) {
  const set = new Set(sourceIds);
  persistSet(set);
  window.dispatchEvent(new CustomEvent(SOURCES_CHANGED_EVENT, { detail: { action: 'load-all' } }));
}

/**
 * Get list of currently loaded source IDs.
 */
export function getLoadedSources() {
  return [...getLoadedSet()];
}

/**
 * Reset guided mode (clear all loaded sources).
 */
export function resetGuidedMode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GUIDED_KEY);
  } catch {}
}
