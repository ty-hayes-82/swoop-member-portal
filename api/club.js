/**
 * Club Management API
 * GET    /api/club              — list all clubs
 * GET    /api/club?clubId=xxx   — get single club details
 * PUT    /api/club              — update club record in DB
 * DELETE /api/club?clubId=xxx   — cascade-delete all data for a club
 *
 * DELETE is restricted to swoop_admin role (or demo cleanup).
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId, getWriteClubId } from './lib/withAuth.js';

// All tables with a club_id column, ordered so FKs delete before parents
const CLUB_TABLES = [
  // Children / leaf tables first
  'playbook_steps',
  'playbook_runs',
  'agent_activity',
  'agent_configs',
  'agent_actions',
  'agent_definitions',
  'notification_preferences',
  'notifications',
  'sessions',
  'password_resets',
  'csv_imports',
  'data_syncs',
  'data_source_status',
  'feature_state_log',
  'feature_dependency',
  'onboarding_progress',
  'pause_state',
  'activity_log',
  'correlation_insights',
  'experience_correlations',
  'correlations',
  'churn_predictions',
  'member_sentiment_ratings',
  'health_scores',
  'interventions',
  'actions',
  'member_interventions',
  'operational_interventions',
  'board_report_snapshots',
  'user_sessions',
  'complaint_weather_context',
  'weather_hourly_cache',
  'weather_daily_log',
  'weather_daily',
  'service_recovery_alerts',
  'slot_reassignments',
  'booking_confirmations',
  'member_location_current',
  'staff_location_current',
  'waitlist_config',
  'connected_systems',
  'industry_benchmarks',
  'event_roi_metrics',
  'archetype_spend_gaps',
  'demand_heatmap',
  'cancellation_risk',
  'member_waitlist',
  'member_engagement_weekly',
  'member_engagement_daily',
  'visit_sessions',
  'canonical_events',
  'close_outs',
  'staff_shifts',
  'staff',
  'email_events',
  'email_campaigns',
  'feedback',
  'service_requests',
  'complaints',
  'transactions',
  'rounds',
  'member_invoices',
  'event_registrations',
  'event_definitions',
  'pos_payments',
  'pos_line_items',
  'pos_checks',
  'waitlist_entries',
  'pace_hole_segments',
  'pace_of_play',
  'booking_players',
  'bookings',
  // Parent tables
  'members',
  'households',
  'membership_types',
  'dining_outlets',
  'courses',
  'users',
  // Club itself — last
  'club',
];

export default withAuth(async function handler(req, res) {
  // ─── GET: list clubs or get single club ───
  if (req.method === 'GET') {
    try {
      // swoop_admin gets two modes:
      //   ?clubId=X  → fetch that club's details (list-of-one)
      //   no clubId  → list ALL clubs
      // Non-admins always see only their session club. We can't use
      // getReadClubId here because the helper has no "list everything"
      // sentinel — admins legitimately need to detect the absence of a
      // query param to switch modes. The role gate on the next line keeps
      // non-admins safe.
      const isAdmin = req.auth.role === 'swoop_admin';
      const adminTargetClubId = isAdmin ? (req.query?.clubId || null) : null; // lint-clubid-allow: swoop_admin list-vs-single mode switch (role-gated)
      const clubId = isAdmin ? adminTargetClubId : getReadClubId(req);
      if (clubId) {
        const result = await sql`SELECT * FROM club WHERE club_id = ${clubId}`;
        if (result.rows.length === 0) return res.status(404).json({ error: 'Club not found' });

        // Get member count
        const memberCount = await sql`SELECT COUNT(*) as count FROM members WHERE club_id = ${clubId}`;

        return res.status(200).json({
          ...result.rows[0],
          memberCount: Number(memberCount.rows[0]?.count || 0),
        });
      }

      // List all clubs with member counts
      const result = await sql`
        SELECT c.*,
          (SELECT COUNT(*) FROM members m WHERE m.club_id = c.club_id) as member_count,
          (SELECT MAX(s.created_at) FROM sessions s WHERE s.club_id = c.club_id) as last_activity
        FROM club c
        ORDER BY c.name
      `;
      return res.status(200).json({ clubs: result.rows });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── PUT: update club details ───
  if (req.method === 'PUT') {
    const { name, city, state, zip } = req.body;
    // swoop_admin may update any club by passing clubId in body or query;
    // everyone else is locked to their session club. getWriteClubId honors
    // both query and body when allowAdminOverride is set (B27), and falls
    // back to req.auth.clubId for non-admins.
    const clubId = getWriteClubId(req, {
      allowAdminOverride: true,
      reason: 'swoop_admin club metadata update',
    });
    if (!clubId) return res.status(400).json({ error: 'clubId required' });

    try {
      await sql`
        UPDATE club SET
          name = COALESCE(${name || null}, name),
          city = COALESCE(${city || null}, city),
          state = COALESCE(${state || null}, state),
          zip = COALESCE(${zip || null}, zip)
        WHERE club_id = ${clubId}
      `;
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ─── POST with ?cleanup=true: sendBeacon demo cleanup (same as DELETE) ───
  if (req.method === 'POST' && req.query?.cleanup === 'true') {
    req.method = 'DELETE'; // fall through to DELETE handler below
  }

  // ─── DELETE: cascade-delete all club data ───
  if (req.method === 'DELETE') {
    // swoop_admin may delete any club via ?clubId; demo cleanup flows use
    // the allowDemo bypass with a demo_* id. Both paths route through
    // getWriteClubId for the admin path; demo branch reads ?clubId directly
    // because the helper does not honor the demo role.
    let clubId;
    if (req.auth.isDemo) {
      clubId = req.query?.clubId; // lint-clubid-allow: demo cleanup branch, gated to demo_* below
    } else {
      clubId = getWriteClubId(req, {
        allowAdminOverride: true,
        reason: 'swoop_admin club cascade delete',
      });
    }
    if (!clubId) return res.status(400).json({ error: 'clubId query param required' });

    // Only swoop_admin can delete (or demo cleanup of demo club)
    const isDemoCleanup = clubId.startsWith('demo_');
    if (req.auth.role !== 'swoop_admin' && !isDemoCleanup && !req.auth.isDemo) {
      return res.status(403).json({ error: 'Only swoop_admin can delete club data' });
    }

    // Safety: prevent deleting club_001 (seed data) unless forced
    if (clubId === 'club_001' && req.query?.force !== 'true') {
      return res.status(400).json({
        error: 'club_001 is the primary demo club. Pass ?force=true to confirm deletion.'
      });
    }

    try {
      let deletedCounts = {};

      // Pass 1: delete from all tables by club_id
      for (const table of CLUB_TABLES) {
        try {
          const result = await sql.query(
            `DELETE FROM ${table} WHERE club_id = $1`,
            [clubId]
          );
          deletedCounts[table] = result.rowCount || 0;
        } catch {
          deletedCounts[table] = 'pass1-skip';
        }
      }

      // Pass 2: clean up orphan rows in child tables that reference parent rows being deleted
      // email_events references email_campaigns; event_registrations references event_definitions
      const orphanCleanup = [
        `DELETE FROM email_events WHERE campaign_id IN (SELECT campaign_id FROM email_campaigns WHERE club_id = $1)`,
        `DELETE FROM event_registrations WHERE event_id IN (SELECT event_id FROM event_definitions WHERE club_id = $1)`,
        `DELETE FROM booking_players WHERE booking_id IN (SELECT booking_id FROM bookings WHERE club_id = $1)`,
        `DELETE FROM pos_line_items WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
        `DELETE FROM pos_payments WHERE check_id IN (SELECT check_id FROM pos_checks WHERE club_id = $1)`,
        `DELETE FROM pace_hole_segments WHERE pace_id IN (SELECT pace_id FROM pace_of_play WHERE club_id = $1)`,
      ];
      for (const q of orphanCleanup) {
        try { await sql.query(q, [clubId]); } catch {}
      }

      // Pass 3: retry any skipped tables
      for (const table of CLUB_TABLES) {
        if (deletedCounts[table] === 'pass1-skip') {
          try {
            const result = await sql.query(`DELETE FROM ${table} WHERE club_id = $1`, [clubId]);
            deletedCounts[table] = result.rowCount || 0;
          } catch (e) {
            deletedCounts[table] = `err: ${e.message?.substring(0, 80)}`;
          }
        }
      }

      const totalDeleted = Object.values(deletedCounts)
        .filter(v => typeof v === 'number')
        .reduce((a, b) => a + b, 0);

      return res.status(200).json({
        success: true,
        clubId,
        totalRowsDeleted: totalDeleted,
        details: deletedCounts,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { allowDemo: true });
