import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    // Create table if not exists
    await sql`CREATE TABLE IF NOT EXISTS industry_benchmarks (
      metric_key VARCHAR(50) PRIMARY KEY,
      club_value NUMERIC(12,2),
      industry_value NUMERIC(12,2),
      unit VARCHAR(10),
      label VARCHAR(100),
      comparison_text VARCHAR(50),
      direction VARCHAR(20)
    )`;

    await sql`
      INSERT INTO industry_benchmarks (metric_key, club_value, industry_value, unit, label, comparison_text, direction) VALUES
        ('member_retention', 94.2, 88.5, '%', 'Member Retention Rate', '5.7 pts above average', 'up'),
        ('avg_health_score', 68.4, 62.0, 'pts', 'Avg Member Health Score', '6.4 pts above average', 'up'),
        ('complaint_resolution', 89.0, 71.0, '%', 'Complaint Resolution (24h)', '18 pts above average', 'up'),
        ('fb_revenue_per_member', 4200, 3100, '$', 'F&B Revenue Per Member', '35% above average', 'up'),
        ('rounds_per_member', 42, 36, '', 'Rounds Per Member/Year', '17% above average', 'up'),
        ('response_time', 4.2, 48.0, 'hrs', 'Avg Response Time', '91% faster', 'down'),
        ('event_attendance', 68, 45, '%', 'Event Participation Rate', '23 pts above average', 'up'),
        ('email_open_rate', 42, 28, '%', 'Email Open Rate', '50% above average', 'up')
      ON CONFLICT (metric_key) DO NOTHING
    `;

    res.status(200).json({ success: true, message: 'Seeded industry_benchmarks (8 rows, ON CONFLICT DO NOTHING)' });
  } catch (err) {
    console.error('/api/seed-benchmarks error:', err);
    res.status(500).json({ error: err.message });
  }
}
