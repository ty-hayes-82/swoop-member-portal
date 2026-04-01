// PendingActionsInline — Action Queue: hero alert + pending actions merged
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { theme } from '@/config/theme';
import MemberLink from '@/components/MemberLink';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const PRIORITY_COLORS = { high: theme.colors.urgent, medium: theme.colors.warning, low: theme.colors.textMuted };

export default function PendingActionsInline({ topPriority = null }) {
  const { inbox, pendingAgentCount } = useApp();

  const topActions = useMemo(() => {
    const pending = inbox.filter(
      (item) => item.status === 'pending' && item.id !== topPriority?.id
    );
    return [...pending]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 3);
  }, [inbox, topPriority?.id]);

  const hasHero = !!topPriority;
  const hasActions = pendingAgentCount > 0;

  if (!hasHero && !hasActions) return null;

  return (
    <div>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: theme.colors.accent,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
      }}>
        Action Queue {hasActions ? `(${pendingAgentCount})` : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        {/* Hero alert — top priority action card */}
        {hasHero && (
          <div
            onClick={() => window.dispatchEvent(new CustomEvent('swoop:open-actions'))}
            style={{
              padding: '14px 18px',
              borderRadius: theme.radius.md,
              background: `${theme.colors.urgent}06`,
              border: `1px solid ${theme.colors.urgent}25`,
              borderLeft: `4px solid ${theme.colors.urgent}`,
              boxShadow: theme.shadow.sm,
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = theme.shadow.sm; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 10,
                  background: `${theme.colors.urgent}15`, color: theme.colors.urgent,
                }}>
                  Priority
                </span>
                <span style={{
                  fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: `${theme.colors.accent}10`, color: theme.colors.accent,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  GM
                </span>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 600, color: theme.colors.urgent,
                padding: '2px 8px', borderRadius: 10,
                background: `${theme.colors.urgent}10`,
              }}>
                Act Now
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4, lineHeight: 1.4 }}>
              {topPriority.memberName ? (
                <>
                  <MemberLink
                    mode="drawer"
                    memberId={topPriority.memberId}
                    style={{ fontWeight: 700, color: theme.colors.textPrimary }}
                  >
                    {topPriority.memberName}
                  </MemberLink>
                  {' '}{topPriority.headline.replace(topPriority.memberName, '').trim()}
                </>
              ) : (
                topPriority.headline
              )}
            </div>
            {topPriority.recommendation && (
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
                {topPriority.recommendation}
              </div>
            )}
          </div>
        )}

        {/* Pending action cards */}
        {topActions.map((action) => {
          const prioColor = PRIORITY_COLORS[action.priority] ?? theme.colors.accent;
          return (
            <div
              key={action.id}
              onClick={() => window.dispatchEvent(new CustomEvent('swoop:open-actions'))}
              style={{
                padding: '12px 16px',
                borderRadius: theme.radius.md,
                background: theme.colors.bgCard,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `4px solid ${prioColor}`,
                boxShadow: theme.shadow.sm,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = theme.shadow.sm; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 10,
                    background: `${prioColor}15`, color: prioColor,
                  }}>
                    {action.priority}
                  </span>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: `${theme.colors.accent}10`, color: theme.colors.accent,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {(action.suggestedOwner || action.source || 'GM').split('·')[0].trim()}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: theme.colors.accent,
                  padding: '2px 8px', borderRadius: 10,
                  background: `${theme.colors.accent}10`,
                }}>
                  Pending approval
                </span>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 2, lineHeight: 1.4 }}>
                {action.description}
              </div>
              {action.impactMetric && (
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.success, fontWeight: 500 }}>
                  {action.impactMetric}
                </div>
              )}
            </div>
          );
        })}

        {/* CTA to review all */}
        {hasActions && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('swoop:open-actions'))}
            style={{
              padding: '10px 16px',
              fontSize: theme.fontSize.sm,
              fontWeight: 700,
              color: '#fff',
              background: theme.colors.accent,
              border: 'none',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Review all {pendingAgentCount} actions in Inbox →
          </button>
        )}
      </div>
    </div>
  );
}
