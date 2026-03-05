// StoryHeadline.jsx — Story-first headline for every view.
// Renders above the fold so the GM reads the business implication first,
// then sees data as evidence. Spec: under 80 lines, theme tokens only.
import { theme } from '@/config/theme';

const VARIANT_STYLES = {
  urgent: {
    borderColor: theme.colors.urgent,
    accentColor: theme.colors.urgent,
    bg: `${theme.colors.urgent}08`,
    icon: '⚠',
  },
  warning: {
    borderColor: theme.colors.warning,
    accentColor: theme.colors.warning,
    bg: `${theme.colors.warning}08`,
    icon: '◆',
  },
  insight: {
    borderColor: theme.colors.operations,
    accentColor: theme.colors.operations,
    bg: `${theme.colors.operations}06`,
    icon: '◈',
  },
  opportunity: {
    borderColor: theme.colors.pipeline,
    accentColor: theme.colors.pipeline,
    bg: `${theme.colors.pipeline}06`,
    icon: '◎',
  },
};

/**
 * StoryHeadline — renders as the first thing above the fold on every view.
 * @param {string} headline   — The single most important operational insight (plain English)
 * @param {string} [context]  — Optional supporting sentence with dollar/data grounding
 * @param {'urgent'|'warning'|'insight'|'opportunity'} [variant='insight']
 */
export default function StoryHeadline({ headline, context, variant = 'insight' }) {
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.insight;

  return (
    <div style={{
      background: s.bg,
      borderLeft: `4px solid ${s.borderColor}`,
      borderRadius: `0 ${theme.radius.md} ${theme.radius.md} 0`,
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      marginBottom: theme.spacing.sm,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <span style={{
          fontSize: '20px',
          lineHeight: 1,
          marginTop: '2px',
          flexShrink: 0,
          opacity: 0.85,
        }}>
          {s.icon}
        </span>
        <div>
          <p style={{
            fontFamily: theme.fonts.serif,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textPrimary,
            fontWeight: 400,
            lineHeight: 1.35,
            margin: 0,
          }}>
            {headline}
          </p>
          {context && (
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.xs,
              margin: `${theme.spacing.xs} 0 0 0`,
              lineHeight: 1.5,
            }}>
              {context}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
