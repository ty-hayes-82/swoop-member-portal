import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const clubId = (req.query.club_id as string) || 'bowling-green-cc'

  const [heatmap, decay, summary] = await Promise.all([
    // Archetype × engagement_tier heatmap
    sql`
      SELECT
        archetype,
        engagement_tier,
        COUNT(*)          AS count,
        ROUND(AVG(health_score))::int AS avg_health
      FROM members
      WHERE club_id = ${clubId}
        AND status NOT IN ('Resigned', 'Inactive')
        AND archetype IS NOT NULL
        AND engagement_tier IS NOT NULL
      GROUP BY archetype, engagement_tier
      ORDER BY archetype, engagement_tier
    `,
    // Decay watch list — lowest health scores in at-risk tiers
    sql`
      SELECT
        member_id,
        first_name,
        last_name,
        health_score,
        engagement_tier,
        archetype,
        annual_dues,
        last_activity_date
      FROM members
      WHERE club_id = ${clubId}
        AND engagement_tier IN ('At-Risk', 'Watch', 'Inactive')
        AND status NOT IN ('Resigned')
      ORDER BY health_score ASC
      LIMIT 8
    `,
    // Tier summary counts
    sql`
      SELECT
        engagement_tier,
        COUNT(*)::int AS count
      FROM members
      WHERE club_id = ${clubId}
        AND status NOT IN ('Resigned')
      GROUP BY engagement_tier
      ORDER BY CASE engagement_tier
        WHEN 'Thriving' THEN 1
        WHEN 'Engaged'  THEN 2
        WHEN 'Watch'    THEN 3
        WHEN 'At-Risk'  THEN 4
        WHEN 'Inactive' THEN 5
        ELSE 6
      END
    `,
  ])

  // Build heatmap structure: { [archetype]: { [tier]: { count, avg_health } } }
  const heatmapMap: Record<string, Record<string, { count: number; avg_health: number }>> = {}
  for (const row of heatmap.rows) {
    if (!heatmapMap[row.archetype]) heatmapMap[row.archetype] = {}
    heatmapMap[row.archetype][row.engagement_tier] = {
      count: parseInt(row.count, 10),
      avg_health: row.avg_health ?? 0,
    }
  }

  res.json({
    heatmap: heatmapMap,
    archetypes: [...new Set(heatmap.rows.map(r => r.archetype as string))].sort(),
    tiers: ['Thriving', 'Engaged', 'Watch', 'At-Risk', 'Inactive'],
    decay_watch: decay.rows,
    tier_summary: summary.rows,
  })
}
