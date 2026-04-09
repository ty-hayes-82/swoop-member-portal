// Structured JSON logger for Vercel serverless functions.
//
// Vercel function logs auto-parse JSON, so emitting one JSON object per line
// is the canonical format. Future Sentry / Datadog / Logflare hookup: replace
// the body of `emit()` with a sink call. Every other helper goes through emit().
//
// Conventions:
//   • `context` is the route or subsystem ('/api/auth', 'briefing', 'cron/weather')
//   • Never log raw passwords, tokens, full request bodies, or full email addrs.
//     Use redact() for emails — it keeps the domain so support can correlate.
//   • Always pass an `err` (Error instance) for error logs, not a stringified version.

const SINK = (level, payload) => {
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

function emit(level, context, message, meta) {
  SINK(level, {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

/**
 * Strip an email address to its domain. Keeps PII out of logs while
 * preserving enough signal for incident triage. Returns null if input
 * isn't an email.
 */
export function redactEmail(value) {
  if (typeof value !== 'string' || !value.includes('@')) return null;
  const [, domain] = value.split('@');
  return domain ? `***@${domain}` : null;
}

export function logError(context, error, meta = {}) {
  emit('error', context, error?.message || String(error), {
    stack: error?.stack,
    ...meta,
  });
}

export function logWarn(context, message, meta = {}) {
  emit('warn', context, message, meta);
}

export function logInfo(context, message, meta = {}) {
  emit('info', context, message, meta);
}

// Backwards-compatible aliases (older code may import these names directly)
export const error = logError;
export const warn = logWarn;
export const info = logInfo;
