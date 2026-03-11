import { useState } from 'react';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import MemberLink from '@/components/MemberLink.jsx';
import { AgentInboxStrip } from '@/components/ui';
import { getTopPendingAction } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { getDailyBriefing } from '@/services/briefingService';
import EvidenceStrip from '@/components/ui/EvidenceStrip';

const HOUR = new Date().getHours();
const IS_MORNING = HOUR < 12;
const IS_EOD = HOUR >= 17;

const timeLabel = IS_MORNING ? 'This morning' : IS_EOD ? "Today's close" : 'Right now';
const timeGreet = IS_MORNING
  ? 'Here are the three things that need your attention before the first tee time.'
  : IS_EOD
  ? "Here's how the day closed out and what's pending tomorrow."
  : "Here's where things stand mid-day.";

function MiniMemberRow({ member, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate?.('member-health')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: theme.radius.sm,
        background: hovered ? `${theme.colors.accent}0A` : `${theme.colors.accent}08`,
        border: `1px solid ${hovered ? `${theme.colors.members}45` : `${theme.colors.members}22`}`,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `${theme.colors.accent}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontFamily: theme.fonts.mono,
          color: theme.colors.accent,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {member.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <MemberLink
            memberId={member.memberId}
            style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: hovered ? theme.colors.accent : theme.colors.textPrimary, transition: 'color 0.12s ease' }}
          >
            {member.name}
          </MemberLink>
          <ArchetypeBadge archetype={member.archetype} size="xs" />
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{member.risk}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono, color: theme.colors.textSecondary }}>{member.time}</span>
        <span style={{ fontSize: '14px', color: hovered ? theme.colors.accent : theme.colors.textMuted, transition: 'color 0.12s ease' }}>›</span>
      </div>
    </div>
  );
}

export default function TodayMode({ onNavigate }) {
  const topAction = getTopPendingAction();
  const { pendingAgentCount, approveAction } = useApp();
  const briefing = getDailyBriefing();
  const quickWins = briefing.quickWins || [];

  const items = [
    {
      priority: 1,
      urgency: 'urgent',
      icon: '⚠',
      headline: 'James Whitfield filed a complaint 6 days ago. No one has followed up.',
      recommendation: 'GM to call James personally with apology + complimentary round. Send recovery note via Swoop app within 2 hours.',
      evidenceSignals: [
        { source: 'Complaint', detail: 'Jan 16 pace-of-play complaint' },
        { source: 'Tee Sheet', detail: '3 cancellations in 10 days' },
        { source: 'POS', detail: 'Grill Room visits dropped to zero' },
      ],
      bullets: [
        'Complaint acknowledged but unresolved — timer exceeded 6-day SLA.',
        'Average Grill Room check dropped from $47 → $28 since January 3.',
        'Health score fell 78 → 42 once the third complaint hit.',
      ],
      stakes: '$18,000/yr in dues',
      memberName: 'James Whitfield',
      memberId: 'mbr_203',
      context: 'Slow service complaint at Grill Room — felt ignored after acknowledging.',
      linkLabel: 'Full case → Staffing & Service',
      linkKey: 'staffing-service',
      meta: {
        sourceIcon: '🗂',
        source: 'CRM + POS + Complaints',
        freshness: 'Updated 11 min ago',
        confidence: '93% confidence',
        why: 'Complaint aging 6d & spend down 42%',
        metric: { value: '6-day', label: 'warning lead time' },
      },
    },
    {
      priority: 2,
      urgency: 'warning',
      icon: '☁',
      headline: 'Wind advisory today — 15+ mph gusts expected by noon.',
      recommendation: 'Prep extra Grill Room staff for early lunch surge. Send proactive text to afternoon bookers offering reschedule or indoor alternatives.',
      evidenceSignals: [
        { source: 'Weather', detail: '25mph gusts forecast 1-5 PM' },
        { source: 'Tee Sheet', detail: '18 afternoon bookings at risk' },
        { source: 'Staffing', detail: 'Grill Room understaffed for surge' },
      ],
      bullets: [
        'Wind days reduce confirmations by 15% once forecast lock hits.',
        '28 tee times after noon × $312 revenue/slot = $8,736 at risk.',
        'Grill Room sees 20–30% lunch spike when golfers stay inside.',
      ],
      stakes: 'Prepare F&B staff',
      linkLabel: 'Operations →',
      linkKey: 'operations',
      meta: {
        sourceIcon: '🌤',
        source: 'Weather + Tee Sheet',
        freshness: 'Forecast updated 18 min ago',
        confidence: '87% confidence',
        why: 'High-risk bookings overlap gust window',
        metric: { value: '$8.7K', label: 'revenue at risk' },
      },
    },
    {
      priority: 3,
      urgency: 'neutral',
      icon: '👥',
      headline: '2 more at-risk members have tee times today.',
      recommendation: 'Pro shop staff to greet by name on arrival. Schedule post-round check-in via Swoop app. Flag for Membership Director follow-up tomorrow.',
      evidenceSignals: [
        { source: 'GPS', detail: '9-hole exits 3 of last 4 rounds' },
        { source: 'Dining', detail: 'Post-round F&B spend down 70%' },
        { source: 'Email', detail: 'Newsletter open rate dropped to 0%' },
      ],
      members: [
        { name: 'Anne Jordan', memberId: 'mbr_089', score: 38, archetype: 'Weekend Warrior', risk: '3 rounds in 3 months, down from 12 in October', time: '8:14 AM' },
        { name: 'Robert Callahan', memberId: 'mbr_271', score: 41, archetype: 'Declining', risk: 'Dining only — hitting F&B minimum, nothing more', time: '10:40 AM' },
      ],
      bullets: [
        'Both members are in the bottom quartile of engagement.',
        'Combined dues at risk: $36K + secondary spend.',
      ],
      stakes: '$36K annual dues',
      linkLabel: 'Member Retention →',
      linkKey: 'member-health',
      meta: {
        sourceIcon: '📊',
        source: 'Member Pulse',
        freshness: 'Scores refreshed 9 min ago',
        confidence: '90% confidence',
        why: 'Health scores <45 + tee times today',
        metric: { value: '$36K', label: 'dues at stake today' },
      },
    },
  ];

  const urgencyBorder = { urgent: theme.colors.urgent, warning: theme.colors.warning, neutral: theme.colors.border };
  const urgencyBg = { urgent: `${theme.colors.urgent}06`, warning: `${theme.colors.warning}06`, neutral: theme.colors.bgCard };
  const renderHeadline = (item) => {
    if (!item.memberName || !item.memberId) return item.headline;
    const segments = item.headline.split(item.memberName);
    if (segments.length === 1) {
      return (
        <MemberLink mode="drawer" memberId={item.memberId} style={{ fontWeight: 700 }}>{item.headline}</MemberLink>
      );
    }
    return (
      <>
        {segments[0]}
        <MemberLink mode="drawer" memberId={item.memberId} style={{ fontWeight: 700 }}>{item.memberName}</MemberLink>
        {segments.slice(1).join(item.memberName)}
      </>
    );
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
          {timeLabel.toUpperCase()} · SATURDAY, JANUARY 17, 2026 · OAKMONT HILLS CC
        </div>
        <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.2 }}>{timeGreet}</h2>
      </div>

      <AgentInboxStrip
        pendingCount={pendingAgentCount}
        topAction={topAction}
        onApproveTop={() => topAction && approveAction(topAction.id)}
        onOpenInbox={() => onNavigate?.('agent-command')}
      />

      {/* Quick Wins — Immediate Revenue Opportunities */}
      {quickWins.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.success}08 0%, ${theme.colors.operations}08 100%)`,
          border: `1.5px solid ${theme.colors.success}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: theme.spacing.md }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
              Quick Wins — Do These First
            </h3>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: theme.colors.success,
              background: `${theme.colors.success}12`,
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: 'auto',
            }}>
              {quickWins.reduce((sum, w) => sum + (parseInt(w.effort) || 0), 0)} min total
            </span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', 
            gap: theme.spacing.sm 
          }}>
            {quickWins.map((win) => (
              <div
                key={win.id}
                onClick={() => onNavigate?.(win.link)}
                className="quick-win-card"
                style={{
                  background: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: theme.spacing.md,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.success;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = theme.shadow.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{win.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.3, marginBottom: '4px' }}>
                      {win.title}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: theme.colors.success,
                        background: `${theme.colors.success}10`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {win.impact}
                      </span>
                      <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono }}>
                        {win.effort} effort
                      </span>
                      {win.conversionRate && (
                        <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono }}>
                          {win.conversionRate}% conversion
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5, marginBottom: '8px' }}>
                  {win.detail}
                </div>
                <button
                  onClick={(event) => { event.stopPropagation(); onNavigate?.(win.link); }}
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: theme.radius.sm,
                    border: 'none',
                    background: theme.colors.success,
                    color: theme.colors.white,
                    cursor: 'pointer',
                  }}
                >
                  {win.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.priority}
          style={{
            background: urgencyBg[item.urgency],
            border: `1px solid ${urgencyBorder[item.urgency]}50`,
            borderRadius: theme.radius.md,
            padding: theme.spacing.lg,
            borderLeft: `4px solid ${urgencyBorder[item.urgency]}`,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
          }}
        >
          {item.meta && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
              <span>{item.meta.sourceIcon} {item.meta.source}</span>
              <span>Updated {item.meta.freshness}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '22px', flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3 }}>{renderHeadline(item)}</div>
                {item.stakes && (
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: urgencyBorder[item.urgency],
                      background: `${urgencyBorder[item.urgency]}12`,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      flexShrink: 0,
                    }}
                  >
                    {item.stakes}
                  </div>
                )}
              </div>
              {item.bullets?.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '18px', color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 1.5 }}>
                  {item.bullets.map((point) => (
                    <li key={point} style={{ marginBottom: '4px' }}>{point}</li>
                  ))}
                </ul>
              )}
              {item.members && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.members.map((member) => (
                    <MiniMemberRow key={member.name} member={member} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
              {item.meta?.why && (
                <div style={{ fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
                  Why this surfaced
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{item.meta.why}</div>
                </div>
              )}
              {item.meta?.metric && (
                <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span style={{ fontSize: '22px', fontFamily: theme.fonts.mono, fontWeight: 700 }}>{item.meta.metric.value}</span>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{item.meta.metric.label}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
              {item.memberName && <QuickActions memberName={item.memberName} memberId={item.memberId} context={item.context} />}
              <button
                onClick={() => onNavigate(item.linkKey)}
                style={{
                  padding: '6px 12px',
                  fontSize: theme.fontSize.sm,
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: theme.radius.sm,
                  border: 'none',
                  background: theme.colors.white,
                  color: theme.colors.textPrimary,
                  boxShadow: theme.shadow.xs,
                }}
              >
                {item.linkLabel}
              </button>
            </div>
            {item.meta?.confidence && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.textPrimary, background: `${theme.colors.textPrimary}12`, padding: '4px 12px', borderRadius: '999px' }}>{item.meta.confidence}</span>
            )}
          </div>
          <div
            style={{
              marginTop: theme.spacing.sm,
              borderLeft: `3px solid ${theme.colors.success}`,
              background: `${theme.colors.success}0F`,
              padding: '10px 12px',
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              color: theme.colors.textPrimary,
            }}
          >
            <strong>Recommended:</strong> {item.recommendation}
          </div>
          {item.evidenceSignals && <EvidenceStrip signals={item.evidenceSignals} compact />}
        </div>
      ))}
    </div>
  );
}
