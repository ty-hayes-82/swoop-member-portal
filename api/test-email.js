/**
 * Test Email — sends a test email via SendGrid
 * POST /api/test-email { to, subject, body }
 */
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/test-email', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { to, from, subject, body } = req.body;
  if (!to) return res.status(400).json({ error: 'to email required' });

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ error: 'SENDGRID_API_KEY not configured' });
  }

  try {
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from || 'ty.hayes@swoopgolf.com', name: 'Swoop Golf' },
        subject: subject || 'Swoop Golf — Test Email',
        content: [{ type: 'text/plain', value: body || 'This is a test email from Swoop Golf. SendGrid integration is working.' }],
      }),
    });

    if (sgRes.status >= 200 && sgRes.status < 300) {
      return res.status(200).json({ ok: true, message: `Email sent to ${to}`, status: sgRes.status });
    }

    const errorBody = await sgRes.text();
    return res.status(sgRes.status).json({ error: 'SendGrid error', status: sgRes.status, details: errorBody });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
