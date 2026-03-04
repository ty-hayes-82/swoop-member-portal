import { SoWhatCallout } from '@/components/ui';
import { getDemandGaps } from '@/services/operationsService';
import { theme } from '@/config/theme';

export default function DemandTab() {
  const gaps = getDemandGaps();
  const total = gaps.reduce((s, g) => s + g.waitlistCount, 0);
  const eventOverlapCount = gaps.filter(g => g.eventOverlap).length;
  const satAM = gaps.filter(g => g.slot?.includes('Sat') && g.slot?.includes('AM'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Waitlist Entries', value: total, sub: 'Total unmet demand', accent: theme.colors.operations },
          { label: 'Event Overlap', value: `${eventOverlapCount}/${gaps.length}`, sub: 'Slots on event days', accent: theme.colors.warning },
          { label: 'Peak Slot', value: 'Sat 7–9 AM', sub: 'Highest demand window', accent: theme.colors.briefing },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCardHover,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
            padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Waitlist table */}
      <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Waitlist Detail
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Date', 'Time Slot', 'Waitlist', 'Event Overlap'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  textAlign: 'left', color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                  textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gaps.map((g, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textSecondary, fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs }}>
                  {g.date}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.textPrimary }}>{g.slot}</td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.colors.operations, fontFamily: theme.fonts.mono, fontWeight: 600 }}>
                  {g.waitlistCount}
                </td>
                <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                  {g.eventOverlap
                    ? <span style={{ color: theme.colors.warning, fontSize: theme.fontSize.xs }}>⚠ Yes</span>
                    : <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="opportunity">
        <strong>{total} unmet tee times</strong> this month — 83% on event days.
        Saturday 7–9 AM is chronically oversubscribed. Opening Executive 9-hole
        overflow or expanding Championship capacity could capture this demand directly.
      </SoWhatCallout>
    </div>
  );
}
