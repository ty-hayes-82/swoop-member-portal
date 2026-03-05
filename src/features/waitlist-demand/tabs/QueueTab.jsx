import { SoWhatCallout, ArchetypeBadge } from '@/components/ui';
import { getWaitlistQueue, getWaitlistSummary } from '@/services/waitlistService';
import { theme } from '@/config/theme';

const RISK_COLORS = {
  Healthy:   theme.colors.success,
  Watch:     theme.colors.warning,
  'At Risk': '#D97706',
  Critical:  theme.colors.urgent,
};

function WaitlistRow({ memberName, memberId, archetype, healthScore, riskLevel,
  requestedSlot, alternatesAccepted, daysWaiting, retentionPriority, diningHistory, lastRound }) {
  const isPriority = retentionPriority === 'HIGH';
  return (
    <tr style={{ borderTop: `1px solid ${theme.colors.border}`,
      background: isPriority ? 'rgba(192,57,43,0.04)' : 'transparent' }}>
      <td style={{ padding: `10px ${theme.spacing.md}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPriority && (
            <span style={{ fontSize: 10, background: theme.colors.urgent, color: '#fff',
              padding: '1px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em',
              flexShrink: 0 }}>PRIORITY</span>
          )}
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: isPriority ? 600 : 400,
            color: theme.colors.textPrimary }}>{memberName}</span>
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
          Last round: {lastRound} · {diningHistory}
        </div>
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}` }}>
        <ArchetypeBadge archetype={archetype} size="sm" />
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, textAlign: 'center' }}>
        <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: theme.fontSize.sm,
          color: RISK_COLORS[riskLevel] }}>{healthScore}</div>
        <div style={{ fontSize: 10, color: RISK_COLORS[riskLevel] }}>{riskLevel}</div>
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary }}>
        <div>{requestedSlot}</div>
        {alternatesAccepted.length > 0 && (
          <div style={{ color: theme.colors.textMuted, marginTop: 2 }}>
            Alt: {alternatesAccepted.slice(0, 2).join(', ')}
          </div>
        )}
      </td>
      <td style={{ padding: `10px ${theme.spacing.md}`, textAlign: 'center',
        fontFamily: theme.fonts.mono, fontWeight: 600, fontSize: theme.fontSize.sm,
        color: daysWaiting >= 4 ? theme.colors.warning : theme.colors.textMuted }}>
        {daysWaiting}d
      </td>
    </tr>
  );
}

export default function QueueTab() {
  const queue = getWaitlistQueue();
  const summary = getWaitlistSummary();
  const priorityCount = queue.filter(e => e.retentionPriority === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Total Waiting',       value: summary.total,         accent: theme.colors.operations },
          { label: 'Retention Priority',  value: summary.highPriority,  accent: theme.colors.urgent },
          { label: 'At-Risk Members',     value: summary.atRisk,        accent: theme.colors.warning },
          { label: 'Avg Days Waiting',    value: `${summary.avgDaysWaiting}d`, accent: theme.colors.textSecondary },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md, padding: theme.spacing.md, boxShadow: theme.shadow.sm }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Queue table */}
      <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgDeep, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
              Member Queue
            </span>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginLeft: 8 }}>
              Sorted by retention risk · {priorityCount} flagged for priority notification
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#22D3EE', fontWeight: 600,
            background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)',
            borderRadius: theme.radius.sm, padding: '2px 10px' }}>
            Retention-first · not first-come
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Member', 'Archetype', 'Health', 'Requested Slot', 'Waiting'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  textAlign: h === 'Health' || h === 'Waiting' ? 'center' : 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.map(entry => <WaitlistRow key={entry.memberId} {...entry} />)}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="warning">
        <strong>Anne Jordan has been waiting 4 days.</strong> Her last round was Dec 28. Health score: 38.
        Filling this slot today has an estimated 68% chance of preventing resignation — worth $12,000 in annual dues.
        Noteefy would notify all {summary.total} members equally. Swoop routes the cancellation alert to her first.
      </SoWhatCallout>
    </div>
  );
}
