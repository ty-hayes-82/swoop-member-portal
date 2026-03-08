import { theme } from '@/config/theme';

/**
 * PlaybookStep — single step in a sequenced playbook
 * Props: { stepNumber, title, description, timeline, isCompleted? }
 */
export default function PlaybookStep({ stepNumber, title, description, timeline, isCompleted = false }) {
  const s = {
    wrap: {
      display: 'flex', gap: theme.spacing.md, padding: `${theme.spacing.md} 0`,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    num: {
      flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: theme.fontSize.sm, fontFamily: theme.fonts.mono,
      background: isCompleted ? theme.colors.success : theme.colors.bgCardHover,
      color: isCompleted ? theme.colors.white : theme.colors.textSecondary,
      border: `1px solid ${isCompleted ? theme.colors.success : theme.colors.border}`,
    },
    content: { flex: 1 },
    title: {
      fontSize: theme.fontSize.md, fontWeight: 600,
      color: theme.colors.textPrimary, marginBottom: 4,
    },
    desc: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.5 },
    timeline: {
      display: 'inline-block', marginTop: 6,
      fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
      background: theme.colors.bgDeep,
      padding: '2px 8px', borderRadius: theme.radius.sm,
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.num}>{isCompleted ? '✓' : stepNumber}</div>
      <div style={s.content}>
        <div style={s.title}>{title}</div>
        <div style={s.desc}>{description}</div>
        {timeline && <span style={s.timeline}>{timeline}</span>}
      </div>
    </div>
  );
}
