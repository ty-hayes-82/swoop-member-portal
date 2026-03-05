// TodayMode — 3 things that matter this morning.
// Phase B fix: item 3 renders actual interactive member rows, not prose.
import { useState } from 'react';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';

const HOUR = new Date().getHours();
const IS_MORNING = HOUR < 12;
const IS_EOD = HOUR >= 17;

const timeLabel = IS_MORNING ? 'This morning' : IS_EOD ? "Today's close" : 'Right now';
const timeGreet = IS_MORNING
  ? "Here are the three things that need your attention before the first tee time."
  : IS_EOD
  ? "Here's how the day closed out and what's pending tomorrow."
  : "Here's where things stand mid-day.";

// Hoverable mini member row for item 3
function MiniMemberRow({ member, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate?.('member-health')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: theme.radius.sm,
        background: hovered ? `${theme.colors.members}14` : `${theme.colors.members}08`,
        border: `1px solid ${hovered ? theme.colors.members + '45' : theme.colors.members + '22'}`,
        cursor: 'pointer', transition: 'all 0.12s ease',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `${theme.colors.members}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontFamily: theme.fonts.mono,
        color: theme.colors.members, fontWeight: 700, flexShrink: 0,
      }}>
        {member.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{
            fontSize: theme.fontSize.sm, fontWeight: 600,
            color: hovered ? theme.colors.members : theme.colors.textPrimary,
            transition: 'color 0.12s ease',
          }}>
            {member.name}
          </span>
          <ArchetypeBadge archetype={member.archetype} size="xs" />
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{member.risk}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono, color: theme.colors.textSecondary }}>{member.time}</span>
        <span style={{
          fontSize: '14px', color: hovered ? theme.colors.members : theme.colors.textMuted,
          transition: 'color 0.12s ease',
        }}>›</span>
      </div>
    </div>
  );
}

export default function TodayMode({ onNavigate }) {
  const items = [
    {
      priority: 1,
      urgency: 'urgent',
      icon: '⚠',
      headline: 'James Whitfield filed a complaint 6 days ago. No one has followed up.',
      story: 'He had lunch in the Grill Room on January 16th — the day we were short-staffed. Food took 40 minutes. He complained that evening. We acknowledged it and stopped there. He hasn\'t been back. He has a tee time Saturday morning.',
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
      story: 'Historically, wind days reduce golf bookings by 15% after the forecast is confirmed. We have 28 tee times this afternoon. The Grill Room should expect a 20–30% uptick in lunch covers if members cancel and stay.',
      stakes: 'Prepare F&B staff',
      linkLabel: 'Operations →',
      linkKey: 'operations',
    },
    {
      priority: 3,
      urgency: 'neutral',
      icon: '👥',
      headline: '2 more at-risk members have tee times today.',
      story: null, // replaced by member rows below
      members: [
        { name: 'Anne Jordan',      score: 38, archetype: 'Weekend Warrior', risk: '3 rounds in 3 months, down from 12 in October', time: '8:14 AM' },
        { name: 'Robert Callahan',  score: 41, archetype: 'Declining',        risk: 'Dining only — hitting F&B minimum, nothing more',  time: '10:40 AM' },
      ],
      stakes: '$36K annual dues',
      linkLabel: 'Member Retention →',
      linkKey: 'member-health',
    },
  ];

  const urgencyBorder = { urgent: theme.colors.urgent, warning: theme.colors.warning, neutral: theme.colors.border };
  const urgencyBg     = { urgent: `${theme.colors.urgent}06`, warning: `${theme.colors.warning}06`, neutral: theme.colors.bgCard };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {/* Time-of-day header */}
      <div style={{ paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
          {timeLabel.toUpperCase()} · SATURDAY, JANUARY 17, 2026 · OAKMONT HILLS CC
        </div>
        <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.2 }}>
          {timeGreet}
        </h2>
      </div>

      {items.map((item) => (
        <div key={item.priority} style={{
          background: urgencyBg[item.urgency],
          border: `1px solid ${urgencyBorder[item.urgency]}50`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          borderLeft: `4px solid ${urgencyBorder[item.urgency]}`,
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
            <span style={{ fontSize: '20px', flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, lineHeight: 1.3 }}>
                  {item.headline}
                </div>
                {item.stakes && (
                  <div style={{ fontSize: '11px', fontWeight: 700, color: urgencyBorder[item.urgency],
                    background: `${urgencyBorder[item.urgency]}12`, padding: '3px 8px',
                    borderRadius: '12px', flexShrink: 0 }}>
                    {item.stakes}
                  </div>
                )}
              </div>
              {/* Prose story — items 1 & 2 */}
              {item.story && (
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: '6px', lineHeight: 1.6 }}>
                  {item.story}
                </div>
              )}
              {/* Interactive member rows — item 3 */}
              {item.members && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {item.members.map(m => (
                    <MiniMemberRow key={m.name} member={m} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
            {item.memberName && (
              <QuickActions memberName={item.memberName} memberId={item.memberId} context={item.context} />
            )}
            <button
              onClick={() => onNavigate(item.linkKey)}
              style={{ padding: '6px 2px', fontSize: theme.fontSize.sm,
                fontWeight: 500, cursor: 'pointer', border: 'none',
                background: 'none', color: theme.colors.textMuted, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {item.linkLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
