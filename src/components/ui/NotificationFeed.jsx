/**
 * Notification Feed — Track 3, Item 8
 * Slide-up panel showing recent notifications from api/notifications.js
 * Used by the header bell icon or as a standalone panel.
 */
import { useState, useEffect, useCallback } from 'react';
import { theme } from '@/config/theme';

const PRIORITY_COLORS = {
  urgent: theme.colors.urgent,
  high: theme.colors.warning,
  normal: theme.colors.textMuted,
};

const TYPE_ICONS = {
  morning_digest: '☀️',
  escalation: '⚠️',
  sla_breach: '🚨',
  playbook_step: '📋',
  health_alert: '💓',
  default: '🔔',
};

export default function NotificationFeed({ clubId, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    fetch(`/api/notifications?clubId=${clubId}&unreadOnly=true`)
      .then(r => r.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clubId]);

  const markRead = useCallback(async (notificationId) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', notificationId }),
    }).catch(() => {});
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  }, []);

  const markAllRead = useCallback(async () => {
    for (const n of notifications) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationId: n.notification_id }),
      }).catch(() => {});
    }
    setNotifications([]);
  }, [notifications]);

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      maxHeight: '480px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
          Notifications {notifications.length > 0 && `(${notifications.length})`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              style={{
                fontSize: theme.fontSize.xs, color: theme.colors.accent,
                background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted, fontSize: '16px' }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
        {loading && (
          <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            Loading notifications...
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            All caught up — no new notifications.
          </div>
        )}
        {notifications.map(n => {
          const icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
          const prioColor = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.normal;
          const timeAgo = getTimeAgo(n.created_at);

          return (
            <div
              key={n.notification_id}
              onClick={() => markRead(n.notification_id)}
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                background: n.priority === 'urgent' ? `${theme.colors.urgent}04` : 'transparent',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.4 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div style={{
                    fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2,
                    lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {n.body}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{timeAgo}</span>
                  {n.priority !== 'normal' && (
                    <span style={{
                      padding: '1px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase',
                      fontSize: '9px', background: `${prioColor}15`, color: prioColor,
                    }}>{n.priority}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
