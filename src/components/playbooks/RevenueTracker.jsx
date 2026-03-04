import { useFixItActions } from '@/hooks/useFixItActions';
import { theme } from '@/config/theme';

/**
 * RevenueTracker — cumulative impact display for sidebar / header
 * Props: { compact? }
 */
export default function RevenueTracker({ compact = false }) {
  const { activeCount, totalPlaybooks, totalRevenueImpact } = useFixItActions();

  const fmt = (n) => n >= 1000
    ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
    : `$${n}`;

  if (compact) {
    return (
      <div style={{
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        background: activeCount > 0 ? `${theme.colors.success}18` : theme.colors.bgCardHover,
        borderRadius: theme.radius.md,
        border: `1px solid ${activeCount > 0 ? `${theme.colors.success}40` : theme.colors.border}`,
      }}>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 2 }}>
          {activeCount}/{totalPlaybooks} playbooks active
        </div>
        <div style={{ fontSize: theme.fontSize.md, fontFamily: theme.fonts.mono, fontWeight: 700,
          color: activeCount > 0 ? theme.colors.success : theme.colors.textSecondary }}>
          {fmt(totalRevenueImpact.monthly)}<span style={{ fontSize: theme.fontSize.xs, fontWeight: 400 }}>/mo</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: theme.spacing.md, borderRadius: theme.radius.md,
      background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
    }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
        Revenue Impact Tracker
      </div>
      <div style={{ display: 'flex', gap: theme.spacing.lg }}>
        {[
          { label: 'Monthly', value: fmt(totalRevenueImpact.monthly) },
          { label: 'Annualized', value: fmt(totalRevenueImpact.annual) },
          { label: 'Playbooks', value: `${activeCount} / ${totalPlaybooks}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
            <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono, fontWeight: 700,
              color: activeCount > 0 ? theme.colors.success : theme.colors.textPrimary }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
