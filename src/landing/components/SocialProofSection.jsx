import { theme } from '@/config/theme';
import { proofMetrics } from '@/landing/data';

const iconLabel = {
  TrendingUp: 'UP',
  DollarSign: '$$',
  AlertTriangle: 'AL',
};

export default function SocialProofSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        What Swoop surfaces — demo scenario results
      </h2>
      <p style={{ color: theme.colors.textMuted, marginBottom: theme.spacing.lg }}>
        Performance metrics from a simulated 300-member private club. Real club results coming soon.
      </p>
      <div className="landing-grid-3">
        {proofMetrics.map((item) => (
          <article
            key={item.label}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: '20px',
              background: theme.colors.bgCard,
            }}
          >
            <p style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.xs,
              marginBottom: theme.spacing.sm,
            }}>
              {iconLabel[item.icon] || 'MT'}
            </p>
            <p style={{
              fontFamily: theme.fonts.mono,
              fontSize: 'clamp(34px, 5vw, 44px)',
              fontWeight: 700,
              marginBottom: 4,
            }}>
              {item.metric}
            </p>
            <p style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.sm }}>{item.label}</p>
            <p style={{ color: theme.colors.textSecondary }}>{item.context}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
