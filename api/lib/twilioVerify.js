// Verify Twilio webhook signature.
// Algorithm: https://www.twilio.com/docs/usage/webhooks/webhooks-security
//
// HMAC-SHA1 over (full URL + sorted POST params concatenated as key+value)
// keyed with TWILIO_AUTH_TOKEN, base64-encoded, compared against
// X-Twilio-Signature header.
//
// In production behind a proxy, the URL must reflect what Twilio called —
// use the host header. For Vercel, that's req.headers.host with https scheme.

import crypto from 'node:crypto';

export function verifyTwilioSignature(req) {
  const token = process.env.TWILIO_AUTH_TOKEN;

  // Local dev escape hatch: if we're not in production AND no token is set,
  // allow the request through. Production always fails closed.
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        valid: true,
        reason: null,
        devBypass: true,
      };
    }
    return { valid: false, reason: 'TWILIO_AUTH_TOKEN not set' };
  }

  const signature = req.headers['x-twilio-signature'];
  if (!signature) return { valid: false, reason: 'missing X-Twilio-Signature header' };

  // Reconstruct the URL Twilio called. Vercel terminates TLS upstream so the
  // public URL is always https. Use the host header.
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const path = req.url || '';
  const url = `${proto}://${host}${path}`;

  // Twilio's algorithm: URL + sorted (key+value) of all POST params.
  const params = req.body && typeof req.body === 'object' ? req.body : {};
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const k of sortedKeys) {
    data += k + (params[k] == null ? '' : String(params[k]));
  }

  const expected = crypto
    .createHmac('sha1', token)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  // Constant-time compare to avoid timing attacks.
  const a = Buffer.from(signature, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return { valid: false, reason: 'signature length mismatch' };
  const valid = crypto.timingSafeEqual(a, b);
  return { valid, reason: valid ? null : 'signature mismatch' };
}
