import { useState } from 'react';
import { theme } from '@/config/theme.js';

export default function OnlySwoopModule({ question, insights = [], action }) {
  const [showSignals, setShowSignals] = useState(false);

  if (!question) return null;

  const insightCount = insights.length;

  return (
    <section
      style={{
        border: `1.5px solid ${theme.colors.borderStrong ?? theme.colors.border}`,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
      }}
      data-animate
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: theme.spacing.md,
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2
            style={{
              fontSize: theme.fontSize.xl,
              fontFamily: theme.fonts.serif,
              color: theme.colors.textPrimary,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {question}
          </h2>
        </div>
        {action && (
          <div
            style={{
              flexBasis: 320,
              flexShrink: 0,
              borderRadius: theme.radius.lg,
              background: theme.colors.bgDeep,
              border: `1px solid ${theme.colors.border}`,
              padding: theme.spacing.md,
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.xs,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: theme.fontSize.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.colors.textMuted,
              }}
            >
              Immediate action
            </p>
            <p style={{ margin: 0, fontSize: theme.fontSize.md, lineHeight: 1.4 }}>{action.text}</p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.xs,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: 600,
              }}
            >
              <span style={{ color: theme.colors.textPrimary }}>{action.owner}</span>
              {action.dueBy && <span style={{ color: theme.colors.textMuted }}>· Due {action.dueBy}</span>}
            </div>
          </div>
        )}
      </div>

      {insightCount > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSignals((prev) => !prev)}
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              fontWeight: 700,
              textAlign: 'left',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
            }}
          >
            <span>{showSignals ? '▾' : '▸'}</span>
            <span>{showSignals ? 'Hide signals' : `Signals (${insightCount})`}</span>
          </button>

          {showSignals && (
            <ul
              style={{
                margin: `${theme.spacing.sm} 0 0`,
                paddingLeft: theme.spacing.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.xs,
                color: theme.colors.textPrimary,
              }}
            >
              {insights.map((insight) => (
                <li key={insight} style={{ lineHeight: 1.5 }}>
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
