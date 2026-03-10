import { useState } from 'react';
import { theme } from '@/config/theme.js';

export default function OnlySwoopModule({ question, sources = [], insights = [], action }) {
  const [showSignals, setShowSignals] = useState(false);

  if (!question) return null;

  return (
    <section
      style={{
        border: `1.5px solid ${theme.colors.borderStrong ?? theme.colors.border}`,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        background: theme.colors.bgCard,
        boxShadow: theme.shadow.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
      }}
      data-animate
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        <h2 style={{
          fontSize: theme.fontSize.xl,
          fontFamily: theme.fonts.serif,
          color: theme.colors.textPrimary,
          margin: 0,
          lineHeight: 1.2,
        }}>
          {question}
        </h2>
      </div>

      {action && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: theme.spacing.md,
          alignItems: 'center',
          marginTop: `-${theme.spacing.sm}`,
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ margin: 0, fontSize: theme.fontSize.md, lineHeight: 1.5 }}>
              {action.text}
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            alignItems: 'center',
            minWidth: 220,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '999px',
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            background: `${theme.colors.bgDeep}99`,
          }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: 600 }}>Owner</div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700 }}>{action.owner}</div>
            {action.dueBy && (
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>
                Due {action.dueBy}
              </div>
            )}
          </div>
        </div>
      )}

      {(insights.length > 0 || sources.length > 0) && (
        <div style={{ display: 'grid', gap: theme.spacing.sm }}>
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
              cursor: 'pointer',
            }}
          >
            {showSignals ? '▾' : '▸'} Signals ({insights.length})
          </button>

          {showSignals && (
            <div style={{ display: 'grid', gap: theme.spacing.sm }}>
              {sources.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {sources.map((source) => (
                    <span
                      key={source}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: `${theme.colors.cta}14`,
                        color: theme.colors.textPrimary,
                        fontSize: theme.fontSize.xs,
                        fontWeight: 600,
                      }}
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}
              {insights.length > 0 && (
                <ul style={{
                  margin: 0,
                  paddingLeft: theme.spacing.lg,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.xs,
                  color: theme.colors.textPrimary,
                }}>
                  {insights.map((insight) => (
                    <li key={insight} style={{ lineHeight: 1.5 }}>
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
