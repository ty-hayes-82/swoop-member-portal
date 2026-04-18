import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

const PERIOD_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clubId     = (req.query['club_id'] as string) || 'bowling-green-cc';
  const periodKey  = (req.query['period'] as string) || '30d';
  const days       = PERIOD_DAYS[periodKey] ?? 30;

  const [billingRes, duesRes, atRiskRes] = await Promise.all([
    sql.query(
      `SELECT charge_type,
              SUM(amount) AS total,
              COUNT(*) AS tx_count
       FROM member_billing
       WHERE club_id = $1
         AND charge_date >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY charge_type
       ORDER BY total DESC`,
      [clubId, days],
    ),
    sql`
      SELECT SUM(annual_dues) AS total_dues,
             COUNT(*) AS member_count
      FROM members
      WHERE club_id = ${clubId} AND status IN ('active', 'A')
    `,
    sql`
      SELECT SUM(annual_dues) AS at_risk_dues,
             COUNT(*) AS at_risk_count
      FROM members
      WHERE club_id = ${clubId}
        AND status IN ('active', 'A')
        AND engagement_tier IN ('At-Risk', 'Inactive')
    `,
  ]);

  const totalBilling = billingRes.rows.reduce((s, r) => s + Number(r.total), 0);
  const duesRow = duesRes.rows[0];
  const atRiskRow = atRiskRes.rows[0];

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    period: periodKey,
    billing_by_type: billingRes.rows.map(r => ({
      charge_type: r.charge_type,
      total: Number(r.total),
      tx_count: Number(r.tx_count),
    })),
    billing_total: Math.round(totalBilling * 100) / 100,
    dues: {
      annual_total: Number(duesRow?.total_dues ?? 0),
      member_count: Number(duesRow?.member_count ?? 0),
    },
    at_risk: {
      dues_at_risk: Number(atRiskRow?.at_risk_dues ?? 0),
      member_count: Number(atRiskRow?.at_risk_count ?? 0),
    },
  });
}
