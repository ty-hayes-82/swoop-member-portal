/**
 * Migration 007: Add club_id to all tables for multi-tenant isolation
 *
 * Tables that already have club_id: club, courses, dining_outlets, members, bookings,
 * waitlist_entries, pos_checks (via outlet), event_definitions, email_campaigns,
 * feedback, staff, close_outs, member_waitlist (via member→club)
 *
 * Tables that need club_id added: households, membership_types, weather_daily,
 * canonical_events, service_requests, staff_shifts, visit_sessions,
 * member_engagement_daily, member_engagement_weekly, waitlist_config,
 * connected_systems, agent_definitions, agent_actions, board_report_snapshots,
 * member_interventions, operational_interventions, experience_correlations,
 * correlation_insights, event_roi_metrics, archetype_spend_gaps, activity_log
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const results = [];
  const errors = [];

  const alterations = [
    // Core entity tables
    { table: 'households', column: 'club_id', type: 'TEXT' },
    { table: 'membership_types', column: 'club_id', type: 'TEXT' },
    { table: 'weather_daily', column: 'club_id', type: 'TEXT' },

    // Engagement tracking
    { table: 'member_engagement_daily', column: 'club_id', type: 'TEXT' },
    { table: 'member_engagement_weekly', column: 'club_id', type: 'TEXT' },
    { table: 'visit_sessions', column: 'club_id', type: 'TEXT' },

    // Service & operations
    { table: 'service_requests', column: 'club_id', type: 'TEXT' },
    { table: 'staff_shifts', column: 'club_id', type: 'TEXT' },
    { table: 'canonical_events', column: 'club_id', type: 'TEXT' },

    // Board report & interventions
    { table: 'board_report_snapshots', column: 'club_id', type: 'TEXT' },
    { table: 'member_interventions', column: 'club_id', type: 'TEXT' },
    { table: 'operational_interventions', column: 'club_id', type: 'TEXT' },

    // Experience insights
    { table: 'experience_correlations', column: 'club_id', type: 'TEXT' },
    { table: 'correlation_insights', column: 'club_id', type: 'TEXT' },
    { table: 'event_roi_metrics', column: 'club_id', type: 'TEXT' },
    { table: 'archetype_spend_gaps', column: 'club_id', type: 'TEXT' },

    // Agent system
    { table: 'agent_definitions', column: 'club_id', type: 'TEXT' },
    { table: 'agent_actions', column: 'club_id', type: 'TEXT' },

    // Integrations & config
    { table: 'connected_systems', column: 'club_id', type: 'TEXT' },
    { table: 'industry_benchmarks', column: 'club_id', type: 'TEXT' },

    // Activity log
    { table: 'activity_log', column: 'club_id', type: 'TEXT' },

    // Location intelligence
    { table: 'member_location_current', column: 'club_id', type: 'TEXT' },
    { table: 'staff_location_current', column: 'club_id', type: 'TEXT' },
    { table: 'service_recovery_alerts', column: 'club_id', type: 'TEXT' },

    // Tee sheet ops
    { table: 'booking_confirmations', column: 'club_id', type: 'TEXT' },
    { table: 'slot_reassignments', column: 'club_id', type: 'TEXT' },

    // Health scores (may already have it)
    { table: 'health_scores', column: 'club_id', type: 'TEXT' },

    // Members table: add data_completeness column
    { table: 'members', column: 'data_completeness', type: 'INTEGER DEFAULT 0' },

    // Rounds, transactions, complaints (newer tables from import-csv)
    { table: 'rounds', column: 'club_id', type: 'TEXT' },
    { table: 'transactions', column: 'club_id', type: 'TEXT' },
    { table: 'complaints', column: 'club_id', type: 'TEXT' },
  ];

  for (const alt of alterations) {
    try {
      await sql.query(`ALTER TABLE ${alt.table} ADD COLUMN IF NOT EXISTS ${alt.column} ${alt.type}`);
      results.push(`${alt.table}.${alt.column} — added`);
    } catch (e) {
      if (e.message?.includes('already exists') || e.message?.includes('does not exist')) {
        results.push(`${alt.table}.${alt.column} — skipped (${e.message.includes('already exists') ? 'exists' : 'table missing'})`);
      } else {
        errors.push(`${alt.table}.${alt.column} — ERROR: ${e.message}`);
      }
    }
  }

  // Fix waitlist_config primary key (currently hardcoded to 'oakmont')
  try {
    // Drop the old hardcoded default and make club_id a proper column
    await sql`ALTER TABLE waitlist_config ALTER COLUMN club_id DROP DEFAULT`;
    results.push('waitlist_config — removed hardcoded default');
  } catch (e) {
    results.push(`waitlist_config default — skipped: ${e.message}`);
  }

  // Add composite indexes for tenant-scoped queries
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_households_club ON households(club_id)',
    'CREATE INDEX IF NOT EXISTS idx_engagement_weekly_club ON member_engagement_weekly(club_id, week_number)',
    'CREATE INDEX IF NOT EXISTS idx_engagement_daily_club ON member_engagement_daily(club_id, date)',
    'CREATE INDEX IF NOT EXISTS idx_canonical_club ON canonical_events(club_id, entity_type)',
    'CREATE INDEX IF NOT EXISTS idx_service_req_club ON service_requests(club_id)',
    'CREATE INDEX IF NOT EXISTS idx_staff_shifts_club ON staff_shifts(club_id, shift_date)',
    'CREATE INDEX IF NOT EXISTS idx_board_snapshots_club ON board_report_snapshots(club_id, snapshot_date)',
    'CREATE INDEX IF NOT EXISTS idx_agent_actions_club ON agent_actions(club_id, status)',
    'CREATE INDEX IF NOT EXISTS idx_activity_log_club ON activity_log(club_id, created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_visit_sessions_club ON visit_sessions(club_id)',
    'CREATE INDEX IF NOT EXISTS idx_connected_systems_club ON connected_systems(club_id)',
  ];

  for (const idx of indexes) {
    try {
      await sql.query(idx);
      results.push(`Index: ${idx.split(' ON ')[0].split('idx_')[1]} — created`);
    } catch (e) {
      errors.push(`Index error: ${e.message}`);
    }
  }

  // Backfill: set club_id = 'club_001' (Oakmont Hills) for all existing rows where club_id IS NULL
  const backfillTables = alterations
    .filter(a => a.column === 'club_id')
    .map(a => a.table);

  let backfilled = 0;
  for (const table of backfillTables) {
    try {
      const result = await sql.query(
        `UPDATE ${table} SET club_id = 'club_001' WHERE club_id IS NULL`
      );
      if (result.rowCount > 0) {
        backfilled += result.rowCount;
        results.push(`Backfill ${table}: ${result.rowCount} rows → club_001`);
      }
    } catch (e) {
      // Table might not exist yet
    }
  }

  res.status(200).json({
    migration: '007-add-club-id-tenant-isolation',
    alterations: results.length,
    backfilledRows: backfilled,
    errors: errors.length,
    details: results,
    errorDetails: errors,
  });
}
