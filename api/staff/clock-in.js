/**
 * POST /api/staff/clock-in
 *
 * Staff member declares they are on duty with a specific role.
 * Closes any existing active duty row first (one active duty per user).
 * Body: { role: string }
 */
import { withAuth, getReadClubId } from '../lib/withAuth.js';
import { sql } from '@vercel/postgres';

const VALID_ROLES = [
  'gm', 'assistant_gm', 'fb_director', 'head_pro',
  'membership_director', 'controller', 'dining_room_manager', 'staff',
];

async function clockInHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const clubId = getReadClubId(req);
  const { user_id } = req.auth;
  const { role } = req.body;

  if (!role) return res.status(400).json({ error: 'role is required' });
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` });
  }

  // Close any existing active duty for this user at this club
  await sql`
    UPDATE staff_duty
    SET ended_at = NOW()
    WHERE club_id = ${clubId} AND user_id = ${user_id} AND ended_at IS NULL
  `;

  // Insert new duty record
  const result = await sql`
    INSERT INTO staff_duty (club_id, user_id, role, session_token)
    VALUES (${clubId}, ${user_id}, ${role}, ${req.auth.token ?? null})
    RETURNING id, club_id, user_id, role, started_at
  `;

  return res.status(200).json({ on_duty: result.rows[0] });
}

export default withAuth(clockInHandler, {
  roles: ['gm', 'assistant_gm', 'fb_director', 'head_pro', 'membership_director', 'controller', 'dining_room_manager', 'staff'],
});
