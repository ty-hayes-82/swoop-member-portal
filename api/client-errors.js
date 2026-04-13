/**
 * POST /api/client-errors
 *
 * Lightweight client-side error telemetry sink. Receives POSTs from
 * ErrorBoundary and RouteErrorBoundary when a React render throws. Writes
 * to the activity_log table so operators can grep for top N broken
 * widgets without standing up Sentry.
 *
 * Intentionally permissive: no auth required (widgets fail before auth
 * state is reliable in some cases), but we rate-limit by IP and cap
 * payload size so it can't be abused.
 *
 * Body shape (all strings, server truncates):
 *   { level, message, stack, componentStack, url, userAgent, timestamp }
 */
import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_IP = 60;
const _buckets = new Map(); // ip -> number[]

function rateLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_WINDOW_MS;
  const bucket = (_buckets.get(ip) || []).filter(t => t > cutoff);
  if (bucket.length >= RATE_MAX_PER_IP) return false;
  bucket.push(now);
  _buckets.set(ip, bucket);
  return true;
}

function truncate(s, n) {
  if (typeof s !== 'string') return '';
  return s.length > n ? s.slice(0, n) : s;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString().split(',')[0].trim();
  if (!rateLimit(ip)) return res.status(429).json({ error: 'rate limited' });

  const b = req.body || {};
  const row = {
    level: truncate(b.level || 'unknown', 20),
    message: truncate(b.message, 500),
    stack: truncate(b.stack, 2000),
    componentStack: truncate(b.componentStack, 1500),
    url: truncate(b.url, 500),
    userAgent: truncate(b.userAgent, 300),
    timestamp: truncate(b.timestamp, 40),
  };

  try {
    // Ensure target table exists. Piggyback on activity_log with a specific
    // action_type so operators can filter via SELECT ... WHERE action_type='client_error'.
    await sql`
      INSERT INTO activity_log (action_type, action_subtype, actor, reference_id, reference_type, description, meta, club_id)
      VALUES (
        'client_error',
        ${row.level},
        ${ip},
        ${row.url},
        'client_error',
        ${row.message},
        ${JSON.stringify(row)},
        NULL
      )
    `;
    return res.status(204).end();
  } catch (err) {
    // Never make the client's error flow throw its own error. 204 either way.
    return res.status(204).end();
  }
}
