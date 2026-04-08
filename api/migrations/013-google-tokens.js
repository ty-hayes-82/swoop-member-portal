/**
 * Migration 013: Google OAuth Tokens
 * Stores per-user Google OAuth tokens for Calendar and Gmail integration.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const run = async (label, query) => {
    try {
      await query;
      results.push({ table: label, status: 'ok' });
    } catch (e) {
      results.push({ table: label, status: 'error', message: e.message });
    }
  };

  await run('google_tokens', sql`
    CREATE TABLE IF NOT EXISTS google_tokens (
      user_id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT DEFAULT 'Bearer',
      scope TEXT,
      expiry_date BIGINT,
      google_email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add auth_provider column to users table for Google sign-in
  await run('users_auth_provider', sql.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT \'email\''));

  res.status(200).json({ migration: '013-google-tokens', results });
}
