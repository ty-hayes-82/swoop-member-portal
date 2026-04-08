/**
 * Google Sign-In — Callback
 * GET /api/google/signin-callback?code=...
 *
 * Exchanges auth code for tokens, creates or finds user account,
 * stores Google tokens, creates session, and redirects to app.
 */
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const SESSION_TTL_HOURS = 24;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(302, `/#/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(302, '/#/login?error=no_code');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.redirect(302, '/#/login?error=google_not_configured');
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${protocol}://${host}/api/google/signin-callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('[google/signin-callback] Token exchange failed:', tokens);
      return res.redirect(302, '/#/login?error=token_exchange_failed');
    }

    // Get user profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userInfoRes.json();

    if (!profile.email) {
      return res.redirect(302, '/#/login?error=no_email');
    }

    // Find or create user
    let userResult = await sql`
      SELECT u.user_id, u.club_id, u.name, u.email, u.role, u.title, c.name AS club_name
      FROM users u LEFT JOIN club c ON u.club_id = c.club_id
      WHERE u.email = ${profile.email.toLowerCase()} AND u.active = TRUE
    `;

    let userId, clubId, userName, userRole, userTitle, clubName;

    if (userResult.rows.length > 0) {
      // Existing user
      const user = userResult.rows[0];
      userId = user.user_id;
      clubId = user.club_id;
      userName = user.name;
      userRole = user.role;
      userTitle = user.title;
      clubName = user.club_name;
    } else {
      // Create new user — assign to a default "onboarding" club or let them set up
      userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
      clubId = `club_${crypto.randomBytes(6).toString('hex')}`;
      userName = profile.name || profile.email.split('@')[0];
      userRole = 'gm';
      userTitle = 'General Manager';
      clubName = `${userName}'s Club`;

      // Create club
      await sql`
        INSERT INTO club (club_id, name)
        VALUES (${clubId}, ${clubName})
        ON CONFLICT (club_id) DO NOTHING
      `;

      // Create user (no password — Google-only auth)
      await sql`
        INSERT INTO users (user_id, club_id, email, name, role, title, active, created_at)
        VALUES (${userId}, ${clubId}, ${profile.email.toLowerCase()}, ${userName}, ${userRole}, ${userTitle}, TRUE, NOW())
      `;
    }

    // Store Google tokens for Calendar/Gmail integration
    const expiryDate = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
    await sql`
      INSERT INTO google_tokens (user_id, club_id, access_token, refresh_token, token_type, scope, expiry_date, google_email, updated_at)
      VALUES (${userId}, ${clubId}, ${tokens.access_token}, ${tokens.refresh_token || null}, ${tokens.token_type || 'Bearer'}, ${tokens.scope || ''}, ${expiryDate}, ${profile.email}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, google_tokens.refresh_token),
        token_type = EXCLUDED.token_type,
        scope = EXCLUDED.scope,
        expiry_date = EXCLUDED.expiry_date,
        google_email = EXCLUDED.google_email,
        updated_at = NOW()
    `;

    // Create session
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

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

    await sql`
      INSERT INTO sessions (token, user_id, club_id, role, expires_at)
      VALUES (${sessionToken}, ${userId}, ${clubId}, ${userRole}, ${expiresAt.toISOString()})
    `;

    // Redirect to app with auth data in URL fragment (never sent to server)
    const userData = encodeURIComponent(JSON.stringify({
      userId, clubId, name: userName, email: profile.email,
      role: userRole, title: userTitle, clubName,
    }));

    res.redirect(302, `/#/google-auth?token=${sessionToken}&user=${userData}`);
  } catch (e) {
    console.error('[google/signin-callback] Error:', e.message, e.stack);
    res.redirect(302, `/#/login?error=${encodeURIComponent(e.message)}`);
  }
}
