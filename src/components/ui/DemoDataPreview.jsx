/**
 * DemoDataPreview — Modal showing sample data from a source before loading it.
 * Displays a formatted table of the first 10 rows + description of what it unlocks.
 */
import { useState, useEffect } from 'react';

// Lazy-load preview data from static files
const DATA_LOADERS = {
  members: () => import('@/data/members.js'),
  teeSheet: () => import('@/data/teeSheet.js'),
  outlets: () => import('@/data/outlets.js'),
  staffing: () => import('@/data/staffing.js'),
  email: () => import('@/data/email.js'),
  agents: () => import('@/data/agents.js'),
  weather: () => import('@/data/weather.js'),
  pipeline: () => import('@/data/pipeline.js'),
};

function formatValue(val) {
  if (val == null) return '—';
  if (typeof val === 'number') {
    if (val >= 1000) return val.toLocaleString();
    if (val < 1 && val > 0) return `${Math.round(val * 100)}%`;
    return String(val);
  }
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 40) + '...';
  const s = String(val);
  return s.length > 35 ? s.slice(0, 35) + '...' : s;
}

function formatColumnName(col) {
  return col.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
}

export default function DemoDataPreview({ source, onLoad, onClose }) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!source) return;
    setLoading(true);
    const loader = DATA_LOADERS[source.previewFile];
    if (!loader) { setLoading(false); return; }

    loader().then(mod => {
      const data = mod[source.previewExport];
      if (Array.isArray(data)) {
        setRows(data.slice(0, 10));
      } else if (data && typeof data === 'object') {
        // For object exports, show key-value pairs
        setRows(Object.entries(data).slice(0, 10).map(([key, val]) => ({ key, value: typeof val === 'object' ? JSON.stringify(val).slice(0, 60) : val })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [source]);

  if (!source) return null;

  const columns = rows && rows.length > 0
    ? (source.previewColumns || Object.keys(rows[0]).slice(0, 6))
    : [];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{source.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 m-0">{source.name}</h2>
                <p className="text-sm text-gray-500 m-0">{source.description}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center border-none cursor-pointer text-lg font-bold hover:bg-gray-200">
              &times;
            </button>
          </div>
        </div>

        {/* What you'll see */}
        <div className="px-6 py-3 bg-brand-50/50 border-b border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/20">
          <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wide mb-1">What this unlocks</div>
          <div className="flex flex-wrap gap-1.5">
            {source.unlocks.map((u, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 font-medium dark:bg-brand-500/15 dark:text-brand-400">
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* Data table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Sample Data ({rows?.length || 0} of {rows?.length || 0} rows shown)
          </div>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm animate-pulse">Loading preview...</div>
          ) : rows && rows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {columns.map(col => (
                      <th key={col} className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                        {formatColumnName(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap border-b border-gray-100 dark:border-gray-800">
                          {formatValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">No preview available</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => { onLoad(source.id); onClose(); }}
            className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-bold border-none cursor-pointer hover:bg-brand-600 transition-colors"
          >
            Load This Data
          </button>
        </div>
      </div>
    </div>
  );
}
