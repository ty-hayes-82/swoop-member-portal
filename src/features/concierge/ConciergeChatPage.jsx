import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'swoop_concierge_chat';
const MEMBER_ID = 'mbr_t01';

const QUICK_MESSAGES = [
  "My lunch took 45 minutes and no one apologized",
  "Book my usual Saturday 7 AM with the guys",
  "Get Erin on the wine dinner list",
  "What's happening at the club this weekend?",
];

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('swoop_auth_token');
    if (token && token !== 'demo') return { Authorization: `Bearer ${token}` };
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    if (user?.clubId?.startsWith('demo_')) return { 'X-Demo-Club': user.clubId };
  } catch {}
  return { 'X-Demo-Club': 'club_001' };
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ConciergeChatPage() {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Prevent body scroll only when concierge is the top-level route (not embedded)
  useEffect(() => {
    const isTopLevel = window.location.hash === '#/concierge';
    if (!isTopLevel) return;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  async function send(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim(), time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ member_id: MEMBER_ID, message: text.trim() }),
      });
      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        text: data.response || data.error || 'No response',
        time: timestamp(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-screen bg-swoop-row" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-swoop-panel border-b border-swoop-border px-4 py-3 flex items-center gap-3 safe-area-top">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          PC
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-swoop-text text-sm">Pinetree CC Concierge</div>
          <div className="text-xs text-swoop-text-muted">James Whitfield</div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-xs text-swoop-text-label hover:text-red-500 px-2 py-1">
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">&#127965;</span>
            </div>
            <p className="text-swoop-text-muted text-sm text-center">
              Welcome to Pinetree Country Club. How can I help you today?
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {QUICK_MESSAGES.map((msg) => (
                <button
                  key={msg}
                  onClick={() => send(msg)}
                  className="text-left text-sm bg-swoop-panel border border-swoop-border rounded-xl px-4 py-3 text-swoop-text-2 hover:bg-swoop-row-hover active:bg-gray-100 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-swoop-panel text-swoop-text rounded-bl-md shadow-sm'
              }`}
            >
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
          {QUICK_MESSAGES.filter(msg => !messages.some(m => m.text === msg)).slice(0, 3).map((msg, i) => (
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
        onSubmit={handleSubmit}
        className="flex-shrink-0 bg-swoop-panel border-t border-swoop-border px-3 py-2 flex items-end gap-2 safe-area-bottom"
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

      {/* Powered by badge */}
      <div className="flex-shrink-0 bg-swoop-panel text-center py-1.5">
        <span className="text-[10px] text-swoop-text-label tracking-wide">Powered by <span className="font-semibold text-swoop-text-muted">Swoop AI</span></span>
      </div>
    </div>
  );
}
