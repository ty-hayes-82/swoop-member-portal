import { sql } from '@vercel/postgres';
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  try {
    const latestWeekResult = await sql`SELECT MAX(week_number) AS lw FROM member_engagement_weekly`;
    const latestWeek = Number(latestWeekResult.rows[0]?.lw ?? 12);

    // Resigned members should show declining engagement over time
    // Set their latest week scores to Critical range (5-25)
    const r1 = await sql`
      UPDATE member_engagement_weekly mew
      SET engagement_score = 5 + (ABS(hashtext(mew.member_id::text)) % 20),
          rounds_played = 0,
          dining_visits = 0,
          dining_spend = 0,
          events_attended = 0,
          email_open_rate = 0.02 + ((ABS(hashtext(mew.member_id::text || 'o')) % 8) / 100.0)
      FROM members m
      WHERE m.member_id = mew.member_id
        AND m.membership_status = 'resigned'
        AND mew.week_number = ${latestWeek}`;

    // Create declining trajectory: each earlier week is slightly higher
    for (let w = latestWeek - 1; w >= Math.max(1, latestWeek - 8); w--) {
      const weeksBack = latestWeek - w;
      await sql.query(`
        UPDATE member_engagement_weekly mew
        SET engagement_score = LEAST(85, 5 + (ABS(hashtext(mew.member_id::text)) % 20) + (${weeksBack} * 7)),
            email_open_rate = LEAST(0.55, 0.02 + ((ABS(hashtext(mew.member_id::text || 'o')) % 8) / 100.0) + (${weeksBack} * 0.06)),
            rounds_played = CASE WHEN ${weeksBack} >= 4 THEN 1 + (ABS(hashtext(mew.member_id::text || 'r')) % 3) ELSE 0 END,
            dining_visits = CASE WHEN ${weeksBack} >= 3 THEN 1 ELSE 0 END,
            dining_spend = CASE WHEN ${weeksBack} >= 3 THEN 40 + (ABS(hashtext(mew.member_id::text || 's')) % 80) ELSE 0 END
        FROM members m
        WHERE m.member_id = mew.member_id
          AND m.membership_status = 'resigned'
          AND mew.week_number = ${w}
      `);
    }

    // Also fix: suspended members should be in At Risk range
    await sql`
      UPDATE member_engagement_weekly mew
      SET engagement_score = 25 + (ABS(hashtext(mew.member_id::text)) % 20)
      FROM members m
      WHERE m.member_id = mew.member_id
        AND m.membership_status = 'suspended'
        AND mew.week_number = ${latestWeek}`;

    // Verify
    const check = await sql`
      SELECT m.membership_status, ROUND(AVG(mew.engagement_score)::numeric, 1) AS avg_score,
             MIN(mew.engagement_score) AS min_score, MAX(mew.engagement_score) AS max_score
      FROM members m
      JOIN member_engagement_weekly mew ON m.member_id = mew.member_id AND mew.week_number = ${latestWeek}
      GROUP BY m.membership_status`;

    res.status(200).json({ ok: true, resignedUpdated: r1.rowCount, scoresByStatus: check.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
}
