import { useMemo, useRef, useState } from 'react';
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
} from '@/services/csvImportService';
import TemplateLibrary from './TemplateLibrary.jsx';
import FieldMapper from './FieldMapper.jsx';
import ValidationPreview from './ValidationPreview.jsx';
import ImportHistory from './ImportHistory.jsx';

const templates = getTemplates();

const heroStats = [
  { label: 'Vendors without APIs', value: '11', detail: 'CSV-ready today' },
  { label: 'Avg. setup time', value: '35 min', detail: 'per data category' },
  { label: 'Clubs onboarding via CSV', value: '6', detail: 'this quarter' },
];

export default function CsvImportHub() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0].key);
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
    if (parsedData) {
      const nextTemplate = getTemplateByKey(key);
      const nextMappings = autoMapFields(parsedData.headers, nextTemplate);
      setMappings(nextMappings);
      runValidation(parsedData.rows, nextMappings, nextTemplate);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setUploadState('processing');
    setError('');
    try {
      const result = await parseCSV(file);
      setParsedData(result);
      setFileMeta({ name: file.name, size: file.size });
      const nextMappings = autoMapFields(result.headers, template);
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
    ? `${fileMeta.name} · ${formatBytes(fileMeta.size)} · ${parsedData.rows.length.toLocaleString()} rows`
    : 'Drag a CSV/XLSX here or browse to upload';

  return (
    <div style={{ padding: theme.spacing.xl, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
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
            CSV support keeps onboarding fast for every club, regardless of vendor sophistication.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          {heroStats.map((stat) => (
            <div key={stat.label} style={{
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: 28, fontFamily: theme.fonts.mono, fontWeight: 600 }}>{stat.value}</div>
              <div style={{ fontSize: theme.fontSize.xs, letterSpacing: '0.04em', opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: theme.fontSize.xs, opacity: 0.7 }}>{stat.detail}</div>
            </div>
          ))}
        </div>
      </section>


      {/* Onboarding Progress — shows what's connected and what unlocks next */}
      <section style={{
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        background: theme.colors.bgCard,
        border: '1px solid ' + theme.colors.border,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <div>
            <h3 style={{ margin: 0, fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
              Your Connection Progress
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              Connecting your systems takes minutes, not months. Here's where you stand.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: theme.colors.accent, fontFamily: theme.fonts.mono }}>57%</div>
            <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase' }}>insights unlocked</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: theme.colors.border + '40', borderRadius: 4, marginBottom: theme.spacing.md, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '57%', background: 'linear-gradient(90deg, ' + theme.colors.accent + ', ' + theme.colors.success + ')', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>

        {/* Category checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.sm }}>
          {[
            { category: 'Tee Sheet', connected: true, impact: 'Pace of play + demand intelligence' },
            { category: 'POS / F&B', connected: true, impact: 'Revenue leakage + dining patterns' },
            { category: 'Member CRM', connected: true, impact: 'Health scores + archetype engine' },
            { category: 'Email Marketing', connected: true, impact: 'Engagement decay detection' },
            { category: 'Complaints', connected: true, impact: 'Service recovery triggers' },
            { category: 'Staffing / HR', connected: false, impact: 'Labor optimization + gap alerts' },
            { category: 'Reservations', connected: false, impact: 'Event ROI + dining demand' },
            { category: 'Course GPS', connected: false, impact: 'Pace analytics by hole' },
            { category: 'Surveys / NPS', connected: false, impact: 'Sentiment layer for health scores' },
            { category: 'Weather', connected: true, impact: 'Proactive scheduling alerts' },
          ].map(({ category, connected, impact }) => (
            <div key={category} style={{
              display: 'flex', alignItems: 'center', gap: theme.spacing.sm,
              padding: '8px 12px', borderRadius: theme.radius.sm,
              background: connected ? theme.colors.success + '08' : theme.colors.bgDeep,
              border: '1px solid ' + (connected ? theme.colors.success + '30' : theme.colors.border),
            }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>{connected ? '\u2705' : '\u2B55'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: theme.fontSize.xs, fontWeight: 600, color: connected ? theme.colors.success : theme.colors.textPrimary }}>{category}</div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, lineHeight: 1.3 }}>{connected ? 'Connected' : 'Unlocks: ' + impact}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.sm + ' ' + theme.spacing.md,
          background: theme.colors.accent + '08',
          border: '1px solid ' + theme.colors.accent + '20',
          borderRadius: theme.radius.sm,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          lineHeight: 1.5,
        }}>
          <strong style={{ color: theme.colors.accent }}>Next unlock:</strong> Connect <strong>Staffing / HR</strong> data to enable Labor Optimization alerts. Upload a shift schedule CSV above, or connect via API on the Connected Systems page.
        </div>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: theme.spacing.xl, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <section
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
            <div style={{ fontSize: 24, marginBottom: theme.spacing.sm }}>⬇️</div>
            <h3 style={{ margin: 0 }}>Upload data</h3>
            <p style={{ margin: '6px 0 12px', color: theme.colors.textMuted }}>{uploadDescription}</p>
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
              <p style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>Parsing file…</p>
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
