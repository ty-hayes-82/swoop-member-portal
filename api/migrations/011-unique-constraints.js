import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const results = [];

  try {
    // UNIQUE on users.email (prevent duplicate accounts)
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(LOWER(email))`;
    results.push('users.email UNIQUE index created');
  } catch (e) {
    results.push(`users.email: ${e.message}`);
  }

  try {
    // UNIQUE on members(club_id, external_id) where external_id is not null
    // This prevents duplicate imports of the same member
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_members_club_external
              ON members(club_id, external_id) WHERE external_id IS NOT NULL`;
    results.push('members(club_id, external_id) UNIQUE index created');
  } catch (e) {
    results.push(`members unique: ${e.message}`);
  }

  try {
    // UNIQUE on password_resets.token (already exists from migration 010, but ensure)
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_token_unique ON password_resets(token)`;
    results.push('password_resets.token UNIQUE index verified');
  } catch (e) {
    results.push(`password_resets: ${e.message}`);
  }

  try {
    // UNIQUE on sessions.token
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_unique ON sessions(token)`;
    results.push('sessions.token UNIQUE index created');
  } catch (e) {
    results.push(`sessions: ${e.message}`);
  }

  return res.status(200).json({ success: true, results });
}
