/**
 * CsvImportPage — Standalone CSV/XLSX import tool
 * Accessible via #/integrations/csv-import or #/csv-import
 */
import { useState, useRef } from 'react';

const IMPORT_TYPES = [
  { value: 'members', label: 'Members', desc: 'Member profiles, contact info, membership types' },
  { value: 'rounds', label: 'Rounds', desc: 'Golf rounds, tee times, pace data' },
  { value: 'transactions', label: 'Transactions', desc: 'F&B checks, POS transactions' },
  { value: 'complaints', label: 'Complaints', desc: 'Member complaints and feedback' },
  { value: 'events', label: 'Events', desc: 'Event definitions and details' },
  { value: 'event_registrations', label: 'Event Registrations', desc: 'Member event sign-ups' },
  { value: 'email_campaigns', label: 'Email Campaigns', desc: 'Campaign sends and metrics' },
  { value: 'email_events', label: 'Email Events', desc: 'Opens, clicks, bounces' },
  { value: 'staff', label: 'Staff', desc: 'Employee profiles and departments' },
  { value: 'shifts', label: 'Staff Shifts', desc: 'Shift schedules and hours' },
  { value: 'tee_times', label: 'Tee Times / Bookings', desc: 'Tee sheet reservations' },
  { value: 'courses', label: 'Courses', desc: 'Course definitions' },
  { value: 'membership_types', label: 'Membership Types', desc: 'Type codes, fees, descriptions' },
  { value: 'households', label: 'Households', desc: 'Household groupings' },
  { value: 'line_items', label: 'POS Line Items', desc: 'Check-level item detail' },
  { value: 'invoices', label: 'Invoices', desc: 'Member billing statements' },
  { value: 'service_requests', label: 'Service Requests', desc: 'Beverage cart, maintenance, etc.' },
  { value: 'daily_close', label: 'Daily Close-Outs', desc: 'End-of-day revenue summaries' },
];

export default function CsvImportPage() {
  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
  const [importType, setImportType] = useState('members');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    if (!clubId) { setError('No club connected. Please log in first.'); return; }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows = [];

      if (ext === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { setError('CSV file appears empty.'); setUploading(false); return; }
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
          rows.push(row);
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws);
      } else {
        setError(`Unsupported file type ".${ext}". Please upload a .csv or .xlsx file.`);
        setUploading(false);
        return;
      }

      if (rows.length === 0) { setError('No data rows found in file.'); setUploading(false); return; }

      const user = (() => { try { return JSON.parse(localStorage.getItem('swoop_auth_user') || '{}'); } catch { return {}; } })();

      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, importType, rows, uploadedBy: user.userId || 'csv-import-tool' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Import failed'); } else { setResult(data); }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
    setUploading(false);
  };

  const selectedType = IMPORT_TYPES.find(t => t.value === importType);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-1">CSV Import</h1>
      <p className="text-sm text-gray-500 mb-6">Upload CSV or XLSX files to import data into Swoop.</p>

      {/* Import type selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Import Type</label>
        <select
          value={importType}
          onChange={e => { setImportType(e.target.value); setResult(null); setError(null); }}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white/90"
        >
          {IMPORT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
          ))}
        </select>
      </div>

      {/* File upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="mb-4 p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center cursor-pointer hover:border-brand-400 transition-colors dark:bg-gray-800 dark:border-gray-600"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
          className="hidden"
        />
        {file ? (
          <>
            <div className="text-2xl mb-2">📄</div>
            <div className="font-semibold text-sm text-gray-800 dark:text-white/90">{file.name}</div>
            <div className="text-xs text-gray-400 mt-1">Click to change file</div>
          </>
        ) : (
          <>
            <div className="text-2xl mb-2">📁</div>
            <div className="font-semibold text-sm text-gray-700 dark:text-gray-300">Click to select a CSV or XLSX file</div>
            <div className="text-xs text-gray-400 mt-1">First row must be column headers</div>
          </>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full py-3 rounded-lg border-none font-bold text-sm text-white cursor-pointer disabled:opacity-50"
        style={{ background: '#ff8b00' }}
      >
        {uploading ? 'Importing...' : `Import ${selectedType?.label || 'Data'}`}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-500/10 dark:border-green-500/30">
          <div className="font-bold text-sm text-green-700 dark:text-green-400 mb-2">
            Import {result.status === 'completed' ? 'Complete' : result.status === 'partial' ? 'Partial' : 'Failed'}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <div>Total rows: {result.totalRows}</div>
            <div>Imported: {result.success}</div>
            {result.errors > 0 && <div className="text-red-600 dark:text-red-400">Errors: {result.errors}</div>}
          </div>
          {result.errorDetails?.length > 0 && (
            <div className="mt-3 text-xs text-gray-500 max-h-40 overflow-y-auto">
              {result.errorDetails.slice(0, 10).map((e, i) => (
                <div key={i} className="py-0.5">Row {e.row}: {e.field} — {e.message}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
