/**
 * POST /api/staff/clock-out
 *
 * Ends the current duty shift for the authenticated staff member.
 */
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { sql } from '@vercel/postgres';

async function clockOutHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const clubId = getReadClubId(req);
  const { user_id } = req.auth;

  const result = await sql`
    UPDATE staff_duty
    SET ended_at = NOW()
    WHERE club_id = ${clubId} AND user_id = ${user_id} AND ended_at IS NULL
    RETURNING id, role, started_at, ended_at
  `;

  if (result.rows.length === 0) {
    return res.status(200).json({ message: 'No active duty shift found.' });
  }

  return res.status(200).json({ ended: result.rows[0] });
}

export default withAuth(clockOutHandler, {
  roles: ['gm', 'assistant_gm', 'fb_director', 'head_pro', 'membership_director', 'controller', 'dining_room_manager', 'staff'],
});
