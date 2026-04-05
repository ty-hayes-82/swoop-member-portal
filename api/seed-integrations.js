import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    // Create table if not exists
    await sql`CREATE TABLE IF NOT EXISTS connected_systems (
      system_id VARCHAR(50) PRIMARY KEY,
      vendor_name VARCHAR(100),
      category VARCHAR(50),
      status VARCHAR(20) DEFAULT 'available',
      last_sync TIMESTAMPTZ,
      data_points_synced INT DEFAULT 0,
      config JSONB
    )`;

    await sql`
      INSERT INTO connected_systems (system_id, vendor_name, category, status, last_sync, data_points_synced, config) VALUES
        ('tee-sheet', 'ForeTees Tee Sheet', 'tee-sheet', 'connected', NOW() - INTERVAL '2 minutes', 14500, '{"endpoints":["teeTimes","pacing","playerRoster"]}'),
        ('pos', 'Lightspeed POS', 'pos', 'connected', NOW() - INTERVAL '4 minutes', 28300, '{"endpoints":["checks","lineItems","tenders"]}'),
        ('membership-mgmt', 'Northstar Club Management', 'membership', 'connected', NOW() - INTERVAL '5 minutes', 52100, '{"endpoints":["members","billing","statements"]}'),
        ('crm', 'Salesforce CRM', 'crm', 'connected', NOW() - INTERVAL '8 minutes', 31200, '{"endpoints":["contacts","opportunities","activities"]}'),
        ('email', 'Constant Contact', 'email', 'connected', NOW() - INTERVAL '15 minutes', 8900, '{"endpoints":["campaigns","lists","analytics"]}'),
        ('website', 'Club Website (WordPress)', 'website', 'connected', NOW() - INTERVAL '10 minutes', 4200, '{"endpoints":["analytics","forms","events"]}'),
        ('accounting', 'QuickBooks Online', 'accounting', 'connected', NOW() - INTERVAL '1 hour', 19800, '{"endpoints":["invoices","payments","reports"]}'),
        ('dining', 'OpenTable Reserve', 'dining', 'connected', NOW() - INTERVAL '6 minutes', 11200, '{"endpoints":["reservations","waitlist","guestProfiles"]}'),
        ('weather', 'Weather API', 'weather', 'connected', NOW() - INTERVAL '30 minutes', 2100, '{"endpoints":["forecast","historical","alerts"]}'),
        ('survey', 'SurveyMonkey', 'survey', 'connected', NOW() - INTERVAL '2 hours', 3400, '{"endpoints":["responses","surveys","collectors"]}'),
        ('golf-genius', 'Golf Genius', 'tournaments', 'pending', NULL, 0, '{}'),
        ('handicap', 'GHIN Handicap', 'handicap', 'connected', NOW() - INTERVAL '12 hours', 6700, '{"endpoints":["scores","handicapIndex","statistics"]}'),
        ('labor', 'ADP Workforce', 'labor', 'pending', NULL, 0, '{}'),
        ('inventory', 'Club Prophet Inventory', 'inventory', 'pending', NULL, 0, '{}'),
        ('access-control', 'Brivo Access Control', 'security', 'disconnected', NULL, 0, '{}'),
        ('pool', 'Pool Management System', 'amenities', 'not_started', NULL, 0, '{}'),
        ('tennis', 'CourtReserve Tennis', 'amenities', 'pending', NULL, 0, '{}'),
        ('fitness', 'Mindbody Fitness', 'fitness', 'not_started', NULL, 0, '{}'),
        ('spa', 'Booker Spa', 'spa', 'not_started', NULL, 0, '{}'),
        ('social-media', 'Sprout Social', 'social', 'pending', NULL, 0, '{}'),
        ('fleet', 'Fleet Management GPS', 'operations', 'not_started', NULL, 0, '{}'),
        ('irrigation', 'Toro Lynx Irrigation', 'grounds', 'not_started', NULL, 0, '{}'),
        ('maintenance', 'UpKeep Maintenance', 'operations', 'not_started', NULL, 0, '{}'),
        ('parking', 'ParkMobile', 'operations', 'not_started', NULL, 0, '{}'),
        ('locker', 'Locker Management', 'amenities', 'not_started', NULL, 0, '{}'),
        ('guest-wifi', 'Meraki Guest WiFi', 'technology', 'not_started', NULL, 0, '{}'),
        ('video', 'Toptracer Range', 'technology', 'not_started', NULL, 0, '{}'),
        ('marketing', 'HubSpot Marketing', 'marketing', 'pending', NULL, 0, '{}'),
        ('mobile-app', 'Club App (Custom)', 'mobile', 'pending', NULL, 0, '{}'),
        ('loyalty', 'Loyalty Program', 'engagement', 'not_started', NULL, 0, '{}')
      ON CONFLICT (system_id) DO NOTHING
    `;

    res.status(200).json({ success: true, message: 'Seeded connected_systems (30 rows, ON CONFLICT DO NOTHING)' });
  } catch (err) {
    console.error('/api/seed-integrations error:', err);
    res.status(500).json({ error: err.message });
  }
}
