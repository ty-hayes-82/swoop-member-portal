import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';
import { withAdminOverride } from './lib/withAdminOverride.js';
import { logWarn } from './lib/logger.js';

async function handler(req, res) {
  // B25: reads (GET activity feed) keep swoop_admin ?clubId= override; writes
  // (POST insert) are default-deny and always scope to the authenticated
  // session's club. DELETE (audit-log wipe) allows swoop_admin cross-club
  // override — every divergence is logged to cross_club_audit by the
  // withAdminOverride wrapper. SEC-3 role-gate + confirm token on DELETE
  // are still enforced below.
  let clubId;
  if (req.method === 'GET') {
    clubId = getReadClubId(req);
  } else if (req.method === 'DELETE') {
    clubId = getWriteClubId(req, {
      allowAdminOverride: true,
      reason: 'swoop_admin audit-log wipe (logged to cross_club_audit)',
    });
  } else {
    clubId = getWriteClubId(req);
  }
  try {
    if (req.method === 'POST') {
      // SEC-4: audit actor must come from the authenticated session, never the client body.
      // Any body.actor is ignored so clients can't spoof activity_log entries.
      const { actionType, actionSubtype, memberId, memberName, agentId, referenceId, referenceType, description, meta } = req.body;
      const actor = req.auth?.userId || 'unknown';

      if (!actionType) {
        return res.status(400).json({ error: 'actionType is required' });
      }

      await sql`
        INSERT INTO activity_log (action_type, action_subtype, actor, member_id, member_name, agent_id, reference_id, reference_type, description, meta, club_id)
        VALUES (${actionType}, ${actionSubtype ?? null}, ${actor}, ${memberId ?? null}, ${memberName ?? null}, ${agentId ?? null}, ${referenceId ?? null}, ${referenceType ?? null}, ${description ?? null}, ${JSON.stringify(meta ?? {})}, ${clubId})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // SEC-3: Destructive audit-log wipe. Lock down with hard role gate,
      // confirm-token matching the target clubId, and a forced paper trail.
      const actor = req.auth?.userId || 'unknown';
      const sessionClubId = req.auth?.clubId || null;
      const isDemo = req.auth?.isDemo === true;
      const ip = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null;

      if (isDemo || req.auth?.role !== 'swoop_admin') {
        logWarn('/api/activity', 'audit log DELETE rejected (role gate)', {
          actor, sessionClubId, targetClubId: clubId, role: req.auth?.role, isDemo, ip,
        });
        return res.status(403).json({ error: 'Forbidden: swoop_admin role required to clear activity log' });
      }

      const expectedToken = `YES_DELETE_AUDIT_LOG_FOR_${clubId}`;
      if (req.query?.confirm !== expectedToken) {
        logWarn('/api/activity', 'audit log DELETE rejected (confirm token)', {
          actor, sessionClubId, targetClubId: clubId, provided: req.query?.confirm || null, ip,
        });
        return res.status(400).json({
          error: 'Missing or invalid confirm token',
          message: `To clear the activity log for club ${clubId}, pass ?confirm=${expectedToken}`,
        });
      }

      // Force-log BEFORE the destructive op so the paper trail exists even if the DELETE fails.
      logWarn('/api/activity', 'audit log DELETE', {
        actor, sessionClubId, targetClubId: clubId, ip,
      });

      const delResult = await sql`DELETE FROM activity_log WHERE club_id = ${clubId}`;
      const deletedRows = delResult?.rowCount ?? 0;
      logWarn('/api/activity', 'audit log DELETE complete', {
        actor, sessionClubId, targetClubId: clubId, deletedRows, ip,
      });
      return res.status(200).json({ success: true, message: 'All activity history cleared', deletedRows });
    }

    // GET — fetch activity feed
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const type = req.query.type;
    const memberId = req.query.memberId;

    let result;
    if (type && memberId) {
      result = await sql`SELECT * FROM activity_log WHERE club_id = ${clubId} AND action_type = ${type} AND member_id = ${memberId} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (type) {
      result = await sql`SELECT * FROM activity_log WHERE club_id = ${clubId} AND action_type = ${type} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (memberId) {
      result = await sql`SELECT * FROM activity_log WHERE club_id = ${clubId} AND member_id = ${memberId} ORDER BY created_at DESC LIMIT ${limit}`;
    } else {
      result = await sql`SELECT * FROM activity_log WHERE club_id = ${clubId} ORDER BY created_at DESC LIMIT ${limit}`;
    }

    res.status(200).json({ activities: result.rows });
  } catch (error) {
    console.error('Activity API error:', error);
    res.status(500).json({ error: error.message });
  }
}

export default withAuth(
  withAdminOverride(handler, {
    adminTool: 'activity',
    reason: 'audit-log read/write/delete',
  }),
  { allowDemo: true },
);
