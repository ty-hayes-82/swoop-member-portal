/**
 * M5: Notification Management Panel
 * Per-agent channel toggles, batch delivery windows, priority-only alerting.
 * Consumes api/notifications.js preferences table.
 */
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';

const AGENTS = [
  { id: 'member_pulse', name: 'Member Pulse' },
  { id: 'service_recovery', name: 'Service Recovery' },
  { id: 'demand_optimizer', name: 'Demand Optimizer' },
  { id: 'engagement_autopilot', name: 'Engagement Autopilot' },
  { id: 'revenue_analyst', name: 'Revenue Analyst' },
  { id: 'labor_optimizer', name: 'Labor Optimizer' },
];

const CHANNELS = ['in_app', 'email', 'sms'];

export default function NotificationSettings() {
  const { showToast } = useApp();
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('swoop_notification_prefs') || '{}');
    } catch { return {}; }
  });

  const [digestTime, setDigestTime] = useState(preferences.digestTime || '07:00');
  const [digestEnabled, setDigestEnabled] = useState(preferences.digestEnabled !== false);
  const [priorityOnly, setPriorityOnly] = useState(preferences.priorityOnly || false);

  const getAgentChannel = (agentId) => preferences[`${agentId}_channel`] || 'in_app';
  const getAgentEnabled = (agentId) => preferences[`${agentId}_enabled`] !== false;

  const updatePref = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    try { localStorage.setItem('swoop_notification_prefs', JSON.stringify(updated)); } catch {}
  };

  const saveAll = () => {
    const prefs = {
      ...preferences,
      digestTime,
      digestEnabled,
      priorityOnly,
    };
    try { localStorage.setItem('swoop_notification_prefs', JSON.stringify(prefs)); } catch {}

    // Also save to API if club is configured
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (clubId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_preferences',
          clubId,
          preferences: prefs,
        }),
      }).catch(() => {});
    }

    showToast('Notification preferences saved', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div>
        <h3 style={{ fontSize: theme.fontSize.lg, fontWeight: 700, margin: 0 }}>Notification Preferences</h3>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
          Control how and when you receive alerts from AI agents and the playbook system.
        </p>
      </div>

      {/* Morning Digest */}
      <div style={{
        padding: theme.spacing.md, borderRadius: theme.radius.md,
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <div>
            <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>Morning Digest</div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Daily summary of priorities, at-risk members, and pending actions</div>
          </div>
          <ToggleSwitch enabled={digestEnabled} onChange={() => setDigestEnabled(!digestEnabled)} />
        </div>
        {digestEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Delivery time:</span>
            <input
              type="time"
              value={digestTime}
              onChange={e => setDigestTime(e.target.value)}
              style={{
                padding: '4px 8px', fontSize: theme.fontSize.xs,
                border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
                background: theme.colors.bgDeep, color: theme.colors.textPrimary,
              }}
            />
          </div>
        )}
      </div>

      {/* Priority-only mode */}
      <div style={{
        padding: theme.spacing.md, borderRadius: theme.radius.md,
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }}>Priority-Only Alerts</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Only receive real-time alerts for HIGH and URGENT priority actions. Medium/Low go to digest only.</div>
        </div>
        <ToggleSwitch enabled={priorityOnly} onChange={() => setPriorityOnly(!priorityOnly)} />
      </div>

      {/* Per-agent channels */}
      <div style={{
        padding: theme.spacing.md, borderRadius: theme.radius.md,
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      }}>
        <div style={{ fontWeight: 700, color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.md }}>
          Per-Agent Notification Channels
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AGENTS.map(agent => (
            <div key={agent.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: theme.radius.sm,
              background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ToggleSwitch
                  enabled={getAgentEnabled(agent.id)}
                  onChange={() => updatePref(`${agent.id}_enabled`, !getAgentEnabled(agent.id))}
                  small
                />
                <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{agent.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {CHANNELS.map(ch => (
                  <button
                    key={ch}
                    onClick={() => updatePref(`${agent.id}_channel`, ch)}
                    style={{
                      padding: '3px 10px', fontSize: '11px', fontWeight: 600,
                      borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: getAgentChannel(agent.id) === ch ? theme.colors.textPrimary : theme.colors.bgCard,
                      color: getAgentChannel(agent.id) === ch ? '#fff' : theme.colors.textMuted,
                    }}
                  >
                    {ch === 'in_app' ? 'App' : ch === 'email' ? 'Email' : 'SMS'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveAll}
        style={{
          padding: '10px 24px', borderRadius: theme.radius.md, border: 'none',
          background: theme.colors.accent, color: '#fff', fontSize: theme.fontSize.sm,
          fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end',
        }}
      >
        Save Preferences
      </button>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, small }) {
  const w = small ? 36 : 44;
  const h = small ? 20 : 24;
  const dot = small ? 16 : 20;
  return (
    <button onClick={onChange} style={{
      width: w, height: h, borderRadius: h / 2, border: 'none',
      background: enabled ? theme.colors.accent : '#E5E7EB', cursor: 'pointer',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: dot, height: dot, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: (h - dot) / 2,
        left: enabled ? w - dot - (h - dot) / 2 : (h - dot) / 2,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}
