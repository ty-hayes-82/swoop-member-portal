/**
 * SMS Test Send — sends a test SMS via Twilio
 * POST /api/sms/send-test
 */
import { cors } from '../lib/cors.js';
import { logWarn } from '../lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/sms/send-test', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!sid) return res.status(500).json({ error: 'TWILIO_ACCOUNT_SID not configured' });

  const to = req.body.to || '+14802259702';
  const body = req.body.body || 'Test SMS from Swoop Golf platform. If you received this, Twilio integration is working.';

  // Use API Key auth if available, otherwise Account SID + Auth Token
  const username = apiKey || sid;
  const password = apiSecret || authToken;

  if (!password) return res.status(500).json({ error: 'Twilio credentials not configured (need API_KEY_SECRET or AUTH_TOKEN)' });

  try {
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('Body', body);
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else {
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!fromNumber) return res.status(500).json({ error: 'Need TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER' });
      params.append('From', fromNumber);
    }
    params.append('StatusCallback', `${req.headers.origin || 'https://swoop-member-portal-dev.vercel.app'}/api/twilio/status`);

    const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await twilioRes.json();

    if (twilioRes.ok) {
      return res.status(200).json({ ok: true, sid: data.sid, to, status: data.status });
    }

    return res.status(twilioRes.status).json({ error: 'Twilio error', code: data.code, message: data.message });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
