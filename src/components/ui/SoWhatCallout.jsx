import { theme } from '@/config/theme';

const VARIANT_STYLES = {
  insight:     { border: theme.colors.navBriefing, bg: `${theme.colors.navBriefing}0D`, icon: '💡', color: theme.colors.navBriefing },
  warning:     { border: theme.colors.warning, bg: `${theme.colors.warning}0D`, icon: '⚠️', color: theme.colors.warning },
  urgent:      { border: theme.colors.urgent, bg: `${theme.colors.urgent}0D`, icon: '⚠',  color: theme.colors.urgent },
  opportunity: { border: theme.colors.accent, bg: `${theme.colors.accent}0D`, icon: '◎',  color: theme.colors.accent },
};

export default function SoWhatCallout({ children, variant = 'insight' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.insight;

  return (
    <div style={{
      borderLeft: `4px solid ${s.border}`,
      borderTop: `1px solid ${s.border}22`,
      borderBottom: `1px solid ${s.border}22`,
      borderRight: `1px solid ${s.border}18`,
      background: s.bg,
      borderRadius: `0 8px 8px 0`,
      padding: '14px 18px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      boxShadow: `0 2px 8px ${s.border}14`,
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
      <p style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}
