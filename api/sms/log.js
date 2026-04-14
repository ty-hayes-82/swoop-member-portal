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
    SELECT log_id, club_id, member_id, user_id, template_id, direction, body,
           twilio_sid, status, error_message, reply_keyword, sent_at, delivered_at
    FROM sms_log
    WHERE club_id = ${clubId}
      AND (${direction}::text IS NULL OR direction = ${direction})
      AND (${status}::text IS NULL OR status = ${status})
    ORDER BY sent_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return res.json({ rows: result.rows });
}

export default withAuth(handler);
