import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    // Create tables if not exists
    await sql`CREATE TABLE IF NOT EXISTS member_location_current (
      member_id TEXT PRIMARY KEY,
      zone VARCHAR(100),
      sub_location VARCHAR(100),
      check_in_time TIMESTAMPTZ DEFAULT NOW(),
      health_status VARCHAR(20),
      activity_type VARCHAR(50)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS staff_location_current (
      staff_id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(100),
      zone VARCHAR(50),
      status VARCHAR(20),
      eta_minutes INT,
      department VARCHAR(50)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS service_recovery_alerts (
      alert_id SERIAL PRIMARY KEY,
      member_id VARCHAR(20),
      member_name VARCHAR(100),
      severity VARCHAR(20),
      zone VARCHAR(50),
      detail TEXT,
      recommended_action TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )`;

    // Seed member_location_current
    await sql`INSERT INTO member_location_current (member_id, zone, sub_location, check_in_time, health_status, activity_type)
      VALUES
        ('mbr_101', 'Course - Hole 14', 'Back 9', NOW() - INTERVAL '2 hours', 'at-risk', 'golf'),
        ('mbr_205', 'Grill Room', 'Main Floor', NOW() - INTERVAL '35 minutes', 'at-risk', 'dining'),
        ('mbr_188', 'Driving Range', 'Bay 4', NOW() - INTERVAL '45 minutes', 'at-risk', 'range'),
        ('mbr_102', 'Course - Hole 7', 'Front 9', NOW() - INTERVAL '80 minutes', 'healthy', 'golf'),
        ('mbr_201', 'Grill Room', 'Patio', NOW() - INTERVAL '50 minutes', 'healthy', 'dining')
      ON CONFLICT (member_id) DO NOTHING`;

    // Seed staff_location_current
    await sql`INSERT INTO staff_location_current (staff_id, name, zone, status, eta_minutes, department)
      VALUES
        ('stf_01', 'Maya Patel', 'Grill Room', 'Available', 2, 'F&B'),
        ('stf_02', 'Jordan Lee', 'Clubhouse', 'With member', 5, 'Member Services'),
        ('stf_03', 'Noah Bennett', 'Driving Range', 'Available', 3, 'Golf Operations'),
        ('stf_04', 'Elena Ruiz', 'Pool Deck', 'Available', 4, 'Pool'),
        ('stf_05', 'Caleb Wright', 'Pro Shop', 'On radio', 3, 'Pro Shop')
      ON CONFLICT (staff_id) DO NOTHING`;

    // Seed service_recovery_alerts
    await sql`INSERT INTO service_recovery_alerts (member_id, member_name, severity, zone, detail, recommended_action, created_at)
      VALUES
        ('mbr_101', 'James Whitfield', 'high', 'Course - Hole 14', 'At-risk member (score 42) finishing round. Has not dined in 6 weeks.', 'F&B manager greet at Grill Room with usual order when he finishes.', NOW() - INTERVAL '15 minutes'),
        ('mbr_205', 'Sandra Chen', 'high', 'Grill Room', 'Filed complaint last week about slow service. Currently dining.', 'GM should stop by table for personal recovery check-in.', NOW() - INTERVAL '10 minutes'),
        ('mbr_188', 'Robert Mills', 'medium', 'Driving Range', 'First visit in 3 weeks. Positive re-engagement signal.', 'Pro shop should offer complimentary lesson.', NOW() - INTERVAL '25 minutes')`;

    res.status(200).json({ success: true, seeded: { member_location_current: 5, staff_location_current: 5, service_recovery_alerts: 3 } });
  } catch (err) {
    console.error('/api/seed-location error:', err);
    res.status(500).json({ error: err.message });
  }
}
