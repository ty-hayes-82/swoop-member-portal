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
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  JONAS_IMPORT_TYPES,
  SUPPORTED_VENDORS,
  autoMapColumns,
  getImportTypeConfig,
} from '@/config/jonasMapping';
import { getFullRoster } from '@/services/memberService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import AIImportAssistant from './AIImportAssistant';

// § 1.3 trust boundary — CSV import is a privileged operation that mutates
// tenant data. Only GMs, club admins, and swoop_admin should ever see the UI.
const IMPORT_ALLOWED_ROLES = new Set(['gm', 'admin', 'swoop_admin']);

// ── Auto-classify ────────────────────────────────────────────────────────────
// Dependency order — tenant-scoped tables reference each other, so importing
// e.g. event_registrations before events leaves the FK chain broken. Members
// is always first; everything else falls in here.
const IMPORT_DEP_ORDER = [
  'members', 'club_profile', 'households', 'membership_types',
  'courses', 'tee_times', 'booking_players',
  'transactions', 'sales_areas', 'pos_checks', 'line_items', 'payments', 'daily_close',
  'staff', 'shifts',
  'events', 'event_registrations', 'email_campaigns', 'email_events',
  'invoices', 'complaints', 'service_requests',
];

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase().replace(/[\s_#\-()]/g, '');
}

// ── AI co-pilot helpers ──────────────────────────────────────────────────────

function getAIAuthHeaders() {
  try {
    const token = localStorage.getItem('swoop_auth_token');
    if (token && token !== 'demo') return { Authorization: `Bearer ${token}` };
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    if (user?.clubId?.startsWith('demo_')) return { 'X-Demo-Club': user.clubId };
  } catch { /* ignore */ }
  return { 'X-Demo-Club': 'club_001' };
}

async function parseHeadersOnly(file) {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') return { headers: [], rowCount: null };
    const text = await file.slice(0, 8192).text();
    const firstNL = text.indexOf('\n');
    if (firstNL === -1) return { headers: [], rowCount: null };
    const headers = text.slice(0, firstNL).replace(/\r$/, '')
      .split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return { headers, rowCount: Math.round(file.size / 50) };
  } catch { return { headers: [], rowCount: null }; }
}

async function callAIForStep({ step, file, parsedHeaders, sampleRows, rowCount, mapping, previewCounts, importType, sessionId }) {
  const authHeaders = getAIAuthHeaders();
  let message;
  let file_data;

  if (step === 1) {
    message = `The user uploaded "${file?.name || 'upload.csv'}" for a ${importType} import. File headers: ${parsedHeaders.join(', ')}. Estimated rows: ${rowCount ?? 'unknown'}. In 2–3 sentences: identify the data type, guess the vendor software (Jonas, ForeTees, Toast, Clubessential, etc.), note the row count, and flag any obvious data quality issues. Be concise — this appears below a file dropzone in the import wizard.`;
    file_data = { filename: file?.name || 'upload.csv', headers: parsedHeaders, sampleRows: (sampleRows || []).slice(0, 5), rowCount };
  } else if (step === 2) {
    const mappedEntries = Object.entries(mapping).filter(([, v]) => v);
    const unmappedCols = Object.entries(mapping).filter(([, v]) => !v).map(([c]) => c);
    const mapped = mappedEntries.map(([c, f]) => `${c} → ${f}`).join(', ');
    // Chips-only: no summary prose. One chip per actionable issue found.
    message = `You are a data-mapping assistant for Swoop golf club platform. Analyze the CSV mapping and return ONLY a valid JSON object — no markdown, no prose.

Return format:
{
  "suggestions": [
    { "type": "remap",   "csvCol": "<exact CSV column name>", "targetField": "<swoop field key>", "label": "<≤6 word action>", "reason": "<1 sentence why>" },
    { "type": "skip",    "csvCol": "<exact CSV column name>", "targetField": null, "label": "Skip <column>", "reason": "<1 sentence why safe to skip>" },
    { "type": "warning", "csvCol": "<exact CSV column name>", "targetField": null, "label": "<≤8 word issue>", "reason": "<1 sentence data concern with sample evidence>" }
  ],
  "validation": { "ready": <N>, "warnings": <N>, "errors": <N> }
}

Rules — generate ONE chip per issue found, up to 6 total:
- "remap": CSV column currently unmapped but clearly matches a Swoop field (e.g. "Member Number" → external_id)
- "skip": unmapped column that is safe to ignore (e.g. mailing flags, internal codes)
- "warning": suspicious sample data — wrong gender values, invalid emails, missing required fields, unexpected formats

Import type: ${importType}
Currently mapped: ${mapped || 'none yet'}
Unmapped columns: ${unmappedCols.join(', ') || 'none'}
All CSV headers: ${parsedHeaders.join(', ')}
Sample rows (first 5): ${JSON.stringify((sampleRows || []).slice(0, 5))}
Total rows: ~${rowCount}

Be specific. If sample values show "F" for names that look male, say so. If an email column has invalid formats, say how many. Count validation errors from the sample — extrapolate to full row count.`;
    file_data = { filename: file?.name || 'upload.csv', headers: parsedHeaders, sampleRows: (sampleRows || []).slice(0, 3), rowCount };
  } else if (step === 3) {
    const { toCreate = 0, toUpdate = 0, rejected = [] } = previewCounts || {};
    const rejectedCount = Array.isArray(rejected) ? rejected.length : (rejected || 0);
    const topReasons = Array.isArray(rejected)
      ? [...new Set(rejected.slice(0, 5).map(r => r.reason))].join('; ')
      : '';
    message = `Write a single plain-English paragraph (no markdown, no bullet points) summarizing this import preview for a golf club GM: ${importType} import, ${toCreate} records to create, ${toUpdate} to update, ${rejectedCount} rejected${topReasons ? ` (reasons: ${topReasons})` : ''}. Mention what the rejected rows mean for data coverage if relevant. Keep it friendly and direct — 2–3 sentences max.`;
  }

  try {
    const res = await fetch('/api/onboarding-agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        message,
        session_id: sessionId || undefined,
        ...(file_data ? { file_data } : {}),
        ...(step === 2 ? { json_mode: true } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.response || null;
    // Step 2: chips-only — parse JSON, no prose summary
    if (step === 2 && raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
          text: null,   // intentionally suppressed — step 2 is chips-only
          suggestions: (parsed.suggestions || []).map((s, i) => ({ ...s, id: `sug-${i}` })),
          validation: parsed.validation || null,
          sessionId: data.session_id || null,
        };
      } catch { /* fall through — no chips shown on parse error */ }
      return { text: null, suggestions: [], validation: null, sessionId: data.session_id || null };
    }
    return { text: raw, suggestions: [], validation: null, sessionId: data.session_id || null };
  } catch {
    return null;
  }
}

/**
 * Classify a CSV by matching its header set against every JONAS_IMPORT_TYPES
 * entry's aliases. Returns the best-scoring type with confidence in [0,1].
 * A type's score is the fraction of its *required* fields that matched AT
 * LEAST one alias in the file headers. Ties broken by total matched fields.
 */
function classifyHeaders(headers) {
  const normalized = new Set(headers.map(normalizeHeader).filter(Boolean));
  let best = null;
  for (const importType of JONAS_IMPORT_TYPES) {
    const required = importType.fields.filter(f => f.required);
    if (required.length === 0) continue;
    const requiredMatched = required.filter(f =>
      f.aliases.some(a => normalized.has(normalizeHeader(a)))
    ).length;
    const totalMatched = importType.fields.filter(f =>
      f.aliases.some(a => normalized.has(normalizeHeader(a)))
    ).length;
    const confidence = requiredMatched / required.length;
    const score = confidence * 100 + totalMatched; // break ties on total overlap
    if (!best || score > best.score) {
      best = { importType: importType.key, label: importType.label, confidence, requiredMatched, required: required.length, totalMatched, score };
    }
  }
  return best;
}

function MultiFileDropZone({ onFilesClassified }) {
  const [files, setFiles] = useState([]); // [{ file, name, size, headers, classification }]
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const ingest = useCallback(async (fileList) => {
    const incoming = Array.from(fileList || []).filter(f =>
      /\.(csv|xlsx|xls)$/i.test(f.name)
    );
    const classified = [];
    for (const file of incoming) {
      try {
        let headers = [];
        if (/\.csv$/i.test(file.name)) {
          const text = await file.text();
          const parsed = parseCSV(text);
          headers = parsed.headers || [];
        } else {
          const XLSX = await import('xlsx');
          const data = await file.arrayBuffer();
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws);
          headers = rows.length ? Object.keys(rows[0]) : [];
        }
        classified.push({
          file,
          name: file.name,
          size: file.size,
          headers,
          classification: classifyHeaders(headers),
        });
      } catch (err) {
        classified.push({ file, name: file.name, size: file.size, headers: [], classification: null, error: err.message });
      }
    }
    setFiles(prev => [...prev, ...classified]);
    onFilesClassified?.(classified);
  }, [onFilesClassified]);

  const removeFile = (i) => setFiles(prev => prev.filter((_, j) => j !== i));
  const overrideType = (i, importType) => setFiles(prev => prev.map((f, j) =>
    j === i ? { ...f, classification: { ...(f.classification || {}), importType, label: JONAS_IMPORT_TYPES.find(t => t.key === importType)?.label || importType, confidence: 1, manualOverride: true } } : f
  ));
  const clearAll = () => setFiles([]);

  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-swoop-text mb-0.5">Quick Upload</h3>
          <p className="text-xs text-swoop-text-muted">
            Drop all your files at once — we'll auto-detect each one.
          </p>
        </div>
        {files.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-swoop-text-muted hover:text-swoop-text-2 bg-transparent border-none cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); ingest(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-brand-500 bg-brand-500/[0.05]'
            : 'border-swoop-border bg-swoop-row'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={(e) => ingest(e.target.files)}
          className="hidden"
          data-testid="bulk-csv-input"
        />
        <div className="text-3xl mb-2">📁</div>
        <div className="text-sm font-semibold text-swoop-text-2">
          Drop CSV or XLSX files here, or click to browse
        </div>
        <div className="text-xs text-swoop-text-label mt-1">
          Up to 22 datasets — members, tee sheet, POS, payroll, events, etc.
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((f, i) => {
            const c = f.classification;
            const confBadge = !c ? { label: 'unknown', color: 'bg-red-500/10 text-red-600' }
              : c.confidence >= 1 ? { label: 'high', color: 'bg-green-500/10 text-green-600' }
              : c.confidence >= 0.5 ? { label: 'medium', color: 'bg-amber-500/10 text-amber-600' }
              : { label: 'low', color: 'bg-red-500/10 text-red-600' };
            return (
              <div key={f.name + i} className="flex items-center gap-3 p-3 rounded-lg border border-swoop-border">
                <div className="text-lg">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-swoop-text truncate">{f.name}</div>
                  <div className="text-xs text-swoop-text-muted">
                    {(f.size / 1024).toFixed(1)} KB · {f.headers.length} columns · detected as{' '}
                    <select
                      value={c?.importType || ''}
                      onChange={(e) => overrideType(i, e.target.value)}
                      className="text-xs bg-transparent border border-swoop-border rounded px-1 py-0.5"
                    >
                      <option value="">— choose —</option>
                      {JONAS_IMPORT_TYPES.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${confBadge.color}`}>
                  {confBadge.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-swoop-text-label hover:text-red-500 bg-transparent border-none cursor-pointer text-lg leading-none"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Client-side dry-run diff. Returns { totalRows, toCreate, toUpdate, rejected: [{row, reason}] }
function buildImportPreview({ parsedRows, mapping, importType, csvHeaders }) {
  const config = getImportTypeConfig(importType);
  const reverseMap = {};
  for (const [csvH, swoopF] of Object.entries(mapping)) {
    if (swoopF) reverseMap[swoopF] = csvH;
  }
  const requiredFields = (config?.fields || []).filter(f => f.required).map(f => f.swoop);
  const dateFields = (config?.fields || [])
    .filter(f => /date|birthday/i.test(f.swoop))
    .map(f => f.swoop);
  const unknownColumns = csvHeaders.filter(h => !mapping[h]);

  // Only members diff against roster; other types treat all as "create"
  const roster = importType === 'members' ? getFullRoster() : [];
  const rosterByExt = new Map();
  const rosterByEmail = new Map();
  for (const m of roster) {
    if (m.external_id) rosterByExt.set(String(m.external_id).toLowerCase(), m);
    if (m.email) rosterByEmail.set(String(m.email).toLowerCase(), m);
  }

  let toCreate = 0;
  let toUpdate = 0;
  const rejected = [];
  parsedRows.forEach((row, idx) => {
    const mapped = {};
    for (const [swoopField, csvHeader] of Object.entries(reverseMap)) {
      mapped[swoopField] = row[csvHeader] ?? '';
    }
    const missing = requiredFields.filter(f => !mapped[f] || String(mapped[f]).trim() === '');
    if (missing.length) {
      rejected.push({ row: idx + 2, reason: `missing required: ${missing.join(', ')}` });
      return;
    }
    const badDates = dateFields.filter(f => mapped[f] && isNaN(Date.parse(mapped[f])));
    if (badDates.length) {
      rejected.push({ row: idx + 2, reason: `invalid date: ${badDates.join(', ')}` });
      return;
    }
    if (importType === 'members') {
      const ext = mapped.external_id && String(mapped.external_id).toLowerCase();
      const email = mapped.email && String(mapped.email).toLowerCase();
      const match = (ext && rosterByExt.get(ext)) || (email && rosterByEmail.get(email));
      if (match) toUpdate++; else toCreate++;
    } else {
      toCreate++;
    }
  });

  return {
    totalRows: parsedRows.length,
    toCreate,
    toUpdate,
    rejected,
    unknownColumns,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text) {
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  // Handle quoted fields with commas inside.
  // Supports \n (Unix), \r\n (Windows), and \r (old Mac) line endings.
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if ((ch === '\n' || (ch === '\r' && text[i + 1] !== '\n')) && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // \r in \r\n — skip (the \n will trigger line push)
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
                  ? 'bg-success-500 text-white'
                  : i === current
                  ? 'bg-brand-500 text-white'
                  : 'bg-swoop-border text-swoop-text-muted'
              }`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] mt-1 ${i === current ? 'text-brand-500 font-semibold' : 'text-swoop-text-label'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 h-0.5 mx-1 mb-4 ${i < current ? 'bg-success-500' : 'bg-swoop-border'}`} />
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
        <h2 className="text-sm font-semibold text-swoop-text-2 mb-3">
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
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-swoop-border hover:border-swoop-border'
              }`}
            >
              <div className="font-semibold text-sm text-swoop-text">{v.name}</div>
              <div className="text-[10px] text-swoop-text-label mt-0.5">{v.supported ? v.description : 'Coming soon'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Data type cards */}
      {vendor && (
        <div>
          <h2 className="text-sm font-semibold text-swoop-text-2 mb-1">
            What data are you importing?
          </h2>
          {vendor === 'jonas' && (
            <p className="text-xs text-swoop-text-label mb-3">
              Follow the recommended order below. Each import unlocks more intelligence.
            </p>
          )}
          <div className="space-y-2">
            {jonasTypes.map((t, idx) => (
              <button
                key={t.key}
                onClick={() => { setImportType(t.key); }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  importType === t.key
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-swoop-border hover:border-swoop-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl mt-0.5">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-swoop-text">{t.label}</span>
                      {vendor === 'jonas' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-swoop-row text-swoop-text-muted">
                          Step {t.stepNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-swoop-text-muted mt-0.5 line-clamp-2">{t.description}</p>
                    {vendor === 'jonas' && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {t.unlocks.slice(0, 2).map(u => (
                          <span key={u} className="text-[10px] px-1.5 py-0.5 rounded-full bg-success-50 text-success-600">
                            {u}
                          </span>
                        ))}
                        {t.unlocks.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-swoop-row text-swoop-text-label">
                            +{t.unlocks.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {vendor === 'jonas' && (
                  <div className="mt-2 ml-8 text-[10px] text-swoop-text-label">
                    Jonas file: <code className="bg-swoop-row px-1 rounded">{t.jonasFile}</code>
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
        style={{ background: '#F3922D' }}
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
        <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="font-semibold text-sm text-blue-800 mb-1">
            How to export from Jonas
          </div>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Open <strong>{config.jonasModule}</strong> in Jonas</li>
            <li>Navigate to the relevant report or entity list</li>
            <li>Export via <strong>{config.jonasExportMethod}</strong></li>
            <li>Save as CSV (comma-delimited) or Excel (.xlsx)</li>
          </ol>
          <div className="mt-2 text-[10px] text-blue-500">
            Expected file: <code className="bg-blue-100 px-1 rounded">{config.jonasFile}</code>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV or XLSX file"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-4 p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-brand-400 bg-brand-500/5'
            : file
            ? 'border-success-400 bg-success-50'
            : 'border-swoop-border bg-swoop-row hover:border-brand-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          aria-label="Upload file"
          onChange={e => validateAndSetFile(e.target.files?.[0])}
          className="hidden"
          data-testid="wizard-file-input"
        />
        {file ? (
          <>
            <div className="text-3xl mb-2">✅</div>
            <div className="font-semibold text-sm text-swoop-text">{file.name}</div>
            <div className="text-xs text-swoop-text-label mt-1">
              {(file.size / 1024).toFixed(1)} KB &middot; Click or drop to change
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl mb-2">📁</div>
            <div className="font-semibold text-sm text-swoop-text-2">
              Drop your file here, or click to browse
            </div>
            <div className="text-xs text-swoop-text-label mt-1">CSV or XLSX &middot; First row must be column headers</div>
          </>
        )}
      </div>

      {/* Required fields hint */}
      {/* File type error */}
      {fileError && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {fileError}
        </div>
      )}

      {config && (
        <div className="mb-4 text-xs text-swoop-text-label">
          <span className="font-semibold text-swoop-text-muted">Required columns: </span>
          {config.fields.filter(f => f.required).map(f => f.label).join(', ')}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!file}
          className="flex-[2] py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#F3922D' }}
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
      {mappedCount === 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <strong>Auto-detection didn't match any columns.</strong> This usually means the file is from a different vendor or a different data type than selected. Map fields manually below, or go back and double-check your vendor and data-type selection.
        </div>
      )}

      {/* Status summary */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <span className="text-sm font-semibold text-swoop-text-2">Column Mapping</span>
          <span className="text-xs text-swoop-text-label ml-2">
            {mappedCount} of {csvHeaders.length} columns mapped
          </span>
        </div>
        <div role="status" aria-live="polite" className="text-xs font-medium">
          {requiredMissing.length > 0 ? (
            <span className="text-red-500">
              {requiredMissing.length} required field{requiredMissing.length > 1 ? 's' : ''} unmapped
            </span>
          ) : (
            <span className="text-success-500">All required fields mapped</span>
          )}
        </div>
      </div>

      {/* Mapping table */}
      <div className="rounded-xl border border-swoop-border overflow-hidden mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-xs font-semibold text-swoop-text-muted bg-swoop-row px-3 py-2 border-b border-swoop-border">
          <div>Your CSV Column</div>
          <div className="px-3">→</div>
          <div>Swoop Field</div>
        </div>
        <div className="divide-y divide-swoop-border-inset">
          {csvHeaders.map(header => {
            const swoopField = mapping[header];
            const fieldConfig = swoopFields.find(f => f.swoop === swoopField);
            const isRequired = fieldConfig?.required;
            const isMapped = !!swoopField;

            return (
              <div
                key={header}
                className={`grid grid-cols-[1fr_auto_1fr] gap-0 items-center px-3 py-2 ${
                  isMapped ? 'bg-swoop-panel' : 'bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <code className="text-xs font-mono text-swoop-text-2 truncate">{header}</code>
                  {previewRows[0] && (
                    <span className="text-[10px] text-swoop-text-label truncate max-w-[120px]" title={previewRows[0][header]}>
                      e.g. "{previewRows[0][header]?.slice(0, 30)}"
                    </span>
                  )}
                </div>
                <div className="px-3 text-swoop-text-ghost">→</div>
                <div>
                  <select
                    value={swoopField || ''}
                    onChange={e => handleChange(header, e.target.value)}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                      isMapped
                        ? isRequired
                          ? 'border-success-300 bg-success-50 text-success-800'
                          : 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-swoop-border bg-swoop-panel text-swoop-text-muted'
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
          <div className="text-xs font-semibold text-swoop-text-muted mb-2">
            Data Preview (first {previewRows.length} rows, mapped fields only)
          </div>
          <div className="rounded-lg border border-swoop-border overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-swoop-row">
                  {swoopFields.filter(f => mappedSwoopFields.has(f.swoop)).map(f => (
                    <th key={f.swoop} className="px-2 py-1.5 text-left font-semibold text-swoop-text-muted whitespace-nowrap">
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
                    <tr key={i} className="border-t border-swoop-border-inset">
                      {swoopFields.filter(f => mappedSwoopFields.has(f.swoop)).map(f => (
                        <td key={f.swoop} className="px-2 py-1 text-swoop-text-2 whitespace-nowrap max-w-[150px] truncate">
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
          className="flex-1 py-3 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={requiredMissing.length > 0}
          className="flex-[2] py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#F3922D' }}
        >
          {requiredMissing.length > 0
            ? `Map ${requiredMissing.length} required field${requiredMissing.length > 1 ? 's' : ''} to continue`
            : `Preview Import →`}
        </button>
      </div>
    </div>
  );
}

// Recommended next-import type after completing a given import type.
// Drives the "Import X next →" CTA on the success screen.
const NEXT_IMPORT_SUGGESTION = {
  members:           { type: 'tee_times',     label: 'Tee Sheet',    why: 'Unlock health scores and daily briefings' },
  tee_times:         { type: 'transactions',  label: 'POS / F&B',    why: 'Complete the revenue picture' },
  booking_players:   { type: 'transactions',  label: 'POS / F&B',    why: 'Complete the revenue picture' },
  transactions:      { type: 'staff',         label: 'Staff Roster', why: 'Enable staffing-gap analysis' },
  staff:             { type: 'complaints',    label: 'Complaints',   why: 'Surface service-recovery intelligence' },
  email_campaigns:   { type: 'members',       label: 'Members',      why: 'Link email signals to member health' },
};

// ── Step 3: Import ───────────────────────────────────────────────────────────

function StepImport({ importType, mapping, parsedRows, csvHeaders, result, error, uploading, onImport, onReset, onImportNext, onBack, isDemo, aiPanel }) {
  const config = getImportTypeConfig(importType);
  const preview = useMemo(
    () => buildImportPreview({ parsedRows, mapping, importType, csvHeaders }),
    [parsedRows, mapping, importType, csvHeaders],
  );

  return (
    <div>
      {!result && !error && !uploading && (
        <div className="py-4">
          <h2 className="text-lg font-bold text-swoop-text mb-1 text-center">Dry-Run Preview</h2>
          <p className="text-xs text-swoop-text-label mb-4 text-center">
            Nothing has been sent to the server yet. Review the changes below before importing.
          </p>

          {/* AI co-pilot narrative — appears above the count tiles */}
          {aiPanel}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="p-3 rounded-lg bg-swoop-row text-center">
              <div className="text-xl font-bold text-swoop-text">{preview.totalRows.toLocaleString()}</div>
              <div className="text-[10px] text-swoop-text-label">Total rows</div>
            </div>
            <div className="p-3 rounded-lg bg-success-50 text-center">
              <div className="text-xl font-bold text-success-600">{preview.toCreate.toLocaleString()}</div>
              <div className="text-[10px] text-swoop-text-label">To create</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-center">
              <div className="text-xl font-bold text-blue-600">{preview.toUpdate.toLocaleString()}</div>
              <div className="text-[10px] text-swoop-text-label">To update</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 text-center">
              <div className="text-xl font-bold text-red-600">{preview.rejected.length.toLocaleString()}</div>
              <div className="text-[10px] text-swoop-text-label">Rejected</div>
            </div>
          </div>

          {preview.unknownColumns.length > 0 && (
            <div className="mb-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
              <strong>{preview.unknownColumns.length}</strong> unmapped column{preview.unknownColumns.length > 1 ? 's' : ''} (will be ignored): {preview.unknownColumns.slice(0, 6).join(', ')}{preview.unknownColumns.length > 6 ? '…' : ''}
            </div>
          )}

          {preview.rejected.length > 0 && (
            <div className="mb-3 rounded-lg border border-red-200 max-h-40 overflow-y-auto">
              <div className="px-3 py-1.5 bg-red-50 text-xs font-semibold text-red-700 sticky top-0">
                Rejected rows
              </div>
              <div className="text-xs text-swoop-text-muted divide-y divide-swoop-border-inset">
                {preview.rejected.slice(0, 25).map((r, i) => (
                  <div key={i} className="px-3 py-1">Row {r.row}: <span className="text-red-500">{r.reason}</span></div>
                ))}
                {preview.rejected.length > 25 && (
                  <div className="px-3 py-1 text-swoop-text-label">…and {preview.rejected.length - 25} more</div>
                )}
              </div>
            </div>
          )}

          {/* Sample records preview */}
          {preview.toCreate + preview.toUpdate > 0 && parsedRows.length > 0 && (() => {
            const reverseMap = {};
            for (const [csvH, swoopF] of Object.entries(mapping)) {
              if (swoopF) reverseMap[swoopF] = csvH;
            }
            const sampleFields = Object.keys(reverseMap).slice(0, 4);
            const sampleRows = parsedRows.filter((_, i) => {
              // pick rows that will be created (not rejected)
              const idx = i + 2;
              return !preview.rejected.some(r => r.row === idx);
            }).slice(0, 5);
            if (sampleRows.length === 0 || sampleFields.length === 0) return null;
            return (
              <div className="mb-4">
                <div className="text-xs font-semibold text-swoop-text-muted mb-1.5">
                  Sample records ({Math.min(5, sampleRows.length)} of {preview.toCreate + preview.toUpdate})
                </div>
                <div className="rounded-lg border border-swoop-border overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-swoop-row">
                        {sampleFields.map(f => (
                          <th key={f} className="px-2 py-1.5 text-left font-semibold text-swoop-text-muted whitespace-nowrap">
                            {f.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.map((row, i) => (
                        <tr key={i} className="border-t border-swoop-border-inset">
                          {sampleFields.map(f => (
                            <td key={f} className="px-2 py-1 text-swoop-text-2 max-w-[140px] truncate whitespace-nowrap">
                              {row[reverseMap[f]] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          <p className="text-xs text-swoop-text-label mb-4 text-center">
            {config?.label} &middot; {Object.values(mapping).filter(Boolean).length} columns mapped
          </p>

          {preview.toCreate + preview.toUpdate === 0 ? (
            <div>
              <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="text-sm font-bold text-red-700 mb-1">
                  Nothing to import
                </div>
                <div className="text-xs text-red-600">
                  {preview.rejected.length > 0
                    ? `All ${preview.rejected.length.toLocaleString()} rows were rejected. Fix the issues listed above in your source file and re-upload.`
                    : 'No valid rows were found in this file. Check that you selected the right file and data type.'}
                </div>
              </div>
              <button
                onClick={onReset}
                className="w-full py-3 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-2 cursor-pointer hover:bg-swoop-row-hover"
              >
                Start Over
              </button>
            </div>
          ) : (
            <>
              {isDemo && (
                <div className="mb-3 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 text-center">
                  Demo mode — data will not be written to the database.
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex-1 py-3 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover"
                >
                  Back
                </button>
                <button
                  onClick={onImport}
                  className="flex-[2] py-3 rounded-lg font-bold text-sm text-white cursor-pointer"
                  style={{ background: '#F3922D' }}
                >
                  {isDemo ? 'Simulate Import' : `Start Import (${(preview.toCreate + preview.toUpdate).toLocaleString()} rows)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {uploading && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="inline-block w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-swoop-text-2">
            Importing {parsedRows.length.toLocaleString()} rows…
          </p>
          <p className="text-xs text-swoop-text-label mt-1">Please keep this tab open until it finishes.</p>
        </div>
      )}

      {error && (
        <div className="py-6">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="text-sm font-bold text-red-700 mb-1">Import Failed</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
          <button
            onClick={onReset}
            className="w-full mt-4 py-3 rounded-lg border border-swoop-border font-semibold text-sm text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover"
          >
            Start Over
          </button>
        </div>
      )}

      {result && (
        <div className="py-6">
          <div className={`p-4 rounded-xl border ${
            result.status === 'completed'
              ? 'bg-success-50 border-success-200'
              : result.status === 'partial'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">
                {result.status === 'completed' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'}
              </div>
              <div>
                <div className="font-bold text-sm text-swoop-text">
                  Import {result.status === 'completed' ? 'Complete' : result.status === 'partial' ? 'Partially Complete' : 'Failed'}
                </div>
                <div className="text-xs text-swoop-text-muted">
                  {config?.label} &middot; {result.totalRows.toLocaleString()} rows processed
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-white/60">
                <div className="text-lg font-bold text-swoop-text">{result.totalRows.toLocaleString()}</div>
                <div className="text-[10px] text-swoop-text-label">Total</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <div className="text-lg font-bold text-success-600">{result.success.toLocaleString()}</div>
                <div className="text-[10px] text-swoop-text-label">Imported</div>
              </div>
              <div className="p-2 rounded-lg bg-white/60">
                <div className={`text-lg font-bold ${result.errors > 0 ? 'text-red-600' : 'text-swoop-text-label'}`}>
                  {result.errors.toLocaleString()}
                </div>
                <div className="text-[10px] text-swoop-text-label">Errors</div>
              </div>
            </div>
            {result.errorDetails?.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto text-xs text-swoop-text-muted space-y-0.5">
                {result.errorDetails.slice(0, 10).map((e, i) => (
                  <div key={i} className="py-0.5">Row {e.row}: <span className="text-red-500">{e.field}</span> — {e.message}</div>
                ))}
                {result.errorDetails.length > 10 && (
                  <div className="text-swoop-text-label">...and {result.errorDetails.length - 10} more</div>
                )}
              </div>
            )}
          </div>

          {/* What to do next */}
          {result.status !== 'failed' && config && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="font-semibold text-xs text-blue-800 mb-1">What this unlocks:</div>
              <ul className="text-xs text-blue-600 space-y-0.5">
                {config.unlocks.map(u => <li key={u}>• {u}</li>)}
              </ul>
            </div>
          )}

          {/* Next import suggestion — dependency-aware onboarding nudge */}
          {result.status !== 'failed' && NEXT_IMPORT_SUGGESTION[importType] && onImportNext && (
            <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-brand-200 bg-brand-50/50">
              <div>
                <div className="text-xs font-bold text-brand-600">
                  Next: Import {NEXT_IMPORT_SUGGESTION[importType].label}
                </div>
                <div className="text-[11px] text-swoop-text-muted mt-0.5">
                  {NEXT_IMPORT_SUGGESTION[importType].why}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onImportNext(NEXT_IMPORT_SUGGESTION[importType].type)}
                className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: '#F3922D' }}
              >
                Import {NEXT_IMPORT_SUGGESTION[importType].label} →
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onReset}
              className="flex-1 py-3 rounded-lg font-bold text-sm text-white cursor-pointer"
              style={{ background: '#F3922D' }}
            >
              Import More Data
            </button>
            {result.status !== 'failed' && (() => {
              const IMPORT_NAV = {
                members: { route: 'members', label: 'View Members →' },
                tee_times: { route: 'tee-sheet', label: 'View Tee Sheet →' },
                booking_players: { route: 'tee-sheet', label: 'View Tee Sheet →' },
                transactions: { route: 'revenue', label: 'View Revenue →' },
                complaints: { route: 'service', label: 'View Service →' },
                staff: { route: 'service', label: 'View Service →' },
                shifts: { route: 'service', label: 'View Service →' },
                email_campaigns: { route: 'members', label: 'View Members →' },
                email_events: { route: 'members', label: 'View Members →' },
                events: { route: 'today', label: 'View Today →' },
                event_registrations: { route: 'today', label: 'View Today →' },
                invoices: { route: 'members', label: 'View Members →' },
              };
              const nav = IMPORT_NAV[importType];
              if (!nav) return null;
              return (
                <button
                  onClick={() => { window.location.hash = `/${nav.route}`; }}
                  className="flex-1 py-3 rounded-lg font-bold text-sm cursor-pointer border border-brand-500 text-brand-500 bg-transparent hover:bg-brand-50 transition-colors"
                >
                  {nav.label}
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────

async function batchImportFiles(files, clubId, user, showToast) {
  // Sort by dependency order so members lands before tee_times, etc.
  const ordered = [...files]
    .filter(f => f.classification?.importType)
    .sort((a, b) => {
      const ai = IMPORT_DEP_ORDER.indexOf(a.classification.importType);
      const bi = IMPORT_DEP_ORDER.indexOf(b.classification.importType);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_auth_token') : null;
  const results = [];
  let totalAccepted = 0;
  let totalRejected = 0;

  for (const f of ordered) {
    try {
      let headers = [], rows = [];
      if (/\.csv$/i.test(f.name)) {
        const text = await f.file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
      } else {
        const XLSX = await import('xlsx');
        const data = await f.file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws);
        rows = rawRows;
        headers = rawRows.length ? Object.keys(rawRows[0]) : [];
      }
      const importType = f.classification.importType;
      const mapping = autoMapColumns(headers, importType);
      const reverseMap = {};
      for (const [csvH, swoopF] of Object.entries(mapping)) {
        if (swoopF) reverseMap[swoopF] = csvH;
      }
      const transformed = rows.map(r => {
        const out = {};
        for (const [swoopField, csvHeader] of Object.entries(reverseMap)) {
          out[swoopField] = r[csvHeader] ?? '';
        }
        return out;
      });
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clubId,
          importType,
          rows: transformed,
          uploadedBy: user?.userId || 'bulk-import',
        }),
      });
      const data = await res.json();
      const accepted = data?.success ?? 0;
      const rejected = (data?.rejected?.length ?? data?.errors ?? 0);
      totalAccepted += accepted;
      totalRejected += rejected;
      results.push({ file: f.name, importType, accepted, rejected, ok: res.ok });
    } catch (err) {
      results.push({ file: f.name, importType: f.classification?.importType, error: err.message });
    }
  }

  if (totalAccepted > 0) {
    window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: 'bulk' } }));
  }
  showToast(
    `Imported ${totalAccepted} rows across ${results.length} files${totalRejected > 0 ? ` · ${totalRejected} rejected` : ''}`,
    totalRejected > 0 ? 'warning' : 'success',
  );
  return results;
}

export default function CsvImportPage() {
  const { user } = useAuth();
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
  const { showToast, ToastContainer } = useToast();
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  // § 1.3 client-side role gate — keep non-privileged users out of the wizard
  // entirely so they can't see vendor templates or trigger a 403 by accident.
  // Server-side withAuth({ roles }) is the actual enforcement.
  if (!user || !IMPORT_ALLOWED_ROLES.has(user.role)) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="text-xl font-bold text-swoop-text mb-2">Import Data</h1>
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          CSV import is restricted to General Managers and club admins. Contact your GM if you need a dataset loaded.
        </div>
      </div>
    );
  }

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

  // Demo mode — skip real API calls, show static placeholders
  const isDemo = (typeof localStorage !== 'undefined' &&
    (localStorage.getItem('swoop_auth_token') === 'demo' ||
     (user?.clubId || '').startsWith('demo_')));

  // AI co-pilot state
  const [aiInsight, setAiInsight] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiValidation, setAiValidation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState(null);
  const [aiDismissed, setAiDismissed] = useState(false); // per-wizard-run only
  const dismissAI = useCallback(() => setAiDismissed(true), []);

  // Apply an AI mapping suggestion directly to the column mapping
  const handleAISuggestion = useCallback((suggestion) => {
    if (suggestion.type === 'remap' && suggestion.csvCol && suggestion.targetField) {
      setMapping(prev => ({ ...prev, [suggestion.csvCol]: suggestion.targetField }));
    } else if (suggestion.type === 'skip' && suggestion.csvCol) {
      setMapping(prev => ({ ...prev, [suggestion.csvCol]: '' }));
    }
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, []);

  // Clear AI insight on every step change; keep sessionId for cross-step continuity
  useEffect(() => {
    setAiInsight(null);
    setAiSuggestions([]);
    setAiValidation(null);
    setAiLoading(false);
  }, [step]);

  // Step 1: analyze file as soon as it's dropped
  useEffect(() => {
    if (step !== 1 || !file || aiDismissed || isDemo) return;
    let cancelled = false;
    setAiInsight(null);
    setAiLoading(true);
    parseHeadersOnly(file).then(({ headers, rowCount }) => {
      if (cancelled) return Promise.resolve(null);
      if (headers.length === 0) { setAiLoading(false); return Promise.resolve(null); }
      return callAIForStep({ step: 1, file, parsedHeaders: headers, sampleRows: [], rowCount, mapping: {}, previewCounts: {}, importType, sessionId: aiSessionId });
    }).then(result => {
      if (cancelled || !result) { setAiLoading(false); return; }
      setAiInsight(result.text);
      if (result.sessionId) setAiSessionId(result.sessionId);
      setAiLoading(false);
    }).catch(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [step, file, importType, aiDismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: structured mapping analysis — fires once on step entry (mapping excluded intentionally)
  useEffect(() => {
    if (step !== 2 || csvHeaders.length === 0 || aiDismissed || isDemo) return;
    let cancelled = false;
    setAiInsight(null);
    setAiSuggestions([]);
    setAiValidation(null);
    setAiLoading(true);
    callAIForStep({ step: 2, file, parsedHeaders: csvHeaders, sampleRows: parsedRows.slice(0, 5), rowCount: parsedRows.length, mapping, previewCounts: {}, importType, sessionId: aiSessionId })
      .then(result => {
        if (cancelled || !result) { setAiLoading(false); return; }
        setAiInsight(result.text);
        setAiSuggestions(result.suggestions || []);
        setAiValidation(result.validation || null);
        if (result.sessionId) setAiSessionId(result.sessionId);
        setAiLoading(false);
      }).catch(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [step, csvHeaders, aiDismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3: plain-English narrative above the count tiles
  useEffect(() => {
    if (step !== 3 || parsedRows.length === 0 || aiDismissed || isDemo) return;
    const preview = buildImportPreview({ parsedRows, mapping, importType, csvHeaders });
    let cancelled = false;
    setAiInsight(null);
    setAiLoading(true);
    callAIForStep({ step: 3, file, parsedHeaders: csvHeaders, sampleRows: [], rowCount: parsedRows.length, mapping, previewCounts: { toCreate: preview.toCreate, toUpdate: preview.toUpdate, rejected: preview.rejected }, importType, sessionId: aiSessionId })
      .then(result => {
        if (cancelled || !result) { setAiLoading(false); return; }
        setAiInsight(result.text);
        if (result.sessionId) setAiSessionId(result.sessionId);
        setAiLoading(false);
      }).catch(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [step, parsedRows.length, aiDismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse file when moving from step 1 → step 2
  const handleFileNext = useCallback(async () => {
    if (!file) return;
    setParseError(null);

    // Guard against pathological file sizes — parseCSV reads the whole file
    // into memory and would freeze the tab on a multi-hundred-MB drop.
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setParseError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB — split the file and try again.`);
      return;
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let headers = [];
      let rows = [];

      if (ext === 'csv') {
        const text = await file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
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

    // Demo mode — simulate success without hitting the server
    if (isDemo) {
      await new Promise(r => setTimeout(r, 800));
      setResult({ status: 'completed', totalRows: parsedRows.length, success: parsedRows.length, errors: 0 });
      setUploading(false);
      return;
    }

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
        // Re-initialize all services so insights appear immediately
        if (data.success > 0) {
          window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: importType } }));
          const rejected = (data.rejected?.length ?? data.errors ?? 0);
          const msg = rejected > 0
            ? `Imported ${data.success} rows · ${rejected} rejected`
            : `Imported ${data.success} rows. Insights are refreshing.`;
          showToast(msg, rejected > 0 ? 'warning' : 'success');
        }
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      showToast(`Import failed: ${err.message}`, 'error');
    }
    setUploading(false);
  }, [clubId, importType, mapping, parsedRows, showToast]);

  const handleReset = () => {
    setStep(0);
    setFile(null);
    setCsvHeaders([]);
    setParsedRows([]);
    setMapping({});
    setResult(null);
    setError(null);
    setParseError(null);
    // Clear AI state between wizard runs; aiDismissed intentionally kept for the page session
    setAiInsight(null);
    setAiSuggestions([]);
    setAiValidation(null);
    setAiLoading(false);
    setAiSessionId(null);
  };

  // Navigate directly to a specific import type after completing one
  const handleImportNext = (nextType) => {
    handleReset();
    setImportType(nextType);
  };

  const handleBulkImport = useCallback(async () => {
    if (!clubId || bulkFiles.length === 0) return;
    setBulkUploading(true);
    setBulkResults(null);
    try {
      const results = await batchImportFiles(bulkFiles, clubId, user, showToast);
      setBulkResults(results);
    } catch (err) {
      showToast(`Bulk import failed: ${err.message}`, 'error');
    }
    setBulkUploading(false);
  }, [bulkFiles, clubId, user, showToast]);

  const bulkReady = bulkFiles.length > 0 && bulkFiles.every(f => f.classification?.importType);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold text-swoop-text">Import Data</h1>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setAiDismissed(d => !d)}
            className="text-xs text-swoop-text-label hover:text-gray-600 border-none bg-transparent cursor-pointer shrink-0"
          >
            {aiDismissed ? '✦ Show AI tips' : 'Hide AI tips'}
          </button>
        )}
      </div>
      <p className="text-sm text-swoop-text-muted mb-6">
        Import CSV or XLSX files from your club software. We'll auto-detect columns and map them for you.
      </p>

      {/* Bulk drop zone — only shown before wizard starts */}
      {step === 0 && (
        <>
          <MultiFileDropZone onFilesClassified={setBulkFiles} />
          {bulkFiles.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs text-swoop-text-muted">
                {bulkFiles.length} file{bulkFiles.length === 1 ? '' : 's'} ready
                {!bulkReady && ' — resolve unknown types before importing'}
              </div>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!bulkReady || bulkUploading}
                className="py-2 px-4 text-sm font-bold text-white bg-brand-500 border-none rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUploading ? 'Importing...' : `Import all ${bulkFiles.length}`}
              </button>
            </div>
          )}
          {bulkResults && (
            <div className="mb-4 p-3 rounded-lg bg-swoop-row border border-swoop-border">
              <div className="text-xs font-bold text-swoop-text-2 mb-2">Batch import results</div>
              <div className="flex flex-col gap-1">
                {bulkResults.map((r, i) => (
                  <div key={i} className="text-xs text-swoop-text-muted">
                    {r.error ? '✗' : '✓'} {r.file}{r.importType ? ` → ${r.importType}` : ''}
                    {r.error ? ` (${r.error})` : ` — ${r.accepted || 0} accepted${r.rejected ? `, ${r.rejected} rejected` : ''}`}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-swoop-border" />
            <span className="text-xs uppercase font-semibold text-swoop-text-label tracking-wide whitespace-nowrap">or use the guided wizard</span>
            <div className="flex-1 border-t border-swoop-border" />
          </div>
        </>
      )}
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
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {parseError}
            </div>
          )}
          <AIImportAssistant
            step={1}
            insight={aiInsight}
            loading={aiLoading}
            dismissed={aiDismissed}
            onDismiss={dismissAI}
          />
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0">
            <StepMapColumns
              importType={importType}
              csvHeaders={csvHeaders}
              mapping={mapping}
              setMapping={setMapping}
              previewRows={parsedRows}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          </div>
          <div className="lg:w-72 shrink-0">
            <AIImportAssistant
              step={2}
              insight={aiInsight}
              loading={aiLoading}
              dismissed={aiDismissed}
              onDismiss={dismissAI}
              suggestions={aiSuggestions}
              validation={aiValidation}
              onApplySuggestion={handleAISuggestion}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <StepImport
          importType={importType}
          mapping={mapping}
          parsedRows={parsedRows}
          csvHeaders={csvHeaders}
          result={result}
          error={error}
          uploading={uploading}
          onImport={handleImport}
          onReset={handleReset}
          onImportNext={handleImportNext}
          onBack={() => setStep(2)}
          isDemo={isDemo}
          aiPanel={
            <AIImportAssistant
              step={3}
              insight={aiInsight}
              loading={aiLoading}
              dismissed={aiDismissed}
              onDismiss={dismissAI}
            />
          }
        />
      )}
      <ToastContainer />
    </div>
  );
}
