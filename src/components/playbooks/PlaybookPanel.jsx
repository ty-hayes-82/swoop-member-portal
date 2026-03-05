// PlaybookPanel — renamed "Response Plan" (critique: "Intervention sounds clinical")
// Phase 3: confirmation step before activating, trail after, history before.
import { theme } from '@/config/theme';
import { useFixItActions } from '@/hooks/useFixItActions';
import { useAppContext } from '@/context/AppContext';
import { useState } from 'react';
import PlaybookStep from './PlaybookStep';
import BeforeAfter from './BeforeAfter';
import ActionPreview from './ActionPreview';
import PlaybookHistory from './PlaybookHistory';

export default function PlaybookPanel({ id, title, scenario, steps = [], beforeMetrics = [], afterMetrics = [], accentColor, memberContext }) {
  const { isActive, activatePlaybook, deactivatePlaybook, getImpact } = useFixItActions();
  const { trailProgress, trailSteps } = useAppContext();
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const active  = isActive(id);
  const impact  = getImpact(id);
  const accent  = accentColor ?? theme.colors.accent;
  const trail   = trailSteps[id] ?? [];
  const done    = trailProgress[id] ?? 0;
  const fmt     = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

  const handleActivate = () => {
    if (!confirming) { setConfirming(true); return; }
    activatePlaybook(id);
    setConfirming(false);
  };

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${active ? `${accent}50` : theme.colors.border}`,
      borderRadius: theme.radius.lg, overflow: 'hidden',
      boxShadow: active ? `0 0 20px ${accent}14` : theme.shadow.sm,
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing.lg, borderBottom: `1px solid ${theme.colors.border}`,
        background: active ? `${accent}08` : theme.colors.bgDeep,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 6 }}>
            {active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.success, flexShrink: 0, boxShadow: `0 0 6px ${theme.colors.success}` }} />}
            {/* Phase 2: "Response Plan" not "Playbook" */}
            <span style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Response Plan</span>
          </div>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif, marginBottom: 6 }}>{title}</div>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0, maxWidth: 520, lineHeight: 1.5 }}>{scenario}</p>
          {memberContext && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>Triggered for:</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: memberContext.color, padding: '2px 8px',
                background: `${memberContext.color}14`, borderRadius: '4px', border: `1px solid ${memberContext.color}25` }}>
                {memberContext.name}
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

        {/* Logic chain */}
        {impact.logicChain && (
          <div style={{ marginBottom: theme.spacing.md, padding: '8px 12px', background: `${accent}08`,
            borderLeft: `3px solid ${accent}50`, borderRadius: `0 ${theme.radius.sm} ${theme.radius.sm} 0` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>How we get to that number</div>
            <div style={{ fontSize: '12px', color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>{impact.logicChain}</div>
          </div>
        )}

        {/* Pre-activate: what will happen + history */}
        {!active && <ActionPreview steps={steps} accent={accent} />}
        {!active && <PlaybookHistory playbookId={id} accent={accent} />}

        {/* Post-activate: trail */}
        {active && trail.length > 0 && (
          <div style={{ marginBottom: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.success, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Actions taken</div>
            {trail.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', borderRadius: theme.radius.sm,
                background: i < done ? `${theme.colors.success}08` : theme.colors.bgDeep,
                border: `1px solid ${i < done ? theme.colors.success + '20' : theme.colors.border}`,
                opacity: i < done ? 1 : 0.45, transition: 'all 0.4s ease',
              }}>
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{i < done ? '✓' : '◌'}</span>
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
          {stepsExpanded ? '▾' : '▸'} {steps.length}-step plan details
        </button>
        {stepsExpanded && (
          <div style={{ marginBottom: theme.spacing.md }}>
            {steps.map((step, i) => <PlaybookStep key={i} stepNumber={i + 1} {...step} isCompleted={active} />)}
          </div>
        )}

        <BeforeAfter beforeMetrics={beforeMetrics} afterMetrics={afterMetrics} isActive={active} />

        {/* Confirmation step — Phase 3 */}
        {confirming && !active && (
          <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.md,
            background: `${accent}08`, border: `1px solid ${accent}40`, borderRadius: theme.radius.md }}>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
              Confirm activation
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.md }}>
              Activating <strong>{title}</strong> will trigger the {steps.length} steps shown above. Each step is previewed — nothing will happen that isn't listed. You can deactivate at any time.
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
              <button onClick={handleActivate} style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`, borderRadius: theme.radius.md,
                border: 'none', background: accent, color: '#fff',
                fontSize: theme.fontSize.sm, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 2px 6px ${accent}50` }}>
                Yes, activate this plan
              </button>
              <button onClick={() => setConfirming(false)} style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`, borderRadius: theme.radius.md,
                border: 'none', background: 'none',
                color: theme.colors.textMuted, fontSize: theme.fontSize.sm, cursor: 'pointer', fontWeight: 500 }}>
                Not yet
              </button>
            </div>
          </div>
        )}

        {/* Activate button */}
        {!confirming && (
          <button
            onClick={() => active ? deactivatePlaybook(id) : handleActivate()}
            style={{
              width: '100%', marginTop: theme.spacing.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`, borderRadius: theme.radius.md,
              border: `1px solid ${active ? theme.colors.border : accent}`,
              background: active ? theme.colors.bgDeep : accent,
              color: active ? theme.colors.textSecondary : '#fff',
              fontSize: theme.fontSize.md, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {active ? '✓ Active — Deactivate' : `Activate this response plan`}
          </button>
        )}
      </div>
    </div>
  );
}
