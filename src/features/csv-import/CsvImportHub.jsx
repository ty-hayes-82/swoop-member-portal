import { useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '@/config/theme';
import {
  getTemplates,
  getTemplateByKey,
  parseCSV,
  autoMapFields,
  validateRows,
  importData,
  getImportHistory,
  generateTemplate,
  formatBytes,
  CATEGORY_TEMPLATE_MAP,
} from '@/services/csvImportService';
import {
  getDataGaps,
  getLiveProgress,
  CATEGORY_UNLOCKS,
} from '@/services/integrationsService';
import { useNavigationContext } from '@/context/NavigationContext';
import TemplateLibrary from './TemplateLibrary.jsx';
import FieldMapper from './FieldMapper.jsx';
import ValidationPreview from './ValidationPreview.jsx';
import ImportHistory from './ImportHistory.jsx';

const templates = getTemplates();

// Map template keys to vendor names they work with
const TEMPLATE_VENDOR_CONTEXT = {
  'tee-times': 'ForeTees, Chronogolf, ForeUP, EZLinks',
  'golf-rounds': 'ForeTees, Chronogolf, ForeUP',
  'fnb-transactions': 'Toast, Lightspeed, Square, Clubessential POS',
  'reservations': 'SevenRooms, Noteefy, Clubessential',
  'members': 'Jonas, Clubessential CMS, Northstar CRM',
  'staffing': 'ADP, 7shifts, Paylocity, HotSchedules',
  'email-engagement': 'Mailchimp, HubSpot, Constant Contact',
  'events': 'Clubessential, Jonas',
  'complaints': 'Clubessential, Jonas',
  'fitness-pool': 'ClubReady, Jonas',
};

export default function CsvImportHub() {
  const { routeIntent, clearRouteIntent, navigate } = useNavigationContext();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0].key);
  const [vendorHint, setVendorHint] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [validation, setValidation] = useState(null);
  const [history, setHistory] = useState(getImportHistory());
  const [uploadState, setUploadState] = useState('idle');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const template = useMemo(() => getTemplateByKey(selectedTemplateKey), [selectedTemplateKey]);
  const fileInputRef = useRef(null);
  const uploadRef = useRef(null);

  // Live progress from actual connected systems
  const progress = useMemo(() => getLiveProgress(), []);
  const dataGaps = useMemo(() => getDataGaps(), []);

  // Handle route intent (pre-select template from gap card or integrations page)
  useEffect(() => {
    if (!routeIntent) return;
    const { category, vendor } = routeIntent;
    if (category && CATEGORY_TEMPLATE_MAP[category]) {
      const templateKey = CATEGORY_TEMPLATE_MAP[category][0];
      if (templateKey) {
        setSelectedTemplateKey(templateKey);
        if (vendor) setVendorHint(vendor);
      }
      // Scroll to upload zone after a tick
      setTimeout(() => {
        uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const resetFlow = () => {
    setFileMeta(null);
    setParsedData(null);
    setMappings([]);
    setValidation(null);
    setUploadState('idle');
  };

  const runValidation = (rows, nextMappings, nextTemplate) => {
    const result = validateRows(rows, nextMappings, nextTemplate);
    setValidation(result);
  };

  const handleTemplateChange = (key) => {
    setSelectedTemplateKey(key);
    setVendorHint(null);
    if (parsedData) {
      const nextTemplate = getTemplateByKey(key);
      const nextMappings = autoMapFields(parsedData.headers, nextTemplate);
      setMappings(nextMappings);
      runValidation(parsedData.rows, nextMappings, nextTemplate);
    }
  };

  const handleGapUpload = (category, templateKey) => {
    setSelectedTemplateKey(templateKey);
    setTimeout(() => {
      uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setUploadState('processing');
    setError('');
    try {
      const result = await parseCSV(file);
      setParsedData(result);
      setFileMeta({ name: file.name, size: file.size });
      const nextMappings = autoMapFields(result.headers, template, vendorHint);
      setMappings(nextMappings);
      runValidation(result.rows, nextMappings, template);
      setUploadState('ready');
    } catch (err) {
      setError('Unable to read the file. Please confirm it is a valid CSV or XLSX export.');
      setUploadState('error');
      console.error(err); // eslint-disable-line no-console
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleMappingChange = (source, target) => {
    const nextMappings = mappings.map((mapping) =>
      mapping.source === source
        ? {
            ...mapping,
            target: target || null,
            status: target ? 'manual' : 'unmapped',
          }
        : mapping,
    );
    setMappings(nextMappings);
    if (parsedData) {
      runValidation(parsedData.rows, nextMappings, template);
    }
  };

  const handleDownloadTemplate = (key) => {
    const { fileName, content } = generateTemplate(key);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!validation || !parsedData) return;
    setImporting(true);
    try {
      const entry = await importData({
        templateKey: selectedTemplateKey,
        fileMeta,
        validation,
        mappings,
      });
      setHistory((prev) => [entry, ...prev]);
      resetFlow();
    } catch (err) {
      console.error(err); // eslint-disable-line no-console
      setError('Import failed. Please retry or contact support.');
    } finally {
      setImporting(false);
    }
  };

  const uploadDescription = fileMeta && parsedData
    ? `${fileMeta.name} \u00B7 ${formatBytes(fileMeta.size)} \u00B7 ${parsedData.rows.length.toLocaleString()} rows`
    : 'Drag a CSV/XLSX here or browse to upload';

  const vendorContext = TEMPLATE_VENDOR_CONTEXT[selectedTemplateKey];

  return (
    <div style={{ padding: theme.spacing.xl, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* A. Header + Live Progress Bar */}
      <section style={{
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xl,
        background: `linear-gradient(120deg, ${theme.colors.integrationHeroStart} 0%, ${theme.colors.integrationHeroEnd} 100%)`,
        color: theme.colors.white,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <span style={{ fontSize: theme.fontSize.xs, letterSpacing: '0.08em' }}>DATA UPLOAD</span>
          <h1 style={{ margin: 0, fontSize: 32 }}>Connect any vendor — even without an API.</h1>
          <p style={{ margin: 0, maxWidth: 680, color: 'rgba(255,255,255,0.8)' }}>
            Drop exports from POS, tee sheet, staffing, or reservations and let Swoop normalize, validate, and load them into the intelligence layer.
          </p>
        </div>

        {/* Live progress stats */}
        <div style={{ marginTop: theme.spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>
              {progress.connected}/{progress.total} systems connected
            </span>
            <span style={{ fontSize: 24, fontWeight: 700, fontFamily: theme.fonts.mono }}>
              {progress.pct}%
            </span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress.pct}%`,
              background: 'linear-gradient(90deg, #F5B97A, #22c55e)',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: theme.fontSize.xs, opacity: 0.7, marginTop: 4 }}>
            intelligence unlocked
          </div>
        </div>
      </section>

      {/* B. "Your Data Gaps" Section */}
      {dataGaps.length > 0 ? (
        <section style={{
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          background: theme.colors.bgCard,
          border: '1px solid ' + theme.colors.border,
        }}>
          <div style={{ marginBottom: theme.spacing.md }}>
            <h3 style={{ margin: 0, fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
              Your Data Gaps
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              These categories have no connected system yet. Upload a CSV or connect via API to unlock their intelligence.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: theme.spacing.md }}>
            {dataGaps.map((gap) => (
              <div key={gap.category} style={{
                border: '1px solid ' + theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                background: theme.colors.bgDeep,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{gap.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                      {gap.label}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.08em', padding: '1px 6px', borderRadius: 999,
                      color: '#c2410c', background: '#c2410c15',
                    }}>
                      Not Connected
                    </span>
                  </div>
                </div>
                {gap.vendors.length > 0 && (
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                    Vendors: {gap.vendors.map(v => v.name).join(', ')}
                  </div>
                )}
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                  Unlocks: {gap.unlocks}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => handleGapUpload(gap.category, gap.templates[0])}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: theme.radius.sm,
                      border: 'none',
                      background: theme.colors.accent,
                      color: theme.colors.white,
                      fontSize: theme.fontSize.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Upload CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('integrations')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: theme.radius.sm,
                      border: '1px solid ' + theme.colors.border,
                      background: 'transparent',
                      color: theme.colors.textSecondary,
                      fontSize: theme.fontSize.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Connect via API
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section style={{
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          background: theme.colors.bgCard,
          border: '1px solid ' + theme.colors.success + '30',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{'\u2705'}</div>
          <h3 style={{ margin: 0, color: theme.colors.success, fontSize: theme.fontSize.md }}>
            All data categories connected
          </h3>
          <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
            Every integration category has at least one system feeding data into Swoop.
          </p>
        </section>
      )}

      {/* C. Upload Zone + Template Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: theme.spacing.xl, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <section
            ref={uploadRef}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            style={{
              border: `1.5px dashed ${dragActive ? theme.colors.accent : theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              background: dragActive ? `${theme.colors.accent}08` : theme.colors.bgCard,
              textAlign: 'center',
              transition: 'border-color 0.2s ease, background 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls"
              style={{ display: 'none' }}
              onChange={(event) => handleFileSelected(event.target.files?.[0])}
            />
            <div style={{ fontSize: 24, marginBottom: theme.spacing.sm }}>{'\u2B07\uFE0F'}</div>
            <h3 style={{ margin: 0 }}>Upload data</h3>
            {vendorHint && (
              <div style={{
                display: 'inline-block',
                margin: '6px 0',
                padding: '2px 10px',
                borderRadius: theme.radius.sm,
                background: theme.colors.accent + '12',
                border: '1px solid ' + theme.colors.accent + '30',
                fontSize: theme.fontSize.xs,
                color: theme.colors.accent,
                fontWeight: 600,
              }}>
                Optimized for {vendorHint} exports
              </div>
            )}
            <p style={{ margin: '6px 0 12px', color: theme.colors.textMuted }}>{uploadDescription}</p>
            {vendorContext && !vendorHint && (
              <p style={{ margin: '0 0 12px', fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                Works with: {vendorContext}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 18px',
                  borderRadius: theme.radius.sm,
                  border: 'none',
                  background: theme.colors.accent,
                  color: theme.colors.white,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Browse files
              </button>
              {fileMeta && (
                <button
                  type="button"
                  onClick={resetFlow}
                  style={{
                    padding: '8px 18px',
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border}`,
                    background: 'transparent',
                    color: theme.colors.textSecondary,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear file
                </button>
              )}
            </div>
            {error && <p style={{ color: theme.colors.urgent, marginTop: theme.spacing.sm }}>{error}</p>}
            {uploadState === 'processing' && (
              <p style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>Parsing file...</p>
            )}
          </section>

          <TemplateLibrary
            templates={templates}
            selectedKey={selectedTemplateKey}
            onSelect={handleTemplateChange}
            onDownload={handleDownloadTemplate}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <FieldMapper
            mappings={mappings}
            targetFields={template.fields}
            onChange={handleMappingChange}
            previewRows={parsedData?.rows}
          />
          <ValidationPreview
            validation={validation}
            onImport={handleImport}
            importing={importing}
          />
          <ImportHistory history={history} />
        </div>
      </div>
    </div>
  );
}
