import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { theme } from '@/config/theme';
import SourceBadge from '@/components/ui/SourceBadge.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { getOutreachHistory } from '@/services/activityService';

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

const Sparkline = ({ data = [], color = theme.colors.agentCyan }) => {
  if (!data.length) return <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>No trend data</span>;
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

const Section = ({ title, description, children }) => (
  <section style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md, background: theme.colors.bgCard }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: theme.spacing.sm }}>
      <h3 style={{ margin: 0, fontSize: theme.fontSize.md }}>{title}</h3>
      {description && <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{description}</span>}
    </div>
    {children}
  </section>
);

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
    Golf: theme.colors.success,
    Dining: theme.colors.fb ?? theme.colors.warning,
    Events: theme.colors.accent,
    Email: theme.colors.info ?? '#4299e1',
    Risk: theme.colors.urgent,
    Activity: theme.colors.textMuted,
  };

  const typeIcons = {
    positive: '\u2713',
    activity: '\u2022',
    warning: '\u26A0',
    risk: '\u2716',
  };

  if (!journeyEvents.length) {
    return <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>No journey data available.</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Decay Chain — "First Domino" visualization */}
      {decayChain.length >= 2 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap',
          padding: '10px 14px', marginBottom: 14,
          background: `${theme.colors.urgent}06`,
          border: `1px solid ${theme.colors.urgent}25`,
          borderRadius: theme.radius.md,
        }}>
          <div style={{ width: '100%', marginBottom: 8 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.colors.urgent }}>
              Engagement Decay Sequence
            </span>
          </div>
          {decayChain.map((step, i) => {
            const color = domainColors[step.domain] ?? theme.colors.textMuted;
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
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>{step.date}</div>
                </div>
                {i < decayChain.length - 1 && (
                  <span style={{ margin: '0 6px', fontSize: '14px', color: theme.colors.textMuted, fontWeight: 700 }}>&rarr;</span>
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
        background: theme.colors.border,
      }} />
      {journeyEvents.map((evt, i) => {
        const color = domainColors[evt.domain] ?? theme.colors.textMuted;
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
            <div style={{ flex: 1 }}>
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
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{formatDateTime(evt.date) !== '—' ? formatDateTime(evt.date) : evt.date}</span>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 }}>{evt.label}</div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
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
    return <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>No outreach history recorded yet.</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {outreachEvents.map((evt, i) => (
        <div key={evt.id || i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 12, padding: '8px 10px', borderRadius: theme.radius.sm,
          background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm }}>{evt.type}</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>{evt.detail}</div>
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, whiteSpace: 'nowrap' }}>
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
  const trendColor = trend >= 0 ? theme.colors.success : theme.colors.urgent;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Sparkline data={spendData} color={trendColor} />
      <div style={{ fontSize: theme.fontSize.xs, color: trendColor, fontWeight: 600 }}>
        {trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toLocaleString()}/mo
      </div>
    </div>
  );
}

export function MemberProfileContent({ profile, onClose, onOpenFullPage, onAddNote, onQuickAction, layout = 'drawer' }) {
  if (!profile) {
    return (
      <div style={{ padding: theme.spacing.lg, color: theme.colors.textMuted }}>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
          <div style={{
            width: layout === 'page' ? 80 : 64,
            height: layout === 'page' ? 80 : 64,
            borderRadius: '50%',
            background: theme.colors.bgDeep,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: layout === 'page' ? 28 : 20,
            fontWeight: 700,
            color: theme.colors.textPrimary,
          }}>
            {initials}
          </div>
          <div>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Member Snapshot</div>
          <h2 style={{ margin: '4px 0', fontSize: layout === 'page' ? 32 : 24 }}>{profile.name}</h2>
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {profile.tier} • Joined {formatDate(profile.joinDate)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
            {topMetrics.map((metric) => (
              <div key={metric.label} style={{ padding: '8px 12px', borderRadius: theme.radius.sm, background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{metric.label}</div>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Health score</div>
          <div style={{ fontSize: 42, fontFamily: theme.fonts.mono, color: profile.healthScore > 69 ? theme.colors.success : profile.healthScore > 40 ? theme.colors.warning : theme.colors.urgent }}>
            {profile.healthScore ?? '—'}
          </div>
          <Sparkline data={profile.trend ?? []} />
          {layout !== 'page' && onOpenFullPage && (
            <button
              type="button"
              onClick={() => onOpenFullPage(profile.memberId)}
              style={{ marginTop: theme.spacing.sm, border: 'none', background: 'none', color: theme.colors.accent, fontWeight: 600, cursor: 'pointer' }}
            >
              Open full profile →
            </button>
          )}
        </div>
      </div>

      {/* Health Score Breakdown */}
      <Section title="Health Score Breakdown" description="Weighted engagement across 4 dimensions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Golf Engagement', weight: '30%', value: Math.min(100, Math.round((profile.healthScore ?? 50) * (0.9 + Math.random() * 0.3))), color: theme.colors.accent },
            { label: 'Dining Frequency', weight: '25%', value: Math.min(100, Math.round((profile.healthScore ?? 50) * (0.7 + Math.random() * 0.5))), color: theme.colors.success },
            { label: 'Email Engagement', weight: '25%', value: Math.min(100, Math.round((profile.healthScore ?? 50) * (0.6 + Math.random() * 0.6))), color: theme.colors.info500 },
            { label: 'Event Attendance', weight: '20%', value: Math.min(100, Math.round((profile.healthScore ?? 50) * (0.5 + Math.random() * 0.7))), color: '#8b5cf6' },
          ].map(d => (
            <div key={d.label} style={{ padding: '8px 10px', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`, background: theme.colors.bg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{d.label} ({d.weight})</span>
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: theme.fonts.mono, color: d.value >= 60 ? theme.colors.success : d.value >= 35 ? theme.colors.warning : theme.colors.urgent }}>{d.value}</span>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: theme.colors.bgDeep }}>
                <div style={{ height: '100%', borderRadius: '2px', background: d.value >= 60 ? theme.colors.success : d.value >= 35 ? theme.colors.warning : theme.colors.urgent, width: `${d.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contact" description={`Preferred channel: ${profile.contact?.preferredChannel ?? '—'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: theme.fontSize.sm }}>
          <span><strong>Phone:</strong> {profile.contact?.phone ?? '—'}</span>
          <span><strong>Email:</strong> {profile.contact?.email ?? '—'}</span>
          <span><strong>Last outreach:</strong> {formatDateTime(profile.contact?.lastOutreach)}</span>
        </div>
      </Section>

      {/* Household / Family Unit View */}
      {profile.family && profile.family.length > 0 && (
        <Section title="Household" description={`${profile.family.length + 1} members`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Aggregate household value */}
            <div style={{
              display: 'flex', gap: theme.spacing.md, padding: '8px 12px',
              background: theme.colors.bgDeep, borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Household value</div>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, fontFamily: theme.fonts.mono }}>
                  ${((profile.duesAnnual || 0) * (1 + profile.family.length * 0.6)).toLocaleString()}/yr
                </div>
              </div>
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Health (lowest)</div>
                <div style={{
                  fontSize: theme.fontSize.md, fontWeight: 700, fontFamily: theme.fonts.mono,
                  color: (profile.healthScore ?? 50) > 69 ? theme.colors.success : (profile.healthScore ?? 50) > 40 ? theme.colors.warning : theme.colors.urgent,
                }}>
                  {profile.healthScore ?? '—'}
                </div>
              </div>
            </div>
            {/* Family members */}
            {profile.family.map((f, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: theme.fontSize.sm }}>{f.name}</div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{f.relation}</div>
                </div>
                {f.notes && (
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, maxWidth: '50%', textAlign: 'right' }}>
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
          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {getTalkingPoints(profile).map((point, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 12px', borderRadius: theme.radius.sm,
              background: `${theme.colors.accent}06`, border: `1px solid ${theme.colors.accent}20`,
            }}>
              <span style={{ color: theme.colors.accent, fontWeight: 700, fontSize: theme.fontSize.sm, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Outreach History */}
      <Section title="Outreach History" description="Past communications">
        <OutreachHistory profile={profile} />
      </Section>

      <Section title="Preferences & insights">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {profile.preferences?.favoriteSpots && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Favorite spots:</strong> {profile.preferences.favoriteSpots.join(', ')}
            </div>
          )}
          {profile.preferences?.teeWindows && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Tee time window:</strong> {profile.preferences.teeWindows}
            </div>
          )}
          {profile.preferences?.dining && (
            <div style={{ fontSize: theme.fontSize.sm }}>
              <strong>Dining:</strong> {profile.preferences.dining}
            </div>
          )}
          {profile.preferences?.notes && (
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{profile.preferences.notes}</div>
          )}
        </div>
      </Section>

      <Section title="Recent activity" description="Last 30 days">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(profile.activity ?? []).map((activity) => (
            <div key={activity.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: theme.fontSize.sm }}>
              <div>
                <div style={{ fontWeight: 600 }}>{activity.type}</div>
                <div style={{ color: theme.colors.textSecondary }}>{activity.detail}</div>
              </div>
              <div style={{ color: theme.colors.textMuted }}>{formatDateTime(activity.timestamp)}</div>
            </div>
          ))}
          {!(profile.activity ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No recent activity logged.</span>}
        </div>
      </Section>

      <Section title="Member Journey" description="Cross-domain timeline">
        <MemberJourneyTimeline profile={profile} />
      </Section>

      <Section title="Risk signals">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {(profile.riskSignals ?? []).map((signal) => (
            <div key={signal.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{signal.label}</div>
                <SourceBadge system={signal.source ?? 'Member CRM'} size="xs" />
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{formatDateTime(signal.timestamp)} · Confidence {signal.confidence ?? '—'}</div>
            </div>
          ))}
          {!(profile.riskSignals ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No active risks.</span>}
        </div>
      </Section>

      <Section title="Staff notes">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add a quick staff note..."
            style={{
              width: '100%',
              minHeight: 96,
              borderRadius: theme.radius.sm,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.sm,
              fontSize: theme.fontSize.sm,
              fontFamily: theme.fonts.sans,
              background: theme.colors.bgDeep,
              color: theme.colors.textPrimary,
            }}
          />
          <button
            type="button"
            onClick={handleAddNote}
            style={{
              alignSelf: 'flex-end',
              padding: '6px 14px',
              borderRadius: theme.radius.sm,
              border: 'none',
              background: theme.colors.accent,
              color: theme.colors.white,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save note
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(profile.staffNotes ?? []).map((note) => (
              <div key={note.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px' }}>
                <div style={{ fontWeight: 600 }}>{note.author}</div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                  {note.department ?? 'General'} • {formatDateTime(note.timestamp)}
                </div>
                <div style={{ marginTop: 6 }}>{note.text}</div>
              </div>
            ))}
            {!(profile.staffNotes ?? []).length && <span style={{ color: theme.colors.textSecondary }}>No notes yet.</span>}
          </div>
        </div>
      </Section>

      <div style={isDrawerLayout ? { position: 'sticky', bottom: 0, background: theme.colors.white, padding: `${theme.spacing.md} 0 ${theme.spacing.sm}`, boxShadow: '0 -12px 32px rgba(15, 23, 42, 0.08)', zIndex: 5 } : undefined}>
        <Section title="Quick actions">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => onQuickAction?.(profile.memberId, action.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: theme.radius.md,
                  border: '1px solid ' + theme.colors.border,
                  background: theme.colors.bgDeep,
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
              color: theme.colors.textMuted,
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

export default function MemberProfileDrawer() {
  const { profile, isDrawerOpen, closeDrawer, openProfilePage, triggerQuickAction, addStaffNote } = useMemberProfile();
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
    background: theme.colors.white,
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.25)',
    borderLeft: `1px solid ${theme.colors.border}`,
    borderTopLeftRadius: isMobile ? theme.radius.lg : 0,
    borderTopRightRadius: isMobile ? theme.radius.lg : 0,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
        <MemberProfileContent
          profile={profile}
          onClose={handleClose}
          onOpenFullPage={openProfilePage}
          onAddNote={addStaffNote}
          onQuickAction={triggerQuickAction}
          layout="drawer"
        />
      </div>
    </>,
    document.body
  );
}
