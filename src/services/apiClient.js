/**
 * API Client — authenticated fetch wrapper for service _init() calls
 * Reads auth token from localStorage. In demo mode, passes demo club header.
 * Falls back gracefully if no auth is available (Phase 1 static data mode).
 */
import { logError } from '../utils/logError';

function getAuthHeaders() {
  if (typeof localStorage === 'undefined') return {};

  const token = localStorage.getItem('swoop_auth_token');
  const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');

  if (token && token !== 'demo') {
    return { Authorization: `Bearer ${token}` };
  }

  // Demo mode — no token, but we identify the demo club
  if (user?.isDemoSession || user?.clubId === 'demo' || user?.clubId?.startsWith('demo_')) {
    return { 'X-Demo-Club': user.clubId?.startsWith('demo_') ? user.clubId : 'club_001' };
  }

  return {};
}

export function getClubId() {
  if (typeof localStorage === 'undefined') return null;
  const clubId = localStorage.getItem('swoop_club_id');
  if (clubId) return clubId;

  // Fallback: check user object
  const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
  return user?.clubId || null;
}

export function isDemo() {
  const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
  return user?.clubId === 'demo' || user?.userId === 'demo' || user?.isDemoSession === true || user?.clubId?.startsWith('demo_');
}

/**
 * Authenticated fetch — adds Bearer token or demo headers automatically.
 * Returns null on auth failure (lets caller fall back to static data).
 */
export async function apiFetch(url, options = {}) {
  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders, ...(options.headers || {}) };

  // Timeout: abort after 15 seconds to prevent hanging on slow/dead servers
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let res;
  try {
    res = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    // Network offline, DNS failure, or timeout — return null like a failed request
    logError(new Error(`[apiFetch] Network error on ${url}: ${err.name}`), { level: 'warning', service: 'apiClient' });
    return null;
  }
  clearTimeout(timeout);

  if (res.status === 401) {
    // Session expired — notify the app so it can show re-login prompt
    logError(new Error(`[apiFetch] 401 on ${url} — session expired`), { level: 'warning', service: 'apiClient' });
    window.dispatchEvent(new CustomEvent('swoop:session-expired'));
    return null;
  }

  if (!res.ok) {
    logError(new Error(`[apiFetch] ${res.status} on ${url}`), { level: 'warning', service: 'apiClient' });
    return null;
  }

  return res.json();
}
