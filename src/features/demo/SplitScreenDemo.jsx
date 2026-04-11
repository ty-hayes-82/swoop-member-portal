/**
 * SplitScreenDemo — "Both Sides of the Glass"
 * Route: #/demo/split-screen
 *
 * LEFT (60%): Concierge chat as James Whitfield
 * RIGHT (40%): GM Intelligence Feed showing agent activations
 */
import { useState, useEffect, useRef } from 'react';

const MEMBER_ID = 'mbr_t01';
const SUGGESTED_MESSAGE = "Lunch was really slow today. We waited forever and nobody checked on us.";

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function agentTimestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

/* ---------- Agent Event Card ---------- */
function AgentEventCard({ event, isNew }) {
  const borderColor = {
    'service-recovery': 'border-red-400 bg-red-950/60',
    'staffing-demand': 'border-blue-400 bg-blue-950/60',
    'member-risk': 'border-amber-400 bg-amber-950/60',
    'concierge': 'border-emerald-400 bg-emerald-950/60',
    'health-score': 'border-purple-400 bg-purple-950/60',
  }[event.agent] || 'border-gray-500 bg-gray-900/60';

  const avatarIcon = {
    'service-recovery': '\u{1F6A8}',
    'staffing-demand': '\u{1F465}',
    'member-risk': '\u26A0\uFE0F',
    'concierge': '\u{1F4AC}',
    'health-score': '\u{1F4C8}',
  }[event.agent] || '\u{1F916}';

  return (
    <div className={`rounded-xl border-l-4 ${borderColor} p-4 transition-all duration-500 ${isNew ? 'animate-pulse' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{avatarIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              {event.agentLabel}
            </span>
            <span className="text-[10px] text-gray-500 flex-shrink-0">{event.time}</span>
          </div>
          <div className="text-sm text-gray-100 font-medium mb-1">{event.title}</div>
          <div className="text-xs text-gray-400 leading-relaxed">{event.detail}</div>
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
function ConciergePanel({ onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    if (!text.trim() || loading) return;
    setShowSuggestion(false);
    const userMsg = { role: 'user', text: text.trim(), time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Club': 'club_001' },
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
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          PC
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">Pinetree CC Concierge</div>
          <div className="text-xs text-gray-500">James Whitfield</div>
        </div>
        <div className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-1">Member View</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">&#127965;</span>
            </div>
            <p className="text-gray-500 text-sm text-center">
              Welcome to Pinetree Country Club. How can I help you today?
            </p>
            {showSuggestion && (
              <button
                onClick={() => send(SUGGESTED_MESSAGE)}
                className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors max-w-sm"
              >
                {SUGGESTED_MESSAGE}
              </button>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Concierge is typing</span>
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

      {/* Input bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-2 flex items-end gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message concierge..."
          disabled={loading}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
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

/* ---------- GM Intelligence Feed (Right) ---------- */
function GMIntelFeed({ events, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, loading]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm">
          &#129504;
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-100">GM Intelligence Feed</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Real-time Agent Activations</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Live</span>
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {events.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-4xl opacity-30">&#129504;</div>
            <p className="text-gray-500 text-sm">Waiting for member interaction...</p>
            <p className="text-gray-600 text-xs max-w-[240px]">
              When the member sends a message, agents will activate here in real time.
            </p>
          </div>
        )}

        {events.map((event, i) => (
          <AgentEventCard key={i} event={event} isNew={i === events.length - 1} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">Agents analyzing interaction...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Member context strip */}
      <div className="flex-shrink-0 border-t border-gray-800 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500">
        <span>James Whitfield</span>
        <span>$18K/yr</span>
        <span>6-year member</span>
        <span>Balanced Active</span>
        <span className="text-amber-400 font-semibold">Health: 42</span>
      </div>
    </div>
  );
}

/* ---------- Main Split Screen ---------- */
export default function SplitScreenDemo() {
  const [agentEvents, setAgentEvents] = useState([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'feed'

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
        // Stagger events for dramatic effect
        for (let i = 0; i < data.events.length; i++) {
          await new Promise(r => setTimeout(r, i === 0 ? 300 : 1200));
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

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ height: '100dvh' }}>
      {/* Mobile tab toggle */}
      <div className="md:hidden flex-shrink-0 flex border-b border-gray-300 bg-white">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
            mobileTab === 'chat' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-gray-500 bg-gray-50'
          }`}
        >
          Member Chat
        </button>
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
            mobileTab === 'feed' ? 'text-purple-600 border-b-2 border-purple-600 bg-gray-950' : 'text-gray-500 bg-gray-50'
          }`}
        >
          GM Feed {agentEvents.length > 0 && <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-purple-600 text-white">{agentEvents.length}</span>}
        </button>
      </div>

      {/* LEFT: Concierge Chat (60% desktop, full on mobile) */}
      <div className={`md:w-[60%] md:border-r border-gray-300 flex-1 min-h-0 ${mobileTab !== 'chat' ? 'hidden md:block' : ''}`}>
        <ConciergePanel onMessageSent={handleMessageSent} />
      </div>

      {/* RIGHT: GM Intelligence Feed (40% desktop, full on mobile) */}
      <div className={`md:w-[40%] flex-1 min-h-0 ${mobileTab !== 'feed' ? 'hidden md:block' : ''}`}>
        <GMIntelFeed events={agentEvents} loading={agentLoading} />
      </div>
    </div>
  );
}
