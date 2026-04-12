// Simple in-memory rate limiter for serverless
// Uses a Map with IP → { count, resetAt } entries
// Entries auto-expire. Safe for serverless (each cold start resets, which is fine —
// persistent rate limiting would need Redis, but this catches hot-path abuse).

const store = new Map();
const CLEANUP_INTERVAL = 60000; // 1 min

let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}

export function rateLimit(req, { maxAttempts = 5, windowMs = 3600000 } = {}) {
  // Dev bypass so local E2E runs aren't blocked by the 3/hour onboarding cap.
  // Production continues to enforce; this only affects `vercel dev` / unset envs.
  if (process.env.NODE_ENV !== 'production') {
    return { limited: false, remaining: maxAttempts };
  }
  cleanup();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';
  const key = `${ip}:${req.url}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { limited: true, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { limited: false, remaining: maxAttempts - entry.count };
}
