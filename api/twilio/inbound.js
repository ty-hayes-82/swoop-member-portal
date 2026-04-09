/**
 * Twilio Inbound SMS Webhook
 * POST /api/twilio/inbound
 * Receives inbound reply messages from Twilio (application/x-www-form-urlencoded)
 */
import { sql } from '@vercel/postgres';
import { verifyTwilioSignature } from '../lib/twilioVerify.js';
import { logWarn, logInfo } from '../lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = verifyTwilioSignature(req);
  if (!sig.valid) {
    logWarn('/api/twilio/inbound', 'rejected webhook', {
      reason: sig.reason,
      ip: req.headers['x-forwarded-for'],
    });
    return res.status(403).json({ error: 'Invalid signature' });
  }
  if (sig.devBypass) {
    logInfo('/api/twilio/inbound', 'dev bypass: TWILIO_AUTH_TOKEN not set, skipping verification');
  }

  // Twilio sends form-urlencoded
  const { From, To, Body, MessageSid, AccountSid } = req.body || {};

  console.log('[twilio-inbound]', { from: From, to: To, body: Body, messageSid: MessageSid, receivedAt: new Date().toISOString() });

  // Log to database
  try {
    await sql`
      INSERT INTO notifications (club_id, channel, type, title, body, priority)
      VALUES ('system', 'sms_inbound', 'sms_reply', ${`SMS reply from ${From}`}, ${Body || ''}, 'normal')
    `;
  } catch (e) {
    console.error('[twilio-inbound] db error:', e.message);
  }

  // Respond with TwiML (empty response = no auto-reply)
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
