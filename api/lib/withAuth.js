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

export function withAuth(handler, options = {}) {
  const { roles = [], allowDemo = false } = options;

  return async function authedHandler(req, res) {
    const authHeader = req.headers.authorization;

    // Check for demo mode via query param or header
    if (allowDemo && !authHeader) {
      const demoClubId = req.query?.demoClubId || req.headers['x-demo-club'];
      if (demoClubId) {
        req.auth = { clubId: demoClubId, userId: 'demo', role: 'viewer', isDemo: true };
        return handler(req, res);
      }
    }

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);

    try {
      const result = await sql`
        SELECT s.user_id, s.club_id, s.role, s.expires_at, u.name, u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Session expired or invalid' });
      }

      const session = result.rows[0];

      // Role-based access control
      if (roles.length > 0 && !roles.includes(session.role) && session.role !== 'swoop_admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Attach auth context to request
      req.auth = {
        userId: session.user_id,
        clubId: session.club_id,
        role: session.role,
        name: session.name,
        email: session.email,
        isDemo: false,
      };

      return handler(req, res);
    } catch (e) {
      console.error('[withAuth] Session validation error:', e.message);
      return res.status(500).json({ error: 'Authentication service error' });
    }
  };
}

/**
 * Helper: Extract clubId from authenticated request.
 * For endpoints that accept clubId as query param but should be scoped to the authenticated user's club.
 * swoop_admin role can override with ?clubId=xxx query param.
 */
export function getClubId(req) {
  if (!req.auth) throw new Error('withAuth middleware not applied');
  // swoop_admin can query any club
  if (req.auth.role === 'swoop_admin' && req.query?.clubId) {
    return req.query.clubId;
  }
  return req.auth.clubId;
}
