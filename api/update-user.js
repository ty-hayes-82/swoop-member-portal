/**
 * POST /api/update-user — Update user email and/or password
 * Body: { clubId, oldEmail, newEmail, newPassword, newName }
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { clubId, oldEmail, newEmail, newPassword, newName } = req.body;
  if (!clubId) return res.status(400).json({ error: 'clubId required' });

  try {
    // Find user
    let user;
    if (oldEmail) {
      const r = await sql`SELECT * FROM users WHERE email = ${oldEmail.toLowerCase()} AND club_id = ${clubId}`;
      user = r.rows[0];
    }
    if (!user) {
      // Try finding any user for this club
      const r = await sql`SELECT * FROM users WHERE club_id = ${clubId} LIMIT 1`;
      user = r.rows[0];
    }
    if (!user) return res.status(404).json({ error: 'No user found for this club' });

    // Update fields
    const updates = [];
    if (newEmail) {
      await sql`UPDATE users SET email = ${newEmail.toLowerCase()} WHERE user_id = ${user.user_id}`;
      updates.push('email');
    }
    if (newName) {
      await sql`UPDATE users SET name = ${newName} WHERE user_id = ${user.user_id}`;
      updates.push('name');
    }
    if (newPassword) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, 'sha512').toString('hex');
      await sql`UPDATE users SET password_hash = ${hash}, password_salt = ${salt} WHERE user_id = ${user.user_id}`;
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
}
