import { useState } from 'react';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { AgentInboxStrip } from '@/components/ui';
import { getTopPendingAction } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { getDailyBriefing } from '@/services/briefingService';

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
          <span
            style={{
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              color: hovered ? theme.colors.accent : theme.colors.textPrimary,
              transition: 'color 0.12s ease',
            }}
          >
            {member.name}
          </span>
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
      story:
        "He had lunch in the Grill Room on January 16th — the day we were short-staffed. Food took 40 minutes. We acknowledged the complaint and stopped there. He hasn't been back. He has a tee time Saturday morning.",
      stakes: '$18,000/yr in dues',
      memberName: 'James Whitfield',
      memberId: 'mbr_203',
      context: 'Slow service complaint at Grill Room — felt ignored after acknowledging.',
      linkLabel: 'Full case → Staffing & Service',
      linkKey: 'staffing-service',
    },
    {
      priority: 2,
      urgency: 'warning',
      icon: '☁',
      headline: 'Wind advisory today — 15+ mph gusts expected by noon.',
      story:
        'Historically, wind days reduce golf bookings by 15% after forecast confirmation. We have 28 tee times this afternoon. Grill Room should expect a 20–30% lunch cover shift if members cancel and stay.',
      stakes: 'Prepare F&B staff',
      linkLabel: 'Operations →',
      linkKey: 'operations',
    },
    {
      priority: 3,
      urgency: 'neutral',
      icon: '👥',
      headline: '2 more at-risk members have tee times today.',
      members: [
        { name: 'Anne Jordan', score: 38, archetype: 'Weekend Warrior', risk: '3 rounds in 3 months, down from 12 in October', time: '8:14 AM' },
        { name: 'Robert Callahan', score: 41, archetype: 'Declining', risk: 'Dining only — hitting F&B minimum, nothing more', time: '10:40 AM' },
      ],
      stakes: '$36K annual dues',
      linkLabel: 'Member Retention →',
      linkKey: 'member-health',
    },
  ];

  const urgencyBorder = { urgent: theme.colors.urgent, warning: theme.colors.warning, neutral: theme.colors.border };
  const urgencyBg = { urgent: `${theme.colors.urgent}06`, warning: `${theme.colors.warning}06`, neutral: theme.colors.bgCard };

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: theme.spacing.sm }}>
            {quickWins.map((win) => (
              <div
                key={win.id}
                onClick={() => onNavigate?.(win.link)}
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
                <div style={{
                  fontSize: theme.fontSize.xs,
                  fontWeight: 600,
                  color: theme.colors.success,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {win.action} →
                </div>
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
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3 }}>{item.headline}</div>
                {item.stakes && (
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: urgencyBorder[item.urgency],
                      background: `${urgencyBorder[item.urgency]}12`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {item.stakes}
                  </div>
                )}
              </div>

              {item.story && <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: '6px', lineHeight: 1.6 }}>{item.story}</div>}

              {item.members && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {item.members.map((member) => (
                    <MiniMemberRow key={member.name} member={member} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
            {item.memberName && <QuickActions memberName={item.memberName} memberId={item.memberId} context={item.context} />}
            <button
              onClick={() => onNavigate(item.linkKey)}
              style={{
                padding: '6px 2px',
                fontSize: theme.fontSize.sm,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                color: theme.colors.textMuted,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {item.linkLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
