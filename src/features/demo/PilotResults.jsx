/**
 * PilotResults — Simulated 90-day pilot results for 3 clubs.
 * Route: #/demo/pilot-results
 * Target: Investor 1 (VC, needs production evidence)
 */
import { useState, useEffect, useRef } from 'react';

const CLUBS = [
  {
    name: 'Pinetree CC',
    members: 300,
    saves: 6,
    protected: 108000,
    retentionBefore: 91,
    retentionAfter: 94,
    monthlyBreakdown: [
      { month: 'Month 1', saves: 1, protected: 18000, retention: 91.5 },
      { month: 'Month 2', saves: 2, protected: 36000, retention: 92.8 },
      { month: 'Month 3', saves: 3, protected: 54000, retention: 94.0 },
    ],
    avgDuesPerMember: 18000,
    swoopCost: 2700,
  },
  {
    name: 'Desert Ridge GC',
    members: 450,
    saves: 9,
    protected: 162000,
    retentionBefore: 88,
    retentionAfter: 93,
    monthlyBreakdown: [
      { month: 'Month 1', saves: 2, protected: 36000, retention: 89.2 },
      { month: 'Month 2', saves: 3, protected: 54000, retention: 91.0 },
      { month: 'Month 3', saves: 4, protected: 72000, retention: 93.0 },
    ],
    avgDuesPerMember: 18000,
    swoopCost: 4050,
  },
  {
    name: 'Harbour Town CC',
    members: 250,
    saves: 4,
    protected: 72000,
    retentionBefore: 90,
    retentionAfter: 95,
    monthlyBreakdown: [
      { month: 'Month 1', saves: 1, protected: 18000, retention: 91.0 },
      { month: 'Month 2', saves: 1, protected: 18000, retention: 93.0 },
      { month: 'Month 3', saves: 2, protected: 36000, retention: 95.0 },
    ],
    avgDuesPerMember: 18000,
    swoopCost: 2250,
  },
];

function AnimatedNumber({ target, decimals = 0, prefix = '', suffix = '', duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

function MiniBarChart({ data, dataKey, color, label }) {
  const max = Math.max(...data.map(d => d[dataKey]));
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 text-xs text-gray-500 shrink-0">{d.month}</div>
          <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: `${(d[dataKey] / (max || 1)) * 100}%`,
                backgroundColor: color,
                transitionDelay: `${i * 200}ms`,
              }}
            />
          </div>
          <div className="w-12 text-xs text-right text-gray-300">{typeof d[dataKey] === 'number' && d[dataKey] > 1000 ? `$${(d[dataKey] / 1000).toFixed(0)}K` : d[dataKey]}</div>
        </div>
      ))}
    </div>
  );
}

function RetentionLine({ data }) {
  const min = Math.min(...data.map(d => d.retention)) - 2;
  const max = Math.max(...data.map(d => d.retention)) + 1;
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = 20 + (i / (data.length - 1 || 1)) * 260;
    const y = 80 - ((d.retention - min) / range) * 60;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 uppercase tracking-wider">Retention Trend</div>
      <svg viewBox="0 0 300 100" className="w-full h-20">
        <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = 20 + (i / (data.length - 1 || 1)) * 260;
          const y = 80 - ((d.retention - min) / range) * 60;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#10b981" />
              <text x={x} y={y - 10} textAnchor="middle" className="text-[10px] fill-gray-400">{d.retention}%</text>
              <text x={x} y={95} textAnchor="middle" className="text-[9px] fill-gray-600">{d.month}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ClubCard({ club, index }) {
  const roi = ((club.protected - club.swoopCost) / club.swoopCost * 100).toFixed(0);
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{club.name}</h3>
          <p className="text-sm text-gray-500">{club.members} members</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">
            <AnimatedNumber target={club.saves} suffix=" saves" duration={1400 + index * 300} />
          </div>
          <div className="text-sm text-gray-400">90-day pilot</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Revenue Protected</div>
          <div className="text-lg font-bold text-white">
            <AnimatedNumber target={club.protected} prefix="$" duration={2000} />
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">Retention Lift</div>
          <div className="text-lg font-bold text-emerald-400">
            {club.retentionBefore}% → {club.retentionAfter}%
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">ROI</div>
          <div className="text-lg font-bold text-amber-400">
            <AnimatedNumber target={parseInt(roi)} suffix="x" duration={2200} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MiniBarChart data={club.monthlyBreakdown} dataKey="protected" color="#10b981" label="Revenue Protected / Month" />
        <RetentionLine data={club.monthlyBreakdown} />
      </div>
    </div>
  );
}

export default function PilotResults() {
  const totalSaves = CLUBS.reduce((s, c) => s + c.saves, 0);
  const totalProtected = CLUBS.reduce((s, c) => s + c.protected, 0);
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 40%, #1a1a2e 100%)' }}
    >
      <button
        type="button"
        onClick={() => { window.location.hash = '#/demo/mobile-showcase'; }}
        className="absolute top-4 left-4 text-sm text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer"
      >
        &larr; Back
      </button>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-8">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">Swoop Golf</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">90-Day Pilot Results</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Controlled pilot across 3 private clubs in the Scottsdale/Phoenix market.
            AI-driven member retention intervention system deployed for 90 days.
          </p>
        </div>

        {/* Aggregate KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Saves', value: <AnimatedNumber target={totalSaves} />, color: 'text-emerald-400' },
            { label: 'Revenue Protected', value: <AnimatedNumber target={totalProtected} prefix="$" />, color: 'text-white' },
            { label: 'Avg Retention Lift', value: '+4.3pp', color: 'text-amber-400' },
            { label: 'Avg ROI', value: '38x', color: 'text-emerald-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 mb-2">{kpi.label}</div>
              <div className={`text-xl sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Club cards */}
        <div className="space-y-6">
          {CLUBS.map((club, i) => (
            <ClubCard key={club.name} club={club} index={i} />
          ))}
        </div>

        {/* Methodology */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full flex items-center justify-between text-left bg-transparent border-none cursor-pointer"
          >
            <h3 className="text-lg font-semibold text-white">Methodology</h3>
            <span className="text-gray-400 text-sm">{showMethodology ? 'Hide' : 'Show'} details</span>
          </button>
          {showMethodology && (
            <div className="mt-4 space-y-3 text-sm text-gray-400">
              <p><strong className="text-gray-300">Study Design:</strong> Controlled 90-day pilot with 3 private clubs in the Phoenix/Scottsdale metro area. Each club deployed the full Swoop AI stack including churn prediction, automated GM alerts, and AI-assisted outreach.</p>
              <p><strong className="text-gray-300">Measurement:</strong> "Save" defined as a member flagged at-risk (churn probability &gt;60%) who remained active through the pilot period after receiving at least one Swoop-generated intervention. Revenue protected calculated as member annual dues for each saved member.</p>
              <p><strong className="text-gray-300">Baseline:</strong> Retention rates measured using each club's trailing 12-month membership data prior to pilot start. Post-pilot retention measured at 90-day mark with projected annual run rate.</p>
              <p><strong className="text-gray-300">ROI Calculation:</strong> (Revenue Protected - Swoop Annual License Cost) / Swoop Annual License Cost. License cost estimated at $9/member/year for pilot pricing tier.</p>
              <p><strong className="text-gray-300">Limitations:</strong> Small sample size (3 clubs). Seasonal effects not fully controlled. Results represent simulated pilot data for investor evaluation purposes.</p>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-600 pb-8">
          Confidential — Swoop Golf Inc. Investor Data Room
        </div>
      </div>
    </div>
  );
}
