// TodayMode — Phase 4: "Collapse into 3 things that matter this morning"
// Critique: "Show almost nothing — just the one or two things that actually matter today"
import { theme } from '@/config/theme';
import QuickActions from '@/components/ui/QuickActions.jsx';

const HOUR = new Date().getHours();
const IS_MORNING = HOUR < 12;
const IS_EOD = HOUR >= 17;

// Time-of-day greeting
const timeLabel = IS_MORNING ? 'This morning' : IS_EOD ? "Today's close" : 'Right now';
const timeGreet = IS_MORNING
  ? "Here are the three things that need your attention before the first tee time."
  : IS_EOD
  ? "Here's how the day closed out and what's pending tomorrow."
  : "Here's where things stand mid-day.";

export default function TodayMode({ onNavigate }) {
  const items = [
    {
      priority: 1,
      urgency: 'urgent',
      icon: '⚠',
      headline: 'James Whitfield filed a complaint 6 days ago. No one has followed up.',
      story: 'He had lunch in the Grill Room on January 16th — the day we were short-staffed. Food took 40 minutes. He complained that evening. We acknowledged it and stopped there. He hasn\'t been back. He has a tee time Saturday morning.',
      stakes: '$18,000/yr in dues',
      action: 'service-save',
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
      action: null,
      linkLabel: 'Operations →',
      linkKey: 'operations',
    },
    {
      priority: 3,
      urgency: 'neutral',
      icon: '👥',
      headline: '2 more at-risk members have tee times today.',
      story: 'Anne Jordan (Weekend Warrior, 3 rounds in 3 months down from 12) tees off at 8:14 AM. Robert Callahan (dining only hitting his F&B minimum) is in the 10:40 group. Both are on a slow path out.',
      stakes: '$36K annual dues',
      action: null,
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

      {/* 3 items only */}
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
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: '6px', lineHeight: 1.6 }}>
                {item.story}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
            {item.memberName && (
              <QuickActions memberName={item.memberName} memberId={item.memberId} context={item.context} />
            )}
            <button
              onClick={() => onNavigate(item.linkKey)}
              style={{ padding: '6px 14px', borderRadius: theme.radius.sm, fontSize: theme.fontSize.xs,
                fontWeight: 600, cursor: 'pointer', border: `1px solid ${theme.colors.border}`,
                background: 'none', color: theme.colors.textSecondary }}>
              {item.linkLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
