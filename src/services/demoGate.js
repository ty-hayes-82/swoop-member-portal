/**
 * Demo Gate — data mode detection.
 * 'live' — Real authenticated club (API data only, zero static fallback).
 * 'demo' — Full demo mode (all static data from src/data/ loaded).
 */

export function getDataMode() {
  try {
    const clubId = localStorage.getItem('swoop_club_id');
    const isReal = !!clubId && clubId !== 'demo' && !clubId.startsWith('demo_');
    if (isReal) return 'live';
    return 'demo';
  } catch { return 'demo'; }
}

/**
 * Returns true when a data domain is available.
 *
 * Demo mode: all gates open (static data covers every domain).
 * Live mode: reads from the gate cache written by DataProvider on init.
 *   DataProvider calls GET /api/gates after services init and stores the JSON
 *   object in localStorage under 'swoop_gates'.
 *
 * Gate IDs: 'members' | 'tee-sheet' | 'fb' | 'complaints' | 'email' | 'pace'
 */
export function isGateOpen(gateId) {
  if (getDataMode() === 'demo') return true;
  try {
    const raw = localStorage.getItem('swoop_gates');
    if (!raw) return false;
    const gates = JSON.parse(raw);
    return gates[gateId] === true;
  } catch { return false; }
}

/**
 * Write gate state into localStorage. Called by DataProvider after /api/gates
 * responds. Passing null clears the cache (forces re-fetch on next init).
 */
export function setGateCache(gates) {
  try {
    if (gates === null) {
      localStorage.removeItem('swoop_gates');
    } else {
      localStorage.setItem('swoop_gates', JSON.stringify(gates));
    }
  } catch { /* ignore quota errors */ }
}
