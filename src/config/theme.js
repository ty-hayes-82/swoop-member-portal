// theme.js — Light mode design tokens
// Clean neutral base + one orange accent — minimal, executive, swoopgolf.com-aligned

export const theme = {
  colors: {
    // Base — clean neutral, not parchment
    bg:           '#F8F9FA',   // near-white, cool-neutral
    bgCard:       '#FFFFFF',
    bgCardHover:  '#F1F1F2',
    bgDeep:       '#EAEAEC',
    bgSidebar:    '#1F2F24',   // dark sidebar — stays exactly as-is
    border:       '#E4E4E7',
    borderLight:  '#EFEFEF',
    textPrimary:  '#18181B',   // near-black, neutral (was green-tinted)
    textSecondary:'#52525B',   // mid grey (was green-tinted)
    textMuted:    '#71717A',   // muted grey (was sage-green)

    // Single interactive accent
    accent:       '#F3922D',   // Swoop orange — every CTA, active state, live indicator

    // Lens orientation — sidebar left-border only, never used in content area
    operations:   '#1A7A3C',   // deep forest green
    fb:           '#8B6420',   // warm amber
    members:      '#5B3FA0',   // deep purple
    staffing:     '#9A5800',   // burnt orange
    pipeline:     '#8B2258',   // deep rose
    briefing:     '#1A5C8E',   // deep blue

    // Semantic — untouched, must remain unmistakable
    urgent:       '#C0392B',
    warning:      '#B5760A',
    success:      '#1A6B34',
    info:         '#1A5C8E',

    // Chart — two data colors, neither competes with accent orange
    chartGolf:    '#2E8B7A',   // teal-green — golf data bars
    chartFB:      '#C49A2A',   // toned warm gold — F&B data bars (was #D4A017)
    chartBlue:    '#2E7BB8',   // kept for any remaining supplementary use
    chartPurple:  '#7B5DC0',   // kept for any remaining supplementary use
  },
  spacing: {
    xs:  '4px', sm:  '8px', md:  '16px',
    lg:  '24px', xl:  '32px', xxl: '48px',
  },
  radius: {
    sm: '6px', md: '10px', lg: '16px', xl: '24px',
  },
  fonts: {
    sans:  "'DM Sans', system-ui, sans-serif",
    mono:  "'JetBrains Mono', monospace",
    serif: "'DM Serif Display', serif",
  },
  fontSize: {
    xs: '11px', sm: '13px', md: '15px',
    lg: '18px', xl: '24px', xxl: '36px', hero: '48px',
  },
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.06)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.10)',
    glow: (color) => `0 0 16px ${color}22`,
  },
};
