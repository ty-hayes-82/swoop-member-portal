// features/agent-command/AgentConfigDrawer.jsx — Phase B Step 13
// Agent configuration panel — shown when GM clicks "Configure" on any AgentStatusCard
// All settings are cosmetic in Phase A/B — they drive mock behavior in Phase C
import { useState } from 'react';
import { theme } from '@/config/theme';

const DEFAULT_CONFIG = {
  threshold: 500,          // auto-approve actions with estimated impact < $N
  escalationHours: 48,     // escalate unresolved complaints after N hours
  notifications: { app: true, email: false, sms: false },
  scope: { critical: true, atRisk: true, watch: false },
};

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={onChange} style={{
        width: 36, height: 20, borderRadius: 10, position: 'relative',
        background: checked ? '#22D3EE' : theme.colors.bgDeep,
        border: `1px solid ${checked ? '#22D3EE' : theme.colors.border}`,
        transition: 'all 0.15s', cursor: 'pointer', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 17 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: checked ? '#000' : theme.colors.textMuted,
          transition: 'left 0.15s',
        }} />
      </div>
      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>{label}</span>
    </label>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div onClick={onChange} style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        background: checked ? '#22D3EE' : 'transparent',
        border: `1.5px solid ${checked ? '#22D3EE' : theme.colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
        {checked && <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>}
      </div>
      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>{label}</span>
    </label>
  );
}

export default function AgentConfigDrawer({ agent, initialConfig, onSave, onClose }) {
  const [cfg, setCfg] = useState({ ...DEFAULT_CONFIG, ...initialConfig });
  const [saved, setSaved] = useState(false);

  function update(path, val) {
    setCfg(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      if (parts.length === 1) { next[parts[0]] = val; }
      else { next[parts[0]] = { ...prev[parts[0]], [parts[1]]: val }; }
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    onSave(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      marginTop: 8, background: theme.colors.bgCard,
      border: `1px solid rgba(34,211,238,0.25)`,
      borderRadius: theme.radius.md, padding: theme.spacing.lg,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: '#22D3EE' }}>
            Configure: {agent.name}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            Settings are saved across sessions
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: theme.colors.textMuted,
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px',
        }}>✕</button>
      </div>

      {/* Threshold */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Auto-Approve Threshold
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: 10 }}>
          Auto-approve actions where estimated impact is under <strong style={{ color: '#22D3EE' }}>${cfg.threshold.toLocaleString()}</strong>
        </div>
        <input type="range" min={0} max={5000} step={100} value={cfg.threshold}
          onChange={e => update('threshold', Number(e.target.value))}
          style={{ width: '100%', accentColor: '#22D3EE' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.colors.textMuted, marginTop: 2 }}>
          <span>$0 (manual only)</span><span>$5,000</span>
        </div>
      </div>

      {/* Escalation window */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Escalation Window
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="number" min={1} max={168} value={cfg.escalationHours}
            onChange={e => update('escalationHours', Number(e.target.value))}
            style={{
              width: 60, padding: '6px 10px', borderRadius: theme.radius.sm,
              background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
              color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.mono,
            }}
          />
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            hours — escalate unresolved complaints to GM
          </span>
        </div>
      </div>

      {/* Notification channels */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Alert GM via
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Toggle checked={cfg.notifications.app} onChange={() => update('notifications.app', !cfg.notifications.app)} label="App inbox" />
          <Toggle checked={cfg.notifications.email} onChange={() => update('notifications.email', !cfg.notifications.email)} label="Email" />
          <Toggle checked={cfg.notifications.sms} onChange={() => update('notifications.sms', !cfg.notifications.sms)} label="SMS (Phase D)" />
        </div>
      </div>

      {/* Scope (only for Retention Sentinel) */}
      {agent.id === 'retention-sentinel' && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Monitor Member Segments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Checkbox checked={cfg.scope.critical} onChange={() => update('scope.critical', !cfg.scope.critical)} label="Critical (score < 30)" />
            <Checkbox checked={cfg.scope.atRisk} onChange={() => update('scope.atRisk', !cfg.scope.atRisk)} label="At Risk (score 30–50)" />
            <Checkbox checked={cfg.scope.watch} onChange={() => update('scope.watch', !cfg.scope.watch)} label="Watch (score 50–65)" />
          </div>
        </div>
      )}

      {/* Save */}
      <button onClick={handleSave} style={{
        width: '100%', padding: '9px 0', borderRadius: theme.radius.sm, cursor: 'pointer',
        background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(34,211,238,0.12)',
        border: `1px solid ${saved ? 'rgba(74,222,128,0.4)' : 'rgba(34,211,238,0.35)'}`,
        color: saved ? '#4ADE80' : '#22D3EE', fontSize: '12px', fontWeight: 700, transition: 'all 0.2s',
      }}>
        {saved ? '✓ Saved' : 'Save Configuration'}
      </button>
    </div>
  );
}
