/**
 * logError — thin wrapper over Sentry.captureException with console fallback.
 *
 * Sentry is initialized lazily in src/main.jsx only when VITE_SENTRY_DSN is set.
 * When no DSN is present, this helper degrades to console.error so dev builds
 * behave identically to the pre-Sentry codebase.
 *
 * Usage:
 *   import { logError } from '@/utils/logError';
 *   logError(err, { service: 'apiClient', op: 'fetchMembers' });
 */
import * as Sentry from '@sentry/react';

export function logError(err, context = {}) {
  const { level, ...extra } = context;
  try {
    const client = Sentry.getClient?.();
    if (client) {
      Sentry.captureException(err, {
        level: level || 'error',
        extra,
      });
    }
  } catch {
    // Never let telemetry crash the caller
  }
  // Always surface in dev console so the existing debug flow is unchanged
  const logFn = level === 'warning' ? console.warn : console.error;
  if (import.meta.env?.DEV) {
    logFn(err, context);
  } else {
    // In prod, still log to console for Vercel log capture
    logFn(err);
  }
}
