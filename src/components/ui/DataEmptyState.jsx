/**
 * DataEmptyState — shown when a dashboard section has no data to display.
 * Guides the user to upload the right data type.
 */
export default function DataEmptyState({ icon, title, description, dataType }) {
  return (
    <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
      <div className="text-[32px] mb-3 opacity-60">{icon || '\uD83D\uDCCA'}</div>
      <div className="text-sm font-bold text-gray-800 mb-1 dark:text-white/90">
        {title || 'No data available'}
      </div>
      <div className="text-xs text-gray-500 max-w-[360px] mx-auto leading-relaxed dark:text-gray-400">
        {description || `Upload ${dataType || 'data'} to unlock this section.`}
      </div>
    </div>
  );
}
