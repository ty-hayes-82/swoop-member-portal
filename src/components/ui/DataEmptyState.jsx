/**
 * DataEmptyState — shown when a dashboard section has no data to display.
 * Guides the user to upload the right data type.
 */
export default function DataEmptyState({ icon, title, description, dataType, actions }) {
  return (
    <div role="status" className="p-10 text-center rounded-xl border border-swoop-border bg-swoop-panel shadow-theme-xs">
      <div className="text-[32px] mb-3 opacity-60">{icon || '\uD83D\uDCCA'}</div>
      <div className="text-sm font-bold text-swoop-text mb-1">
        {title || 'No data available'}
      </div>
      <div className="text-xs text-swoop-text-muted max-w-[420px] mx-auto leading-relaxed">
        {description || `Upload ${dataType || 'data'} to activate this section.`}
      </div>
      {actions && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
