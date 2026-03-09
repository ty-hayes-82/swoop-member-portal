import { sql } from '@vercel/postgres';

const respondWithMethodError = (res) => {
  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Use POST to trigger the seed-fix.' });
};

export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') return respondWithMethodError(res);

  try {
    const reseedResult = await sql`
      WITH target_weeks AS (
        SELECT
          week_number,
          ROW_NUMBER() OVER (ORDER BY week_number DESC) - 1 AS week_offset
        FROM (
          SELECT DISTINCT week_number
          FROM member_engagement_weekly
          ORDER BY week_number DESC
          LIMIT 5
        ) latest
      ),
      ranked AS (
        SELECT
          mew.member_id,
          mew.week_number,
          tw.week_offset,
          ROW_NUMBER() OVER (PARTITION BY mew.week_number ORDER BY random()) AS bucket
        FROM member_engagement_weekly mew
        JOIN target_weeks tw ON mew.week_number = tw.week_number
      ),
      scored AS (
        SELECT
          ranked.member_id,
          ranked.week_number,
          ranked.week_offset,
          ranked.bucket,
          CASE
            WHEN ranked.bucket <= 240 THEN LEAST(95, 72 + floor(random() * 22)::int - ranked.week_offset)
            WHEN ranked.bucket <= 254 THEN GREATEST(50, LEAST(69, 54 + floor(random() * 14)::int - ranked.week_offset))
            WHEN ranked.bucket <= 288 THEN GREATEST(30, LEAST(49, 32 + floor(random() * 18)::int + (ranked.week_offset * 2)))
            ELSE GREATEST(5, LEAST(29, 12 + floor(random() * 12)::int + (ranked.week_offset * 2)))
          END AS new_score
        FROM ranked
      ),
      metrics AS (
        SELECT
          member_id,
          week_number,
          new_score,
          CASE
            WHEN new_score >= 70 THEN 6 + (mod(new_score::int, 3))
            WHEN new_score >= 50 THEN 4 + (mod(new_score::int, 2))
            WHEN new_score >= 30 THEN 2 + (mod(new_score::int, 2))
            ELSE 1 + (mod(new_score::int, 2))
          END AS rounds_value,
          ROUND(
            CASE
              WHEN new_score >= 70 THEN 180 + (new_score * 2)
              WHEN new_score >= 50 THEN 120 + (new_score * 1.4)
              WHEN new_score >= 30 THEN 70 + (new_score * 1.1)
              ELSE 30 + (new_score * 0.9)
            END
          ) AS dining_value,
          LEAST(0.95, GREATEST(0.05, new_score / 110.0)) AS email_value
        FROM scored
      ),
      updated AS (
        UPDATE member_engagement_weekly mew
        SET
          engagement_score = metrics.new_score,
          rounds_played = metrics.rounds_value,
          dining_spend = metrics.dining_value,
          email_open_rate = metrics.email_value
        FROM metrics
        WHERE mew.member_id = metrics.member_id AND mew.week_number = metrics.week_number
        RETURNING mew.member_id
      )
      SELECT array_agg(week_number ORDER BY week_offset) AS weeks, COUNT(*) AS weeks_tracked
      FROM target_weeks;
    const targetWeeks = reseedResult.rows[0]?.weeks ?? [];

    await sql`
      UPDATE members
      SET annual_dues = CASE membership_status
        WHEN 'FG'  THEN 18000
        WHEN 'SOC' THEN  6000
        WHEN 'SPT' THEN 12000
        WHEN 'JR'  THEN  8000
        WHEN 'LEG' THEN 22000
        WHEN 'NR'  THEN 15000
        ELSE COALESCE(annual_dues, 12000)
      END
    `;

    res.status(200).json({ ok: true, weeks: targetWeeks });
  } catch (error) {
    console.error('seed-fix error', error);
    res.status(500).json({ error: error.message });
  }
}
