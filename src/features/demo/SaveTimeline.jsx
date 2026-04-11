/**
 * SaveTimeline — "Invisible Save" Timeline
 * Route: #/demo/save-timeline
 *
 * Animated 60-second replay of James Whitfield's 30-day save story.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const TIMELINE_EVENTS = [
  {
    date: 'Jan 3',
    title: 'Health score starts declining',
    detail: 'Golf rounds dropping: 4/mo down to 2/mo. Engagement metrics softening across all channels.',
    healthScore: 68,
    prevScore: 78,
    source: 'Member Risk',
    sourceColor: 'bg-amber-500',
    icon: '\u{1F4C9}',
  },
  {
    date: 'Jan 10',
    title: 'Concierge interaction drops',
    detail: 'Member stopped texting the concierge. Last interaction was Jan 3. Silent disengagement pattern detected.',
    healthScore: 58,
    source: 'Concierge',
    sourceColor: 'bg-emerald-500',
    icon: '\u{1F4F1}',
  },
  {
    date: 'Jan 14',
    title: 'Complaint filed via concierge',
    detail: '"Slow lunch, felt ignored." 42-minute ticket time at Grill Room. Family was seated and nobody checked on them for 20 minutes.',
    healthScore: 48,
    source: 'Concierge',
    sourceColor: 'bg-emerald-500',
    icon: '\u{1F4E2}',
  },
  {
    date: 'Jan 14',
    title: 'Service Recovery activates',
    detail: 'Complaint auto-routed to F&B Director. Member profile pulled: $18K, 6-year, Balanced Active. Escalation timer started: GM alert within 2 hours.',
    healthScore: 45,
    source: 'Service Recovery',
    sourceColor: 'bg-red-500',
    icon: '\u{1F6A8}',
    highlight: true,
  },
  {
    date: 'Jan 14',
    title: 'GM calls James with full context',
    detail: 'GM had member profile, complaint detail, family preferences (booth 12, wine dinners), and suggested talking points before dialing. Call lasted 4 minutes.',
    healthScore: 48,
    source: 'Service Recovery',
    sourceColor: 'bg-red-500',
    icon: '\u{1F4DE}',
    highlight: true,
  },
  {
    date: 'Jan 21',
    title: 'Concierge sends follow-up check-in',
    detail: 'Automated follow-up: "Hi James, hope Saturday lunch went well. Anything we can do better?" James replied positively.',
    healthScore: 55,
    source: 'Concierge',
    sourceColor: 'bg-emerald-500',
    icon: '\u{1F4AC}',
  },
  {
    date: 'Jan 28',
    title: 'James books tee time + dinner',
    detail: 'Booked Saturday 9:20 AM tee time and dinner for four through concierge. First proactive booking in 3 weeks.',
    healthScore: 64,
    source: 'Concierge',
    sourceColor: 'bg-emerald-500',
    icon: '\u26F3',
  },
  {
    date: 'Feb 3',
    title: 'Health score recovered',
    detail: 'Score climbed from 42 to 71 (+29 points). Golf rounds back to 3/month, dining weekly, concierge engagement restored.',
    healthScore: 71,
    prevScore: 42,
    source: 'Member Risk',
    sourceColor: 'bg-amber-500',
    icon: '\u{1F4C8}',
    highlight: true,
  },
];

const RESULT = {
  duesProtected: '$18,000',
  gmTime: '8 minutes',
  timespan: '30 days',
  boardLine: '$18K in annual dues protected. GM investment: 8 minutes across 30 days. Zero additional staff cost.',
};

const INTERVAL_MS = 5000; // 5 seconds per event (8 events ~ 40s + result)

/* ---------- Mini Health Chart ---------- */
function HealthChart({ events, activeIndex }) {
  const visibleEvents = events.slice(0, activeIndex + 1);
  if (visibleEvents.length === 0) return null;

  const scores = [78, ...visibleEvents.map(e => e.healthScore)];
  const maxScore = 100;
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = scores.map((s, i) => ({
    x: padding.left + (i / (TIMELINE_EVENTS.length)) * chartW,
    y: padding.top + chartH - (s / maxScore) * chartH,
    score: s,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Color based on last score
  const lastScore = scores[scores.length - 1];
  const lineColor = lastScore >= 70 ? '#10b981' : lastScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      {/* Grid lines */}
      {[25, 50, 75].map(v => (
        <g key={v}>
          <line
            x1={padding.left} y1={padding.top + chartH - (v / maxScore) * chartH}
            x2={width - padding.right} y2={padding.top + chartH - (v / maxScore) * chartH}
            stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"
          />
          <text
            x={padding.left - 4} y={padding.top + chartH - (v / maxScore) * chartH + 3}
            fill="#6b7280" fontSize="8" textAnchor="end"
          >{v}</text>
        </g>
      ))}

      {/* Line */}
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5}
          fill={lineColor} stroke="#111827" strokeWidth="1.5" />
      ))}

      {/* Last score label */}
      {points.length > 0 && (
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 8}
          fill={lineColor} fontSize="11" fontWeight="bold" textAnchor="middle"
        >{lastScore}</text>
      )}
    </svg>
  );
}

/* ---------- Result Card ---------- */
function ResultCard() {
  return (
    <div className="mt-6 rounded-2xl border-2 border-emerald-500 bg-emerald-950/50 p-6 animate-pulse">
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">&#9989;</div>
        <div className="text-lg font-bold text-emerald-300">Invisible Save Complete</div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{RESULT.duesProtected}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Dues Protected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{RESULT.gmTime}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">GM Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{RESULT.timespan}</div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Window</div>
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Board Report Line Item</div>
        <div className="text-sm text-gray-200">{RESULT.boardLine}</div>
      </div>
    </div>
  );
}

/* ---------- Main Timeline ---------- */
export default function SaveTimeline() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef(null);
  const activeRef = useRef(null);

  const totalSteps = TIMELINE_EVENTS.length;

  const advance = useCallback(() => {
    setActiveIndex(prev => {
      const next = prev + 1;
      if (next >= totalSteps) {
        setShowResult(true);
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, [totalSteps]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(advance, INTERVAL_MS);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, advance]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  function handleStart() {
    setActiveIndex(-1);
    setShowResult(false);
    setIsPlaying(true);
    // Kick off first event immediately
    setTimeout(() => setActiveIndex(0), 300);
  }

  function handleClick(idx) {
    setActiveIndex(idx);
    if (idx >= totalSteps - 1) {
      setShowResult(true);
      setIsPlaying(false);
    }
  }

  function handleReset() {
    clearInterval(timerRef.current);
    setActiveIndex(-1);
    setShowResult(false);
    setIsPlaying(false);
  }

  const notStarted = activeIndex < 0 && !isPlaying;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">The Invisible Save</h1>
          <p className="text-sm text-gray-500">James Whitfield's 30-day retention story</p>
        </div>
        <div className="flex items-center gap-3">
          {notStarted ? (
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
            >
              Play Timeline
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                disabled={showResult}
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Timeline column */}
        <div className="flex-1 min-w-0">
          {notStarted && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4 opacity-40">&#9201;</div>
              <p className="text-gray-400 text-lg mb-2">Ready to replay</p>
              <p className="text-gray-600 text-sm max-w-md">
                Watch how Swoop's agent network detected, intervened, and saved a $18K member
                in 30 days with only 8 minutes of GM time.
              </p>
            </div>
          )}

          <div className="relative">
            {/* Vertical line */}
            {activeIndex >= 0 && (
              <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-gray-800" />
            )}

            {TIMELINE_EVENTS.map((event, idx) => {
              const isActive = idx <= activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div
                  key={idx}
                  ref={isCurrent ? activeRef : null}
                  onClick={() => isActive || idx === activeIndex + 1 ? handleClick(idx) : null}
                  className={`relative flex items-start gap-4 py-4 pl-2 cursor-pointer transition-all duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  } ${isCurrent ? 'scale-[1.02]' : ''}`}
                >
                  {/* Date column */}
                  <div className="w-[44px] flex-shrink-0 text-right">
                    <span className="text-xs font-mono text-gray-400">{event.date}</span>
                  </div>

                  {/* Dot on timeline */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 ${
                    isCurrent
                      ? (event.highlight ? 'bg-emerald-500 ring-4 ring-emerald-500/30' : 'bg-blue-500 ring-4 ring-blue-500/30')
                      : 'bg-gray-700'
                  }`}>
                    <span className="text-[10px]">{event.icon}</span>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-xl p-4 transition-all duration-500 ${
                    isCurrent
                      ? (event.highlight ? 'bg-emerald-950/40 border border-emerald-700' : 'bg-gray-900 border border-gray-700')
                      : 'bg-gray-900/40 border border-gray-800/50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${event.sourceColor}`}>
                        {event.source}
                      </span>
                      {event.highlight && (
                        <span className="text-[10px] text-emerald-400 font-semibold">KEY MOMENT</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-100 mb-1">{event.title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{event.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {showResult && <ResultCard />}
        </div>

        {/* Health score chart sidebar */}
        <div className="w-[300px] flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Health Score
              </div>
              {activeIndex >= 0 ? (
                <HealthChart events={TIMELINE_EVENTS} activeIndex={activeIndex} />
              ) : (
                <div className="h-[120px] flex items-center justify-center text-gray-600 text-xs">
                  Waiting for timeline start...
                </div>
              )}
            </div>

            {/* Member card */}
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Member Profile
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-200">James Whitfield</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Annual Dues</span>
                  <span className="text-gray-200">$18,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tenure</span>
                  <span className="text-gray-200">6 years</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Archetype</span>
                  <span className="text-gray-200">Balanced Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Family</span>
                  <span className="text-gray-200">Erin (spouse), Logan (son)</span>
                </div>
              </div>
            </div>

            {/* Agents involved */}
            <div className="mt-4 bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Agents Involved
              </div>
              <div className="flex flex-wrap gap-2">
                {['Concierge', 'Service Recovery', 'Member Risk'].map(a => (
                  <span key={a} className="text-[10px] px-2 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
