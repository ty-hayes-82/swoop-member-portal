import { theme } from '@/config/theme';
import { useFixItActions } from '@/hooks/useFixItActions';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import PlaybookStep from './PlaybookStep';
import BeforeAfter from './BeforeAfter';
import ActionPreview from './ActionPreview';
import PlaybookHistory from './PlaybookHistory';

/**
 * PlaybookPanel — full playbook container with ActionPreview, trail, history, before/after
 * Props: { id, title, scenario, steps, beforeMetrics, afterMetrics, accentColor?, memberContext? }
 * Hard ceiling: 200 lines.
 */
export default function PlaybookPanel({ id, title, scenario, steps = [], beforeMetrics = [], afterMetrics = [], accentColor, memberContext }) {
  const { isActive, activatePlaybook, deactivatePlaybook, getImpact } = useFixItActions();
  const { trailProgress, trailSteps } = useAppContext();
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const active  = isActive(id);
  const impact  = getImpact(id);
  const accent  = accentColor ?? theme.colors.operations;
  const trail   = trailSteps[id] ?? [];
  const done    = trailProgress[id] ?? 0;
  const fmt     = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 6 }}>
            {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.success, display: 'inline-block', boxShadow: `0 0 6px ${theme.colors.success}` }} />}
            <span style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>{title}</span>
          </div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0, maxWidth: 520, lineHeight: 1.5 }}>{scenario}</p>
          {/* Member archetype context — Phase 4 */}
          {memberContext && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Triggered by:</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: memberContext.color, padding: '2px 8px',
                background: `${memberContext.color}18`, borderRadius: '4px', border: `1px solid ${memberContext.color}30` }}>
                {memberContext.name} · {memberContext.archetype}
              </span>
              <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>{memberContext.profile}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: theme.spacing.lg }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Monthly impact</div>
          <div style={{ fontSize: theme.fontSize.xl, fontFamily: theme.fonts.mono, fontWeight: 700, color: active ? theme.colors.success : accent }}>{fmt(impact.monthly)}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{fmt(impact.annual)}/yr</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: theme.spacing.lg }}>

        {/* Logic chain — revenue derivation */}
        {impact.logicChain && (
          <div style={{ marginBottom: theme.spacing.md, padding: '8px 12px', background: `${accent}08`,
            borderLeft: `3px solid ${accent}`, borderRadius: `0 ${theme.radius.sm} ${theme.radius.sm} 0` }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: accent, letterSpacing: '0.05em',
              textTransform: 'uppercase', marginBottom: 3 }}>Revenue logic</div>
            <div style={{ fontSize: '12px', color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>
              {impact.logicChain}
            </div>
          </div>
        )}

        {/* Pre-activate: ActionPreview + History */}
        {!active && <ActionPreview steps={steps} accent={accent} />}
        {!active && <PlaybookHistory playbookId={id} accent={accent} />}

        {/* Post-activate: step-by-step trail */}
        {active && trail.length > 0 && (
          <div style={{ marginBottom: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.success,
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Actions taken</div>
            {trail.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', borderRadius: theme.radius.sm,
                background: i < done ? `${theme.colors.success}08` : theme.colors.bgCardHover,
                border: `1px solid ${i < done ? theme.colors.success + '25' : theme.colors.border}`,
                opacity: i < done ? 1 : 0.45,
                transition: 'all 0.4s ease',
              }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>
                  {i < done ? '✓' : '◌'}
                </span>
                <span style={{ fontSize: '12px', color: i < done ? theme.colors.textPrimary : theme.colors.textMuted }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Steps toggle */}
        <button onClick={() => setStepsExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          marginBottom: stepsExpanded ? theme.spacing.md : 0,
          color: accent, fontSize: theme.fontSize.sm, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {stepsExpanded ? '▾' : '▸'} {steps.length}-step playbook details
        </button>
        {stepsExpanded && (
          <div style={{ marginBottom: theme.spacing.md }}>
            {steps.map((step, i) => <PlaybookStep key={i} stepNumber={i + 1} {...step} isCompleted={active} />)}
          </div>
        )}

        <BeforeAfter beforeMetrics={beforeMetrics} afterMetrics={afterMetrics} isActive={active} />

        <button
          onClick={() => active ? deactivatePlaybook(id) : activatePlaybook(id)}
          style={{
            width: '100%', marginTop: theme.spacing.md,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.radius.md,
            border: `1px solid ${active ? theme.colors.border : accent}`,
            background: active ? theme.colors.bgCardHover : accent,
            color: active ? theme.colors.textSecondary : '#fff',
            fontSize: theme.fontSize.md, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          }}>
          {active ? '✓ Playbook Active — Deactivate' : `Activate ${title}`}
        </button>
      </div>
    </div>
  );
}
