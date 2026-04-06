/**
 * Migration 012 — Rebrand club_001 from Oakmont Hills to Pinetree Country Club
 * Updates the club record and any references in the database.
 *
 * Callable as API: GET /api/migrations/012-rebrand-pinetree
 */
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Update club record
    const result = await sql`
      UPDATE club SET
        name = 'Pinetree Country Club',
        city = 'Kennesaw',
        state = 'GA',
        zip = '30144'
      WHERE club_id = 'club_001'
      RETURNING *
    `;

    // Update waitlist_config if it still uses 'oakmont' as PK
    try {
      await sql`UPDATE waitlist_config SET club_id = 'club_001' WHERE club_id = 'oakmont'`;
    } catch { /* may not exist or already updated */ }

    // Also update users table email domain if needed
    try {
      await sql`UPDATE users SET email = REPLACE(email, '@oakmonthills.com', '@pinetreecc.com') WHERE email LIKE '%@oakmonthills.com'`;
    } catch { /* may not exist */ }

    // Clean up junk clubs (delete all except club_001) if ?cleanup=true
    let cleaned = 0;
    if (req.query?.cleanup === 'true') {
      try {
        // First delete from all referencing tables
        const tables = [
          'playbook_steps','playbook_runs','agent_activity','agent_configs','agent_actions',
          'agent_definitions','notification_preferences','notifications','sessions','password_resets',
          'csv_imports','data_syncs','data_source_status','feature_state_log','onboarding_progress',
          'activity_log','correlation_insights','experience_correlations','correlations',
          'churn_predictions','member_sentiment_ratings','health_scores','interventions','actions',
          'member_interventions','operational_interventions','board_report_snapshots',
          'complaint_weather_context','weather_hourly_cache','weather_daily_log','weather_daily',
          'service_recovery_alerts','slot_reassignments','booking_confirmations',
          'member_location_current','staff_location_current','waitlist_config','connected_systems',
          'industry_benchmarks','event_roi_metrics','archetype_spend_gaps','demand_heatmap',
          'cancellation_risk','member_waitlist','member_engagement_weekly','member_engagement_daily',
          'visit_sessions','canonical_events','close_outs','staff_shifts','staff',
          'email_events','email_campaigns','feedback','service_requests','complaints',
          'transactions','rounds','member_invoices','event_registrations','event_definitions',
          'pos_payments','pos_line_items','pos_checks','waitlist_entries','pace_hole_segments',
          'pace_of_play','booking_players','bookings','members','households','membership_types',
          'dining_outlets','courses','users','club'
        ];
        for (const t of tables) {
          try {
            const r = await sql.query(`DELETE FROM ${t} WHERE club_id != 'club_001'`);
            cleaned += r.rowCount || 0;
          } catch {}
        }
      } catch {}
    }

    return res.status(200).json({
      success: true,
      message: 'club_001 rebranded to Pinetree Country Club, Kennesaw GA',
      club: result.rows[0] || null,
      ...(req.query?.cleanup === 'true' ? { junkRowsDeleted: cleaned } : {}),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
