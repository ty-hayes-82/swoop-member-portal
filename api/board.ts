import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId = (req.query['club_id'] as string) || 'bowling-green-cc';

  const [savesRes, serviceRes, billingRes, eventBusRes] = await Promise.all([
    // Confirmed member-related handoffs
    sql`
      SELECT ah.id, ah.from_agent, ah.recommendation_type, ah.suggested_action,
             ah.confidence, ah.confirmed_at, ah.urgency,
             (ah.payload->'signal_bundle'->>'member_id') AS member_id_payload,
             m.first_name || ' ' || m.last_name AS member_name,
             m.annual_dues, m.health_score, m.engagement_tier
      FROM agent_handoffs ah
      LEFT JOIN members m
        ON m.member_id = (ah.payload->'signal_bundle'->>'member_id')
        AND m.club_id = ${clubId}
      WHERE ah.club_id = ${clubId}
        AND ah.status = 'confirmed'
      ORDER BY ah.confirmed_at DESC
      LIMIT 20
    `,
    // Resolved complaints (service interventions)
    sql`
      SELECT c.complaint_id, c.category, c.resolution_notes, c.resolved_at,
             m.first_name || ' ' || m.last_name AS member_name, m.annual_dues
      FROM complaints c
      JOIN members m ON m.member_id = c.member_id AND m.club_id = ${clubId}
      WHERE c.club_id = ${clubId} AND c.status = 'resolved'
      ORDER BY c.resolved_at DESC
      LIMIT 10
    `,
    // Billing total (last 30 days)
    sql`
      SELECT SUM(amount) AS total, COUNT(*) AS tx_count
      FROM member_billing
      WHERE club_id = ${clubId}
        AND charge_date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    // Sessions + decision events
    sql`
      SELECT COUNT(*) AS decision_count
      FROM event_bus
      WHERE club_id = ${clubId} AND event_type = 'decision.recorded'
    `,
  ]);

  const memberSaves = savesRes.rows.filter(r =>
    ['member_outreach', 'engagement_intervention', 'member_retention', 'retention_save'].includes(r.recommendation_type as string)
  );
  const operationalSaves = savesRes.rows.filter(r => !memberSaves.includes(r));

  const duesSaved = memberSaves.reduce((s, r) => s + Number(r.annual_dues ?? 0), 0);
  const billingTotal = Number(billingRes.rows[0]?.total ?? 0);

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    headline: {
      members_saved: memberSaves.length,
      dues_protected: Math.round(duesSaved),
      service_interventions: serviceRes.rows.length,
      fb_recovered: Math.round(billingTotal),
    },
    member_saves: memberSaves.map(r => ({
      id: r.id,
      from_agent: r.from_agent,
      recommendation_type: r.recommendation_type,
      suggested_action: r.suggested_action,
      member_name: r.member_name ?? null,
      annual_dues: Number(r.annual_dues ?? 0),
      health_score: Number(r.health_score ?? 0),
      tier: r.engagement_tier ?? null,
      confirmed_at: r.confirmed_at,
    })),
    service_interventions: serviceRes.rows.map(r => ({
      id: r.complaint_id,
      category: r.category,
      resolution_notes: r.resolution_notes,
      member_name: r.member_name,
      annual_dues: Number(r.annual_dues),
      resolved_at: r.resolved_at,
    })),
    operational_saves: operationalSaves.map(r => ({
      id: r.id,
      recommendation_type: r.recommendation_type,
      suggested_action: r.suggested_action,
      from_agent: r.from_agent,
      confirmed_at: r.confirmed_at,
    })),
    meta: {
      total_decisions: Number(eventBusRes.rows[0]?.decision_count ?? 0),
      billing_total_30d: Math.round(billingTotal),
    },
  });
}
