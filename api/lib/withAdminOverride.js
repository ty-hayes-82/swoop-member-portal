/**
 * withAdminOverride — SEC-2 observability for cross-club admin writes.
 *
 * Wraps a Vercel-style handler so that any request where a swoop_admin's
 * effective clubId (from req.query.clubId or req.body.clubId) diverges
 * from their session clubId (req.auth.clubId) is recorded in the
 * `cross_club_audit` table BEFORE the handler runs.
 *
 * Design notes:
 *   • Fire-and-forget insert. A downed audit log must never block a
 *     legitimate admin write. If the insert fails, we still emit a
 *     structured warn-log so the divergence is visible in function logs.
 *   • SHA-256 of the JSON body is stored as `body_hash`, never the body
 *     itself. This keeps PII out of the audit table while still allowing
 *     forensic correlation against application logs.
 *   • Wrapper order (outside-in): withAuth(withAdminOverride(handler))
 *     — withAuth must populate req.auth before withAdminOverride reads it.
 *
 * Usage:
 *   import { withAuth, getWriteClubId } from './lib/withAuth.js';
 *   import { withAdminOverride } from './lib/withAdminOverride.js';
 *
 *   async function handler(req, res) {
 *     const clubId = getWriteClubId(req, { allowAdminOverride: true, reason: '...' });
 *     // ...
 *   }
 *
 *   export default withAuth(withAdminOverride(handler, {
 *     adminTool: 'pause-resume',
 *     reason: 'swoop_admin pause/resume console',
 *   }), { roles: ['swoop_admin'] });
 */
import crypto from 'node:crypto';
import { sql } from '@vercel/postgres';
import { logError, logWarn } from './logger.js';

export function withAdminOverride(handler, opts = {}) {
  return async function wrapped(req, res) {
    const sessionClubId = req.auth?.clubId;
    const sessionUserId = req.auth?.userId;
    const role = req.auth?.role;
    const overrideQuery = req.query?.clubId;
    const overrideBody = req.body?.clubId;
    const targetClubId = overrideQuery || overrideBody;

    const isOverride =
      role === 'swoop_admin' &&
      !!targetClubId &&
      targetClubId !== sessionClubId;

    if (isOverride) {
      const path = (req.url || '').split('?')[0];
      let bodyHash = null;
      try {
        if (req.body) {
          bodyHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(req.body))
            .digest('hex');
        }
      } catch {
        // If the body can't be serialized (circular refs, etc.), skip the
        // hash rather than failing the request.
        bodyHash = null;
      }
      const xff = req.headers['x-forwarded-for'] || '';
      const ip = (typeof xff === 'string' ? xff : '').split(',')[0].trim() || null;
      const userAgent = req.headers['user-agent'] || null;
      const reason = opts.reason || opts.adminTool || 'unspecified';

      // Fire-and-forget: do NOT await. A downed audit log must not block
      // legitimate admin writes. Errors are logged but never rethrown.
      sql`
        INSERT INTO cross_club_audit
          (user_id, session_club_id, target_club_id, method, path, reason, body_hash, ip, user_agent)
        VALUES
          (${sessionUserId}, ${sessionClubId}, ${targetClubId}, ${req.method}, ${path}, ${reason}, ${bodyHash}, ${ip}, ${userAgent})
      `.catch((err) => {
        logError('withAdminOverride', err, { phase: 'audit-insert' });
      });

      // Also emit a structured warn-log so the divergence is visible in
      // real-time in Vercel function logs even if the DB insert fails.
      logWarn('withAdminOverride', 'cross-club admin write', {
        userId: sessionUserId,
        sessionClubId,
        targetClubId,
        method: req.method,
        path,
        reason,
      });
    }

    return handler(req, res);
  };
}
