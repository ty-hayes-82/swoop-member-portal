import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/apiClient';

function timeAgo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function ImportedDataCatalog() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/imported-data-catalog')
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 24, color: '#6B7280' }}>Loading imported data summary…</div>;
  if (error) return <div style={{ padding: 24, color: '#b42318' }}>Failed to load: {error}</div>;
  if (!data?.tables?.length) return <div style={{ padding: 24, color: '#6B7280' }}>No imported data yet.</div>;

  const populated = data.tables.filter(t => t.rowCount > 0);
  const empty = data.tables.filter(t => t.rowCount === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(59, 130, 246, 0.02))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 12,
        padding: '14px 18px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Imported Data Catalog
        </div>
        <div style={{ fontSize: 14, color: '#1a1a2e', lineHeight: 1.5 }}>
          {data.totalRows.toLocaleString()} total rows across {populated.length} dataset{populated.length === 1 ? '' : 's'}.
          Every CSV uploaded through the wizard lands here. Click any row to peek at the first 3 records.
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Dataset</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Table</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', textAlign: 'right' }}>Rows</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Last Imported</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>Sample</th>
            </tr>
          </thead>
          <tbody>
            {populated.map(row => (
              <tr key={row.key} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a1a2e' }}>{row.label}</td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#6B7280', fontSize: 12 }}>{row.table}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#1a1a2e' }}>{row.rowCount.toLocaleString()}</td>
                <td style={{ padding: '12px 14px', color: '#6B7280' }}>{timeAgo(row.lastImported)}</td>
                <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: 12, fontFamily: 'monospace', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.sample?.[0] ? Object.entries(row.sample[0]).slice(0, 3).map(([k, v]) => `${k}=${String(v ?? '').slice(0, 20)}`).join(' · ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {empty.length > 0 && (
        <details style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            {empty.length} dataset{empty.length === 1 ? '' : 's'} not yet imported
          </summary>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {empty.map(t => (
              <span key={t.key} style={{ fontSize: 11, padding: '4px 10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 999, color: '#9ca3af' }}>{t.label}</span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
