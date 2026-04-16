import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { getOutreachHistory, trackAction } from '@/services/activityService';

import { getMemberChurnPrediction } from '@/services/memberService';
import { getMemberSaves } from '@/services/boardReportService';
import { isGateOpen } from '@/services/demoGate';
import MemberDecayChain from './MemberDecayChain.jsx';
import { MemberEngagementTimeline } from '@/components/insights/DeepInsightWidgets';
import AgentUpsell from '@/components/ui/AgentUpsell.jsx';
import { formatDate, formatDateTime } from '../../utils/dateFormat';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      if (typeof window === 'undefined') return;
      setIsMobile(window.matchMedia('(max-width: 720px)').matches);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const Sparkline = ({ data = [], color = '#06b6d4' }) => {
  if (!data.length) return <span className="text-xs text-swoop-text-label">No trend data</span>;
  const width = 160;
  const height = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data
    .map((value, idx) => {
      const x = idx * step;
      const y = height - ((value - min) / span) * height;
      return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

const PILL_STYLES = {
  neutral: { background: 'rgba(148, 163, 184, 0.12)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.25)' },
  warn:    { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' },
  amber:   { background: 'rgba(243, 146, 45, 0.14)', color: '#fdba74', border: '1px solid rgba(243, 146, 45, 0.3)' },
  danger:  { background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' },
  success: { background: 'rgba(18, 183, 106, 0.12)', color: '#86efac', border: '1px solid rgba(18, 183, 106, 0.3)' },
};

export const SwPill = ({ variant = 'neutral', children }) => (
  <span
    style={{
      ...PILL_STYLES[variant],
      display: 'inline-block',
      fontSize: '10px',
      fontWeight: 600,
      lineHeight: 1.4,
      padding: '1px 6px',
      borderRadius: '999px',
      whiteSpace: 'nowrap',
      marginRight: '4px',
    }}
  >
    {children}
  </span>
);

const Section = ({
  title,
  description,
  children,
  defaultCollapsed = true,
  collapsible = true,
  preview,
  sourceSystems,
  ...rest
}) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <section {...rest} className="border border-swoop-border rounded-xl p-4 bg-swoop-panel" style={{ padding: '10px 12px', borderRadius: '10px' }}>
      <div
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-2'} ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ fontSize: '12px', lineHeight: 1.4, gap: '6px' }}
      >
        <div className="flex items-baseline gap-2 shrink-0" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
          <h3 className="m-0 text-base text-swoop-text" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em' }}>{title}</h3>
        </div>
        {isCollapsed && preview && (
          <div className="flex items-center flex-wrap min-w-0" style={{ gap: '2px', flex: '1 1 auto', justifyContent: 'flex-start', marginLeft: '6px', overflow: 'hidden' }}>
            {preview}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0 ml-auto" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
          {description && <span className="text-xs text-swoop-text-label hidden sm:inline" style={{ fontSize: '10px', lineHeight: 1.4 }}>{description}</span>}
          {collapsible && (
            <span
              className="text-swoop-text-label"
              style={{
                display: 'inline-block',
                fontSize: '14px',
                lineHeight: 1,
                transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.15s ease',
              }}
            >
              {'\u203A'}
            </span>
          )}
        </div>
      </div>
      {!isCollapsed && Array.isArray(sourceSystems) && sourceSystems.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1.5">
          {sourceSystems.map(s => (
            <SourceBadge key={s} system={s} size="xs" />
          ))}
        </div>
      )}
      {!isCollapsed && children}
    </section>
  );
};

// ActivityTimeline — shows 3 entries by default with expand
function ActivityTimeline({ activity = [] }) {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? activity : activity.slice(0, 3);

  if (!activity.length) return <span className="text-swoop-text-muted">No recent activity logged.</span>;

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((a) => (
        <div key={a.id} className="flex justify-between gap-3 text-sm">
          <div>
            <div className="font-semibold">{a.type}</div>
            <div className="text-swoop-text-muted">{a.detail}</div>
          </div>
          <div className="text-swoop-text-label">{formatDateTime(a.timestamp)}</div>
        </div>
      ))}
      {activity.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="bg-transparent border-none text-brand-500 text-xs font-semibold cursor-pointer text-left p-0 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Show all {activity.length} entries {'\u2192'}
        </button>
      )}
    </div>
  );
}

// DecayChainAction was extracted into ./MemberDecayChain.jsx — kept there
// so drawer and MemberProfilePage share a single implementation.

// RiskSignalRow — per-signal one-tap action
function RiskSignalRow({ signal, profile }) {
  const [addressed, setAddressed] = React.useState(false);

  const handleAction = (kind) => {
    trackAction({
      actionType: kind,
      actionSubtype: 'risk_signal',
      memberId: profile?.memberId,
      memberName: profile?.name,
      referenceType: 'risk_signal',
      referenceId: signal.id,
      description: `${kind === 'mark_addressed' ? 'Marked addressed' : 'Action recommended'}: ${signal.label}`,
    });
    setAddressed(true);
  };

  return (
    <div
      className="border border-swoop-border rounded-lg px-3 py-2.5"
      style={{ fontSize: '11px', lineHeight: 1.4 }}
    >
      <div className="flex justify-between items-center" style={{ lineHeight: 1.4 }}>
        <div className="font-semibold flex-1 min-w-0" style={{ lineHeight: 1.4 }}>{signal.label}</div>
        <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
      </div>
      <div className="text-xs text-swoop-text-label" style={{ fontSize: '10px', lineHeight: 1.4 }}>
        {formatDateTime(signal.timestamp)} {'\u00B7'} Confidence {signal.confidence ?? '\u2014'}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        <button
          type="button"
          onClick={() => handleAction('mark_addressed')}
          disabled={addressed}
          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border ${
            addressed
              ? 'bg-success-100 text-success-700 border-success-300 cursor-default'
              : 'bg-swoop-panel border-swoop-border text-swoop-text-muted hover:bg-swoop-row-hover'
          }`}
        >
          {addressed ? '\u2713 Addressed' : 'Mark addressed'}
        </button>
        <button
          type="button"
          onClick={() => handleAction('recommend_action')}
          disabled={addressed}
          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border ${
            addressed
              ? 'bg-swoop-row text-swoop-text-label border-swoop-border cursor-default'
              : 'bg-brand-50 border-brand-300 text-brand-600 hover:bg-brand-100'
          }`}
        >
          Recommend action
        </button>
      </div>
    </div>
  );
}

// Member Journey — longitudinal cross-domain timeline showing engagement decay sequence
// P6 "First Domino": shows per-member decay chain (Email dropped → Golf dropped → Dining dropped)
function MemberJourneyTimeline({ profile }) {
  // Build journey from activity + risk signals + static demo events.
  // Note: decay-chain computation now lives in MemberDecayChain (shared
  // component). This hook only builds the vertical timeline event list.
  const journeyEvents = useMemo(() => {
    const events = [];

    // Add activity items — services already filter by loaded domains in data-driven mode
    (profile.activity ?? []).forEach(a => {
      const domain = a.type?.includes('Golf') || a.type?.includes('Round') ? 'Golf'
        : a.type?.includes('Dining') || a.type?.includes('F&B') ? 'Dining'
        : a.type?.includes('Event') ? 'Events'
        : a.type?.includes('Email') ? 'Email'
        : 'Activity';
      events.push({
        date: a.timestamp ?? a.date ?? '',
        domain,
        label: a.detail ?? a.type ?? '',
        type: 'activity',
      });
    });

    // Add risk signal events
    (profile.riskSignals ?? []).forEach(s => {
      const domain = s.source ?? 'Risk';
      events.push({
        date: s.timestamp ?? '',
        domain,
        label: s.label ?? s.description ?? '',
        type: 'risk',
      });
    });

    // If few events, add demo journey points based on member scenario.
    if (events.length < 4) {
      const demoEvents = [
        { date: 'Oct 2025', domain: 'Email', label: 'Newsletter open rate dropped below 20%', type: 'warning', decayOrder: 1 },
        { date: 'Oct 2025', domain: 'Golf', label: 'Regular rounds: 3-4x/month', type: 'positive' },
        { date: 'Nov 2025', domain: 'Golf', label: 'Rounds dropped to 2x/month', type: 'warning', decayOrder: 2 },
        { date: 'Nov 2025', domain: 'Dining', label: 'Post-round dining stopped', type: 'warning', decayOrder: 3 },
        { date: 'Dec 2025', domain: 'Email', label: 'Newsletter open rate below 10%', type: 'risk' },
        { date: 'Dec 2025', domain: 'Golf', label: 'Only 1 round played', type: 'risk' },
        { date: 'Jan 2026', domain: 'Events', label: 'Skipped member-guest invite', type: 'risk', decayOrder: 4 },
        { date: 'Jan 2026', domain: 'Risk', label: 'Resignation risk: high', type: 'risk' },
      ];
      events.push(...demoEvents);
    }

    return events;
  }, [profile]);

  const domainColors = {
    Golf: '#12b76a',
    Dining: '#f59e0b',
    Events: '#F3922D',
    Email: '#2563eb',
    Risk: '#ef4444',
    Activity: '#9CA3AF',
  };

  const typeIcons = {
    positive: '\u2713',
    activity: '\u2022',
    warning: '\u26A0',
    risk: '\u2716',
  };

  if (!journeyEvents.length) {
    return <span className="text-sm text-swoop-text-muted">No journey data available.</span>;
  }

  return (
    <div className="flex flex-col">
      {/* Decay Chain — "First Domino" visualization (shared component) */}
      <MemberDecayChain member={profile} variant="drawer" />
      {/* Cross-domain engagement signals from imported CSV data */}
      <div className="mb-3">
        <MemberEngagementTimeline memberId={profile?.memberId} />
      </div>
    <div className="flex flex-col relative pl-5">
      {/* Vertical timeline line */}
      <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-swoop-border" />
      {journeyEvents.map((evt, i) => {
        const color = domainColors[evt.domain] ?? '#9CA3AF';
        const icon = typeIcons[evt.type] ?? '\u2022';
        return (
          <div key={i} className="flex gap-3 items-start py-1.5 relative">
            <div className="absolute -left-4 top-2.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold z-[1]" style={{ background: color + '22', border: '2px solid ' + color, color: color }}>
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex gap-2 items-baseline">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-px rounded-sm" style={{ background: color + '14', color: color }}>
                  {evt.domain}
                </span>
                <span className="text-xs text-swoop-text-label">{formatDateTime(evt.date) !== '\u2014' ? formatDateTime(evt.date) : evt.date}</span>
              </div>
              <div className="text-sm text-swoop-text-muted mt-0.5">{evt.label}</div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

// Health score dimensions — only shows scores for connected data sources.
// Ungated dimensions render as "Not connected" with reduced opacity.
function HealthDimensionGrid({ profile }) {
  const score = profile.healthScore ?? 50;
  const arch = profile.archetype || '';

  const archetypeWeights = {
    'Die-Hard Golfer': { golf: 1.3, dining: 0.6, email: 0.5, events: 0.4 },
    'Social Butterfly': { golf: 0.4, dining: 1.2, email: 1.0, events: 1.3 },
    'Balanced Active': { golf: 1.0, dining: 0.9, email: 0.8, events: 0.8 },
    'Weekend Warrior': { golf: 0.9, dining: 0.7, email: 0.5, events: 0.5 },
    'Declining': { golf: 0.5, dining: 0.4, email: 0.4, events: 0.3 },
    'New Member': { golf: 0.7, dining: 0.7, email: 1.1, events: 0.6 },
    'Ghost': { golf: 0.1, dining: 0.1, email: 0.2, events: 0.1 },
    'Snowbird': { golf: 1.0, dining: 0.8, email: 0.7, events: 0.5 },
  };
  const w = archetypeWeights[arch] || { golf: 0.9, dining: 0.8, email: 0.7, events: 0.6 };

  const dimensions = [
    { label: 'Golf Engagement', weight: '30%', gate: 'tee-sheet', source: 'tee sheet', value: profile.golfScore ?? Math.min(100, Math.round(score * w.golf)), color: '#F3922D' },
    { label: 'Dining Frequency', weight: '25%', gate: 'fb', source: 'POS', value: profile.diningScore ?? Math.min(100, Math.round(score * w.dining)), color: '#12b76a' },
    { label: 'Email Engagement', weight: '25%', gate: 'email', source: 'email', value: profile.emailScore ?? Math.min(100, Math.round(score * w.email)), color: '#3B82F6' },
    { label: 'Event Attendance', weight: '20%', gate: 'events', source: 'events', value: profile.eventScore ?? Math.min(100, Math.round(score * w.events)), color: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {dimensions.map(d => {
        const connected = isGateOpen(d.gate);
        if (!connected) {
          return (
            <div key={d.label} className="px-2.5 py-2 rounded-lg border border-dashed border-swoop-border bg-swoop-row" style={{ opacity: 0.5 }}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-swoop-text-label">{d.label} ({d.weight})</span>
              </div>
              <div className="text-[10px] text-swoop-text-label">Not connected</div>
              <div className="text-[9px] text-swoop-text-ghost mt-0.5">Connect {d.source} to unlock</div>
            </div>
          );
        }
        return (
          <div key={d.label} className="px-2.5 py-2 rounded-lg border border-swoop-border bg-swoop-row">
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-swoop-text-label">{d.label} ({d.weight})</span>
              <span className="text-[11px] font-bold font-mono" style={{ color: d.value >= 60 ? '#12b76a' : d.value >= 35 ? '#f59e0b' : '#ef4444' }}>{d.value}</span>
            </div>
            <div className="h-1 rounded-sm bg-swoop-row">
              <div className="h-full rounded-sm" style={{ background: d.value >= 60 ? '#12b76a' : d.value >= 35 ? '#f59e0b' : '#ef4444', width: `${d.value}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Resignation risk badge — fetches from predict-churn API
function ChurnPredictionBadge({ profile }) {
  const [prediction, setPrediction] = useState(null);
  useEffect(() => {
    if (!profile?.memberId) return;
    getMemberChurnPrediction(profile.memberId).then(p => { if (p) setPrediction(p); });
  }, [profile?.memberId]);

  if (!prediction || !prediction.prob_90d) return null;

  const prob = prediction.prob_90d;
  const color = prob >= 60 ? '#ef4444' : prob >= 30 ? '#f59e0b' : '#12b76a';
  const factors = prediction.risk_factors || [];

  return (
    <Section
      title="Resignation Risk"
      description="AI-powered early warning"
      defaultCollapsed={false}
      preview={<SwPill variant={prob >= 60 ? 'danger' : prob >= 30 ? 'warn' : 'success'}>{prob}% 90d</SwPill>}
    >
      <div className="flex gap-4 mb-2">
        <div className="text-center px-4 py-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
          <div className="text-2xl font-bold font-mono" style={{ color }}>{prob}%</div>
          <div className="text-[10px] text-swoop-text-label">90-day risk</div>
        </div>
        <div className="flex gap-2">
          <div className="text-center px-3 py-2 rounded-lg bg-swoop-row">
            <div className="text-sm font-bold font-mono">{prediction.prob_30d}%</div>
            <div className="text-[10px] text-swoop-text-label">30-day</div>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-swoop-row">
            <div className="text-sm font-bold font-mono">{prediction.prob_60d}%</div>
            <div className="text-[10px] text-swoop-text-label">60-day</div>
          </div>
        </div>
      </div>
      {factors.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold text-swoop-text-label uppercase tracking-wider">Contributing factors</div>
          {factors.slice(0, 3).map((f, i) => (
            <div key={i} className="text-xs text-swoop-text-muted flex gap-1.5 items-start">
              <span className="font-bold shrink-0" style={{ color }}>{Math.round(f.weight * 100)}%</span>
              <span>{f.factor} — {f.detail}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

const ARCHETYPE_DESCRIPTIONS = {
  'Die-Hard Golfer': 'Plays 3+ rounds per week and values tee time reliability and pro shop relationships above all else. Low dining and event engagement — typically skips post-round meals. Responds best to personal calls from the pro or GM about course conditions and tee time availability.',
  'Social Butterfly': 'Primarily engaged through dining, events, and social connections. May play golf infrequently but is deeply connected to the club community. Responds best to personal event invitations, concierge touches, and social group inclusion.',
  'Balanced Active': 'Engages consistently across golf, dining, and events. The ideal engaged member profile. When declining, usually triggered by a specific negative experience rather than gradual disengagement. Responds to multi-channel outreach.',
  'Weekend Warrior': 'Concentrates activity on weekends — Saturday/Sunday golf, weekend dining. Limited weekday engagement. Values weekend tee time availability and family-friendly programming. Responds best to pro shop calls and weekend-specific offers.',
  'Declining': 'Showing decay across multiple engagement dimensions simultaneously. Often past the early intervention window. Requires urgent, personal GM outreach with a specific recovery offer. Direct phone call is the highest-success intervention.',
  'New Member': 'Within their first 12 months. Critical 90-day onboarding window determines long-term retention. Needs structured welcome touches, member introductions, and guided discovery of club amenities. High responsiveness to personal attention.',
  'Ghost': 'Minimal to zero engagement across all dimensions. Likely paying dues only. May have already mentally resigned. Requires high-touch, personal GM call with a compelling reason to re-engage — complimentary guest pass, exclusive event invitation.',
  'Snowbird': 'Seasonal engagement pattern — highly active during their primary season, absent during off-season. Engagement drops are expected and should not trigger standard decay alerts during known off-season periods. Welcome-back calls at season start are critical.',
};

function getTalkingPoints(profile) {
  const points = [];
  const archetype = profile.archetype || '';
  const score = profile.healthScore ?? 50;
  const risks = profile.riskSignals || [];
  const riskText = risks.map(r => (r.label || '').toLowerCase()).join(' ');

  if (riskText.includes('complaint') || riskText.includes('unresolved')) {
    points.push('Acknowledge the specific service issue and apologize directly');
    points.push('Share what the club has done to prevent recurrence');
  }
  if (riskText.includes('pace') || riskText.includes('slow')) {
    points.push('Acknowledge pace-of-play frustration \u2014 mention ranger deployment improvements');
    points.push('Offer preferred tee time slot hold to avoid peak congestion');
  }
  if (riskText.includes('dining') || riskText.includes('f&b') || riskText.includes('grill')) {
    points.push('Invite to an upcoming Chef\'s Table or wine dinner event');
    points.push('Mention new menu additions or seasonal specials');
  }
  if (riskText.includes('golf') || riskText.includes('round') || riskText.includes('tee')) {
    points.push('Ask about any scheduling changes or course condition concerns');
    if (archetype === 'Weekend Warrior') points.push('Offer a preferred Saturday morning tee time hold');
  }
  if (riskText.includes('email') || riskText.includes('newsletter') || riskText.includes('open rate')) {
    points.push('Ask if they\'re receiving communications \u2014 offer preferred channel switch');
  }
  if (points.length === 0) {
    if (score < 30) {
      points.push('Express genuine concern and ask what the club can do differently');
      points.push('Offer a specific retention incentive (comp round, dining credit, event invite)');
    } else if (score < 50) {
      points.push('Check in personally \u2014 ask how their recent experiences have been');
      points.push('Mention an upcoming event or improvement relevant to their interests');
    } else {
      points.push('Thank them for their engagement and ask for feedback');
      points.push('Invite them to an upcoming member event');
    }
  }
  return points.slice(0, 3);
}

function OutreachHistory({ profile }) {
  const outreachEvents = useMemo(() => {
    const fromActivity = (profile.activity || [])
      .filter(a => {
        const type = (a.type || '').toLowerCase();
        return type.includes('call') || type.includes('email') || type.includes('sms') ||
               type.includes('comp') || type.includes('outreach') || type.includes('contact');
      });
    const fromLog = getOutreachHistory(profile.memberId).map(entry => ({
      type: entry.type, detail: entry.description, timestamp: entry.timestamp,
      id: `log-${entry.timestamp}`, initiatedBy: entry.initiatedBy,
    }));
    const merged = [...fromLog, ...fromActivity];
    return merged.slice(0, 8);
  }, [profile.activity, profile.memberId]);

  if (!outreachEvents.length) {
    return <span className="text-sm text-swoop-text-muted">No outreach history recorded yet.</span>;
  }

  return (
    <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
      {outreachEvents.map((evt, i) => (
        <div key={evt.id || i} className="flex justify-between items-start gap-3 px-2.5 py-2 rounded-lg bg-swoop-row border border-swoop-border" style={{ fontSize: '11px', lineHeight: 1.4 }}>
          <div style={{ lineHeight: 1.4 }}>
            <div className="font-semibold text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>{evt.type}</div>
            <div className="text-xs text-swoop-text-muted" style={{ fontSize: '10px', lineHeight: 1.4 }}>{evt.detail}</div>
          </div>
          <div className="text-xs text-swoop-text-label whitespace-nowrap" style={{ fontSize: '10px', lineHeight: 1.4 }}>
            {formatDateTime(evt.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpendTrendSparkline({ profile }) {
  const spendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthActivities = (profile.activity || []).filter(a => {
        const d = new Date(a.timestamp);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      });
      const baseSpend = profile.duesAnnual ? profile.duesAnnual / 12 : 1500;
      const activityMultiplier = Math.max(0.2, Math.min(2, monthActivities.length / 3));
      const seed = ((i + 1) * 7 + (profile.duesAnnual || 15000) % 100) / 100;
      months.push(Math.round(baseSpend * activityMultiplier * (0.8 + (seed % 1) * 0.4)));
    }
    return months;
  }, [profile]);

  const trend = spendData.length >= 2 ? spendData[spendData.length - 1] - spendData[0] : 0;
  const trendColor = trend >= 0 ? '#12b76a' : '#ef4444';

  return (
    <div className="flex items-center gap-3">
      <Sparkline data={spendData} color={trendColor} />
      <div className="text-xs font-semibold" style={{ color: trendColor }}>
        {trend >= 0 ? '\u2191' : '\u2193'} ${(Number.isFinite(trend) ? Math.abs(trend) : 0).toLocaleString()}/mo
      </div>
    </div>
  );
}

// --- Snapshot categories for quick-view habits panel ---
const SNAPSHOT_CATS = [
  { key: 'dining',  label: 'Food & Dining', types: ['dining', 'f&b', 'lounge', 'grill'],    icon: '\uD83C\uDF7D\uFE0F', color: '#f59e0b' },
  { key: 'golf',    label: 'Golf',          types: ['golf', 'practice', 'tee', 'round'],     icon: '\u26F3',             color: '#12b76a' },
  { key: 'events',  label: 'Events',        types: ['event', 'social'],                       icon: '\uD83C\uDF89',       color: '#8b5cf6' },
  { key: 'spa',     label: 'Spa & Wellness',types: ['spa', 'wellness', 'pool', 'fitness'],    icon: '\uD83E\uDDD6',       color: '#ec4899' },
  { key: 'courts',  label: 'Courts',        types: ['tennis', 'pickleball', 'court'],         icon: '\uD83C\uDFBE',       color: '#06b6d4' },
  { key: 'email',   label: 'Email',         types: ['email', 'newsletter'],                   icon: '\u2709\uFE0F',       color: '#3B82F6' },
];

function buildDrawerSnapshot(profile) {
  const activity = profile.activity || [];
  const prefs = profile.preferences || {};
  const family = profile.family || [];
  const staffNotes = profile.staffNotes || [];

  const groups = {};
  SNAPSHOT_CATS.forEach(c => { groups[c.key] = []; });

  activity.forEach(evt => {
    const t = (evt.type || evt.domain || '').toLowerCase();
    for (const cat of SNAPSHOT_CATS) {
      if (cat.types.some(ct => t.includes(ct))) { groups[cat.key].push(evt); break; }
    }
  });

  // Preference hints per category
  const hints = {};
  if (prefs.dining) hints.dining = prefs.dining;
  if (prefs.teeWindows) hints.golf = prefs.teeWindows;
  const notesLower = (prefs.notes || '').toLowerCase();
  if (notesLower.includes('spa') || notesLower.includes('pool')) hints.spa = prefs.notes;
  if (notesLower.includes('court') || notesLower.includes('tennis')) hints.courts = prefs.notes;

  // Family hints
  const famHints = {};
  family.forEach(fm => {
    const n = (fm.notes || '').toLowerCase();
    if (n.includes('wine') || n.includes('dinner') || n.includes('grill') || n.includes('dining')) (famHints.dining = famHints.dining || []).push(fm);
    if (n.includes('golf') || n.includes('tee') || n.includes('clinic')) (famHints.golf = famHints.golf || []).push(fm);
    if (n.includes('event') || n.includes('camp') || n.includes('social')) (famHints.events = famHints.events || []).push(fm);
    if (n.includes('spa') || n.includes('pool') || n.includes('wellness')) (famHints.spa = famHints.spa || []).push(fm);
    if (n.includes('court') || n.includes('tennis') || n.includes('pickleball')) (famHints.courts = famHints.courts || []).push(fm);
  });

  // Staff note hints
  staffNotes.forEach(note => {
    const text = (typeof note === 'string' ? note : note.text || '').toLowerCase();
    if (text.includes('spa') || text.includes('pool') || text.includes('massage')) hints.spa = hints.spa || (typeof note === 'string' ? note : note.text);
    if (text.includes('court') || text.includes('tennis')) hints.courts = hints.courts || (typeof note === 'string' ? note : note.text);
  });

  return { groups, hints, famHints };
}

function DrawerSnapshotSection({ profile }) {
  const { groups, hints, famHints } = useMemo(() => buildDrawerSnapshot(profile), [profile]);

  // All categories are visible — services return empty data for unloaded domains
  const visibleCats = SNAPSHOT_CATS;

  const activeCats = visibleCats.filter(c =>
    groups[c.key].length > 0 || hints[c.key] || (famHints[c.key] && famHints[c.key].length > 0)
  );
  const emptyCats = visibleCats.filter(c =>
    groups[c.key].length === 0 && !hints[c.key] && (!famHints[c.key] || famHints[c.key].length === 0)
  );

  if (activeCats.length === 0) return null;

  const habitsPreview = (
    <>
      {activeCats.slice(0, 4).map(cat => (
        <SwPill key={cat.key} variant="neutral">{cat.icon} {groups[cat.key].length || '·'}</SwPill>
      ))}
    </>
  );

  return (
    <Section title="Member Habits" description="Quick reference" preview={habitsPreview}>
      <div className="flex flex-col gap-2.5" style={{ fontSize: '12px', lineHeight: 1.4, gap: '4px' }}>
        {activeCats.map(cat => {
          const items = groups[cat.key];
          const hint = hints[cat.key];
          const fam = famHints[cat.key];
          return (
            <div key={cat.key} className="px-3 py-2.5 rounded-lg border border-swoop-border bg-swoop-row" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              <div className="flex items-center gap-1.5 mb-1" style={{ lineHeight: 1.4, gap: '4px' }}>
                <span className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>{cat.icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: cat.color, lineHeight: 1.4 }}>{cat.label}</span>
                {items.length > 0 && (
                  <span className="ml-auto text-[10px] text-swoop-text-label bg-swoop-panel rounded-full px-1.5 py-px border border-swoop-border" style={{ lineHeight: 1.4, fontSize: '10px' }}>{items.length}</span>
                )}
              </div>
              {hint && (
                <div className="text-xs text-swoop-text-muted italic border-l-2 pl-2 mb-1" style={{ borderColor: `${cat.color}60`, fontSize: '10px', lineHeight: 1.4 }}>
                  {hint}
                </div>
              )}
              {fam && fam.map((fm, i) => (
                <div key={i} className="text-[11px] text-swoop-text-label italic border-l-2 pl-2 mb-1 border-purple-300" style={{ lineHeight: 1.4, fontSize: '10px' }}>
                  {fm.name}: {fm.notes}
                </div>
              ))}
              {items.length > 0 && (
                <div className="flex flex-col gap-1" style={{ lineHeight: 1.4, gap: '4px' }}>
                  {items.slice(0, 2).map((evt, i) => (
                    <div key={i} className="flex gap-2 items-start text-[11px]" style={{ lineHeight: 1.4, gap: '4px' }}>
                      <span className="shrink-0 text-swoop-text-label font-mono whitespace-nowrap" style={{ lineHeight: 1.4, fontSize: '10px' }}>{evt.timestamp || formatDate(evt.date)}</span>
                      <span className="text-swoop-text-muted" style={{ lineHeight: 1.4 }}>{evt.detail || evt.event || evt.description}</span>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-[10px] text-swoop-text-label">+{items.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {emptyCats.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-swoop-border-inset" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
            {emptyCats.map(c => (
              <span key={c.key} className="text-[10px] text-swoop-text-ghost flex items-center gap-0.5" style={{ lineHeight: 1.4, gap: '4px' }}>
                {c.icon} {c.label}: No data
              </span>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

export function MemberProfileContent({ profile, onClose, onOpenFullPage, onAddNote, onQuickAction, layout = 'drawer' }) {
  // Pull openProfile from context so household rows can navigate to a relative's drawer.
  // Safe to call here unconditionally — MemberProfileContent is always rendered inside
  // MemberProfileProvider via the drawer wrapper below.
  const { openProfile } = useMemberProfile();

  if (!profile) {
    return (
      <div className="p-6 text-swoop-text-label">
        Select a member to view their profile.
      </div>
    );
  }

  const [noteText, setNoteText] = useState('');
  const initials = (profile.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2);
  const isDrawerLayout = layout === 'drawer';

  const topMetrics = useMemo(() => [
    { label: 'Annual dues', value: Number.isFinite(profile.duesAnnual) ? `$${Math.round(profile.duesAnnual).toLocaleString()}` : '\u2014' },
    { label: 'Annual value', value: Number.isFinite(profile.memberValueAnnual) ? `$${Math.round(profile.memberValueAnnual).toLocaleString()}` : '\u2014' },
    { label: 'Last seen', value: profile.lastSeenLocation ?? '\u2014' },
  ], [profile.duesAnnual, profile.memberValueAnnual, profile.lastSeenLocation]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote?.(profile.memberId, { text: noteText.trim() });
    setNoteText('');
  };

  const emailSendMode = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_email_send_mode') || 'local' : 'local';
  const emailLabel = emailSendMode === 'gmail' ? 'Draft in Gmail' : emailSendMode === 'cloud' ? 'Send email' : 'Draft email';
  const quickActions = [
    { key: 'call', label: 'Schedule call', icon: '\uD83D\uDCDE' },
    { key: 'email', label: emailLabel, icon: '\u2709\uFE0F' },
    { key: 'sms', label: 'Draft SMS', icon: '\uD83D\uDCAC' },
    { key: 'comp', label: 'Offer comp', icon: '\uD83C\uDF81' },
  ];

  const contextReason = useMemo(() => {
    if (!profile.riskSignals?.length) return null;
    const topSignal = profile.riskSignals[0];
    if (!topSignal?.label) return null;
    return topSignal.label;
  }, [profile.riskSignals]);

  return (
    <div className="flex flex-col gap-4" style={{ gap: '10px' }}>
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div className="px-3.5 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/[0.13] border-l-[3px] border-l-red-500 text-sm text-white" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}>
          <span className="font-bold text-error-500 mr-1.5">Flagged:</span>
          {contextReason}
        </div>
      )}

      <div className="flex justify-between items-start gap-4 flex-wrap" style={{ flexWrap: 'nowrap', gap: '8px' }}>
        <div className="flex gap-4 items-center">
          <div className={`${layout === 'page' ? 'w-20 h-20 text-[28px]' : 'w-10 h-10 text-sm'} rounded-full bg-swoop-row border border-swoop-border flex items-center justify-center font-bold text-white`}>
            {initials}
          </div>
          <div>
          <div className="text-sm text-swoop-text-label tracking-wide uppercase" style={{ display: 'none', fontSize: '10px' }}>Member Snapshot</div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className={`${layout === 'page' ? 'text-[32px]' : ''}`} style={{ fontSize: layout === 'page' ? undefined : '18px', fontWeight: 700, margin: '0px', lineHeight: 1.2 }}>{profile.name}</h2>
            {/* Cross-pillar bridge: featured-in-board-report badge */}
            {(() => {
              try {
                const saves = getMemberSaves() || [];
                const isFeatured = saves.some(s => (s.memberId && s.memberId === profile.memberId) || (s.name && s.name === profile.name) || (s.memberName && s.memberName === profile.name));
                if (!isFeatured) return null;
                return (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-500/30"
                    title="This member is featured in this month's Board Report"
                  >
                    ★ FEATURED IN BOARD REPORT
                  </span>
                );
              } catch { return null; }
            })()}
          </div>
          <div className="text-sm text-swoop-text-muted" style={{ fontSize: '10px' }}>
            {profile.tier} {'\u2022'} Joined {formatDate(profile.joinDate)}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap" style={{ gap: '6px', marginTop: '6px' }}>
            {topMetrics.map((metric) => (
              <div key={metric.label} className="px-3 py-2 rounded-lg bg-swoop-row border border-swoop-border" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                <div className="text-xs text-swoop-text-label uppercase tracking-wider" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '1px' }}>{metric.label}</div>
                <div className="text-sm font-semibold" style={{ fontSize: '13px', lineHeight: 1.2, fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div className="text-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
          <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Health score</div>
          <div className="text-[42px] font-mono" style={{ color: profile.healthScore > 69 ? '#12b76a' : profile.healthScore > 40 ? '#f59e0b' : '#ef4444', fontSize: '24px', lineHeight: 1 }}>
            {profile.healthScore ?? '\u2014'}
          </div>
          <Sparkline data={profile.trend ?? []} />
          {/* Dues-at-risk chip is rendered inside MemberDecayChain's card header (single source of truth). */}
          {/* Phase I4 — Revenue page link for high-value at-risk members */}
          {(profile.healthScore ?? 100) < 50 && profile.duesAnnual >= 20000 && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.hash = '#/revenue';
                }
              }}
              className="mt-1 text-[10px] font-bold text-brand-500 bg-brand-500/[0.06] border border-brand-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-brand-500/[0.12]"
              title="See full revenue breakdown including high-value member exposure"
            >
              See full revenue breakdown →
            </button>
          )}
          {layout !== 'page' && onOpenFullPage && (
            <button
              type="button"
              onClick={() => onOpenFullPage(profile.memberId)}
              className="mt-2 border-none bg-transparent text-brand-500 font-semibold cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500"
              style={{ fontSize: '11px', marginTop: '2px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(234, 127, 55, 0.08)' }}
            >
              Open full profile {'\u2192'}
            </button>
          )}
        </div>
      </div>

      {/* Member Habits Snapshot — key activity by category at the top */}
      <DrawerSnapshotSection profile={profile} />

      {/* Health Score Breakdown */}
      {(profile.golfScore || profile.diningScore || profile.healthScore) && (() => {
        const score = profile.healthScore ?? 50;
        const variant = score >= 60 ? 'success' : score >= 35 ? 'warn' : 'danger';
        const hsPreview = (
          <>
            <SwPill variant={variant}>⛳ {profile.golfScore ?? Math.round(score * 0.9)}</SwPill>
            <SwPill variant={variant}>🍽 {profile.diningScore ?? Math.round(score * 0.8)}</SwPill>
            <SwPill variant={variant}>✉ {profile.emailScore ?? Math.round(score * 0.7)}</SwPill>
            <SwPill variant={variant}>🎉 {profile.eventScore ?? Math.round(score * 0.6)}</SwPill>
          </>
        );
        return (
          <Section title="Health Score Breakdown" description="Weighted engagement across 4 dimensions" preview={hsPreview}>
            <HealthDimensionGrid profile={profile} />
          </Section>
        );
      })()}

      {/* Resignation Risk — from predict-churn API */}
      <ChurnPredictionBadge profile={profile} />

      <Section
        title="Contact"
        description={`Preferred channel: ${profile.contact?.preferredChannel ?? '\u2014'}`}
        preview={
          <>
            <SwPill variant="neutral">💬 {profile.contact?.preferredChannel ?? 'SMS'}</SwPill>
            {profile.contact?.lastOutreach && <SwPill variant="neutral">Last {formatDate(profile.contact.lastOutreach)}</SwPill>}
          </>
        }
      >
        <div className="flex flex-col gap-1.5 text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          <span style={{ fontSize: '11px', lineHeight: 1.4 }}><strong>Phone:</strong> {profile.contact?.phone && profile.contact.phone !== '\u2014'
            ? <a href={`tel:${profile.contact.phone}`} className="text-brand-500 no-underline">{profile.contact.phone}</a>
            : '\u2014'}</span>
          <span style={{ fontSize: '11px', lineHeight: 1.4 }}><strong>Email:</strong> {profile.contact?.email && profile.contact.email !== '\u2014'
            ? <a href={`mailto:${profile.contact.email}`} className="text-brand-500 no-underline">{profile.contact.email}</a>
            : '\u2014'}</span>
          <span style={{ fontSize: '11px', lineHeight: 1.4 }}><strong>Last outreach:</strong> {formatDateTime(profile.contact?.lastOutreach)}</span>
        </div>
      </Section>

      {/* Household / Family Unit View */}
      {profile.family && profile.family.length > 0 && (() => {
        const householdValue = Math.round((profile.duesAnnual || 0) * (1 + (profile.family?.length ?? 0) * 0.6));
        return (
        <Section
          title="Household"
          description={`${profile.family.length + 1} members`}
          sourceSystems={['Member CRM']}
          preview={<SwPill variant="neutral">${householdValue.toLocaleString()}/yr</SwPill>}
        >
          <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
            {/* Aggregate household value */}
            <div className="flex gap-4 px-3 py-2 bg-swoop-row rounded-lg border border-swoop-border" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              <div style={{ lineHeight: 1.4 }}>
                <div className="text-xs text-swoop-text-label uppercase tracking-wide" style={{ fontSize: '10px', lineHeight: 1.4 }}>Household value</div>
                <div className="text-base font-bold font-mono" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  ${Math.round((profile.duesAnnual || 0) * (1 + (profile.family?.length ?? 0) * 0.6)).toLocaleString()}/yr
                </div>
              </div>
              <div style={{ lineHeight: 1.4 }}>
                <div className="text-xs text-swoop-text-label uppercase tracking-wide" style={{ fontSize: '10px', lineHeight: 1.4 }}>Health (lowest)</div>
                <div className="text-base font-bold font-mono" style={{ color: (profile.healthScore ?? 50) > 69 ? '#12b76a' : (profile.healthScore ?? 50) > 40 ? '#f59e0b' : '#ef4444', fontSize: '12px', lineHeight: 1.4 }}>
                  {profile.healthScore ?? '\u2014'}
                </div>
              </div>
            </div>
            {/* Family members — clicking a linkable household member opens their drawer */}
            {profile.family.map((f, i) => (
              <div key={i}
                role={f.memberId ? 'button' : undefined}
                tabIndex={f.memberId ? 0 : undefined}
                aria-label={f.memberId ? `Open profile for ${f.name}` : undefined}
                onClick={() => { if (f.memberId) openProfile(f.memberId); }}
                onKeyDown={(e) => {
                  if (f.memberId && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    openProfile(f.memberId);
                  }
                }}
                className={`flex justify-between items-center px-3 py-2 rounded-lg border border-swoop-border transition-colors duration-100 ${f.memberId ? 'cursor-pointer hover:bg-swoop-row-hover focus:outline-none focus:ring-2 focus:ring-brand-500' : 'cursor-default'}`}
                style={{ fontSize: '11px', lineHeight: 1.4 }}
              >
                <div style={{ lineHeight: 1.4 }}>
                  <div className={`font-semibold text-sm ${f.memberId ? 'text-brand-500' : 'text-white'}`} style={{ fontSize: '12px', lineHeight: 1.4 }}>{f.name}</div>
                  <div className="text-xs text-swoop-text-label" style={{ fontSize: '10px', lineHeight: 1.4 }}>{f.relation}</div>
                </div>
                {f.notes && (
                    <div className="text-xs text-swoop-text-muted max-w-[50%] text-right" style={{ fontSize: '10px', lineHeight: 1.4 }}>
                      {f.notes}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Section>
        );
      })()}

      {/* Archetype Description — Call Prep */}
      {profile.archetype && ARCHETYPE_DESCRIPTIONS[profile.archetype] && (
        <Section
          title={`Archetype: ${profile.archetype}`}
          description="Behavioral profile"
          preview={<SwPill variant="amber">{profile.archetype}</SwPill>}
        >
          <div className="text-sm text-swoop-text-muted leading-relaxed" style={{ fontSize: '10px', lineHeight: 1.4 }}>
            {ARCHETYPE_DESCRIPTIONS[profile.archetype]}
          </div>
        </Section>
      )}

      {/* Spending Trend */}
      {(profile.duesAnnual || profile.spendHistory) && (
        <Section
          title="Spending Trend"
          description="6-month direction"
          preview={<SwPill variant="warn">↓ trend</SwPill>}
        >
          <SpendTrendSparkline profile={profile} />
        </Section>
      )}

      {/* Recommended Talking Points */}
      <Section
        title="Talking Points"
        description="Personalized for this call"
        preview={<SwPill variant="neutral">{getTalkingPoints(profile).length} points</SwPill>}
      >
        <div className="flex flex-col gap-1.5" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {getTalkingPoints(profile).map((point, i) => (
            <div key={i} className="flex gap-2 items-start px-3 py-2 rounded-lg bg-brand-500/[0.04] border border-brand-500/[0.13]" style={{ fontSize: '11px', lineHeight: 1.4, padding: '6px 10px', marginBottom: '2px' }}>
              <span className="text-brand-500 font-bold text-sm shrink-0" style={{ fontSize: '12px', lineHeight: 1.4 }}>{i + 1}.</span>
              <span className="text-sm text-swoop-text-muted leading-normal" style={{ fontSize: '10px', lineHeight: 1.4 }}>{point}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Outreach History */}
      <Section
        title="Outreach History"
        description="Past communications"
        sourceSystems={['Swoop App']}
        preview={<SwPill variant="neutral">{getOutreachHistory(profile.memberId).length || 'None'}</SwPill>}
      >
        <OutreachHistory profile={profile} />
      </Section>

      <Section
        title="Preferences & insights"
        sourceSystems={['Member CRM']}
        preview={
          <>
            {profile.preferences?.teeWindows && <SwPill variant="neutral">⛳ {profile.preferences.teeWindows}</SwPill>}
            {profile.preferences?.favoriteSpots?.[0] && <SwPill variant="neutral">📍 {profile.preferences.favoriteSpots[0]}</SwPill>}
          </>
        }
      >
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {profile.preferences?.favoriteSpots?.length > 0 && (
              <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                <strong>Favorite spots:</strong> {profile.preferences.favoriteSpots.join(', ')}
              </div>
          )}
          {profile.preferences?.teeWindows && (
            <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Tee time window:</strong> {profile.preferences.teeWindows}
            </div>
          )}
          {profile.preferences?.dining && (
            <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Dining:</strong> {profile.preferences.dining}
            </div>
          )}
          {profile.preferences?.notes && (
            <div className="text-sm text-swoop-text-muted" style={{ fontSize: '10px', lineHeight: 1.4 }}>{profile.preferences.notes}</div>
          )}
        </div>
      </Section>

      <Section title="Recent activity" description={`${(profile.activity ?? []).length} entries · Last 30 days`} data-section="recent-activity"
        preview={<SwPill variant="neutral">{(profile.activity ?? []).length} entries</SwPill>}
        sourceSystems={['Tee Sheet', 'POS', 'Email', 'Events']}>
        <ActivityTimeline activity={profile.activity} />
      </Section>

      <Section
        title="First Domino — Engagement Decay Sequence"
        description="Cross-domain timeline · Pillar 2: FIX IT"
        defaultCollapsed={(profile.healthScore ?? 100) >= 50}
        preview={<SwPill variant="warn">{(profile.riskSignals ?? []).length || 2} cascades</SwPill>}
        sourceSystems={['Tee Sheet', 'POS', 'Email', 'Analytics']}
      >
        <MemberJourneyTimeline profile={profile} />
      </Section>

      <Section
        title="Risk signals"
        defaultCollapsed={!(profile.riskSignals ?? []).length}
        preview={<SwPill variant="danger">{(profile.riskSignals ?? []).length} active</SwPill>}
        sourceSystems={['Analytics', 'Tee Sheet', 'POS', 'Email']}
      >
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {(profile.riskSignals ?? []).map((signal) => (
            <RiskSignalRow key={signal.id} signal={signal} profile={profile} />
          ))}
          {!(profile.riskSignals ?? []).length && <span className="text-swoop-text-muted">No active risks.</span>}
        </div>
      </Section>

      <Section
        title="Staff notes"
        preview={<SwPill variant="neutral">{(profile.staffNotes ?? []).length} notes</SwPill>}
      >
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add a quick staff note..."
            className="w-full min-h-24 rounded-lg border border-swoop-border p-2 text-sm font-sans bg-swoop-row text-white"
            style={{ fontSize: '12px', lineHeight: 1.4, minHeight: '48px', height: '48px' }}
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="self-end px-3.5 py-1.5 rounded-lg border-none bg-brand-500 text-white font-semibold cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500"
            style={{ fontSize: '11px', padding: '4px 12px' }}
          >
            Save note
          </button>
          <div className="flex flex-col gap-2" style={{ fontSize: '11px', lineHeight: 1.4 }}>
            {(profile.staffNotes ?? []).map((note) => (
              <div key={note.id} className="border border-swoop-border rounded-lg px-3 py-2.5" style={{ lineHeight: 1.4 }}>
                <div className="font-semibold" style={{ lineHeight: 1.4 }}>{note.author}</div>
                <div className="text-xs text-swoop-text-label" style={{ fontSize: '10px', lineHeight: 1.4 }}>
                  {note.department ?? 'General'} {'\u00B7'} {formatDateTime(note.timestamp)}
                </div>
                <div className="mt-1.5" style={{ lineHeight: 1.4 }}>{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span className="text-swoop-text-muted">No notes yet.</span>}
          </div>
        </div>
      </Section>

      {(profile.healthScore ?? 100) < 50 && (
        <AgentUpsell
          agentName="Re-Engagement Agent"
          benefit="With AI Agents enabled, this member would already have a personalized 30-day re-engagement plan."
        />
      )}

      <div className={isDrawerLayout ? 'sticky bottom-0 bg-swoop-panel pt-4 pb-2 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] z-[5]' : ''} style={{ paddingTop: '8px', paddingBottom: '6px' }}>
        <Section title="Quick actions" collapsible={false}>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onQuickAction?.(profile.memberId, action.key)}
                className="px-3.5 py-2 rounded-xl border border-swoop-border bg-swoop-row cursor-pointer font-semibold"
                style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px' }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="border-none bg-transparent text-swoop-text-label cursor-pointer font-semibold focus-visible:ring-2 focus-visible:ring-brand-500"
            style={{ fontSize: '10px' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Error boundary to prevent white-screen crashes in member drawer
class DrawerErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center text-swoop-text-label">
          <div className="text-2xl mb-3">Something went wrong</div>
          <div className="text-sm mb-4">Unable to load this member profile.</div>
          <button onClick={this.props.onClose} className="px-5 py-2 rounded-md border border-swoop-border bg-swoop-panel cursor-pointer text-swoop-text">Close</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Ensure profile has all expected fields to prevent slice/map crashes on sparse data
function safeProfile(p) {
  if (!p) return p;
  return {
    ...p,
    activity: Array.isArray(p.activity) ? p.activity : [],
    riskSignals: Array.isArray(p.riskSignals) ? p.riskSignals : [],
    staffNotes: Array.isArray(p.staffNotes) ? p.staffNotes : [],
    family: Array.isArray(p.family) ? p.family : [],
    trend: Array.isArray(p.trend) ? p.trend : [],
    healthTimeline: Array.isArray(p.healthTimeline) ? p.healthTimeline : [],
    keyMetrics: Array.isArray(p.keyMetrics) ? p.keyMetrics : [],
    preferences: p.preferences || {},
    contact: p.contact || {},
  };
}

export default function MemberProfileDrawer() {
  const { profile: rawProfile, isDrawerOpen, closeDrawer, openProfilePage, triggerQuickAction, addStaffNote } = useMemberProfile();
  const profile = safeProfile(rawProfile);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isDrawerOpen) {
      setIsAnimating(true);
      const handler = (event) => {
        if (event.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
    return undefined;
  }, [isDrawerOpen]);

  if (!isDrawerOpen || !profile) return null;

  const handleClose = () => {
    setIsAnimating(false);
    window.setTimeout(() => closeDrawer(), 220);
  };

  const panelBase = {
    position: 'fixed',
    background: '#111111',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: isMobile ? '16px' : 0,
    borderTopRightRadius: isMobile ? '16px' : 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '10px',
    transition: 'transform 0.25s ease',
    zIndex: 1002,
    overflowY: 'auto',
    maxHeight: '100vh',
  };

  const panelStyle = isMobile
    ? { ...panelBase, left: 0, right: 0, bottom: 0, height: '85vh', maxHeight: '85vh', transform: isAnimating ? 'translateY(0)' : 'translateY(100%)' }
    : { ...panelBase, top: 0, right: 0, width: 680, maxHeight: '100vh', transform: isAnimating ? 'translateX(0)' : 'translateX(105%)' };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 7, 16, 0.45)',
    opacity: isAnimating ? 1 : 0,
    transition: 'opacity 0.2s ease',
    zIndex: 1001,
  };

  return createPortal(
    <>
      <div
        style={overlayStyle}
        onClick={handleClose}
        role="button"
        tabIndex={-1}
        aria-label="Close member profile"
      />
      <div style={panelStyle}>
        <DrawerErrorBoundary onClose={handleClose}>
          <MemberProfileContent
            profile={profile}
            onClose={handleClose}
            onOpenFullPage={openProfilePage}
            onAddNote={addStaffNote}
            onQuickAction={triggerQuickAction}
            layout="drawer"
          />
        </DrawerErrorBoundary>
      </div>
    </>,
    document.body
  );
}
