import { SoWhatCallout } from '@/components/ui';
import { getUnderstaffedDays, getStaffingSummary } from '@/services/staffingService';
import { theme } from '@/config/theme';

const formatCurrency = (value) => (Number.isFinite(value) ? `-$${Math.abs(value).toLocaleString()}` : '—');
const formatPercent = (value, prefix = '+') => (Number.isFinite(value) ? `${value >= 0 ? prefix : ''}${(value * 100).toFixed(0)}%` : '—');
const formatMultiplier = (value) => (Number.isFinite(value) ? `${value.toFixed(1)}×` : '—');

export default function StaffingTab() {
  const rawDays = getUnderstaffedDays();
  const days = Array.isArray(rawDays) ? rawDays : [];
  const summaryData = getStaffingSummary() ?? {};
  const totalLoss = days.reduce((sum, day) => sum + (Number.isFinite(day?.revenueLoss) ? day.revenueLoss : 0), 0);
  const summary = {
    understaffedDaysCount: Number(summaryData.understaffedDaysCount ?? days.length) || 0,
    totalRevenueLoss: Number(summaryData.totalRevenueLoss ?? totalLoss) || 0,
    annualizedLoss: Number(summaryData.annualizedLoss ?? totalLoss * 12) || 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Impact summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
        {[
          { label: 'Understaffed Days', value: summary.understaffedDaysCount, sub: 'This month', accent: theme.colors.warning },
          { label: 'Revenue Loss',      value: formatCurrency(summary.totalRevenueLoss), sub: 'Estimated',  accent: theme.colors.urgent },
          { label: 'Annualized',        value: Number.isFinite(summary.annualizedLoss)
            ? `-$${(summary.annualizedLoss / 1000).toFixed(0)}K`
            : '—',
            sub: 'At current rate', accent: theme.colors.urgent },
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
                  {formatCurrency(d.revenueLoss)}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm }}>
              {[
                {
                  label: 'Staffed / Required',
                  value: (Number.isFinite(d.scheduledStaff) && Number.isFinite(d.requiredStaff))
                    ? `${d.scheduledStaff} / ${d.requiredStaff}`
                    : '—',
                },
                { label: 'Ticket Time +',      value: formatPercent(d.ticketTimeIncrease) },
                { label: 'Complaint Rate',     value: formatMultiplier(d.complaintMultiplier) },
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
