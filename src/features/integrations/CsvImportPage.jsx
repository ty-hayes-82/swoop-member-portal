/**
 * CsvImportPage — Tutorial-style CSV import wizard with column mapping
 * Accessible via #/integrations/csv-import or #/csv-import
 *
 * 4-step flow:
 *   Step 0: Choose your club software vendor + data type
 *   Step 1: Upload your file
 *   Step 2: Map columns (auto-detected from Jonas aliases, manually adjustable)
 *   Step 3: Preview & import
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import {
  JONAS_IMPORT_TYPES,
  SUPPORTED_VENDORS,
  autoMapColumns,
  getImportTypeConfig,
} from '@/config/jonasMapping';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text) {
  // Handle quoted fields with commas inside
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === '\n' && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return { headers: [], rows: [] };

  function splitRow(line) {
    const fields = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else { q = !q; }
      } else if (c === ',' && !q) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  // Strip BOM from first header
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) headerLine = headerLine.slice(1);

  const headers = splitRow(headerLine);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Select Data', 'Upload File', 'Map Columns', 'Import'];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < current
                  ? 'bg-green-500 text-white'
                  : i === current
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] mt-1 ${i === current ? 'text-brand-500 font-semibold' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 h-0.5 mx-1 mb-4 ${i < current ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 0: Select vendor + data type ────────────────────────────────────────

function StepSelectData({ vendor, setVendor, importType, setImportType, onNext }) {
  const jonasTypes = JONAS_IMPORT_TYPES;

  return (
    <div>
      {/* Vendor selector */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Which club software are you importing from?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SUPPORTED_VENDORS.map(v => (
            <button
              key={v.id}
              onClick={() => v.supported && setVendor(v.id)}
              disabled={!v.supported}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                vendor === v.id
                  ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{v.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{v.supported ? v.description : 'Coming soon'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Data type cards */}
      {vendor && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            What data are you importing?
          </h2>
          {vendor === 'jonas' && (
            <p className="text-xs text-gray-400 mb-3">
              Follow the recommended order below. Each import unlocks more intelligence.
            </p>
          )}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {jonasTypes.map((t, idx) => (
              <button
                key={t.key}
                onClick={() => { setImportType(t.key); }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  importType === t.key
                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl mt-0.5">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800 dark:text-white/90">{t.label}</span>
                      {vendor === 'jonas' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          Step {t.stepNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description}</p>
                    {vendor === 'jonas' && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {t.unlocks.slice(0, 2).map(u => (
                          <span key={u} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                            {u}
                          </span>
                        ))}
                        {t.unlocks.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 dark:bg-gray-700">
                            +{t.unlocks.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {vendor === 'jonas' && (
                  <div className="mt-2 ml-8 text-[10px] text-gray-400">
                    Jonas file: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{t.jonasFile}</code>
                    {' '}&middot;{' '}Export via {t.jonasExportMethod}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!vendor || !importType}
        className="w-full mt-6 py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#ff8b00' }}
      >
        Next: Upload File
      </button>
    </div>
  );
}

// ── Step 1: Upload file ──────────────────────────────────────────────────────

function StepUploadFile({ importType, vendor, file, setFile, onNext, onBack }) {
  const fileInputRef = useRef(null);
  const config = getImportTypeConfig(importType);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const validateAndSetFile = useCallback((f) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setFileError(`Unsupported file type ".${ext}". Please upload a .csv or .xlsx file.`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }, [setFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) validateAndSetFile(f);
  }, [validateAndSetFile]);

  return (
    <div>
      {/* Instructions card */}
      {vendor === 'jonas' && config && (
        <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
          <div className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-1">
            How to export from Jonas
          </div>
          <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
            <li>Open <strong>{config.jonasModule}</strong> in Jonas</li>
            <li>Navigate to the relevant report or entity list</li>
            <li>Export via <strong>{config.jonasExportMethod}</strong></li>
            <li>Save as CSV (comma-delimited) or Excel (.xlsx)</li>
          </ol>
          <div className="mt-2 text-[10px] text-blue-500 dark:text-blue-500">
            Expected file: <code className="bg-blue-100 dark:bg-blue-500/20 px-1 rounded">{config.jonasFile}</code>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-4 p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-brand-400 bg-brand-500/5'
            : file
            ? 'border-green-400 bg-green-50 dark:bg-green-500/5 dark:border-green-500/40'
            : 'border-gray-300 bg-gray-50 hover:border-brand-400 dark:bg-gray-800 dark:border-gray-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={e => validateAndSetFile(e.target.files?.[0])}
          className="hidden"
        />
        {file ? (
          <>
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{file.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {(file.size / 1024).toFixed(1)} KB &middot; Click or drop to change
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl mb-2">📁</div>
            <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">
              Drop your file here, or click to browse
            </div>
            <div className="text-xs text-gray-400 mt-1">CSV or XLSX &middot; First row must be column headers</div>
          </>
        )}
      </div>

      {/* Required fields hint */}
      {/* File type error */}
      {fileError && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
          {fileError}
        </div>
      )}

      {config && (
        <div className="mb-4 text-xs text-gray-400">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Required columns: </span>
          {config.fields.filter(f => f.required).map(f => f.label).join(', ')}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-gray-200 font-semibold text-sm text-gray-600 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!file}
          className="flex-[2] py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#ff8b00' }}
        >
          Next: Map Columns
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Column mapping ───────────────────────────────────────────────────

function StepMapColumns({ importType, csvHeaders, mapping, setMapping, previewRows, onNext, onBack }) {
  const config = getImportTypeConfig(importType);
  if (!config) return null;

  const swoopFields = config.fields;
  const mappedSwoopFields = new Set(Object.values(mapping).filter(Boolean));

  const requiredMissing = swoopFields.filter(f => f.required && !mappedSwoopFields.has(f.swoop));
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  const handleChange = (csvHeader, newSwoopField) => {
    setMapping(prev => ({ ...prev, [csvHeader]: newSwoopField || null }));
  };

  return (
    <div>
      {/* Status summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Column Mapping</span>
          <span className="text-xs text-gray-400 ml-2">
            {mappedCount} of {csvHeaders.length} columns mapped
          </span>
        </div>
        {requiredMissing.length > 0 && (
          <div className="text-xs text-red-500 font-medium">
            {requiredMissing.length} required field{requiredMissing.length > 1 ? 's' : ''} unmapped
          </div>
        )}
        {requiredMissing.length === 0 && (
          <div className="text-xs text-green-500 font-medium">All required fields mapped</div>
        )}
      </div>

      {/* Mapping table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div>Your CSV Column</div>
          <div className="px-3">→</div>
          <div>Swoop Field</div>
        </div>
        <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {csvHeaders.map(header => {
            const swoopField = mapping[header];
            const fieldConfig = swoopFields.find(f => f.swoop === swoopField);
            const isRequired = fieldConfig?.required;
            const isMapped = !!swoopField;

            return (
              <div
                key={header}
                className={`grid grid-cols-[1fr_auto_1fr] gap-0 items-center px-3 py-2 ${
                  isMapped ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{header}</code>
                  {previewRows[0] && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]" title={previewRows[0][header]}>
                      e.g. "{previewRows[0][header]?.slice(0, 30)}"
                    </span>
                  )}
                </div>
                <div className="px-3 text-gray-300 dark:text-gray-600">→</div>
                <div>
                  <select
                    value={swoopField || ''}
                    onChange={e => handleChange(header, e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                      isMapped
                        ? isRequired
                          ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400'
                          : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500'
                    }`}
                  >
                    <option value="">— Skip this column —</option>
                    {swoopFields.map(f => {
                      const alreadyUsed = mappedSwoopFields.has(f.swoop) && swoopField !== f.swoop;
                      return (
                        <option key={f.swoop} value={f.swoop} disabled={alreadyUsed}>
                          {f.label}{f.required ? ' *' : ''}{alreadyUsed ? ' (already mapped)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {previewRows.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Data Preview (first {previewRows.length} rows, mapped fields only)
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {swoopFields.filter(f => mappedSwoopFields.has(f.swoop)).map(f => (
                    <th key={f.swoop} className="px-2 py-1.5 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 5).map((row, i) => {
                  // Reverse-lookup: for each mapped swoop field, find the CSV header
                  const reverseMap = {};
                  for (const [csvH, swoopF] of Object.entries(mapping)) {
                    if (swoopF) reverseMap[swoopF] = csvH;
                  }
                  return (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      {swoopFields.filter(f => mappedSwoopFields.has(f.swoop)).map(f => (
                        <td key={f.swoop} className="px-2 py-1 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[150px] truncate">
                          {row[reverseMap[f.swoop]] || '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-gray-200 font-semibold text-sm text-gray-600 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={requiredMissing.length > 0}
          className="flex-[2] py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#ff8b00' }}
        >
          {requiredMissing.length > 0
            ? `Map ${requiredMissing.length} required field${requiredMissing.length > 1 ? 's' : ''} to continue`
            : `Import ${previewRows.length.toLocaleString()} Rows`}
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Import ───────────────────────────────────────────────────────────

function StepImport({ importType, mapping, parsedRows, result, error, uploading, onImport, onReset }) {
  const config = getImportTypeConfig(importType);

  return (
    <div>
      {!result && !error && !uploading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-2">Ready to Import</h2>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{parsedRows.length.toLocaleString()}</strong> rows of <strong>{config?.label}</strong> data
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {Object.values(mapping).filter(Boolean).length} columns mapped to Swoop fields
          </p>
          <button
            onClick={onImport}
            className="px-8 py-3 rounded-lg font-bold text-sm text-white cursor-pointer"
            style={{ background: '#ff8b00' }}
          >
            Start Import
          </button>
        </div>
      )}

      {uploading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Importing {parsedRows.length.toLocaleString()} rows...</p>
          <p className="text-xs text-gray-400 mt-1">This may take a moment for large files</p>
        </div>
      )}

      {error && (
        <div className="py-6">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30">
            <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Import Failed</div>
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
          <button
            onClick={onReset}
            className="w-full mt-4 py-3 rounded-lg border border-gray-200 font-semibold text-sm text-gray-600 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            Start Over
          </button>
        </div>
      )}

      {result && (
        <div className="py-6">
          <div className={`p-4 rounded-xl border ${
            result.status === 'completed'
              ? 'bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30'
              : result.status === 'partial'
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/30'
              : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">
                {result.status === 'completed' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-800 dark:text-white/90">
                  Import {result.status === 'completed' ? 'Complete' : result.status === 'partial' ? 'Partially Complete' : 'Failed'}
                </div>
                <div className="text-xs text-gray-500">
                  {config?.label} &middot; {result.totalRows.toLocaleString()} rows processed
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className="text-lg font-bold text-gray-800 dark:text-white/90">{result.totalRows.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">Total</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{result.success.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400">Imported</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className={`text-lg font-bold ${result.errors > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                  {result.errors.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">Errors</div>
              </div>
            </div>
            {result.errorDetails?.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                {result.errorDetails.slice(0, 10).map((e, i) => (
                  <div key={i} className="py-0.5">Row {e.row}: <span className="text-red-500">{e.field}</span> — {e.message}</div>
                ))}
                {result.errorDetails.length > 10 && (
                  <div className="text-gray-400">...and {result.errorDetails.length - 10} more</div>
                )}
              </div>
            )}
          </div>

          {/* What to do next */}
          {result.status !== 'failed' && config && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
              <div className="font-semibold text-xs text-blue-800 dark:text-blue-300 mb-1">What this unlocks:</div>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
                {config.unlocks.map(u => <li key={u}>• {u}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onReset}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-white cursor-pointer"
              style={{ background: '#ff8b00' }}
            >
              Import More Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export default function CsvImportPage() {
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;

  // Wizard state
  const [step, setStep] = useState(0);
  const [vendor, setVendor] = useState('jonas');
  const [importType, setImportType] = useState('members');
  const [file, setFile] = useState(null);

  // Parsed data
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [mapping, setMapping] = useState({});

  // Import state
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [parseError, setParseError] = useState(null);

  // Parse file when moving from step 1 → step 2
  const handleFileNext = useCallback(async () => {
    if (!file) return;
    setParseError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers = [];
      let rows = [];

      if (ext === 'csv') {
        const text = await file.text();
        const result = parseCSV(text);
        headers = result.headers;
        rows = result.rows;
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws);
        if (rows.length > 0) headers = Object.keys(rows[0]);
      } else {
        setParseError(`Unsupported file type ".${ext}". Please upload a .csv or .xlsx file.`);
        return;
      }

      if (rows.length === 0) {
        setParseError('No data rows found in file. Make sure the first row contains column headers.');
        return;
      }

      setCsvHeaders(headers);
      setParsedRows(rows);

      // Auto-map columns using Jonas aliases
      const autoMapped = autoMapColumns(headers, importType);
      setMapping(autoMapped);

      setStep(2);
    } catch (err) {
      setParseError(`File parse error: ${err.message}`);
    }
  }, [file, importType]);

  // Transform rows using the user's mapping and send to API
  const handleImport = useCallback(async () => {
    if (!clubId) { setError('No club connected. Please log in first.'); return; }
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Build reverse map: swoopField → csvHeader
      const reverseMap = {};
      for (const [csvH, swoopF] of Object.entries(mapping)) {
        if (swoopF) reverseMap[swoopF] = csvH;
      }

      // Transform each row: { csvHeader: value } → { swoopField: value }
      const transformedRows = parsedRows.map(row => {
        const out = {};
        for (const [swoopField, csvHeader] of Object.entries(reverseMap)) {
          out[swoopField] = row[csvHeader] ?? '';
        }
        return out;
      });

      const user = (() => { try { return JSON.parse(localStorage.getItem('swoop_auth_user') || '{}'); } catch { return {}; } })();
      const token = localStorage.getItem('swoop_auth_token');

      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clubId,
          importType,
          rows: transformedRows,
          uploadedBy: user.userId || 'csv-import-tool',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Import failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
    setUploading(false);
  }, [clubId, importType, mapping, parsedRows]);

  const handleReset = () => {
    setStep(0);
    setFile(null);
    setCsvHeaders([]);
    setParsedRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    setParseError(null);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">Import Data</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Import CSV or XLSX files from your club software. We'll auto-detect columns and map them for you.
      </p>

      <StepIndicator current={step} />

      {step === 0 && (
        <StepSelectData
          vendor={vendor}
          setVendor={setVendor}
          importType={importType}
          setImportType={setImportType}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <>
          <StepUploadFile
            importType={importType}
            vendor={vendor}
            file={file}
            setFile={(f) => { setFile(f); setParseError(null); }}
            onNext={handleFileNext}
            onBack={() => setStep(0)}
          />
          {parseError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
              {parseError}
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <StepMapColumns
          importType={importType}
          csvHeaders={csvHeaders}
          mapping={mapping}
          setMapping={setMapping}
          previewRows={parsedRows}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepImport
          importType={importType}
          mapping={mapping}
          parsedRows={parsedRows}
          result={result}
          error={error}
          uploading={uploading}
          onImport={handleImport}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
