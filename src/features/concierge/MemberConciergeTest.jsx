import { useState, useEffect, useRef, useCallback } from 'react';
import { isGuidedMode, getLoadedGates } from '../../services/demoGate';

/* ── Member data ────────────────────────────────────────────────── */
const MEMBERS = [
  {
    id: 'mbr_t01',
    name: 'James Whitfield',
    initials: 'JW',
    archetype: 'Balanced Active',
    health: 42,
    revenue: '$18K',
    signal: 'Unresolved complaint, declining rounds',
    color: 'bg-blue-600',
    suggestions: [
      'My lunch was really slow',
      'Book my usual Saturday 7 AM',
      "Get Erin on the wine dinner list",
      "What's happening at the club this weekend?",
    ],
  },
  {
    id: 'mbr_t04',
    name: 'Anne Jordan',
    initials: 'AJ',
    archetype: 'Weekend Warrior',
    health: 28,
    revenue: '$14K',
    signal: '3 missed waitlists, walked off Jan 7',
    color: 'bg-amber-600',
    suggestions: [
      "Why can't I get a Saturday tee time?",
      'What events are coming up?',
      "I tried to book last weekend and couldn't",
      'Is there a ladies golf group?',
    ],
  },
  {
    id: 'mbr_t05',
    name: 'Robert Callahan',
    initials: 'RC',
    archetype: 'Declining',
    health: 22,
    revenue: '$18K',
    signal: 'Hitting exact F&B minimum, 9-day complaint unresolved',
    color: 'bg-red-600',
    suggestions: [
      'I want to cancel my membership',
      'Make a dinner reservation',
      "Nobody follows up on anything here",
      'What are the cancellation fees?',
    ],
  },
  {
    id: 'mbr_146',
    name: 'Margaret Chen',
    initials: 'MC',
    archetype: 'Social Butterfly',
    health: 36,
    revenue: '$9K',
    signal: 'Dining cliff $142 to $18',
    color: 'bg-purple-600',
    suggestions: [
      "What's happening this weekend?",
      'Get me a table at the Grill Room',
      'Are there any wine tastings coming up?',
      'Book a table for 6 on Friday',
    ],
  },
  {
    id: 'mbr_t07',
    name: 'Linda Leonard',
    initials: 'LL',
    archetype: 'Ghost',
    health: 12,
    revenue: '$18K',
    signal: 'Zero visits since October, widow',
    color: 'bg-gray-600',
    suggestions: [
      "I haven't been to the club in a while",
      "What's new?",
      'Are there any social events for singles?',
      'Is the Sunday brunch still happening?',
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function timestamp() {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function healthColor(score) {
  if (score >= 40) return 'bg-emerald-500';
  if (score >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

function storageKey(memberId) {
  return `swoop_concierge_test_${memberId}`;
}

/* ── Component ──────────────────────────────────────────────────── */
export default function MemberConciergeTest() {
  const [selectedId, setSelectedId] = useState(MEMBERS[0].id);
  const [chatsByMember, setChatsByMember] = useState(() => {
    const loaded = {};
    for (const m of MEMBERS) {
      try {
        loaded[m.id] = JSON.parse(localStorage.getItem(storageKey(m.id))) || [];
      } catch {
        loaded[m.id] = [];
      }
    }
    return loaded;
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const member = MEMBERS.find(m => m.id === selectedId);
  const messages = chatsByMember[selectedId] || [];

  // Persist messages
  useEffect(() => {
    localStorage.setItem(storageKey(selectedId), JSON.stringify(messages));
  }, [messages, selectedId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Lock body scroll
  useEffect(() => {
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

  function selectMember(id) {
    setSelectedId(id);
    setInput('');
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim(), time: timestamp() };
    setChatsByMember(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsg],
    }));
    setInput('');
    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Demo-Club': 'seed_pinetree',
      };
      if (isGuidedMode()) {
        headers['X-Demo-Gates'] = getLoadedGates().join(',');
      }

      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_id: selectedId, message: text.trim() }),
      });
      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        text: data.response || data.error || 'No response',
        time: timestamp(),
      };
      setChatsByMember(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), botMsg],
      }));
    } catch (err) {
      setChatsByMember(prev => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] || []), { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }],
      }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, selectedId]);

  function clearChat() {
    setChatsByMember(prev => ({ ...prev, [selectedId]: [] }));
    localStorage.removeItem(storageKey(selectedId));
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-screen bg-gray-100" style={{ height: '100dvh' }}>
      {/* ── Member selector bar ─────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {MEMBERS.map(m => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                onClick={() => selectMember(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all flex-shrink-0 ${
                  active
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {m.initials}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold leading-tight">{m.name.split(' ')[0]}</div>
                  <div className={`text-[10px] leading-tight ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                    {m.archetype}
                  </div>
                </div>
                <span className={`w-5 h-5 rounded-full ${healthColor(m.health)} text-white text-[10px] font-bold flex items-center justify-center`}>
                  {m.health}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Context strip ───────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {member.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
              <span className="text-xs text-gray-500">{member.revenue}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${healthColor(member.health)}`}>
                {member.health}
              </span>
            </div>
            <div className="text-xs text-gray-500 truncate">{member.archetype} &middot; {member.signal}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 hover:border-gray-300"
          >
            {sidebarOpen ? 'Hide' : 'Profile'}
          </button>
          {messages.length > 0 && (
            <button onClick={clearChat} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Main area (chat + optional sidebar) ─────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
                <div className={`w-16 h-16 rounded-full ${member.color} bg-opacity-20 flex items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center text-white text-lg font-bold`}>
                    {member.initials}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 text-sm font-medium">Chatting as {member.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{member.archetype} &middot; Health {member.health} &middot; {member.revenue}</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  {member.suggestions.map(msg => (
                    <button
                      key={msg}
                      onClick={() => send(msg)}
                      className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
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
                      : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                  }`}
                >
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

          {/* Suggestion chips when conversation is active */}
          {messages.length > 0 && !loading && (
            <div className="flex-shrink-0 px-3 pb-1 flex gap-2 overflow-x-auto">
              {member.suggestions
                .filter(msg => !messages.some(m => m.text === msg))
                .slice(0, 3)
                .map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => send(msg)}
                    className="whitespace-nowrap text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-3 py-1.5 transition-colors flex-shrink-0"
                  >
                    {msg}
                  </button>
                ))}
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-2 flex items-end gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message as ${member.name.split(' ')[0]}...`}
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

          {/* Powered by badge */}
          <div className="flex-shrink-0 bg-white text-center py-1.5">
            <span className="text-[10px] text-gray-400 tracking-wide">Powered by <span className="font-semibold text-gray-500">Swoop AI</span></span>
          </div>
        </div>

        {/* ── Collapsible sidebar ─────────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Member Profile</h3>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${member.color} flex items-center justify-center text-white font-bold`}>
                {member.initials}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{member.name}</div>
                <div className="text-xs text-gray-500">{member.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ProfileStat label="Health Score" value={member.health} badge={healthColor(member.health)} />
              <ProfileStat label="Revenue" value={member.revenue} />
              <ProfileStat label="Archetype" value={member.archetype} />
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Risk Signal</div>
              <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{member.signal}</div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Suggested Messages</div>
              <div className="space-y-1.5">
                {member.suggestions.map(msg => (
                  <button
                    key={msg}
                    onClick={() => { send(msg); setSidebarOpen(false); }}
                    className="w-full text-left text-xs bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 text-gray-700 transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStat({ label, value, badge }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="flex items-center gap-1.5 mt-0.5">
        {badge && <span className={`w-2.5 h-2.5 rounded-full ${badge}`} />}
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
