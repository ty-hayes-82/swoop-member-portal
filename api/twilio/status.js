/**
 * Twilio Status Callback Webhook
 * POST /api/twilio/status
 * Receives delivery status updates (application/x-www-form-urlencoded)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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
