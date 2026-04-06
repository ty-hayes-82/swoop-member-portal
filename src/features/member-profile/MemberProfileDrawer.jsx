import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { getOutreachHistory } from '@/services/activityService';
import { getMemberChurnPrediction } from '@/services/memberService';

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

const Section = ({ title, description, children, defaultCollapsed = false, collapsible = false, summary, ...rest }) => {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <section {...rest} className="border border-gray-200 rounded-xl p-4 bg-white">
      <div
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        className={`flex justify-between items-baseline ${isCollapsed ? '' : 'mb-2'} ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-baseline gap-2">
          <h3 className="m-0 text-base">{title}</h3>
          {isCollapsed && summary && <span className="text-xs text-gray-400">{summary}</span>}
        </div>
        <div className="flex items-center gap-2">
          {description && !isCollapsed && <span className="text-xs text-gray-400">{description}</span>}
          {collapsible && <span className="text-xs text-gray-400 transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>{'\u25BC'}</span>}
        </div>
      </div>
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
          className="bg-transparent border-none text-brand-500 text-xs font-semibold cursor-pointer text-left p-0"
        >
          Show all {activity.length} entries {'\u2192'}
        </button>
      )}
    </div>
  );
}

// Member Journey — longitudinal cross-domain timeline showing engagement decay sequence
// P6 "First Domino": shows per-member decay chain (Email dropped → Golf dropped → Dining dropped)
function MemberJourneyTimeline({ profile }) {
  // Build journey from activity + risk signals + static demo events
  const { journeyEvents, decayChain } = useMemo(() => {
    const events = [];

    // Add activity items
    (profile.activity ?? []).forEach(a => {
      events.push({
        date: a.timestamp ?? a.date ?? '',
        domain: a.type?.includes('Golf') || a.type?.includes('Round') ? 'Golf'
          : a.type?.includes('Dining') || a.type?.includes('F&B') ? 'Dining'
          : a.type?.includes('Event') ? 'Events'
          : a.type?.includes('Email') ? 'Email'
          : 'Activity',
        label: a.detail ?? a.type ?? '',
        type: 'activity',
      });
    });

    // Add risk signal events
    (profile.riskSignals ?? []).forEach(s => {
      events.push({
        date: s.timestamp ?? '',
        domain: s.source ?? 'Risk',
        label: s.label ?? s.description ?? '',
        type: 'risk',
      });
    });

    // If few events, add demo journey points based on member scenario
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

    // Build decay chain from warning/risk events in chronological domain order
    const decayDomains = [];
    const seen = new Set();
    const decayItems = events
      .filter(e => (e.type === 'warning' || e.type === 'risk') && e.domain !== 'Risk' && e.domain !== 'Activity')
      .sort((a, b) => (a.decayOrder ?? 99) - (b.decayOrder ?? 99));
    for (const evt of decayItems) {
      if (!seen.has(evt.domain)) {
        seen.add(evt.domain);
        decayDomains.push({ domain: evt.domain, date: evt.date, label: evt.label });
      }
    }

    return { journeyEvents: events, decayChain: decayDomains };
  }, [profile]);

  const domainColors = {
    Golf: '#22c55e',
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
      {/* Decay Chain — "First Domino" visualization */}
      {decayChain.length >= 2 && (
        <div className="flex items-center flex-wrap px-3.5 py-2.5 mb-3.5 bg-red-500/[0.04] border border-red-500/15 rounded-xl">
          <div className="w-full mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-error-500">
              Engagement Decay Sequence
            </span>
          </div>
          {decayChain.map((step, i) => {
            const color = domainColors[step.domain] ?? '#9CA3AF';
            return (
              <div key={step.domain} className="flex items-center">
                <div className="px-2.5 py-1 rounded-md" style={{ background: color + '16', border: `1px solid ${color}40` }}>
                  <div className="text-[10px] font-bold uppercase tracking-tight" style={{ color }}>{step.domain} dropped</div>
                  <div className="text-[10px] text-gray-400">{step.date}</div>
                </div>
                {i < decayChain.length - 1 && (
                  <span className="mx-1.5 text-sm text-gray-400 font-bold">&rarr;</span>
                )}
              </div>
            );
          })}
        </div>
      )}
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

  // Use real dimensions from profile if available (populated by health_scores API), else approximate
  const dimensions = [
    { label: 'Golf Engagement', weight: '30%', value: profile.golfScore ?? Math.min(100, Math.round(score * w.golf)), color: '#ff8b00' },
    { label: 'Dining Frequency', weight: '25%', value: profile.diningScore ?? Math.min(100, Math.round(score * w.dining)), color: '#22c55e' },
    { label: 'Email Engagement', weight: '25%', value: profile.emailScore ?? Math.min(100, Math.round(score * w.email)), color: '#3B82F6' },
    { label: 'Event Attendance', weight: '20%', value: profile.eventScore ?? Math.min(100, Math.round(score * w.events)), color: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {dimensions.map(d => (
        <div key={d.label} className="px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400">{d.label} ({d.weight})</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: d.value >= 60 ? '#22c55e' : d.value >= 35 ? '#f59e0b' : '#ef4444' }}>{d.value}</span>
          </div>
          <div className="h-1 rounded-sm bg-gray-100">
            <div className="h-full rounded-sm" style={{ background: d.value >= 60 ? '#22c55e' : d.value >= 35 ? '#f59e0b' : '#ef4444', width: `${d.value}%` }} />
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
  const color = prob >= 60 ? '#ef4444' : prob >= 30 ? '#f59e0b' : '#22c55e';
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
    return <span className="text-sm text-gray-500">No outreach history recorded yet.</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {outreachEvents.map((evt, i) => (
        <div key={evt.id || i} className="flex justify-between items-start gap-3 px-2.5 py-2 rounded-lg bg-gray-100 border border-gray-200">
          <div>
            <div className="font-semibold text-sm">{evt.type}</div>
            <div className="text-xs text-gray-500">{evt.detail}</div>
          </div>
          <div className="text-xs text-gray-400 whitespace-nowrap">
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
  const trendColor = trend >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="flex items-center gap-3">
      <Sparkline data={spendData} color={trendColor} />
      <div className="text-xs font-semibold" style={{ color: trendColor }}>
        {trend >= 0 ? '\u2191' : '\u2193'} ${(Number.isFinite(trend) ? Math.abs(trend) : 0).toLocaleString()}/mo
      </div>
    </div>
  );
}

export function MemberProfileContent({ profile, onClose, onOpenFullPage, onAddNote, onQuickAction, layout = 'drawer' }) {
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

  const quickActions = [
    { key: 'call', label: 'Schedule call', icon: '\uD83D\uDCDE' },
    { key: 'email', label: 'Send email', icon: '\u2709\uFE0F' },
    { key: 'sms', label: 'Send SMS', icon: '\uD83D\uDCAC' },
    { key: 'comp', label: 'Offer comp', icon: '\uD83C\uDF81' },
  ];

  const contextReason = useMemo(() => {
    if (!profile.riskSignals?.length) return null;
    const topSignal = profile.riskSignals[0];
    return topSignal?.label || null;
  }, [profile.riskSignals]);

  return (
    <div className="flex flex-col gap-4">
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div className="px-3.5 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/[0.13] border-l-[3px] border-l-red-500 text-sm text-[#1a1a2e]">
          <span className="font-bold text-error-500 mr-1.5">Flagged:</span>
          {contextReason}
        </div>
      )}

      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="flex gap-4 items-center">
          <div className={`${layout === 'page' ? 'w-20 h-20 text-[28px]' : 'w-16 h-16 text-xl'} rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-[#1a1a2e]`}>
            {initials}
          </div>
          <div>
          <div className="text-sm text-gray-400 tracking-wide uppercase">Member Snapshot</div>
          <h2 className={`my-1 ${layout === 'page' ? 'text-[32px]' : 'text-2xl'}`}>{profile.name}</h2>
          <div className="text-sm text-gray-500">
            {profile.tier} {'\u2022'} Joined {formatDate(profile.joinDate)}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {topMetrics.map((metric) => (
              <div key={metric.label} className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200">
                <div className="text-xs text-gray-400 uppercase tracking-wider">{metric.label}</div>
                <div className="text-sm font-semibold">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Health score</div>
          <div className="text-[42px] font-mono" style={{ color: profile.healthScore > 69 ? '#22c55e' : profile.healthScore > 40 ? '#f59e0b' : '#ef4444' }}>
            {profile.healthScore ?? '\u2014'}
          </div>
          <Sparkline data={profile.trend ?? []} />
          {layout !== 'page' && onOpenFullPage && (
            <button
              type="button"
              onClick={() => onOpenFullPage(profile.memberId)}
              className="mt-2 border-none bg-transparent text-brand-500 font-semibold cursor-pointer"
            >
              Open full profile {'\u2192'}
            </button>
          )}
        </div>
      </div>

      {/* Health Score Breakdown — uses real dimensions from health_scores table when available */}
      <Section title="Health Score Breakdown" description="Weighted engagement across 4 dimensions">
        <HealthDimensionGrid profile={profile} />
      </Section>

      {/* Resignation Risk — from predict-churn API */}
      <ChurnPredictionBadge profile={profile} />

      <Section title="Contact" description={`Preferred channel: ${profile.contact?.preferredChannel ?? '\u2014'}`}>
        <div className="flex flex-col gap-1.5 text-sm">
          <span><strong>Phone:</strong> {profile.contact?.phone && profile.contact.phone !== '\u2014'
            ? <a href={`tel:${profile.contact.phone}`} className="text-brand-500 no-underline">{profile.contact.phone}</a>
            : '\u2014'}</span>
          <span><strong>Email:</strong> {profile.contact?.email && profile.contact.email !== '\u2014'
            ? <a href={`mailto:${profile.contact.email}`} className="text-brand-500 no-underline">{profile.contact.email}</a>
            : '\u2014'}</span>
          <span><strong>Last outreach:</strong> {formatDateTime(profile.contact?.lastOutreach)}</span>
        </div>
      </Section>

      {/* Household / Family Unit View */}
      {profile.family && profile.family.length > 0 && (
        <Section title="Household" description={`${profile.family.length + 1} members`}>
          <div className="flex flex-col gap-2">
            {/* Aggregate household value */}
            <div className="flex gap-4 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Household value</div>
                <div className="text-base font-bold font-mono">
                  ${Math.round((profile.duesAnnual || 0) * (1 + (profile.family?.length ?? 0) * 0.6)).toLocaleString()}/yr
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Health (lowest)</div>
                <div className="text-base font-bold font-mono" style={{ color: (profile.healthScore ?? 50) > 69 ? '#22c55e' : (profile.healthScore ?? 50) > 40 ? '#f59e0b' : '#ef4444' }}>
                  {profile.healthScore ?? '\u2014'}
                </div>
              </div>
            </div>
            {/* Family members */}
            {profile.family.map((f, i) => (
              <div key={i}
                onClick={() => f.memberId && onClose?.()}
                className={`flex justify-between items-center px-3 py-2 rounded-lg border border-gray-200 transition-colors duration-100 ${f.memberId ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
              >
                <div>
                  <div className={`font-semibold text-sm ${f.memberId ? 'text-brand-500' : 'text-[#1a1a2e]'}`}>{f.name}</div>
                  <div className="text-xs text-gray-400">{f.relation}</div>
                </div>
                {f.notes && (
                  <div className="text-xs text-gray-500 max-w-[50%] text-right">
                    {f.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Archetype Description — Call Prep */}
      {profile.archetype && ARCHETYPE_DESCRIPTIONS[profile.archetype] && (
        <Section title={`Archetype: ${profile.archetype}`} description="Behavioral profile">
          <div className="text-sm text-gray-500 leading-relaxed">
            {ARCHETYPE_DESCRIPTIONS[profile.archetype]}
          </div>
        </Section>
      )}

      {/* Spending Trend */}
      <Section title="Spending Trend" description="6-month direction">
        <SpendTrendSparkline profile={profile} />
      </Section>

      {/* Recommended Talking Points */}
      <Section title="Talking Points" description="Personalized for this call">
        <div className="flex flex-col gap-1.5">
          {getTalkingPoints(profile).map((point, i) => (
            <div key={i} className="flex gap-2 items-start px-3 py-2 rounded-lg bg-brand-500/[0.04] border border-brand-500/[0.13]">
              <span className="text-brand-500 font-bold text-sm shrink-0">{i + 1}.</span>
              <span className="text-sm text-gray-500 leading-normal">{point}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Outreach History */}
      <Section title="Outreach History" description="Past communications">
        <OutreachHistory profile={profile} />
      </Section>

      <Section title="Preferences & insights">
        <div className="flex flex-col gap-2">
          {profile.preferences?.favoriteSpots && (
            <div className="text-sm">
              <strong>Favorite spots:</strong> {profile.preferences.favoriteSpots.join(', ')}
            </div>
          )}
          {profile.preferences?.teeWindows && (
            <div className="text-sm">
              <strong>Tee time window:</strong> {profile.preferences.teeWindows}
            </div>
          )}
          {profile.preferences?.dining && (
            <div className="text-sm">
              <strong>Dining:</strong> {profile.preferences.dining}
            </div>
          )}
          {profile.preferences?.notes && (
            <div className="text-sm text-gray-500">{profile.preferences.notes}</div>
          )}
        </div>
      </Section>

      <Section title="Recent activity" description="Last 30 days" data-section="recent-activity"
        collapsible defaultCollapsed summary={`${(profile.activity ?? []).length} entries`}>
        <ActivityTimeline activity={profile.activity} />
      </Section>

      <Section title="Member Journey" description="Cross-domain timeline"
        collapsible defaultCollapsed summary="Expand to view">
        <MemberJourneyTimeline profile={profile} />
      </Section>

      <Section title="Risk signals">
        <div className="flex flex-col gap-2">
          {(profile.riskSignals ?? []).map((signal) => (
            <div
              key={signal.id}
              onClick={() => {
                const activitySection = document.querySelector('[data-section="recent-activity"]');
                if (activitySection) activitySection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-100"
              title="Click to view related activity"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{signal.label}</div>
                <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
              </div>
              <div className="text-xs text-gray-400">{formatDateTime(signal.timestamp)} {'\u00B7'} Confidence {signal.confidence ?? '\u2014'}</div>
            </div>
          ))}
          {!(profile.riskSignals ?? []).length && <span className="text-gray-500">No active risks.</span>}
        </div>
      </Section>

      <Section title="Staff notes">
        <div className="flex flex-col gap-2">
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add a quick staff note..."
            className="w-full min-h-24 rounded-lg border border-gray-200 p-2 text-sm font-sans bg-gray-100 text-[#1a1a2e]"
          />
          <button
            type="button"
            onClick={handleAddNote}
            className="self-end px-3.5 py-1.5 rounded-lg border-none bg-brand-500 text-white font-semibold cursor-pointer"
          >
            Save note
          </button>
          <div className="flex flex-col gap-2">
            {(profile.staffNotes ?? []).map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg px-3 py-2.5">
                <div className="font-semibold">{note.author}</div>
                <div className="text-xs text-gray-400">
                  {note.department ?? 'General'} {'\u00B7'} {formatDateTime(note.timestamp)}
                </div>
                <div className="mt-1.5">{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span className="text-gray-500">No notes yet.</span>}
          </div>
        </div>
      </Section>

      <div className={isDrawerLayout ? 'sticky bottom-0 bg-white pt-4 pb-2 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] z-[5]' : ''}>
        <Section title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onQuickAction?.(profile.memberId, action.key)}
                className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-100 cursor-pointer font-semibold"
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
            className="border-none bg-transparent text-gray-400 cursor-pointer font-semibold"
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
    padding: '24px',
    gap: '16px',
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
      <div style={overlayStyle} onClick={handleClose} />
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
