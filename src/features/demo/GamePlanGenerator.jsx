/**
 * GamePlanGenerator — "Generate Today's Game Plan" button + inline results.
 * Calls /api/demo/generate-gameplan, shows timer, renders action cards.
 */
import { useState, useRef, useEffect } from 'react';

export default function GamePlanGenerator() {
  const [state, setState] = useState('idle'); // idle | generating | done | error
  const [elapsed, setElapsed] = useState(0);
  const [plan, setPlan] = useState(null);
  const [approved, setApproved] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleGenerate = async () => {
    setState('generating');
    setElapsed(0);
    setPlan(null);
    setApproved([]);
    setErrorMsg('');

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 100);

    try {
      const res = await fetch('/api/demo/generate-gameplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      clearInterval(timerRef.current);
      setElapsed(Math.floor((Date.now() - start) / 1000));
      setPlan(data.plan);
      setState('done');
    } catch (err) {
      clearInterval(timerRef.current);
      setErrorMsg(err.message);
      setState('error');
    }
  };

  const handleApprove = (idx) => {
    setApproved(prev => [...prev, idx]);
  };

  const priorityColor = (p) => p === 'high' ? '#ef4444' : '#f59e0b';
  const domainBg = { weather: '#dbeafe', staffing: '#fef3c7', fb: '#dcfce7', tee_sheet: '#ede9fe', member_risk: '#fee2e2' };

  return (
    <div className="flex flex-col gap-4">
      {/* Generate Button */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleGenerate}
          className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg border-none cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #e8a732 0%, #d4942a 100%)',
            boxShadow: '0 4px 20px rgba(232,167,50,0.35)',
          }}
        >
          Generate Today's Game Plan
        </button>
      )}

      {/* Generating state with timer */}
      {state === 'generating' && (
        <div className="w-full py-4 px-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '2px solid #c4b5fd' }}>
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full" />
            <span className="text-purple-700 font-bold text-lg">Generating... {elapsed}s</span>
          </div>
          <p className="text-sm text-purple-500 mt-2 mb-0">Claude is analyzing 5 data domains across your club</p>
        </div>
      )}

      {/* Error state */}
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

      {/* Results */}
      {state === 'done' && plan && (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Game Plan Ready</span>
              <span className="text-xs font-mono text-gray-400">Generated in {elapsed}s</span>
            </div>
            <p className="text-white text-sm font-medium m-0 leading-relaxed">{plan.summary}</p>
            {plan.risk_level && (
              <span
                className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: plan.risk_level === 'high' ? '#fecaca' : plan.risk_level === 'elevated' ? '#fef3c7' : '#d1fae5',
                  color: plan.risk_level === 'high' ? '#dc2626' : plan.risk_level === 'elevated' ? '#d97706' : '#059669',
                }}
              >
                Risk: {plan.risk_level}
              </span>
            )}
          </div>

          {/* Action Cards */}
          {(plan.actions || []).map((action, idx) => {
            const isApproved = approved.includes(idx);
            return (
              <div
                key={idx}
                className="rounded-xl border bg-white p-4 transition-all duration-300"
                style={{
                  borderColor: isApproved ? '#86efac' : '#e5e7eb',
                  borderLeftWidth: 4,
                  borderLeftColor: isApproved ? '#22c55e' : priorityColor(action.priority),
                  opacity: isApproved ? 0.7 : 1,
                  animation: `slideInRight 0.4s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
                        style={{ background: priorityColor(action.priority) }}
                      >
                        {action.priority}
                      </span>
                      {(action.domains || []).map(d => (
                        <span
                          key={d}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: domainBg[d] || '#f3f4f6', color: '#374151' }}
                        >
                          {d.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm font-bold text-gray-800 mb-1">{action.headline}</div>
                    <div className="text-xs text-gray-600 leading-relaxed mb-1">{action.rationale}</div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      {action.impact && <span className="font-semibold text-red-500">{action.impact}</span>}
                      {action.owner && <span>{action.owner}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isApproved}
                    onClick={() => handleApprove(idx)}
                    className="shrink-0 px-3 py-1.5 rounded-lg border-none cursor-pointer font-bold text-sm transition-all"
                    style={{
                      background: isApproved ? '#dcfce7' : '#f0fdf4',
                      color: isApproved ? '#16a34a' : '#15803d',
                      cursor: isApproved ? 'default' : 'pointer',
                    }}
                  >
                    {isApproved ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Reset */}
          <button
            type="button"
            onClick={() => { setState('idle'); setPlan(null); }}
            className="self-center text-sm text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer mt-2"
          >
            Generate another plan
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
