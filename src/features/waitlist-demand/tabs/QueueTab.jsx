import { Badge, SoWhatCallout, Sparkline, StatCard, WaitlistRow } from '@/components/ui';
import {
  getWaitlistQueue,
  getWaitlistSummary,
  getWaitlistInsight,
  getWaitlistDemandSparkline,
} from '@/services/waitlistService';
import { theme } from '@/config/theme';

function buildQueueStats(summary, queue) {
  const atRiskRevenue = queue
    .filter((member) => ['At Risk', 'Critical'].includes(member.riskLevel))
    .reduce((sum, member) => sum + (member.memberValueAnnual ?? 0), 0);

  const avgHealthScore = Math.round(
    queue.reduce((sum, member) => sum + member.healthScore, 0) / Math.max(queue.length, 1),
  );

  return [
    {
      label: 'Total Waiting',
      value: summary.total,
      trend: { direction: 'up', value: '+12%', period: 'vs last month' },
      sparklineData: getWaitlistDemandSparkline(),
      badge: { text: 'Live Queue', variant: 'timeline' },
      source: 'ForeTees',
    },
    {
      label: 'Retention Priority',
      value: summary.highPriority,
      trend: { direction: 'up', value: '+2', period: 'vs last weekend', inverted: true },
      sparklineData: queue.slice(0, 6).map((member) => member.daysWaiting).reverse(),
      badge: { text: 'Escalate', variant: 'warning' },
      source: 'Northstar',
    },
    {
      label: 'At-Risk Dues Exposed',
      value: atRiskRevenue,
      format: 'currency',
      trend: { direction: 'up', value: '+$4.1K', period: 'if not routed today', inverted: true },
      sparklineData: queue
        .filter((member) => ['At Risk', 'Critical'].includes(member.riskLevel))
        .slice(0, 6)
        .map((member) => member.memberValueAnnual ?? 0)
        .reverse(),
      badge: { text: 'GM Attention', variant: 'urgent' },
      source: 'Northstar',
    },
    {
      label: 'Average Health Score',
      value: avgHealthScore,
      trend: { direction: 'down', value: '-4 pts', period: 'past 2 weeks', inverted: true },
      sparklineData: queue.slice(0, 6).map((member) => member.healthScore).reverse(),
      badge: { text: 'Member Health', variant: 'effort' },
      source: 'Club Prophet',
    },
  ];
}

export default function QueueTab() {
  const queue = getWaitlistQueue();
  const summary = getWaitlistSummary();
  const topPriority = queue.find((member) => member.retentionPriority === 'HIGH') ?? queue[0];
  const stats = buildQueueStats(summary, queue);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: theme.spacing.md }}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
          boxShadow: theme.shadow.sm,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <div>
            <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>
              Retention-Prioritized Queue
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Highest-risk members are surfaced first, not first-come-first-served.
            </div>
          </div>
          <Badge text="Retention-First Routing" variant="timeline" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {queue.map((entry) => (
            <WaitlistRow key={entry.memberId} {...entry} />
          ))}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: theme.spacing.md,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>
            Waiting Pressure Trend
          </div>
          <div style={{ height: 46 }}>
            <Sparkline data={getWaitlistDemandSparkline()} color={theme.colors.info} height={46} showDots />
          </div>
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          Priority members account for <strong>{summary.highPriority}</strong> of <strong>{summary.total}</strong> queue entries.
          Average wait is <strong>{summary.avgDaysWaiting} days</strong>, with queue demand rising into Saturday windows.
        </div>
      </div>

      <SoWhatCallout variant="warning">
        <strong>{topPriority?.memberName}</strong> is currently waiting for a high-demand slot with a health score of{' '}
        <strong>{topPriority?.healthScore}</strong>. GM action: route the next cancellation to this member first, then trigger
        concierge outreach to preserve dues and improve engagement trajectory.
        {' '}{getWaitlistInsight()}
      </SoWhatCallout>
    </div>
  );
}
