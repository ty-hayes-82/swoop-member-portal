/**
 * POST /api/update-user — Update current user's email, name and/or password
 * Body: { oldEmail, newEmail, newPassword, newName }
 *
 * Auth: requires Bearer session. clubId is ALWAYS taken from the session —
 * never from the request body. Users can only update accounts in their own club.
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { withAuth } from './lib/withAuth.js';

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const clubId = req.auth.clubId;
  const { oldEmail, newEmail, newPassword, newName } = req.body || {};

  try {
    // Find user — always scoped to the authenticated club
    let user;
    if (oldEmail) {
      const r = await sql`SELECT * FROM users WHERE email = ${oldEmail.toLowerCase()} AND club_id = ${clubId}`;
      user = r.rows[0];
    }
    if (!user) {
      // Fall back to the caller's own user record
      const r = await sql`SELECT * FROM users WHERE user_id = ${req.auth.userId} AND club_id = ${clubId} LIMIT 1`;
      user = r.rows[0];
    }
    if (!user) return res.status(404).json({ error: 'No user found for this club' });

    // Update fields — every UPDATE is double-scoped (user_id AND club_id)
    const updates = [];
    if (newEmail) {
      await sql`UPDATE users SET email = ${newEmail.toLowerCase()} WHERE user_id = ${user.user_id} AND club_id = ${clubId}`;
      updates.push('email');
    }
    if (newName) {
      await sql`UPDATE users SET name = ${newName} WHERE user_id = ${user.user_id} AND club_id = ${clubId}`;
      updates.push('name');
    }
    if (newPassword) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, 'sha512').toString('hex');
      await sql`UPDATE users SET password_hash = ${hash}, password_salt = ${salt} WHERE user_id = ${user.user_id} AND club_id = ${clubId}`;
      updates.push('password');
    }

    return res.status(200).json({
      success: true,
      userId: user.user_id,
      updated: updates,
      email: newEmail || user.email,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});
