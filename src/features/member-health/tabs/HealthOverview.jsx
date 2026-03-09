import { SoWhatCallout } from '@/components/ui';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import TrendContext from '@/components/ui/TrendContext.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, getMemberSummary } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useMemo, useState } from 'react';

// MemberRow — interactive row with hover state + expand chevron
function MemberRow({ m, isExpanded, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const riskColor = m.score < 30 ? theme.colors.urgent : theme.colors.warning;

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          cursor: 'pointer',
          background: hovered ? theme.colors.bgCardHover : 'transparent',
          transition: 'background 0.12s ease',
        }}
      >
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span style={{
            fontWeight: 600,
            color: hovered ? theme.colors.accent : theme.colors.textPrimary,
            textDecoration: hovered ? 'underline' : 'none',
            textDecorationColor: `${theme.colors.accent}50`,
            transition: 'color 0.12s ease',
          }}>
            {m.name}
          </span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span
            title="Composite health score (0–100) blending tee sheet activity, F&B spend, complaint history, email engagement, and tenure length. Lower scores = higher churn risk."
            style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: riskColor }}
          >{m.score}</span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <ArchetypeBadge archetype={m.archetype} size="xs" />
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, maxWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{m.topRisk}</span>
            <span style={{
              color: isExpanded ? theme.colors.accent : theme.colors.textMuted,
              flexShrink: 0, fontSize: '14px', fontWeight: 600,
              transition: 'transform 0.15s ease, color 0.12s ease',
              display: 'inline-block',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>›</span>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: theme.colors.bgDeep }}>
          <td colSpan={4} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md}` }}>
            <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
  const summary = getMemberSummary();
  const [expanded, setExpanded] = useState(null);
  const [sortColumn, setSortColumn] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const sortedMembers = useMemo(() => {
    const mapKey = {
      name: (m) => m.name.toLowerCase(),
      score: (m) => m.score,
      archetype: (m) => m.archetype.toLowerCase(),
      risk: (m) => m.topRisk.toLowerCase(),
    };
    const getter = mapKey[sortColumn] ?? mapKey.score;
    return [...atRisk].sort((a, b) => {
      const valA = getter(a);
      const valB = getter(b);
      if (valA === valB) return 0;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return sortDir === 'asc' ? -1 : 1;
    });
  }, [atRisk, sortColumn, sortDir]);

  const toggleSort = (column) => {
    if (sortColumn === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDir('asc');
    }
  };

  const columns = [
    { key: 'name', label: 'Member' },
    { key: 'score', label: 'Health Score' },
    { key: 'archetype', label: 'Archetype' },
    { key: 'risk', label: 'Primary Risk Signal' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Health distribution bars */}
      <div className="grid-responsive-4">
        {dist.map(d => (
          <div key={d.level} style={{ background: theme.colors.bgCard, boxShadow: theme.shadow.sm, borderRadius: theme.radius.md,
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
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {columns.map((col) => (
                <th key={col.key} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontWeight: 500 }}>
                  <button
                    onClick={() => toggleSort(col.key)}
                    style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {col.label}
                    {sortColumn === col.key && (
                      <span style={{ fontSize: '11px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                  {col.key === 'score' && (
                    <span title="Composite score (0–100) based on: visit frequency, F&B spend trends, email engagement, complaint history, tenure length, and event participation. Updated daily."
                      style={{ cursor: 'help', marginLeft: '4px', fontSize: '11px', opacity: 0.7 }}>ⓘ</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((m) => (
              <MemberRow
                key={m.memberId}
                m={m}
                isExpanded={expanded === m.memberId}
                onToggle={() => setExpanded(expanded === m.memberId ? null : m.memberId)}
              />
            ))}
          </tbody>
        </table>
        </div>
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
          { key: 'memberHealthAvg',   color: theme.colors.textPrimary, label: 'Avg Health Score' },
          { key: 'atRiskMemberCount', color: theme.colors.urgent,  label: 'At-Risk Members' },
        ]}
        format="number"
      />
    </div>
  );
}
