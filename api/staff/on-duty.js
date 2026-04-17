/**
 * GET /api/staff/on-duty
 *
 * Returns the current on-duty roster for the club.
 * Also returns the requesting user's own active duty record if any.
 */
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { sql } from '@vercel/postgres';

async function onDutyHandler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const clubId = getReadClubId(req);
  const { user_id } = req.auth;

  const [rosterResult, myDutyResult] = await Promise.all([
    sql`
      SELECT sd.id, sd.user_id, sd.role, sd.started_at,
             u.name, u.title
      FROM staff_duty sd
      LEFT JOIN users u ON u.user_id = sd.user_id AND u.club_id = ${clubId}
      WHERE sd.club_id = ${clubId} AND sd.ended_at IS NULL
      ORDER BY sd.started_at ASC
    `,
    sql`
      SELECT id, role, started_at
      FROM staff_duty
      WHERE club_id = ${clubId} AND user_id = ${user_id} AND ended_at IS NULL
      LIMIT 1
    `,
  ]);

  return res.status(200).json({
    roster: rosterResult.rows,
    my_duty: myDutyResult.rows[0] ?? null,
  });
}

export default withAuth(onDutyHandler, {
  roles: ['gm', 'assistant_gm', 'fb_director', 'head_pro', 'membership_director', 'controller', 'dining_room_manager', 'staff'],
});
