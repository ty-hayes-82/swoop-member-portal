// ExperienceInsights — correlations between experience inputs and business outcomes
import { useState, useEffect } from 'react';
import { Panel, SoWhatCallout, PlaybookActionCard, Sparkline } from '@/components/ui';
import { theme } from '@/config/theme';
import {
  touchpointCorrelations,
  touchpointCorrelationsAtRisk,
  touchpointCorrelationsByArchetype,
  correlationInsights,
  correlationInsightsByArchetype,
  eventROI,
  complaintLoyaltyStats,
  archetypeSpendGaps,
} from '@/services/experienceInsightsService';
import { getArchetypeProfiles } from '@/services/memberService';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';
import { useApp } from '@/context/AppContext';

const TABS = [
  { key: 'correlations', label: 'Correlation Insights' },
  { key: 'touchpoints', label: 'Touchpoint Leverage' },
  { key: 'complaints', label: 'Complaint-to-Loyalty' },
  { key: 'events', label: 'Event ROI' },
  { key: 'spend', label: 'Spend Potential' },
];

const impactColors = {
  high: theme.colors.urgent,
  medium: theme.colors.warning,
  low: theme.colors.textMuted,
};

const SEGMENT_LABELS = { all: 'all', 'at-risk': 'at-risk', healthy: 'healthy' };
const SEGMENT_COUNTS = { all: 300, 'at-risk': 47, healthy: 218 };

function SegmentFilter({ segment, onChange }) {
  const options = [
    { key: 'all', label: 'All Members' },
    { key: 'at-risk', label: 'At-Risk Only' },
    { key: 'healthy', label: 'Healthy Only' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600 }}>Showing:</span>
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}` }}>
          {options.map(({ key, label }) => (
            <button key={key} onClick={() => onChange(key)} style={{
              padding: '5px 14px', borderRadius: '6px', fontSize: theme.fontSize.xs, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: segment === key ? theme.colors.bgCard : 'transparent',
              color: segment === key ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: segment === key ? theme.shadow.sm : 'none',
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
        Based on your club's data: last 12 months, {SEGMENT_COUNTS[segment]} members
      </div>
    </div>
  );
}

function ArchetypeFilter({ archetype, onChange }) {
  const profiles = getArchetypeProfiles();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: theme.spacing.md }}>
      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontWeight: 600 }}>Filter by archetype:</span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {profiles.map((p) => {
          const isActive = archetype === p.archetype;
          return (
            <button
              key={p.archetype}
              onClick={() => onChange(isActive ? null : p.archetype)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                background: isActive ? `${theme.colors.accent}12` : 'transparent',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                transition: 'all 0.15s',
              }}
            >
              <ArchetypeBadge archetype={p.archetype} size="xs" />
              <span>{p.archetype}</span>
              <span style={{ fontSize: 10, color: theme.colors.textMuted }}>({p.count})</span>
            </button>
          );
        })}
        {archetype && (
          <button
            onClick={() => onChange(null)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${theme.colors.border}`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 11,
              color: theme.colors.textMuted,
            }}
          >
            Clear ×
          </button>
        )}
      </div>
    </div>
  );
}

function CorrelationsTab({ segment, archetype }) {
  const insights = archetype && correlationInsightsByArchetype[archetype]
    ? correlationInsightsByArchetype[archetype]
    : correlationInsights;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {(segment !== 'all' || archetype) && (
        <div style={{
          padding: '8px 14px',
          background: theme.colors.accent + '08',
          border: '1px solid ' + theme.colors.accent + '20',
          borderRadius: theme.radius.sm,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
        }}>
          Showing correlations for <strong>{archetype ?? segment}</strong> members — some patterns differ from the full population.
        </div>
      )}
      {insights.map((insight) => (
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
              {insight.trend && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 20, width: 60, margin: '0 auto' }}>
                    <Sparkline data={insight.trend} color={insight.deltaDirection === 'up' ? theme.colors.success : theme.colors.info} height={20} />
                  </div>
                  {insight.delta && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: theme.colors.success, marginTop: 2 }}>
                      {insight.deltaDirection === 'up' ? '↑' : '↓'} {insight.delta}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0 }}>
            {insight.detail}
          </p>
        </div>
      ))}

      {/* Contextual playbook actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: theme.spacing.md }}>
        <PlaybookActionCard
          icon={'🍽️'}
          title="98 members never dine post-round. Activate Dining Dormancy Recovery."
          description="Members who dine after rounds renew at 92% vs. 61%. Close this gap with a targeted dining incentive."
          playbookName="Dining Dormancy Recovery"
          impact="$11K/mo"
          memberCount={98}
          buttonColor="#ea580c"
        />
        <PlaybookActionCard
          icon={'🚨'}
          title="5 open complaints unresolved >24hrs — activate rapid response."
          description="Each complaint resolved within 24hrs improves renewal by 18%. These 5 are past the window."
          playbookName="Service Failure Rapid Response"
          impact="$24K/mo"
          memberCount={5}
          buttonColor="#dc2626"
          variant="urgent"
        />
        <PlaybookActionCard
          icon={'🎫'}
          title="24 Ghost members, 0 events in 8 weeks — send event invitations."
          description="Event attendance is the 2nd strongest retention predictor. These members haven't attended any."
          playbookName="Post-Event Engagement Capture"
          impact="$6K/mo"
          memberCount={24}
          buttonColor="#22c55e"
        />
        <PlaybookActionCard
          icon={'📉'}
          title="30 members in multi-domain decline, $540K at risk."
          description="When golf, dining, and email all decline simultaneously, resignation follows within 60 days."
          playbookName="Declining Member Intervention"
          impact="$24K/mo"
          memberCount={30}
          buttonColor="#dc2626"
          variant="urgent"
        />
      </div>
    </div>
  );
}

function TouchpointsTab({ segment, archetype }) {
  const source = archetype && touchpointCorrelationsByArchetype[archetype]
    ? touchpointCorrelationsByArchetype[archetype]
    : segment === 'at-risk' ? touchpointCorrelationsAtRisk : touchpointCorrelations;
  const sorted = [...source].sort((a, b) => b.retentionImpact - a.retentionImpact);
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

      {/* Playbook links per top touchpoint */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: theme.spacing.md }}>
        <PlaybookActionCard variant="compact" icon={'🏌️'} title="Round Frequency → Declining Member Intervention" impact="$24K/mo" memberCount={30} playbookName="Declining Member Intervention" buttonLabel="See Playbook" buttonColor="#dc2626" />
        <PlaybookActionCard variant="compact" icon={'🚨'} title="Complaint Resolution → Service Save Protocol" impact="$18K/mo" memberCount={5} playbookName="Service Save Protocol" buttonLabel="See Playbook" buttonColor="#c0392b" />
        <PlaybookActionCard variant="compact" icon={'🍽️'} title="Post-Round Dining → Dining Dormancy Recovery" impact="$11K/mo" memberCount={98} playbookName="Dining Dormancy Recovery" buttonLabel="See Playbook" buttonColor="#ea580c" />
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

      {/* Unresolved complaints action */}
      <PlaybookActionCard
        icon={'🚨'}
        label="UNRESOLVED COMPLAINTS"
        title="16 complaints unresolved — Review & Assign"
        description="Service Speed complaints have the highest retention impact (-12%). 5 are unresolved >24hrs."
        playbookName="Service Failure Rapid Response"
        impact="$24K/mo at risk"
        memberCount={16}
        buttonLabel="Review & Assign"
        buttonColor="#dc2626"
        variant="urgent"
      />
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

      {/* Invite at-risk members action */}
      <PlaybookActionCard
        icon={'🌟'}
        title="Invite 24 Ghost + Declining members to upcoming Chef's Table"
        description="Chef's Table has 5.1x ROI. 24 disengaged members haven't attended an event in 8+ weeks. A personal invite could re-engage them."
        playbookName="Social Butterfly Event Amplifier"
        impact="$6K/mo"
        memberCount={24}
        buttonLabel="Create Invitations"
        buttonColor="#22c55e"
      />
    </div>
  );
}


function SpendPotentialTab({ archetype }) {
  const { showToast } = useApp();
  const filtered = archetype ? archetypeSpendGaps.filter((a) => a.archetype === archetype) : archetypeSpendGaps;
  const totalUntapped = filtered.reduce((sum, a) => sum + a.totalUntapped, 0);
  const totalMembers = filtered.reduce((sum, a) => sum + a.count, 0);
  const sorted = [...filtered].sort((a, b) => b.totalUntapped - a.totalUntapped);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* KPI strip */}
      <div className="grid-responsive-4">
        {[
          { label: 'Total Untapped Revenue', value: '$' + (totalUntapped / 1000).toFixed(0) + 'K/yr', color: theme.colors.success },
          { label: 'Members with Gaps', value: totalMembers, color: theme.colors.textPrimary },
          { label: 'Avg Untapped / Member', value: '$' + Math.round(totalUntapped / totalMembers).toLocaleString(), color: theme.colors.accent },
          { label: 'Top Opportunity', value: sorted[0].archetype, color: theme.colors.warning },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: '1px solid ' + theme.colors.border, padding: theme.spacing.md, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color, fontFamily: theme.fonts.mono }}>{kpi.value}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '4px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <SoWhatCallout>
        Your members have <strong>${(totalUntapped / 1000).toFixed(0)}K in untapped annual revenue</strong> across dining and events.
        Die-Hard Golfers are the biggest opportunity: 52 members spending 34% of their dining potential.
        A simple post-round dining credit could unlock <strong>$6,864/year</strong> in new F&B revenue from this segment alone.
      </SoWhatCallout>

      {/* Archetype spend gap cards */}
      {sorted.map((arch) => {
        const diningPct = arch.currentDining;
        const eventsPct = arch.currentEvents;
        return (
          <div key={arch.archetype} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, border: '1px solid ' + theme.colors.border, padding: theme.spacing.lg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
              <div>
                <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
                  {arch.archetype}
                </h3>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: '2px' }}>
                  {arch.count} members &middot; ${arch.avgAnnualSpend.toLocaleString()}/yr avg spend
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.success, fontFamily: theme.fonts.mono }}>
                  +${arch.totalUntapped.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>untapped annual revenue</div>
              </div>
            </div>

            {/* Engagement bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
              {[
                { label: 'Dining Engagement', pct: diningPct, untapped: arch.untappedDining, color: theme.colors.warning },
                { label: 'Events Engagement', pct: eventsPct, untapped: arch.untappedEvents, color: theme.colors.accent },
              ].map((bar) => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: '4px' }}>
                    <span>{bar.label}</span>
                    <span style={{ fontFamily: theme.fonts.mono, fontWeight: 600 }}>{bar.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: theme.colors.border + '40', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: bar.pct + '%', background: bar.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: '10px', color: theme.colors.success, fontWeight: 600, marginTop: '2px' }}>
                    +${bar.untapped.toLocaleString()}/yr untapped
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign recommendation with Launch button */}
            <div style={{
              padding: theme.spacing.sm + ' ' + theme.spacing.md,
              background: theme.colors.success + '08',
              border: '1px solid ' + theme.colors.success + '20',
              borderRadius: theme.radius.sm,
              fontSize: theme.fontSize.xs,
              color: theme.colors.textSecondary,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div>
                <strong style={{ color: theme.colors.success }}>Campaign:</strong> {arch.campaign}
              </div>
              <button
                onClick={() => showToast(`Campaign launched for ${arch.count} ${arch.archetype} members`, 'success')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: '#e8772e',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >Launch Campaign</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ExperienceInsights() {
  const [activeTab, setActiveTab] = useState('correlations');
  const [segment, setSegment] = useState('all');
  const [archetype, setArchetype] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={2} cardHeight={140} />;
  }

  const archetypeCount = archetype
    ? (getArchetypeProfiles().find((p) => p.archetype === archetype)?.count ?? 0)
    : null;
  const effectiveCount = archetype ? archetypeCount : SEGMENT_COUNTS[segment];

  const tabContent = {
    correlations: <CorrelationsTab segment={segment} archetype={archetype} />,
    touchpoints: <TouchpointsTab segment={segment} archetype={archetype} />,
    complaints: <ComplaintsTab />,
    events: <EventsTab />,
    spend: <SpendPotentialTab archetype={archetype} />,
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
            Which experiences drive retention — and which ones cost you members?
          </h2>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '6px 0 0' }}>
            Cross-domain correlations between touchpoints and business outcomes. Data from 6 connected systems.
          </p>
        </div>

        <FlowLink flowNum="04" persona="Chef Marco" />

        {(activeTab === 'correlations' || activeTab === 'touchpoints' || activeTab === 'spend') && (
          <>
            <SegmentFilter segment={segment} onChange={setSegment} />
            <ArchetypeFilter archetype={archetype} onChange={setArchetype} />
          </>
        )}

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
