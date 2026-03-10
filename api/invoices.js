import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const { memberId } = req.query;

    // If memberId is provided, return that member's full invoice history
    if (memberId) {
      const invoices = await sql`
        SELECT
          i.invoice_id,
          i.member_id,
          i.invoice_date,
          i.due_date,
          i.amount,
          i.type,
          i.description,
          i.status,
          i.paid_date,
          i.paid_amount,
          i.days_past_due,
          i.late_fee,
          i.collection_status,
          m.first_name,
          m.last_name,
          m.membership_type,
          m.archetype
        FROM member_invoices i
        LEFT JOIN members m ON i.member_id = m.member_id
        WHERE i.member_id = ${memberId}
        ORDER BY i.invoice_date DESC
      `;

      return res.status(200).json({
        memberId,
        memberInvoices: invoices.rows.map(row => ({
          invoiceId: row.invoice_id,
          memberId: row.member_id,
          invoiceDate: row.invoice_date,
          dueDate: row.due_date,
          amount: parseFloat(row.amount),
          type: row.type,
          description: row.description,
          status: row.status,
          paidDate: row.paid_date,
          paidAmount: parseFloat(row.paid_amount || 0),
          daysPastDue: parseInt(row.days_past_due || 0),
          lateFee: parseFloat(row.late_fee || 0),
          collectionStatus: row.collection_status,
          memberName: row.first_name ? `${row.first_name} ${row.last_name}` : null,
          membershipType: row.membership_type,
          archetype: row.archetype,
        })),
      });
    }

    // --- Summary calculations ---

    // Total outstanding (unpaid amounts + late fees)
    const outstandingResult = await sql`
      SELECT
        COALESCE(SUM(amount - paid_amount + late_fee), 0) as total_outstanding
      FROM member_invoices
      WHERE status != 'paid'
    `;
    const totalOutstanding = parseFloat(outstandingResult.rows[0].total_outstanding);

    // Breakdown by status
    const pastDue30Result = await sql`
      SELECT COUNT(DISTINCT member_id) as count, COALESCE(SUM(amount - paid_amount + late_fee), 0) as amount
      FROM member_invoices WHERE status = 'past_due_30'
    `;
    const pastDue60Result = await sql`
      SELECT COUNT(DISTINCT member_id) as count, COALESCE(SUM(amount - paid_amount + late_fee), 0) as amount
      FROM member_invoices WHERE status = 'past_due_60'
    `;
    const pastDue90Result = await sql`
      SELECT COUNT(DISTINCT member_id) as count, COALESCE(SUM(amount - paid_amount + late_fee), 0) as amount
      FROM member_invoices WHERE status = 'past_due_90'
    `;
    const currentDueResult = await sql`
      SELECT COUNT(DISTINCT member_id) as count, COALESCE(SUM(amount - paid_amount), 0) as amount
      FROM member_invoices WHERE status = 'current'
    `;

    // Collection rate: % of members with any past-due invoice
    const pastDueMembersCount = await sql`
      SELECT COUNT(DISTINCT member_id) as count
      FROM member_invoices
      WHERE status IN ('past_due_30', 'past_due_60', 'past_due_90')
    `;
    const totalMembersCount = await sql`
      SELECT COUNT(DISTINCT member_id) as count FROM member_invoices
    `;
    const collectionRate = totalMembersCount.rows[0].count > 0
      ? Math.round((parseInt(pastDueMembersCount.rows[0].count) / parseInt(totalMembersCount.rows[0].count)) * 10000) / 100
      : 0;

    // At-risk correlation: % of past-due members who also have engagement_score < 50
    const atRiskCorrelationResult = await sql`
      SELECT
        COUNT(DISTINCT i.member_id) as at_risk_count
      FROM member_invoices i
      INNER JOIN (
        SELECT member_id, engagement_score,
               ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY week_number DESC) as rn
        FROM member_engagement_weekly
      ) e ON i.member_id = e.member_id AND e.rn = 1
      WHERE i.status IN ('past_due_30', 'past_due_60', 'past_due_90')
        AND e.engagement_score < 50
    `;
    const atRiskCount = parseInt(atRiskCorrelationResult.rows[0].at_risk_count);
    const pastDueTotal = parseInt(pastDueMembersCount.rows[0].count);
    const atRiskCorrelation = pastDueTotal > 0
      ? Math.round((atRiskCount / pastDueTotal) * 10000) / 100
      : 0;

    // Average days past due (across all past-due invoices)
    const avgDaysResult = await sql`
      SELECT COALESCE(AVG(days_past_due), 0) as avg_days
      FROM member_invoices
      WHERE status IN ('past_due_30', 'past_due_60', 'past_due_90')
    `;
    const avgDaysPastDue = Math.round(parseFloat(avgDaysResult.rows[0].avg_days));

    // --- Past-due members list ---
    const pastDueMembers = await sql`
      SELECT
        m.member_id,
        m.first_name || ' ' || m.last_name as name,
        m.archetype,
        m.membership_type,
        COALESCE(e.engagement_score, 0) as health_score,
        SUM(i.amount - i.paid_amount + i.late_fee) as total_past_due,
        MAX(i.days_past_due) as oldest_days_past_due,
        COUNT(i.invoice_id) as invoice_count,
        MAX(i.collection_status) as collection_status,
        m.annual_dues,
        CASE
          WHEN MAX(i.days_past_due) >= 90 THEN 'critical'
          WHEN MAX(i.days_past_due) >= 60 THEN 'high'
          WHEN MAX(i.days_past_due) >= 30 THEN 'medium'
          ELSE 'low'
        END as risk_level
      FROM member_invoices i
      INNER JOIN members m ON i.member_id = m.member_id
      LEFT JOIN (
        SELECT member_id, engagement_score,
               ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY week_number DESC) as rn
        FROM member_engagement_weekly
      ) e ON m.member_id = e.member_id AND e.rn = 1
      WHERE i.status IN ('past_due_30', 'past_due_60', 'past_due_90')
      GROUP BY m.member_id, m.first_name, m.last_name, m.archetype,
               m.membership_type, e.engagement_score, m.annual_dues
      ORDER BY oldest_days_past_due DESC
    `;

    // --- Payment trends: monthly summary over last 6 months ---
    const paymentTrends = await sql`
      WITH months AS (
        SELECT '2025-10' as month UNION ALL
        SELECT '2025-11' UNION ALL
        SELECT '2025-12' UNION ALL
        SELECT '2026-01' UNION ALL
        SELECT '2026-02' UNION ALL
        SELECT '2026-03'
      )
      SELECT
        mo.month,
        COALESCE(SUM(CASE
          WHEN i.status = 'paid' AND i.paid_date <= i.due_date THEN i.paid_amount
          ELSE 0
        END), 0) as paid_on_time,
        COALESCE(SUM(CASE
          WHEN i.status = 'paid' AND i.paid_date > i.due_date THEN i.paid_amount
          ELSE 0
        END), 0) as paid_late,
        COALESCE(SUM(CASE
          WHEN i.status != 'paid' THEN i.amount - i.paid_amount
          ELSE 0
        END), 0) as still_outstanding
      FROM months mo
      LEFT JOIN member_invoices i
        ON SUBSTRING(i.due_date FROM 1 FOR 7) = mo.month
      GROUP BY mo.month
      ORDER BY mo.month ASC
    `;

    return res.status(200).json({
      summary: {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        pastDue30: {
          count: parseInt(pastDue30Result.rows[0].count),
          amount: Math.round(parseFloat(pastDue30Result.rows[0].amount) * 100) / 100,
        },
        pastDue60: {
          count: parseInt(pastDue60Result.rows[0].count),
          amount: Math.round(parseFloat(pastDue60Result.rows[0].amount) * 100) / 100,
        },
        pastDue90: {
          count: parseInt(pastDue90Result.rows[0].count),
          amount: Math.round(parseFloat(pastDue90Result.rows[0].amount) * 100) / 100,
        },
        currentDue: {
          count: parseInt(currentDueResult.rows[0].count),
          amount: Math.round(parseFloat(currentDueResult.rows[0].amount) * 100) / 100,
        },
        collectionRate,
        atRiskCorrelation,
        avgDaysPastDue,
      },
      pastDueMembers: pastDueMembers.rows.map(row => ({
        memberId: row.member_id,
        name: row.name,
        archetype: row.archetype,
        membershipType: row.membership_type,
        healthScore: parseInt(row.health_score),
        totalPastDue: Math.round(parseFloat(row.total_past_due) * 100) / 100,
        oldestDaysPastDue: parseInt(row.oldest_days_past_due),
        invoiceCount: parseInt(row.invoice_count),
        collectionStatus: row.collection_status,
        annualDues: parseFloat(row.annual_dues || 0),
        riskLevel: row.risk_level,
      })),
      paymentTrends: paymentTrends.rows.map(row => ({
        month: row.month,
        paidOnTime: Math.round(parseFloat(row.paid_on_time) * 100) / 100,
        paidLate: Math.round(parseFloat(row.paid_late) * 100) / 100,
        stillOutstanding: Math.round(parseFloat(row.still_outstanding) * 100) / 100,
      })),
      memberInvoices: [],
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
