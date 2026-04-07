/**
 * DemoDataPreview — Modal showing actual Jonas CSV data before loading a source.
 * Fetches CSV files from /demo-data/, parses them, and shows a formatted table.
 */
import { useState, useEffect } from 'react';

function parseCSV(text, maxRows = 10) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  // Remove BOM if present
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
  return s.length > 30 ? s.slice(0, 30) + '...' : s;
}

export default function DemoDataPreview({ source, onLoad, onClose }) {
  const [activeFile, setActiveFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);

  const csvFiles = source?.csvFiles || [];

  // Auto-load first CSV file
  useEffect(() => {
    if (csvFiles.length > 0 && !activeFile) {
      setActiveFile(csvFiles[0]);
    }
  }, [source]);

  // Fetch and parse CSV when activeFile changes
  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setParsed(null);
    fetch(`/demo-data/${activeFile.file}`)
      .then(r => r.text())
      .then(text => {
        setParsed(parseCSV(text, 10));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFile]);

  if (!source) return null;

  // Show max 8 columns for readability
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
              <span className="text-2xl">{source.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 m-0">{source.name}</h2>
                <p className="text-sm text-gray-500 m-0">{source.system}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center border-none cursor-pointer text-lg font-bold hover:bg-gray-200">
              &times;
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 mb-0">{source.description}</p>
        </div>

        {/* What you'll see */}
        <div className="px-6 py-3 bg-brand-50/50 border-b border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/20">
          <div className="text-[10px] font-bold text-brand-500 uppercase tracking-wide mb-1">What Swoop builds from this data</div>
          <div className="flex flex-wrap gap-1.5">
            {source.unlocks.map((u, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 font-medium dark:bg-brand-500/15 dark:text-brand-400">
                {u}
              </span>
            ))}
          </div>
        </div>

        {/* CSV file tabs */}
        {csvFiles.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-800 flex gap-1 overflow-x-auto">
            {csvFiles.map(f => (
              <button
                key={f.file}
                onClick={() => setActiveFile(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border whitespace-nowrap cursor-pointer transition-colors ${
                  activeFile?.file === f.file
                    ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
                    : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-[10px] opacity-60">({f.rows?.toLocaleString()} rows)</span>
              </button>
            ))}
          </div>
        )}

        {/* Internal source notice */}
        {source.isInternal && (
          <div className="px-6 py-8 text-center">
            <div className="text-3xl mb-3">🤖</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Swoop AI Agents</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              These are Swoop's built-in AI agents that analyze your imported data and generate action recommendations. No external file needed — they activate automatically when you load this source.
            </div>
          </div>
        )}

        {/* Data table */}
        {!source.isInternal && (
          <div className="flex-1 overflow-auto px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {activeFile?.label || 'Data'} — showing first 10 of {parsed?.totalRows?.toLocaleString() || '...'} rows
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {activeFile?.file}
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
                          +{parsed.headers.length - 8} more
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
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {csvFiles.length > 0 && `${csvFiles.length} file${csvFiles.length > 1 ? 's' : ''} · ${csvFiles.reduce((s, f) => s + (f.rows || 0), 0).toLocaleString()} total rows`}
          </div>
          <div className="flex gap-2">
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
              Import This Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
