/**
 * Google OAuth — Initiate
 * GET /api/google/auth?returnUrl=...
 *
 * Redirects the user to Google's OAuth consent screen requesting
 * Calendar + Gmail scopes.
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'openid',
  'email',
];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
  }

  // Determine callback URL based on request origin
  const baseUrl = process.env.APP_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const redirectUri = `${baseUrl}/api/google/callback`;

  // Pass returnUrl and auth token through state param
  const returnUrl = req.query.returnUrl || '/';
  const token = req.query.token || '';
  const state = Buffer.from(JSON.stringify({ returnUrl, token })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
