// ExperienceInsights — correlations between experience inputs and business outcomes
import { useState, useEffect } from 'react';
import { Panel, SoWhatCallout } from '@/components/ui';
import { theme } from '@/config/theme';
import {
  touchpointCorrelations,
  correlationInsights,
  eventROI,
  complaintLoyaltyStats,
} from '@/services/experienceInsightsService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';

const TABS = [
  { key: 'correlations', label: 'Correlation Insights' },
  { key: 'touchpoints', label: 'Touchpoint Leverage' },
  { key: 'complaints', label: 'Complaint-to-Loyalty' },
  { key: 'events', label: 'Event ROI' },
];

const impactColors = {
  high: theme.colors.urgent,
  medium: theme.colors.warning,
  low: theme.colors.textMuted,
};

function CorrelationsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {correlationInsights.map((insight) => (
        <div
          key={insight.id}
          style={{
            background: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            border: '1px solid ' + theme.colors.border,
            padding: theme.spacing.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {insight.domains.map((d) => (
                  <span
                    key={d}
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: theme.colors.accent + '14',
                      color: theme.colors.accent,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, lineHeight: 1.3 }}>
                {insight.headline}
              </h3>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 14px',
                borderRadius: theme.radius.md,
                background: impactColors[insight.impact] + '12',
                border: '1px solid ' + impactColors[insight.impact] + '30',
                flexShrink: 0,
                marginLeft: theme.spacing.md,
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, color: impactColors[insight.impact], fontFamily: theme.fonts.mono }}>
                {insight.metric.value}
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: '2px' }}>
                {insight.metric.label}
              </div>
            </div>
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {insight.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function TouchpointsTab() {
  const sorted = [...touchpointCorrelations].sort((a, b) => b.retentionImpact - a.retentionImpact);
  const maxImpact = sorted[0]?.retentionImpact ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '0 0 8px' }}>
        Which touchpoints most strongly predict member retention? Ranked by correlation strength.
      </p>
      {sorted.map((tp, i) => {
        const barWidth = (tp.retentionImpact / maxImpact) * 100;
        const barColor = tp.retentionImpact >= 0.75
          ? theme.colors.success
          : tp.retentionImpact >= 0.6
          ? theme.colors.warning
          : theme.colors.textMuted;
        return (
          <div
            key={tp.touchpoint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              padding: '10px 14px',
              background: i % 2 === 0 ? theme.colors.bgDeep : 'transparent',
              borderRadius: theme.radius.sm,
            }}
          >
            <span style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, width: 20, textAlign: 'right' }}>
              #{i + 1}
            </span>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{tp.touchpoint}</div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: 20, background: theme.colors.border + '40', borderRadius: 4 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: barWidth + '%',
                  background: barColor,
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.mono,
                }}
              >
                {(tp.retentionImpact * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: theme.spacing.md }}>
        {sorted.slice(0, 3).map((tp) => (
          <p key={tp.touchpoint} style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, margin: '4px 0', lineHeight: 1.5 }}>
            <strong>{tp.touchpoint}:</strong> {tp.description}
          </p>
        ))}
      </div>
    </div>
  );
}

function ComplaintsTab() {
  const stats = complaintLoyaltyStats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div className="grid-responsive-4">
        {[
          { label: 'Total Complaints (90d)', value: stats.totalComplaints, color: theme.colors.textPrimary },
          { label: 'Resolved <24hrs', value: stats.resolvedWithin24h, color: theme.colors.success },
          { label: 'Renewal (Resolved)', value: stats.renewalRateResolved + '%', color: theme.colors.success },
          { label: 'Renewal (Unresolved)', value: stats.renewalRateUnresolved + '%', color: theme.colors.urgent },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: theme.colors.bgCard,
              borderRadius: theme.radius.md,
              border: '1px solid ' + theme.colors.border,
              padding: theme.spacing.md,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color, fontFamily: theme.fonts.mono }}>{kpi.value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '4px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <SoWhatCallout>
        Well-resolved complaints lead to <strong>89% renewal rates</strong> vs. 71% for unresolved.
        The difference isn't whether members complain &mdash; it's whether you respond fast enough.
        Every complaint is a retention opportunity.
      </SoWhatCallout>

      {/* Category breakdown */}
      <Panel title="By Category" subtitle="Complaint types, resolution rates, and retention impact">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: '1px solid ' + theme.colors.border }}>
              {['Category', 'Count', 'Resolved %', 'Retention Impact'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.topCategories.map((cat) => (
              <tr key={cat.category} style={{ borderBottom: '1px solid ' + theme.colors.border + '60' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.textPrimary }}>{cat.category}</td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>{cat.count}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: cat.resolvedPct >= 80 ? theme.colors.success : theme.colors.warning, fontWeight: 600 }}>
                    {cat.resolvedPct}%
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: theme.colors.urgent, fontWeight: 600 }}>{cat.retentionImpact}%</span>
                  <span style={{ color: theme.colors.textMuted }}> renewal impact</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function EventsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0 }}>
        Which events deliver the highest retention ROI? This answers: &ldquo;I can&rsquo;t prove events are my best retention tool.&rdquo;
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: '1px solid ' + theme.colors.border }}>
              {['Event Type', 'Avg Attendance', 'Retention Rate', 'Avg Spend/Member', 'ROI Score', 'Frequency'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventROI.sort((a, b) => b.roi - a.roi).map((evt) => (
              <tr key={evt.type} style={{ borderBottom: '1px solid ' + theme.colors.border + '60' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.textPrimary }}>{evt.type}</td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>{evt.attendance}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: evt.retentionRate >= 93 ? theme.colors.success : theme.colors.warning, fontWeight: 600 }}>
                    {evt.retentionRate}%
                  </span>
                </td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>${evt.avgSpend}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '12px',
                    background: (evt.roi >= 4 ? theme.colors.success : theme.colors.warning) + '18',
                    color: evt.roi >= 4 ? theme.colors.success : theme.colors.warning,
                  }}>
                    {evt.roi}x
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: theme.colors.textSecondary }}>{evt.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout>
        Chef&rsquo;s Table has the highest ROI (5.1x) despite lowest attendance &mdash; intimate events create the deepest loyalty.
        Member-Guest Tournaments deliver the best balance of scale and retention (48 attendees, 96% renewal, 4.2x ROI).
        <strong> Events are provably your second-best retention tool after golf itself.</strong>
      </SoWhatCallout>
    </div>
  );
}

export default function ExperienceInsights() {
  const [activeTab, setActiveTab] = useState('correlations');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={2} cardHeight={140} />;
  }

  const tabContent = {
    correlations: <CorrelationsTab />,
    touchpoints: <TouchpointsTab />,
    complaints: <ComplaintsTab />,
    events: <EventsTab />,
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px',
          }}>
            Experience-Outcome Intelligence
          </div>
          <h2 style={{
            fontFamily: theme.fonts.serif,
            fontSize: '24px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.2,
          }}>
            Which experiences drive retention &mdash; and which ones cost you members?
          </h2>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '6px 0 0' }}>
            Cross-domain correlations between touchpoints and business outcomes. Data from 6 connected systems.
          </p>
        </div>

        <Panel
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor={theme.colors.accent}
        >
          {tabContent[activeTab]}
        </Panel>
      </div>
    </PageTransition>
  );
}
