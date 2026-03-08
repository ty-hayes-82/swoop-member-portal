import { theme } from '@/config/theme';

const VARIANT_STYLES = {
  urgent:   { bg: `${theme.colors.urgent}20`, color: theme.colors.urgent, border: `${theme.colors.urgent}40` },
  warning:  { bg: `${theme.colors.warning}20`, color: theme.colors.warning, border: `${theme.colors.warning}40` },
  success:  { bg: `${theme.colors.success}20`, color: theme.colors.success, border: `${theme.colors.success}40` },
  neutral:  { bg: `${theme.colors.reportSage}20`, color: theme.colors.reportSage, border: `${theme.colors.reportSage}40` },
  effort:   { bg: 'var(--bg-deep)', color: 'var(--text-muted)', border: 'var(--border)' },
  timeline: { bg: 'var(--bg-deep)', color: 'var(--text-muted)', border: 'var(--border)' },
};

export default function Badge({ text, variant = 'neutral', size = 'sm' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const pad = size === 'sm' ? '2px 8px' : '4px 12px';
  const fs  = size === 'sm' ? '11px' : '13px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: pad,
      borderRadius: '999px',
      fontSize: fs,
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-sans)',
    }}>
      {text}
    </span>
  );
}
