import { theme } from '@/config/theme';
import { integrationCategories } from '@/landing/data';

export default function IntegrationsSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        28 integrations across 10 systems. Live in under 2 weeks. No rip-and-replace.
      </h2>
      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.lg,
        marginBottom: theme.spacing.xl,
      }}>
        Connect the systems you already run today. Swoop orchestrates them as one operating graph
        without forcing a platform migration.
      </p>
      <div className="landing-grid-2">
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgCard,
          padding: '20px',
        }}>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: theme.spacing.md,
          }}>
            Integration Coverage
          </p>
          <div className="landing-grid-auto" style={{ gap: 12 }}>
            {integrationCategories.map((category) => (
              <div key={category.label} style={{
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radius.md,
                padding: '12px',
              }}>
                <p style={{ fontWeight: 600 }}>{category.label}</p>
                <p style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.mono,
                  fontSize: theme.fontSize.sm,
                }}>
                  {category.systems} connected systems
                </p>
                <p style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                  marginTop: 6,
                }}>
                  {category.vendors.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgCard,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: theme.spacing.md,
            }}>
              Rollout Timeline
            </p>
            <p style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.md }}>
              Typical launch: <span className="font-mono">10 business days</span>.
            </p>
            <p style={{ color: theme.colors.textSecondary }}>
              Week 1: connector setup, data validation, and lens baselines. Week 2: workflows,
              AI agent playbooks, and GM readiness.
            </p>
          </div>
          <div style={{
            marginTop: theme.spacing.lg,
            borderRadius: theme.radius.md,
            background: theme.colors.bgDeep,
            padding: '14px',
          }}>
            <p style={{ fontFamily: theme.fonts.mono, fontWeight: 600 }}>No operational downtime.</p>
            <p style={{ color: theme.colors.textSecondary }}>
              Keep current systems active while Swoop comes online in parallel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
