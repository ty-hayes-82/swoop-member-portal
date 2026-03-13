import { theme } from '@/config/theme';
import { paceFBImpact, slowRoundStats, bottleneckHoles } from '@/data/pace';

export default function PaceImpactTab() {
  const {
    fastConversionRate,
    slowConversionRate,
    avgCheckFast,
    avgCheckSlow,
    slowRoundsPerMonth,
    revenueLostPerMonth,
  } = paceFBImpact;

  const conversionDrop = ((fastConversionRate - slowConversionRate) / fastConversionRate * 100).toFixed(0);
  const checkDrop = ((avgCheckFast - avgCheckSlow) / avgCheckFast * 100).toFixed(0);
  const revenuePerFast = fastConversionRate * avgCheckFast * 4;
  const revenuePerSlow = slowConversionRate * avgCheckSlow * 4;
  const revenuePerRoundDelta = revenuePerFast - revenuePerSlow;

  const holes = bottleneckHoles || [
    { hole: 12, avgDelay: 9.1, roundsAffected: 341 },
    { hole: 4, avgDelay: 8.2, roundsAffected: 312 },
    { hole: 8, avgDelay: 7.6, roundsAffected: 287 },
    { hole: 16, avgDelay: 6.8, roundsAffected: 261 },
  ];
  const maxScore = holes.length > 0 ? Math.round(holes[0].avgDelay * holes[0].roundsAffected) : 3103;

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Slow Rounds = Lost Revenue Card */}
      <div style={{ border: '1px solid #e8e8ec', borderRadius: '10px', padding: '28px', background: '#fafafa' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f0f0f', marginBottom: '16px', letterSpacing: '-0.01em' }}>
          Slow Rounds = Lost Dining Revenue
        </h3>

        {/* Insight callout */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
          marginBottom: '20px', fontSize: '13px', color: '#92400e', lineHeight: 1.5,
        }}>
          <span style={{ fontSize: '16px' }}>{'\uD83D\uDCA1'}</span>
          <span>When rounds exceed 4.5 hours, <strong>dining conversion drops {conversionDrop}%</strong> and check averages fall <strong>{checkDrop}%</strong> {'\u2014'} costing <strong>${revenueLostPerMonth.toLocaleString()}/month</strong> in lost F&B revenue.</span>
        </div>

        {/* Cascade flow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '16px', padding: '6px 0' }}>
          <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slow Rounds</span>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{'\u2192'}</span>
          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lower Conversion</span>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{'\u2192'}</span>
          <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Smaller Checks</span>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{'\u2192'}</span>
          <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lost Revenue</span>
        </div>

        {/* Metric cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {/* Slow Rounds */}
          <MetricCard
            accentColor="#3B82F6"
            borderColor="#BFDBFE"
            label="Slow Rounds (Jan)"
            value={slowRoundsPerMonth.toLocaleString()}
            sublabel={`${(slowRoundStats.overallRate * 100).toFixed(0)}% of all rounds`}
            trendLabel={'\u2193 5% vs 6-mo avg'}
            trendColor="#16a34a"
            trendBg="#f0fdf4"
            barPct={slowRoundStats.overallRate * 100}
            barBg="#eff6ff"
          />
          {/* Conversion Drop */}
          <MetricCard
            accentColor="#EF4444"
            borderColor="#FECACA"
            label="Conversion Drop"
            value={`${conversionDrop}%`}
            sublabel={`${(fastConversionRate * 100).toFixed(0)}% \u2192 ${(slowConversionRate * 100).toFixed(0)}% after slow rounds`}
            trendLabel={'\u2191 4 pts vs Dec'}
            trendColor="#dc2626"
            trendBg="#fef2f2"
            barPct={Number(conversionDrop)}
            barBg="#fef2f2"
          />
          {/* Avg Check Drop */}
          <MetricCard
            accentColor="#F59E0B"
            borderColor="#FDE68A"
            label="Avg Check Drop"
            value={`${checkDrop}%`}
            sublabel={`$${avgCheckFast.toFixed(2)} \u2192 $${avgCheckSlow.toFixed(2)} per person`}
            trendLabel={'\u2191 2 pts vs Dec'}
            trendColor="#dc2626"
            trendBg="#fef2f2"
            barPct={Number(checkDrop)}
            barBg="#fffbeb"
          />
          {/* Monthly Revenue Lost - dark full-width */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b3d 50%, #1e1e2e 100%)',
            border: '1px solid rgba(243,146,45,0.3)', borderRadius: '12px',
            padding: '24px 28px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#F3922D', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Monthly revenue lost
            </div>
            <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px', lineHeight: 1, letterSpacing: '-0.02em' }}>
              ${revenueLostPerMonth.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>
              Fixable through pace management
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '12px', fontWeight: 600, color: '#fca5a5',
                background: 'rgba(220,38,38,0.15)', padding: '4px 12px', borderRadius: '20px',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                border: '1px solid rgba(220,38,38,0.2)',
              }}>{'\u2191'} 12% vs Dec</div>
            </div>
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '100%', background: 'radial-gradient(circle at 80% 50%, rgba(243,146,45,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', fontSize: '80px', fontWeight: 900, color: 'rgba(255,255,255,0.06)', fontFamily: "'JetBrains Mono', monospace", pointerEvents: 'none', lineHeight: 1 }}>$</div>
            <div style={{
              position: 'absolute', right: '24px', bottom: '24px',
              fontSize: '12px', fontWeight: 600, color: '#F3922D',
              background: 'rgba(243,146,45,0.1)', padding: '6px 14px', borderRadius: '20px',
              border: '1px solid rgba(243,146,45,0.2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>See Recovery Plan {'\u2192'}</div>
          </div>
        </div>
      </div>

      {/* How Revenue Leaks - Comparison */}
      <div style={{
        border: '1px solid #e4e4e7', borderRadius: '14px', overflow: 'hidden',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f0f0f', padding: '24px 32px 0', marginBottom: 0, letterSpacing: '-0.01em' }}>
          How Revenue Leaks
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', padding: '6px 32px 24px', margin: 0 }}>
          Side-by-side comparison: how pace impacts F&B revenue per round.
        </p>

        <div data-comparison-grid="true" style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', gap: 0, alignItems: 'stretch' }}>
          {/* Fast Rounds Column */}
          <div style={{ background: 'linear-gradient(#f0fdf4, #fff)', padding: '28px 24px 24px', textAlign: 'left', position: 'relative' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{'\u26A1'}</span> Fast Rounds
            </div>
            <div style={{ fontSize: '12px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, color: '#166534' }}>
              Under 4.5 hours
            </div>
            <ComparisonRow label="Post-round dining" value={`${(fastConversionRate * 100).toFixed(0)}%`} color="#16a34a" />
            <ComparisonRow label="Average check" value={`$${avgCheckFast.toFixed(2)}`} color="#16a34a" />
            <div style={{ marginTop: '16px', padding: '16px', textAlign: 'center', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Revenue per round</div>
              <div style={{ fontSize: '30px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#16a34a', lineHeight: 1, letterSpacing: '-0.02em' }}>
                ${revenuePerFast.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#166534', marginTop: '6px', opacity: 0.7 }}>Baseline target</div>
            </div>
          </div>

          {/* Center Delta Column */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 0, padding: '24px 12px', position: 'relative',
            background: 'linear-gradient(#1e1e2e, #2d1b3d)', minWidth: '140px',
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
                <line x1="0" y1="10" x2="50" y2="10" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M48 5 L55 10 L48 15" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: '6px', fontWeight: 600 }}>
              Revenue lost per slow round
            </div>
            <div style={{ fontSize: '30px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 0 30px rgba(243,146,45,0.3)' }}>
              ${revenuePerRoundDelta.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 500 }}>per round</div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                {'\u00D7'} {slowRoundsPerMonth.toLocaleString()} slow rounds
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#F3922D' }}>
                ${revenueLostPerMonth.toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#F3922D', fontWeight: 600, opacity: 0.8 }}>monthly loss</div>
            </div>
          </div>

          {/* Slow Rounds Column */}
          <div style={{ background: 'linear-gradient(#fef2f2, #fff)', padding: '28px 24px 24px', textAlign: 'left', position: 'relative' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>{'\uD83D\uDC0C'}</span> Slow Rounds
            </div>
            <div style={{ fontSize: '12px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, color: '#991b1b' }}>
              Over 4.5 hours
            </div>
            <ComparisonRow label="Post-round dining" value={`${(slowConversionRate * 100).toFixed(0)}%`} color="#dc2626" />
            <ComparisonRow label="Average check" value={`$${avgCheckSlow.toFixed(2)}`} color="#dc2626" />
            <div style={{ marginTop: '16px', padding: '16px', textAlign: 'center', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Revenue per round</div>
              <div style={{ fontSize: '30px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#dc2626', lineHeight: 1, letterSpacing: '-0.02em' }}>
                ${revenuePerSlow.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#991b1b', marginTop: '6px', opacity: 0.7 }}>
                {'\u2212'}${revenuePerRoundDelta.toFixed(2)} vs fast rounds
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            [data-comparison-grid] {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            [data-comparison-grid] > div:nth-child(2) {
              order: 3;
              flex-direction: row !important;
            }
          }
        `}</style>
      </div>

      {/* Bottleneck Holes */}
      <div style={{ border: '1px solid #e4e4e7', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f0f0f', marginBottom: '4px' }}>
          Bottleneck Holes by Impact
        </h3>
        <p style={{ fontSize: '13px', color: '#3f3f46', marginBottom: '16px' }}>
          Prioritize ranger coverage by impact score (avg delay {'\u00D7'} rounds affected).
        </p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {holes.map((hole, idx) => {
            const score = Math.round(hole.avgDelay * hole.roundsAffected);
            const pct = (score / maxScore) * 100;
            const isHigh = idx < 2;
            const impactColor = isHigh ? undefined : '#b45309';
            const impactBg = isHigh ? undefined : 'rgba(180,83,9,0.08)';
            const impactBorder = isHigh ? undefined : 'rgba(180,83,9,0.333)';

            return (
              <div key={hole.hole} style={{ border: '1px solid #e4e4e7', borderRadius: '10px', padding: '8px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ border: '1px solid #e4e4e7', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace" }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 700, color: '#0f0f0f' }}>Hole {hole.hole}</span>
                  </div>
                  <span style={{
                    borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    ...(isHigh
                      ? {}
                      : { border: `1px solid ${impactBorder}`, background: impactBg, color: impactColor }),
                  }}>
                    {isHigh ? 'HIGH' : 'MEDIUM'} impact
                  </span>
                </div>
                <div style={{ height: '12px', borderRadius: '999px', overflow: 'hidden', border: '1px solid #efefef' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: isHigh
                      ? undefined
                      : `linear-gradient(90deg, #b45309, rgba(180,83,9,0.8))`,
                  }} />
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '12px', color: '#3f3f46' }}>
                  <span>Delay: <strong style={{ color: '#0f0f0f', fontFamily: "'JetBrains Mono', monospace" }}>{hole.avgDelay} min</strong></span>
                  <span>Rounds: <strong style={{ color: '#0f0f0f', fontFamily: "'JetBrains Mono', monospace" }}>{hole.roundsAffected}</strong></span>
                  <span>Score: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: isHigh ? undefined : '#b45309' }}>{score.toLocaleString()}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ accentColor, borderColor, label, value, sublabel, trendLabel, trendColor, trendBg, barPct, barBg }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${borderColor}`, borderRadius: '10px',
      padding: '20px', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accentColor, borderRadius: '10px 10px 0 0' }} />
      <div style={{ fontSize: '11px', fontWeight: 600, color: accentColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: '#0f0f0f', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#6b7280', marginBottom: '12px' }}>{sublabel}</div>
      <div style={{ width: '100%', height: '4px', background: barBg, borderRadius: '4px', margin: '8px 0 4px', overflow: 'hidden' }}>
        <div style={{ width: `${barPct}%`, height: '100%', background: accentColor, borderRadius: '4px', transition: 'width 1s' }} />
      </div>
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: trendColor, background: trendBg, padding: '3px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {trendLabel}
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '13px', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '16px', color, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
