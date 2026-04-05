import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG) return res.status(403).json({ error: 'Disabled in production' });
  try {
    const [membersByStatus, healthTiers, scoreStats, distinctMembers, weeklyCounts, sampleMembers, atRiskSample] = await Promise.all([
      sql`SELECT COUNT(*) AS total, membership_status FROM members GROUP BY membership_status`,
      sql`
        SELECT
          COUNT(*) AS cnt,
          CASE
            WHEN e.engagement_score >= 70 THEN 'Healthy'
            WHEN e.engagement_score >= 50 THEN 'Watch'
            WHEN e.engagement_score >= 30 THEN 'At Risk'
            ELSE 'Critical'
          END AS tier
        FROM member_engagement_weekly e
        WHERE e.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
        GROUP BY tier
      `,
      sql`
        SELECT
          AVG(engagement_score) AS avg_score,
          MIN(engagement_score) AS min_score,
          MAX(engagement_score) AS max_score,
          COUNT(*)
        FROM member_engagement_weekly
        WHERE week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
      `,
      sql`SELECT COUNT(DISTINCT member_id) AS distinct_members FROM member_engagement_weekly`,
      sql`SELECT week_number, COUNT(*) FROM member_engagement_weekly GROUP BY week_number ORDER BY week_number`,
      sql`SELECT member_id, first_name, last_name, annual_dues, archetype FROM members WHERE membership_status = 'active' LIMIT 10`,
      sql`
        SELECT
          m.member_id,
          m.first_name,
          m.last_name,
          m.annual_dues,
          w.engagement_score
        FROM members m
        JOIN member_engagement_weekly w ON m.member_id = w.member_id
        WHERE w.week_number = (SELECT MAX(week_number) FROM member_engagement_weekly)
          AND w.engagement_score < 50
          AND m.membership_status = 'active'
        ORDER BY w.engagement_score
        LIMIT 10
      `,
    ]);

    res.status(200).json({
      membersByStatus: membersByStatus.rows,
      engagementTiers: healthTiers.rows,
      latestWeekScoreStats: scoreStats.rows[0] ?? null,
      distinctMemberCount: distinctMembers.rows[0]?.distinct_members ?? 0,
      weeklyObservationCounts: weeklyCounts.rows,
      sampleMembers: sampleMembers.rows,
      atRiskSample: atRiskSample.rows,
    });
  } catch (error) {
    console.error('debug-db error', error);
    res.status(500).json({ error: error.message });
  }
}
