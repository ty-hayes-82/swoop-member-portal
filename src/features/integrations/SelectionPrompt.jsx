// features/integrations/SelectionPrompt.jsx
import { theme } from '@/config/theme';
import { integrationsById } from '@/data/integrations';

const barStyle = (visible) => ({
  background: theme.colors.white,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  padding: '12px 20px',
  marginBottom: theme.spacing.lg,
  fontSize: theme.fontSize.sm,
  color: theme.colors.textSecondary,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? 'auto' : 'none',
  transition: 'opacity 0.2s ease',
  animation: visible ? 'subtlePulse 2s ease-in-out infinite' : 'none',
});

const dotStyle = (color) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: color || theme.colors.operations,
  flexShrink: 0,
});

export function SelectionPrompt({ selected }) {
  if (selected.length === 2) return null;

  if (selected.length === 1) {
    const item = integrationsById[selected[0]];
    return (
      <div style={barStyle(true)}>
        <div style={dotStyle(item?.color)} />
        <span>
          <strong style={{ color: theme.colors.textPrimary }}>{item?.name}</strong> selected — now pick a second system to see the insights they unlock together.
        </span>
      </div>
    );
  }

  return (
    <div style={barStyle(true)}>
      <div style={dotStyle()} />
      <span>Select any two integrations below to see the insights and automations they unlock together.</span>
    </div>
  );
}
