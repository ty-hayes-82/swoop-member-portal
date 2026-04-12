import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/apiClient';

/**
 * Today panel — one card per imported dataset with its headline insight.
 * Locked stages render as ghost cards prompting the next import.
 */
export default function StageInsightsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/stage-insights')
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { /* keep panel hidden on error */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading || !data?.insights?.length) return null;
  const { insights, unlockedCount, totalStages } = data;
  const unlocked = insights.filter(i => i.unlocked);
  const locked = insights.filter(i => !i.unlocked);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1a1a2e', fontWeight: 700 }}>
            What your data is showing you
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            One headline insight per imported dataset. {unlockedCount} of {totalStages} unlocked.
          </p>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600,
          padding: '6px 12px', borderRadius: 999,
          background: unlockedCount === totalStages ? '#dcfce7' : '#fef3c7',
          color: unlockedCount === totalStages ? '#15803d' : '#a16207',
        }}>
          {Math.round((unlockedCount / totalStages) * 100)}% complete
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {unlocked.map(insight => (
          <InsightCard key={insight.stage} insight={insight} />
        ))}
      </div>

      {locked.length > 0 && (
        <details style={{ marginTop: 18, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
            {locked.length} dataset{locked.length === 1 ? '' : 's'} not yet imported — import to unlock
          </summary>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
            {locked.map(l => (
              <div key={l.stage} style={{
                background: '#fff', border: '1px dashed #d1d5db', borderRadius: 10,
                padding: '10px 14px', fontSize: 12, color: '#6B7280',
              }}>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>{l.label}</div>
                <div>{l.bullets?.[0] || 'Not imported'}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function InsightCard({ insight }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(59, 130, 246, 0.01))',
      border: '1px solid #e0e7ff',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {insight.label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.35 }}>
        {insight.headline}
      </div>
      {insight.metric && (
        <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
          {insight.metric}
        </div>
      )}
      {insight.bullets?.length > 0 && (
        <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>
          {insight.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}
