// IntegrationHealthStrip — health bar + recommended next prompt

export default function IntegrationHealthStrip({
  connected, total, combosActive, totalCombos,
  nextRecommended = [], onClickConnected, onClickCombos,
}) {
  const pct = Math.round((connected / total) * 100);
  const remaining = total - connected;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Main row */}
      <div className="px-4 py-3 flex items-center gap-6">
        {/* Progress bar + framing */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide dark:text-gray-400">
              Integration Health
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {connected} connected \u00B7 {remaining} available
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-400 ${pct >= 50 ? 'bg-success-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Connected stat */}
        <button onClick={onClickConnected} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="text-xl font-bold text-success-500 font-mono">{connected}/{total}</span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Systems Connected</span>
        </button>

        <div className="w-px h-8 bg-gray-100 dark:bg-gray-800" />

        {/* Combos stat */}
        <button onClick={onClickCombos} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="text-xl font-bold text-brand-500 font-mono">{combosActive}/{totalCombos}</span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Cross-System Insights</span>
        </button>
      </div>

      {/* Recommended next row */}
      {nextRecommended.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2 bg-blue-light-50 dark:border-gray-800 dark:bg-blue-light-500/5">
          <span className="text-[11px] text-blue-light-600 font-bold dark:text-blue-light-400">
            \u2197 Recommended next:
          </span>
          {nextRecommended.slice(0, 3).map((v) => (
            <span key={v.id} className="text-[11px] text-gray-800 bg-gray-100 rounded-lg px-2 py-0.5 font-medium dark:text-white/90 dark:bg-gray-800">
              {v.icon} {v.name}
            </span>
          ))}
          <span className="text-[11px] text-gray-500 ml-1 dark:text-gray-400">
            \u2014 connecting these unlocks {nextRecommended.length} more insights
          </span>
        </div>
      )}
    </div>
  );
}
