/**
 * GET /api/concierge/spending-patterns?club_id=&member_id=
 *
 * Spending pattern intelligence.
 * Queries pos_checks for 90-day transaction history, calculates averages,
 * detects trends and anomalies.
 *
 * Returns: { patterns: { avgCheck, favoriteItems, frequency, trend, anomalies } }
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

function detectTrend(recent30, previous30) {
  if (recent30 === 0 && previous30 === 0) return 'inactive';
  if (previous30 === 0) return 'new_activity';
  const pctChange = ((recent30 - previous30) / previous30) * 100;
  if (pctChange > 15) return 'increasing';
  if (pctChange < -15) return 'declining';
  return 'stable';
}

export default withAuth(
  async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clubId = getReadClubId(req);
    const memberId = req.query.member_id || req.query.memberId;

    if (!memberId) {
      return res.status(400).json({ error: 'member_id query parameter is required' });
    }

    try {
      // --- Member name ---
      let memberName = memberId;
      try {
        const mRes = await sql`
          SELECT first_name, last_name FROM members
          WHERE member_id = ${memberId} AND club_id = ${clubId}
        `;
        if (mRes.rows.length) {
          memberName = `${mRes.rows[0].first_name} ${mRes.rows[0].last_name}`;
        }
      } catch {
        // ignore
      }

      // --- 90-day transaction history ---
      let checks90 = [];
      try {
        const cRes = await sql`
          SELECT pc.check_id, pc.outlet_id, pc.opened_at, pc.closed_at,
                 pc.subtotal, pc.total, pc.tip_amount,
                 do.name AS outlet_name
          FROM pos_checks pc
          LEFT JOIN dining_outlets do ON pc.outlet_id = do.outlet_id
          WHERE pc.member_id = ${memberId}
            AND pc.opened_at >= (NOW() - INTERVAL '90 days')::text
          ORDER BY pc.opened_at DESC
        `;
        checks90 = cRes.rows;
      } catch {
        // pos_checks table may not exist — return empty patterns
        return res.status(200).json({
          member: memberName,
          patterns: {
            avgCheck: 0,
            totalSpend: 0,
            favoriteItems: [],
            favoriteOutlets: [],
            frequency: { visits_90d: 0, visits_per_week: 0 },
            trend: 'unknown',
            anomalies: [],
          },
        });
      }

      // --- Basic stats ---
      const totals = checks90.map((c) => Number(c.total) || 0);
      const avgCheck = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
      const totalSpend = totals.reduce((a, b) => a + b, 0);

      // --- Frequency ---
      const visitsPerWeek = checks90.length / (90 / 7);

      // --- Favorite outlets ---
      const outletCounts = {};
      for (const c of checks90) {
        const name = c.outlet_name || c.outlet_id || 'Unknown';
        outletCounts[name] = (outletCounts[name] || 0) + 1;
      }
      const favoriteOutlets = Object.entries(outletCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, visits: count }));

      // --- Favorite items (from line items) ---
      let favoriteItems = [];
      try {
        const liRes = await sql`
          SELECT pli.item_name, pli.category, COUNT(*)::int AS order_count,
                 ROUND(AVG(pli.unit_price)::numeric, 2) AS avg_price
          FROM pos_line_items pli
          JOIN pos_checks pc ON pli.check_id = pc.check_id
          WHERE pc.member_id = ${memberId}
            AND pc.opened_at >= (NOW() - INTERVAL '90 days')::text
            AND pli.is_void = 0
          GROUP BY pli.item_name, pli.category
          ORDER BY order_count DESC
          LIMIT 5
        `;
        favoriteItems = liRes.rows.map((r) => ({
          item: r.item_name,
          category: r.category,
          times_ordered: r.order_count,
          avg_price: Number(r.avg_price),
        }));
      } catch {
        // pos_line_items may not exist
      }

      // --- Trend: compare last 30 days vs previous 30 days ---
      const now = Date.now();
      const d30 = 30 * 24 * 60 * 60 * 1000;
      const recent30Spend = checks90
        .filter((c) => new Date(c.opened_at).getTime() > now - d30)
        .reduce((s, c) => s + (Number(c.total) || 0), 0);
      const prev30Spend = checks90
        .filter((c) => {
          const t = new Date(c.opened_at).getTime();
          return t > now - 2 * d30 && t <= now - d30;
        })
        .reduce((s, c) => s + (Number(c.total) || 0), 0);

      const trend = detectTrend(recent30Spend, prev30Spend);

      // --- Anomalies ---
      const anomalies = [];

      // Dining drop anomaly
      const recent30Visits = checks90.filter(
        (c) => new Date(c.opened_at).getTime() > now - d30
      ).length;
      const prev30Visits = checks90.filter((c) => {
        const t = new Date(c.opened_at).getTime();
        return t > now - 2 * d30 && t <= now - d30;
      }).length;

      if (prev30Visits > 0) {
        const visitDrop = ((prev30Visits - recent30Visits) / prev30Visits) * 100;
        if (visitDrop >= 50) {
          anomalies.push({
            type: 'dining_drop',
            severity: 'high',
            message: `Dining visits dropped ${Math.round(visitDrop)}% in the last 30 days (${recent30Visits} vs ${prev30Visits})`,
          });
        }
      }

      // Spending spike anomaly
      if (prev30Spend > 0) {
        const spendChange = ((recent30Spend - prev30Spend) / prev30Spend) * 100;
        if (spendChange > 50) {
          anomalies.push({
            type: 'spending_spike',
            severity: 'info',
            message: `Spending increased ${Math.round(spendChange)}% in the last 30 days`,
          });
        }
        if (spendChange < -50) {
          anomalies.push({
            type: 'spending_drop',
            severity: 'high',
            message: `Spending dropped ${Math.round(Math.abs(spendChange))}% in the last 30 days`,
          });
        }
      }

      // Zero-activity anomaly
      if (recent30Visits === 0 && checks90.length > 0) {
        anomalies.push({
          type: 'no_recent_activity',
          severity: 'high',
          message: 'No dining activity in the last 30 days despite prior history',
        });
      }

      return res.status(200).json({
        member: memberName,
        patterns: {
          avgCheck: Math.round(avgCheck * 100) / 100,
          totalSpend: Math.round(totalSpend * 100) / 100,
          favoriteItems,
          favoriteOutlets,
          frequency: {
            visits_90d: checks90.length,
            visits_per_week: Math.round(visitsPerWeek * 10) / 10,
          },
          trend,
          anomalies,
        },
      });
    } catch (err) {
      console.error('spending-patterns error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  { allowDemo: true }
);
