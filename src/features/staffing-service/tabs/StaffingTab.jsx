import { SoWhatCallout } from '@/components/ui';
import { getUnderstaffedDays, getStaffingSummary } from '@/services/staffingService';
import { theme } from '@/config/theme';

export default function StaffingTab() {
  const days = getUnderstaffedDays();
  const summary = getStaffingSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Impact summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Understaffed Days', value: summary.understaffedDaysCount, sub: 'This month', accent: theme.colors.warning },
          { label: 'Revenue Loss',      value: `-$${summary.totalRevenueLoss.toLocaleString()}`, sub: 'Estimated',  accent: theme.colors.urgent },
          { label: 'Annualized',        value: `-$${(summary.annualizedLoss / 1000).toFixed(0)}K`, sub: 'At current rate', accent: theme.colors.urgent },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`, padding: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: accent, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Understaffed day detail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {days.map((d, i) => (
          <div key={i} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`, padding: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <div>
                <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs,
                  color: theme.colors.textMuted }}>{d.date}</span>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}>
                  {d.outlet}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Est. revenue loss</div>
                <div style={{ fontSize: theme.fontSize.lg, fontFamily: theme.fonts.mono,
                  fontWeight: 700, color: theme.colors.urgent }}>
                  -${d.revenueLoss.toLocaleString()}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm }}>
              {[
                { label: 'Staffed / Required', value: `${d.scheduledStaff} / ${d.requiredStaff}` },
                { label: 'Ticket Time +',      value: `+${(d.ticketTimeIncrease * 100).toFixed(0)}%` },
                { label: 'Complaint Rate',     value: `${d.complaintMultiplier.toFixed(1)}×` },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: theme.spacing.sm, background: theme.colors.bg,
                  borderRadius: theme.radius.sm }}>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontFamily: theme.fonts.mono,
                    fontWeight: 600, color: theme.colors.warning }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SoWhatCallout variant="insight">
        All three understaffed days were in the <strong>Grill Room</strong> — the highest-volume
        outlet. A cross-trained flex pool of 3–4 employees could eliminate these gaps
        before they happen.
      </SoWhatCallout>
    </div>
  );
}
