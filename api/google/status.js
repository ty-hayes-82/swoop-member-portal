/**
 * Google Connection Status
 * GET /api/google/status
 *
 * Returns whether the current user has a valid Google connection.
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const userId = req.auth.userId;

  try {
    const result = await sql`
      SELECT google_email, scope, expiry_date, updated_at
      FROM google_tokens WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      return res.status(200).json({ connected: false });
    }

    const row = result.rows[0];
    const hasCalendar = (row.scope || '').includes('calendar');
    const hasGmail = (row.scope || '').includes('gmail');

    return res.status(200).json({
      connected: true,
      googleEmail: row.google_email,
      scopes: { calendar: hasCalendar, gmail: hasGmail },
      connectedAt: row.updated_at,
    });
  } catch (e) {
    console.error('[google/status] Error:', e.message);
    return res.status(500).json({ error: 'Failed to check Google status' });
  }
}, { allowDemo: true });
