/**
 * SplitScreenDemo — "Both Sides of the Glass"
 * Route: #/demo/split-screen
 *
 * LEFT (55%): Concierge chat as James Whitfield
 * RIGHT (45%): GM Intelligence Feed showing agent activations
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const MEMBER_ID = 'mbr_t01';

const SUGGESTED_MESSAGES = [
  "My lunch took 45 minutes and no one apologized",
  "Book my usual Saturday 7 AM with the guys",
  "Get Erin on the wine dinner list",
  "What's happening at the club this weekend?",
];

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function agentTimestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

/* ---------- Agent Event Card ---------- */
function AgentEventCard({ event, index }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const borderColor = {
    'service-recovery': 'border-red-400 bg-red-950/60',
    'staffing-demand': 'border-blue-400 bg-blue-950/60',
    'member-risk': 'border-amber-400 bg-amber-950/60',
    'concierge': 'border-emerald-400 bg-emerald-950/60',
    'health-score': 'border-purple-400 bg-purple-950/60',
  }[event.agent] || 'border-swoop-border bg-gray-900/60';

  const avatarIcon = {
    'service-recovery': '\u{1F6A8}',
    'staffing-demand': '\u{1F465}',
    'member-risk': '\u26A0\uFE0F',
    'concierge': '\u{1F4AC}',
    'health-score': '\u{1F4C8}',
  }[event.agent] || '\u{1F916}';

  return (
    <div
      className={`rounded-xl border-l-4 ${borderColor} p-4 transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{avatarIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-swoop-text-ghost">
              {event.agentLabel}
            </span>
            <span className="text-[10px] text-swoop-text-muted flex-shrink-0">{event.time}</span>
          </div>
          <div className="text-sm text-gray-100 font-medium mb-1">{event.title}</div>
          <div className="text-xs text-swoop-text-label leading-relaxed">{event.detail}</div>
          {event.action && (
            <div className="mt-2 text-xs font-semibold text-emerald-400 bg-emerald-900/40 rounded px-2 py-1 inline-block">
              {event.action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Concierge Chat Panel (Left) ---------- */
function ConciergePanel({ onMessageSent, resetKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Reset state when resetKey changes
  useEffect(() => {
    setMessages([]);
    setInput('');
    setLoading(false);
    setShowSuggestions(true);
  }, [resetKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    if (!text.trim() || loading) return;
    setShowSuggestions(false);
    const userMsg = { role: 'user', text: text.trim(), time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Club': 'seed_pinetree' },
        body: JSON.stringify({ member_id: MEMBER_ID, message: text.trim() }),
      });
      const data = await res.json();
      const botText = data.response || data.error || 'No response';
      const botMsg = { role: 'assistant', text: botText, time: timestamp() };
      setMessages(prev => [...prev, botMsg]);

      // Notify parent for agent reaction
      onMessageSent(text.trim(), botText);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-full bg-swoop-row">
      {/* Header */}
      <div className="flex-shrink-0 bg-swoop-panel border-b border-swoop-border px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          PC
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-swoop-text text-sm">Pinetree CC Concierge</div>
          <div className="text-xs text-swoop-text-muted">James Whitfield</div>
        </div>
        <div className="text-[10px] text-swoop-text-label bg-swoop-row rounded-full px-2 py-1">Member View</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">&#127965;</span>
            </div>
            <p className="text-swoop-text-muted text-sm text-center">
              Welcome to Pinetree Country Club. How can I help you today?
            </p>
            {showSuggestions && (
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTED_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => send(msg)}
                    className="text-left text-sm bg-swoop-panel border border-swoop-border rounded-xl px-4 py-3 text-swoop-text-2 hover:bg-swoop-row-hover active:bg-gray-100 transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-swoop-panel text-swoop-text rounded-bl-md shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-swoop-text-label'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-swoop-panel rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-swoop-text-muted">Concierge is typing</span>
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips when conversation is active */}
      {messages.length > 0 && !loading && (
        <div className="flex-shrink-0 px-3 pb-1 flex gap-2 overflow-x-auto">
          {SUGGESTED_MESSAGES.slice(1).map((msg, i) => (
            <button
              key={i}
              onClick={() => send(msg)}
              className="whitespace-nowrap text-xs bg-swoop-border hover:bg-gray-300 text-swoop-text-2 rounded-full px-3 py-1.5 transition-colors flex-shrink-0"
            >
              {msg}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex-shrink-0 bg-swoop-panel border-t border-swoop-border px-3 py-2 flex items-end gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message concierge..."
          disabled={loading}
          className="flex-1 rounded-full border border-swoop-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-emerald-700 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}

/* ---------- "$18K AT RISK" Flash Badge ---------- */
function AtRiskBadge() {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setFlash(f => !f), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide rounded-md px-2.5 py-1 transition-all duration-300 ${
        flash
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 scale-105'
          : 'bg-red-700/80 text-red-100 shadow-md shadow-red-700/30 scale-100'
      }`}
    >
      $18K/yr AT RISK
    </span>
  );
}

/* ---------- GM Intelligence Feed (Right) ---------- */
function GMIntelFeed({ events, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, loading]);

  const hasComplaint = events.some(e => e.agent === 'service-recovery' || e.agent === 'member-risk');
  const agentCount = new Set(events.map(e => e.agent)).size;

  return (
    <div className="flex flex-col h-full bg-swoop-canvas text-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-swoop-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-swoop-row flex items-center justify-center text-sm">
          &#129504;
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-100">GM Intelligence Feed</div>
          <div className="text-[10px] text-swoop-text-muted uppercase tracking-wider">Real-time Agent Activations</div>
        </div>
        <div className="flex items-center gap-2">
          {agentCount > 0 && (
            <span className="text-[10px] font-bold text-blue-300 bg-blue-900/60 rounded-full px-2.5 py-1">
              {agentCount} agent{agentCount !== 1 ? 's' : ''} responding
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* At-risk flash banner */}
      {hasComplaint && (
        <div className="flex-shrink-0 bg-red-950/60 border-b border-red-800/50 px-4 py-2.5 flex items-center justify-center gap-3">
          <AtRiskBadge />
          <span className="text-xs text-red-300">Service complaint detected — retention risk elevated</span>
        </div>
      )}

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {events.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl opacity-30">&#129504;</div>
            <p className="text-swoop-text-muted text-sm">Waiting for member interaction...</p>
            <p className="text-swoop-text-muted text-xs max-w-[240px]">
              When the member sends a message, agents will activate here in real time.
            </p>
          </div>
        )}

        {events.map((event, i) => (
          <AgentEventCard key={`${event.agent}-${event.time}-${i}`} event={event} index={i} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-swoop-border bg-gray-900/50">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-swoop-text-label">Agents analyzing interaction...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Member context strip — prominent */}
      <div className="flex-shrink-0 border-t border-amber-700/50 bg-amber-950/40 px-4 py-3">
        <div className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold mb-1.5">Active Member</div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-white">James Whitfield</span>
          <span className="text-sm font-bold text-emerald-400">$18K/yr</span>
          <span className="text-xs text-swoop-text-ghost">6-year member</span>
          <span className="text-xs text-swoop-text-label">Balanced Active</span>
          <span className="text-sm font-bold text-amber-400 bg-amber-900/50 rounded px-2 py-0.5">Health: 42</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Split Screen ---------- */
export default function SplitScreenDemo() {
  const [agentEvents, setAgentEvents] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'feed'
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    setAgentEvents([]);
    setAgentLoading(false);
    setResetKey(k => k + 1);
  }, []);

  async function handleMessageSent(memberMessage, conciergeResponse) {
    setAgentLoading(true);
    try {
      const res = await fetch('/api/demo/agent-reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_message: memberMessage,
          concierge_response: conciergeResponse,
          member_id: MEMBER_ID,
        }),
      });
      const data = await res.json();

      if (data.events && Array.isArray(data.events)) {
        // Stagger events: 300ms initial, 800ms between each
        for (let i = 0; i < data.events.length; i++) {
          await new Promise(r => setTimeout(r, i === 0 ? 300 : 800));
          setAgentEvents(prev => [...prev, { ...data.events[i], time: agentTimestamp() }]);
        }
      }
    } catch (err) {
      setAgentEvents(prev => [...prev, {
        agent: 'error',
        agentLabel: 'System',
        title: 'Agent Error',
        detail: err.message,
        time: agentTimestamp(),
      }]);
    } finally {
      setAgentLoading(false);
    }
  }

  const mobileToggleLabel = mobileTab === 'chat' ? 'Switch to GM View' : 'Switch to Member View';

  return (
    <div className="flex flex-col h-screen" style={{ height: '100dvh' }}>
      {/* Top header bar */}
      <div className="flex-shrink-0 bg-swoop-canvas text-white px-4 py-3 flex items-center justify-between gap-3 border-b border-swoop-border">
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-wide uppercase">SWOOP DEMO — Both Sides of the Glass</div>
          <div className="text-[11px] text-swoop-text-label hidden sm:block">
            Left: what the member sees. Right: what the GM sees. Same moment.
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex-shrink-0 text-xs font-semibold bg-swoop-row hover:bg-gray-600 text-swoop-text-ghost rounded-lg px-3 py-1.5 transition-colors"
        >
          Clear &amp; Reset
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* LEFT: Concierge Chat (55% desktop, full on mobile) */}
        <div className={`md:w-[55%] md:border-r border-swoop-border flex-1 min-h-0 ${mobileTab !== 'chat' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <ConciergePanel onMessageSent={handleMessageSent} resetKey={resetKey} />
        </div>

        {/* RIGHT: GM Intelligence Feed (45% desktop, full on mobile) */}
        <div className={`md:w-[45%] flex-1 min-h-0 ${mobileTab !== 'feed' ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
          <GMIntelFeed events={agentEvents} loading={agentLoading} />
        </div>

        {/* Mobile floating toggle */}
        <button
          onClick={() => setMobileTab(t => t === 'chat' ? 'feed' : 'chat')}
          className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-swoop-row text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg border border-swoop-border active:scale-95 transition-transform"
        >
          {mobileToggleLabel}
        </button>
      </div>
    </div>
  );
}
