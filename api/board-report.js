import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const [snapshots, interventions, opInterventions, trends] = await Promise.all([
      sql`
        SELECT members_saved, dues_protected, ltv_protected, revenue_recovered,
               service_failures_caught, avg_response_time_hrs, board_confidence_pct
        FROM board_report_snapshots
        ORDER BY snapshot_date DESC
        LIMIT 1
      `,
      sql`
        SELECT mi.member_id,
               COALESCE(TRIM(m.first_name || ' ' || m.last_name), 'Member ' || mi.member_id) AS name,
               mi.health_before, mi.health_after,
               mi.trigger, mi.action, mi.outcome, mi.dues_at_risk
        FROM member_interventions mi
        LEFT JOIN members m ON m.member_id = mi.member_id
        ORDER BY mi.created_at DESC
      `,
      sql`
        SELECT event, detection, action, outcome, revenue_protected
        FROM operational_interventions
        ORDER BY event_date DESC
      `,
      sql`
        SELECT TO_CHAR(snapshot_date, 'Mon') AS month,
               members_saved,
               dues_protected,
               service_failures_caught,
               avg_response_time_hrs
        FROM board_report_snapshots
        ORDER BY snapshot_date ASC
        LIMIT 6
      `,
    ]);

    // Map snapshot to KPI shape
    const snap = snapshots.rows[0] ?? {};
    const kpis = [
      { label: 'Members Saved', value: Number(snap.members_saved ?? 0), prefix: '', suffix: '', color: 'green' },
      { label: 'Dues Protected', value: Math.round(Number(snap.dues_protected ?? 0) / 1000), prefix: '$', suffix: 'K', color: 'green' },
      { label: 'Lifetime Value Protected', value: Math.round(Number(snap.ltv_protected ?? 0) / 1000), prefix: '$', suffix: 'K', color: 'green' },
      { label: 'Revenue Recovered', value: Math.round(Number(snap.revenue_recovered ?? 0) / 1000 * 10) / 10, prefix: '$', suffix: 'K', color: 'blue' },
      { label: 'Service Failures Caught', value: Number(snap.service_failures_caught ?? 0), prefix: '', suffix: '', color: 'orange' },
      { label: 'Avg Response Time', value: Number(snap.avg_response_time_hrs ?? 0), prefix: '', suffix: ' hrs', color: 'blue' },
      { label: 'Board Confidence Score', value: Number(snap.board_confidence_pct ?? 0), prefix: '', suffix: '%', color: 'green' },
    ];

    // Map member interventions
    const memberSaves = interventions.rows.map((r) => ({
      name: r.name ?? `Member ${r.member_id}`,
      healthBefore: Number(r.health_before),
      healthAfter: Number(r.health_after),
      trigger: r.trigger,
      action: r.action,
      outcome: r.outcome,
      duesAtRisk: Number(r.dues_at_risk),
    }));

    // Map operational interventions
    const operationalSaves = opInterventions.rows.map((r) => ({
      event: r.event,
      detection: r.detection,
      action: r.action,
      outcome: r.outcome,
      revenueProtected: Number(r.revenue_protected),
    }));

    // Map monthly trends
    const monthlyTrends = trends.rows.map((r) => ({
      month: r.month?.trim(),
      membersSaved: Number(r.members_saved),
      duesProtected: Number(r.dues_protected),
      serviceFailures: Number(r.service_failures_caught),
      responseTime: Number(r.avg_response_time_hrs),
    }));

    res.status(200).json({ kpis, memberSaves, operationalSaves, monthlyTrends });
  } catch (err) {
    console.error('/api/board-report error:', err);
    res.status(500).json({ error: err.message });
  }
}
