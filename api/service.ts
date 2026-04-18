import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId = (req.query['club_id'] as string) || 'bowling-green-cc';
  const limit  = Math.min(parseInt(req.query['limit'] as string || '25', 10), 100);

  const [complaintsRes, statsRes] = await Promise.all([
    sql.query(
      `SELECT c.complaint_id, c.member_id, c.category, c.description, c.status,
              c.priority, c.reported_at, c.resolved_at, c.resolution_notes, c.sla_hours,
              c.source,
              EXTRACT(EPOCH FROM (NOW() - c.reported_at))/3600 AS age_hours,
              m.first_name || ' ' || m.last_name AS member_name,
              m.annual_dues, m.engagement_tier, m.health_score
       FROM complaints c
       JOIN members m ON m.member_id = c.member_id AND m.club_id = c.club_id
       WHERE c.club_id = $1
         AND c.status IN ('open', 'in_progress', 'escalated')
       ORDER BY
         CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         c.reported_at ASC
       LIMIT $2`,
      [clubId, limit],
    ),
    sql`
      SELECT
        COUNT(*) FILTER (WHERE status IN ('open','in_progress','escalated')) AS open_count,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status IN ('open','in_progress','escalated')) AS critical_count,
        COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at >= NOW() - INTERVAL '30 days') AS resolved_30d,
        COUNT(*) FILTER (WHERE status IN ('open','in_progress') AND EXTRACT(EPOCH FROM (NOW()-reported_at))/3600 > sla_hours) AS sla_breached
      FROM complaints
      WHERE club_id = ${clubId}
    `,
  ]);

  const s = statsRes.rows[0];

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    complaints: complaintsRes.rows.map(c => ({
      id: c.complaint_id,
      member_id: c.member_id,
      member_name: c.member_name,
      annual_dues: Number(c.annual_dues),
      tier: c.engagement_tier,
      health_score: Number(c.health_score),
      category: c.category,
      description: c.description,
      status: c.status,
      priority: c.priority,
      age_hours: Math.round(Number(c.age_hours) * 10) / 10,
      reported_at: c.reported_at,
      resolution_notes: c.resolution_notes ?? null,
      sla_hours: Number(c.sla_hours),
      sla_breached: Number(c.age_hours) > Number(c.sla_hours) && c.status !== 'resolved',
      source: c.source ?? 'staff',
    })),
    summary: {
      open: parseInt(s?.open_count ?? '0', 10),
      critical: parseInt(s?.critical_count ?? '0', 10),
      resolved_30d: parseInt(s?.resolved_30d ?? '0', 10),
      sla_breached: parseInt(s?.sla_breached ?? '0', 10),
    },
  });
}
