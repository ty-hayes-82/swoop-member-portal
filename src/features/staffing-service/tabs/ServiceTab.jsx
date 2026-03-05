// ServiceTab — Language reframed for GM. "Left unhappy" not "sentiment -0.8"
import { useState } from 'react';
import { SoWhatCallout } from '@/components/ui';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { getComplaintCorrelation, getFeedbackSummary } from '@/services/staffingService';
import { theme } from '@/config/theme';

// Human-readable complaint severity, not a score
const severityLabel = (s) => {
  if (s <= -0.7) return { label: 'Very unhappy', color: theme.colors.urgent };
  if (s <= -0.4) return { label: 'Unhappy', color: theme.colors.warning };
  return { label: 'Minor concern', color: theme.colors.success };
};

const STATUS_LABEL = {
  acknowledged: { label: 'Seen, not resolved', color: theme.colors.warning },
  in_progress:  { label: 'Being handled', color: theme.colors.info },
  resolved:     { label: 'Resolved', color: theme.colors.success },
  escalated:    { label: 'Escalated to GM', color: theme.colors.urgent },
};

export default function ServiceTab() {
  const complaints = getComplaintCorrelation();
  const summary = getFeedbackSummary();
  const whitfield = complaints.find(c => c.memberId === 'mbr_203');
  const [showArchetypes, setShowArchetypes] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* James Whitfield spotlight — plain English */}
      {whitfield && (
        <div style={{
          background: `${theme.colors.urgent}08`, borderRadius: theme.radius.md,
          border: `2px solid ${theme.colors.urgent}40`, padding: theme.spacing.lg,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
            <div>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                ⚠ Member Needs Personal Attention
              </span>
              <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 4 }}>
                James Whitfield
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

          {/* Plain-English situation */}
          <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, lineHeight: 1.7 }}>
              James had lunch at the Grill Room on January 16th — one of the days we were short-staffed. His food took 40 minutes. He filed a complaint that evening. We acknowledged it, but no one followed up. He hasn't been back in 6 days.
            </div>
            <div style={{ marginTop: theme.spacing.sm, padding: '8px 12px', background: `${theme.colors.urgent}08`,
              borderLeft: `3px solid ${theme.colors.urgent}`, borderRadius: `0 4px 4px 0`,
              fontSize: theme.fontSize.xs, color: theme.colors.urgent, lineHeight: 1.6 }}>
              Members in this pattern — active, unhappy, no follow-up — typically resign within a week. James has a tee time Saturday morning.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            {[
              { label: 'Complaint filed', value: 'Jan 16 · Grill Room' },
              { label: 'How unhappy', value: severityLabel(whitfield.sentiment).label, color: severityLabel(whitfield.sentiment).color },
              { label: 'Days without follow-up', value: '6 days', color: theme.colors.urgent },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: color ?? theme.colors.textPrimary }}>{value}</div>
              </div>
            ))}
          </div>

          <QuickActions
            memberName="James Whitfield"
            memberId="mbr_203"
            context="Grill Room complaint — slow service on Jan 16. Felt ignored after acknowledging."
          />
        </div>
      )}

      {/* Feedback summary — human labels */}
      <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            Member Feedback This Month
          </span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>34 total reports</span>
        </div>
        {summary.map((s, i) => (
          <div key={i} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderBottom: i < summary.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <span style={{ flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{s.category}</span>
            <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{s.count} reports</span>
            <span style={{ fontSize: theme.fontSize.sm, color: severityLabel(s.avgSentiment).color, fontWeight: 600 }}>
              {severityLabel(s.avgSentiment).label}
            </span>
            {s.unresolvedCount > 0 && (
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.warning,
                background: `${theme.colors.warning}18`, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {s.unresolvedCount} need follow-up
              </span>
            )}
          </div>
        ))}
      </div>

      <SoWhatCallout variant="warning">
        Slow service is the top complaint — 14 reports this month, 4 still unresolved. On understaffed days, complaints run twice normal. The staffing gap and the service problem are the same problem.
      </SoWhatCallout>
    </div>
  );
}
