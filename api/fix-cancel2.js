import { sql } from '@vercel/postgres';
export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    // Check what's in cancellation_risk
    const crSample = await sql`SELECT risk_id, booking_id, member_id FROM cancellation_risk LIMIT 5`;
    const crCount = await sql`SELECT COUNT(*) AS c FROM cancellation_risk`;

    // Check if those booking_ids exist
    const bkgCheck = await sql`
      SELECT cr.booking_id, b.booking_id AS found, b.status
      FROM cancellation_risk cr
      LEFT JOIN bookings b ON cr.booking_id = b.booking_id
      LIMIT 10`;

    // If booking_ids don't match, re-seed cancellation_risk with real booking IDs
    // Pick 20 bookings and set them to 'confirmed' + future dates
    const fixResult = await sql`
      UPDATE bookings SET
        status = 'confirmed',
        booking_date = TO_CHAR((CURRENT_DATE + (ABS(hashtext(bookings.booking_id)) % 14 + 1) * INTERVAL '1 day')::date, 'YYYY-MM-DD'),
        check_in_time = NULL, round_start = NULL, round_end = NULL, duration_minutes = NULL
      WHERE bookings.booking_id IN (
        SELECT b2.booking_id FROM bookings b2
        WHERE b2.booking_id NOT IN (SELECT pp.booking_id FROM pace_of_play pp)
        ORDER BY md5(b2.booking_id)
        LIMIT 20
      )
      RETURNING bookings.booking_id`;

    // Delete old cancellation_risk and re-seed with real confirmed bookings
    await sql`DELETE FROM cancellation_risk`;

    const newCR = await sql`
      WITH confirmed AS (
        SELECT b.booking_id, bp.member_id, b.booking_date, b.tee_time,
          ROW_NUMBER() OVER (ORDER BY b.booking_date, b.tee_time) AS rn
        FROM bookings b
        JOIN booking_players bp ON b.booking_id = bp.booking_id AND bp.is_guest = 0
        WHERE b.status = 'confirmed'
        LIMIT 20
      ),
      scores AS (
        SELECT c.*, mew.engagement_score
        FROM confirmed c
        JOIN member_engagement_weekly mew ON mew.member_id = c.member_id
          AND mew.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
      )
      INSERT INTO cancellation_risk (
        risk_id, booking_id, member_id, scored_at, cancel_probability, drivers,
        recommended_action, estimated_revenue_lost, action_taken, outcome
      )
      SELECT
        'cr_' || LPAD(rn::text, 3, '0'),
        booking_id, member_id,
        TO_CHAR((booking_date::date - INTERVAL '1 day'), 'YYYY-MM-DD') || ' 05:' || LPAD((rn % 60)::text, 2, '0') || ':00',
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
      FROM scores
      RETURNING risk_id`;

    // Verify
    const verify = await sql`
      SELECT COUNT(*) AS c FROM cancellation_risk cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      WHERE b.status = 'confirmed'`;

    res.status(200).json({
      ok: true,
      crBefore: Number(crCount.rows[0].c),
      bkgMatchCheck: bkgCheck.rows,
      bookingsSetConfirmed: fixResult.rowCount,
      newCancellationRisks: newCR.rowCount,
      verifiedJoin: Number(verify.rows[0].c),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
