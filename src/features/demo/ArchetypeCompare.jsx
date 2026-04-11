/**
 * ArchetypeCompare — Side-by-side concierge chat showing different member archetypes.
 * Route: #/demo/archetype-compare
 */
import { useState, useRef, useEffect } from 'react';
import { getFirstName } from '../../utils/nameUtils';

const ARCHETYPES = {
  left: {
    member_id: 'mbr_t01',
    name: 'James Whitfield',
    archetype: 'Balanced Active',
    avatar: 'JW',
    color: '#2563eb',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: '#3b82f6',
    seedMessage: "What's available Saturday?",
  },
  right: {
    member_id: 'mbr_t02',
    name: 'Sandra Chen',
    archetype: 'Social Butterfly',
    avatar: 'SC',
    color: '#9333ea',
    bgGradient: 'from-purple-50 to-purple-100',
    borderColor: '#a855f7',
    seedMessage: "What's happening this weekend?",
  },
};

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('swoop_auth_token');
    if (token && token !== 'demo') return { Authorization: `Bearer ${token}` };
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    if (user?.clubId?.startsWith('demo_')) return { 'X-Demo-Club': user.clubId };
  } catch {}
  return { 'X-Demo-Club': 'seed_pinetree' };
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function ChatPanel({ config, side }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim(), time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ member_id: config.member_id, message: text.trim() }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.response || data.error || 'No response',
        time: timestamp(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b border-gray-200" style={{ background: `linear-gradient(135deg, ${config.color}08, ${config.color}15)` }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ background: config.color }}
        >
          {config.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{config.name}</div>
          <div className="text-xs" style={{ color: config.color }}>{config.archetype}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ minHeight: 0 }}>
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <p className="text-gray-400 text-sm text-center">
              Ask {getFirstName(config.name)} anything
            </p>
            <button
              onClick={() => send(config.seedMessage)}
              className="text-left text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors w-full max-w-xs"
            >
              "{config.seedMessage}"
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                msg.role === 'user'
                  ? 'text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
              style={msg.role === 'user' ? { background: config.color } : undefined}
            >
              <p className="text-sm whitespace-pre-wrap m-0">{msg.text}</p>
              <p className={`text-[10px] mt-1 m-0 ${msg.role === 'user' ? 'opacity-60' : 'text-gray-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Typing</span>
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

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex-shrink-0 border-t border-gray-200 px-3 py-2 flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${getFirstName(config.name)}...`}
          disabled={loading}
          className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50"
          style={{ '--tw-ring-color': config.color }}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full text-white flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0"
          style={{ background: config.color }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default function ArchetypeCompare() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
        <button
          type="button"
          onClick={() => { window.location.hash = '#/today'; }}
          className="text-sm text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer mb-2 p-0"
        >
          &larr; Back to Today
        </button>
        <h1 className="text-xl font-bold text-gray-800 m-0">Archetype Compare</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Same platform, completely different experiences. Each member gets a concierge tuned to their archetype.
        </p>
      </div>

      {/* Side-by-side panels */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4" style={{ minHeight: 0, height: 'calc(100vh - 120px)' }}>
        <ChatPanel config={ARCHETYPES.left} side="left" />
        <ChatPanel config={ARCHETYPES.right} side="right" />
      </div>
    </div>
  );
}
