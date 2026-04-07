import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    // ── Create tables if they don't exist ──────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS board_report_snapshots (
        id SERIAL PRIMARY KEY,
        snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
        members_saved INT NOT NULL DEFAULT 0,
        dues_protected NUMERIC(12,2) NOT NULL DEFAULT 0,
        ltv_protected NUMERIC(12,2) NOT NULL DEFAULT 0,
        revenue_recovered NUMERIC(12,2) NOT NULL DEFAULT 0,
        service_failures_caught INT NOT NULL DEFAULT 0,
        avg_response_time_hrs NUMERIC(4,1) NOT NULL DEFAULT 0,
        board_confidence_pct INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS member_interventions (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(20) NOT NULL,
        health_before INT NOT NULL,
        health_after INT NOT NULL,
        trigger TEXT NOT NULL,
        action TEXT NOT NULL,
        outcome TEXT NOT NULL,
        dues_at_risk NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS operational_interventions (
        id SERIAL PRIMARY KEY,
        event VARCHAR(100) NOT NULL,
        event_date DATE NOT NULL,
        detection TEXT NOT NULL,
        action TEXT NOT NULL,
        outcome TEXT NOT NULL,
        revenue_protected NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL DEFAULT 'gm_default',
        last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── Clear existing seed data ───────────────────────────────────────

    await sql`DELETE FROM board_report_snapshots WHERE snapshot_date >= '2025-09-01'`;
    await sql`DELETE FROM member_interventions WHERE member_id IN ('mbr_038','mbr_112','mbr_087','mbr_156','mbr_091','mbr_178')`;
    await sql`DELETE FROM operational_interventions WHERE event_date >= '2026-01-01'`;
    await sql`DELETE FROM user_sessions WHERE user_id = 'gm_default'`;

    // ── Board report snapshots (monthly trend + current totals) ────────

    // Monthly snapshots for trend line
    await sql`
      INSERT INTO board_report_snapshots (snapshot_date, members_saved, dues_protected, ltv_protected, revenue_recovered, service_failures_caught, avg_response_time_hrs, board_confidence_pct)
      VALUES
        ('2025-09-30', 1, 12000, 60000, 3200, 4, 8.1, 62),
        ('2025-10-31', 2, 28000, 140000, 8500, 5, 6.8, 71),
        ('2025-11-30', 2, 31000, 155000, 14200, 4, 5.9, 78),
        ('2025-12-31', 3, 38000, 190000, 22800, 5, 5.2, 83),
        ('2026-01-31', 3, 42000, 210000, 34100, 3, 4.2, 89),
        ('2026-02-28', 3, 17000, 85000, 8400, 2, 3.8, 92)
    `;

    // Current cumulative snapshot (the one the board report KPI cards pull)
    await sql`
      INSERT INTO board_report_snapshots (snapshot_date, members_saved, dues_protected, ltv_protected, revenue_recovered, service_failures_caught, avg_response_time_hrs, board_confidence_pct)
      VALUES ('2026-03-19', 14, 168000, 840000, 42500, 23, 4.2, 94)
    `;

    // ── Member interventions ───────────────────────────────────────────

    await sql`
      INSERT INTO member_interventions (member_id, health_before, health_after, trigger, action, outcome, dues_at_risk)
      VALUES
        ('mbr_038', 34, 71,
         'Pace-of-play complaint went unresolved for 5 days; spend dropped 40%',
         'GM personal call + complimentary round + service recovery note',
         'Re-engaged within 48 hrs, booked 3 rounds following week',
         18500),
        ('mbr_112', 41, 68,
         'Dining frequency dropped 60% after cold-food complaint',
         'F&B director outreach + private tasting invitation',
         'Returned to weekly dining pattern within 2 weeks',
         14200),
        ('mbr_087', 28, 62,
         'Family membership — kids program schedule conflict led to 3 missed events',
         'Membership director meeting + custom schedule accommodation',
         'Family re-enrolled in junior program, added pool membership',
         31000),
        ('mbr_156', 38, 74,
         'Pro shop billing dispute escalated twice without resolution',
         'Controller review + credit issued + personal follow-up from GM',
         'Dispute resolved, member upgraded to premium locker',
         16800),
        ('mbr_091', 45, 77,
         'Tee time availability frustration — 4 preferred slots missed in 2 weeks',
         'Priority booking window + starter introduction',
         'Secured regular Saturday 8am slot, satisfaction restored',
         12500),
        ('mbr_178', 31, 65,
         'Guest policy confusion led to embarrassing denial at gate',
         'Membership committee apology + revised guest pass issued same day',
         'Hosted 2 guest events following month, referred 1 new member',
         15000)
    `;

    // ── Operational interventions ──────────────────────────────────────

    await sql`
      INSERT INTO operational_interventions (event, event_date, detection, action, outcome, revenue_protected)
      VALUES
        ('Wind Advisory — Feb 8', '2026-02-08',
         'Weather API flagged 35mph gusts at 5:42am, 47 tee times at risk',
         'Auto-notified 47 members with reschedule options; moved 12 to simulator slots',
         '38 of 47 rebooked within 72 hrs, zero complaints filed',
         8400),
        ('Starter No-Show — Jan 22', '2026-01-22',
         'Staffing system detected no clock-in for AM starter by 6:15am',
         'Alert sent to Head Pro; backup starter dispatched by 6:28am',
         'First tee time (6:45am) launched on schedule, no member impact',
         0),
        ('Valentine Dinner Overbook — Feb 14', '2026-02-14',
         'Reservation system hit 110% capacity at 11am, 14 hrs before event',
         'Expanded to patio with heaters; added second seating at 8:30pm',
         'All 126 covers served, NPS 4.8/5 for the evening',
         12600)
    `;

    // ── User session seed ──────────────────────────────────────────────

    await sql`
      INSERT INTO user_sessions (user_id, last_login_at)
      VALUES ('gm_default', NOW() - INTERVAL '2 days')
    `;

    res.status(200).json({
      success: true,
      seeded: {
        board_report_snapshots: 7,
        member_interventions: 6,
        operational_interventions: 3,
        user_sessions: 1,
      },
    });
  } catch (err) {
    console.error('/api/seed-board-report error:', err);
    res.status(500).json({ error: err.message });
  }
}
