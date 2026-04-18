import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId  = (req.query['club_id'] as string) || 'bowling-green-cc';
  const tier    = (req.query['tier'] as string) || '';
  const search  = (req.query['search'] as string) || '';
  const limit   = Math.min(parseInt(req.query['limit']  as string || '50', 10), 200);
  const offset  = parseInt(req.query['offset'] as string || '0', 10);

  const params: unknown[] = [clubId];
  let where = `WHERE club_id = $1 AND status IN ('active', 'A')`;

  if (tier && tier !== 'All') {
    params.push(tier);
    where += ` AND engagement_tier = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    const p = params.length;
    where += ` AND (first_name ILIKE $${p} OR last_name ILIKE $${p})`;
  }

  params.push(limit, offset);
  const limitP = params.length - 1;
  const offsetP = params.length;

  const [membersRes, countsRes] = await Promise.all([
    sql.query(
      `SELECT member_id, first_name, last_name, health_score, annual_dues,
              engagement_tier, archetype, join_date, phone, email, last_activity_date
       FROM members
       ${where}
       ORDER BY health_score ASC
       LIMIT $${limitP} OFFSET $${offsetP}`,
      params,
    ),
    sql`
      SELECT engagement_tier, COUNT(*) as count
      FROM members
      WHERE club_id = ${clubId} AND status IN ('active', 'A')
      GROUP BY engagement_tier
    `,
  ]);

  const tierCounts: Record<string, number> = {};
  for (const row of countsRes.rows) {
    tierCounts[row.engagement_tier as string] = parseInt(row.count as string, 10);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    members: membersRes.rows.map(m => ({
      id: m.member_id,
      name: `${m.first_name} ${m.last_name}`,
      health_score: Number(m.health_score),
      annual_dues: Number(m.annual_dues),
      tier: m.engagement_tier,
      archetype: m.archetype,
      join_date: m.join_date,
      phone: m.phone ?? null,
      last_activity_date: m.last_activity_date ?? null,
    })),
    tier_counts: tierCounts,
    total: membersRes.rows.length,
  });
}
