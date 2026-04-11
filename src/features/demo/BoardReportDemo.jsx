/**
 * BoardReportDemo — Standalone demo page for Board Report generation.
 * Route: #/demo/board-report
 */
import { useState, useRef, useEffect } from 'react';

export default function BoardReportDemo() {
  const [state, setState] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleGenerate = async () => {
    setState('generating');
    setElapsed(0);
    setReport(null);
    setErrorMsg('');

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    }, 100);

    try {
      const res = await fetch('/api/demo/generate-board-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      clearInterval(timerRef.current);
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
      setReport(data);
      setState('done');
    } catch (err) {
      clearInterval(timerRef.current);
      setErrorMsg(err.message);
      setState('error');
    }
  };

  const kpis = report?.kpis;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => { window.location.hash = '#/today'; }}
          className="text-sm text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer mb-3 p-0"
        >
          &larr; Back to Today
        </button>
        <h1 className="text-2xl font-bold text-gray-800 m-0">Board Report Generator</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Pine Tree CC &middot; January 2026 &middot; AI-generated executive narrative
        </p>

        {/* Generate Button */}
        {state === 'idle' && (
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg border-none cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
              boxShadow: '0 4px 20px rgba(30,58,95,0.35)',
            }}
          >
            Generate Board Report
          </button>
        )}

        {/* Generating */}
        {state === 'generating' && (
          <div className="w-full py-4 px-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '2px solid #7dd3fc' }}>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full" />
              <span className="text-blue-700 font-bold text-lg">Generating... {elapsed}s</span>
            </div>
            <p className="text-sm text-blue-500 mt-2 mb-0">Claude is drafting the executive narrative from club data</p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="w-full py-4 px-6 rounded-2xl bg-red-50 border-2 border-red-200 text-center">
            <p className="text-red-600 font-bold mb-2">Generation failed</p>
            <p className="text-red-500 text-sm mb-3">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg border-none cursor-pointer font-semibold hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Report Output */}
        {state === 'done' && report && (
          <div className="flex flex-col gap-5">
            {/* Generated-in badge */}
            <div className="text-right">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Generated in {elapsed}s
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Member Saves', value: kpis.member_saves.count, sub: `$${(kpis.member_saves.dues_protected / 1000).toFixed(0)}K protected`, color: '#059669' },
                { label: 'Complaints Resolved', value: kpis.complaints.resolved, sub: `${kpis.complaints.avg_resolution_hours}hr avg response`, color: '#2563eb' },
                { label: 'Concierge Members', value: kpis.concierge.active_members, sub: `${kpis.concierge.satisfaction_rate}% satisfaction`, color: '#7c3aed' },
                { label: 'GM Hours Saved', value: kpis.gm_hours_saved, sub: `${kpis.agents_running} agents running`, color: '#d97706' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <div className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-xs font-semibold text-gray-600 mt-1">{kpi.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Narrative */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 m-0" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    Executive Summary
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 m-0" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    {kpis.club} &middot; {kpis.month}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border-none cursor-pointer font-semibold"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  Print
                </button>
              </div>
              <div className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                {report.narrative}
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Financial Impact</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">${(kpis.member_saves.dues_protected / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-400">Dues Protected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${(kpis.revenue.incremental_fb / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-400">Incremental F&B</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{kpis.revenue.tee_time_utilization}%</div>
                  <div className="text-xs text-gray-400">Tee Time Utilization</div>
                </div>
              </div>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={() => { setState('idle'); setReport(null); }}
              className="self-center text-sm text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer mt-2"
            >
              Generate another report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
