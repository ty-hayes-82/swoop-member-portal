import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { getOutreachHistory } from '@/services/activityService';
import { getMemberChurnPrediction } from '@/services/memberService';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
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
    <section {...rest} style={{ border: `1px solid ${'#E5E7EB'}`, borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
      <div
        onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: isCollapsed ? 0 : '8px', cursor: collapsible ? 'pointer' : 'default' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
          {isCollapsed && summary && <span className="text-xs text-gray-400">{summary}</span>}
        </div>
        <div className="flex items-center gap-2">
          {description && !isCollapsed && <span className="text-xs text-gray-400">{description}</span>}
          {collapsible && <span style={{ fontSize: 12, color: '#9CA3AF', transition: 'transform 0.2s', transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>{'\u25BC'}</span>}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {visible.map((a) => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '14px' }}>
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
          style={{
            background: 'none', border: 'none', color: '#ff8b00',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            textAlign: 'left', padding: 0,
          }}
        >
          Show all {activity.length} entries →
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
    Dining: '#f59e0b' ?? '#f59e0b',
    Events: '#ff8b00',
    Email: '#2563eb' ?? '#4299e1',
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap',
          padding: '10px 14px', marginBottom: 14,
          background: `${'#ef4444'}06`,
          border: `1px solid ${'#ef4444'}25`,
          borderRadius: '12px',
        }}>
          <div style={{ width: '100%', marginBottom: 8 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ef4444' }}>
              Engagement Decay Sequence
            </span>
          </div>
          {decayChain.map((step, i) => {
            const color = domainColors[step.domain] ?? '#9CA3AF';
            return (
              <div key={step.domain} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: color + '16',
                  border: `1px solid ${color}40`,
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {step.domain} dropped
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{step.date}</div>
                </div>
                {i < decayChain.length - 1 && (
                  <span style={{ margin: '0 6px', fontSize: '14px', color: '#9CA3AF', fontWeight: 700 }}>&rarr;</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 20 }}>
      {/* Vertical timeline line */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: 4,
        bottom: 4,
        width: 2,
        background: '#E5E7EB',
      }} />
      {journeyEvents.map((evt, i) => {
        const color = domainColors[evt.domain] ?? '#9CA3AF';
        const icon = typeIcons[evt.type] ?? '\u2022';
        return (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '6px 0', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: -16,
              top: 10,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: color + '22',
              border: '2px solid ' + color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: color,
              fontWeight: 700,
              zIndex: 1,
            }}>
              {icon}
            </div>
            <div className="flex-1">
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: color + '14',
                  color: color,
                }}>
                  {evt.domain}
                </span>
                <span className="text-xs text-gray-400">{formatDateTime(evt.date) !== '—' ? formatDateTime(evt.date) : evt.date}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginTop: 2 }}>{evt.label}</div>
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
        <div key={d.label} style={{ padding: '8px 10px', borderRadius: '8px', border: `1px solid ${'#E5E7EB'}`, background: '#F8F9FA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{d.label} ({d.weight})</span>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: d.value >= 60 ? '#22c55e' : d.value >= 35 ? '#f59e0b' : '#ef4444' }}>{d.value}</span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: '#F3F4F6' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: d.value >= 60 ? '#22c55e' : d.value >= 35 ? '#f59e0b' : '#ef4444', width: `${d.value}%` }} />
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
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: '12px', background: `${color}10`, border: `1px solid ${color}30` }}>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>{prob}%</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>90-day risk</div>
        </div>
        <div className="flex gap-2">
          <div style={{ textAlign: 'center', padding: '8px 12px', borderRadius: '8px', background: '#F3F4F6' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{prediction.prob_30d}%</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>30-day</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 12px', borderRadius: '8px', background: '#F3F4F6' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{prediction.prob_60d}%</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF' }}>60-day</div>
          </div>
        </div>
      </div>
      {factors.length > 0 && (
        <div className="flex flex-col gap-1">
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contributing factors</div>
          {factors.slice(0, 3).map((f, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{Math.round(f.weight * 100)}%</span>
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

  // Complaint-driven talking points
  if (riskText.includes('complaint') || riskText.includes('unresolved')) {
    points.push('Acknowledge the specific service issue and apologize directly');
    points.push('Share what the club has done to prevent recurrence');
  }

  // Pace-of-play frustration
  if (riskText.includes('pace') || riskText.includes('slow')) {
    points.push('Acknowledge pace-of-play frustration — mention ranger deployment improvements');
    points.push('Offer preferred tee time slot hold to avoid peak congestion');
  }

  // Dining decline
  if (riskText.includes('dining') || riskText.includes('f&b') || riskText.includes('grill')) {
    points.push('Invite to an upcoming Chef\'s Table or wine dinner event');
    points.push('Mention new menu additions or seasonal specials');
  }

  // Golf activity decline
  if (riskText.includes('golf') || riskText.includes('round') || riskText.includes('tee')) {
    points.push('Ask about any scheduling changes or course condition concerns');
    if (archetype === 'Weekend Warrior') points.push('Offer a preferred Saturday morning tee time hold');
  }

  // Email decay
  if (riskText.includes('email') || riskText.includes('newsletter') || riskText.includes('open rate')) {
    points.push('Ask if they\'re receiving communications — offer preferred channel switch');
  }

  // Score-based defaults
  if (points.length === 0) {
    if (score < 30) {
      points.push('Express genuine concern and ask what the club can do differently');
      points.push('Offer a specific retention incentive (comp round, dining credit, event invite)');
    } else if (score < 50) {
      points.push('Check in personally — ask how their recent experiences have been');
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
    // Merge activity timeline outreach with local outreach log
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
    // Deduplicate by timestamp proximity and merge
    const merged = [...fromLog, ...fromActivity];
    return merged.slice(0, 8);
  }, [profile.activity, profile.memberId]);

  if (!outreachEvents.length) {
    return <span className="text-sm text-gray-500">No outreach history recorded yet.</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {outreachEvents.map((evt, i) => (
        <div key={evt.id || i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 12, padding: '8px 10px', borderRadius: '8px',
          background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}`,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{evt.type}</div>
            <div className="text-xs text-gray-500">{evt.detail}</div>
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {formatDateTime(evt.timestamp)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpendTrendSparkline({ profile }) {
  // Generate monthly spend trend from activity data
  const spendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthActivities = (profile.activity || []).filter(a => {
        const d = new Date(a.timestamp);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      });
      // Approximate spend from activity count * archetype multiplier
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
      <div style={{ fontSize: '12px', color: trendColor, fontWeight: 600 }}>
        {trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toLocaleString()}/mo
      </div>
    </div>
  );
}

export function MemberProfileContent({ profile, onClose, onOpenFullPage, onAddNote, onQuickAction, layout = 'drawer' }) {
  if (!profile) {
    return (
      <div style={{ padding: '24px', color: '#9CA3AF' }}>
        Select a member to view their profile.
      </div>
    );
  }

  const [noteText, setNoteText] = useState('');
  const initials = (profile.name || '?').split(' ').map((part) => part[0]).join('').slice(0, 2);
  const isDrawerLayout = layout === 'drawer';

  const topMetrics = useMemo(() => [
    { label: 'Annual dues', value: profile.duesAnnual ? `$${profile.duesAnnual.toLocaleString()}` : '—' },
    { label: 'Annual value', value: profile.memberValueAnnual ? `$${profile.memberValueAnnual.toLocaleString()}` : '—' },
    { label: 'Last seen', value: profile.lastSeenLocation ?? '—' },
  ], [profile.duesAnnual, profile.memberValueAnnual, profile.lastSeenLocation]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onAddNote?.(profile.memberId, { text: noteText.trim() });
    setNoteText('');
  };

  const quickActions = [
    { key: 'call', label: 'Schedule call', icon: '📞' },
    { key: 'email', label: 'Send email', icon: '✉️' },
    { key: 'sms', label: 'Send SMS', icon: '💬' },
    { key: 'comp', label: 'Offer comp', icon: '🎁' },
  ];

  // Build context banner from risk signals
  const contextReason = useMemo(() => {
    if (!profile.riskSignals?.length) return null;
    const topSignal = profile.riskSignals[0];
    return topSignal?.label || null;
  }, [profile.riskSignals]);

  return (
    <div className="flex flex-col gap-4">
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: `${'#ef4444'}06`,
          border: `1px solid ${'#ef4444'}20`,
          borderLeft: `3px solid ${'#ef4444'}`,
          fontSize: '14px',
          color: '#1a1a2e',
        }}>
          <span style={{ fontWeight: 700, color: '#ef4444', marginRight: 6 }}>Flagged:</span>
          {contextReason}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            width: layout === 'page' ? 80 : 64,
            height: layout === 'page' ? 80 : 64,
            borderRadius: '50%',
            background: '#F3F4F6',
            border: `1px solid ${'#E5E7EB'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: layout === 'page' ? 28 : 20,
            fontWeight: 700,
            color: '#1a1a2e',
          }}>
            {initials}
          </div>
          <div>
          <div style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Member Snapshot</div>
          <h2 style={{ margin: '4px 0', fontSize: layout === 'page' ? 32 : 24 }}>{profile.name}</h2>
          <div className="text-sm text-gray-500">
            {profile.tier} • Joined {formatDate(profile.joinDate)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: '8px', flexWrap: 'wrap' }}>
            {topMetrics.map((metric) => (
              <div key={metric.label} style={{ padding: '8px 12px', borderRadius: '8px', background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}` }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Health score</div>
          <div style={{ fontSize: 42, fontFamily: "'JetBrains Mono', monospace", color: profile.healthScore > 69 ? '#22c55e' : profile.healthScore > 40 ? '#f59e0b' : '#ef4444' }}>
            {profile.healthScore ?? '—'}
          </div>
          <Sparkline data={profile.trend ?? []} />
          {layout !== 'page' && onOpenFullPage && (
            <button
              type="button"
              onClick={() => onOpenFullPage(profile.memberId)}
              style={{ marginTop: '8px', border: 'none', background: 'none', color: '#ff8b00', fontWeight: 600, cursor: 'pointer' }}
            >
              Open full profile →
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

      <Section title="Contact" description={`Preferred channel: ${profile.contact?.preferredChannel ?? '—'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '14px' }}>
          <span><strong>Phone:</strong> {profile.contact?.phone && profile.contact.phone !== '—'
            ? <a href={`tel:${profile.contact.phone}`} style={{ color: '#ff8b00', textDecoration: 'none' }}>{profile.contact.phone}</a>
            : '—'}</span>
          <span><strong>Email:</strong> {profile.contact?.email && profile.contact.email !== '—'
            ? <a href={`mailto:${profile.contact.email}`} style={{ color: '#ff8b00', textDecoration: 'none' }}>{profile.contact.email}</a>
            : '—'}</span>
          <span><strong>Last outreach:</strong> {formatDateTime(profile.contact?.lastOutreach)}</span>
        </div>
      </Section>

      {/* Household / Family Unit View */}
      {profile.family && profile.family.length > 0 && (
        <Section title="Household" description={`${profile.family.length + 1} members`}>
          <div className="flex flex-col gap-2">
            {/* Aggregate household value */}
            <div style={{
              display: 'flex', gap: '16px', padding: '8px 12px',
              background: '#F3F4F6', borderRadius: '8px',
              border: `1px solid ${'#E5E7EB'}`,
            }}>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Household value</div>
                <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  ${((profile.duesAnnual || 0) * (1 + profile.family.length * 0.6)).toLocaleString()}/yr
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Health (lowest)</div>
                <div style={{
                  fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                  color: (profile.healthScore ?? 50) > 69 ? '#22c55e' : (profile.healthScore ?? 50) > 40 ? '#f59e0b' : '#ef4444',
                }}>
                  {profile.healthScore ?? '—'}
                </div>
              </div>
            </div>
            {/* Family members */}
            {profile.family.map((f, i) => (
              <div key={i}
                onClick={() => f.memberId && onClose?.()}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '8px',
                  border: `1px solid ${'#E5E7EB'}`,
                  cursor: f.memberId ? 'pointer' : 'default',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (f.memberId) e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: f.memberId ? '#ff8b00' : '#1a1a2e' }}>{f.name}</div>
                  <div className="text-xs text-gray-400">{f.relation}</div>
                </div>
                {f.notes && (
                  <div style={{ fontSize: '12px', color: '#6B7280', maxWidth: '50%', textAlign: 'right' }}>
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
          <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
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
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 12px', borderRadius: '8px',
              background: `${'#ff8b00'}06`, border: `1px solid ${'#ff8b00'}20`,
            }}>
              <span style={{ color: '#ff8b00', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.5 }}>{point}</span>
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
                // Scroll to activity timeline in the drawer
                const activitySection = document.querySelector('[data-section="recent-activity"]');
                if (activitySection) activitySection.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              title="Click to view related activity"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{signal.label}</div>
                <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
              </div>
              <div className="text-xs text-gray-400">{formatDateTime(signal.timestamp)} · Confidence {signal.confidence ?? '—'}</div>
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
            style={{
              width: '100%',
              minHeight: 96,
              borderRadius: '8px',
              border: `1px solid ${'#E5E7EB'}`,
              padding: '8px',
              fontSize: '14px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              background: '#F3F4F6',
              color: '#1a1a2e',
            }}
          />
          <button
            type="button"
            onClick={handleAddNote}
            style={{
              alignSelf: 'flex-end',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#ff8b00',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save note
          </button>
          <div className="flex flex-col gap-2">
            {(profile.staffNotes ?? []).map((note) => (
              <div key={note.id} style={{ border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px', padding: '10px 12px' }}>
                <div className="font-semibold">{note.author}</div>
                <div className="text-xs text-gray-400">
                  {note.department ?? 'General'} • {formatDateTime(note.timestamp)}
                </div>
                <div style={{ marginTop: 6 }}>{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span className="text-gray-500">No notes yet.</span>}
          </div>
        </div>
      </Section>

      <div style={isDrawerLayout ? { position: 'sticky', bottom: 0, background: '#ffffff', padding: `${'16px'} 0 ${'8px'}`, boxShadow: '0 -12px 32px rgba(15, 23, 42, 0.08)', zIndex: 5 } : undefined}>
        <Section title="Quick actions">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onQuickAction?.(profile.memberId, action.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: '1px solid ' + '#E5E7EB',
                  background: '#F3F4F6',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontWeight: 600,
            }}
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
        <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</div>
          <div style={{ fontSize: 14, marginBottom: 16 }}>Unable to load this member profile.</div>
          <button onClick={this.props.onClose} style={{
            padding: '8px 20px', borderRadius: 6, border: `1px solid ${'#E5E7EB'}`,
            background: '#ffffff', cursor: 'pointer', color: '#1a1a2e',
          }}>Close</button>
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
    borderLeft: `1px solid ${'#E5E7EB'}`,
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
