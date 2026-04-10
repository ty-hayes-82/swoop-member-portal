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
  try {
    const client = Sentry.getClient?.();
    if (client) {
      Sentry.captureException(err, { extra: context });
    }
  } catch {
    // Never let telemetry crash the caller
  }
  // Always surface in dev console so the existing debug flow is unchanged
  if (import.meta.env?.DEV) {
    console.error(err, context);
  } else {
    // In prod, still log to console for Vercel log capture
    console.error(err);
  }
}
