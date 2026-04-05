/**
 * Migration 010: Create password_resets table
 * POST /api/migrations/010-password-resets-table
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        club_id TEXT,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)
    `;

    return res.status(200).json({
      success: true,
      message: 'Migration 010: password_resets table created',
    });
  } catch (err) {
    console.error('Migration 010 error:', err);
    return res.status(500).json({ error: err.message });
  }
}
