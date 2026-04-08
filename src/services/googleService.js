/**
 * Google Integration Service
 * Manages Google OAuth connection state and API calls for Calendar + Gmail.
 */
import { apiFetch } from './apiClient';

const CACHE_KEY = 'swoop_google_status';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if Google is connected for the current user.
 * Caches the result for 5 minutes.
 */
export async function getGoogleStatus() {
  // Check cache first
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached._ts < CACHE_TTL) {
      return cached;
    }
  } catch {}

  try {
    const status = await apiFetch('/api/google/status');
    // Cache it
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...status, _ts: Date.now() }));
    return status;
  } catch {
    return { connected: false };
  }
}

/**
 * Clear cached Google status (call after connect/disconnect).
 */
export function clearGoogleStatusCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Get the Google OAuth URL to initiate connection.
 */
export function getGoogleAuthUrl() {
  const token = localStorage.getItem('swoop_auth_token') || '';
  const returnUrl = encodeURIComponent('/#/profile');
  return `/api/google/auth?returnUrl=${returnUrl}&token=${token}`;
}

/**
 * Disconnect Google account.
 */
export async function disconnectGoogle() {
  const result = await apiFetch('/api/google/disconnect', { method: 'POST' });
  clearGoogleStatusCache();
  return result;
}

/**
 * Create a Google Calendar event for a scheduled call.
 */
export async function createCalendarEvent({ memberName, memberId, scheduledTime, talkingPoints, duration }) {
  return apiFetch('/api/google/calendar-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberName, memberId, scheduledTime, talkingPoints, duration }),
  });
}

/**
 * Create a Gmail draft.
 */
export async function createGmailDraft({ to, subject, body }) {
  return apiFetch('/api/google/gmail-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body }),
  });
}
