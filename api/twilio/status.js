/**
 * Twilio Status Callback Webhook
 * POST /api/twilio/status
 * Receives delivery status updates (application/x-www-form-urlencoded)
 */
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

  res.status(200).json({ ok: true });
}
