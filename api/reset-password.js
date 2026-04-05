/**
 * Reset Password API
 * POST /api/reset-password { token, newPassword }
 *
 * Validates the reset token, hashes the new password,
 * updates the user record, and invalidates the token.
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { rateLimit } from './lib/rateLimit.js';
import { cors } from './lib/cors.js';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const rl = rateLimit(req, { maxAttempts: 5, windowMs: 3600000 });
  if (rl.limited) {
    return res.status(429).json({ error: 'Too many requests. Try again later.', retryAfter: rl.retryAfter });
  }

  const { token, newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Look up reset token
    const { rows } = await sql`
      SELECT user_id, club_id, expires_at
      FROM password_resets
      WHERE token = ${token}
    `;

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    const resetRecord = rows[0];

    // Check expiry
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Clean up expired token
      await sql`DELETE FROM password_resets WHERE token = ${token}`;
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);

    // Update user password
    await sql`
      UPDATE users
      SET password_hash = ${hash}, password_salt = ${salt}
      WHERE user_id = ${resetRecord.user_id}
    `;

    // Invalidate all reset tokens for this user
    await sql`
      DELETE FROM password_resets WHERE user_id = ${resetRecord.user_id}
    `;

    // Invalidate all existing sessions (force re-login with new password)
    await sql`
      DELETE FROM sessions WHERE user_id = ${resetRecord.user_id}
    `;

    return res.status(200).json({
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
