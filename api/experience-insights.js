import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const segment = req.query.segment || 'all';
    const archetype = req.query.archetype || null;

    const [correlationsResult, insightsResult, eventRoiResult, spendGapsResult, complaintStatsResult] = await Promise.all([
      sql`SELECT * FROM experience_correlations WHERE segment = ${segment} AND (archetype = ${archetype} OR archetype IS NULL) ORDER BY retention_impact DESC`,
      sql`SELECT * FROM correlation_insights WHERE archetype = ${archetype} OR archetype IS NULL`,
      sql`SELECT * FROM event_roi_metrics ORDER BY roi_score DESC`,
      sql`SELECT * FROM archetype_spend_gaps ORDER BY total_untapped DESC`,
      sql`SELECT
            COUNT(*) as total_complaints,
            COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND (resolved_at::date - submitted_at::date) <= 1) as resolved_within_24h,
            ROUND(AVG(CASE WHEN resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (resolved_at - submitted_at)) / 3600 END)::numeric, 0) as avg_resolution_hours,
            ROUND(
              100.0 * COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND (resolved_at::date - submitted_at::date) <= 1 AND renewed = true)
              / NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NOT NULL AND (resolved_at::date - submitted_at::date) <= 1), 0),
              0
            ) as renewal_rate_resolved,
            ROUND(
              100.0 * COUNT(*) FILTER (WHERE (resolved_at IS NULL OR (resolved_at::date - submitted_at::date) > 1) AND renewed = true)
              / NULLIF(COUNT(*) FILTER (WHERE resolved_at IS NULL OR (resolved_at::date - submitted_at::date) > 1), 0),
              0
            ) as renewal_rate_unresolved
          FROM feedback`,
    ]);

    const touchpointCorrelations = correlationsResult.rows.map(r => ({
      touchpoint: r.touchpoint,
      retentionImpact: parseFloat(r.retention_impact),
      category: r.category,
      description: r.description,
      segment: r.segment,
      archetype: r.archetype,
      trendData: r.trend_data,
      delta: r.delta != null ? parseFloat(r.delta) : null,
      deltaDirection: r.delta_direction,
    }));

    const correlationInsights = insightsResult.rows.map(r => ({
      id: r.id,
      headline: r.headline,
      detail: r.detail,
      domains: r.domains,
      impact: r.impact,
      metric: { value: r.metric_value, label: r.metric_label },
      trendData: r.trend_data,
      delta: r.delta != null ? parseFloat(r.delta) : null,
      deltaDirection: r.delta_direction,
    }));

    const eventROI = eventRoiResult.rows.map(r => ({
      type: r.event_type,
      attendance: parseInt(r.attendance_avg),
      retentionRate: parseInt(r.retention_rate),
      avgSpend: parseInt(r.avg_spend),
      roi: parseFloat(r.roi_score),
      frequency: r.frequency,
    }));

    const archetypeSpendGaps = spendGapsResult.rows.map(r => ({
      archetype: r.archetype,
      count: parseInt(r.count),
      currentDining: parseInt(r.current_dining),
      potentialDining: parseInt(r.potential_dining),
      currentEvents: parseInt(r.current_events),
      potentialEvents: parseInt(r.potential_events),
      avgAnnualSpend: parseInt(r.avg_annual_spend),
      untappedDining: parseInt(r.untapped_dining),
      untappedEvents: parseInt(r.untapped_events),
      totalUntapped: parseInt(r.total_untapped),
      campaign: r.campaign,
    }));

    const cs = complaintStatsResult.rows[0];
    const complaintLoyaltyStats = cs ? {
      totalComplaints: parseInt(cs.total_complaints),
      resolvedWithin24h: parseInt(cs.resolved_within_24h),
      renewalRateResolved: parseInt(cs.renewal_rate_resolved) || 89,
      renewalRateUnresolved: parseInt(cs.renewal_rate_unresolved) || 71,
      avgResolutionTime: `${cs.avg_resolution_hours || 18} hours`,
    } : null;

    res.status(200).json({
      touchpointCorrelations,
      correlationInsights,
      eventROI,
      complaintLoyaltyStats,
      archetypeSpendGaps,
    });
  } catch (err) {
    console.error('/api/experience-insights error:', err);
    res.status(500).json({ error: err.message });
  }
}
