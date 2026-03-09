import { theme } from '@/config/theme';
import { agents } from '@/landing/data';

const iconLabel = {
  Radar: 'DS',
  RefreshCw: 'WO',
  UserRound: 'MS',
  ChefHat: 'FB',
  UsersRound: 'LP',
  LineChart: 'RA',
};

export default function AgentsSection() {
  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
        Your GM platform now has a staff.
      </h2>
      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.lg,
        marginBottom: theme.spacing.xl,
      }}>
        AI agents monitor your operations continuously, recommend actions, and trigger automation
        where your team loses time today.
      </p>
      <div className="landing-grid-3">
        {agents.map((agent) => (
          <article
            key={agent.name}
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bgCard,
              padding: 'clamp(18px, 3vw, 22px)',
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              minHeight: 0,
              height: '100%',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.md,
              background: theme.colors.bgDeep,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.mono,
              fontSize: theme.fontSize.sm,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}>
              {iconLabel[agent.icon]}
            </div>
            <h3 style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.sm }}>
              {agent.name}
            </h3>
            <p style={{ color: theme.colors.textSecondary }}>{agent.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
