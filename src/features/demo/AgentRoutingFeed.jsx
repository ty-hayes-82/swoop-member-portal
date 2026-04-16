/**
 * AgentRoutingFeed
 *
 * GBTC demo: live event stream showing agents routing signals across sessions
 * in real time. Polls /api/agents/session-events every 2s and animates
 * new events entering the feed.
 *
 * Used as the center panel of the GBTC demo — the "control tower" view.
 *
 * Props:
 *   clubId       — club to poll (default: 'seed_pinetree')
 *   maxItems     — max items shown (default: 12)
 *   compact      — condensed layout for mobile (default: false)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const CLUB_ID = 'seed_pinetree';

const SESSION_META = {
  'mbr_t01_concierge':              { label: 'James Whitfield', color: '#6366f1', icon: '👤', type: 'member' },
  'gm_sarah_mitchell_concierge':    { label: 'Sarah Mitchell (GM)', color: '#0ea5e9', icon: '⭐', type: 'gm' },
  'staff_maya_chen_fb_director':    { label: 'Maya Chen (F&B)', color: '#f59e0b', icon: '🍽️', type: 'staff' },
  'staff_head_pro_pinetree':        { label: 'Head Pro', color: '#10b981', icon: '⛳', type: 'staff' },
  'service_recovery_seed_pinetree': { label: 'Service Recovery', color: '#ef4444', icon: '🔧', type: 'analyst' },
  'member_pulse_seed_pinetree':     { label: 'Member Pulse', color: '#8b5cf6', icon: '📊', type: 'analyst' },
  'revenue_analyst_seed_pinetree':  { label: 'Revenue Analyst', color: '#059669', icon: '💰', type: 'analyst' },
};

const EVENT_TYPE_META = {
  user_message:            { label: 'Member message', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
  request_submitted:       { label: 'Request submitted', bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a' },
  staff_confirmed:         { label: 'Confirmed', bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a' },
  staff_rejected:          { label: 'Rejected', bg: '#fef2f2', border: '#fecaca', dot: '#dc2626' },
  recommendation_received: { label: 'Routed', bg: '#faf5ff', border: '#e9d5ff', dot: '#9333ea' },
  preference_observed:     { label: 'Preference learned', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' },
  outcome_tracked:         { label: 'Outcome tracked', bg: '#f0fdf4', border: '#bbf7d0', dot: '#059669' },
  agent_response:          { label: 'Agent replied', bg: '#f8fafc', border: '#e2e8f0', dot: '#64748b' },
};

function getPriority(payload) {
  if (payload?.priority === 'critical') return { label: 'CRITICAL', color: '#dc2626', bg: '#fef2f2' };
  if (payload?.priority === 'urgent')   return { label: 'URGENT', color: '#ea580c', bg: '#fff7ed' };
  if (payload?.priority === 'high')     return { label: 'HIGH', color: '#d97706', bg: '#fffbeb' };
  return null;
}

function formatTimeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function getEventLabel(event) {
  const p = event.payload || {};
  switch (event.eventType) {
    case 'user_message':            return (p.text || '').slice(0, 72);
    case 'recommendation_received': return p.context_summary || p.summary || p.recommendation?.slice?.(0, 72) || 'Recommendation received';
    case 'preference_observed':     return `${p.field || 'field'}: ${(p.value || '').slice(0, 50)}`;
    case 'request_submitted':       return `${p.request_type || 'Request'} — ${p.department || p.status || ''}`;
    case 'staff_confirmed':         return p.message_sent ? p.message_sent.slice(0, 72) : (p.summary || 'Confirmed');
    case 'outcome_tracked':         return `Outcome: ${p.outcome || ''} — ${(p.recovery_actions || p.description || '').slice(0, 50)}`;
    default:                        return (p.summary || p.text || event.eventType).slice(0, 72);
  }
}

export default function AgentRoutingFeed({ clubId = CLUB_ID, maxItems = 12, compact = false }) {
  const [events, setEvents] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [latestAt, setLatestAt] = useState(null);
  const intervalRef = useRef(null);
  const seenIds = useRef(new Set());

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ club_id: clubId, limit: maxItems });
      if (latestAt) params.set('since', latestAt);
      const res = await fetch(`/api/agents/session-events?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const incoming = data.events || [];
      if (!incoming.length) return;

      const freshIds = new Set();
      incoming.forEach(e => {
        if (!seenIds.current.has(e.id)) {
          freshIds.add(e.id);
          seenIds.current.add(e.id);
        }
      });

      if (freshIds.size > 0 || !latestAt) {
        setEvents(prev => {
          const merged = latestAt
            ? [...incoming, ...prev].slice(0, maxItems)
            : incoming.slice(0, maxItems);
          // Deduplicate by id
          const seen = new Set();
          return merged.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
        });
        if (freshIds.size > 0) setNewIds(freshIds);
        if (data.latest_at) setLatestAt(data.latest_at);
      }
    } catch {
      // non-critical — demo still works if event stream unavailable
    }
  }, [clubId, latestAt, maxItems]);

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchEvents();
    }, 2000);
    return () => clearInterval(intervalRef.current);
  }, [fetchEvents]);

  // Clear new-item highlights after animation
  useEffect(() => {
    if (!newIds.size) return;
    const t = setTimeout(() => setNewIds(new Set()), 2000);
    return () => clearTimeout(t);
  }, [newIds]);

  if (!events.length) {
    return (
      <div style={{ padding: compact ? 12 : 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        <div style={{ marginBottom: 8, fontSize: 20 }}>⚡</div>
        <div>Waiting for events…</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Tap a trigger button to fire a live scenario</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: compact ? 8 : 12 }}>
        <span style={{ fontSize: compact ? 12 : 14, fontWeight: 700, color: '#111827' }}>Agent Event Stream</span>
        <span className="pulse-dot" style={{ width: 7, height: 7, background: '#12b76a', borderRadius: '50%', display: 'inline-block', animation: 'pulseDot 1.5s infinite' }} />
        <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginLeft: 'auto' }}>Live</span>
      </div>

      {/* Event list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6 }}>
        {events.map(event => {
          const isNew = newIds.has(event.id);
          const sessionMeta = SESSION_META[event.sessionId] || { label: event.sessionLabel || event.sessionId, color: '#6b7280', icon: '🤖' };
          const typeMeta = EVENT_TYPE_META[event.eventType] || { bg: '#f9fafb', border: '#e5e7eb', dot: '#9ca3af', label: event.eventType };
          const priority = getPriority(event.payload);
          const label = getEventLabel(event);

          return (
            <div
              key={event.id}
              style={{
                borderRadius: compact ? 8 : 10,
                border: `1px solid ${isNew ? sessionMeta.color + '40' : typeMeta.border}`,
                background: isNew ? sessionMeta.color + '08' : typeMeta.bg,
                padding: compact ? '7px 10px' : '10px 12px',
                transition: 'all 0.35s ease',
                animation: isNew ? 'routeSlideIn 0.4s ease-out' : 'none',
                boxShadow: isNew ? `0 2px 8px ${sessionMeta.color}20` : 'none',
              }}
            >
              {/* Top row: session + time + priority */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{sessionMeta.icon}</span>
                <span style={{ fontSize: compact ? 10 : 11, fontWeight: 700, color: sessionMeta.color, letterSpacing: -0.1 }}>
                  {sessionMeta.label}
                </span>
                {priority && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: priority.color, background: priority.bg, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {priority.label}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>

              {/* Event type badge + label */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: typeMeta.dot, flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: typeMeta.dot, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>
                    {typeMeta.label}
                  </span>
                  <span style={{ fontSize: compact ? 11 : 12, color: '#374151', lineHeight: 1.4, display: 'block', wordBreak: 'break-word' }}>
                    {label}
                  </span>
                </div>
              </div>

              {/* LTV at risk callout */}
              {event.payload?.ltv_at_risk && (
                <div style={{ marginTop: 5, fontSize: 10, color: '#dc2626', fontWeight: 700, background: '#fef2f2', borderRadius: 5, padding: '2px 7px', display: 'inline-block' }}>
                  ${event.payload.ltv_at_risk.toLocaleString()} LTV at risk
                </div>
              )}

              {/* Handoff arrow: source → target (only for recommendations) */}
              {event.eventType === 'recommendation_received' && event.sourceAgent && (
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6b7280' }}>
                  <span style={{ color: '#9ca3af' }}>{agentShortName(event.sourceAgent)}</span>
                  <span style={{ color: '#9333ea', fontWeight: 700 }}>→</span>
                  <span style={{ color: sessionMeta.color, fontWeight: 600 }}>{sessionMeta.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes routeSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

function agentShortName(sourceAgent) {
  const map = {
    service_recovery_analyst: 'Service Recovery',
    member_pulse_analyst: 'Member Pulse',
    revenue_analyst: 'Revenue Analyst',
    morning_briefing: 'Morning Briefing',
    member_concierge: 'Concierge',
    gm_concierge: 'GM Agent',
    maya_fb_agent: 'Maya (F&B)',
  };
  return map[sourceAgent] || sourceAgent;
}
