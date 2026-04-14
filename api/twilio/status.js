/**
 * Twilio Status Callback Webhook
 * POST /api/twilio/status
 * Receives delivery status updates (application/x-www-form-urlencoded)
 */
import { sql } from '@vercel/postgres';
import { verifyTwilioSignature } from '../lib/twilioVerify.js';
import { logWarn, logInfo } from '../lib/logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = verifyTwilioSignature(req);
  if (!sig.valid) {
    logWarn('/api/twilio/status', 'rejected webhook', {
      reason: sig.reason,
      ip: req.headers['x-forwarded-for'],
    });
    return res.status(403).json({ error: 'Invalid signature' });
  }
  if (sig.devBypass) {
    logInfo('/api/twilio/status', 'dev bypass: TWILIO_AUTH_TOKEN not set, skipping verification');
  }

  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, To } = req.body || {};

  console.log('[twilio-status]', {
    messageSid: MessageSid,
    status: MessageStatus,
    errorCode: ErrorCode,
    errorMessage: ErrorMessage,
    to: To,
    receivedAt: new Date().toISOString(),
  });

  if (MessageSid && MessageStatus) {
    await sql`
      UPDATE sms_log
      SET status = ${MessageStatus},
          delivered_at = CASE WHEN ${MessageStatus} = 'delivered' THEN NOW() ELSE delivered_at END,
          error_message = CASE WHEN ${ErrorMessage} IS NOT NULL THEN ${ErrorMessage || null} ELSE error_message END
      WHERE twilio_sid = ${MessageSid}
    `.catch(e => console.error('[twilio-status] sms_log update error:', e.message));
  }

  res.status(200).json({ ok: true });
}
