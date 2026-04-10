// DES-P06: Empty state component for "no data" scenarios

export default function EmptyState({
  icon = '\uD83D\uDCCA',
  title = 'No data available',
  description = "There's nothing here yet. Check back later or adjust your filters.",
  action,
  actionLabel = 'Refresh',
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-5 py-16 sm:px-6 text-center min-h-[300px] rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="text-[64px] mb-4 opacity-60">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-3 m-0 dark:text-white/90">
        {title}
      </h3>

      <p className="text-sm text-gray-600 max-w-[400px] mb-6 leading-relaxed dark:text-gray-400">
        {description}
      </p>

      {(action || onAction) && (
        <button
          onClick={onAction || action}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-theme-xs hover:bg-brand-600 hover:-translate-y-px hover:shadow-theme-md focus-visible:ring-2 focus-visible:ring-brand-500"
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
      icon="\u2705"
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
      icon="\uD83D\uDD0D"
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
      icon="\uD83D\uDD0C"
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
      icon="\uD83D\uDCC8"
      title="No reports available"
      description="Generate your first report to start tracking member engagement and revenue insights."
      actionLabel="Generate report"
      onAction={onGenerate}
    />
  );
}
