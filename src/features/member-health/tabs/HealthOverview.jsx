import { SoWhatCallout } from '@/components/ui';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import TrendContext from '@/components/ui/TrendContext.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, getMemberSummary } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useState } from 'react';

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
  const summary = getMemberSummary();
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Health distribution bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md }}>
        {dist.map(d => (
          <div key={d.level} style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
            border: `1px solid ${d.color}40`, padding: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.level}</span>
              <span style={{ fontSize: theme.fontSize.xs, color: d.color }}>
                {(d.percentage * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono,
              fontWeight: 700, color: d.color }}>{d.count}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>members</div>
            <div style={{ height: 4, background: theme.colors.border, borderRadius: 2, marginTop: theme.spacing.sm }}>
              <div style={{ height: '100%', background: d.color, borderRadius: 2,
                width: `${d.percentage * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* At-risk member table */}
      <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.urgent}30`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            At Risk & Critical Members
          </span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent }}>
            ${(summary.potentialDuesAtRisk / 1000).toFixed(0)}K dues at risk
          </span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {['Member', 'Health Score', 'Archetype', 'Primary Risk Signal'].map(h => (
                <th key={h} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atRisk.map((m, i) => (
              <>
                <tr key={i} style={{ borderTop: `1px solid ${theme.colors.border}`, cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === m.memberId ? null : m.memberId)}>
                  <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textPrimary, fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
                    <span style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: m.score < 30 ? theme.colors.urgent : theme.colors.warning }}>{m.score}</span>
                  </td>
                  <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
                    <ArchetypeBadge archetype={m.archetype} size="xs" />
                  </td>
                  <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, color: theme.colors.textMuted, fontSize: theme.fontSize.xs, maxWidth: 260 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{m.topRisk}</span>
                      <span style={{ color: theme.colors.textMuted, flexShrink: 0 }}>{expanded === m.memberId ? '▲' : '▼'}</span>
                    </div>
                  </td>
                </tr>
                {expanded === m.memberId && (
                  <tr key={`${i}-expand`} style={{ background: theme.colors.bgDeep }}>
                    <td colSpan={4} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md}` }}>
                      <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout variant="warning">
        <strong>{summary.riskCount} members</strong> are At Risk or Critical —
        representing <strong>${(summary.potentialDuesAtRisk / 1000).toFixed(0)}K</strong> in annual dues.
        James Whitfield is the most urgent: an unresolved service complaint is the only thing standing between
        an active member and a resignation that should never happen. Tap his name to take action.
      </SoWhatCallout>

      {/* Full trend chart #3 — 6-month member health trajectory */}
      <TrendChart
        title="Member Health Trend — avg score + at-risk count"
        seriesKeys={[
          { key: 'memberHealthAvg',   color: theme.colors.members, label: 'Avg Health Score' },
          { key: 'atRiskMemberCount', color: theme.colors.urgent,  label: 'At-Risk Members' },
        ]}
        format="number"
      />
    </div>
  );
}
