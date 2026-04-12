/**
 * Reusable deep-insight widgets that read from /api/deep-insights?kind=…
 * Each is a standalone, self-fetching React component that drops onto
 * any view. Empty/loading states are inline so they degrade silently
 * when no data is imported.
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/apiClient';

function useDeepInsight(kind) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/deep-insights?kind=${encodeURIComponent(kind)}`)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData({ available: false }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind]);
  return { data, loading };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function fmtCurrency(n) {
  return '$' + Math.round(Number(n || 0)).toLocaleString();
}

// ---------------------------------------------------------------------------
// Settlement mix donut (payments)
// ---------------------------------------------------------------------------

export function SettlementMixDonut() {
  const { data, loading } = useDeepInsight('payments');
  if (loading || !data?.available) return null;
  const { slices, grandTotal, arRisk } = data;
  // Simple SVG donut from cumulative percentages
  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          F&B Settlement Mix
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginTop: 4 }}>
          {fmtCurrency(grandTotal)} <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>processed</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <g transform="translate(70,70) rotate(-90)">
            {slices.map((s, i) => {
              const dash = (s.pct / 100) * circumference;
              const offset = -((cumulative / 100) * circumference);
              cumulative += s.pct;
              return (
                <circle
                  key={s.method}
                  r={radius}
                  cx={0}
                  cy={0}
                  fill="transparent"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={20}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </g>
          <text x="70" y="68" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a2e">
            {slices.length}
          </text>
          <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#6B7280">
            methods
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {slices.map((s, i) => (
            <div key={s.method} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
              <span style={{ flex: 1, color: '#1a1a2e', fontWeight: 600 }}>{s.method}</span>
              <span style={{ color: '#1d4ed8', fontWeight: 600 }}>{s.pct}%</span>
              <span style={{ color: '#6B7280' }}>{fmtCurrency(s.total)}</span>
            </div>
          ))}
        </div>
      </div>
      {arRisk && (
        <div style={{
          fontSize: 12, color: '#a16207', background: '#fef3c7',
          border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px',
        }}>
          ⚠ {arRisk}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AR aging panel (invoices)
// ---------------------------------------------------------------------------

const BUCKET_COLOR = {
  current: '#10b981',
  '1-30':  '#84cc16',
  '31-60': '#f59e0b',
  '61-90': '#f97316',
  '90+':   '#ef4444',
  paid:    '#9ca3af',
};

export function ARAgingPanel() {
  const { data, loading } = useDeepInsight('ar-aging');
  if (loading || !data?.available) return null;
  const { buckets, openTotal, aged60Plus, topOpen } = data;
  const openBuckets = buckets.filter(b => b.bucket !== 'paid');
  const maxBucketTotal = Math.max(1, ...openBuckets.map(b => b.total));

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Aged Receivables
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginTop: 4 }}>
            {fmtCurrency(openTotal)}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>open across all members</div>
        </div>
        {aged60Plus > 0 && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600,
          }}>
            {fmtCurrency(aged60Plus)} aged 60+ days
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {openBuckets.map(b => (
          <div key={b.bucket} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 60, color: '#6B7280', fontWeight: 600 }}>{b.bucket}</span>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{
                width: `${(b.total / maxBucketTotal) * 100}%`,
                height: '100%',
                background: BUCKET_COLOR[b.bucket],
              }} />
            </div>
            <span style={{ width: 90, textAlign: 'right', color: '#1a1a2e', fontWeight: 600 }}>{fmtCurrency(b.total)}</span>
            <span style={{ width: 60, textAlign: 'right', color: '#6B7280' }}>{b.count} inv</span>
          </div>
        ))}
      </div>

      {topOpen?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Top Open Balances
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {topOpen.map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#1a1a2e' }}>{m.name}</span>
                <span style={{ color: '#1d4ed8', fontWeight: 600 }}>
                  {fmtCurrency(m.openBalance)} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({m.openInvoices})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course utilization gauge
// ---------------------------------------------------------------------------

export function CourseUtilizationCards() {
  const { data, loading } = useDeepInsight('courses');
  if (loading || !data?.available) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Course Utilization
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
          Theoretical max tee times vs actual rounds last 90 days
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {data.courses.map(c => {
          const pct = c.utilizationPct ?? 0;
          const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={c.courseId} style={{
              background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
                {c.holes} holes · par {c.par} · {c.teeIntervalMin}min intervals
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280' }}>
                <span>{c.roundsLast90.toLocaleString()} rounds</span>
                <span style={{ color, fontWeight: 600 }}>{pct}% utilized</span>
              </div>
              {c.maxPerDay && (
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                  Max {c.maxPerDay} tee times/day
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier revenue mix
// ---------------------------------------------------------------------------

export function TierRevenueMix() {
  const { data, loading } = useDeepInsight('tier-revenue');
  if (loading || !data?.available) return null;
  const { tiers, grandTotal } = data;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Annual Dues by Tier
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginTop: 4 }}>
            {fmtCurrency(grandTotal)}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>annual dues book</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tiers.map((t, i) => (
          <div key={t.tier} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{ width: 56, color: '#1a1a2e', fontWeight: 600 }}>{t.tier}</span>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 14, overflow: 'hidden' }}>
              <div style={{
                width: `${t.pct}%`,
                height: '100%',
                background: COLORS[i % COLORS.length],
              }} />
            </div>
            <span style={{ width: 90, textAlign: 'right', color: '#1a1a2e', fontWeight: 600 }}>{fmtCurrency(t.revenue)}</span>
            <span style={{ width: 90, textAlign: 'right', color: '#6B7280' }}>
              {t.members} {t.members === 1 ? 'member' : 'members'}
            </span>
            <span style={{ width: 40, textAlign: 'right', color: '#1d4ed8', fontWeight: 600 }}>{t.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
