/**
 * api/connectors/foretees.js
 *
 * ForeTees tee sheet connector proxy.
 * Agent code calls these functions — credentials are injected here and never
 * surface to the caller or appear in the context window.
 */

import { get } from '../vault/credential-store.js';

const FORETEES_BASE_URL = process.env.FORETEES_API_URL || 'https://api.foretees.example.com';

/**
 * Fetch available tee times for a given date range.
 *
 * @param {string} clubId
 * @param {object} opts — { startDate, endDate, courseId? }
 * @returns {Promise<object[]>}
 */
export async function fetchTeeTimes(clubId, { startDate, endDate, courseId } = {}) {
  const token = await get(clubId, 'foretees_api_key');
  if (!token) {
    console.warn('[foretees] no credential configured for club', clubId);
    return [];
  }
  const url = new URL('/v1/tee-times', FORETEES_BASE_URL);
  if (startDate) url.searchParams.set('start_date', startDate);
  if (endDate) url.searchParams.set('end_date', endDate);
  if (courseId) url.searchParams.set('course_id', courseId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ForeTees fetchTeeTimes failed: ${res.status}`);
  return res.json();
}

/**
 * Book a tee time.
 *
 * @param {string} clubId
 * @param {object} booking — { memberId, date, time, courseId, players }
 * @returns {Promise<object>}
 */
export async function bookTeeTime(clubId, booking) {
  const token = await get(clubId, 'foretees_api_key');
  if (!token) throw new Error('ForeTees credential not configured');
  const res = await fetch(`${FORETEES_BASE_URL}/v1/tee-times/book`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error(`ForeTees bookTeeTime failed: ${res.status}`);
  return res.json();
}
