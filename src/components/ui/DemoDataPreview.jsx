/**
 * DemoDataPreview — Modal showing a single Jonas CSV file before importing.
 * Fetches the CSV from /demo-data/, parses it, and shows a formatted table.
 */
import { useState, useEffect } from 'react';

function parseCSV(text, maxRows = 12) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return { headers, rows, totalRows: lines.length - 1 };
}

function formatValue(val) {
  if (val == null || val === '') return '—';
  const s = String(val);
  return s.length > 28 ? s.slice(0, 28) + '...' : s;
}

export default function DemoDataPreview({ file, onLoad, onClose }) {
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file?.file) { setLoading(false); return; }
    setLoading(true);
    setParsed(null);
    fetch(`/demo-data/${file.file}`)
      .then(r => r.text())
      .then(text => {
        setParsed(parseCSV(text, 12));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file]);

  if (!file) return null;

  const displayHeaders = parsed?.headers?.slice(0, 8) || [];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{file.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 m-0">{file.name}</h2>
                <p className="text-sm text-gray-500 m-0">{file.system}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center border-none cursor-pointer text-lg font-bold hover:bg-gray-200">
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 mb-0">{file.description}</p>
        </div>

        {/* What it unlocks */}
        <div className="px-6 py-3 bg-brand-50/50 border-b border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/20">
          <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wide mb-1">What Swoop builds from this file</div>
          <div className="flex flex-wrap gap-1.5">
            {file.unlocks.map((u, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 font-medium dark:bg-brand-500/15 dark:text-brand-400">
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* Data table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Showing first {parsed?.rows?.length || '...'} of {parsed?.totalRows?.toLocaleString() || file.rows?.toLocaleString() || '...'} rows
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {file.file}
            </div>
          </div>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm animate-pulse">Loading CSV data...</div>
          ) : parsed && parsed.rows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {displayHeaders.map(col => (
                      <th key={col} className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                        {col}
                      </th>
                    ))}
                    {(parsed.headers.length > 8) && (
                      <th className="text-left px-3 py-2 font-semibold text-gray-400 text-[10px] border-b border-gray-200 dark:border-gray-700">
                        +{parsed.headers.length - 8} more columns
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
                      {displayHeaders.map(col => (
                        <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap border-b border-gray-100 dark:border-gray-800 font-mono text-[11px]">
                          {formatValue(row[col])}
                        </td>
                      ))}
                      {(parsed.headers.length > 8) && (
                        <td className="px-3 py-2 text-gray-400 text-[10px] border-b border-gray-100 dark:border-gray-800">...</td>
                      )}
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
          <div className="text-xs text-gray-400">
            {file.rows?.toLocaleString()} rows · {file.file}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={() => onLoad(file.id)}
              className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-bold border-none cursor-pointer hover:bg-brand-600 transition-colors"
            >
              Import This File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
