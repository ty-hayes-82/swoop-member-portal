/**
 * ConfirmationQueue — staff confirmation inbox for pending agent actions.
 *
 * Reads activity_log WHERE status = 'pending_confirmation' via existing
 * /api/agents/sweep endpoint (or a dedicated read endpoint).
 * On Confirm/Dismiss: POSTs to /api/agents/confirm-action.
 */
import { useState, useEffect, useCallback } from 'react';

const D = {
  bg:        'rgb(14,14,14)',
  surface:   'rgba(255,255,255,0.03)',
  border:    'rgba(255,255,255,0.08)',
  text:      '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim:   'rgba(255,255,255,0.35)',
  accent:    'rgb(243,146,45)',
  accentBg:  'rgba(243,146,45,0.12)',
  accentBdr: 'rgba(243,146,45,0.3)',
  green:     'rgb(34,197,94)',
  greenBg:   'rgba(34,197,94,0.08)',
  greenBdr:  'rgba(34,197,94,0.3)',
  red:       'rgb(239,68,68)',
  redBg:     'rgba(239,68,68,0.08)',
  redBdr:    'rgba(239,68,68,0.2)',
};

function getClubId() {
  try {
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    return user?.clubId || 'club_001';
  } catch { return 'club_001'; }
}

function getAuthHeaders() {
  try {
    const token = localStorage.getItem('swoop_auth_token');
    if (token && token !== 'demo') return { Authorization: `Bearer ${token}` };
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || 'null');
    if (user?.clubId?.startsWith('demo_')) return { 'X-Demo-Club': user.clubId };
  } catch {}
  return { 'X-Demo-Club': 'club_001' };
}

function formatAge(createdAt) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function ConfirmationQueue({ embedded = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({});
  const clubId = getClubId();

  const load = useCallback(() => {
    fetch(`/api/activity?clubId=${encodeURIComponent(clubId)}&status=pending_confirmation&limit=20`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then(d => {
        setItems(Array.isArray(d) ? d : (d.items ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clubId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function resolve(confirmationId, action) {
    setActing(prev => ({ ...prev, [confirmationId]: action }));
    try {
      const res = await fetch('/api/agents/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ confirmationId, action }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.confirmation_id !== confirmationId));
      }
    } finally {
      setActing(prev => { const n = { ...prev }; delete n[confirmationId]; return n; });
    }
  }

  if (loading) {
    return (
      <div style={{ color: D.textDim, fontSize: 12, padding: embedded ? 0 : 20 }}>
        Loading confirmation queue...
      </div>
    );
  }

  if (items.length === 0) {
    return embedded ? null : (
      <div style={{ color: D.textDim, fontSize: 12, padding: 20, textAlign: 'center' }}>
        No pending confirmations.
      </div>
    );
  }

  return (
    <div style={embedded ? {} : { padding: 16 }}>
      {!embedded && (
        <div style={{ fontSize: 14, fontWeight: 600, color: D.text, marginBottom: 12 }}>
          Pending Confirmations
          <span style={{ marginLeft: 8, background: D.accentBg, border: `1px solid ${D.accentBdr}`, borderRadius: 10, fontSize: 11, padding: '1px 7px', color: D.accent }}>
            {items.length}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const id = item.confirmation_id;
          const busy = acting[id];
          return (
            <div key={id} style={{
              background: D.surface,
              border: `1px solid ${D.border}`,
              borderRadius: 10,
              padding: '12px 14px',
            }}>
              {/* Action description */}
              <div style={{ fontSize: 13, color: D.text, marginBottom: 4, lineHeight: '1.4' }}>
                {item.action_description ?? item.description ?? 'Pending action'}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: D.textDim }}>
                  {item.agent_name?.replace(/_/g, ' ') ?? 'agent'}
                </span>
                {item.member_name && (
                  <span style={{ fontSize: 11, color: D.textMuted }}>
                    {item.member_name}
                  </span>
                )}
                <span style={{ fontSize: 11, color: D.textDim, marginLeft: 'auto' }}>
                  {item.created_at ? formatAge(item.created_at) : ''}
                </span>
              </div>

              {/* Context */}
              {item.context && (
                <div style={{ fontSize: 11, color: D.textMuted, marginBottom: 10, paddingLeft: 8, borderLeft: `2px solid ${D.border}` }}>
                  {typeof item.context === 'string' ? item.context : JSON.stringify(item.context)}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={!!busy}
                  onClick={() => resolve(id, 'confirm')}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 7,
                    border: `1px solid ${D.greenBdr}`,
                    background: busy === 'confirm' ? D.greenBg : 'transparent',
                    color: D.green,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy === 'confirm' ? 'Confirming...' : 'Confirm'}
                </button>
                <button
                  disabled={!!busy}
                  onClick={() => resolve(id, 'dismiss')}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 7,
                    border: `1px solid ${D.redBdr}`,
                    background: busy === 'dismiss' ? D.redBg : 'transparent',
                    color: D.red,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  {busy === 'dismiss' ? 'Dismissing...' : 'Dismiss'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
