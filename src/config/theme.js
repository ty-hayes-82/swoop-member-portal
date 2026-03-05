// theme.js — Light mode design tokens
// Warm cream / forest green / confident serif — built for a GM's iPad at 6 AM

export const theme = {
  colors: {
    // Base — light, warm, trustworthy
    bg:           '#F7F5F2',   // warm off-white
    bgCard:       '#FFFFFF',
    bgCardHover:  '#F2EFE9',
    bgDeep:       '#EDE9E1',
    bgSidebar:    '#1F2F24',   // dark sidebar stays — contrast and calm
    border:       '#DDD8CF',
    borderLight:  '#EAE6DE',
    textPrimary:  '#1A2B1C',   // near-black forest
    textSecondary:'#4A6350',   // mid forest
    textMuted:    '#8A9E8D',   // muted sage

    // Decision-view accents — deep, credible, not neon
    operations:   '#1A7A3C',   // deep forest green
    fb:           '#8B6420',   // warm amber
    members:      '#5B3FA0',   // deep purple
    staffing:     '#9A5800',   // burnt orange
    pipeline:     '#8B2258',   // deep rose
    briefing:     '#1A5C8E',   // deep blue

    // Semantic
    urgent:       '#C0392B',
    warning:      '#B5760A',
    success:      '#1A6B34',
    info:         '#1A5C8E',

    // Chart
    chartGolf:    '#1A7A3C',
    chartFB:      '#D4A017',
    chartBlue:    '#2E7BB8',
    chartPurple:  '#7B5DC0',
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
