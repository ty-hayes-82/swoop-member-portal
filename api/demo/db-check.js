import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // List all tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    // Count rows in key tables
    const counts = {};
    const keyTables = ['members', 'club', 'bookings', 'booking_players', 'courses',
                       'event_definitions', 'event_registrations', 'feedback',
                       'pos_checks', 'pos_line_items', 'member_concierge_sessions',
                       'email_events', 'email_campaigns', 'staff', 'staff_shifts',
                       'weather_forecasts', 'agent_activity', 'playbook_runs',
                       'activity_log', 'member_health_scores'];

    for (const t of keyTables) {
      try {
        const r = await sql.query(`SELECT COUNT(*) as cnt FROM ${t}`);
        counts[t] = parseInt(r.rows[0]?.cnt || 0);
      } catch {
        counts[t] = 'TABLE_NOT_FOUND';
      }
    }

    // Check for seed_pinetree members specifically
    let sampleMembers = [];
    try {
      const m = await sql`SELECT member_id, first_name, last_name, club_id, health_score FROM members WHERE club_id = 'seed_pinetree' LIMIT 10`;
      sampleMembers = m.rows;
    } catch { sampleMembers = ['query_failed']; }

    return res.status(200).json({
      total_tables: tables.rows.length,
      table_names: tables.rows.map(r => r.table_name),
      row_counts: counts,
      seed_pinetree_members: sampleMembers,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
