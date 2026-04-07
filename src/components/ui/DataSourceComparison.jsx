const rows = [
  { dataType: 'Tee time bookings', competitors: 'Rounds played, no-shows', swoop: 'Rounds + GPS pace tracking + post-round behavior' },
  { dataType: 'Dining activity', competitors: 'Check totals, covers', swoop: 'Checks + wait times + turn-stand-to-table conversion' },
  { dataType: 'Member engagement', competitors: 'Last visit date, dues status', swoop: 'Multi-signal decay curve across 6+ touchpoints' },
  { dataType: 'Staffing coverage', competitors: 'Scheduled shifts', swoop: 'Demand-driven gaps + service quality correlation' },
  { dataType: 'On-course behavior', competitors: 'Not captured', swoop: 'GPS tracking: pace, 9-hole exits, practice range visits' },
  { dataType: 'Resignation risk', competitors: 'Manual review or none', swoop: 'AI health scores with 6-8 week early warning' },
];

export default function DataSourceComparison() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 mt-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold dark:text-gray-400">
        Data depth comparison
      </div>
      <div className="text-lg font-bold text-gray-800 mt-1 mb-4 dark:text-white/90">
        Same data source. Deeper intelligence.
      </div>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-800 border-b border-gray-200 dark:text-white/90 dark:border-gray-800">Data Type</th>
              <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-800">Single-System View</th>
              <th className="text-left px-3 py-2.5 text-xs font-bold text-brand-500 border-b border-gray-200 dark:border-gray-800">Swoop Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5 text-sm font-semibold text-gray-800 border-b border-gray-100 dark:text-white/90 dark:border-gray-800">{row.dataType}</td>
                <td className="px-3 py-2.5 text-sm text-gray-500 border-b border-gray-100 dark:text-gray-400 dark:border-gray-800">{row.competitors}</td>
                <td className="px-3 py-2.5 text-sm text-gray-800 font-medium border-b border-gray-100 dark:text-white/90 dark:border-gray-800">{row.swoop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile stacked cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2">{row.dataType}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span className="font-semibold text-gray-400">Single-System:</span> {row.competitors}
            </div>
            <div className="text-xs text-gray-800 dark:text-white/90 font-medium">
              <span className="font-semibold text-brand-500">Swoop:</span> {row.swoop}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
