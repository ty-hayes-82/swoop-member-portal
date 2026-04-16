/**
 * SMS Chat Simulator — dev tool for testing the AI agent without Twilio.
 * - Visual persona rail for quick member switching
 * - Tool call inspector showing every tool the agent invoked
 * - Live agent activity feed with one-click "chat as [member]" pivots
 * - Human-in-the-loop inbox: approve/dismiss pending agent_actions inline
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ── Member profiles available for testing ────────────────────────────────────
const TEST_MEMBERS = [
  { id: 'mbr_t01', name: 'James Whitfield',  first: 'James',  type: 'Full Golf',  status: 'active',    statusColor: 'bg-emerald-100 text-emerald-700' },
  { id: 'mbr_t04', name: 'Anne Jordan',      first: 'Anne',   type: 'Full Golf',  status: 'at-risk',   statusColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'mbr_t05', name: 'Robert Callahan',  first: 'Robert', type: 'Corporate',  status: 'declining', statusColor: 'bg-orange-100 text-orange-700' },
  { id: 'mbr_t06', name: 'Sandra Chen',      first: 'Sandra', type: 'Social',     status: 'at-risk',   statusColor: 'bg-yellow-100 text-yellow-700' },
  { id: 'mbr_t07', name: 'Linda Leonard',    first: 'Linda',  type: 'Full Golf',  status: 'ghost',     statusColor: 'bg-red-100 text-red-700' },
];

const MEMBER_BY_ID = Object.fromEntries(TEST_MEMBERS.map(m => [m.id, m]));

// ── Quick-send scenarios per member ──────────────────────────────────────────
const QUICK_MESSAGES = {
  mbr_t01: [
    'Book my usual Saturday 7 AM with the guys',
    'Get Erin on the wine dinner list',
    'My lunch took 45 minutes and no one apologized',
    "What's happening at the club this weekend?",
  ],
  mbr_t04: [
    'Book a Saturday morning tee time for me and Marcus',
    "What's on the calendar this month?",
    "I've been having trouble getting a Saturday spot — can you help?",
    'Cancel my upcoming tee time',
  ],
  mbr_t05: [
    'I want to make a dining reservation for Friday',
    'What events are coming up?',
    'I have an unresolved billing complaint — what is the status?',
    'Book a weekday morning tee time',
  ],
  mbr_t06: [
    'What social events are coming up?',
    'RSVP me for the wine dinner',
    'Book dinner for Saturday night',
    "I haven't been receiving event invitations lately",
  ],
  mbr_t07: [
    "What's happening at the club this month?",
    'I want to come in for the wine dinner — can you add me?',
    "It's been a while — what have I missed?",
    'Are there any social events I should know about?',
  ],
};

// ── Tool colour map ───────────────────────────────────────────────────────────
const TOOL_COLORS = {
  book_tee_time:           { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '⛳' },
  cancel_tee_time:         { bg: 'bg-red-50',    text: 'text-red-700',    icon: '❌' },
  make_dining_reservation: { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: '🍽️' },
  get_club_calendar:       { bg: 'bg-purple-50', text: 'text-purple-700', icon: '📅' },
  get_my_schedule:         { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🗓️' },
  rsvp_event:              { bg: 'bg-green-50',  text: 'text-green-700',  icon: '✅' },
  file_complaint:          { bg: 'bg-orange-50', text: 'text-orange-700', icon: '📝' },
  get_member_profile:      { bg: 'bg-swoop-row',   text: 'text-swoop-text-2',   icon: '👤' },
  send_request_to_club:    { bg: 'bg-teal-50',   text: 'text-teal-700',   icon: '📨' },
};
function toolColor(name) {
  return TOOL_COLORS[name] || { bg: 'bg-swoop-row', text: 'text-swoop-text-2', icon: '🔧' };
}

const PRIORITY_COLORS = {
  high:   { pill: 'bg-red-100 text-red-700',    border: 'border-l-red-500'    },
  medium: { pill: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500' },
  low:    { pill: 'bg-swoop-row text-swoop-text-muted',   border: 'border-l-gray-400'  },
};
function priColor(p) { return PRIORITY_COLORS[p] || PRIORITY_COLORS.low; }

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

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── PersonaRail ───────────────────────────────────────────────────────────────
function PersonaRail({ selected, onSelect }) {
  return (
    <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {TEST_MEMBERS.map(m => {
        const active = m.id === selected;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer text-left min-w-[96px]
              ${active
                ? 'bg-brand-50 border-brand-500 shadow-md ring-2 ring-brand-200'
                : 'bg-swoop-panel border-swoop-border hover:border-swoop-border hover:shadow-sm'
              }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
              ${active ? 'bg-brand-500 text-white shadow-sm' : 'bg-swoop-row text-swoop-text-muted'}`}>
              {initials(m.name)}
            </div>
            <div className="text-center">
              <p className={`text-[11px] font-semibold leading-tight whitespace-nowrap ${active ? 'text-brand-700' : 'text-swoop-text-2'}`}>
                {m.first}
              </p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full mt-0.5 ${m.statusColor}`}>
                {m.status}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── ToolCallEntry ─────────────────────────────────────────────────────────────
function ToolCallEntry({ call, autoExpand = false }) {
  const [expanded, setExpanded] = useState(autoExpand);
  const c = toolColor(call.name);
  return (
    <div className="rounded-lg border border-swoop-border overflow-hidden text-xs mb-2">
      <button
        onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 ${c.bg} hover:brightness-95 transition-all text-left`}
      >
        <span className="text-base leading-none">{c.icon}</span>
        <span className={`font-semibold font-mono ${c.text} truncate flex-1`}>{call.name}</span>
        <span className="text-swoop-text-label text-[10px] ml-auto flex-shrink-0">
          {call.ts ? new Date(call.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}
        </span>
        <svg className={`w-3.5 h-3.5 text-swoop-text-label flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {expanded && (
        <div className="px-3 py-2 space-y-2 bg-swoop-panel border-t border-swoop-border-inset">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-swoop-text-label font-semibold mb-1">Input</p>
            <pre className="text-[11px] text-swoop-text-2 whitespace-pre-wrap font-mono leading-relaxed bg-swoop-row rounded p-2 overflow-x-auto max-h-32 overflow-y-auto">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-swoop-text-label font-semibold mb-1">Result</p>
            <pre className="text-[11px] text-swoop-text-2 whitespace-pre-wrap font-mono leading-relaxed bg-swoop-row rounded p-2 overflow-x-auto max-h-48 overflow-y-auto">
              {JSON.stringify(call.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agent ID → display label ──────────────────────────────────────────────────
function agentLabel(agentId) {
  const labels = {
    agt_retention: 'Retention', agt_teesheet: 'Tee Sheet', agt_concierge: 'Concierge',
    agt_revenue: 'Revenue', agt_staffing: 'Staffing', agt_complaint: 'Complaint',
    agt_cos: 'Chief of Staff', member_pulse: 'Member Pulse', demand_optimizer: 'Demand Optimizer',
    service_recovery: 'Service Recovery', revenue_analyst: 'Revenue Analyst',
  };
  return labels[agentId] || agentId;
}

function agentDot(agentId) {
  const dots = {
    agt_retention: 'bg-red-500', agt_teesheet: 'bg-blue-500', agt_concierge: 'bg-purple-500',
    agt_revenue: 'bg-green-500', agt_staffing: 'bg-amber-500', agt_complaint: 'bg-orange-500',
    agt_cos: 'bg-indigo-500', member_pulse: 'bg-pink-500', demand_optimizer: 'bg-cyan-500',
    service_recovery: 'bg-orange-500', revenue_analyst: 'bg-emerald-500',
  };
  return dots[agentId] || 'bg-gray-400';
}

// ── LiveActivityFeed ──────────────────────────────────────────────────────────
function LiveActivityFeed({ onSwitchMember }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState(null);

  const fetchEvents = useCallback(async () => {
    const clubId = getClubId();
    if (!clubId) { setLoading(false); return; }
    try {
      const url = agentFilter
        ? `/api/agent-activity?club_id=${clubId}&limit=30&agent_id=${agentFilter}`
        : `/api/agent-activity?club_id=${clubId}&limit=30`;
      const result = await apiFetch(url);
      if (result?.activity) setEvents(result.activity);
    } catch (_) {}
    setLoading(false);
  }, [agentFilter]);

  useEffect(() => {
    fetchEvents();
    const t = setInterval(fetchEvents, 5000);
    return () => clearInterval(t);
  }, [fetchEvents]);

  // Derive unique agents from events for the filter strip
  const seenAgents = [...new Set(events.map(e => e.agent_id).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-swoop-border border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Agent filter chips */}
      {seenAgents.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setAgentFilter(null)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
              agentFilter === null
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-swoop-panel text-swoop-text-muted border-swoop-border hover:border-swoop-border'
            }`}
          >
            All
          </button>
          {seenAgents.map(id => (
            <button
              key={id}
              onClick={() => setAgentFilter(agentFilter === id ? null : id)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                agentFilter === id
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-swoop-panel text-swoop-text-muted border-swoop-border hover:border-swoop-border'
              }`}
            >
              {agentLabel(id)}
            </button>
          ))}
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="w-10 h-10 rounded-full bg-swoop-row flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-swoop-text-ghost" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-xs text-swoop-text-label">No agent activity yet.</p>
          <p className="text-[11px] text-swoop-text-ghost mt-1">Import data and activate agents to see events here.</p>
        </div>
      ) : (
        <div className="divide-y divide-swoop-border-inset">
          {events.map(ev => {
            const dot = agentDot(ev.agent_id);
            const matchedMember = ev.member_id ? MEMBER_BY_ID[ev.member_id] : null;
            return (
              <div key={ev.activity_id} className="flex items-start gap-2.5 py-2.5 px-1">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-swoop-text-muted uppercase tracking-wide">{agentLabel(ev.agent_id)}</span>
                    <span className="ml-auto text-[10px] text-swoop-text-ghost flex-shrink-0">{relativeTime(ev.created_at)}</span>
                  </div>
                  <p className="text-xs text-swoop-text-2 leading-snug mt-0.5 line-clamp-2">
                    {ev.description || ev.action_type}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {ev.member_name && (
                      <span className="text-[10px] text-swoop-text-label">{ev.member_name}</span>
                    )}
                    {matchedMember && onSwitchMember && (
                      <button
                        onClick={() => onSwitchMember(matchedMember.id)}
                        className="text-[10px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full px-2 py-0.5 transition-colors border-none cursor-pointer"
                      >
                        ↩ Chat as {matchedMember.first}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── useAgentInbox ─────────────────────────────────────────────────────────────
function useAgentInbox() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    const clubId = getClubId();
    if (!clubId) { setLoading(false); return; }
    try {
      const result = await apiFetch(`/api/agents?club_id=${clubId}`);
      if (result?.actions) {
        const pendingActions = result.actions
          .filter(a => a.status === 'pending')
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
          });
        setPending(pendingActions);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInbox();
    const t = setInterval(fetchInbox, 10000);
    return () => clearInterval(t);
  }, [fetchInbox]);

  const respondToAction = useCallback(async (actionId, operation, meta = {}) => {
    // Optimistic removal
    setPending(prev => prev.filter(a => a.id !== actionId));
    try {
      await apiFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, operation, meta }),
      });
    } catch (_) {}
    // Re-fetch after a short delay to sync server state
    setTimeout(fetchInbox, 1500);
  }, [fetchInbox]);

  const approve = useCallback((actionId, note) =>
    respondToAction(actionId, 'approve', { approvalAction: note || undefined }), [respondToAction]);

  const dismiss = useCallback((actionId, reason) =>
    respondToAction(actionId, 'dismiss', { reason: reason || undefined }), [respondToAction]);

  return { pending, loading, approve, dismiss, refresh: fetchInbox };
}

// ── AgentInboxPanel ───────────────────────────────────────────────────────────
function AgentInboxPanel({ pending, loading, approve, dismiss, onSwitchMember }) {
  const [expanded, setExpanded] = useState(null); // actionId whose note field is open
  const [noteText, setNoteText] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-5 h-5 border-2 border-swoop-border border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center px-4">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-swoop-text-muted">No pending actions</p>
        <p className="text-[11px] text-swoop-text-label mt-1">Agents are running on autopilot right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-swoop-text-label font-semibold mb-1">
        {pending.length} awaiting review
      </p>
      {pending.map(action => {
        const pc = priColor(action.priority);
        const matchedMember = action.memberId ? MEMBER_BY_ID[action.memberId] : null;
        const isOpen = expanded === action.id;
        return (
          <div
            key={action.id}
            className={`rounded-xl border-l-4 border border-swoop-border bg-swoop-panel overflow-hidden ${pc.border}`}
          >
            <div className="px-3 py-2.5">
              {/* Header row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${pc.pill}`}>
                  {action.priority}
                </span>
                {action.source && (
                  <span className="text-[10px] font-semibold text-swoop-text-muted">
                    {action.source}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-swoop-text leading-snug">
                {action.description}
              </p>

              {/* Impact metric */}
              {action.impactMetric && (
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{action.impactMetric}</p>
              )}

              {/* Member row */}
              {(action.memberName || matchedMember) && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-swoop-text-label">{action.memberName}</span>
                  {matchedMember && onSwitchMember && (
                    <button
                      onClick={() => onSwitchMember(matchedMember.id)}
                      className="text-[10px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-full px-2 py-0.5 transition-colors border-none cursor-pointer"
                    >
                      ↩ Chat as {matchedMember.first}
                    </button>
                  )}
                </div>
              )}

              {/* Note/reason input (shown when action is expanded) */}
              {isOpen && (
                <input
                  type="text"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note (optional)…"
                  className="mt-2 w-full text-xs border border-swoop-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-swoop-panel"
                  autoFocus
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-1.5 mt-2">
                {!isOpen ? (
                  <>
                    <button
                      onClick={() => { setExpanded(action.id); setNoteText(''); }}
                      className="flex-1 text-[11px] font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-2 py-1.5 border-none cursor-pointer transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => { setExpanded(`dismiss-${action.id}`); setNoteText(''); }}
                      className="flex-1 text-[11px] font-semibold bg-swoop-row hover:bg-gray-200 text-swoop-text-muted rounded-lg px-2 py-1.5 border-none cursor-pointer transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                ) : expanded === action.id ? (
                  <>
                    <button
                      onClick={() => { approve(action.id, noteText); setExpanded(null); }}
                      className="flex-1 text-[11px] font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-2 py-1.5 border-none cursor-pointer transition-colors"
                    >
                      ✓ Confirm approve
                    </button>
                    <button
                      onClick={() => setExpanded(null)}
                      className="text-[11px] text-swoop-text-label hover:text-gray-600 px-2 py-1.5 border-none cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { dismiss(action.id, noteText); setExpanded(null); }}
                      className="flex-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-2 py-1.5 border-none cursor-pointer transition-colors"
                    >
                      ✕ Confirm dismiss
                    </button>
                    <button
                      onClick={() => setExpanded(null)}
                      className="text-[11px] text-swoop-text-label hover:text-gray-600 px-2 py-1.5 border-none cursor-pointer bg-transparent"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SMSChatSimulatorPage({ embedded = false }) {
  const [selectedMemberId, setSelectedMemberId] = useState('mbr_t01');
  const [messages, setMessages] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rightTab, setRightTab] = useState('tools');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Single hook instance shared between the badge and AgentInboxPanel
  const { pending: pendingActions, loading: inboxLoading, approve: inboxApprove, dismiss: inboxDismiss } = useAgentInbox();

  const selectedMember = MEMBER_BY_ID[selectedMemberId] || TEST_MEMBERS[0];
  const quickMessages = QUICK_MESSAGES[selectedMemberId] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function handleMemberChange(memberId) {
    setSelectedMemberId(memberId);
    setMessages([]);
    setToolCalls([]);
    setInput('');
  }

  // Called from right-panel pivots — also switches the tab back to chat context
  function switchToMember(memberId) {
    handleMemberChange(memberId);
    // Briefly flash the tool calls tab to draw attention to the switch
    setRightTab('tools');
  }

  async function send(text) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim(), time: timestamp() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ member_id: selectedMemberId, message: text.trim(), debug: true }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.response || data.error || 'No response',
        time: timestamp(),
        simulated: data.simulated,
      }]);

      if (data.tool_calls?.length) {
        setToolCalls(prev => [...prev, ...data.tool_calls]);
        setRightTab('tools');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Page header — hidden when embedded in a tab */}
      {!embedded && (
        <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold m-0 text-swoop-text">AI Assistant Simulator</h1>
            <p className="text-sm text-swoop-text-muted mt-0.5 mb-0">
              Simulate inbound member messages and preview how Swoop AI would respond. Select a persona and send a test message.
            </p>
          </div>
        </div>
      )}

      {/* Persona rail */}
      <PersonaRail selected={selectedMemberId} onSelect={handleMemberChange} />

      {/* Main content: chat + debug panel */}
      <div
        className="flex gap-4 flex-1 min-h-0"
        style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
      >
        {/* LEFT: SMS chat */}
        <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-swoop-border bg-swoop-row overflow-hidden shadow-theme-xs">
          {/* Chat header */}
          <div className="flex-shrink-0 bg-swoop-panel border-b border-swoop-border px-4 py-2.5 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
              selectedMemberId === 'mbr_t01' ? 'bg-brand-500' : 'bg-gray-500'
            } text-white`}>
              {initials(selectedMember.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-swoop-text leading-tight">{selectedMember.name}</p>
              <p className="text-[11px] text-swoop-text-muted">{selectedMember.type}</p>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${selectedMember.statusColor}`}>
              {selectedMember.status}
            </span>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setToolCalls([]); }}
                className="text-xs text-swoop-text-label hover:text-red-500 transition-colors px-2 py-1 flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {isEmpty && (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-swoop-panel flex items-center justify-center shadow-sm">
                  <span className="text-xl">💬</span>
                </div>
                <p className="text-sm text-swoop-text-muted">
                  Simulate a message from <strong>{selectedMember.first}</strong>
                </p>
                <div className="flex flex-col gap-1.5 w-full max-w-xs">
                  {quickMessages.map(msg => (
                    <button
                      key={msg}
                      onClick={() => send(msg)}
                      className="text-left text-xs bg-swoop-panel border border-swoop-border rounded-xl px-3 py-2.5 text-swoop-text-2 hover:bg-swoop-row-hover active:bg-gray-100 transition-colors shadow-sm"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  msg.role === 'user'
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-swoop-panel text-swoop-text rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className={`flex items-center gap-1.5 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p className={`text-[10px] ${msg.role === 'user' ? 'text-green-100' : 'text-swoop-text-label'}`}>{msg.time}</p>
                    {msg.simulated && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-600 font-semibold uppercase">sim</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-swoop-panel rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-swoop-text-label">Agent is thinking</span>
                    <span className="flex gap-0.5 ml-1">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-swoop-border rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips (active conversation) */}
          {messages.length > 0 && !loading && (
            <div className="flex-shrink-0 px-3 pb-1 flex gap-1.5 overflow-x-auto">
              {quickMessages.filter(m => !messages.some(msg => msg.text === m)).slice(0, 3).map((msg, i) => (
                <button
                  key={i}
                  onClick={() => send(msg)}
                  className="whitespace-nowrap text-[11px] bg-swoop-panel border border-swoop-border hover:bg-swoop-row-hover text-swoop-text-muted rounded-full px-3 py-1.5 transition-colors flex-shrink-0 shadow-sm"
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex-shrink-0 bg-swoop-panel border-t border-swoop-border px-3 py-2 flex items-end gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message as ${selectedMember.first}…`}
              disabled={loading}
              className="flex-1 rounded-full border border-swoop-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50"
              autoComplete="off"
              data-testid="sms-message-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-green-600 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
        </div>

        {/* RIGHT: Debug panel */}
        <div className="flex flex-col w-[400px] flex-shrink-0 rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden shadow-theme-xs">
          {/* Tabs */}
          <div className="flex-shrink-0 flex border-b border-swoop-border">
            {[
              {
                key: 'tools',
                label: 'Tool Calls',
                badge: toolCalls.length || null,
                icon: (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                ),
              },
              {
                key: 'activity',
                label: 'Live Feed',
                badge: null,
                icon: (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                ),
              },
              {
                key: 'inbox',
                label: 'Agent Inbox',
                badge: pendingActions.length || null,
                icon: (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                ),
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  rightTab === tab.key
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-swoop-text-muted hover:text-swoop-text-2'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className={`min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full text-[9px] font-bold px-1 ${
                    tab.key === 'inbox' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === 'tools' && (
              <>
                {toolCalls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="w-10 h-10 rounded-full bg-swoop-row flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-swoop-text-ghost" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-swoop-text-label">No tool calls yet.</p>
                    <p className="text-[11px] text-swoop-text-ghost mt-1">Tool calls appear here as the agent uses them.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-swoop-text-label font-semibold">
                        {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''} this session
                      </p>
                      <button
                        onClick={() => setToolCalls([])}
                        className="text-[10px] text-swoop-text-label hover:text-red-500 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    {toolCalls.map((call, i) => (
                      <ToolCallEntry key={i} call={call} autoExpand={i === toolCalls.length - 1} />
                    ))}
                  </div>
                )}
              </>
            )}

            {rightTab === 'activity' && (
              <LiveActivityFeed onSwitchMember={switchToMember} />
            )}

            {rightTab === 'inbox' && (
              <AgentInboxPanel pending={pendingActions} loading={inboxLoading} approve={inboxApprove} dismiss={inboxDismiss} onSwitchMember={switchToMember} />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-swoop-border-inset px-3 py-2 text-center">
            <span className="text-[10px] text-swoop-text-ghost">Swoop AI · Member Concierge</span>
          </div>
        </div>
      </div>
    </div>
  );
}
