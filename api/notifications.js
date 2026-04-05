/**
 * Notifications & Alerts API
 * GET  /api/notifications?clubId=xxx — get notifications
 * POST /api/notifications — send notification or actions (mark_read, generate_digest, check_escalations)
 */
import { sql } from '@vercel/postgres';
import { withAuth, getClubId } from './lib/withAuth.js';

let _tableChecked = false;

async function ensureTable() {
  if (_tableChecked) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id SERIAL PRIMARY KEY,
        club_id TEXT NOT NULL,
        user_id TEXT,
        channel TEXT DEFAULT 'in_app',
        type TEXT DEFAULT 'info',
        title TEXT NOT NULL,
        body TEXT,
        priority TEXT DEFAULT 'normal',
        related_member_id TEXT,
        related_action_id TEXT,
        read_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    _tableChecked = true;
  } catch {
    // Table might already exist with different schema — that's OK
    _tableChecked = true;
  }
}

export default withAuth(async function handler(req, res) {
  const clubId = getClubId(req);

  if (req.method === 'GET') {
    try {
      await ensureTable();
      const qClubId = req.query.clubId || clubId;
      const result = req.query.unreadOnly === 'true'
        ? await sql`SELECT * FROM notifications WHERE club_id = ${qClubId} AND read_at IS NULL ORDER BY created_at DESC LIMIT 50`
        : await sql`SELECT * FROM notifications WHERE club_id = ${qClubId} ORDER BY created_at DESC LIMIT 50`;
      return res.status(200).json({ notifications: result.rows });
    } catch {
      return res.status(200).json({ notifications: [] });
    }
  }

  if (req.method === 'POST') {
    try {
      await ensureTable();
    } catch {}

    // Mark as read
    if (req.body?.action === 'mark_read') {
      try {
        const { notificationId } = req.body;
        await sql`UPDATE notifications SET read_at = NOW() WHERE notification_id = ${notificationId}`;
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // Send a notification
    const { type, title, body, priority, userId } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title required' });
    }

    try {
      await sql`
        INSERT INTO notifications (club_id, user_id, type, title, body, priority)
        VALUES (${clubId}, ${userId || null}, ${type}, ${title}, ${body || null}, ${priority || 'normal'})
      `;
      return res.status(200).json({ ok: true, message: `Notification created: ${title}` });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
});
