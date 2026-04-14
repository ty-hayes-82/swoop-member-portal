/**
 * Users API
 * GET /api/users?clubId=X  — list staff users for a club
 */
import { sql } from '@vercel/postgres';
import { withAuth } from './lib/withAuth.js';
import { cors } from './lib/cors.js';

async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = req.query.clubId || req.session?.clubId;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  const result = await sql`
    SELECT user_id, club_id, email, name, role, title, active,
           phone, sms_alerts_enabled, alert_categories
    FROM users
    WHERE club_id = ${clubId} AND active = TRUE
    ORDER BY
      CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'editor' THEN 3 ELSE 4 END,
      name
  `;

  return res.json({ users: result.rows });
}

export default withAuth(handler);
