import { theme } from '@/config/theme';

// DES-P06: Empty state component for "no data" scenarios

export default function EmptyState({
  icon = '📊',
  title = 'No data available',
  description = "There's nothing here yet. Check back later or adjust your filters.",
  action,
  actionLabel = 'Refresh',
  onAction,
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${theme.spacing.xxl} ${theme.spacing.lg}`,
        textAlign: 'center',
        minHeight: '300px',
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '64px',
          marginBottom: theme.spacing.md,
          opacity: 0.6,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: theme.fontSize.lg,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.sm,
          margin: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textSecondary,
          maxWidth: '400px',
          marginBottom: theme.spacing.lg,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {(action || onAction) && (
        <button
          onClick={onAction || action}
          style={{
            padding: '10px 20px',
            fontSize: theme.fontSize.sm,
            fontWeight: 600,
            color: theme.colors.white,
            background: theme.colors.accent,
            border: 'none',
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: theme.shadow.sm,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.accentHover || theme.colors.accent;
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = theme.shadow.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.accent;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme.shadow.sm;
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyAlerts({ onRefresh }) {
  return (
    <EmptyState
      icon="✅"
      title="No alerts right now"
      description="You're all caught up! Check back later for new insights, or refresh to see if anything has changed."
      actionLabel="Refresh data"
      onAction={onRefresh}
    />
  );
}

export function EmptyMembers({ onClearFilters }) {
  return (
    <EmptyState
      icon="🔍"
      title="No members found"
      description="Try adjusting your filters or search criteria to see more results."
      actionLabel="Clear filters"
      onAction={onClearFilters}
    />
  );
}

export function EmptyIntegrations({ onConnect }) {
  return (
    <EmptyState
      icon="🔌"
      title="No integrations connected"
      description="Connect your club management systems to unlock Swoop's intelligence capabilities."
      actionLabel="Connect system"
      onAction={onConnect}
    />
  );
}

export function EmptyReports({ onGenerate }) {
  return (
    <EmptyState
      icon="📈"
      title="No reports available"
      description="Generate your first report to start tracking member engagement and revenue insights."
      actionLabel="Generate report"
      onAction={onGenerate}
    />
  );
}
