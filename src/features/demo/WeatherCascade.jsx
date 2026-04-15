/**
 * WeatherCascade — Demo page showing agent cascade triggered by weather change.
 * Route: #/demo/weather-cascade
 */
import { useState, useRef, useEffect } from 'react';

const AGENTS = [
  { key: 'detect',           label: 'Weather change detected',                       delay: 0,    icon: '🌤', apiAgent: null },
  { key: 'staffing-demand',  label: 'Staffing-Demand: recalculating...',             delay: 2000, icon: '👥', apiAgent: 'staffing-demand' },
  { key: 'fb-intelligence',  label: 'F&B Intelligence: adjusting covers...',         delay: 4000, icon: '🍽', apiAgent: 'fb-intelligence' },
  { key: 'member-risk',      label: 'Member Risk: flagging at-risk members...',      delay: 6000, icon: '🚨', apiAgent: 'member-risk' },
  { key: 'chief-of-staff',   label: 'Chief of Staff: consolidating actions...',      delay: 8000, icon: '🧠', apiAgent: 'chief-of-staff' },
];

function AgentCard({ result, agent }) {
  if (!result) return null;

  if (agent.key === 'detect') {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌬</span>
          <div>
            <div className="text-sm font-bold text-orange-800">Wind Advisory Triggered</div>
            <div className="text-xs text-orange-600">Gusts increasing from 8 mph to 35 mph (peaks 42 mph)</div>
          </div>
        </div>
      </div>
    );
  }

  if (agent.key === 'chief-of-staff' && result.actions) {
    return (
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="text-sm font-bold text-purple-800 mb-1">{result.title || 'Consolidated Actions'}</div>
        <div className="text-xs text-purple-600 mb-3">{result.detail}</div>
        <div className="flex flex-col gap-2">
          {result.actions.map((a, i) => (
            <div key={i} className="rounded-lg bg-swoop-panel border border-purple-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-white"
                  style={{ background: a.priority === 'high' ? '#ef4444' : '#f59e0b' }}>
                  {a.priority}
                </span>
                <span className="text-xs font-bold text-swoop-text">{a.headline}</span>
              </div>
              <div className="text-[11px] text-swoop-text-muted">{a.rationale}</div>
              {a.owner && <div className="text-[10px] text-swoop-text-label mt-1">{a.owner}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-swoop-border bg-swoop-panel p-4">
      <div className="text-sm font-bold text-swoop-text mb-1">{result.title || agent.label}</div>
      <div className="text-xs text-swoop-text-muted leading-relaxed">{result.detail}</div>

      {result.adjustments && (
        <div className="mt-2 flex flex-col gap-1">
          {result.adjustments.map((a, i) => (
            <div key={i} className="text-[11px] bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
              <span className="font-semibold text-blue-700">{a.area}:</span> {a.change}
            </div>
          ))}
        </div>
      )}

      {result.revised_covers && (
        <div className="mt-2 flex gap-3">
          <div className="text-[11px] bg-green-50 border border-green-100 rounded-md px-2 py-1">
            <span className="font-semibold text-green-700">Lunch:</span> {result.revised_covers.lunch} covers
          </div>
          <div className="text-[11px] bg-green-50 border border-green-100 rounded-md px-2 py-1">
            <span className="font-semibold text-green-700">Dinner:</span> {result.revised_covers.dinner} covers
          </div>
        </div>
      )}

      {result.flagged_members && (
        <div className="mt-2 flex flex-col gap-1">
          {result.flagged_members.map((m, i) => (
            <div key={i} className="text-[11px] bg-red-50 border border-red-100 rounded-md px-2 py-1">
              <span className="font-semibold text-red-700">{m.name}:</span> {m.action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeatherCascade() {
  const [state, setState] = useState('idle'); // idle | running | done
  const [activeStep, setActiveStep] = useState(-1);
  const [results, setResults] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const timersRef = useRef([]);
  const startRef = useRef(0);
  const tickRef = useRef(null);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const callAgent = async (agentKey) => {
    try {
      const res = await fetch('/api/demo/weather-cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.result;
    } catch (err) {
      return { title: 'Error', detail: err.message };
    }
  };

  const handleSimulate = () => {
    setState('running');
    setActiveStep(-1);
    setResults({});
    setElapsed(0);
    startRef.current = Date.now();

    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 200);

    AGENTS.forEach((agent, idx) => {
      const timer = setTimeout(async () => {
        setActiveStep(idx);

        if (agent.key === 'detect') {
          setResults(prev => ({ ...prev, detect: true }));
        } else {
          const result = await callAgent(agent.apiAgent);
          setResults(prev => ({ ...prev, [agent.key]: result }));
        }

        if (idx === AGENTS.length - 1) {
          // Wait for the last API call to resolve, then mark done
          setTimeout(() => {
            clearInterval(tickRef.current);
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
            setState('done');
          }, 500);
        }
      }, agent.delay);
      timersRef.current.push(timer);
    });
  };

  const handleReset = () => {
    timersRef.current.forEach(clearTimeout);
    if (tickRef.current) clearInterval(tickRef.current);
    timersRef.current = [];
    setState('idle');
    setActiveStep(-1);
    setResults({});
    setElapsed(0);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => { window.location.hash = '#/today'; }}
          className="text-sm text-swoop-text-label hover:text-gray-600 bg-transparent border-none cursor-pointer mb-3 p-0"
        >
          &larr; Back to Today
        </button>
        <h1 className="text-2xl font-bold text-swoop-text m-0">Weather Cascade Demo</h1>
        <p className="text-sm text-swoop-text-muted mt-1 mb-0">Watch how a single weather change triggers a cascade of intelligent agent responses</p>
      </div>

      {/* Current Weather Card */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">Current Conditions</div>
            <div className="text-2xl font-bold text-swoop-text">Saturday: 82 F, Sunny</div>
            <div className="text-sm text-swoop-text-muted mt-1">Pine Tree CC &middot; 220 rounds booked &middot; Wind: 8 mph</div>
          </div>
          <div className="text-5xl">☀</div>
        </div>
      </div>

      {/* Simulate Button */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleSimulate}
          className="w-full py-4 px-6 rounded-2xl text-white font-bold text-lg border-none cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl mb-6"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            boxShadow: '0 4px 20px rgba(220,38,38,0.35)',
          }}
        >
          SIMULATE: Wind Gusts 35mph 🌬
        </button>
      )}

      {/* Timer bar */}
      {(state === 'running' || state === 'done') && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            {state === 'running' && <div className="animate-spin w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full" />}
            <span className="text-sm font-bold text-purple-700">
              {state === 'running' ? `Cascade running... ${elapsed}s` : `Cascade complete in ${elapsed}s`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-swoop-text-label hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* Timeline */}
      {(state === 'running' || state === 'done') && (
        <div className="flex flex-col gap-0 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-swoop-border" style={{ zIndex: 0 }} />

          {AGENTS.map((agent, idx) => {
            const isActive = idx <= activeStep;
            const hasResult = results[agent.key];
            return (
              <div
                key={agent.key}
                className="flex gap-4 relative transition-all duration-500"
                style={{
                  opacity: isActive ? 1 : 0.3,
                  transform: isActive ? 'translateY(0)' : 'translateY(10px)',
                  paddingBottom: 20,
                }}
              >
                {/* Dot */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 40, zIndex: 1 }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300"
                    style={{
                      background: isActive ? (agent.key === 'detect' ? '#fed7aa' : '#e0e7ff') : '#f3f4f6',
                      border: isActive ? '2px solid ' + (agent.key === 'detect' ? '#f97316' : '#6366f1') : '2px solid #e5e7eb',
                    }}
                  >
                    {agent.icon}
                  </div>
                  <div className="text-[10px] font-mono text-swoop-text-label mt-1">{agent.delay / 1000}s</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-swoop-text-2 mb-1.5">{agent.label}</div>
                  {isActive && !hasResult && agent.apiAgent && (
                    <div className="flex items-center gap-2 text-xs text-purple-500">
                      <div className="animate-spin w-3 h-3 border-2 border-purple-200 border-t-purple-500 rounded-full" />
                      Calling Claude...
                    </div>
                  )}
                  {hasResult && (
                    <div style={{ animation: 'slideUp 0.4s ease-out' }}>
                      <AgentCard result={hasResult} agent={agent} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
