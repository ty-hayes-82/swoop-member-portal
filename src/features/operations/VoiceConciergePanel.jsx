/**
 * VoiceConciergePanel — Gemini 2.5 Flash Live voice concierge.
 *
 * Members push a button to talk with their personalized concierge AI.
 * The voice session uses the same tool declarations as the SMS concierge,
 * so all bookings, reservations, and club requests work identically.
 * Auto check-in scaffolding is included for the future mobile app.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { buildConciergePrompt } from '@/config/conciergePrompt';

// TEST_MEMBERS mirrored from SMSChatSimulatorPage for persona parity
const TEST_MEMBERS = [
  { id: 'mbr_t01', name: 'James Whitfield', first: 'James', type: 'Full Golf',  status: 'active',    statusColor: 'bg-emerald-100 text-emerald-700', membership_type: 'Full Golf' },
  { id: 'mbr_t04', name: 'Anne Jordan',     first: 'Anne',  type: 'Full Golf',  status: 'at-risk',   statusColor: 'bg-yellow-100 text-yellow-700',  membership_type: 'Full Golf' },
  { id: 'mbr_t05', name: 'Robert Callahan', first: 'Robert',type: 'Corporate',  status: 'declining', statusColor: 'bg-orange-100 text-orange-700',  membership_type: 'Corporate' },
  { id: 'mbr_t06', name: 'Sandra Chen',     first: 'Sandra',type: 'Social',     status: 'at-risk',   statusColor: 'bg-yellow-100 text-yellow-700',  membership_type: 'Social' },
  { id: 'mbr_t07', name: 'Linda Leonard',   first: 'Linda', type: 'Full Golf',  status: 'ghost',     statusColor: 'bg-red-100 text-red-700',        membership_type: 'Full Golf' },
];

const TOOL_ICONS = {
  book_tee_time: '⛳',
  cancel_tee_time: '❌',
  make_dining_reservation: '🍽',
  get_club_calendar: '📅',
  get_my_schedule: '🗓',
  rsvp_event: '✅',
  file_complaint: '📝',
  get_member_profile: '👤',
  send_request_to_club: '📨',
};

function initials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// Animated waveform bars shown when voice is active
function Waveform({ active }) {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${active ? 'bg-brand-400' : 'bg-swoop-border'}`}
          style={{
            height: active ? `${Math.random() * 24 + 8}px` : '6px',
            animation: active ? `wave ${0.5 + (i % 4) * 0.15}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { height: 6px; }
          to   { height: ${Math.floor(Math.random() * 20 + 12)}px; }
        }
      `}</style>
    </div>
  );
}

export default function VoiceConciergePanel() {
  const [selectedId, setSelectedId] = useState('mbr_t01');
  const [transcript, setTranscript] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const bottomRef = useRef(null);

  const selectedMember = TEST_MEMBERS.find(m => m.id === selectedId) || TEST_MEMBERS[0];

  const systemPrompt = buildConciergePrompt(
    { name: selectedMember.name, membership_type: selectedMember.membership_type },
    'River Glen Country Club'
  );

  const handleTranscript = useCallback((entry) => {
    setTranscript(prev => [...prev, { ...entry, ts: new Date().toISOString() }]);
  }, []);

  const handleToolCall = useCallback((call) => {
    setToolCalls(prev => [{ ...call, ts: new Date().toISOString(), id: Date.now() }, ...prev]);
  }, []);

  const { status, error, start, stop } = useGeminiLive({
    systemPrompt,
    memberName: selectedMember.first,
    onTranscript: handleTranscript,
    onToolCall: handleToolCall,
  });

  const isActive = status === 'active';
  const isConnecting = status === 'connecting';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  function handleMemberSwitch(id) {
    if (isActive) stop();
    setSelectedId(id);
    setTranscript([]);
    setToolCalls([]);
  }

  function handleToggle() {
    if (isActive || isConnecting) {
      stop();
    } else {
      setTranscript([]);
      setToolCalls([]);
      start();
    }
  }

  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {/* Member persona rail */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0">
        {TEST_MEMBERS.map(m => {
          const active = m.id === selectedId;
          return (
            <button
              key={m.id}
              onClick={() => handleMemberSwitch(m.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 transition-all cursor-pointer text-left min-w-[96px]
                ${active
                  ? 'bg-brand-50 border-brand-500 shadow-md ring-2 ring-brand-200'
                  : 'bg-swoop-panel border-swoop-border hover:shadow-sm'
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

      {/* No API key warning */}
      {!hasApiKey && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-warning-500/10 border border-warning-500/25">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="text-[13px] font-semibold text-warning-400">VITE_GEMINI_API_KEY not set</p>
            <p className="text-[12px] text-swoop-text-muted mt-0.5">
              Add <code className="bg-swoop-row px-1 py-0.5 rounded text-[11px]">VITE_GEMINI_API_KEY=your_key</code> to{' '}
              <code className="bg-swoop-row px-1 py-0.5 rounded text-[11px]">.env.local</code> and restart the dev server.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 340px)', minHeight: '420px' }}>
        {/* LEFT: voice interface */}
        <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-swoop-border bg-swoop-row overflow-hidden shadow-theme-xs">
          {/* Header */}
          <div className="flex-shrink-0 bg-swoop-panel border-b border-swoop-border px-4 py-2.5 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0
              ${isActive ? 'bg-brand-500 text-white shadow-sm animate-pulse' : 'bg-swoop-row text-swoop-text-muted'}`}>
              {initials(selectedMember.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-swoop-text leading-tight">{selectedMember.name}</p>
              <p className="text-[11px] text-swoop-text-muted">{selectedMember.type}</p>
            </div>
            <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0 ${
              isActive ? 'bg-emerald-500/20 text-emerald-400' :
              isConnecting ? 'bg-brand-500/20 text-brand-400 animate-pulse' :
              'bg-swoop-row text-swoop-text-label'
            }`}>
              {isActive ? 'Live' : isConnecting ? 'Connecting...' : 'Ready'}
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {transcript.length === 0 && !isActive && !isConnecting && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-swoop-panel border border-swoop-border flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🎙</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-swoop-text">Voice Concierge</p>
                  <p className="text-xs text-swoop-text-muted mt-1">
                    Press the button below to start a live voice session as <strong>{selectedMember.first}</strong>
                  </p>
                  <p className="text-[11px] text-swoop-text-label mt-2">
                    Powered by Gemini 3.1 Flash Live
                  </p>
                </div>
              </div>
            )}

            {transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                  entry.role === 'user'
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-swoop-panel text-swoop-text rounded-bl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                  <p className={`text-[10px] mt-1 ${entry.role === 'user' ? 'text-green-100 text-right' : 'text-swoop-text-label'}`}>
                    {relTime(entry.ts)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Push-to-talk button */}
          <div className="flex-shrink-0 bg-swoop-panel border-t border-swoop-border px-4 py-3 flex flex-col items-center gap-3">
            <Waveform active={isActive} />

            <button
              onClick={handleToggle}
              disabled={!hasApiKey || isConnecting}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-none shadow-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                ${isActive
                  ? 'bg-red-500 hover:bg-red-600 scale-105 ring-4 ring-red-500/30'
                  : isConnecting
                  ? 'bg-brand-400 animate-pulse'
                  : 'bg-brand-500 hover:bg-brand-600 hover:scale-105'
                }`}
            >
              {isActive ? '⏹' : isConnecting ? '⏳' : '🎙'}
            </button>

            <p className="text-[11px] text-swoop-text-muted">
              {isActive ? 'Tap to end session' : isConnecting ? 'Connecting to Gemini Live...' : 'Tap to start voice session'}
            </p>

            {error && (
              <p className="text-[11px] text-red-400 text-center px-2">{error}</p>
            )}
          </div>
        </div>

        {/* RIGHT: tool call log */}
        <div className="w-64 flex-shrink-0 flex flex-col rounded-xl border border-swoop-border bg-swoop-row overflow-hidden shadow-theme-xs">
          <div className="flex-shrink-0 bg-swoop-panel border-b border-swoop-border px-3 py-2.5">
            <p className="text-xs font-semibold text-swoop-text">Tool Calls</p>
            <p className="text-[10px] text-swoop-text-muted">Agent actions this session</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {toolCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                <span className="text-2xl opacity-30">🔧</span>
                <p className="text-[11px] text-swoop-text-label">Tool calls appear here when the concierge takes action</p>
              </div>
            ) : (
              toolCalls.map((call) => (
                <div key={call.id} className="rounded-lg border border-swoop-border bg-swoop-panel p-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{TOOL_ICONS[call.name] || '🔧'}</span>
                    <span className="text-[11px] font-mono font-semibold text-swoop-text truncate flex-1">{call.name}</span>
                    <span className="text-[9px] text-swoop-text-label flex-shrink-0">{relTime(call.ts)}</span>
                  </div>
                  {call.args && Object.keys(call.args).length > 0 && (
                    <div className="text-[10px] text-swoop-text-muted font-mono bg-swoop-row rounded px-1.5 py-1 overflow-hidden">
                      {Object.entries(call.args).map(([k, v]) => (
                        <div key={k} className="truncate"><span className="text-swoop-text-label">{k}:</span> {String(v)}</div>
                      ))}
                    </div>
                  )}
                  {call.result?.success !== undefined && (
                    <div className={`mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-block ${
                      call.result.success ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}>
                      {call.result.success ? 'Success' : 'Failed'}
                      {call.result.confirmation ? ` · ${call.result.confirmation}` : ''}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Auto check-in info strip */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-swoop-panel border border-swoop-border">
        <span className="text-base">📍</span>
        <div>
          <span className="text-[11px] font-semibold text-swoop-text-2">Auto Check-in:</span>
          <span className="text-[11px] text-swoop-text-muted ml-1">
            Future mobile feature. When a member with location enabled arrives within the club geofence and has a tee time within 60 min, Swoop auto-checks them in and notifies the pro shop.
          </span>
        </div>
        <span className="ml-auto flex-shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-swoop-row text-swoop-text-label border border-swoop-border">
          Scaffolded
        </span>
      </div>
    </div>
  );
}
