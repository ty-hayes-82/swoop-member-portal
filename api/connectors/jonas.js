/**
 * api/connectors/jonas.js
 *
 * Jonas Club Software connector proxy.
 * Agent code calls these functions — credentials are injected here and never
 * surface to the caller or appear in the context window.
 */

import { get } from '../vault/credential-store.js';

const JONAS_BASE_URL = process.env.JONAS_API_URL || 'https://api.jonas.example.com';

/**
 * Fetch members from Jonas.
 *
 * @param {string} clubId
 * @param {object} [filter] — e.g. { status: 'active', tier: 'full' }
 * @returns {Promise<object[]>}
 */
export async function fetchMembers(clubId, filter = {}) {
  const token = await get(clubId, 'jonas_api_key');
  if (!token) {
    console.warn('[jonas] no credential configured for club', clubId);
    return [];
  }
  const url = new URL('/v1/members', JONAS_BASE_URL);
  Object.entries(filter).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Jonas fetchMembers failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch member account balance / invoice summary.
 *
 * @param {string} clubId
 * @param {string} memberId
 * @returns {Promise<object>}
 */
export async function fetchMemberAccount(clubId, memberId) {
  const token = await get(clubId, 'jonas_api_key');
  if (!token) return null;
  const res = await fetch(`${JONAS_BASE_URL}/v1/members/${memberId}/account`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Jonas fetchMemberAccount failed: ${res.status}`);
  return res.json();
}
