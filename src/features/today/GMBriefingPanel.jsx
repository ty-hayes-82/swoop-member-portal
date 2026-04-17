/**
 * GMBriefingPanel — displays the morning briefing from the session event log.
 * Reads agent_handoffs + session events via /api/agents/morning-briefing.
 * Sits alongside existing cockpit panels; does not replace them.
 */
import { useState, useEffect } from 'react';

const D = {
  surface:   'rgba(255,255,255,0.03)',
  border:    'rgba(255,255,255,0.08)',
  text:      '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim:   'rgba(255,255,255,0.35)',
  accent:    'rgb(243,146,45)',
  accentBg:  'rgba(243,146,45,0.12)',
  accentBdr: 'rgba(243,146,45,0.3)',
  green:     'var(--color-swoop-success-fill)',
  greenBg:   'var(--color-swoop-success-bg)',
};

const PRIORITY_COLOR = {
  urgent: 'rgb(239,68,68)',
  high:   D.accent,
  medium: 'rgb(59,130,246)',
  low:    D.textDim,
};

function getClubId() {
  try {
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    return user?.clubId || 'club_001';
  } catch { return 'club_001'; }
}

export default function GMBriefingPanel({ hours = 12 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const clubId = getClubId();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/agents/morning-briefing?clubId=${encodeURIComponent(clubId)}&hours=${hours}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [clubId, hours]);

  if (loading) {
    return (
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '16px 18px' }}>
        <div style={{ color: D.textDim, fontSize: 12 }}>Loading agent briefing...</div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const recs = data.recommendations ?? [];
  const outcomes = data.recent_outcomes ?? [];

  if (recs.length === 0 && outcomes.length === 0) return null;

  return (
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>Agent Briefing</span>
        <span style={{ fontSize: 11, color: D.textDim, marginLeft: 'auto' }}>
          Last {hours}h
        </span>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.map((rec, i) => (
            <div key={i} style={{
              background: D.accentBg,
              border: `1px solid ${PRIORITY_COLOR[rec.priority] ?? D.accentBdr}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: PRIORITY_COLOR[rec.priority] ?? D.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 1,
                  flexShrink: 0,
                }}>
                  {rec.priority ?? 'info'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: D.text, lineHeight: '1.45' }}>{rec.summary}</div>
                  <div style={{ fontSize: 11, color: D.textDim, marginTop: 3 }}>
                    {rec.from_agent?.replace(/_/g, ' ')}
                    {rec.dollar_impact && (
                      <span style={{ color: D.green, marginLeft: 6 }}>{rec.dollar_impact}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent outcomes */}
      {outcomes.length > 0 && (
        <div style={{ padding: '8px 18px 12px', borderTop: recs.length > 0 ? `1px solid ${D.border}` : undefined }}>
          <div style={{ fontSize: 11, color: D.textDim, marginBottom: 6 }}>Recent outcomes</div>
          {outcomes.map((o, i) => {
            const payload = typeof o.payload === 'string' ? JSON.parse(o.payload) : (o.payload ?? {});
            return (
              <div key={i} style={{ fontSize: 11, color: D.textMuted, paddingLeft: 8, borderLeft: `2px solid ${D.green}`, marginBottom: 4 }}>
                {payload.action ?? o.event_type} — {payload.agent ?? ''}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
