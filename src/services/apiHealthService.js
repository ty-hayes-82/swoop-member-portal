/**
 * apiHealthService — read-only client for the public /api/health endpoint.
 *
 * The health endpoint is unauthenticated and returns the current state of:
 *   - DB connectivity (`db: 'ok' | 'fail'`)
 *   - Per-integration sync freshness (`integrations.weather`, `integrations.audit`)
 *   - Build version + uptime
 *
 * This service exists so that any UI surface (Admin Hub, Data Health
 * Dashboard, Today View status row) can render data trust signals from the
 * SAME source the on-call engineer uses. PRODUCT-FINALIZATION criterion 7
 * shipped the integrations block on 2026-04-09; this service is the front-end
 * consumer that turns those signals into pillar-aligned visibility.
 *
 * Schema (mirrors api/health.js):
 *   {
 *     status: 'ok' | 'degraded',
 *     timestamp: ISO,
 *     version: string,
 *     db: 'ok' | 'fail',
 *     dbLatencyMs: number | null,
 *     uptimeSec: number,
 *     node: string,
 *     responseTimeMs: number,
 *     integrations: {
 *       weather: { status: 'ok' | 'stale' | 'unknown', lastSync: ISO|null, ageMin: number|null },
 *       audit:   { status: 'ok' | 'stale' | 'unknown', rows: number|null, oldestRow: ISO|null },
 *     }
 *   }
 *
 * NOTE: this service does NOT use apiClient.apiFetch — /api/health is
 * unauthenticated by design (load balancers + uptime monitors hit it
 * without credentials), so we use raw fetch and never send a Bearer token.
 */

const HEALTH_PATH = '/api/health';

// Module-level cache so multiple components rendering on the same page
// don't fan out to the endpoint. Refreshed every CACHE_TTL_MS.
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 30_000;

/**
 * Fetch the current health snapshot. Returns null on network failure
 * (the endpoint is allowed to be unreachable; we never throw).
 */
export async function getHealthSnapshot({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && _cache && now - _cacheAt < CACHE_TTL_MS) {
    return _cache;
  }
  try {
    const res = await fetch(HEALTH_PATH, {
      method: 'GET',
      cache: 'no-store',
      // No Authorization header — endpoint is public.
    });
    if (!res.ok) return null;
    const body = await res.json();
    _cache = body;
    _cacheAt = now;
    return body;
  } catch {
    return null;
  }
}

/**
 * Returns a simplified rollup the UI can render directly:
 *   {
 *     overall:    'ok' | 'degraded' | 'unknown',
 *     db:         { status, latencyMs },
 *     integrations: [
 *       { name, status, lastSync, ageMin, badge, hint },
 *       ...
 *     ],
 *     fetchedAt:  ISO,
 *   }
 *
 * `badge` is a one-letter sigil suitable for compact UI rendering.
 * `hint` is a short human-readable line explaining the current state.
 */
export async function getHealthRollup() {
  const snap = await getHealthSnapshot();
  if (!snap) {
    return {
      overall: 'unknown',
      db: { status: 'unknown', latencyMs: null },
      integrations: [],
      fetchedAt: null,
    };
  }

  const ints = snap.integrations || {};

  const formatAge = (ageMin) => {
    if (ageMin == null) return null;
    if (ageMin < 60) return `${ageMin} min ago`;
    const h = Math.round(ageMin / 60);
    if (h < 48) return `${h} h ago`;
    return `${Math.round(h / 24)} d ago`;
  };

  const integrations = [];

  if (ints.weather) {
    const w = ints.weather;
    integrations.push({
      name: 'Weather sync',
      key: 'weather',
      status: w.status,
      lastSync: w.lastSync,
      ageMin: w.ageMin,
      badge: w.status === 'ok' ? '✓' : w.status === 'stale' ? '!' : '?',
      hint: w.status === 'ok'
        ? `Last synced ${formatAge(w.ageMin) || 'recently'}`
        : w.status === 'stale'
          ? `Stale — last sync ${formatAge(w.ageMin) || 'over budget'}`
          : 'No sync data yet (fresh DB or cron has not run)',
    });
  }

  if (ints.audit) {
    const a = ints.audit;
    integrations.push({
      name: 'Cross-club audit purge',
      key: 'audit',
      status: a.status,
      rows: a.rows,
      oldestRow: a.oldestRow,
      badge: a.status === 'ok' ? '✓' : a.status === 'stale' ? '!' : '?',
      hint: a.status === 'ok'
        ? `${a.rows ?? 0} rows in audit table${a.oldestRow ? `, oldest ${new Date(a.oldestRow).toLocaleDateString()}` : ''}`
        : a.status === 'stale'
          ? `Purge cron may be failing — oldest row is older than the 90-day retention budget`
          : 'No audit data yet',
    });
  }

  return {
    overall: snap.status || 'unknown',
    db: { status: snap.db, latencyMs: snap.dbLatencyMs },
    integrations,
    fetchedAt: snap.timestamp,
  };
}

/** Test-only helper: clear the in-memory cache. */
export function _clearHealthCache() {
  _cache = null;
  _cacheAt = 0;
}
