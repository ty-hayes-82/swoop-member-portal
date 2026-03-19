import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // Seed member_location_current
    await sql`INSERT INTO member_location_current (member_id, lat, lng, zone, zone_id, status, health_score, time_in_zone, needs_attention, recommended_action)
      VALUES
        ('mbr_101', 34.0412, -84.5995, 'Course, Hole 14', 'golf', 'at-risk', 48, '2h 10m', true, 'Greet at turn — offer beverage credit.'),
        ('mbr_205', 34.0399, -84.5978, 'Grill Room', 'dining', 'at-risk', 51, '35m', true, 'Table visit by F&B manager recommended.'),
        ('mbr_188', 34.0405, -84.5960, 'Driving Range', 'range', 'at-risk', 55, '45m', true, 'First visit in 3 weeks — welcome back personally.'),
        ('mbr_102', 34.0415, -84.5988, 'Course, Hole 7', 'golf', 'healthy', 82, '1h 20m', false, 'No action needed.'),
        ('mbr_201', 34.0398, -84.5976, 'Grill Room', 'dining', 'healthy', 78, '50m', false, 'No action needed.')
      ON CONFLICT (member_id) DO NOTHING`;

    // Seed staff_location_current
    await sql`INSERT INTO staff_location_current (staff_id, name, role, lat, lng, zone, status, eta_text)
      VALUES
        ('stf_01', 'Maya Patel', 'F&B', 34.0399, -84.5978, 'Grill Room', 'Available', 'ETA 2 min'),
        ('stf_02', 'Jordan Lee', 'Member Services', 34.0401, -84.5982, 'Clubhouse', 'With member', 'ETA 5 min'),
        ('stf_03', 'Noah Bennett', 'Golf Operations', 34.0405, -84.5960, 'Driving Range', 'Available', 'ETA 3 min'),
        ('stf_04', 'Elena Ruiz', 'Pool', 34.0393, -84.5970, 'Pool Deck', 'Available', 'ETA 4 min'),
        ('stf_05', 'Caleb Wright', 'Pro Shop', 34.0402, -84.5980, 'Pro Shop', 'On radio', 'ETA 3 min')
      ON CONFLICT (staff_id) DO NOTHING`;

    // Seed service_recovery_alerts
    await sql`INSERT INTO service_recovery_alerts (alert_id, member_id, severity, zone, title, detail, created_at)
      VALUES
        ('sra_001', 'mbr_101', 'high', 'Course - Hole 14', 'At-risk member finishing round', 'Health score 48. Completing back 9 — intercept at turn or clubhouse.', NOW() - INTERVAL '15 minutes'),
        ('sra_002', 'mbr_205', 'high', 'Grill Room', 'Filed complaint last week', 'Noise complaint 6/1, no follow-up. Currently dining — F&B manager table visit recommended.', NOW() - INTERVAL '10 minutes'),
        ('sra_003', 'mbr_188', 'medium', 'Driving Range', 'First visit in 3 weeks', 'Was weekly visitor. Gap detected — personal welcome back and check-in suggested.', NOW() - INTERVAL '25 minutes')
      ON CONFLICT (alert_id) DO NOTHING`;

    res.status(200).json({ ok: true, message: 'Location seed data inserted.' });
  } catch (err) {
    console.error('/api/seed-location error:', err);
    res.status(500).json({ error: err.message });
  }
}
