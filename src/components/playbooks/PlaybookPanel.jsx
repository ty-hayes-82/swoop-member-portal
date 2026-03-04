import { useState } from 'react';
import { theme } from '@/config/theme';
import { useFixItActions } from '@/hooks/useFixItActions';
import PlaybookStep from './PlaybookStep';
import BeforeAfter from './BeforeAfter';

/**
 * PlaybookPanel — full playbook container with steps, before/after, activate button
 * Props: { id, title, scenario, steps, beforeMetrics, afterMetrics, accentColor? }
 */
export default function PlaybookPanel({ id, title, scenario, steps = [], beforeMetrics = [], afterMetrics = [], accentColor }) {
  const { isActive, activatePlaybook, deactivatePlaybook, getImpact } = useFixItActions();
  const [expanded, setExpanded] = useState(false);
  const active = isActive(id);
  const impact = getImpact(id);
  const accent = accentColor ?? theme.colors.operations;

  const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${active ? `${accent}60` : theme.colors.border}`,
      borderRadius: theme.radius.lg, overflow: 'hidden',
      boxShadow: active ? `0 0 24px ${accent}18` : 'none',
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border}`,
        background: active ? `${accent}10` : 'transparent',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 6 }}>
            {active && <span style={{ width: 8, height: 8, borderRadius: '50%',
              background: theme.colors.success, display: 'inline-block' }} />}
            <span style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary,
              fontFamily: theme.fonts.serif }}>{title}</span>
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary,
            margin: 0, maxWidth: 480, lineHeight: 1.5 }}>{scenario}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: theme.spacing.md }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Monthly impact</div>
          <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono, fontWeight: 700,
            color: active ? theme.colors.success : accent }}>{fmt(impact.monthly)}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{fmt(impact.annual)}/yr</div>
        </div>
      </div>

      {/* Steps toggle */}
      <div style={{ padding: theme.spacing.lg }}>
        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: theme.spacing.md,
          color: accent, fontSize: theme.fontSize.sm, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {expanded ? '▾' : '▸'} {steps.length} steps in this playbook
        </button>

        {expanded && (
          <div style={{ marginBottom: theme.spacing.md }}>
            {steps.map((step, i) => (
              <PlaybookStep key={i} stepNumber={i + 1} {...step} isCompleted={active} />
            ))}
          </div>
        )}

        <BeforeAfter beforeMetrics={beforeMetrics} afterMetrics={afterMetrics} isActive={active} />

        <button
          onClick={() => active ? deactivatePlaybook(id) : activatePlaybook(id)}
          style={{
            width: '100%', marginTop: theme.spacing.md, padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.md, border: `1px solid ${active ? theme.colors.border : accent}`,
            background: active ? theme.colors.bgCardHover : accent,
            color: active ? theme.colors.textSecondary : '#fff',
            fontSize: theme.fontSize.md, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
          {active ? '✓ Playbook Active — Deactivate' : `Activate ${title}`}
        </button>
      </div>
    </div>
  );
}
