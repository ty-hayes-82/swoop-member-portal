import { theme } from '@/config/theme.js';

export default function OnlySwoopModule({ question, sources = [], insights = [], action }) {
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
        <span style={{
          fontSize: theme.fontSize.xs,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: theme.colors.textMuted,
          fontWeight: 700,
        }}>
          Only Swoop can answer
        </span>
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

      {sources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: 600 }}>
            Because we connect:
          </span>
          {sources.map((source) => (
            <span
              key={source}
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                background: `${theme.colors.cta}14`,
                color: theme.colors.textPrimary,
                fontSize: theme.fontSize.sm,
                fontWeight: 600,
              }}
            >
              {source}
            </span>
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div style={{ display: 'grid', gap: theme.spacing.sm }}>
          <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: 600 }}>
            What we see that others can’t:
          </span>
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
        </div>
      )}

      {action && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: theme.spacing.md,
          alignItems: 'center',
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: theme.spacing.md,
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              What to do today
            </div>
            <p style={{ margin: `${theme.spacing.xs} 0 0`, fontSize: theme.fontSize.md, lineHeight: 1.5 }}>
              {action.text}
            </p>
          </div>
          <div style={{
            minWidth: 220,
            background: `${theme.colors.bgDeep}CC`,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontWeight: 600 }}>Owner</div>
            <div style={{ fontWeight: 700 }}>{action.owner}</div>
            {action.dueBy && (
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted, marginTop: 4 }}>
                Due by {action.dueBy}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
