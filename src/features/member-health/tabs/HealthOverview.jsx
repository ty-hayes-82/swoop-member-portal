import { SoWhatCallout } from '@/components/ui';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { getHealthDistribution, getAtRiskMembers, calculateLTV, formatLTV, DEFAULT_LTV_MULTIPLIER } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useMemo, useState } from 'react';

const fullCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const formatFullCurrency = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? fullCurrencyFormatter.format(amount) : '—';
};

const formatCompactCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const digits = millions >= 10 ? 1 : 2;
    return `$${millions.toFixed(digits)}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    const digits = thousands >= 10 ? 0 : 1;
    return `$${thousands.toFixed(digits)}K`;
  }
  return formatFullCurrency(amount);
};

const levelDescriptions = {
  Healthy: 'are actively engaged across the club',
  Watch: 'need monitoring before small issues appear',
  'At Risk': 'are at risk of disengaging',
  Critical: 'require immediate outreach',
};

const archetypeChannel = {
  'Social Member': 'Concierge text',
  'Weekend Warrior': 'Pro shop call',
  'Family Champion': 'Family invite',
  'Executive Stakeholder': 'GM call',
};

const summarizeRisk = (signal) => {
  if (!signal) return '';
  const primary = signal.split('•')[0].split('—')[0].trim();
  if (!primary) return '';
  return primary.charAt(0).toUpperCase() + primary.slice(1);
};

const getActionStatus = (member) => {
  const numeric = Number(member?.score);
  const defaultStatus = !Number.isFinite(numeric)
    ? { label: 'Needs review', color: theme.colors.textMuted, background: theme.colors.border + '40', description: 'Score unavailable — verify data.' }
    : numeric < 30
    ? { label: 'Call today', color: theme.colors.urgent, background: theme.colors.urgent + '16', description: 'Critical member. Immediate outreach required.' }
    : numeric < 40
    ? { label: 'Outreach this week', color: theme.colors.warning, background: theme.colors.warning + '16', description: 'At-risk member. Schedule a personal touch within 5 days.' }
    : numeric < 50
    ? { label: 'Watch list', color: theme.colors.info, background: theme.colors.info + '16', description: 'Trending down — keep on radar and verify staff touches.' }
    : { label: 'Monitoring', color: theme.colors.textMuted, background: theme.colors.border + '30', description: 'Healthy member — no action required today.' };

  const channel = archetypeChannel[member?.archetype] ?? (numeric < 40 ? 'GM call' : 'Concierge touch');
  const riskSummary = summarizeRisk(member?.topRisk);

  return {
    ...defaultStatus,
    label: riskSummary ? `${channel} · ${riskSummary}` : `${channel} · ${defaultStatus.label}`,
    description: `${defaultStatus.description} ${riskSummary ? `Primary signal: ${riskSummary}.` : ''}`.trim(),
  };
};

// MemberRow — interactive row with hover state + expand chevron
function MemberRow({ m, isExpanded, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const riskColor = m.score < 30 ? theme.colors.urgent : theme.colors.warning;
  const actionStatus = getActionStatus(m);

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
          <MemberLink
            mode="drawer"
            memberId={m.memberId}
            style={{
              fontWeight: 600,
              color: hovered ? theme.colors.accent : theme.colors.textPrimary,
              textDecoration: hovered ? 'underline' : 'none',
              textDecorationColor: `${theme.colors.accent}50`,
              transition: 'color 0.12s ease',
            }}
          >
            {m.name}
          </MemberLink>
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
            {m.score < 50 && (
              <span style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                {m.topRisk?.toLowerCase().includes('round') || m.topRisk?.toLowerCase().includes('visit') || m.topRisk?.toLowerCase().includes('golf') || m.score < 35 ? (
                  <span title="Rounds declining" style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: theme.colors.urgent + '20', color: theme.colors.urgent, fontWeight: 700 }}>Rounds ↓</span>
                ) : null}
                {m.topRisk?.toLowerCase().includes('dining') || m.topRisk?.toLowerCase().includes('f&b') || m.topRisk?.toLowerCase().includes('spend') || m.score < 40 ? (
                  <span title="Dining declining" style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: theme.colors.warning + '20', color: theme.colors.warning, fontWeight: 700 }}>Dining ↓</span>
                ) : null}
                {m.topRisk?.toLowerCase().includes('email') || m.topRisk?.toLowerCase().includes('engagement') || m.topRisk?.toLowerCase().includes('interaction') ? (
                  <span title="Email engagement declining" style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: theme.colors.accent + '20', color: theme.colors.accent, fontWeight: 700 }}>Email ↓</span>
                ) : null}
              </span>
            )}
            <span style={{
              color: isExpanded ? theme.colors.accent : theme.colors.textMuted,
              flexShrink: 0, fontSize: '14px', fontWeight: 600,
              transition: 'transform 0.15s ease, color 0.12s ease',
              display: 'inline-block',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>›</span>
          </div>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span
            title={actionStatus.description}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: theme.fontSize.xs,
              fontWeight: 600,
              color: actionStatus.color,
              background: actionStatus.background,
            }}
          >
            {actionStatus.label}
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: theme.colors.bgDeep }}>
          <td colSpan={5} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md}` }}>
            <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk} />
          </td>
        </tr>
      )}
    </>
  );
}


// Churn Anatomy — average decay sequence with timing data
function ChurnDecaySequence() {
  const stages = [
    { domain: 'Email', icon: '✉', label: 'Email engagement drops', avgWeeks: 0, detail: 'Open rates fall below 15%. First detectable signal.', color: theme.colors.accent },
    { domain: 'Golf', icon: '⛳', label: 'Round frequency declines', avgWeeks: 3, detail: 'From 3+ rounds/month to <1. Cancellations rise.', color: theme.colors.success },
    { domain: 'Dining', icon: '🍽', label: 'F&B visits cease', avgWeeks: 5, detail: 'Post-round dining stops. Grill Room visits drop to zero.', color: theme.colors.warning },
    { domain: 'Events', icon: '🎉', label: 'Event participation ends', avgWeeks: 6, detail: 'No RSVPs, no attendance. Social ties severed.', color: theme.colors.info || theme.colors.accent },
    { domain: 'Resign', icon: '🚪', label: 'Resignation submitted', avgWeeks: 8, detail: 'Average 6–8 weeks from first email decay signal.', color: theme.colors.urgent },
  ];

  const totalWeeks = stages[stages.length - 1].avgWeeks;

  return (
    <div style={{
      background: theme.colors.bgCard,
      borderRadius: theme.radius.lg,
      border: '1px solid ' + theme.colors.border,
      padding: theme.spacing.lg,
      boxShadow: theme.shadow.sm,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Churn Anatomy
          </div>
          <h3 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, margin: 0, lineHeight: 1.3 }}>
            The Resignation Sequence
          </h3>
          <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
            Average decay timeline from first signal to resignation. Based on 11 resignations over the past 12 months.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: theme.colors.urgent, fontFamily: theme.fonts.mono }}>6–8</div>
          <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>weeks to act</div>
        </div>
      </div>

      {/* Timeline visualization */}
      <div style={{ position: 'relative', padding: '16px 0 8px' }}>
        {/* Progress bar background */}
        <div style={{ position: 'absolute', top: '28px', left: '20px', right: '20px', height: '4px', background: theme.colors.border, borderRadius: '2px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, ' + theme.colors.accent + ', ' + theme.colors.warning + ', ' + theme.colors.urgent + ')', borderRadius: '2px', opacity: 0.6 }} />
        </div>

        {/* Stage nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {stages.map((stage, i) => (
            <div key={stage.domain} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              {/* Node circle */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: stage.color + '18',
                border: '2.5px solid ' + stage.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', zIndex: 1, position: 'relative',
              }}>
                {stage.icon}
              </div>

              {/* Week label */}
              <div style={{
                fontSize: '11px', fontWeight: 700, color: stage.color,
                fontFamily: theme.fonts.mono, marginTop: '8px',
              }}>
                {stage.avgWeeks === 0 ? 'Week 0' : 'Week ' + stage.avgWeeks}
              </div>

              {/* Domain label */}
              <div style={{
                fontSize: theme.fontSize.xs, fontWeight: 600,
                color: theme.colors.textPrimary, marginTop: '4px', textAlign: 'center',
              }}>
                {stage.domain}
              </div>

              {/* Detail text */}
              <div style={{
                fontSize: '10px', color: theme.colors.textMuted,
                textAlign: 'center', marginTop: '2px', lineHeight: 1.4,
                maxWidth: '120px',
              }}>
                {stage.detail}
              </div>

              {/* Arrow between nodes */}
              {i < stages.length - 1 && (
                <div style={{
                  position: 'absolute', top: '12px', right: '-50%',
                  fontSize: '14px', color: theme.colors.textMuted + '60',
                  zIndex: 0,
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intervention window callout */}
      <div style={{
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        background: theme.colors.success + '0A',
        border: '1px solid ' + theme.colors.success + '30',
        borderRadius: theme.radius.md,
        display: 'flex', alignItems: 'center', gap: theme.spacing.md,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: theme.colors.success + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>
          ✅
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.success, marginBottom: '2px' }}>
            Swoop detects at Week 0 — you have 6–8 weeks to intervene
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
            In 9 of 11 resignations this year, email decay was the first domino. Swoop monitors this signal daily and alerts you before golf or dining metrics even begin to decline. The GM personal call at Week 1 has a 95% retention success rate.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
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

  const atRiskDuesDisplay = useMemo(() => {
    const dues = atRisk
      .map((member) => Number(member?.duesAnnual))
      .filter((value) => Number.isFinite(value));
    if (!dues.length || dues.length !== atRisk.length) {
      return { compact: '—', full: '—' };
    }
    const total = dues.reduce((sum, value) => sum + value, 0);
    const ltv = total * DEFAULT_LTV_MULTIPLIER;
    const ltvCompact = formatCompactCurrency(ltv);
    return { compact: formatCompactCurrency(total), full: formatFullCurrency(total), ltvCompact, ltvFull: formatFullCurrency(ltv) };
  }, [atRisk]);

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
    { key: 'action', label: 'Action Status', sortable: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Health distribution bars */}
      <div className="grid-responsive-4">
        {dist.map((d) => {
          const delta = Number.isFinite(d?.delta) ? d.delta : 0;
          const descriptor = levelDescriptions[d.level] ?? 'are in this state';
          const deltaColor = delta > 0 ? theme.colors.urgent : delta < 0 ? theme.colors.success : theme.colors.textMuted;
          const deltaCopy = delta === 0
            ? 'same as last month.'
            : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than last month.`;
          return (
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
              <div style={{ marginTop: theme.spacing.sm, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
                <strong>{d.count} members</strong> {descriptor} —{' '}
                <span style={{ color: deltaColor }}>{deltaCopy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Churn Anatomy — decay sequence visualization */}
      <ChurnDecaySequence />

      {/* At-risk member table */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.urgent}30`, overflow: 'hidden' }}>
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            At Risk & Critical Members
          </span>
          <span
            style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent }}
            title={atRiskDuesDisplay.full}
          >
            {atRiskDuesDisplay.compact} dues at risk — {atRiskDuesDisplay.ltvCompact} lifetime value at stake
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: theme.fontSize.sm, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: theme.colors.bg }}>
              {columns.map((col) => (
                <th key={col.key} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'left',
                  color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontWeight: 500 }}>
                  {col.sortable === false ? (
                    <span>{col.label}</span>
                  ) : (
                    <button
                      onClick={() => toggleSort(col.key)}
                      style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {col.label}
                      {sortColumn === col.key && (
                        <span style={{ fontSize: '11px' }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  )}
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
        <strong>{atRisk.length} members</strong> are At Risk or Critical —
        representing <strong title={atRiskDuesDisplay.full}>
          {atRiskDuesDisplay.compact}
        </strong> in annual dues.
        James Whitfield is the most urgent: an unresolved service complaint is the only thing standing between
        an active member and a resignation that should never happen. Tap his name to take action.
      </SoWhatCallout>

      {/* Full trend chart #3 — 6-month member health trajectory */}
      <TrendChart
        title="Member Health Trend — avg score + at-risk count"
        subtitle="6–8 week outlook drives intervention timing"
        seriesKeys={[
          { key: 'memberHealthAvg',   color: theme.colors.textPrimary, label: 'Avg Health Score' },
          { key: 'atRiskMemberCount', color: theme.colors.urgent,  label: 'At-Risk Members' },
        ]}
        format="number"
      />
    </div>
  );
}
