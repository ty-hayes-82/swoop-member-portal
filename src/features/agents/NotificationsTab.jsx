/**
 * NotificationsTab — Channel toggles for agent notifications.
 *
 * Extracted from AgentConfigDrawer.jsx (Step 5 cleanup).
 *
 * Props:
 *   config  — { channels: string[] }
 *   onSave  — (updates: { channels: string[] }) => void
 */
import { useCallback } from 'react';

// ── Constants ───────────────────────────────────────────────────────────────

const NOTIFICATION_CHANNELS = [
  { key: 'in_app', label: 'In-App Inbox', desc: 'Notification in the Swoop action inbox' },
  { key: 'email', label: 'Email', desc: 'Summary email to the GM address on file' },
  { key: 'sms', label: 'SMS', desc: 'Text message for urgent or time-sensitive actions' },
  { key: 'slack', label: 'Slack', desc: 'Post to a connected Slack channel' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function NotificationsTab({ config, onSave }) {
  const { channels } = config;

  const toggleChannel = useCallback((key) => {
    const updated = channels.includes(key)
      ? channels.filter(c => c !== key)
      : [...channels, key];
    onSave({ channels: updated });
  }, [channels, onSave]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Notification Channels</h3>
        <p className="text-xs text-gray-400 mb-3 m-0">
          Choose how you want to be notified when this agent proposes or executes an action.
        </p>
        <div className="space-y-2">
          {NOTIFICATION_CHANNELS.map(ch => {
            const isOn = channels.includes(ch.key);
            return (
              <div
                key={ch.key}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60"
              >
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-white/90">{ch.label}</div>
                  <p className="text-[10px] text-gray-400 m-0 mt-0.5">{ch.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={`Toggle ${ch.label}`}
                  onClick={() => toggleChannel(ch.key)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none flex-shrink-0 ${
                    isOn ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    isOn ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
