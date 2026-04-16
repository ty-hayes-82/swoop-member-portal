/**
 * api/vault/credential-store.js
 *
 * Secure credential vault for vendor API tokens.
 * Tokens are AES-256-GCM encrypted at rest in the club_credentials table.
 * Agent code NEVER sees raw tokens — it calls connectors that inject them.
 *
 * Pattern:
 *   import { get } from '../vault/credential-store.js';
 *   const token = await get(clubId, 'jonas_api_key');
 */

import { sql } from '@vercel/postgres';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Derive encryption key from env var. Key must be 32 bytes (64 hex chars).
 * Falls back to a dev placeholder — NEVER use in production without setting CREDENTIAL_VAULT_KEY.
 */
function _getKey() {
  const hexKey = process.env.CREDENTIAL_VAULT_KEY;
  if (!hexKey || hexKey.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[credential-store] CREDENTIAL_VAULT_KEY not set or not 64 hex chars');
    }
    // Dev/test fallback — deterministic but insecure
    return Buffer.from('0'.repeat(64), 'hex');
  }
  return Buffer.from(hexKey, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string: iv(12 bytes) + authTag(16 bytes) + ciphertext
 */
function _encrypt(plaintext) {
  const key = _getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

/**
 * Decrypt a base64-encoded string produced by _encrypt.
 */
function _decrypt(encoded) {
  const key = _getKey();
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const ciphertext = buf.slice(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// Simple in-memory cache: { `${clubId}:${vendor}`: { value, ts } }
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

/**
 * Retrieve a decrypted vendor credential for a club.
 *
 * @param {string} clubId
 * @param {string} vendor — e.g. 'jonas_api_key', 'foretees_api_key'
 * @returns {Promise<string|null>} Decrypted token, or null if not found.
 */
export async function get(clubId, vendor) {
  const cacheKey = `${clubId}:${vendor}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const result = await sql`
      SELECT token_enc FROM club_credentials
      WHERE club_id = ${clubId} AND vendor = ${vendor}
    `;
    if (!result.rows.length) return null;
    const decrypted = _decrypt(result.rows[0].token_enc);
    _cache.set(cacheKey, { value: decrypted, ts: Date.now() });
    return decrypted;
  } catch (err) {
    console.warn('[credential-store] get failed:', err.message);
    return null;
  }
}

/**
 * Store or update a vendor credential for a club.
 * Encrypts before writing to the database.
 *
 * @param {string} clubId
 * @param {string} vendor
 * @param {string} plaintoken
 */
export async function set(clubId, vendor, plaintoken) {
  const encrypted = _encrypt(plaintoken);
  await sql`
    INSERT INTO club_credentials (club_id, vendor, token_enc)
    VALUES (${clubId}, ${vendor}, ${encrypted})
    ON CONFLICT (club_id, vendor) DO UPDATE
      SET token_enc = ${encrypted}, updated_at = NOW()
  `;
  // Bust cache
  _cache.delete(`${clubId}:${vendor}`);
}

/**
 * Remove a vendor credential.
 *
 * @param {string} clubId
 * @param {string} vendor
 */
export async function remove(clubId, vendor) {
  await sql`
    DELETE FROM club_credentials WHERE club_id = ${clubId} AND vendor = ${vendor}
  `;
  _cache.delete(`${clubId}:${vendor}`);
}
