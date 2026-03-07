import { theme } from '@/config/theme';
import { testimonials } from '@/landing/data';

export default function SocialProofSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Trusted by private club operators who need proof, not promises.
      </h2>
      <div className="landing-grid-3">
        {testimonials.map((item) => (
          <article
            key={item.club}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: '20px',
              background: theme.colors.bgCard,
            }}
          >
            <p style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.sm,
            }}>
              {item.club}
            </p>
            <p style={{
              fontSize: theme.fontSize.md,
              marginBottom: theme.spacing.md,
              lineHeight: 1.6,
            }}>
              "{item.quote}"
            </p>
            <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
              {item.author}
            </p>
            <p style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              marginBottom: 4,
            }}>
              {item.metricLabel}
            </p>
            <p style={{
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.xl,
              fontWeight: 700,
            }}>
              {item.metricValue}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
