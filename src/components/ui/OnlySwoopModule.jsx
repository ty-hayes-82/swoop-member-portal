import { useState } from 'react';
import { theme } from '@/config/theme.js';
import { DEMO_TIMESTAMP } from '@/config/constants.js';

export default function OnlySwoopModule({ question, insights = [], action, context = [], timestamp }) {
  const [showSignals, setShowSignals] = useState(false);

  if (!question) return null;

  const insightCount = insights.length;
  const previewInsights = insights.slice(0, 2);
  const remainingInsights = insights.slice(2);
  const resolvedTimestamp = timestamp ?? DEMO_TIMESTAMP;

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
          {context.length > 0 && (
            <div
              style={{
                marginTop: theme.spacing.sm,
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.sm,
              }}
            >
              {context.map(({ label, value, icon }) => (
                <div
                  key={`${label}-${value}`}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.radius.md,
                    background: theme.colors.bgDeep,
                    border: `1px solid ${theme.colors.border}`,
                    minWidth: 150,
                    flex: '0 1 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <span style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {icon ? `${icon} ${label}` : label}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.md,
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
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
              {action.dueBy && (
                <span style={{ color: theme.colors.textMuted }}>
                  · Due {action.dueBy} <span style={{ fontSize: theme.fontSize.xs, opacity: 0.7 }}>(as of {DEMO_TIME})</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {insightCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {previewInsights.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: theme.spacing.md,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                color: theme.colors.textPrimary,
              }}
            >
              {previewInsights.map((insight) => (
                <li key={`preview-${insight}`} style={{ lineHeight: 1.4 }}>
                  {insight}
                </li>
              ))}
            </ul>
          )}

          {remainingInsights.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowSignals((prev) => !prev)}
                style={{
                  border: '1px solid ' + theme.colors.border,
                  background: showSignals ? theme.colors.bgDeep : `${theme.colors.operations}15`,
                  color: showSignals ? theme.colors.textPrimary : theme.colors.operations,
                  fontSize: theme.fontSize.sm,
                  fontWeight: 700,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.radius.md,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <span>{showSignals ? 'Hide' : 'View'} additional signals</span>
                <span style={{ fontSize: theme.fontSize.xs, opacity: 0.8 }}>
                  ({remainingInsights.length})
                </span>
              </button>

              {showSignals && (
                <ul
                  style={{
                    margin: `${theme.spacing.xs} 0 0`,
                    paddingLeft: theme.spacing.md,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing.xs,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {remainingInsights.map((insight) => (
                    <li key={`extra-${insight}`} style={{ lineHeight: 1.4 }}>
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
