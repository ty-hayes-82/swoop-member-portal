/**
 * Auth API — Sprint 1
 * POST /api/auth — login (returns session token)
 * GET /api/auth — validate session
 * DELETE /api/auth — logout
 *
 * Simple token-based auth for Phase 1. Upgrade to OAuth/SSO in Phase 2.
 * Roles: gm, assistant_gm, fb_director, head_pro, membership_director, controller, viewer
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { rateLimit } from './lib/rateLimit.js';
import { cors } from './lib/cors.js';

const SESSION_TTL_HOURS = 24;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  // Ensure sessions table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        club_id TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch {}

  if (req.method === 'POST') {
    const rl = rateLimit(req, { maxAttempts: 5, windowMs: 3600000 });
    if (rl.limited) {
      return res.status(429).json({ error: 'Too many login attempts. Try again later.', retryAfter: rl.retryAfter });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    try {
      const result = await sql`
        SELECT u.user_id, u.club_id, u.name, u.role, u.title, u.password_hash, u.password_salt, c.name AS club_name
        FROM users u LEFT JOIN club c ON u.club_id = c.club_id
        WHERE u.email = ${email.toLowerCase()} AND u.active = TRUE
      `;

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Require password hash — no bypass
      if (!user.password_hash || !user.password_salt) {
        return res.status(401).json({ error: 'Account not configured. Contact your administrator.' });
      }
      const hash = hashPassword(password, user.password_salt);
      if (hash !== user.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

      await sql`
        INSERT INTO sessions (token, user_id, club_id, role, expires_at)
        VALUES (${token}, ${user.user_id}, ${user.club_id}, ${user.role}, ${expiresAt.toISOString()})
      `;

      await sql`UPDATE users SET last_login = NOW() WHERE user_id = ${user.user_id}`;

      return res.status(200).json({
        token,
        user: { userId: user.user_id, clubId: user.club_id, name: user.name, email, role: user.role, title: user.title, clubName: user.club_name || null },
        expiresAt: expiresAt.toISOString(),
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.slice(7);
    try {
      const result = await sql`
        SELECT s.user_id, s.club_id, s.role, s.expires_at, u.name, u.email, u.title, c.name AS club_name
        FROM sessions s JOIN users u ON s.user_id = u.user_id LEFT JOIN club c ON s.club_id = c.club_id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Session expired or invalid' });
      }

      const session = result.rows[0];
      return res.status(200).json({
        user: { userId: session.user_id, clubId: session.club_id, name: session.name, email: session.email, role: session.role, title: session.title, clubName: session.club_name || null },
        expiresAt: session.expires_at,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      await sql`DELETE FROM sessions WHERE token = ${authHeader.slice(7)}`;
    }
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
