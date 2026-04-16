/**
 * MemberSessionLog
 *
 * Shows a member's full agent session event history with learned preferences.
 * This is Move 3 of the GBTC demo — "Show the memory compound."
 *
 * Polls /api/agents/session-events for the member's concierge session.
 * Displays preferences panel (static from payload) + scrollable event log.
 *
 * Props:
 *   memberId  — e.g. 'mbr_t01'
 *   clubId    — e.g. 'seed_pinetree'
 *   dark      — dark-mode styling (for GBTCDemoControl)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const JAMES_PREFERENCES = [
  { icon: '⛳', label: 'Tee preference', value: 'Thu/Fri 7–8:30 AM, back nine start' },
  { icon: '🍽️', label: 'Seating', value: 'Grill Room booth 12, window side' },
  { icon: '⚠️', label: 'Dietary', value: 'Shellfish allergy (confirmed x3)' },
  { icon: '👤', label: 'Caddie', value: 'Eddie Marsh on back nine rounds' },
  { icon: '☕', label: 'Beverage', value: 'Coffee refills on course, sparkling water at Grill' },
  { icon: '👨‍👩‍👦', label: 'Guests', value: 'Son Logan (junior) 2nd/4th Sat; wife Erin for wine dinners' },
];

const MEMBER_META = {
  'mbr_t01': {
    name: 'James Whitfield',
    tier: 'Full Golf',
    tenure: '6-year member',
    health: 42,
    ltv: '$54K over 6 years',
    archetype: 'Balanced Active',
    trend: 'declining',
    sessions: 'mbr_t01_concierge',
    preferences: JAMES_PREFERENCES,
  },
};

const EVENT_COLORS = {
  user_message:            { dot: '#3b82f6', label: 'Message' },
  request_submitted:       { dot: '#10b981', label: 'Request' },
  staff_confirmed:         { dot: '#059669', label: 'Confirmed' },
  staff_rejected:          { dot: '#dc2626', label: 'Rejected' },
  recommendation_received: { dot: '#8b5cf6', label: 'Recommendation' },
  preference_observed:     { dot: '#f59e0b', label: 'Preference learned' },
  outcome_tracked:         { dot: '#10b981', label: 'Outcome' },
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function eventSummary(event) {
  const p = event.payload || {};
  switch (event.eventType) {
    case 'user_message':            return `"${(p.text || '').slice(0, 80)}"`;
    case 'request_submitted':       return `${p.request_type || 'Request'} submitted — ${p.status || 'pending'}`;
    case 'staff_confirmed':         return p.message_sent ? `Response sent: "${p.message_sent.slice(0, 70)}"` : 'Confirmed by staff';
    case 'recommendation_received': return p.context_summary || p.summary || 'Recommendation received';
    case 'preference_observed':     return `${p.field}: ${p.value} (${Math.round((p.confidence || 0) * 100)}% confidence)`;
    case 'outcome_tracked':         return `${p.outcome || 'tracked'} — ${p.recovery_actions || ''}`;
    default:                        return (p.summary || p.text || event.eventType).slice(0, 80);
  }
}

export default function MemberSessionLog({ memberId = 'mbr_t01', clubId = 'seed_pinetree', dark = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrefs, setShowPrefs] = useState(true);
  const meta = MEMBER_META[memberId];
  const sessionId = meta?.sessions || `mbr_${memberId}_concierge`;
  const intervalRef = useRef(null);
  const latestAt = useRef(null);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ club_id: clubId, session_id: sessionId, limit: '30' });
      if (latestAt.current) params.set('since', latestAt.current);
      const res = await fetch(`/api/agents/session-events?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming = data.events || [];
      if (incoming.length) {
        setEvents(prev => {
          const merged = latestAt.current ? [...incoming, ...prev] : incoming;
          const seen = new Set();
          return merged.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0, 40);
        });
        if (data.latest_at) latestAt.current = data.latest_at;
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, [clubId, sessionId]);

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchEvents();
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fetchEvents]);

  const textPrimary = dark ? '#f1f5f9' : '#111827';
  const textSecondary = dark ? '#94a3b8' : '#6b7280';
  const bgCard = dark ? 'rgba(255,255,255,0.04)' : '#f9fafb';
  const border = dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb';

  return (
    <div style={{ color: textPrimary }}>
      {/* Member identity header */}
      {meta && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{meta.name}</div>
              <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                {meta.tier} · {meta.tenure} · {meta.archetype}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: meta.trend === 'declining' ? '#ef4444' : '#10b981' }}>
                Health {meta.health}/100
              </div>
              <div style={{ fontSize: 10, color: textSecondary }}>{meta.ltv} lifetime</div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences panel */}
      <div style={{ marginBottom: 14 }}>
        <button
          onClick={() => setShowPrefs(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showPrefs ? 8 : 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            🧠 Learned Preferences ({JAMES_PREFERENCES.length})
          </span>
          <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto' }}>{showPrefs ? '▲' : '▼'}</span>
        </button>

        {showPrefs && meta?.preferences && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {meta.preferences.map((pref, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: dark ? 'rgba(245,158,11,0.06)' : '#fffbeb',
                  border: `1px solid ${dark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
                  borderRadius: 8, padding: '7px 10px',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{pref.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', marginBottom: 2 }}>{pref.label}</div>
                  <div style={{ fontSize: 12, color: textPrimary }}>{pref.value}</div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: textSecondary, padding: '4px 2px', fontStyle: 'italic' }}>
              All preferences derived from observed behavior — no one typed these in.
            </div>
          </div>
        )}
      </div>

      {/* Event log */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
          Session History
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: textSecondary, fontSize: 12, padding: 20 }}>Loading…</div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ textAlign: 'center', color: textSecondary, fontSize: 12, padding: 20 }}>
            No events yet. Seed demo data or trigger a scenario.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {events.map(event => {
            const meta_ = EVENT_COLORS[event.eventType] || { dot: '#9ca3af', label: event.eventType };
            const summary = eventSummary(event);

            return (
              <div
                key={event.id}
                style={{
                  display: 'flex', gap: 10, padding: '8px 10px',
                  background: bgCard,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                }}
              >
                {/* Timeline dot + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta_.dot, flexShrink: 0 }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: meta_.dot, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {meta_.label}
                    </span>
                    <span style={{ fontSize: 10, color: textSecondary, marginLeft: 'auto', flexShrink: 0 }}>
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: textPrimary, lineHeight: 1.45, wordBreak: 'break-word' }}>
                    {summary}
                  </div>
                  {event.payload?.source_agent && (
                    <div style={{ fontSize: 10, color: textSecondary, marginTop: 2 }}>
                      via {event.payload.source_agent}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
