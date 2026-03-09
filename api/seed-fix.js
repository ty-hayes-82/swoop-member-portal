import { sql } from '@vercel/postgres';

const respondWithMethodError = (res) => {
  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Use POST to trigger the seed-fix.' });
};

export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') return respondWithMethodError(res);

  try {
    const weekResult = await sql`
      SELECT ((EXTRACT(YEAR FROM CURRENT_DATE)::int * 100) + EXTRACT(WEEK FROM CURRENT_DATE)::int) AS week_no
    `;
    const targetWeek = Number(weekResult.rows[0]?.week_no ?? 0) || 202613;

    const result = await sql`
      WITH params AS (
        SELECT ${targetWeek}::int AS week_no
      ),
      deactivate AS (
        UPDATE members
        SET membership_status = 'inactive'
        WHERE member_id IN (
          SELECT member_id
          FROM members
          WHERE membership_status = 'active'
          ORDER BY member_id
          OFFSET 300
        )
        RETURNING 1
      ),
      active_counts AS (
        SELECT COUNT(*) AS active_count FROM members WHERE membership_status = 'active'
      ),
      needed AS (
        SELECT GREATEST(0, 300 - active_count) AS missing FROM active_counts
      ),
      inserted_members AS (
        INSERT INTO members (member_id, first_name, last_name, archetype, membership_status, membership_type, annual_dues)
        SELECT
          CONCAT('mbr_seed_', LPAD(gs::text, 4, '0')) AS member_id,
          CASE (gs % 10)
            WHEN 0 THEN 'Robert'
            WHEN 1 THEN 'Sarah'
            WHEN 2 THEN 'David'
            WHEN 3 THEN 'Nina'
            WHEN 4 THEN 'James'
            WHEN 5 THEN 'Priya'
            WHEN 6 THEN 'Marco'
            WHEN 7 THEN 'Elena'
            WHEN 8 THEN 'Lucas'
            ELSE 'Maya'
          END AS first_name,
          CASE (gs % 10)
            WHEN 0 THEN 'Callahan'
            WHEN 1 THEN 'Whitfield'
            WHEN 2 THEN 'Hughes'
            WHEN 3 THEN 'Patel'
            WHEN 4 THEN 'Torres'
            WHEN 5 THEN 'Nguyen'
            WHEN 6 THEN 'Bennett'
            WHEN 7 THEN 'Monroe'
            WHEN 8 THEN 'Diaz'
            ELSE 'Jordan'
          END AS last_name,
          CASE (gs % 5)
            WHEN 0 THEN 'Balanced Active'
            WHEN 1 THEN 'Weekend Warrior'
            WHEN 2 THEN 'Die-Hard Golfer'
            WHEN 3 THEN 'Social Butterfly'
            ELSE 'New Member'
          END AS archetype,
          'active' AS membership_status,
          CASE (gs % 3)
            WHEN 0 THEN 'Full'
            WHEN 1 THEN 'National'
            ELSE 'Regional'
          END AS membership_type,
          6000 + ((gs % 21) * 800) AS annual_dues
        FROM generate_series(1, (SELECT missing FROM needed)) gs
        WHERE (SELECT missing FROM needed) > 0
        RETURNING member_id
      ),
      ordered_active AS (
        SELECT member_id,
               ROW_NUMBER() OVER (ORDER BY member_id) - 1 AS idx
        FROM members
        WHERE membership_status = 'active'
      ),
      normalized_members AS (
        UPDATE members m
        SET annual_dues = 6000 + ((ordered_active.idx % 21) * 800),
            archetype = CASE (ordered_active.idx % 5)
              WHEN 0 THEN 'Balanced Active'
              WHEN 1 THEN 'Weekend Warrior'
              WHEN 2 THEN 'Die-Hard Golfer'
              WHEN 3 THEN 'Social Butterfly'
              ELSE 'New Member'
            END,
            membership_type = CASE (ordered_active.idx % 3)
              WHEN 0 THEN 'Full'
              WHEN 1 THEN 'National'
              ELSE 'Regional'
            END
        FROM ordered_active
        WHERE m.member_id = ordered_active.member_id
        RETURNING ordered_active.member_id, ordered_active.idx
      ),
      cleared_week AS (
        DELETE FROM member_engagement_weekly WHERE week_number = (SELECT week_no FROM params)
      ),
      inserted_weekly AS (
        INSERT INTO member_engagement_weekly (member_id, week_number, engagement_score, rounds_played, dining_spend, email_open_rate, events_attended)
        SELECT
          member_id,
          (SELECT week_no FROM params) AS week_number,
          CASE
            WHEN idx < 240 THEN LEAST(95, 70 + (idx % 26))
            WHEN idx < 254 THEN 55 + (idx % 10)
            WHEN idx < 288 THEN 32 + (idx % 15)
            ELSE 8 + (idx % 12)
          END AS engagement_score,
          CASE
            WHEN idx < 240 THEN 6 + (idx % 4)
            WHEN idx < 254 THEN 4 + (idx % 3)
            WHEN idx < 288 THEN 2 + (idx % 3)
            ELSE (idx % 2)
          END AS rounds_played,
          CASE
            WHEN idx < 240 THEN 180 + ((idx % 20) * 5)
            WHEN idx < 254 THEN 120 + ((idx % 15) * 4)
            WHEN idx < 288 THEN 60 + ((idx % 10) * 3)
            ELSE 25 + ((idx % 10) * 2)
          END AS dining_spend,
          LEAST(0.95, GREATEST(0.05,
            CASE
              WHEN idx < 240 THEN 0.72 + ((idx % 10) * 0.01)
              WHEN idx < 254 THEN 0.48 + ((idx % 8) * 0.01)
              WHEN idx < 288 THEN 0.26 + ((idx % 6) * 0.01)
              ELSE 0.10 + ((idx % 4) * 0.01)
            END
          )) AS email_open_rate,
          CASE
            WHEN idx % 5 = 0 THEN 2
            WHEN idx % 3 = 0 THEN 1
            ELSE 0
          END AS events_attended
        FROM normalized_members
        RETURNING member_id
      )
      SELECT
        (SELECT week_no FROM params) AS week_number,
        (SELECT COUNT(*) FROM normalized_members) AS active_members,
        (SELECT COUNT(*) FROM inserted_members) AS members_inserted,
        (SELECT COUNT(*) FROM inserted_weekly) AS weekly_rows;
    `;

    res.status(200).json({ ok: true, summary: result.rows[0] ?? {} });
  } catch (error) {
    console.error('seed-fix error', error);
    res.status(500).json({ error: error.message });
  }
}
