import { useState } from 'react';
import { SoWhatCallout } from '@/components/ui';
import QuickActions from '@/components/ui/QuickActions.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import { getComplaintCorrelation, getFeedbackSummary } from '@/services/staffingService';
import { theme } from '@/config/theme';

const severityLabel = (score) => {
  if (score <= -0.7) return { label: 'Very unhappy', color: theme.colors.urgent };
  if (score <= -0.4) return { label: 'Unhappy', color: theme.colors.warning };
  return { label: 'Minor concern', color: theme.colors.success };
};

const STATUS_LABEL = {
  acknowledged: { label: 'Seen, not resolved', color: theme.colors.warning },
  in_progress: { label: 'Being handled', color: theme.colors.info },
  resolved: { label: 'Resolved', color: theme.colors.success },
  escalated: { label: 'Escalated to GM', color: theme.colors.urgent },
};

export default function ServiceTab() {
  const complaints = getComplaintCorrelation();
  const summary = getFeedbackSummary();
  const whitfield = complaints.find((item) => item.memberId === 'mbr_203');
  const [showArchetypes] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {whitfield && (
        <div style={{ background: `${theme.colors.urgent}08`, borderRadius: theme.radius.md, border: `2px solid ${theme.colors.urgent}40`, padding: theme.spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
            <div>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                ⚠ Member Needs Personal Attention
              </span>
              <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 4, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                James Whitfield
                <ArchetypeBadge archetype="Balanced Active" size="sm" />
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 }}>
                Member since 2019 · Full Golf · $18,000/yr in dues · 47 rounds this year
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Status</div>
              <div style={{ color: STATUS_LABEL[whitfield.status]?.color ?? theme.colors.textMuted, fontWeight: 600 }}>
                {STATUS_LABEL[whitfield.status]?.label ?? whitfield.status}
              </div>
            </div>
          </div>

          <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, lineHeight: 1.7 }}>
              James had lunch at the Grill Room on January 16th while the team was understaffed. His food took 40 minutes. He filed a complaint that evening. We acknowledged it, but no one followed up.
            </div>
            <div style={{ marginTop: theme.spacing.sm, padding: '8px 12px', background: `${theme.colors.urgent}08`, borderLeft: `3px solid ${theme.colors.urgent}`, borderRadius: '0 4px 4px 0', fontSize: theme.fontSize.xs, color: theme.colors.urgent, lineHeight: 1.6 }}>
              Members in this pattern typically resign within a week unless recovery outreach happens immediately.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {[
              { label: 'Complaint filed', value: 'Jan 16 · Grill Room' },
              { label: 'How unhappy', value: severityLabel(whitfield.sentiment).label, color: severityLabel(whitfield.sentiment).color },
              { label: 'Days without follow-up', value: '6 days', color: theme.colors.urgent },
            ].map((item) => (
              <div key={item.label} style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: item.color ?? theme.colors.textPrimary }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              marginBottom: theme.spacing.sm,
              background: 'rgba(34,211,238,0.04)',
              border: '1px solid rgba(34,211,238,0.20)',
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.xs,
              color: '#22D3EE',
            }}
          >
            <span style={{ fontFamily: theme.fonts.mono, fontSize: 13, opacity: 0.9 }}>⬡</span>
            <span>
              <strong>Service Recovery Agent</strong> flagged this complaint on <strong>January 13, 2026 at 8:43 AM</strong> and proposed escalation.
              No approval was recorded before churn risk crossed threshold.
            </span>
          </div>

          <QuickActions memberName="James Whitfield" memberId="mbr_203" context="Grill Room complaint — slow service on Jan 16. Felt ignored after acknowledging." />
        </div>
      )}

      <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>Member Feedback This Month</span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>34 total reports</span>
        </div>
        {summary.map((row, index) => (
          <div
            key={index}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderBottom: index < summary.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}
          >
            <span style={{ flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{row.category}</span>
            <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{row.count} reports</span>
            <span style={{ fontSize: theme.fontSize.sm, color: severityLabel(row.avgSentiment).color, fontWeight: 600 }}>
              {severityLabel(row.avgSentiment).label}
            </span>
            {row.unresolvedCount > 0 && (
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.warning, background: `${theme.colors.warning}18`, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {row.unresolvedCount} need follow-up
              </span>
            )}
          </div>
        ))}
      </div>

      <SoWhatCallout variant="warning">
        Slow service is still the top complaint. The pattern is consistent: understaffed periods lead to unresolved feedback, then churn risk accelerates.
      </SoWhatCallout>
    </div>
  );
}
