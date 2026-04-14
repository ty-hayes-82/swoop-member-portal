/**
 * Update staff SMS settings
 * PUT /api/users/update-sms
 * Body: { userId, clubId, phone, alert_categories }
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';

async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'PUT') return res.status(405).json({ error: 'PUT only' });

  const { userId, clubId, phone, alert_categories } = req.body || {};
  if (!userId || !clubId) return res.status(400).json({ error: 'userId and clubId required' });

  await sql`
    UPDATE users
    SET phone = ${phone || null},
        alert_categories = ${alert_categories || []}
    WHERE user_id = ${userId} AND club_id = ${clubId}
  `;

  return res.json({ ok: true });
}

export default withAuth(handler);
