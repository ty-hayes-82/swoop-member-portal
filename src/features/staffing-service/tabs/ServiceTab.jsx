import { SoWhatCallout } from '@/components/ui';
import { getComplaintCorrelation, getFeedbackSummary } from '@/services/staffingService';
import { theme } from '@/config/theme';

const SENTIMENT_COLOR = (s) => {
  if (s <= -0.6) return theme.colors.urgent;
  if (s <= -0.3) return theme.colors.warning;
  return theme.colors.success;
};

const STATUS_COLOR = {
  acknowledged: theme.colors.warning,
  in_progress:  theme.colors.briefing,
  resolved:     theme.colors.success,
  escalated:    theme.colors.urgent,
};

export default function ServiceTab() {
  const complaints = getComplaintCorrelation();
  const summary = getFeedbackSummary();
  const mbr203 = complaints.find(c => c.memberId === 'mbr_203');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* mbr_203 spotlight */}
      {mbr203 && (
        <div style={{ background: `${theme.colors.urgent}10`, borderRadius: theme.radius.md,
          border: `2px solid ${theme.colors.urgent}50`, padding: theme.spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: theme.spacing.md }}>
            <div>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent,
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                ⚠ Service Recovery Failure — Live Case
              </span>
              <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary,
                marginTop: 4 }}>Member mbr_203</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Status</div>
              <div style={{ color: STATUS_COLOR[mbr203.status] ?? theme.colors.textMuted,
                fontWeight: 600, textTransform: 'capitalize' }}>{mbr203.status}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md }}>
            {[
              { label: 'Complaint Date', value: 'Jan 18', color: theme.colors.textPrimary },
              { label: 'Category', value: mbr203.category, color: theme.colors.textPrimary },
              { label: 'Sentiment', value: mbr203.sentiment.toFixed(1), color: SENTIMENT_COLOR(mbr203.sentiment) },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{label}</div>
                <div style={{ fontSize: theme.fontSize.md, fontFamily: theme.fonts.mono,
                  fontWeight: 600, color }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.sm,
            background: theme.colors.bg, borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.xs, color: theme.colors.urgent }}>
            ⏰ Complaint filed Jan 18 → Status "Acknowledged" → Never resolved → Member resigned Jan 22
          </div>
        </div>
      )}

      {/* Feedback by category */}
      <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Feedback by Category
          </span>
        </div>
        {summary.map((s, i) => (
          <div key={i} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderBottom: i < summary.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <span style={{ flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{s.category}</span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary }}>{s.count} reports</span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.sm,
              color: SENTIMENT_COLOR(s.avgSentiment) }}>{s.avgSentiment.toFixed(2)}</span>
            {s.unresolvedCount > 0 && (
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.warning,
                background: `${theme.colors.warning}20`, padding: '2px 6px', borderRadius: 4 }}>
                {s.unresolvedCount} open
              </span>
            )}
          </div>
        ))}
      </div>

      <SoWhatCallout variant="warning">
        Service Speed has the highest complaint volume and 4 unresolved cases.
        On understaffed days, complaint rates run <strong>2× normal</strong> — the staffing
        and service problems are the same problem.
      </SoWhatCallout>
    </div>
  );
}
