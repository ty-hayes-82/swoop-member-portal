/**
 * Google OAuth — Callback
 * GET /api/google/callback?code=...&state=...
 *
 * Exchanges the authorization code for tokens, stores them in the database,
 * and redirects back to the app.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const { code, state, error } = req.query;

  // Parse state to get returnUrl and auth token
  let returnUrl = '/#/profile';
  let authToken = '';
  try {
    const parsed = JSON.parse(Buffer.from(state || '', 'base64').toString());
    returnUrl = parsed.returnUrl || '/#/profile';
    authToken = parsed.token || '';
  } catch {}

  if (error) {
    return res.redirect(302, `${returnUrl}?google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(302, `${returnUrl}?google_error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.redirect(302, `${returnUrl}?google_error=not_configured`);
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${protocol}://${host}/api/google/callback`;

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
      console.error('[google/callback] Token exchange failed:', tokens);
      return res.redirect(302, `${returnUrl}?google_error=token_exchange_failed`);
    }

    // Get user info (email) from the id token or userinfo endpoint
    let googleEmail = '';
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();
      googleEmail = userInfo.email || '';
    } catch {}

    // Look up the Swoop user from the auth token
    let userId = 'demo';
    let clubId = 'demo';
    if (authToken && authToken !== 'demo') {
      try {
        const sessionRes = await sql`
          SELECT user_id, club_id FROM sessions
          WHERE token = ${authToken} AND expires_at > NOW()
        `;
        if (sessionRes.rows.length > 0) {
          userId = sessionRes.rows[0].user_id;
          clubId = sessionRes.rows[0].club_id;
        }
      } catch {}
    }

    // Upsert tokens into database
    await sql`
      INSERT INTO google_tokens (user_id, club_id, access_token, refresh_token, token_type, scope, expiry_date, google_email, updated_at)
      VALUES (${userId}, ${clubId}, ${tokens.access_token}, ${tokens.refresh_token || null}, ${tokens.token_type || 'Bearer'}, ${tokens.scope || ''}, ${tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null}, ${googleEmail}, NOW())
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

    // Redirect back to app with success
    res.redirect(302, `${returnUrl}?google_connected=true&google_email=${encodeURIComponent(googleEmail)}`);
  } catch (e) {
    console.error('[google/callback] Error:', e.message);
    res.redirect(302, `${returnUrl}?google_error=server_error`);
  }
}
