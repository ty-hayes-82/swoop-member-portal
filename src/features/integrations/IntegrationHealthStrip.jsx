import { theme } from '@/config/theme';

export function IntegrationHealthStrip({ health }) {
  const freshnessColor = health.dataFreshness === 'n/a' ? theme.colors.integrationWarn : theme.colors.operations;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: 12,
      marginBottom: 18,
    }}>
      <StatCard
        label="Connected Systems"
        value={`${health.connected}/${health.total}`}
        accent={theme.colors.operations}
      />
      <StatCard
        label="Data Freshness"
        value={health.dataFreshness}
        accent={freshnessColor}
      />
      <StatCard
        label="Sync Status"
        value={health.syncStatus}
        accent={health.syncStatus === 'Healthy' ? theme.colors.operations : theme.colors.integrationWarn}
      />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: theme.colors.white,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: theme.colors.textMuted,
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: theme.fontSize.md,
        fontWeight: 700,
        color: accent,
        fontFamily: theme.fonts.mono,
      }}>
        {value}
      </div>
    </div>
  );
}
