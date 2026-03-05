// ActionPreview.jsx — pre-activate panel showing concrete actions that will fire
// Shown before Activate button; hides when playbook is active (trail takes over)
// Hard ceiling: 150 lines. Target: 80 lines.

import { ACTION_TYPES } from '@/config/actionTypes';
import { theme } from '@/config/theme';

export default function ActionPreview({ steps = [], accent }) {
  if (!steps.length) return null;

  return (
    <div style={{
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      background: `${accent}08`,
      border: `1px solid ${accent}25`,
      borderRadius: theme.radius.md,
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 600, color: accent,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: theme.spacing.sm,
      }}>
        When you activate this playbook:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((step, i) => {
          const type = ACTION_TYPES[step.actionType] ?? ACTION_TYPES['report'];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '8px 10px',
              background: theme.colors.bgCardHover,
              borderRadius: theme.radius.sm,
            }}>
              {/* Step number */}
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: `${accent}25`, color: accent,
                fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </span>

              {/* Action type badge */}
              <span style={{
                padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
                fontSize: '10px', fontWeight: 600,
                background: `${type.color}18`, color: type.color,
                border: `1px solid ${type.color}30`,
              }}>
                {type.icon} {type.label}
              </span>

              {/* Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 2 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted, lineHeight: 1.4 }}>
                  {step.preview ?? step.description}
                </div>
              </div>

              <span style={{ fontSize: '11px', color: theme.colors.textMuted, flexShrink: 0, marginTop: 2 }}>
                {step.timeline}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
