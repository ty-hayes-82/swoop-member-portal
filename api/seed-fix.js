import { sql } from '@vercel/postgres';
import { cors } from './lib/cors.js';
import { logWarn } from './lib/logger.js';

const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';

const CANONICAL_OUTLETS = [
  ['outlet_main_dining', 'Main Dining Room', 'fine_dining', 'breakfast,dinner', 95, 150],
  ['outlet_grill', 'Grill Room', 'casual', 'lunch,dinner', 120, 175],
  ['outlet_bar_lounge', 'Bar/Lounge', 'bar', 'lunch,dinner', 80, 120],
  ['outlet_halfway_house', 'Halfway House', 'grab_go', 'breakfast,lunch', 70, 140],
  ['outlet_pool_bar', 'Pool Bar', 'bar', 'lunch', 35, 90],
];

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (IS_PROD && !ALLOW_DEBUG) {
    logWarn('/api/seed-fix', 'operator endpoint blocked in production', { ip: req.headers['x-forwarded-for'] });
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.method && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to trigger the seed-fix.' });
  }

  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS latest_week FROM member_engagement_weekly`;
    const latestWeek = Number(latestWeekResult.rows[0]?.latest_week ?? 0);
    if (!latestWeek) {
      return res.status(200).json({ ok: false, error: 'No member_engagement_weekly rows found.' });
    }

    // Normalize dues by membership type (not status).
    await sql.query(`
      UPDATE members
      SET annual_dues = CASE membership_type
        WHEN 'FG'  THEN 18000
        WHEN 'SOC' THEN  6000
        WHEN 'SPT' THEN 12000
        WHEN 'JR'  THEN  8000
        WHEN 'LEG' THEN 22000
        WHEN 'NR'  THEN 15000
        ELSE COALESCE(annual_dues, 12000)
      END
    `);

    // Force latest-week health distribution to realistic and stable buckets:
    // Healthy 254 / At Risk 34 / Critical 12.
    await sql.query(`
      WITH ranked AS (
        SELECT
          mew.member_id,
          ROW_NUMBER() OVER (ORDER BY md5(mew.member_id::text)) AS rn
        FROM member_engagement_weekly mew
        WHERE mew.week_number = ${latestWeek}
      )
      UPDATE member_engagement_weekly mew
      SET
        engagement_score = CASE
          WHEN r.rn <= 254 THEN 70 + (ABS(hashtext(r.member_id::text)) % 26)        -- 70..95
          WHEN r.rn <= 288 THEN 30 + (ABS(hashtext(r.member_id::text)) % 20)        -- 30..49
          ELSE 10 + (ABS(hashtext(r.member_id::text)) % 20)                          -- 10..29
        END,
        rounds_played = CASE
          WHEN r.rn <= 254 THEN 2 + (ABS(hashtext(r.member_id::text || 'r')) % 4)
          WHEN r.rn <= 288 THEN 0 + (ABS(hashtext(r.member_id::text || 'r')) % 2)
          ELSE 0
        END,
        dining_visits = CASE
          WHEN r.rn <= 254 THEN 2 + (ABS(hashtext(r.member_id::text || 'd')) % 4)
          WHEN r.rn <= 288 THEN 0 + (ABS(hashtext(r.member_id::text || 'd')) % 2)
          ELSE 0
        END,
        dining_spend = CASE
          WHEN r.rn <= 254 THEN 110 + (ABS(hashtext(r.member_id::text || 's')) % 260)
          WHEN r.rn <= 288 THEN 45 + (ABS(hashtext(r.member_id::text || 's')) % 95)
          ELSE 12 + (ABS(hashtext(r.member_id::text || 's')) % 40)
        END,
        events_attended = CASE
          WHEN r.rn <= 254 THEN 1 + (ABS(hashtext(r.member_id::text || 'e')) % 3)
          WHEN r.rn <= 288 THEN (ABS(hashtext(r.member_id::text || 'e')) % 2)
          ELSE 0
        END,
        email_open_rate = CASE
          WHEN r.rn <= 254 THEN 0.42 + ((ABS(hashtext(r.member_id::text || 'o')) % 36) / 100.0)
          WHEN r.rn <= 288 THEN 0.16 + ((ABS(hashtext(r.member_id::text || 'o')) % 24) / 100.0)
          ELSE 0.04 + ((ABS(hashtext(r.member_id::text || 'o')) % 10) / 100.0)
        END
      FROM ranked r
      WHERE mew.week_number = ${latestWeek}
        AND mew.member_id::text = r.member_id::text
    `);

    // Ensure decaying email trend is visible (last 3 weeks drift down for selected members).
    await sql.query(`
      WITH target AS (
        SELECT member_id::text AS member_id
        FROM member_engagement_weekly
        WHERE week_number = ${latestWeek}
          AND engagement_score < 50
        ORDER BY engagement_score ASC
        LIMIT 16
      ),
      three_weeks AS (
        SELECT DISTINCT week_number
        FROM member_engagement_weekly
        ORDER BY week_number DESC
        LIMIT 3
      ),
      ordered AS (
        SELECT week_number, ROW_NUMBER() OVER (ORDER BY week_number ASC) AS wk_rank
        FROM three_weeks
      )
      UPDATE member_engagement_weekly mew
      SET email_open_rate = CASE
        WHEN o.wk_rank = 1 THEN LEAST(0.62, mew.email_open_rate + 0.18)
        WHEN o.wk_rank = 2 THEN LEAST(0.45, mew.email_open_rate + 0.08)
        ELSE GREATEST(0.03, mew.email_open_rate - 0.10)
      END
      FROM ordered o
      JOIN target t ON t.member_id = mew.member_id::text
      WHERE mew.week_number = o.week_number
    `);

    // Canonical outlet list for F&B, plus ID normalization.
    await sql.query(`
      INSERT INTO dining_outlets (outlet_id, club_id, name, type, meal_periods, weekday_covers, weekend_covers) VALUES
        ('outlet_main_dining', 'club_001', 'Main Dining Room', 'fine_dining', 'breakfast,dinner', 95, 150),
        ('outlet_grill', 'club_001', 'Grill Room', 'casual', 'lunch,dinner', 120, 175),
        ('outlet_bar_lounge', 'club_001', 'Bar/Lounge', 'bar', 'lunch,dinner', 80, 120),
        ('outlet_halfway_house', 'club_001', 'Halfway House', 'grab_go', 'breakfast,lunch', 70, 140),
        ('outlet_pool_bar', 'club_001', 'Pool Bar', 'bar', 'lunch', 35, 90)
      ON CONFLICT (outlet_id) DO UPDATE
      SET name = EXCLUDED.name,
          type = EXCLUDED.type,
          meal_periods = EXCLUDED.meal_periods,
          weekday_covers = EXCLUDED.weekday_covers,
          weekend_covers = EXCLUDED.weekend_covers
    `);

    await sql.query(`
      UPDATE pos_checks
      SET outlet_id = CASE
        WHEN outlet_id IN ('outlet_main_dining', 'outlet_grill', 'outlet_bar_lounge', 'outlet_halfway_house', 'outlet_pool_bar')
          THEN outlet_id
        WHEN outlet_id = 'outlet_dining' THEN 'outlet_main_dining'
        WHEN outlet_id = 'outlet_bar' THEN 'outlet_bar_lounge'
        ELSE 'outlet_grill'
      END
    `);

    // Redistribute January checks so major outlets all have non-zero activity.
    await sql.query(`
      UPDATE pos_checks
      SET outlet_id = CASE
        WHEN ABS(hashtext(check_id::text)) % 100 < 28 THEN 'outlet_grill'
        WHEN ABS(hashtext(check_id::text)) % 100 < 52 THEN 'outlet_main_dining'
        WHEN ABS(hashtext(check_id::text)) % 100 < 72 THEN 'outlet_bar_lounge'
        WHEN ABS(hashtext(check_id::text)) % 100 < 88 THEN 'outlet_halfway_house'
        ELSE 'outlet_pool_bar'
      END
      WHERE opened_at::date >= '2026-01-01'::date
        AND opened_at::date < '2026-02-01'::date
    `);

    // Seed queue + cancellation risk + demand heatmap tables used by waitlist page.
    await sql`DELETE FROM demand_heatmap`;
    await sql`DELETE FROM cancellation_risk`;
    await sql`DELETE FROM member_waitlist`;

    await sql.query(`
      WITH latest AS (
        SELECT mew.member_id::text AS member_id, mew.engagement_score
        FROM member_engagement_weekly mew
        WHERE mew.week_number = ${latestWeek}
      ),
      pool AS (
        SELECT
          m.member_id::text AS member_id,
          l.engagement_score,
          ROW_NUMBER() OVER (
            ORDER BY (l.engagement_score < 50) DESC, l.engagement_score ASC, m.member_id::text
          ) AS rn
        FROM members m
        JOIN latest l ON l.member_id = m.member_id::text
        WHERE COALESCE(m.membership_status, 'active') <> 'resigned'
      ),
      chosen AS (
        SELECT * FROM pool WHERE rn <= 24
      )
      INSERT INTO member_waitlist (
        waitlist_id, member_id, course_id, requested_date, requested_slot,
        alternatives_accepted, days_waiting, retention_priority, notified_at, filled_at, dining_incentive_attached
      )
      SELECT
        'mwl_' || LPAD(rn::text, 3, '0') AS waitlist_id,
        member_id,
        'course_main' AS course_id,
        TO_CHAR((DATE '2026-01-01' + ((rn * 3) % 31) * INTERVAL '1 day')::date, 'YYYY-MM-DD') AS requested_date,
        (ARRAY['Sat 7:00','Sat 7:08','Sat 7:16','Sat 7:24','Sun 7:00','Sun 7:08','Fri 7:32','Sat 8:16'])[(rn % 8) + 1] AS requested_slot,
        (ARRAY['[\"Sat 8:24\",\"Sun 7:24\"]','[\"Sat 8:32\",\"Fri 8:08\"]','[\"Sun 7:16\",\"Fri 8:00\"]'])[(rn % 3) + 1] AS alternatives_accepted,
        1 + ((rn * 2) % 14) AS days_waiting,
        CASE WHEN engagement_score < 50 OR rn <= 10 THEN 'HIGH' ELSE 'NORMAL' END AS retention_priority,
        CASE WHEN rn % 3 = 0 THEN NULL ELSE TO_CHAR((DATE '2026-01-01' + ((rn * 3) % 31) * INTERVAL '1 day')::date, 'YYYY-MM-DD') || ' 08:1' || (rn % 6)::text || ':00' END AS notified_at,
        NULL AS filled_at,
        CASE WHEN engagement_score < 50 AND rn % 4 <> 0 THEN 1 ELSE 0 END AS dining_incentive_attached
      FROM chosen
    `);

    await sql.query(`
      WITH jan_bookings AS (
        SELECT booking_id, booking_date::date AS booking_date,
               ROW_NUMBER() OVER (ORDER BY booking_date::date, tee_time, booking_id) AS rn
        FROM bookings
        WHERE status = 'confirmed'
          AND booking_date::date >= '2026-01-01'::date
          AND booking_date::date < '2026-02-01'::date
        LIMIT 30
      ),
      wl AS (
        SELECT mw.member_id::text AS member_id, mew.engagement_score,
               ROW_NUMBER() OVER (ORDER BY mw.retention_priority DESC, mew.engagement_score ASC, mw.member_id::text) AS rn
        FROM member_waitlist mw
        JOIN member_engagement_weekly mew
          ON mew.member_id::text = mw.member_id::text
         AND mew.week_number = ${latestWeek}
      ),
      mapped AS (
        SELECT
          jb.booking_id,
          jb.booking_date,
          wl.member_id,
          wl.engagement_score,
          jb.rn
        FROM jan_bookings jb
        JOIN wl ON wl.rn = ((jb.rn - 1) % (SELECT COUNT(*) FROM wl)) + 1
      )
      INSERT INTO cancellation_risk (
        risk_id, booking_id, member_id, scored_at, cancel_probability, drivers,
        recommended_action, estimated_revenue_lost, action_taken, outcome
      )
      SELECT
        'cr_' || LPAD(rn::text, 3, '0') AS risk_id,
        booking_id,
        member_id,
        TO_CHAR((booking_date - INTERVAL '1 day')::date, 'YYYY-MM-DD') || ' 05:' || LPAD((rn % 60)::text, 2, '0') || ':00' AS scored_at,
        CASE
          WHEN engagement_score < 30 THEN LEAST(0.92, 0.72 + ((rn % 8) * 0.02))
          WHEN engagement_score < 50 THEN LEAST(0.88, 0.61 + ((rn % 9) * 0.015))
          ELSE 0.28 + ((rn % 10) * 0.02)
        END AS cancel_probability,
        CASE
          WHEN engagement_score < 50 THEN '[\"Low member health score\",\"No recent confirmations\"]'
          WHEN rn % 4 = 0 THEN '[\"Wind advisory\"]'
          ELSE '[\"Pattern-based volatility\"]'
        END AS drivers,
        CASE
          WHEN engagement_score < 50 THEN 'Call member + offer alternate slot'
          ELSE 'Send proactive reminder'
        END AS recommended_action,
        (140 + (rn * 11) % 340)::numeric AS estimated_revenue_lost,
        CASE WHEN rn % 5 = 0 THEN 'no_action' WHEN engagement_score < 50 THEN 'personal_outreach' ELSE 'confirmation_sent' END AS action_taken,
        CASE WHEN rn % 6 = 0 THEN 'cancelled' ELSE 'kept' END AS outcome
      FROM mapped
    `);

    await sql.query(`
      WITH days AS (
        SELECT * FROM (VALUES
          (1, 'Mon'), (2, 'Tue'), (3, 'Wed'), (4, 'Thu'),
          (5, 'Fri'), (6, 'Sat'), (7, 'Sun')
        ) AS d(idx, day_name)
      ),
      blocks AS (
        SELECT * FROM (VALUES
          (1, '7-8 AM'), (2, '8-9 AM'), (3, '9-10 AM'), (4, '10-11 AM'),
          (5, '11-12 PM'), (6, '12-1 PM'), (7, '1-2 PM'), (8, '2-3 PM')
        ) AS b(idx, label)
      )
      INSERT INTO demand_heatmap (
        heatmap_id, course_id, day_of_week, time_block, fill_rate, unmet_rounds, demand_level, computed_for_month
      )
      SELECT
        'dh_' || LPAD(((d.idx - 1) * 8 + b.idx)::text, 3, '0') AS heatmap_id,
        'course_main' AS course_id,
        d.day_name AS day_of_week,
        b.label AS time_block,
        CASE
          WHEN d.idx IN (6, 7) AND b.idx <= 3 THEN 0.92 + ((b.idx - 1) * 0.02)
          WHEN b.idx <= 3 THEN 0.70 + ((d.idx % 4) * 0.04)
          ELSE 0.52 + ((d.idx + b.idx) % 6) * 0.04
        END AS fill_rate,
        CASE
          WHEN d.idx IN (6, 7) AND b.idx <= 3 THEN 8 + ((d.idx + b.idx) % 6)
          WHEN b.idx <= 3 THEN 2 + ((d.idx + b.idx) % 4)
          ELSE ((d.idx + b.idx) % 4)
        END AS unmet_rounds,
        CASE
          WHEN d.idx IN (6, 7) AND b.idx <= 3 THEN 'oversubscribed'
          WHEN b.idx >= 6 AND d.idx IN (2, 3, 4) THEN 'underutilized'
          ELSE 'normal'
        END AS demand_level,
        '2026-01' AS computed_for_month
      FROM days d
      CROSS JOIN blocks b
    `);

    // Keep Dec baseline in line with Jan daily profile to avoid unrealistic MoM spikes.
    await sql.query(`
      WITH jan AS (
        SELECT
          AVG(golf_revenue)::numeric AS avg_golf,
          AVG(fb_revenue)::numeric AS avg_fb
        FROM close_outs
        WHERE date::date >= '2026-01-01'::date
          AND date::date < '2026-02-01'::date
      )
      UPDATE close_outs c
      SET
        golf_revenue = ROUND((jan.avg_golf * (0.90 + ((ABS(hashtext(c.date::text)) % 18) / 100.0)))::numeric),
        fb_revenue = ROUND((jan.avg_fb * (0.88 + ((ABS(hashtext(c.date::text || 'f')) % 18) / 100.0)))::numeric),
        total_revenue = ROUND((jan.avg_golf * (0.90 + ((ABS(hashtext(c.date::text)) % 18) / 100.0)))::numeric)
                      + ROUND((jan.avg_fb * (0.88 + ((ABS(hashtext(c.date::text || 'f')) % 18) / 100.0)))::numeric)
      FROM jan
      WHERE c.date::date >= '2025-12-01'::date
        AND c.date::date < '2026-01-01'::date
    `);

    const [healthCheck, outletCheck, waitlistCheck, cancelRiskCheck, heatmapCheck] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE engagement_score >= 70) AS healthy,
          COUNT(*) FILTER (WHERE engagement_score >= 30 AND engagement_score < 50) AS at_risk,
          COUNT(*) FILTER (WHERE engagement_score < 30) AS critical
        FROM member_engagement_weekly
        WHERE week_number = ${latestWeek}
      `,
      sql`
        SELECT o.name, COUNT(pc.check_id) AS checks
        FROM dining_outlets o
        LEFT JOIN pos_checks pc
          ON pc.outlet_id = o.outlet_id
         AND pc.opened_at::date >= '2026-01-01'::date
         AND pc.opened_at::date < '2026-02-01'::date
        GROUP BY o.name
        ORDER BY o.name
      `,
      sql`SELECT COUNT(*) AS count FROM member_waitlist`,
      sql`SELECT COUNT(*) AS count FROM cancellation_risk`,
      sql`SELECT COUNT(*) AS count FROM demand_heatmap`,
    ]);

    return res.status(200).json({
      ok: true,
      latestWeek,
      healthDistribution: healthCheck.rows[0],
      outletCoverage: outletCheck.rows,
      counts: {
        member_waitlist: Number(waitlistCheck.rows[0]?.count ?? 0),
        cancellation_risk: Number(cancelRiskCheck.rows[0]?.count ?? 0),
        demand_heatmap: Number(heatmapCheck.rows[0]?.count ?? 0),
        canonical_outlets: CANONICAL_OUTLETS.length,
      },
    });
  } catch (error) {
    console.error('seed-fix error', error);
    return res.status(500).json({ error: error.message });
  }
}
