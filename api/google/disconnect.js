/**
 * Google Disconnect
 * POST /api/google/disconnect
 *
 * Revokes Google tokens and removes them from the database.
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const userId = req.auth.userId;

  try {
    // Get the token to revoke it
    const result = await sql`
      SELECT access_token FROM google_tokens WHERE user_id = ${userId}
    `;

    if (result.rows.length > 0) {
      // Revoke the token with Google (best-effort)
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${result.rows[0].access_token}`, {
          method: 'POST',
        });
      } catch {}

      // Delete from database
      await sql`DELETE FROM google_tokens WHERE user_id = ${userId}`;
    }

    return res.status(200).json({ disconnected: true });
  } catch (e) {
    console.error('[google/disconnect] Error:', e.message);
    return res.status(500).json({ error: 'Failed to disconnect Google' });
  }
}, { allowDemo: true });
