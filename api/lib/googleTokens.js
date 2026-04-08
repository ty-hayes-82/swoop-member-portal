/**
 * Google Token Helper
 * Retrieves and auto-refreshes Google OAuth tokens for a user.
 */
import { sql } from '@vercel/postgres';

export async function getGoogleAccessToken(userId) {
  const result = await sql`
    SELECT access_token, refresh_token, expiry_date
    FROM google_tokens WHERE user_id = ${userId}
  `;

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  // Check if token is expired (with 5-min buffer)
  const isExpired = row.expiry_date && Date.now() > (Number(row.expiry_date) - 5 * 60 * 1000);

  if (!isExpired) {
    return row.access_token;
  }

  // Refresh the token
  if (!row.refresh_token) {
    return null; // Can't refresh without a refresh token
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: row.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await refreshRes.json();
    if (!refreshRes.ok) {
      console.error('[googleTokens] Refresh failed:', tokens);
      return null;
    }

    // Update stored token
    const newExpiry = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;
    await sql`
      UPDATE google_tokens
      SET access_token = ${tokens.access_token},
          expiry_date = ${newExpiry},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return tokens.access_token;
  } catch (e) {
    console.error('[googleTokens] Refresh error:', e.message);
    return null;
  }
}
