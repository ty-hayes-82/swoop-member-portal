/**
 * Google Gmail — Create Draft
 * POST /api/google/gmail-draft
 *
 * Creates a Gmail draft with AI-generated content.
 *
 * Body: { to, subject, body }
 * Returns: { draftId, messageId }
 */
import { withAuth } from '../lib/withAuth.js';
import { getGoogleAccessToken } from '../lib/googleTokens.js';

function buildRawEmail({ to, subject, body, from }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
  ].join('\r\n');

  const raw = `${headers}\r\n\r\n${body}`;

  // Gmail API expects URL-safe base64
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default withAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { to, subject, body } = req.body || {};

  if (!subject || !body) {
    return res.status(400).json({ error: 'subject and body are required' });
  }

  const accessToken = await getGoogleAccessToken(req.auth.userId);
  if (!accessToken) {
    return res.status(401).json({ error: 'Google not connected. Please connect your Google account in Profile settings.' });
  }

  // Get the user's Google email for the From header
  const from = req.auth.email || '';

  const raw = buildRawEmail({ to: to || '', subject, body, from });

  try {
    const draftRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: { raw },
      }),
    });

    const draftData = await draftRes.json();

    if (!draftRes.ok) {
      console.error('[google/gmail-draft] API error:', draftData);
      return res.status(draftRes.status).json({
        error: 'Failed to create Gmail draft',
        detail: draftData.error?.message,
      });
    }

    return res.status(200).json({
      draftId: draftData.id,
      messageId: draftData.message?.id,
    });
  } catch (e) {
    console.error('[google/gmail-draft] Error:', e.message);
    return res.status(500).json({ error: 'Failed to create Gmail draft' });
  }
}, { allowDemo: true });
