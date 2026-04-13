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
 * Returns true when static demo data should be shown.
 * Demo mode: always true. Live mode: always false.
 * The gateId parameter is accepted for call-site compatibility but unused.
 */
export function isGateOpen(_gateId) {
  return getDataMode() === 'demo';
}
