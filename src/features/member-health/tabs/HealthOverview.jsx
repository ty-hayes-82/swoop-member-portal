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
  const actionStatus = getActionStatus(m);

  const scoreBg = m.score >= 70 ? 'rgba(34,197,94,0.08)' : m.score >= 50 ? 'rgba(234,179,8,0.08)' : m.score >= 30 ? 'rgba(234,88,12,0.08)' : 'rgba(185,28,28,0.08)';
  const scoreColor = m.score >= 70 ? '#16a34a' : m.score >= 50 ? '#ca8a04' : m.score >= 30 ? '#ea580c' : '#b91c1c';
  const archetypeLabel = m.archetype ? ('★' + m.archetype) : '';
  const riskPrimary = summarizeRisk(m.topRisk) || m.topRisk || '';
  const channel = archetypeChannel[m.archetype] ?? (m.score < 40 ? 'GM call' : 'Concierge touch');

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseOver={(e) => { e.currentTarget.style.background = '#f5f5ff'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; }}
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
          <MemberLink
            mode="drawer"
            memberId={m.memberId}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              textDecoration: 'none',
            }}
          >
            {m.name}
          </MemberLink>
        </td>
        <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '32px',
            padding: '3px 8px',
            borderRadius: '8px',
            background: scoreBg,
            color: scoreColor,
            fontWeight: 700,
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
            title="Composite health score (0-100)"
          >
            {m.score}
          </span>
        </td>
        <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
            {archetypeLabel}
          </span>
        </td>
        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: '#3f3f46', fontSize: '12px', lineHeight: 1.5 }}>
              {riskPrimary}
            </span>
            {m.score < 50 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(m.topRisk?.toLowerCase().includes('round') || m.topRisk?.toLowerCase().includes('visit') || m.topRisk?.toLowerCase().includes('golf') || m.score < 35) && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(185,28,28,0.08)', color: '#b91c1c', fontWeight: 600, whiteSpace: 'nowrap' }}>Rounds ↓</span>
                )}
                {(m.topRisk?.toLowerCase().includes('dining') || m.topRisk?.toLowerCase().includes('f&b') || m.topRisk?.toLowerCase().includes('spend') || m.score < 40) && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(180,83,9,0.08)', color: '#b45309', fontWeight: 600, whiteSpace: 'nowrap' }}>Dining ↓</span>
                )}
                {(m.topRisk?.toLowerCase().includes('email') || m.topRisk?.toLowerCase().includes('engagement') || m.topRisk?.toLowerCase().includes('interaction')) && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(37,99,235,0.08)', color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap' }}>Email ↓</span>
                )}
              </div>
            )}
          </div>
        </td>
        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>{channel}</span>
            <span style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.3 }}>{riskPrimary}</span>
          </div>
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
    { domain: 'Email', icon: '\u2709\uFE0F', weeks: 0, detail: 'Open rates fall below 15%. First detectable signal.', border: '#f59e0b', shadow: 'rgba(245,158,11,0.2)' },
    { domain: 'Golf', icon: '\u26f3', weeks: 3, detail: 'From 3+ rounds/month to <1. Cancellations rise.', border: '#ea580c', shadow: 'rgba(234,88,12,0.2)' },
    { domain: 'Dining', icon: '🍽️', weeks: 5, detail: 'Post-round dining stops. Grill Room visits drop to zero.', border: '#dc2626', shadow: 'rgba(220,38,38,0.2)' },
    { domain: 'Events', icon: '🎉', weeks: 6, detail: 'No RSVPs, no attendance. Social ties severed.', border: '#b91c1c', shadow: 'rgba(185,28,28,0.2)' },
    { domain: 'Resign', icon: '🚪', weeks: 8, detail: 'Average 6\u20138 weeks from first email decay signal.', border: '#7f1d1d', shadow: 'rgba(127,29,29,0.3)', filled: true },
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e4e4e7',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>
            Churn Anatomy
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f0f0f', margin: 0, lineHeight: 1.3 }}>
            The Resignation Sequence
          </h3>
          <p style={{ fontSize: '12px', color: '#71717a', margin: '6px 0 0' }}>
            Average decay timeline from first signal to resignation. Based on 11 resignations over the past 12 months.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#b91c1c', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>6–8</div>
          <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>weeks to act</div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', padding: 0 }}>
        {/* Track line */}
        <div style={{ position: 'absolute', top: '24px', left: '48px', right: '48px', height: '3px', background: '#e4e4e7', borderRadius: '2px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, #f9a825, #ef6c00, #c62828)', borderRadius: '2px' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {stages.map((stage) => (
            <div key={stage.domain} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: stage.filled ? stage.border : '#fff',
                border: `3px solid ${stage.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', zIndex: 1,
                boxShadow: `0 2px 8px ${stage.shadow}`,
              }}>
                {stage.filled
                  ? <span style={{ filter: 'brightness(0) invert(1)', fontSize: '20px' }}>{stage.icon}</span>
                  : stage.icon
                }
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: stage.border, marginTop: '10px' }}>
                Week {stage.weeks}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#18181b', marginTop: '4px' }}>
                {stage.domain}
              </div>
              <div style={{ fontSize: '10px', color: '#71717a', textAlign: 'center', marginTop: '3px', lineHeight: 1.4, maxWidth: '120px' }}>
                {stage.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Callout */}
      <div style={{
        marginTop: '28px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
        }}>
          {'\u2705'}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginBottom: '4px' }}>
            Swoop detects at Week 0 — you have 6–8 weeks to intervene
          </div>
          <div style={{ fontSize: '12px', color: '#3f3f46', lineHeight: 1.6 }}>
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
