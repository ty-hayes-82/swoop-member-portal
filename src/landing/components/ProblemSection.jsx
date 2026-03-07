import { theme } from '@/config/theme';
import { problemCards } from '@/landing/data';

export default function ProblemSection() {
  return (
    <section className="landing-section-padded" style={{
      background: theme.colors.landingCream,
      borderRadius: theme.radius.xl,
      padding: '56px 28px',
      marginBottom: theme.spacing.xxl,
    }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.lg }}>
        Most clubs are flying blind.
      </h2>
      <div className="landing-grid-3">
        {problemCards.map((card) => (
          <article
            key={card}
            style={{
              background: theme.colors.bgCard,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: '24px 22px',
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
