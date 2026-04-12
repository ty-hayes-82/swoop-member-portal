/**
 * GET /api/deep-insights?kind=<kind>
 *
 * One endpoint, multiple structured insight payloads. Bundled to keep the
 * Vercel function count down. Each `kind` returns a focused shape suitable
 * for a single GM-facing widget.
 *
 * Supported kinds:
 *   - payments     → settlement-method donut
 *   - ar-aging     → balance buckets + top open balances
 *   - courses      → per-course utilization gauge
 *   - tier-revenue → members × tier dues = revenue mix
 */
import { sql } from '@vercel/postgres';
import { withAuth, getReadClubId } from './lib/withAuth.js';

// ---------------------------------------------------------------------------
// payments — settlement-method mix
// ---------------------------------------------------------------------------

async function paymentsKind(clubId) {
  const r = await sql`
    SELECT p.payment_method,
      COUNT(*)::int AS count,
      SUM(p.amount)::numeric(12,2) AS total
    FROM pos_payments p
    JOIN pos_checks pc ON pc.check_id = p.check_id
    WHERE pc.club_id = ${clubId}
    GROUP BY p.payment_method
    ORDER BY total DESC NULLS LAST
  `;
  if (!r.rows.length) {
    return { available: false, reason: 'No POS payments imported yet' };
  }
  const grand = r.rows.reduce((s, x) => s + Number(x.total || 0), 0);
  const slices = r.rows.map(x => ({
    method: x.payment_method || 'unknown',
    count: Number(x.count),
    total: Number(x.total || 0),
    pct: grand > 0 ? Math.round((Number(x.total || 0) / grand) * 100) : 0,
  }));
  const memberCharge = slices.find(s => s.method === 'member_charge');
  return {
    available: true,
    grandTotal: grand,
    slices,
    arRisk: memberCharge && memberCharge.pct >= 40
      ? `${memberCharge.pct}% of F&B revenue lives on member tabs — review aged receivables before month-end.`
      : null,
  };
}

// ---------------------------------------------------------------------------
// ar-aging — invoice buckets + top open balances
// ---------------------------------------------------------------------------

async function arAgingKind(clubId) {
  // Bucket by days past due. We compute on the fly so the schema doesn't
  // need pre-aggregated buckets.
  // due_date is stored as TEXT in this schema; coerce to date for the math
  // and tolerate any unparseable values via NULLIF/regex.
  const r = await sql`
    WITH club_invoices AS (
      SELECT i.invoice_id, i.member_id, i.amount, i.status,
        CASE
          WHEN i.status = 'paid' THEN 'paid'
          WHEN i.due_date ~ '^\\d{4}-\\d{2}-\\d{2}'
            THEN CASE
              WHEN CURRENT_DATE - i.due_date::date <= 0 THEN 'current'
              WHEN CURRENT_DATE - i.due_date::date <= 30 THEN '1-30'
              WHEN CURRENT_DATE - i.due_date::date <= 60 THEN '31-60'
              WHEN CURRENT_DATE - i.due_date::date <= 90 THEN '61-90'
              ELSE '90+'
            END
          ELSE 'current'
        END AS bucket
      FROM member_invoices i
      JOIN members m ON m.member_id = i.member_id
      WHERE m.club_id = ${clubId}
    )
    SELECT bucket, COUNT(*)::int AS count, SUM(amount)::numeric(12,2) AS total
    FROM club_invoices
    GROUP BY bucket
  `;
  if (!r.rows.length) {
    return { available: false, reason: 'No invoices imported yet' };
  }
  const order = ['current', '1-30', '31-60', '61-90', '90+', 'paid'];
  const buckets = r.rows
    .map(x => ({ bucket: x.bucket, count: Number(x.count), total: Number(x.total || 0) }))
    .sort((a, b) => order.indexOf(a.bucket) - order.indexOf(b.bucket));

  const openTotal = buckets.filter(b => b.bucket !== 'paid').reduce((s, x) => s + x.total, 0);
  const aged60 = buckets.filter(b => ['61-90', '90+'].includes(b.bucket)).reduce((s, x) => s + x.total, 0);
  const top = await sql`
    SELECT m.first_name, m.last_name,
      COUNT(*)::int AS open_invoices,
      SUM(i.amount)::numeric(12,2) AS open_balance
    FROM member_invoices i
    JOIN members m ON m.member_id = i.member_id
    WHERE m.club_id = ${clubId} AND i.status != 'paid'
    GROUP BY m.first_name, m.last_name
    ORDER BY open_balance DESC NULLS LAST LIMIT 5
  `;
  return {
    available: true,
    buckets,
    openTotal,
    aged60Plus: aged60,
    topOpen: top.rows.map(x => ({
      name: `${x.first_name} ${x.last_name}`.trim(),
      openInvoices: Number(x.open_invoices),
      openBalance: Number(x.open_balance || 0),
    })),
  };
}

// ---------------------------------------------------------------------------
// courses — per-course theoretical capacity vs actual rounds (last 90 days)
// ---------------------------------------------------------------------------

async function coursesKind(clubId) {
  const courses = await sql`
    SELECT course_id, name, holes, par, tee_interval_min, first_tee, last_tee
    FROM courses WHERE club_id = ${clubId}
  `;
  if (!courses.rows.length) {
    return { available: false, reason: 'No courses imported yet' };
  }
  // Per-course rounds last 90 days
  const rounds = await sql`
    SELECT course_id, COUNT(*)::int AS rounds
    FROM bookings
    WHERE club_id = ${clubId}
      AND booking_date >= CURRENT_DATE - INTERVAL '90 days'
      AND (status IS NULL OR status != 'cancelled')
    GROUP BY course_id
  `;
  const roundsMap = new Map(rounds.rows.map(r => [r.course_id, Number(r.rounds)]));

  const items = courses.rows.map(c => {
    const interval = Number(c.tee_interval_min || 10);
    let maxPerDay = null;
    if (c.first_tee && c.last_tee) {
      try {
        const [openH, openM] = String(c.first_tee).split(':').map(Number);
        const [closeH, closeM] = String(c.last_tee).split(':').map(Number);
        const minutes = (closeH * 60 + closeM) - (openH * 60 + openM);
        maxPerDay = Math.max(0, Math.floor(minutes / interval));
      } catch { /* leave null */ }
    }
    const last90 = roundsMap.get(c.course_id) || 0;
    const capacity90 = maxPerDay ? maxPerDay * 90 : null;
    const utilization = capacity90 && capacity90 > 0
      ? Math.round((last90 / capacity90) * 100)
      : null;
    return {
      courseId: c.course_id,
      name: c.name || c.course_id,
      holes: c.holes,
      par: c.par,
      teeIntervalMin: interval,
      maxPerDay,
      roundsLast90: last90,
      utilizationPct: utilization,
    };
  });
  return { available: true, courses: items };
}

// ---------------------------------------------------------------------------
// tier-revenue — members × dues per tier
// ---------------------------------------------------------------------------

async function tierRevenueKind(clubId) {
  // Try the membership_types catalog first; fall back to grouping members
  // by their `membership_type` text field.
  const tiersFromCatalog = await sql`
    SELECT type_code, name, annual_dues
    FROM membership_types WHERE club_id = ${clubId}
  `;
  const memberCounts = await sql`
    SELECT membership_type AS tier, COUNT(*)::int AS members,
      SUM(annual_dues)::numeric(12,2) AS revenue
    FROM members
    WHERE club_id = ${clubId} AND membership_type IS NOT NULL
    GROUP BY membership_type
    ORDER BY revenue DESC NULLS LAST
  `;
  if (!memberCounts.rows.length) {
    return { available: false, reason: 'No members imported with membership_type' };
  }
  const catalog = new Map(
    tiersFromCatalog.rows.map(t => [t.name || t.type_code, t]),
  );
  const items = memberCounts.rows.map(r => {
    const cat = catalog.get(r.tier) || null;
    return {
      tier: r.tier,
      members: Number(r.members),
      revenue: Number(r.revenue || 0),
      catalogDues: cat?.annual_dues ? Number(cat.annual_dues) : null,
    };
  });
  const grand = items.reduce((s, x) => s + x.revenue, 0);
  return {
    available: true,
    tiers: items.map(x => ({ ...x, pct: grand > 0 ? Math.round((x.revenue / grand) * 100) : 0 })),
    grandTotal: grand,
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const KINDS = {
  payments: paymentsKind,
  'ar-aging': arAgingKind,
  courses: coursesKind,
  'tier-revenue': tierRevenueKind,
};

async function deepInsightsHandler(req, res) {
  const clubId = getReadClubId(req);
  const kind = req.query?.kind;
  if (!kind || !KINDS[kind]) {
    return res.status(400).json({
      error: 'kind required',
      validKinds: Object.keys(KINDS),
    });
  }
  try {
    const data = await KINDS[kind](clubId);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export default function handler(req, res) {
  const cronKey = req.headers['x-cron-key'];
  if (cronKey && process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET) {
    req.auth = req.auth || { clubId: req.body?.club_id || req.query?.clubId, userId: 'cron', role: 'system' };
    return deepInsightsHandler(req, res);
  }
  return withAuth(deepInsightsHandler)(req, res);
}
