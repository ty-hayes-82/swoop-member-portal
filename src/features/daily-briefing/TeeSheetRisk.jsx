// TeeSheetRisk.jsx — cancellation risk alert strip for TodayRiskFactors
// Extracted to keep TodayRiskFactors.jsx under 150-line ceiling
import { useNavigation } from '@/context/NavigationContext';
import { theme } from '@/config/theme';

export default function TeeSheetRisk({ cancellationRisk }) {
  const { navigate } = useNavigation();
  if (!cancellationRisk || cancellationRisk.highRiskBookings === 0) return null;

  const { highRiskBookings, totalRevAtRisk, driverSummary, suggestedAction, estimatedRevenueSaved } = cancellationRisk;

  return (
    <div
      onClick={() => navigate('waitlist-demand')}
      style={{
        background: `${theme.colors.warning}08`,
        border: `1px solid ${theme.colors.warning}40`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${theme.colors.warning}12`}
      onMouseLeave={e => e.currentTarget.style.background = `${theme.colors.warning}08`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.warning,
            textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
            ⚠ Tee Sheet Risk · Tomorrow Jan 18
          </div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
            {highRiskBookings} bookings at elevated cancellation risk · {driverSummary}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            {suggestedAction}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Rev at risk</div>
          <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: theme.fontSize.lg,
            color: theme.colors.warning }}>${totalRevAtRisk.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: theme.colors.success, marginTop: 2 }}>
            ~${estimatedRevenueSaved} recoverable
          </div>
        </div>
      </div>
      <div style={{ marginTop: theme.spacing.sm, textAlign: 'right' }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textPrimary, fontWeight: 500 }}>
          Cancellation Risk → Waitlist & Demand
        </span>
      </div>
    </div>
  );
}
