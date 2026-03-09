import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method && req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to trigger the seed-fix." });
  }

  try {
    const weeksResult = await sql`
      SELECT DISTINCT week_number FROM member_engagement_weekly
      ORDER BY week_number DESC LIMIT 5
    `;
    const weeks = weeksResult.rows.map(r => r.week_number);
    if (weeks.length === 0) {
      return res.status(200).json({ ok: false, error: "No weeks found" });
    }

    let totalUpdated = 0;

    for (let i = 0; i < weeks.length; i++) {
      const weekNum = weeks[i];
      const weekOffset = i;

      const membersResult = await sql`
        SELECT member_id FROM member_engagement_weekly
        WHERE week_number = ${weekNum}
        ORDER BY random()
      `;
      const memberIds = membersResult.rows.map(r => String(r.member_id));

      const tiers = [
        { ids: memberIds.slice(0, 240), min: 70, max: 95 },
        { ids: memberIds.slice(240, 254), min: 50, max: 69 },
        { ids: memberIds.slice(254, 288), min: 30, max: 49 },
        { ids: memberIds.slice(288), min: 5, max: 29 },
      ];

      for (const tier of tiers) {
        if (tier.ids.length === 0) continue;

        await sql`
          UPDATE member_engagement_weekly
          SET engagement_score = GREATEST(${tier.min}, LEAST(${tier.max},
                ${tier.min} + floor(random() * ${tier.max - tier.min + 1})::int - ${weekOffset})),
              rounds_played = CASE
                WHEN ${tier.min} >= 70 THEN 5 + floor(random() * 4)::int
                WHEN ${tier.min} >= 50 THEN 3 + floor(random() * 3)::int
                WHEN ${tier.min} >= 30 THEN 1 + floor(random() * 3)::int
                ELSE floor(random() * 2)::int
              END,
              dining_spend = CASE
                WHEN ${tier.min} >= 70 THEN 200 + floor(random() * 300)::int
                WHEN ${tier.min} >= 50 THEN 100 + floor(random() * 150)::int
                WHEN ${tier.min} >= 30 THEN 40 + floor(random() * 80)::int
                ELSE 10 + floor(random() * 40)::int
              END,
              email_open_rate = CASE
                WHEN ${tier.min} >= 70 THEN 0.55 + random() * 0.4
                WHEN ${tier.min} >= 50 THEN 0.35 + random() * 0.3
                WHEN ${tier.min} >= 30 THEN 0.15 + random() * 0.25
                ELSE 0.02 + random() * 0.15
              END
          WHERE week_number = ${weekNum}
            AND member_id = ANY(${tier.ids}::text[])
        `;
        totalUpdated += tier.ids.length;
      }
    }

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

    res.status(200).json({ ok: true, weeks, totalUpdated });
  } catch (error) {
    console.error("seed-fix error", error);
    res.status(500).json({ error: error.message });
  }
}
