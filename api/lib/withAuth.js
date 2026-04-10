/**
 * Auth Middleware — Production
 * Validates Bearer token from session, extracts clubId and role.
 * Wraps a Vercel serverless handler: withAuth(handler) or withAuth(handler, { roles: ['gm'] })
 *
 * Usage:
 *   import { withAuth } from '../lib/withAuth.js';
 *   export default withAuth(async function handler(req, res) {
 *     const { clubId, userId, role } = req.auth;
 *     // ... clubId is guaranteed valid
 *   });
 *
 * Options:
 *   roles: string[] — allowed roles (e.g. ['gm', 'assistant_gm']). Empty = any authenticated role.
 *   allowDemo: boolean — if true, allows unauthenticated access in demo mode (sets req.auth.isDemo = true)
 */
import { sql } from '@vercel/postgres';
import { logError } from './logger.js';

/**
 * Pure session validator — no side effects, no throws.
 * Reads Bearer token from req.headers.authorization and looks up the
 * sessions table.
 *
 * Returns a discriminated union so callers can distinguish a real
 * "this user is not logged in" (401) from an infrastructure failure
 * during the session lookup (500). Collapsing the two into a single
 * null return (pre-B28) hid Postgres outages behind spurious 401s,
 * silently telling users to re-login when the real problem was the DB.
 *
 * Return shapes:
 *   { status: 'ok', session: { userId, clubId, role, name, email } }
 *   { status: 'expired' }                 — missing/malformed token, no row, expired row
 *   { status: 'error', error: Error }     — DB query threw / infra failure
 *
 * This is the single source of truth for token→session resolution.
 * Both the withAuth() wrapper and handlers that need hybrid public/authed
 * behavior (e.g. api/weather.js) should use this.
 */
export async function verifySession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return { status: 'expired' };
  const token = authHeader.slice(7);

  try {
    const result = await sql`
      SELECT s.user_id, s.club_id, s.role, s.expires_at, u.name, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    if (result.rows.length === 0) return { status: 'expired' };
    const row = result.rows[0];
    return {
      status: 'ok',
      session: {
        userId: row.user_id,
        clubId: row.club_id,
        role: row.role,
        name: row.name,
        email: row.email,
      },
    };
  } catch (e) {
    return { status: 'error', error: e };
  }
}

export function withAuth(handler, options = {}) {
  const { roles = [], allowDemo = false } = options;

  return async function authedHandler(req, res) {
    const authHeader = req.headers.authorization;

    // Check for demo mode via query param or header
    if (allowDemo && !authHeader) {
      const demoClubId = req.query?.demoClubId || req.headers['x-demo-club'];
      if (demoClubId) {
        // Demo sessions use role='demo' (NOT 'viewer') so any future endpoint
        // that gates on `roles: ['viewer']` won't accidentally accept demo
        // traffic. The canonical demo check is `req.auth.isDemo === true`;
        // role distinction is the belt-and-suspenders layer (B35).
        req.auth = { clubId: demoClubId, userId: 'demo', role: 'demo', isDemo: true };
        return handler(req, res);
      }
    }

    // Allow demo_ cleanup requests without auth (sendBeacon has no headers)
    if (allowDemo && req.query?.cleanup === 'true' && req.query?.clubId?.startsWith('demo_')) {
      req.auth = { clubId: req.query.clubId, userId: 'demo', role: 'demo', isDemo: true };
      return handler(req, res);
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await verifySession(req);
    if (result.status === 'error') {
      logError('/api/withAuth', result.error, { phase: 'session-lookup' });
      return res.status(500).json({ error: 'Authentication service error' });
    }
    if (result.status !== 'ok') {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    const session = result.session;

    // Role-based access control
    if (roles.length > 0 && !roles.includes(session.role) && session.role !== 'swoop_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Attach auth context to request
    req.auth = {
      userId: session.userId,
      clubId: session.clubId,
      role: session.role,
      name: session.name,
      email: session.email,
      isDemo: false,
    };

    // Belt-and-suspenders: reject non-admin requests where the supplied
    // clubId (query or body) doesn't match the session's clubId.
    // swoop_admin is exempt — getReadClubId/getWriteClubId already gate
    // their cross-tenant access with explicit opt-in.
    if (session.role !== 'swoop_admin') {
      const qClub = req.query?.clubId;
      const bClub = req.body?.clubId;
      if ((qClub && qClub !== session.clubId) || (bClub && bClub !== session.clubId)) {
        return res.status(403).json({ error: 'Club ID mismatch' });
      }
    }

    return handler(req, res);
  };
}

/**
 * Helper: Extract clubId from an authenticated READ request.
 *
 * Read-only endpoints (pure SELECTs, no mutation) may let a swoop_admin
 * fetch another club's data via ?clubId=xxx query param so the console
 * can inspect any tenant. For ANY write path, use getWriteClubId instead —
 * cross-club writes from the query string are a footgun and must be
 * opted into explicitly.
 */
export function getReadClubId(req) {
  if (!req.auth) throw new Error('withAuth middleware not applied');
  // swoop_admin can read any club
  if (req.auth.role === 'swoop_admin' && req.query?.clubId) {
    return req.query.clubId;
  }
  return req.auth.clubId;
}

/**
 * Helper: Extract clubId from an authenticated WRITE request.
 *
 * Default-deny posture: the swoop_admin ?clubId= override is IGNORED unless
 * the handler explicitly opts in via { allowAdminOverride: true, reason: '...' }.
 * `reason` is required with the override so every cross-club write is audited
 * in code and greppable later.
 *
 * Usage:
 *   // Normal write — always scoped to session's own club
 *   const clubId = getWriteClubId(req);
 *
 *   // Intentional admin cross-club write (rare)
 *   const clubId = getWriteClubId(req, {
 *     allowAdminOverride: true,
 *     reason: 'swoop_admin pause-resume console manages any tenant',
 *   });
 */
export function getWriteClubId(req, opts = {}) {
  if (!req.auth) throw new Error('withAuth middleware not applied');
  if (opts.allowAdminOverride && req.auth.role === 'swoop_admin') {
    if (!opts.reason) {
      throw new Error('getWriteClubId({ allowAdminOverride: true }) requires opts.reason for audit');
    }
    // Prefer ?clubId= query param (existing behavior), then fall back to
    // JSON body.clubId so admin POST tools that target a tenant via body
    // (e.g. pause-resume console) actually route to the requested club
    // instead of silently using the admin's session clubId. B25 fix.
    if (req.query?.clubId) return req.query.clubId;
    if (req.body?.clubId) return req.body.clubId;
  }
  return req.auth.clubId;
}

/**
 * @deprecated Use getReadClubId or getWriteClubId. This alias defaults to
 * READ semantics (swoop_admin may override via ?clubId=). For ANY write path,
 * migrate to getWriteClubId(req) — or, if an intentional cross-club admin
 * override is required, getWriteClubId(req, { allowAdminOverride: true, reason: '...' }).
 *
 * Kept as a shim so external scripts/tests that import getClubId keep working
 * during the B25 migration. Do not introduce new callsites.
 */
export const getClubId = getReadClubId;
