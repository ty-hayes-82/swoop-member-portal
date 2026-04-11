/**
 * GET /api/concierge/purchase-intel
 *
 * Analyzes a member's purchase history from POS data and generates
 * purchase-informed recommendations for the concierge.
 *
 * Query: ?club_id=&member_id=
 *
 * Returns:
 *   purchase_profile: { top_items, category_breakdown, spending_trends, total_spend }
 *   recommendations: [ { type, message, confidence } ]
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from '../lib/withAuth.js';

/**
 * Build spending trend from monthly totals.
 */
function analyzeTrend(monthlyTotals) {
  if (monthlyTotals.length < 2) return 'insufficient_data';
  const recent = monthlyTotals.slice(0, 3);
  const older = monthlyTotals.slice(3, 6);
  if (older.length === 0) return 'insufficient_data';
  const recentAvg = recent.reduce((s, m) => s + m.total, 0) / recent.length;
  const olderAvg = older.reduce((s, m) => s + m.total, 0) / older.length;
  const change = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  if (change > 0.15) return 'increasing';
  if (change < -0.15) return 'decreasing';
  return 'stable';
}

/**
 * Generate recommendations based on purchase patterns.
 */
function generateRecommendations(topItems, categoryBreakdown, trend) {
  const recs = [];

  // Top item repeat suggestions
  if (topItems.length > 0) {
    const fav = topItems[0];
    recs.push({
      type: 'repeat_favorite',
      message: `You love the ${fav.item_name} — it's been your top order with ${fav.quantity} purchased. ${fav.category === 'wine' || fav.category === 'beer' || fav.category === 'cocktail' ? 'Ask about this month\'s featured selections.' : 'Always a great choice!'}`,
      confidence: Math.min(fav.quantity / 5, 1.0),
      item: fav.item_name,
    });
  }

  // Category-based suggestions
  const catMap = {};
  for (const cat of categoryBreakdown) {
    catMap[cat.category] = cat;
  }

  if (catMap.wine && catMap.wine.total_spend > 50) {
    recs.push({
      type: 'category_upsell',
      message: `You've spent $${catMap.wine.total_spend.toFixed(0)} on wine — our sommelier has new selections this month that match your taste.`,
      confidence: 0.7,
      category: 'wine',
    });
  }

  if (catMap.entree && catMap.entree.quantity >= 3) {
    recs.push({
      type: 'dining_loyalty',
      message: `You're a regular diner with ${catMap.entree.quantity} entrees ordered. Chef has a new seasonal menu worth trying.`,
      confidence: 0.6,
      category: 'entree',
    });
  }

  // Pro shop / merchandise (if category exists)
  const proShopCats = ['merchandise', 'pro_shop', 'equipment', 'apparel'];
  const proShopSpend = categoryBreakdown
    .filter(c => proShopCats.some(ps => c.category.toLowerCase().includes(ps)))
    .reduce((sum, c) => sum + c.total_spend, 0);
  if (proShopSpend > 0) {
    recs.push({
      type: 'pro_shop',
      message: `You've invested $${proShopSpend.toFixed(0)} in the pro shop. Check out this week's gear deals.`,
      confidence: 0.5,
      category: 'pro_shop',
    });
  }

  // Trend-based
  if (trend === 'decreasing') {
    recs.push({
      type: 'engagement',
      message: 'We notice you haven\'t been in as much lately — we\'d love to see you! Any upcoming plans at the club?',
      confidence: 0.4,
    });
  }

  // Beverage favorites
  const bevCats = ['beer', 'cocktail', 'na_beverage'];
  for (const item of topItems.slice(0, 5)) {
    if (bevCats.includes(item.category)) {
      recs.push({
        type: 'beverage_reminder',
        message: `Your go-to ${item.item_name} — we'll have it ready when you arrive.`,
        confidence: Math.min(item.quantity / 3, 1.0),
        item: item.item_name,
      });
      break; // One beverage rec is enough
    }
  }

  return recs.slice(0, 5); // Cap at 5 recommendations
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clubId = getReadClubId(req);
  const memberId = req.query.member_id;

  if (!memberId) return res.status(400).json({ error: 'member_id query parameter is required' });

  try {
    // 1. Top items by quantity
    let topItems = [];
    try {
      const itemsResult = await sql`
        SELECT li.item_name, li.category,
               SUM(li.quantity) AS quantity,
               SUM(li.line_total) AS total_spend
        FROM pos_line_items li
        JOIN pos_checks c ON c.check_id = li.check_id
        WHERE c.member_id = ${memberId}
          AND li.is_void = 0
        GROUP BY li.item_name, li.category
        ORDER BY quantity DESC
        LIMIT 15
      `;
      topItems = itemsResult.rows.map(r => ({
        item_name: r.item_name,
        category: r.category,
        quantity: parseInt(r.quantity, 10),
        total_spend: parseFloat(r.total_spend),
      }));
    } catch (e) {
      console.warn('[purchase-intel] top items query error:', e.message);
    }

    // 2. Category breakdown
    let categoryBreakdown = [];
    try {
      const catResult = await sql`
        SELECT li.category,
               SUM(li.quantity) AS quantity,
               SUM(li.line_total) AS total_spend,
               COUNT(DISTINCT c.check_id) AS visit_count
        FROM pos_line_items li
        JOIN pos_checks c ON c.check_id = li.check_id
        WHERE c.member_id = ${memberId}
          AND li.is_void = 0
        GROUP BY li.category
        ORDER BY total_spend DESC
      `;
      categoryBreakdown = catResult.rows.map(r => ({
        category: r.category,
        quantity: parseInt(r.quantity, 10),
        total_spend: parseFloat(r.total_spend),
        visit_count: parseInt(r.visit_count, 10),
      }));
    } catch (e) {
      console.warn('[purchase-intel] category breakdown query error:', e.message);
    }

    // 3. Monthly spending trend (last 6 months)
    let monthlyTotals = [];
    try {
      const trendResult = await sql`
        SELECT TO_CHAR(c.opened_at::timestamp, 'YYYY-MM') AS month,
               SUM(c.total) AS total,
               COUNT(*) AS visits
        FROM pos_checks c
        WHERE c.member_id = ${memberId}
        GROUP BY TO_CHAR(c.opened_at::timestamp, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 6
      `;
      monthlyTotals = trendResult.rows.map(r => ({
        month: r.month,
        total: parseFloat(r.total),
        visits: parseInt(r.visits, 10),
      }));
    } catch (e) {
      console.warn('[purchase-intel] trend query error:', e.message);
    }

    // 4. Total lifetime spend
    let totalSpend = 0;
    let totalVisits = 0;
    try {
      const totalResult = await sql`
        SELECT COALESCE(SUM(total), 0) AS total_spend, COUNT(*) AS total_visits
        FROM pos_checks
        WHERE member_id = ${memberId}
      `;
      totalSpend = parseFloat(totalResult.rows[0]?.total_spend || 0);
      totalVisits = parseInt(totalResult.rows[0]?.total_visits || 0, 10);
    } catch (e) {
      console.warn('[purchase-intel] total spend query error:', e.message);
    }

    const trend = analyzeTrend(monthlyTotals);
    const recommendations = generateRecommendations(topItems, categoryBreakdown, trend);

    return res.status(200).json({
      member_id: memberId,
      purchase_profile: {
        top_items: topItems.slice(0, 10),
        category_breakdown: categoryBreakdown,
        spending_trend: trend,
        monthly_totals: monthlyTotals,
        total_spend: Math.round(totalSpend * 100) / 100,
        total_visits: totalVisits,
        average_check: totalVisits > 0 ? Math.round((totalSpend / totalVisits) * 100) / 100 : 0,
      },
      recommendations,
    });
  } catch (err) {
    console.error('[purchase-intel] error:', err);
    return res.status(500).json({ error: 'Failed to analyze purchase history' });
  }
}

export default withAuth(handler, { allowDemo: true });
