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
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.lg }}>
        Most clubs are flying blind.
      </h2>
      <div className="landing-problem-grid">
        {problemCards.map((card) => (
          <article
            key={card}
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: 'clamp(18px, 4vw, 24px) clamp(16px, 3vw, 22px)',
              boxShadow: theme.shadow.sm,
              minHeight: 140,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: theme.fontSize.lg, lineHeight: 1.45 }}>{card}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
