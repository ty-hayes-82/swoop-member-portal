/**
 * Migration 009: Ensure club_id exists on ALL tables queried by API endpoints
 *
 * Migrations 007 skipped tables that "should" already have club_id from the
 * original schema. But databases created from older schema versions may be
 * missing these columns, causing 500 errors on /api/trends, /api/operations,
 * /api/fb, /api/staffing, /api/briefing.
 *
 * This migration is idempotent — ADD COLUMN IF NOT EXISTS is safe to re-run.
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const errors = [];

  // Every table that any API endpoint queries with WHERE club_id = ...
  const tables = [
    // Core reference (should have club_id but ensure)
    'courses', 'dining_outlets', 'membership_types', 'households',
    // Members & engagement
    'members', 'member_engagement_daily', 'member_engagement_weekly',
    // Golf operations
    'bookings', 'booking_players', 'pace_of_play', 'pace_hole_segments',
    // F&B
    'pos_checks', 'pos_line_items', 'pos_payments', 'close_outs',
    // Events & email
    'event_definitions', 'event_registrations', 'email_campaigns', 'email_events',
    // Service & feedback
    'feedback', 'service_requests',
    // Staffing
    'staff', 'staff_shifts',
    // Analytics
    'health_scores', 'rounds', 'transactions', 'complaints',
    'waitlist_entries', 'visit_sessions', 'weather_daily',
    // Agent system
    'agent_definitions', 'agent_actions',
    // Board report
    'board_report_snapshots', 'member_interventions', 'operational_interventions',
    // Experience insights
    'experience_correlations', 'correlation_insights',
    'event_roi_metrics', 'archetype_spend_gaps',
    // Integrations & config
    'connected_systems', 'industry_benchmarks', 'activity_log',
    // Location intelligence
    'member_location_current', 'staff_location_current',
    'service_recovery_alerts', 'booking_confirmations', 'slot_reassignments',
    // Platform
    'member_invoices', 'member_waitlist', 'cancellation_risk', 'demand_heatmap',
    'waitlist_config', 'csv_imports', 'data_source_status',
  ];

  for (const table of tables) {
    try {
      await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS club_id TEXT`);
      results.push(`${table}: ok`);
    } catch (e) {
      if (e.message.includes('does not exist')) {
        results.push(`${table}: table not found (skipped)`);
      } else if (e.message.includes('already exists')) {
        results.push(`${table}: already has club_id`);
      } else {
        errors.push(`${table}: ${e.message}`);
      }
    }
  }

  // Backfill any NULL club_id values to 'club_001' (existing Oakmont data)
  let backfilled = 0;
  for (const table of tables) {
    try {
      const result = await sql.query(
        `UPDATE ${table} SET club_id = 'club_001' WHERE club_id IS NULL`
      );
      backfilled += result.rowCount || 0;
    } catch {
      // Table may not exist or have no rows — safe to skip
    }
  }

  // Also ensure is_slow_round exists on pace_of_play (referenced by trends/operations)
  try {
    await sql`ALTER TABLE pace_of_play ADD COLUMN IF NOT EXISTS is_slow_round BOOLEAN DEFAULT false`;
    results.push('pace_of_play.is_slow_round: ok');
  } catch (e) {
    errors.push(`pace_of_play.is_slow_round: ${e.message}`);
  }

  // Ensure is_understaffed exists on close_outs (referenced by staffing)
  try {
    await sql`ALTER TABLE close_outs ADD COLUMN IF NOT EXISTS is_understaffed BOOLEAN DEFAULT false`;
    results.push('close_outs.is_understaffed: ok');
  } catch (e) {
    errors.push(`close_outs.is_understaffed: ${e.message}`);
  }

  // Ensure post_round_dining exists on pos_checks (referenced by fb/operations)
  try {
    await sql`ALTER TABLE pos_checks ADD COLUMN IF NOT EXISTS post_round_dining BOOLEAN DEFAULT false`;
    results.push('pos_checks.post_round_dining: ok');
  } catch (e) {
    errors.push(`pos_checks.post_round_dining: ${e.message}`);
  }

  // Ensure membership_status exists on members (referenced by trends)
  try {
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'active'`;
    results.push('members.membership_status: ok');
  } catch (e) {
    errors.push(`members.membership_status: ${e.message}`);
  }

  res.status(200).json({
    migration: '009-ensure-club-id-everywhere',
    tablesProcessed: tables.length,
    backfilledRows: backfilled,
    results,
    errors,
    summary: `${results.length} columns checked, ${backfilled} rows backfilled, ${errors.length} errors`,
  });
}
