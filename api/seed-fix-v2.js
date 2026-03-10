import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to trigger the seed-fix.' });
  }

  const log = [];
  const step = (msg) => log.push(msg);

  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS latest_week FROM member_engagement_weekly`;
    const latestWeek = Number(latestWeekResult.rows[0]?.latest_week ?? 0);
    if (!latestWeek) {
      return res.status(200).json({ ok: false, error: 'No member_engagement_weekly rows found.' });
    }
    step(`Latest week: ${latestWeek}`);

    // ── 1. Normalize dues by membership type ──
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
    step('Dues normalized');

    // ── 2. Force health distribution: Healthy 254, At Risk 34, Critical 12 ──
    await sql.query(`
      WITH ranked AS (
        SELECT mew.member_id,
          ROW_NUMBER() OVER (ORDER BY md5(mew.member_id::text)) AS rn
        FROM member_engagement_weekly mew
        WHERE mew.week_number = ${latestWeek}
      )
      UPDATE member_engagement_weekly mew
      SET
        engagement_score = CASE
          WHEN r.rn <= 254 THEN 70 + (ABS(hashtext(r.member_id::text)) % 26)
          WHEN r.rn <= 288 THEN 30 + (ABS(hashtext(r.member_id::text)) % 20)
          ELSE 10 + (ABS(hashtext(r.member_id::text)) % 20)
        END,
        rounds_played = CASE
          WHEN r.rn <= 254 THEN 2 + (ABS(hashtext(r.member_id::text || 'r')) % 4)
          WHEN r.rn <= 288 THEN (ABS(hashtext(r.member_id::text || 'r')) % 2)
          ELSE 0
        END,
        dining_visits = CASE
          WHEN r.rn <= 254 THEN 2 + (ABS(hashtext(r.member_id::text || 'd')) % 4)
          WHEN r.rn <= 288 THEN (ABS(hashtext(r.member_id::text || 'd')) % 2)
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
    step('Health distribution set: 254/34/12');

    // ── 3. Email decay trend for at-risk members ──
    await sql.query(`
      WITH target AS (
        SELECT member_id::text AS member_id
        FROM member_engagement_weekly
        WHERE week_number = ${latestWeek} AND engagement_score < 50
        ORDER BY engagement_score ASC LIMIT 16
      ),
      three_weeks AS (
        SELECT DISTINCT week_number FROM member_engagement_weekly
        ORDER BY week_number DESC LIMIT 3
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
    step('Email decay trends applied');

    // ── 4. Canonical outlets + redistribute pos_checks ──
    await sql.query(`
      INSERT INTO dining_outlets (outlet_id, club_id, name, type, meal_periods, weekday_covers, weekend_covers) VALUES
        ('outlet_main_dining', 'club_001', 'Main Dining Room', 'fine_dining', 'breakfast,dinner', 95, 150),
        ('outlet_grill', 'club_001', 'Grill Room', 'casual', 'lunch,dinner', 120, 175),
        ('outlet_bar_lounge', 'club_001', 'Bar/Lounge', 'bar', 'lunch,dinner', 80, 120),
        ('outlet_halfway_house', 'club_001', 'Halfway House', 'grab_go', 'breakfast,lunch', 70, 140),
        ('outlet_pool_bar', 'club_001', 'Pool Bar', 'bar', 'lunch', 35, 90)
      ON CONFLICT (outlet_id) DO UPDATE
      SET name = EXCLUDED.name, type = EXCLUDED.type,
          meal_periods = EXCLUDED.meal_periods,
          weekday_covers = EXCLUDED.weekday_covers,
          weekend_covers = EXCLUDED.weekend_covers
    `);

    // Map old outlet IDs to canonical ones
    await sql.query(`
      UPDATE pos_checks
      SET outlet_id = CASE
        WHEN outlet_id IN ('outlet_main_dining','outlet_grill','outlet_bar_lounge','outlet_halfway_house','outlet_pool_bar') THEN outlet_id
        WHEN outlet_id = 'outlet_dining' THEN 'outlet_main_dining'
        WHEN outlet_id = 'outlet_bar' THEN 'outlet_bar_lounge'
        ELSE 'outlet_grill'
      END
    `);

    // Redistribute Jan checks across outlets
    await sql.query(`
      UPDATE pos_checks
      SET outlet_id = CASE
        WHEN ABS(hashtext(check_id::text)) % 100 < 28 THEN 'outlet_grill'
        WHEN ABS(hashtext(check_id::text)) % 100 < 52 THEN 'outlet_main_dining'
        WHEN ABS(hashtext(check_id::text)) % 100 < 72 THEN 'outlet_bar_lounge'
        WHEN ABS(hashtext(check_id::text)) % 100 < 88 THEN 'outlet_halfway_house'
        ELSE 'outlet_pool_bar'
      END
      WHERE opened_at::date >= '2026-01-01'::date AND opened_at::date < '2026-02-01'::date
    `);
    // Remove orphaned outlet rows
    await sql.query(`
      DELETE FROM dining_outlets
      WHERE outlet_id NOT IN ('outlet_main_dining','outlet_grill','outlet_bar_lounge','outlet_halfway_house','outlet_pool_bar')
    `);
    step('Outlets canonical + checks redistributed');

    // ── 5. Fix weather: 'rain' → 'rainy' in close_outs ──
    await sql.query(`UPDATE close_outs SET weather = 'rainy' WHERE weather = 'rain'`);
    step('Weather rain→rainy fixed');

    // ── 6. Seed booking_players for all bookings ──
    await sql.query(`DELETE FROM booking_players`);
    await sql.query(`
      INSERT INTO booking_players (player_id, booking_id, member_id, guest_name, is_guest, is_warm_lead, position_in_group)
      SELECT
        'bp_' || b.booking_id || '_1',
        b.booking_id,
        m.member_id,
        NULL,
        0,
        0,
        1
      FROM bookings b
      CROSS JOIN LATERAL (
        SELECT member_id FROM members
        WHERE membership_status = 'active'
        ORDER BY md5(b.booking_id || member_id)
        LIMIT 1
      ) m
    `);
    // Add guest players for bookings with has_guest=1
    await sql.query(`
      INSERT INTO booking_players (player_id, booking_id, member_id, guest_name, is_guest, is_warm_lead, position_in_group)
      SELECT
        'bp_' || b.booking_id || '_2',
        b.booking_id,
        NULL,
        (ARRAY['Tom Reynolds','Sarah Chen','Mike Palmer','Lisa Hart','Dave Stone','Amy Brooks','Chris Fox','Julie Quinn'])[1 + (ABS(hashtext(b.booking_id)) % 8)],
        1,
        CASE WHEN ABS(hashtext(b.booking_id || 'wl')) % 5 = 0 THEN 1 ELSE 0 END,
        2
      FROM bookings b
      WHERE b.has_guest = 1
    `);
    const bpCount = await sql`SELECT COUNT(*) AS c FROM booking_players`;
    step(`booking_players seeded: ${bpCount.rows[0].c} rows`);

    // ── 7. Link pos_checks to bookings for post-round dining ──
    await sql.query(`
      WITH completed AS (
        SELECT b.booking_id, bp.member_id, b.booking_date
        FROM bookings b
        JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
        WHERE b.status = 'completed'
      ),
      linkable AS (
        SELECT pc.check_id, c.booking_id,
          ROW_NUMBER() OVER (PARTITION BY pc.check_id ORDER BY random()) AS rn
        FROM pos_checks pc
        JOIN completed c ON pc.member_id = c.member_id
          AND pc.opened_at::date = c.booking_date::date
        WHERE pc.post_round_dining = 1
      )
      UPDATE pos_checks pc
      SET linked_booking_id = l.booking_id
      FROM linkable l
      WHERE l.check_id = pc.check_id AND l.rn = 1
    `);
    step('pos_checks linked to bookings for PRD');

    // ── 8. Seed member_waitlist, cancellation_risk, demand_heatmap ──
    await sql`DELETE FROM demand_heatmap`;
    await sql`DELETE FROM cancellation_risk`;
    await sql`DELETE FROM member_waitlist`;

    // member_waitlist: 24 entries from mix of at-risk and active members
    await sql.query(`
      WITH latest AS (
        SELECT mew.member_id::text AS member_id, mew.engagement_score
        FROM member_engagement_weekly mew WHERE mew.week_number = ${latestWeek}
      ),
      pool AS (
        SELECT m.member_id::text AS member_id, l.engagement_score,
          ROW_NUMBER() OVER (ORDER BY (l.engagement_score < 50) DESC, l.engagement_score ASC, m.member_id::text) AS rn
        FROM members m JOIN latest l ON l.member_id = m.member_id::text
        WHERE COALESCE(m.membership_status, 'active') <> 'resigned'
      ),
      chosen AS (SELECT * FROM pool WHERE rn <= 24)
      INSERT INTO member_waitlist (
        waitlist_id, member_id, course_id, requested_date, requested_slot,
        alternatives_accepted, days_waiting, retention_priority, notified_at, filled_at, dining_incentive_attached
      )
      SELECT
        'mwl_' || LPAD(rn::text, 3, '0'),
        member_id, 'course_main',
        TO_CHAR((DATE '2026-01-10' + ((rn * 3) % 21) * INTERVAL '1 day')::date, 'YYYY-MM-DD'),
        (ARRAY['Sat 7:00','Sat 7:08','Sat 7:16','Sat 7:24','Sun 7:00','Sun 7:08','Fri 7:32','Sat 8:16'])[(rn % 8) + 1],
        (ARRAY['["Sat 8:24","Sun 7:24"]','["Sat 8:32","Fri 8:08"]','["Sun 7:16","Fri 8:00"]'])[(rn % 3) + 1],
        1 + ((rn * 2) % 14),
        CASE WHEN engagement_score < 50 OR rn <= 10 THEN 'HIGH' ELSE 'NORMAL' END,
        CASE WHEN rn % 3 = 0 THEN NULL
             ELSE TO_CHAR((DATE '2026-01-10' + ((rn * 3) % 21) * INTERVAL '1 day')::date, 'YYYY-MM-DD') || ' 08:1' || (rn % 6)::text || ':00'
        END,
        NULL,
        CASE WHEN engagement_score < 50 AND rn % 4 <> 0 THEN 1 ELSE 0 END
      FROM chosen
    `);
    step('member_waitlist: 24 entries');

    // cancellation_risk: from confirmed Jan bookings
    await sql.query(`
      WITH jan_bookings AS (
        SELECT booking_id, booking_date::date AS booking_date,
          ROW_NUMBER() OVER (ORDER BY booking_date, tee_time, booking_id) AS rn
        FROM bookings WHERE status = 'confirmed'
          AND booking_date::date >= '2026-01-01' AND booking_date::date < '2026-02-01'
        LIMIT 30
      ),
      wl AS (
        SELECT mw.member_id::text AS member_id, mew.engagement_score,
          ROW_NUMBER() OVER (ORDER BY mw.retention_priority DESC, mew.engagement_score ASC) AS rn
        FROM member_waitlist mw
        JOIN member_engagement_weekly mew ON mew.member_id::text = mw.member_id::text AND mew.week_number = ${latestWeek}
      ),
      mapped AS (
        SELECT jb.booking_id, jb.booking_date, wl.member_id, wl.engagement_score, jb.rn
        FROM jan_bookings jb
        JOIN wl ON wl.rn = ((jb.rn - 1) % (SELECT COUNT(*) FROM wl)) + 1
      )
      INSERT INTO cancellation_risk (
        risk_id, booking_id, member_id, scored_at, cancel_probability, drivers,
        recommended_action, estimated_revenue_lost, action_taken, outcome
      )
      SELECT
        'cr_' || LPAD(rn::text, 3, '0'),
        booking_id, member_id,
        TO_CHAR((booking_date - INTERVAL '1 day')::date, 'YYYY-MM-DD') || ' 05:' || LPAD((rn % 60)::text, 2, '0') || ':00',
        CASE
          WHEN engagement_score < 30 THEN LEAST(0.92, 0.72 + ((rn % 8) * 0.02))
          WHEN engagement_score < 50 THEN LEAST(0.88, 0.61 + ((rn % 9) * 0.015))
          ELSE 0.28 + ((rn % 10) * 0.02)
        END,
        CASE
          WHEN engagement_score < 50 THEN '["Low member health score","No recent confirmations"]'
          WHEN rn % 4 = 0 THEN '["Wind advisory"]'
          ELSE '["Pattern-based volatility"]'
        END,
        CASE WHEN engagement_score < 50 THEN 'Call member + offer alternate slot' ELSE 'Send proactive reminder' END,
        (140 + (rn * 11) % 340)::numeric,
        CASE WHEN rn % 5 = 0 THEN 'no_action' WHEN engagement_score < 50 THEN 'personal_outreach' ELSE 'confirmation_sent' END,
        CASE WHEN rn % 6 = 0 THEN 'cancelled' ELSE 'kept' END
      FROM mapped
    `);
    step('cancellation_risk seeded');

    // demand_heatmap: 7 days x 8 blocks x 2 courses
    await sql.query(`
      WITH days AS (
        SELECT * FROM (VALUES (1,'Mon'),(2,'Tue'),(3,'Wed'),(4,'Thu'),(5,'Fri'),(6,'Sat'),(7,'Sun')) AS d(idx, day_name)
      ),
      blocks AS (
        SELECT * FROM (VALUES (1,'7-8 AM'),(2,'8-9 AM'),(3,'9-10 AM'),(4,'10-11 AM'),(5,'11-12 PM'),(6,'12-1 PM'),(7,'1-2 PM'),(8,'2-3 PM')) AS b(idx, label)
      ),
      courses AS (
        SELECT * FROM (VALUES ('course_main'),('course_exec')) AS c(cid)
      )
      INSERT INTO demand_heatmap (heatmap_id, course_id, day_of_week, time_block, fill_rate, unmet_rounds, demand_level, computed_for_month)
      SELECT
        'dh_' || c.cid || '_' || LPAD(((d.idx-1)*8+b.idx)::text, 3, '0'),
        c.cid, d.day_name, b.label,
        CASE
          WHEN d.idx IN (6,7) AND b.idx <= 3 THEN 0.92 + ((b.idx-1) * 0.02)
          WHEN b.idx <= 3 THEN 0.70 + ((d.idx % 4) * 0.04)
          ELSE 0.52 + ((d.idx + b.idx) % 6) * 0.04
        END,
        CASE
          WHEN d.idx IN (6,7) AND b.idx <= 3 THEN 8 + ((d.idx + b.idx) % 6)
          WHEN b.idx <= 3 THEN 2 + ((d.idx + b.idx) % 4)
          ELSE ((d.idx + b.idx) % 4)
        END,
        CASE
          WHEN d.idx IN (6,7) AND b.idx <= 3 THEN 'oversubscribed'
          WHEN b.idx >= 6 AND d.idx IN (2,3,4) THEN 'underutilized'
          ELSE 'normal'
        END,
        '2026-01'
      FROM days d CROSS JOIN blocks b CROSS JOIN courses c
    `);
    step('demand_heatmap: 112 cells (2 courses)');

    // ── 9. Seed December close_outs for realistic MoM comparison ──
    // First check if Dec rows exist
    const decCheck = await sql`SELECT COUNT(*) AS c FROM close_outs WHERE date::date >= '2025-12-01' AND date::date < '2026-01-01'`;
    const decCount = Number(decCheck.rows[0]?.c ?? 0);

    if (decCount === 0) {
      // Get Jan averages to base Dec data on (-5% to -10% lower = realistic seasonal dip)
      const janAvg = await sql`
        SELECT AVG(golf_revenue) AS avg_golf, AVG(fb_revenue) AS avg_fb,
               AVG(rounds_played) AS avg_rounds, AVG(covers) AS avg_covers
        FROM close_outs WHERE date::date >= '2026-01-01' AND date::date < '2026-02-01'
      `;
      const ag = Number(janAvg.rows[0]?.avg_golf ?? 15000);
      const af = Number(janAvg.rows[0]?.avg_fb ?? 8000);
      const ar = Math.round(Number(janAvg.rows[0]?.avg_rounds ?? 60));
      const ac = Math.round(Number(janAvg.rows[0]?.avg_covers ?? 40));

      // Generate 31 December days
      const decRows = [];
      for (let d = 1; d <= 31; d++) {
        const dateStr = `2025-12-${String(d).padStart(2, '0')}`;
        const dow = new Date(2025, 11, d).getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        // Dec is ~8% lower than Jan (winter trough before new year)
        const golfMult = isWeekend ? 0.95 : 0.82;
        const fbMult = isWeekend ? 0.98 : 0.85;
        // Christmas week bump
        const holidayMult = (d >= 23 && d <= 31) ? 1.15 : 1.0;

        const golf = Math.round(ag * golfMult * holidayMult * (0.92 + (((d * 7) % 16) / 100)));
        const fb = Math.round(af * fbMult * holidayMult * (0.90 + (((d * 11) % 18) / 100)));
        const weather = (d % 9 === 0) ? 'rainy' : (d % 7 === 0) ? 'overcast' : 'sunny';
        const rounds = Math.round(ar * golfMult * (0.9 + ((d % 5) * 0.05)));
        const covers = Math.round(ac * fbMult * (0.9 + ((d % 4) * 0.06)));
        const understaffed = (d === 24 || d === 31) ? 1 : 0;

        decRows.push(`('co_dec_${String(d).padStart(2,'0')}','club_001','${dateStr}',${golf},${fb},${golf + fb},${rounds},${covers},'${weather}',${understaffed})`);
      }

      await sql.query(`
        INSERT INTO close_outs (closeout_id, club_id, date, golf_revenue, fb_revenue, total_revenue, rounds_played, covers, weather, is_understaffed)
        VALUES ${decRows.join(',\n')}
        ON CONFLICT (closeout_id) DO NOTHING
      `);
      step('December close_outs: 31 days inserted');
    } else {
      // Dec exists, just normalize values
      await sql.query(`
        WITH jan AS (
          SELECT AVG(golf_revenue)::numeric AS avg_golf, AVG(fb_revenue)::numeric AS avg_fb
          FROM close_outs WHERE date::date >= '2026-01-01' AND date::date < '2026-02-01'
        )
        UPDATE close_outs c
        SET
          golf_revenue = ROUND((jan.avg_golf * (0.90 + ((ABS(hashtext(c.date::text)) % 18) / 100.0)))::numeric),
          fb_revenue = ROUND((jan.avg_fb * (0.88 + ((ABS(hashtext(c.date::text || 'f')) % 18) / 100.0)))::numeric),
          total_revenue = ROUND((jan.avg_golf * (0.90 + ((ABS(hashtext(c.date::text)) % 18) / 100.0)))::numeric)
                        + ROUND((jan.avg_fb * (0.88 + ((ABS(hashtext(c.date::text || 'f')) % 18) / 100.0)))::numeric)
        FROM jan
        WHERE c.date::date >= '2025-12-01' AND c.date::date < '2026-01-01'
      `);
      step('December close_outs normalized to match Jan');
    }

    // ── 10. Fix Operations MoM — expand query window to include Dec ──
    // The operations.js hardcodes Jan 2026. We need Dec data for comparison.
    // Already handled by step 9. The frontend computes MoM from the data.
    step('MoM baseline established');

    // ── Verification queries ──
    const [healthCheck, outletCheck, wlCheck, crCheck, dhCheck, bpCheck, weatherCheck, decVerify] = await Promise.all([
      sql`SELECT
        COUNT(*) FILTER (WHERE engagement_score >= 70) AS healthy,
        COUNT(*) FILTER (WHERE engagement_score >= 30 AND engagement_score < 70) AS watch_and_atrisk,
        COUNT(*) FILTER (WHERE engagement_score >= 30 AND engagement_score < 50) AS at_risk,
        COUNT(*) FILTER (WHERE engagement_score < 30) AS critical
      FROM member_engagement_weekly WHERE week_number = ${latestWeek}`,
      sql`SELECT o.name, COUNT(pc.check_id) AS checks, ROUND(SUM(pc.total)::numeric, 2) AS revenue
        FROM dining_outlets o
        LEFT JOIN pos_checks pc ON pc.outlet_id = o.outlet_id
          AND pc.opened_at::date >= '2026-01-01' AND pc.opened_at::date < '2026-02-01'
        GROUP BY o.name ORDER BY o.name`,
      sql`SELECT COUNT(*) AS c FROM member_waitlist`,
      sql`SELECT COUNT(*) AS c FROM cancellation_risk`,
      sql`SELECT COUNT(*) AS c FROM demand_heatmap`,
      sql`SELECT COUNT(*) AS c FROM booking_players`,
      sql`SELECT weather, COUNT(*) AS c FROM close_outs GROUP BY weather ORDER BY weather`,
      sql`SELECT COUNT(*) AS c, SUM(golf_revenue + fb_revenue) AS total FROM close_outs WHERE date::date >= '2025-12-01' AND date::date < '2026-01-01'`,
    ]);

    return res.status(200).json({
      ok: true,
      latestWeek,
      steps: log,
      verification: {
        healthDistribution: healthCheck.rows[0],
        outlets: outletCheck.rows,
        member_waitlist: Number(wlCheck.rows[0]?.c ?? 0),
        cancellation_risk: Number(crCheck.rows[0]?.c ?? 0),
        demand_heatmap: Number(dhCheck.rows[0]?.c ?? 0),
        booking_players: Number(bpCheck.rows[0]?.c ?? 0),
        weatherValues: weatherCheck.rows,
        december: { days: Number(decVerify.rows[0]?.c ?? 0), totalRevenue: Number(decVerify.rows[0]?.total ?? 0) },
      },
    });
  } catch (error) {
    console.error('seed-fix-v2 error:', error);
    return res.status(500).json({ error: error.message, steps: log });
  }
}
