import { useMemo } from 'react';
import { StatCard, SoWhatCallout, Sparkline, InfoTooltip, Badge } from '@/components/ui';
import MemberLink from '@/components/MemberLink.jsx';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { getFillReport, getHistoricalPatterns, getWeeklyQueuePressure } from '@/services/teeSheetOpsService';
import { revenuePerSlot } from '@/data/revenue';

const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

export default function ReportingTab() {
  const { teeSheetOps } = useApp();
  const report = useMemo(() => getFillReport(), [teeSheetOps.reassignments]);
  const historical = useMemo(() => getHistoricalPatterns(), []);
  const queuePressure = useMemo(() => getWeeklyQueuePressure(), []);

  const stats = [
    {
      label: 'Fills Completed',
      value: report.totalFills,
      sparklineData: report.weeklyTrend,
      badge: { text: 'This Period', variant: 'timeline' },
      source: 'System',
    },
    {
      label: 'Revenue Recovered',
      value: report.totalRevenueRecovered,
      format: 'currency',
      badge: { text: 'Slot Value', variant: 'success' },
      source: 'POS',
    },
    {
      label: 'Fill Conversion Rate',
      value: `${report.fillConversionRate}%`,
      badge: { text: 'Fills ÷ Open Slots', variant: 'effort' },
      source: 'System',
    },
    {
      label: 'Avg Health Improvement',
      value: report.avgHealthDelta > 0 ? `+${report.avgHealthDelta}` : '—',
      badge: { text: 'Post-Fill Delta', variant: report.avgHealthDelta > 0 ? 'success' : 'effort' },
      source: 'Analytics',
    },
  ];

  // Compute Saturday cancellation rates by month for bar visualization
  const satRates = MONTHS.map((m) => {
    const match = historical.find((h) => h.month.startsWith(m) && h.dayOfWeek === 'Sat');
    return { month: m, rate: match ? Math.round(match.cancellationRate * 100) : 0, weather: match?.weatherCorrelation ?? 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Stats */}
      <div className="grid-responsive-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ROI Comparison */}
      <div style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
        padding: theme.spacing.md,
      }}>
        <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'center', gap: 6 }}>
          ROI: Retention-Priority Routing vs. FIFO Baseline
          <InfoTooltip text="Compares actual revenue from retention-priority waitlist fills against what FIFO (first-come-first-served) would have generated for the same number of fills. The delta is incremental value from intelligent routing." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: theme.spacing.md, alignItems: 'center' }}>
          {/* Retention-priority side */}
          <div style={{
            background: `${theme.colors.success}08`,
            border: `1px solid ${theme.colors.success}30`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Retention-Priority Routing</div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.success }}>
              ${report.retentionRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              {report.retentionPriorityFills} fills × ${revenuePerSlot.retentionPriority}/slot avg
            </div>
          </div>

          {/* Delta */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Delta</div>
            <div style={{
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.lg,
              fontWeight: 700,
              color: report.roiDelta > 0 ? theme.colors.success : theme.colors.textMuted,
            }}>
              {report.roiDelta > 0 ? '+' : ''}${report.roiDelta.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted }}>per period</div>
          </div>

          {/* FIFO baseline side */}
          <div style={{
            background: theme.colors.bgDeep,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>FIFO Baseline</div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textSecondary }}>
              ${report.fifoBaselineRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              {report.totalFills} fills × ${revenuePerSlot.reactive}/slot avg
            </div>
          </div>
        </div>
      </div>

      {/* Member Saves from Fills */}
      {report.memberSaves.length > 0 && (
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          boxShadow: theme.shadow.sm,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
            background: theme.colors.bgDeep,
          }}>
            <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>
              Member Saves from Fills
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Retention-priority members served through intelligent slot routing.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: theme.colors.bg }}>
                  {['Member', 'Slot', 'Health Before → After', 'Dues Protected'].map((h) => (
                    <th key={h} style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      textAlign: 'left',
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.memberSaves.map((save) => (
                  <tr key={save.memberId} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                    <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontWeight: 600, fontSize: theme.fontSize.sm }}>
                      <MemberLink memberId={save.memberId}>{save.name}</MemberLink>
                    </td>
                    <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                      {save.slot}
                    </td>
                    <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                      <span style={{ color: theme.colors.textMuted }}>{save.healthBefore}</span>
                      <span style={{ margin: '0 6px', color: theme.colors.textMuted }}>→</span>
                      <span style={{ color: (save.healthAfter ?? 0) > (save.healthBefore ?? 0) ? theme.colors.success : theme.colors.textPrimary, fontWeight: 700 }}>
                        {save.healthAfter ?? '—'}
                      </span>
                      {(save.healthAfter ?? 0) > (save.healthBefore ?? 0) && (
                        <span style={{ color: theme.colors.success, marginLeft: 4, fontSize: 11 }}>
                          (+{(save.healthAfter ?? 0) - (save.healthBefore ?? 0)})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, fontFamily: theme.fonts.mono, fontWeight: 700 }}>
                      ${(save.duesProtected ?? 0).toLocaleString()}/yr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
        {/* Saturday cancellation rates by month */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
        }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'center', gap: 6 }}>
            Saturday Cancellation Rate
            <InfoTooltip text="Month-over-month Saturday cancellation rates. Weather correlation shows what percentage of cancellations are weather-driven vs. behavioral." />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {satRates.map((item) => (
              <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ fontSize: 10, fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>{item.rate}%</div>
                <div style={{
                  width: '100%',
                  height: Math.max(4, item.rate * 2.5),
                  borderRadius: 3,
                  background: item.rate >= 22 ? theme.colors.urgent : item.rate >= 16 ? theme.colors.warning : theme.colors.info,
                  position: 'relative',
                }}>
                  {/* Weather portion */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${Math.round(item.weather * 100)}%`,
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: 3,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{item.month}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: theme.colors.textMuted }}>
            <span>■ Total rate</span>
            <span style={{ opacity: 0.5 }}>□ Weather-driven portion</span>
          </div>
        </div>

        {/* Queue pressure trend */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.bgCard,
          padding: theme.spacing.md,
        }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm }}>
            Queue Pressure Trend (12 Weeks)
          </div>
          <div style={{ height: 60 }}>
            <Sparkline data={queuePressure} color={theme.colors.info} height={60} showDots />
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
            Queue pressure has increased from <strong>{queuePressure[0]}</strong> to <strong>{queuePressure[queuePressure.length - 1]}</strong> members
            over 12 weeks — a <strong>{Math.round(((queuePressure[queuePressure.length - 1] / Math.max(queuePressure[0], 1)) - 1) * 100)}% increase</strong>.
            Saturday mornings drive the majority of waitlist pressure.
          </div>
        </div>
      </div>

      {/* Summary callout */}
      <SoWhatCallout variant="opportunity">
        <strong>Board-ready metrics:</strong> {report.totalFills} waitlist fills completed, recovering ${report.totalRevenueRecovered.toLocaleString()} in slot value.
        Retention-priority routing generated <strong>${Math.abs(report.roiDelta).toLocaleString()} {report.roiDelta >= 0 ? 'more' : 'less'}</strong> than
        first-come-first-served would have.
        {report.avgHealthDelta > 0 && (
          <> Served members improved an average of <strong>+{report.avgHealthDelta} health points</strong>, demonstrating that tee sheet access is a direct lever for retention.</>
        )}
      </SoWhatCallout>
    </div>
  );
}
