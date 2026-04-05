/**
 * Forgot Password API
 * POST /api/forgot-password { email }
 *
 * Generates a reset token, stores it in the database,
 * and sends a reset link via SendGrid.
 *
 * Always returns 200 to avoid email enumeration.
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { rateLimit } from './lib/rateLimit.js';
import { cors } from './lib/cors.js';

const RESET_TTL_HOURS = 1;
const FROM_EMAIL = 'ty.hayes@swoopgolf.com';
const FROM_NAME = 'Swoop Golf';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const rl = rateLimit(req, { maxAttempts: 3, windowMs: 3600000 });
  if (rl.limited) {
    return res.status(429).json({ error: 'Too many requests. Try again later.', retryAfter: rl.retryAfter });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Look up user
    const { rows } = await sql`
      SELECT user_id, club_id, name, email
      FROM users
      WHERE LOWER(email) = ${normalizedEmail} AND active = TRUE
    `;

    if (rows.length === 0) {
      // Don't reveal whether the email exists — always return success
      return res.status(200).json({
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000).toISOString();

    // Store reset token (invalidate any previous tokens for this user)
    await sql`
      DELETE FROM password_resets WHERE user_id = ${user.user_id}
    `;
    await sql`
      INSERT INTO password_resets (user_id, club_id, token, expires_at)
      VALUES (${user.user_id}, ${user.club_id}, ${resetToken}, ${expiresAt})
    `;

    // Build reset URL
    const baseUrl = req.headers.origin
      || req.headers.referer?.replace(/\/[^/]*$/, '')
      || 'https://swoop-member-portal-production-readiness.vercel.app';
    const resetUrl = `${baseUrl}/#/reset-password?token=${resetToken}`;

    // Send email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: user.email }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject: 'Reset your Swoop Golf password',
          content: [
            {
              type: 'text/html',
              value: `
                <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                  <h2 style="color: #1d2939; margin-bottom: 16px;">Reset your password</h2>
                  <p style="color: #475467; font-size: 14px; line-height: 1.6;">
                    Hi ${user.name},
                  </p>
                  <p style="color: #475467; font-size: 14px; line-height: 1.6;">
                    We received a request to reset your Swoop Golf password. Click the button below to set a new password. This link expires in ${RESET_TTL_HOURS} hour.
                  </p>
                  <div style="margin: 24px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: #ff8b00; color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none;">
                      Reset Password
                    </a>
                  </div>
                  <p style="color: #667085; font-size: 12px; line-height: 1.5;">
                    If you didn't request this, you can safely ignore this email. Your password will not change.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e4e7ec; margin: 24px 0;" />
                  <p style="color: #98a2b3; font-size: 11px;">
                    Swoop Golf — Integrated Intelligence for Private Clubs
                  </p>
                </div>
              `,
            },
          ],
        }),
      });
    }

    return res.status(200).json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
