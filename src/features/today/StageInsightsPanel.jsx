import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/services/apiClient';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function StageInsightsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    let cancelled = false;
    setError(null);
    apiFetch('/api/stage-insights')
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = fetchData();
    const onImported = () => { setLoading(true); fetchData(); };
    window.addEventListener('swoop:data-imported', onImported);
    return () => {
      cleanup?.();
      window.removeEventListener('swoop:data-imported', onImported);
    };
  }, [fetchData]);

  // Render nothing until there are real unlocked insights. Avoids the
  // jarring empty/loading/error card on the zero-data onboarding screen
  // and prevents a second progress indicator from conflicting with the
  // onboarding checklist's "N of 3 done" copy.
  if (loading || error) return null;
  const unlocked = data?.insights?.filter(i => i.unlocked) || [];
  if (unlocked.length === 0) return null;

  const locked = data.insights.filter(i => !i.unlocked);

  return (
    <div className="rounded-2xl border border-swoop-border bg-swoop-panel p-6">
      <div className="mb-4">
        <h2 className="m-0 text-base font-bold text-swoop-text">
          What your data is showing you
        </h2>
        <p className="m-0 mt-1 text-xs text-swoop-text-muted">
          One headline insight per imported dataset.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {unlocked.map(insight => (
          <ErrorBoundary key={insight.stage} fallback={<CardError label={insight.label} />}>
            <InsightCard insight={insight} />
          </ErrorBoundary>
        ))}
      </div>

      {locked.length > 0 && (
        <details className="mt-4 rounded-xl border border-swoop-border-inset bg-swoop-row px-4 py-3">
          <summary className="cursor-pointer text-xs font-semibold text-swoop-text-muted">
            {locked.length} dataset{locked.length === 1 ? '' : 's'} not yet imported — import to unlock
          </summary>
          <div
            className="mt-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}
          >
            {locked.map(l => (
              <div
                key={l.stage}
                className="rounded-lg border border-dashed border-swoop-border-inset bg-swoop-panel px-3 py-2.5 text-xs text-swoop-text-muted"
              >
                <div className="font-semibold text-swoop-text mb-0.5">{l.label}</div>
                <div>{l.bullets?.[0] || 'Not imported'}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function CardError({ label }) {
  return (
    <div className="rounded-xl border border-warn-300/40 bg-warn-500/[0.08] p-4 text-xs text-warn-300">
      <div className="font-bold mb-1">{label || 'Widget'}</div>
      <div>Temporarily unavailable. Other insights still loading.</div>
    </div>
  );
}

function InsightCard({ insight }) {
  return (
    <div
      className="rounded-xl border border-brand-500/20 bg-brand-500/[0.06] p-4 flex flex-col gap-2"
    >
      <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
        {insight.label}
      </div>
      <div className="text-sm font-semibold text-swoop-text leading-snug">
        {insight.headline}
      </div>
      {insight.metric && (
        <div className="text-xs font-semibold text-brand-500">
          {insight.metric}
        </div>
      )}
      {insight.bullets?.length > 0 && (
        <ul className="m-0 mt-1 pl-4 text-[11px] leading-relaxed text-swoop-text-muted">
          {insight.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
    </div>
  );
}
