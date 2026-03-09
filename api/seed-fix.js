import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method && req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to trigger the seed-fix." });
  }

  try {
    // Get the 5 most recent week numbers
    const weeksResult = await sql`
      SELECT DISTINCT week_number FROM member_engagement_weekly
      ORDER BY week_number DESC LIMIT 5
    `;
    const weeks = weeksResult.rows.map(r => r.week_number);
    if (weeks.length === 0) {
      return res.status(200).json({ ok: false, error: "No weeks found" });
    }

    // For each week, do a single UPDATE using a subquery with row_number for tier assignment
    for (let i = 0; i < weeks.length; i++) {
      const weekNum = weeks[i];
      const decay = i; // older weeks get slightly lower scores

      await sql.query(`
        UPDATE member_engagement_weekly mew
        SET
          engagement_score = sub.new_score,
          rounds_played = sub.new_rounds,
          dining_spend = sub.new_dining,
          email_open_rate = sub.new_email
        FROM (
          SELECT
            member_id,
            week_number,
            CASE
              WHEN rn <= 240 THEN GREATEST(70, LEAST(95, 72 + floor(random() * 22)::int - ${decay}))
              WHEN rn <= 254 THEN GREATEST(50, LEAST(69, 54 + floor(random() * 14)::int - ${decay}))
              WHEN rn <= 288 THEN GREATEST(30, LEAST(49, 32 + floor(random() * 18)::int + ${decay}))
              ELSE GREATEST(5, LEAST(29, 12 + floor(random() * 12)::int + ${decay}))
            END AS new_score,
            CASE
              WHEN rn <= 240 THEN 5 + floor(random() * 4)::int
              WHEN rn <= 254 THEN 3 + floor(random() * 3)::int
              WHEN rn <= 288 THEN 1 + floor(random() * 3)::int
              ELSE floor(random() * 2)::int
            END AS new_rounds,
            CASE
              WHEN rn <= 240 THEN 200 + floor(random() * 300)::int
              WHEN rn <= 254 THEN 100 + floor(random() * 150)::int
              WHEN rn <= 288 THEN 40 + floor(random() * 80)::int
              ELSE 10 + floor(random() * 40)::int
            END AS new_dining,
            CASE
              WHEN rn <= 240 THEN 0.55 + random() * 0.4
              WHEN rn <= 254 THEN 0.35 + random() * 0.3
              WHEN rn <= 288 THEN 0.15 + random() * 0.25
              ELSE 0.02 + random() * 0.15
            END AS new_email
          FROM (
            SELECT member_id, week_number,
                   ROW_NUMBER() OVER (ORDER BY random()) AS rn
            FROM member_engagement_weekly
            WHERE week_number = ${weekNum}
          ) ranked
        ) sub
        WHERE mew.member_id = sub.member_id
          AND mew.week_number = sub.week_number
      `);
    }

    // Set annual_dues by membership type
    await sql`
      UPDATE members SET annual_dues = CASE membership_status
        WHEN 'FG'  THEN 18000
        WHEN 'SOC' THEN  6000
        WHEN 'SPT' THEN 12000
        WHEN 'JR'  THEN  8000
        WHEN 'LEG' THEN 22000
        WHEN 'NR'  THEN 15000
        ELSE COALESCE(annual_dues, 12000)
      END
    `;

    res.status(200).json({ ok: true, weeks, weeksUpdated: weeks.length });
  } catch (error) {
    console.error("seed-fix error", error);
    res.status(500).json({ error: error.message });
  }
}
