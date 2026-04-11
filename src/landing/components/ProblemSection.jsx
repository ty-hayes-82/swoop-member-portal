import { theme } from '@/config/theme';
import { problemCards } from '@/landing/data';

export default function ProblemSection() {
  return (
    <section className="landing-section-padded" style={{
      background: theme.colors.landingCream,
      borderRadius: theme.radius.xl,
      padding: 'clamp(32px, 6vw, 56px) clamp(18px, 4vw, 28px)',
      marginBottom: theme.spacing.xxl,
    }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.sm }}>
        Most clubs are flying blind.
      </h2>
      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.lg,
        maxWidth: 640,
        marginBottom: theme.spacing.lg,
        lineHeight: 1.5,
      }}>
        Your tee sheet, CRM, and POS each hold a fragment. Nobody connects
        the dots until a member is already gone.
      </p>
      <div className="landing-problem-grid">
        {problemCards.map((card) => (
          <article
            key={card.title}
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: 'clamp(20px, 4vw, 26px)',
              boxShadow: theme.shadow.sm,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
              <span>📡 {card.source}</span>
              <span>⏱ {card.freshness}</span>
            </div>
            <h3 style={{ fontSize: theme.fontSize.lg, margin: 0 }}>{card.title}</h3>
            <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{card.summary}</p>
            {card.highlights?.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '18px', color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, lineHeight: 1.5 }}>
                {card.highlights.map((highlight) => (
                  <li key={highlight} style={{ marginBottom: '4px' }}>{highlight}</li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
                Why this surfaced
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{card.why}</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.accent, background: `${theme.colors.accent}12`, padding: '4px 10px', borderRadius: '999px' }}>{card.confidence}</span>
            </div>
            {card.metric && (
              <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: '10px 12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                <span style={{ fontSize: '22px', fontFamily: theme.fonts.mono, fontWeight: 700 }}>{card.metric.value}</span>
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{card.metric.label}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
