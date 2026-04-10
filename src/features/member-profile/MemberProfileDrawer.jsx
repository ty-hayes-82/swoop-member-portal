import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { getOutreachHistory, trackAction } from '@/services/activityService';
import { shouldUseStatic, getDataMode } from '@/services/demoGate';
import { getMemberChurnPrediction } from '@/services/memberService';
import { getMemberSaves } from '@/services/boardReportService';
import MemberDecayChain from './MemberDecayChain.jsx';

const formatDate = (value) => {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

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
  if (!data.length) return <span className="text-xs text-gray-400">No trend data</span>;
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

const Section = ({ title, description, children, defaultCollapsed = false, collapsible = false, summary, sourceSystems, ...rest }) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <section {...rest} className="border border-gray-200 rounded-xl p-4 bg-white" style={{ padding: '10px 12px', borderRadius: '10px' }}>
      <div
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        className={`flex justify-between items-baseline ${isCollapsed ? '' : 'mb-2'} ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ fontSize: '12px', lineHeight: 1.4 }}
      >
        <div className="flex items-baseline gap-2" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
          <h3 className="m-0 text-base" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.02em' }}>{title}</h3>
          {isCollapsed && summary && <span className="text-xs text-gray-400" style={{ fontSize: '10px', lineHeight: 1.4 }}>{summary}</span>}
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
          {description && !isCollapsed && <span className="text-xs text-gray-400" style={{ fontSize: '10px', lineHeight: 1.4 }}>{description}</span>}
          {collapsible && <span className="text-xs text-gray-400 transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)', fontSize: '10px', lineHeight: 1.4 }}>{'\u25BC'}</span>}
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

  if (!activity.length) return <span className="text-gray-500">No recent activity logged.</span>;

  return (
    <div className="flex flex-col gap-2.5">
      {visible.map((a) => (
        <div key={a.id} className="flex justify-between gap-3 text-sm">
          <div>
            <div className="font-semibold">{a.type}</div>
            <div className="text-gray-500">{a.detail}</div>
          </div>
          <div className="text-gray-400">{formatDateTime(a.timestamp)}</div>
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
      className="border border-gray-200 rounded-lg px-3 py-2.5"
      style={{ fontSize: '11px', lineHeight: 1.4 }}
    >
      <div className="flex justify-between items-center" style={{ lineHeight: 1.4 }}>
        <div className="font-semibold flex-1 min-w-0" style={{ lineHeight: 1.4 }}>{signal.label}</div>
        <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
      </div>
      <div className="text-xs text-gray-400" style={{ fontSize: '10px', lineHeight: 1.4 }}>
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
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
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
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
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

    // Add activity items (gated per source in guided mode)
    const _guidedMode = getDataMode() === 'guided';
    const _hasTeeSheet = !_guidedMode || shouldUseStatic('tee-sheet');
    const _hasFb = !_guidedMode || shouldUseStatic('fb');
    const _hasEmail = !_guidedMode || shouldUseStatic('email');
    const _hasEvents = !_guidedMode || shouldUseStatic('events');

    (profile.activity ?? []).forEach(a => {
      const domain = a.type?.includes('Golf') || a.type?.includes('Round') ? 'Golf'
        : a.type?.includes('Dining') || a.type?.includes('F&B') ? 'Dining'
        : a.type?.includes('Event') ? 'Events'
        : a.type?.includes('Email') ? 'Email'
        : 'Activity';
      // Skip entries whose source isn't imported yet
      if (_guidedMode) {
        if (domain === 'Golf' && !_hasTeeSheet) return;
        if (domain === 'Dining' && !_hasFb) return;
        if (domain === 'Email' && !_hasEmail) return;
        if (domain === 'Events' && !_hasEvents) return;
      }
      events.push({
        date: a.timestamp ?? a.date ?? '',
        domain,
        label: a.detail ?? a.type ?? '',
        type: 'activity',
      });
    });

    // Add risk signal events (gated per source)
    (profile.riskSignals ?? []).forEach(s => {
      const domain = s.source ?? 'Risk';
      if (_guidedMode) {
        const d = domain.toLowerCase();
        if ((d.includes('tee') || d.includes('golf')) && !_hasTeeSheet) return;
        if ((d === 'pos' || d.includes('dining')) && !_hasFb) return;
        if (d.includes('email') && !_hasEmail) return;
      }
      events.push({
        date: s.timestamp ?? '',
        domain,
        label: s.label ?? s.description ?? '',
        type: 'risk',
      });
    });

    // If few events, add demo journey points based on member scenario.
    // In guided mode, filter out events whose data source isn't connected yet.
    if (events.length < 4) {
      const guidedMode = getDataMode() === 'guided';
      const guidedTeeSheet = shouldUseStatic('tee-sheet');
      const guidedFb = shouldUseStatic('fb');
      const demoEvents = [
        { date: 'Oct 2025', domain: 'Email', label: 'Newsletter open rate dropped below 20%', type: 'warning', decayOrder: 1 },
        { date: 'Oct 2025', domain: 'Golf', label: 'Regular rounds: 3-4x/month', type: 'positive' },
        { date: 'Nov 2025', domain: 'Golf', label: 'Rounds dropped to 2x/month', type: 'warning', decayOrder: 2 },
        { date: 'Nov 2025', domain: 'Dining', label: 'Post-round dining stopped', type: 'warning', decayOrder: 3 },
        { date: 'Dec 2025', domain: 'Email', label: 'Newsletter open rate below 10%', type: 'risk' },
        { date: 'Dec 2025', domain: 'Golf', label: 'Only 1 round played', type: 'risk' },
        { date: 'Jan 2026', domain: 'Events', label: 'Skipped member-guest invite', type: 'risk', decayOrder: 4 },
        { date: 'Jan 2026', domain: 'Risk', label: 'Resignation risk: high', type: 'risk' },
      ].filter(evt => {
        if (!guidedMode) return true;
        if (evt.domain === 'Golf' && !guidedTeeSheet) return false;
        if (evt.domain === 'Dining' && !guidedFb) return false;
        if (evt.domain === 'Email' && !shouldUseStatic('email')) return false;
        if (evt.domain === 'Events' && !shouldUseStatic('events')) return false;
        return true;
      });
      events.push(...demoEvents);
    }

    return events;
  }, [profile]);

  const domainColors = {
    Golf: '#12b76a',
    Dining: '#f59e0b',
    Events: '#ff8b00',
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
    return <span className="text-sm text-gray-500">No journey data available.</span>;
  }

  return (
    <div className="flex flex-col">
      {/* Decay Chain — "First Domino" visualization (shared component) */}
      <MemberDecayChain member={profile} variant="drawer" />
    <div className="flex flex-col relative pl-5">
      {/* Vertical timeline line */}
      <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200" />
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
                <span className="text-xs text-gray-400">{formatDateTime(evt.date) !== '\u2014' ? formatDateTime(evt.date) : evt.date}</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{evt.label}</div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

// Health score dimensions — uses real data from health_scores table when available,
// falls back to deterministic approximations based on archetype patterns
function HealthDimensionGrid({ profile }) {
  const score = profile.healthScore ?? 50;
  const arch = profile.archetype || '';

  // Archetype-based dimension weights for deterministic fallback (no Math.random)
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

  // Use real dimensions from profile if available (populated by health_scores API), else approximate.
  // In guided mode, hide dimensions whose data source hasn't been connected yet.
  const guided = getDataMode() === 'guided';
  const hasTeeSheet = shouldUseStatic('tee-sheet');
  const hasFb = shouldUseStatic('fb');

  const hasEmail = !guided || shouldUseStatic('email');
  const hasEvents = !guided || shouldUseStatic('events');

  const dimensions = [
    (!guided || hasTeeSheet) && { label: 'Golf Engagement', weight: '30%', value: profile.golfScore ?? Math.min(100, Math.round(score * w.golf)), color: '#ff8b00' },
    (!guided || hasFb) && { label: 'Dining Frequency', weight: '25%', value: profile.diningScore ?? Math.min(100, Math.round(score * w.dining)), color: '#12b76a' },
    hasEmail && { label: 'Email Engagement', weight: '25%', value: profile.emailScore ?? Math.min(100, Math.round(score * w.email)), color: '#3B82F6' },
    hasEvents && { label: 'Event Attendance', weight: '20%', value: profile.eventScore ?? Math.min(100, Math.round(score * w.events)), color: '#8b5cf6' },
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-2 gap-2">
      {dimensions.map(d => (
        <div key={d.label} className="px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400">{d.label} ({d.weight})</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: d.value >= 60 ? '#12b76a' : d.value >= 35 ? '#f59e0b' : '#ef4444' }}>{d.value}</span>
          </div>
          <div className="h-1 rounded-sm bg-gray-100">
            <div className="h-full rounded-sm" style={{ background: d.value >= 60 ? '#12b76a' : d.value >= 35 ? '#f59e0b' : '#ef4444', width: `${d.value}%` }} />
          </div>
        </div>
      ))}
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
    <Section title="Resignation Risk" description="AI-powered early warning">
      <div className="flex gap-4 mb-2">
        <div className="text-center px-4 py-2 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
          <div className="text-2xl font-bold font-mono" style={{ color }}>{prob}%</div>
          <div className="text-[10px] text-gray-400">90-day risk</div>
        </div>
        <div className="flex gap-2">
          <div className="text-center px-3 py-2 rounded-lg bg-gray-100">
            <div className="text-sm font-bold font-mono">{prediction.prob_30d}%</div>
            <div className="text-[10px] text-gray-400">30-day</div>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-gray-100">
            <div className="text-sm font-bold font-mono">{prediction.prob_60d}%</div>
            <div className="text-[10px] text-gray-400">60-day</div>
          </div>
        </div>
      </div>
      {factors.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contributing factors</div>
          {factors.slice(0, 3).map((f, i) => (
            <div key={i} className="text-xs text-gray-500 flex gap-1.5 items-start">
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

function getTalkingPoints(profile, { hasTeeSheet = true, hasFb = true, hasEmail = true } = {}) {
  const points = [];
  const archetype = profile.archetype || '';
  const score = profile.healthScore ?? 50;
  const risks = profile.riskSignals || [];
  const riskText = risks.map(r => (r.label || '').toLowerCase()).join(' ');

  if (riskText.includes('complaint') || riskText.includes('unresolved')) {
    points.push('Acknowledge the specific service issue and apologize directly');
    points.push('Share what the club has done to prevent recurrence');
  }
  if (hasTeeSheet && (riskText.includes('pace') || riskText.includes('slow'))) {
    points.push('Acknowledge pace-of-play frustration \u2014 mention ranger deployment improvements');
    points.push('Offer preferred tee time slot hold to avoid peak congestion');
  }
  if (hasFb && (riskText.includes('dining') || riskText.includes('f&b') || riskText.includes('grill'))) {
    points.push('Invite to an upcoming Chef\'s Table or wine dinner event');
    points.push('Mention new menu additions or seasonal specials');
  }
  if (hasTeeSheet && (riskText.includes('golf') || riskText.includes('round') || riskText.includes('tee'))) {
    points.push('Ask about any scheduling changes or course condition concerns');
    if (archetype === 'Weekend Warrior') points.push('Offer a preferred Saturday morning tee time hold');
  }
  if (hasEmail && (riskText.includes('email') || riskText.includes('newsletter') || riskText.includes('open rate'))) {
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
    return <span className="text-sm text-gray-500">No outreach history recorded yet.</span>;
  }

  return (
    <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
      {outreachEvents.map((evt, i) => (
        <div key={evt.id || i} className="flex justify-between items-start gap-3 px-2.5 py-2 rounded-lg bg-gray-100 border border-gray-200" style={{ fontSize: '11px', lineHeight: 1.4 }}>
          <div style={{ lineHeight: 1.4 }}>
            <div className="font-semibold text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>{evt.type}</div>
            <div className="text-xs text-gray-500" style={{ fontSize: '10px', lineHeight: 1.4 }}>{evt.detail}</div>
          </div>
          <div className="text-xs text-gray-400 whitespace-nowrap" style={{ fontSize: '10px', lineHeight: 1.4 }}>
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
      months.push(Math.round(baseSpend * activityMultiplier * (0.8 + Math.random() * 0.4)));
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

  // In guided mode, hide categories whose data source isn't connected yet.
  const guidedMode = getDataMode() === 'guided';
  const guidedGateMap = { golf: 'tee-sheet', dining: 'fb', email: 'email', events: 'events', spa: 'spa', courts: 'courts' };
  const visibleCats = guidedMode
    ? SNAPSHOT_CATS.filter(c => !guidedGateMap[c.key] || shouldUseStatic(guidedGateMap[c.key]))
    : SNAPSHOT_CATS;

  const activeCats = visibleCats.filter(c =>
    groups[c.key].length > 0 || hints[c.key] || (famHints[c.key] && famHints[c.key].length > 0)
  );
  const emptyCats = visibleCats.filter(c =>
    groups[c.key].length === 0 && !hints[c.key] && (!famHints[c.key] || famHints[c.key].length === 0)
  );

  if (activeCats.length === 0) return null;

  return (
    <Section title="Member Habits" description="Quick reference">
      <div className="flex flex-col gap-2.5" style={{ fontSize: '12px', lineHeight: 1.4, gap: '4px' }}>
        {activeCats.map(cat => {
          const items = groups[cat.key];
          const hint = hints[cat.key];
          const fam = famHints[cat.key];
          return (
            <div key={cat.key} className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              <div className="flex items-center gap-1.5 mb-1" style={{ lineHeight: 1.4, gap: '4px' }}>
                <span className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>{cat.icon}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: cat.color, lineHeight: 1.4 }}>{cat.label}</span>
                {items.length > 0 && (
                  <span className="ml-auto text-[10px] text-gray-400 bg-white rounded-full px-1.5 py-px border border-gray-200" style={{ lineHeight: 1.4, fontSize: '10px' }}>{items.length}</span>
                )}
              </div>
              {hint && (
                <div className="text-xs text-gray-500 italic border-l-2 pl-2 mb-1" style={{ borderColor: `${cat.color}60`, fontSize: '10px', lineHeight: 1.4 }}>
                  {hint}
                </div>
              )}
              {fam && fam.map((fm, i) => (
                <div key={i} className="text-[11px] text-gray-400 italic border-l-2 pl-2 mb-1 border-purple-300" style={{ lineHeight: 1.4, fontSize: '10px' }}>
                  {fm.name}: {fm.notes}
                </div>
              ))}
              {items.length > 0 && (
                <div className="flex flex-col gap-1" style={{ lineHeight: 1.4, gap: '4px' }}>
                  {items.slice(0, 2).map((evt, i) => (
                    <div key={i} className="flex gap-2 items-start text-[11px]" style={{ lineHeight: 1.4, gap: '4px' }}>
                      <span className="shrink-0 text-gray-400 font-mono whitespace-nowrap" style={{ lineHeight: 1.4, fontSize: '10px' }}>{evt.timestamp || formatDate(evt.date)}</span>
                      <span className="text-gray-600" style={{ lineHeight: 1.4 }}>{evt.detail || evt.event || evt.description}</span>
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-[10px] text-gray-400">+{items.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {emptyCats.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100" style={{ fontSize: '11px', lineHeight: 1.4, gap: '4px' }}>
            {emptyCats.map(c => (
              <span key={c.key} className="text-[10px] text-gray-300 flex items-center gap-0.5" style={{ lineHeight: 1.4, gap: '4px' }}>
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
      <div className="p-6 text-gray-400">
        Select a member to view their profile.
      </div>
    );
  }

  const [noteText, setNoteText] = useState('');
  const initials = (profile.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2);
  const isDrawerLayout = layout === 'drawer';

  const guidedMode = getDataMode() === 'guided';
  const hasTeeSheet = !guidedMode || shouldUseStatic('tee-sheet');
  const hasFb = !guidedMode || shouldUseStatic('fb');
  const hasEmail = !guidedMode || shouldUseStatic('email');
  const hasEvents = !guidedMode || shouldUseStatic('events');

  const topMetrics = useMemo(() => [
    { label: 'Annual dues', value: Number.isFinite(profile.duesAnnual) ? `$${Math.round(profile.duesAnnual).toLocaleString()}` : '\u2014' },
    { label: 'Annual value', value: (hasTeeSheet && hasFb) ? (Number.isFinite(profile.memberValueAnnual) ? `$${Math.round(profile.memberValueAnnual).toLocaleString()}` : '\u2014') : '\u2014' },
    { label: 'Last seen', value: hasTeeSheet ? (profile.lastSeenLocation ?? '\u2014') : '\u2014' },
  ], [profile.duesAnnual, profile.memberValueAnnual, profile.lastSeenLocation, hasTeeSheet, hasFb]);

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
    // Gate: hide risk signal if its source integration isn't connected
    if (guidedMode) {
      const src = (topSignal.source || '').toLowerCase();
      const lbl = (topSignal.label || '').toLowerCase();
      if ((src.includes('tee') || src.includes('golf') || lbl.includes('round') || lbl.includes('golf')) && !hasTeeSheet) return null;
      if ((src === 'pos' || lbl.includes('dining') || lbl.includes('f&b') || lbl.includes('food') || lbl.includes('spend')) && !hasFb) return null;
      if ((src.includes('email') || lbl.includes('email') || lbl.includes('newsletter') || lbl.includes('open rate')) && !hasEmail) return null;
    }
    return topSignal.label;
  }, [profile.riskSignals, guidedMode, hasTeeSheet, hasFb, hasEmail]);

  return (
    <div className="flex flex-col gap-4" style={{ gap: '10px' }}>
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div className="px-3.5 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/[0.13] border-l-[3px] border-l-red-500 text-sm text-[#1a1a2e]" style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}>
          <span className="font-bold text-error-500 mr-1.5">Flagged:</span>
          {contextReason}
        </div>
      )}

      <div className="flex justify-between items-start gap-4 flex-wrap" style={{ flexWrap: 'nowrap', gap: '8px' }}>
        <div className="flex gap-4 items-center">
          <div className={`${layout === 'page' ? 'w-20 h-20 text-[28px]' : 'w-10 h-10 text-sm'} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[#1a1a2e]`}>
            {initials}
          </div>
          <div>
          <div className="text-sm text-gray-400 tracking-wide uppercase" style={{ display: 'none', fontSize: '10px' }}>Member Snapshot</div>
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
          <div className="text-sm text-gray-500" style={{ fontSize: '10px' }}>
            {profile.tier} {'\u2022'} Joined {formatDate(profile.joinDate)}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap" style={{ gap: '6px', marginTop: '6px' }}>
            {topMetrics.map((metric) => (
              <div key={metric.label} className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                <div className="text-xs text-gray-400 uppercase tracking-wider" style={{ fontSize: '10px', letterSpacing: '0.05em', marginBottom: '1px' }}>{metric.label}</div>
                <div className="text-sm font-semibold" style={{ fontSize: '13px', lineHeight: 1.2, fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div className="text-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1" style={{ fontSize: '10px' }}>Health score</div>
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

      {/* Health Score Breakdown — only show when engagement data sources are imported */}
      {(profile.golfScore || profile.diningScore || shouldUseStatic('tee-sheet') || shouldUseStatic('fb')) && (
        <Section title="Health Score Breakdown" description="Weighted engagement across 4 dimensions">
          <HealthDimensionGrid profile={profile} />
        </Section>
      )}

      {/* Resignation Risk — from predict-churn API */}
      <ChurnPredictionBadge profile={profile} />

      <Section title="Contact" description={`Preferred channel: ${profile.contact?.preferredChannel ?? '\u2014'}`}>
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
      {profile.family && profile.family.length > 0 && (
        <Section title="Household" description={`${profile.family.length + 1} members`} sourceSystems={['Member CRM']}>
          <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
            {/* Aggregate household value */}
            <div className="flex gap-4 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200" style={{ fontSize: '11px', lineHeight: 1.4 }}>
              <div style={{ lineHeight: 1.4 }}>
                <div className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontSize: '10px', lineHeight: 1.4 }}>Household value</div>
                <div className="text-base font-bold font-mono" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                  ${Math.round((profile.duesAnnual || 0) * (1 + (profile.family?.length ?? 0) * 0.6)).toLocaleString()}/yr
                </div>
              </div>
              <div style={{ lineHeight: 1.4 }}>
                <div className="text-xs text-gray-400 uppercase tracking-wide" style={{ fontSize: '10px', lineHeight: 1.4 }}>Health (lowest)</div>
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
                className={`flex justify-between items-center px-3 py-2 rounded-lg border border-gray-200 transition-colors duration-100 ${f.memberId ? 'cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500' : 'cursor-default'}`}
                style={{ fontSize: '11px', lineHeight: 1.4 }}
              >
                <div style={{ lineHeight: 1.4 }}>
                  <div className={`font-semibold text-sm ${f.memberId ? 'text-brand-500' : 'text-[#1a1a2e]'}`} style={{ fontSize: '12px', lineHeight: 1.4 }}>{f.name}</div>
                  <div className="text-xs text-gray-400" style={{ fontSize: '10px', lineHeight: 1.4 }}>{f.relation}</div>
                </div>
                {f.notes && (() => {
                  // Gate household member notes that reference ungated data sources
                  if (guidedMode) {
                    const noteLower = (f.notes || '').toLowerCase();
                    const isDining = noteLower.includes('wine') || noteLower.includes('dinner') || noteLower.includes('grill') || noteLower.includes('dining') || noteLower.includes('chef');
                    const isGolf = noteLower.includes('golf') || noteLower.includes('tee') || noteLower.includes('clinic') || noteLower.includes('round');
                    if (isDining && !hasFb) return null;
                    if (isGolf && !hasTeeSheet) return null;
                  }
                  return (
                    <div className="text-xs text-gray-500 max-w-[50%] text-right" style={{ fontSize: '10px', lineHeight: 1.4 }}>
                      {f.notes}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Archetype Description — Call Prep */}
      {profile.archetype && ARCHETYPE_DESCRIPTIONS[profile.archetype] && (
        <Section title={`Archetype: ${profile.archetype}`} description="Behavioral profile">
          <div className="text-sm text-gray-500 leading-relaxed" style={{ fontSize: '10px', lineHeight: 1.4 }}>
            {ARCHETYPE_DESCRIPTIONS[profile.archetype]}
          </div>
        </Section>
      )}

      {/* Spending Trend — only show when POS/F&B data is imported */}
      {(shouldUseStatic('fb') || profile.spendHistory) && (
        <Section title="Spending Trend" description="6-month direction">
          <SpendTrendSparkline profile={profile} />
        </Section>
      )}

      {/* Recommended Talking Points */}
      <Section title="Talking Points" description="Personalized for this call">
        <div className="flex flex-col gap-1.5" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {getTalkingPoints(profile, { hasTeeSheet, hasFb, hasEmail }).map((point, i) => (
            <div key={i} className="flex gap-2 items-start px-3 py-2 rounded-lg bg-brand-500/[0.04] border border-brand-500/[0.13]" style={{ fontSize: '11px', lineHeight: 1.4, padding: '6px 10px', marginBottom: '2px' }}>
              <span className="text-brand-500 font-bold text-sm shrink-0" style={{ fontSize: '12px', lineHeight: 1.4 }}>{i + 1}.</span>
              <span className="text-sm text-gray-500 leading-normal" style={{ fontSize: '10px', lineHeight: 1.4 }}>{point}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Outreach History */}
      <Section title="Outreach History" description="Past communications" sourceSystems={['Swoop App']}>
        <OutreachHistory profile={profile} />
      </Section>

      <Section title="Preferences & insights" sourceSystems={['Member CRM']}>
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {profile.preferences?.favoriteSpots && (
            <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Favorite spots:</strong> {profile.preferences.favoriteSpots.join(', ')}
            </div>
          )}
          {profile.preferences?.teeWindows && (getDataMode() !== 'guided' || shouldUseStatic('tee-sheet')) && (
            <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Tee time window:</strong> {profile.preferences.teeWindows}
            </div>
          )}
          {profile.preferences?.dining && (getDataMode() !== 'guided' || shouldUseStatic('fb')) && (
            <div className="text-sm" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <strong>Dining:</strong> {profile.preferences.dining}
            </div>
          )}
          {profile.preferences?.notes && (
            <div className="text-sm text-gray-500" style={{ fontSize: '10px', lineHeight: 1.4 }}>{profile.preferences.notes}</div>
          )}
        </div>
      </Section>

      <Section title="Recent activity" description="Last 30 days" data-section="recent-activity"
        collapsible defaultCollapsed summary={`${(profile.activity ?? []).length} entries`}
        sourceSystems={['Tee Sheet', 'POS', 'Email', 'Events']}>
        <ActivityTimeline activity={guidedMode ? (profile.activity ?? []).filter(a => {
          const t = (a.type || a.domain || '').toLowerCase();
          if ((t.includes('golf') || t.includes('round') || t.includes('tee')) && !hasTeeSheet) return false;
          if ((t.includes('dining') || t.includes('f&b') || t.includes('grill') || t.includes('lounge')) && !hasFb) return false;
          if ((t.includes('email') || t.includes('newsletter')) && !hasEmail) return false;
          if ((t.includes('event') || t.includes('social')) && !hasEvents) return false;
          return true;
        }) : profile.activity} />
      </Section>

      <Section
        title="First Domino — Engagement Decay Sequence"
        description="Cross-domain timeline · Pillar 2: FIX IT"
        collapsible
        defaultCollapsed={(profile.healthScore ?? 100) >= 50}
        summary="Expand to view"
        sourceSystems={['Tee Sheet', 'POS', 'Email', 'Analytics']}
      >
        <MemberJourneyTimeline profile={profile} />
      </Section>

      <Section title="Risk signals" sourceSystems={['Analytics', 'Tee Sheet', 'POS', 'Email']}>
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {(profile.riskSignals ?? []).filter(signal => {
            if (!guidedMode) return true;
            const src = (signal.source || '').toLowerCase();
            const lbl = (signal.label || '').toLowerCase();
            if ((src.includes('tee') || src.includes('golf') || lbl.includes('round') || lbl.includes('golf') || lbl.includes('handicap')) && !hasTeeSheet) return false;
            if ((src === 'pos' || lbl.includes('dining') || lbl.includes('f&b') || lbl.includes('food') || lbl.includes('spend')) && !hasFb) return false;
            if ((src.includes('email') || lbl.includes('email') || lbl.includes('newsletter') || lbl.includes('open rate')) && !hasEmail) return false;
            return true;
          }).map((signal) => (
            <RiskSignalRow key={signal.id} signal={signal} profile={profile} />
          ))}
          {!(profile.riskSignals ?? []).length && <span className="text-gray-500">No active risks.</span>}
        </div>
      </Section>

      <Section title="Staff notes">
        <div className="flex flex-col gap-2" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add a quick staff note..."
            className="w-full min-h-24 rounded-lg border border-gray-200 p-2 text-sm font-sans bg-gray-100 text-[#1a1a2e]"
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
              <div key={note.id} className="border border-gray-200 rounded-lg px-3 py-2.5" style={{ lineHeight: 1.4 }}>
                <div className="font-semibold" style={{ lineHeight: 1.4 }}>{note.author}</div>
                <div className="text-xs text-gray-400" style={{ fontSize: '10px', lineHeight: 1.4 }}>
                  {note.department ?? 'General'} {'\u00B7'} {formatDateTime(note.timestamp)}
                </div>
                <div className="mt-1.5" style={{ lineHeight: 1.4 }}>{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span className="text-gray-500">No notes yet.</span>}
          </div>
        </div>
      </Section>

      <div className={isDrawerLayout ? 'sticky bottom-0 bg-white pt-4 pb-2 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] z-[5]' : ''} style={{ paddingTop: '8px', paddingBottom: '6px' }}>
        <Section title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onQuickAction?.(profile.memberId, action.key)}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-100 cursor-pointer font-semibold"
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
            className="border-none bg-transparent text-gray-400 cursor-pointer font-semibold focus-visible:ring-2 focus-visible:ring-brand-500"
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
        <div className="p-8 text-center text-gray-400">
          <div className="text-2xl mb-3">Something went wrong</div>
          <div className="text-sm mb-4">Unable to load this member profile.</div>
          <button onClick={this.props.onClose} className="px-5 py-2 rounded-md border border-gray-200 bg-white cursor-pointer text-[#1a1a2e]">Close</button>
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
    background: '#ffffff',
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.25)',
    borderLeft: '1px solid #E5E7EB',
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
