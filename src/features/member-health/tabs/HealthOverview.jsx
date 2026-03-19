import { SoWhatCallout, PlaybookActionCard } from '@/components/ui';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import TrendChart from '@/components/charts/TrendChart.jsx';
import { Sparkline } from '@/components/ui';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getDecayingMembers, calculateLTV, formatLTV, DEFAULT_LTV_MULTIPLIER } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';

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

// Simulated action statuses (in prod, would come from backend)
const ACTION_STATUSES = {};
function getSimulatedActionStatus(memberId, score) {
  if (ACTION_STATUSES[memberId]) return ACTION_STATUSES[memberId];
  // Simulate realistic statuses
  if (score < 25) return { status: 'Overdue', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', detail: 'GM call overdue by 3 days' };
  if (score < 35) return { status: 'Not started', color: '#b45309', bg: 'rgba(180,83,9,0.08)', detail: 'Awaiting GM outreach' };
  if (score < 42) return { status: 'Scheduled', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', detail: 'Call scheduled for tomorrow' };
  return { status: 'Not started', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', detail: 'Concierge touch recommended' };
}

// Determine if risk signal is "unusual" (complaint, specific event) vs common (generic decline)
function isUnusualSignal(risk) {
  if (!risk) return false;
  const lower = risk.toLowerCase();
  return lower.includes('complaint') || lower.includes('unresolved') || lower.includes('exact f&b minimum') ||
    lower.includes('slow-play') || lower.includes('since december') || lower.includes('since november') ||
    lower.includes('dues-only');
}

// MemberRow — redesigned: no redundant tags, action status shows progress
function MemberRow({ m, isExpanded, onToggle, isSelected, onSelect }) {
  const scoreBg = m.score >= 70 ? 'rgba(34,197,94,0.08)' : m.score >= 50 ? 'rgba(234,179,8,0.08)' : m.score >= 30 ? 'rgba(234,88,12,0.08)' : 'rgba(185,28,28,0.08)';
  const scoreColor = m.score >= 70 ? '#16a34a' : m.score >= 50 ? '#ca8a04' : m.score >= 30 ? '#ea580c' : '#b91c1c';
  const riskPrimary = summarizeRisk(m.topRisk) || m.topRisk || '';
  const channel = archetypeChannel[m.archetype] ?? (m.score < 40 ? 'GM call' : 'Concierge touch');
  const actionProgress = getSimulatedActionStatus(m.memberId, m.score);
  const unusual = isUnusualSignal(m.topRisk);

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseOver={(e) => { e.currentTarget.style.background = '#f5f5ff'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(37,99,235,0.04)' : '#fff'; }}
        style={{
          background: isSelected ? 'rgba(37,99,235,0.04)' : '#fff',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {/* Checkbox */}
        <td style={{ padding: '10px 8px 10px 14px', verticalAlign: 'middle', width: 36 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onClick={(e) => { e.stopPropagation(); onSelect(m.memberId); }}
            onChange={() => {}}
            style={{ cursor: 'pointer', accentColor: '#2563eb' }}
          />
        </td>
        {/* Member name */}
        <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
          <MemberLink
            mode="drawer"
            memberId={m.memberId}
            style={{
              background: 'none', border: 'none', color: '#2563eb',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              padding: 0, textAlign: 'left', textDecoration: 'none',
            }}
          >{m.name}</MemberLink>
        </td>
        {/* Score */}
        <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: '32px', padding: '3px 8px', borderRadius: '8px',
            background: scoreBg, color: scoreColor,
            fontWeight: 700, fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
          }} title="Composite health score (0-100)">{m.score}</span>
        </td>
        {/* Archetype + Channel */}
        <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '12px', color: '#3f3f46', fontWeight: 500 }}>{m.archetype}</span>
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>{channel}</span>
          </div>
        </td>
        {/* Risk Signal */}
        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
          <span style={{
            color: unusual ? '#b91c1c' : '#3f3f46',
            fontSize: '12px', lineHeight: 1.5,
            fontWeight: unusual ? 600 : 400,
          }}>{unusual ? '\u26A0 ' : ''}{riskPrimary}</span>
        </td>
        {/* Action Status (progress, not redundant signal) */}
        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
              background: actionProgress.bg, color: actionProgress.color,
              whiteSpace: 'nowrap',
            }}>{actionProgress.status}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>{actionProgress.detail}</div>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: theme.colors.bgDeep }}>
          <td colSpan={6} style={{ padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.md}` }}>
            <QuickActions memberName={m.name} memberId={m.memberId} context={m.topRisk} archetype={m.archetype} />
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
  const watchList = getWatchMembers();
  const decaying = getDecayingMembers();
  const [expanded, setExpanded] = useState(null);
  const [showWatch, setShowWatch] = useState(false);

  // First Domino: members with email open rate < 20% (jan field is 0-1 decimal)
  const firstDominoMembers = useMemo(() => {
    return (decaying ?? [])
      .filter((m) => m.jan != null && m.jan < 0.20)
      .map((m) => {
        const atRiskMatch = atRisk.find((a) => a.memberId === m.memberId);
        return {
          ...m,
          archetype: m.archetype ?? atRiskMatch?.archetype ?? 'Unknown',
          novPct: Math.round((m.nov ?? 0) * 100),
          decPct: Math.round((m.dec ?? 0) * 100),
          janPct: Math.round((m.jan ?? 0) * 100),
          sparkline: [Math.round((m.nov ?? 0) * 100), Math.round((m.dec ?? 0) * 100), Math.round((m.jan ?? 0) * 100)],
        };
      });
  }, [decaying, atRisk]);
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

  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [showAtRisk, setShowAtRisk] = useState(true);
  const { showToast } = useApp();

  const criticalMembers = useMemo(() => sortedMembers.filter(m => m.score < 35), [sortedMembers]);
  const atRiskOnly = useMemo(() => sortedMembers.filter(m => m.score >= 35), [sortedMembers]);

  // Aggregate common risk patterns
  const riskPatterns = useMemo(() => {
    const patterns = {};
    sortedMembers.forEach(m => {
      const risk = m.topRisk?.toLowerCase() || '';
      if (risk.includes('zero') && risk.includes('golf')) patterns.zeroGolf = (patterns.zeroGolf || 0) + 1;
      if (risk.includes('complaint') || risk.includes('unresolved')) patterns.complaints = (patterns.complaints || 0) + 1;
      if (risk.includes('dining') || risk.includes('f&b')) patterns.dining = (patterns.dining || 0) + 1;
      if (risk.includes('email') || risk.includes('decay')) patterns.email = (patterns.email || 0) + 1;
    });
    return patterns;
  }, [sortedMembers]);

  const toggleSelect = (id) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = (members) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      const allSelected = members.every(m => next.has(m.memberId));
      members.forEach(m => allSelected ? next.delete(m.memberId) : next.add(m.memberId));
      return next;
    });
  };

  const columns = [
    { key: 'checkbox', label: '', sortable: false },
    { key: 'name', label: 'Member' },
    { key: 'score', label: 'Score' },
    { key: 'archetype', label: 'Archetype / Channel' },
    { key: 'risk', label: 'Risk Signal' },
    { key: 'action', label: 'Action Status', sortable: false },
  ];

  const renderTable = (members, tier) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
        <thead>
          <tr style={{ background: theme.colors.bg }}>
            {columns.map((col) => (
              <th key={col.key} style={{
                padding: `${theme.spacing.sm} ${col.key === 'checkbox' ? '8px' : theme.spacing.md}`,
                textAlign: 'left', color: theme.colors.textMuted, fontSize: theme.fontSize.xs,
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500,
                width: col.key === 'checkbox' ? 36 : col.key === 'score' ? 70 : 'auto',
              }}>
                {col.key === 'checkbox' ? (
                  <input type="checkbox" onChange={() => selectAll(members)}
                    checked={members.length > 0 && members.every(m => selectedMembers.has(m.memberId))}
                    style={{ cursor: 'pointer', accentColor: '#2563eb' }} />
                ) : col.sortable === false ? (
                  <span>{col.label}</span>
                ) : (
                  <button onClick={() => toggleSort(col.key)}
                    style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {sortColumn === col.key && <span style={{ fontSize: '11px' }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>}
                  </button>
                )}
                {col.key === 'score' && (
                  <span title="Composite score (0-100)" style={{ cursor: 'help', marginLeft: '4px', fontSize: '11px', opacity: 0.7 }}>{'\u24D8'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <MemberRow key={m.memberId} m={m}
              isExpanded={expanded === m.memberId}
              onToggle={() => setExpanded(expanded === m.memberId ? null : m.memberId)}
              isSelected={selectedMembers.has(m.memberId)}
              onSelect={toggleSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* First Domino Alert */}
      {firstDominoMembers.length > 0 && (
        <div style={{
          background: 'rgba(220,38,38,0.03)',
          borderLeft: `4px solid ${theme.colors.urgent}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
                🚨 First Domino Alert — {firstDominoMembers.length} members showing earliest decay signal
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                Email engagement declined while golf and dining remain normal. This is the 6–8 week early warning window before visible disengagement.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {firstDominoMembers.map((m) => (
              <div key={m.memberId ?? m.name} style={{
                display: 'grid', gridTemplateColumns: '1.2fr 80px 1.5fr 1fr',
                gap: theme.spacing.sm, alignItems: 'center',
                padding: '6px 8px', background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
                fontSize: theme.fontSize.xs,
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{m.name}</span>
                  <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{m.archetype}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28, width: 64 }}>
                  {[m.novPct, m.decPct, m.janPct].map((pct, i) => {
                    const maxPct = Math.max(m.novPct, m.decPct, m.janPct, 1);
                    const scaled = Math.max(3, Math.round((pct / maxPct) * 100));
                    return (
                      <div key={i} style={{
                        width: 18,
                        height: `${scaled}%`,
                        background: i === 2 ? theme.colors.urgent : i === 1 ? theme.colors.warning : theme.colors.success,
                        borderRadius: 2,
                        transition: 'height 0.3s ease',
                      }} />
                    );
                  })}
                </div>
                <div style={{ color: theme.colors.textSecondary }}>
                  Open rate: {m.novPct}% → {m.decPct}% → <strong style={{ color: theme.colors.urgent }}>{m.janPct}%</strong>
                </div>
                <div style={{ color: theme.colors.info, fontWeight: 600, fontSize: 11 }}>
                  Week 1: Personal check-in call
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Churn Anatomy */}
      <ChurnDecaySequence />

      {/* Risk pattern summary */}
      {(riskPatterns.zeroGolf > 2 || riskPatterns.complaints > 0) && (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 16px',
          background: '#fafafa', borderRadius: 10, border: '1px solid #e4e4e7',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#3f3f46' }}>Common patterns:</span>
          {riskPatterns.zeroGolf > 2 && (
            <span style={{ fontSize: 11, color: '#6b7280', background: '#f4f4f5', padding: '2px 8px', borderRadius: 4 }}>
              {riskPatterns.zeroGolf} members with zero golf activity
            </span>
          )}
          {riskPatterns.dining > 0 && (
            <span style={{ fontSize: 11, color: '#6b7280', background: '#f4f4f5', padding: '2px 8px', borderRadius: 4 }}>
              {riskPatterns.dining} with dining decline
            </span>
          )}
          {riskPatterns.complaints > 0 && (
            <span style={{ fontSize: 11, color: '#dc2626', background: 'rgba(220,38,38,0.06)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              {'\u26A0'} {riskPatterns.complaints} with unresolved complaints
            </span>
          )}
        </div>
      )}

      {/* Bulk action bar (when members selected) */}
      {selectedMembers.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', background: 'rgba(37,99,235,0.04)',
          border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
            {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { showToast(`Personal notes drafted for ${selectedMembers.size} members`, 'success'); setSelectedMembers(new Set()); }}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#e8772e', color: 'white' }}>
              Draft personal notes
            </button>
            <button onClick={() => { showToast(`Calls scheduled for ${selectedMembers.size} members`, 'success'); setSelectedMembers(new Set()); }}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #d4d4d8', background: 'white', color: '#3f3f46' }}>
              Schedule calls
            </button>
            <button onClick={() => setSelectedMembers(new Set())}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'transparent', color: '#6b7280' }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* CRITICAL section — always visible */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.urgent}40`, overflow: 'hidden' }}>
        <div style={{
          padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(185,28,28,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
              background: 'rgba(185,28,28,0.1)', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '1px',
            }}>Critical</span>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
              {criticalMembers.length} members require immediate outreach
            </span>
          </div>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent }} title={atRiskDuesDisplay.full}>
            {atRiskDuesDisplay.compact} total at risk
          </span>
        </div>

        {/* Action escalation guide */}
        <div style={{
          padding: '8px 16px', background: '#fefce8', borderBottom: '1px solid #fef3c7',
          display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#92400e',
        }}>
          <span style={{ fontWeight: 600 }}>Action channel guide:</span>
          <span>Score &lt;30 = <strong>GM call</strong></span>
          <span>Score 30-39 = <strong>Outreach this week</strong></span>
          <span>Weekend Warrior = <strong>Pro shop call</strong></span>
          <span>Social Member = <strong>Concierge text</strong></span>
        </div>

        {renderTable(criticalMembers, 'critical')}
      </div>

      {/* AT RISK section — collapsible */}
      <div style={{ background: theme.colors.bgDeep, borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.warning}30`, overflow: 'hidden' }}>
        <div
          onClick={() => setShowAtRisk(!showAtRisk)}
          style={{
            padding: theme.spacing.md, borderBottom: showAtRisk ? `1px solid ${theme.colors.border}` : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
              background: 'rgba(234,88,12,0.1)', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px',
            }}>At Risk</span>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
              {atRiskOnly.length} members trending down
            </span>
          </div>
          <span style={{ fontSize: 14, color: '#6b7280', transition: 'transform 0.2s', transform: showAtRisk ? 'rotate(180deg)' : 'rotate(0)' }}>{'\u25BC'}</span>
        </div>
        {showAtRisk && renderTable(atRiskOnly, 'at-risk')}
      </div>

      {/* Watch tier members */}
      {watchList.length > 0 && (
        <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, overflow: 'hidden', background: theme.colors.bgCard }}>
          <div
            onClick={() => setShowWatch(!showWatch)}
            style={{
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: theme.spacing.md, borderBottom: showWatch ? `1px solid ${theme.colors.border}` : 'none',
              background: `${theme.colors.warning}06`,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>
                Watch List — {watchList.length} members need monitoring
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                Subtle signals detected before full risk. Low-intensity actions recommended.
              </div>
            </div>
            <span style={{ fontSize: 14, color: '#6b7280', transition: 'transform 0.2s', transform: showWatch ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </div>
          {showWatch && (
            <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {watchList.map((m) => (
                <div key={m.memberId} style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr',
                  gap: theme.spacing.sm, alignItems: 'center',
                  padding: '8px 10px', border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm, background: theme.colors.bgCard,
                  fontSize: theme.fontSize.xs,
                }}>
                  <div>
                    <MemberLink memberId={m.memberId} style={{ fontWeight: 700, fontSize: theme.fontSize.xs }}>{m.name}</MemberLink>
                    <div style={{ color: theme.colors.textMuted, fontSize: 11 }}>{m.archetype}</div>
                  </div>
                  <div style={{ color: theme.colors.textSecondary }}>{m.signal}</div>
                  <div style={{ color: theme.colors.warning, fontWeight: 600 }}>Score {m.score}</div>
                  <div style={{ color: theme.colors.info, fontWeight: 500 }}>{m.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single consolidated CTA */}
      <div style={{
        background: 'rgba(220,38,38,0.03)', borderLeft: '4px solid #dc2626',
        borderRadius: 10, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f', marginBottom: 2 }}>
            Call the top {Math.min(3, criticalMembers.length)} Critical members before end of business today
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Each saved member protects $18K+ in annual dues. {atRiskDuesDisplay.ltvCompact} lifetime value at stake.
          </div>
        </div>
        <button
          onClick={() => showToast('Outreach sequence started for Critical members', 'success')}
          style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', border: 'none', background: '#dc2626', color: 'white',
            whiteSpace: 'nowrap',
          }}
        >Start Outreach Sequence</button>
      </div>

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
