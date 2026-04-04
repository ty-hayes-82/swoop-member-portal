/**
 * Notification Feed — slide-up panel showing recent notifications
 */
import { useState, useEffect, useCallback } from 'react';

const TYPE_ICONS = {
  morning_digest: '\u2600\uFE0F',
  escalation: '\u26A0\uFE0F',
  sla_breach: '\uD83D\uDEA8',
  playbook_step: '\uD83D\uDCCB',
  health_alert: '\uD83D\uDC93',
  default: '\uD83D\uDD14',
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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-lg max-h-[480px] overflow-hidden flex flex-col dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-200 flex justify-between items-center dark:border-gray-800">
        <div className="text-sm font-bold text-gray-800 dark:text-white/90">
          Notifications {notifications.length > 0 && `(${notifications.length})`}
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-brand-500 bg-transparent border-none cursor-pointer font-semibold">
              Mark all read
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-gray-500 text-base dark:text-gray-400">
              \u00D7
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[420px]">
        {loading && (
          <div className="p-5 text-center text-gray-500 text-sm dark:text-gray-400">
            Loading notifications...
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="p-5 text-center text-gray-500 text-sm dark:text-gray-400">
            All caught up \u2014 no new notifications.
          </div>
        )}
        {notifications.map(n => {
          const icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
          const isUrgent = n.priority === 'urgent';
          const timeAgo = getTimeAgo(n.created_at);

          return (
            <div
              key={n.notification_id}
              onClick={() => markRead(n.notification_id)}
              className={`px-4 py-3 border-b border-gray-200 cursor-pointer flex gap-2.5 items-start dark:border-gray-800 ${isUrgent ? 'bg-error-50 dark:bg-error-500/5' : 'bg-transparent'}`}
            >
              <span className="text-lg shrink-0">{icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800 leading-snug dark:text-white/90">
                  {n.title}
                </div>
                {n.body && (
                  <div className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-2 dark:text-gray-400">
                    {n.body}
                  </div>
                )}
                <div className="text-[10px] text-gray-500 mt-1 flex gap-2 items-center dark:text-gray-400">
                  <span>{timeAgo}</span>
                  {n.priority !== 'normal' && (
                    <span className={`px-1.5 py-px rounded font-bold uppercase text-[9px] ${
                      n.priority === 'urgent'
                        ? 'bg-error-50 text-error-500 dark:bg-error-500/15'
                        : 'bg-warning-50 text-warning-500 dark:bg-warning-500/15'
                    }`}>{n.priority}</span>
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
