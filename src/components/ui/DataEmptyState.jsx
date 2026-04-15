/**
 * DataEmptyState — shown when a dashboard section has no data to display.
 * Guides the user to upload the right data type.
 */
export default function DataEmptyState({ icon, title, description, dataType }) {
  return (
    <div role="status" className="p-8 text-center rounded-xl border border-dashed border-swoop-border bg-swoop-row">
      <div className="text-[32px] mb-3 opacity-60">{icon || '\uD83D\uDCCA'}</div>
      <div className="text-sm font-bold text-swoop-text mb-1">
        {title || 'No data available'}
      </div>
      <div className="text-xs text-swoop-text-muted max-w-[360px] mx-auto leading-relaxed">
        {description || `Upload ${dataType || 'data'} to unlock this section.`}
      </div>
    </div>
  );
}
