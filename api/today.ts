import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

const CLUB_ROUND_CAPACITY = 150;
const BASELINE_ROUNDS = 126;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId = (req.query['club_id'] as string) || 'bowling-green-cc';
  const today = new Date().toISOString().substring(0, 10);

  const [weatherRes, membersRes, handoffsRes] = await Promise.all([
    sql`
      SELECT condition, temp_high, temp_low, wind_mph, precipitation_in,
             golf_demand_modifier, fb_demand_modifier
      FROM weather_daily
      WHERE club_id = ${clubId} AND date = ${today}
      LIMIT 1
    `.catch(() => ({ rows: [] })),
    sql`
      SELECT member_id, first_name, last_name, health_score, annual_dues, engagement_tier
      FROM members
      WHERE club_id = ${clubId}
        AND status IN ('active', 'A')
        AND engagement_tier IN ('At-Risk', 'Watch', 'Inactive')
      ORDER BY health_score ASC
      LIMIT 8
    `.catch(() => ({ rows: [] })),
    sql`
      SELECT id, from_agent, to_agent, recommendation_type, urgency,
             suggested_action, payload, created_at
      FROM agent_handoffs
      WHERE club_id = ${clubId} AND status = 'pending'
      ORDER BY
        CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        created_at DESC
      LIMIT 10
    `.catch(() => ({ rows: [] })),
  ]);

  const w = weatherRes.rows[0] ?? null;
  const modifier = (w?.golf_demand_modifier as number) ?? 1.0;
  const projected_rounds = Math.round(BASELINE_ROUNDS * modifier);
  const fill_rate = projected_rounds / CLUB_ROUND_CAPACITY;
  const afternoon_pct = modifier >= 0.9 ? 0.68 : 0.55;

  // Inbox counts by agent
  const inboxCounts: Record<string, number> = {};
  for (const h of handoffsRes.rows) {
    const agent = h.from_agent as string;
    inboxCounts[agent] = (inboxCounts[agent] ?? 0) + 1;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    date: today,
    club_id: clubId,
    weather: w
      ? {
          condition: w.condition,
          temp_high: w.temp_high,
          temp_low: w.temp_low,
          wind_mph: w.wind_mph,
          precipitation_in: w.precipitation_in,
          golf_demand_modifier: w.golf_demand_modifier,
          fb_demand_modifier: w.fb_demand_modifier,
        }
      : null,
    tee_sheet: {
      projected_rounds,
      fill_rate_pct: `${Math.round(fill_rate * 100)}%`,
      morning_rounds: Math.round(projected_rounds * (1 - afternoon_pct)),
      afternoon_rounds: Math.round(projected_rounds * afternoon_pct),
    },
    at_risk_members: membersRes.rows.map(m => ({
      id: m.member_id,
      name: `${m.first_name} ${m.last_name}`,
      health_score: m.health_score,
      annual_dues: m.annual_dues,
      tier: m.engagement_tier,
    })),
    pending_handoffs: handoffsRes.rows.map(h => ({
      id: h.id,
      from_agent: h.from_agent,
      to_agent: h.to_agent,
      recommendation_type: h.recommendation_type,
      urgency: h.urgency,
      suggested_action: h.suggested_action,
      created_at: h.created_at,
    })),
    inbox_counts: inboxCounts,
  });
}
