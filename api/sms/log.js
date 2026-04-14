/**
 * SMS Log API
 * GET /api/sms/log?clubId=X&limit=20&offset=0&direction=&status=
 */
import { sql } from '@vercel/postgres';
import { withAuth } from '../lib/withAuth.js';
import { cors } from '../lib/cors.js';

async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = req.query.clubId || req.session?.clubId;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const offset = parseInt(req.query.offset || '0', 10);
  const direction = req.query.direction || null;
  const status = req.query.status || null;

  const result = await sql`
    SELECT l.log_id, l.club_id, l.member_id, l.user_id, l.template_id, l.direction, l.body,
           l.twilio_sid, l.status, l.error_message, l.reply_keyword, l.sent_at, l.delivered_at,
           COALESCE(NULLIF(TRIM(COALESCE(m.first_name, '') || ' ' || COALESCE(m.last_name, '')), ''), u.name) AS member_name
    FROM sms_log l
    LEFT JOIN members m ON m.member_id = l.member_id
    LEFT JOIN users u ON u.user_id = l.user_id
    WHERE l.club_id = ${clubId}
      AND (${direction}::text IS NULL OR l.direction = ${direction})
      AND (${status}::text IS NULL OR l.status = ${status})
    ORDER BY l.sent_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return res.json({ rows: result.rows });
}

export default withAuth(handler);
