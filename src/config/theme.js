export const theme = {
  colors: {
    // Base
    bg:           '#0C1810',
    bgCard:       '#12261A',
    bgCardHover:  '#1A3326',
    bgDeep:       '#081210',
    border:       '#2A4A35',
    borderLight:  '#1E3828',
    textPrimary:  '#E8F5E8',
    textSecondary:'#8BAF8B',
    textMuted:    '#5A7A5A',

    // Decision-view accents
    operations:   '#4ADE80',
    fb:           '#F0C674',
    members:      '#A78BFA',
    staffing:     '#F59E0B',
    pipeline:     '#F472B6',
    briefing:     '#6BB8EF',
    demo:         '#F0C674',

    // Semantic
    urgent:       '#EF4444',
    warning:      '#F59E0B',
    success:      '#22C55E',
    info:         '#3B82F6',

    // Chart colors
    chartGolf:    '#4ADE80',
    chartFB:      '#F0C674',
    chartBlue:    '#6BB8EF',
    chartPurple:  '#A78BFA',
  },
  spacing: {
    xs:  '4px',
    sm:  '8px',
    md:  '16px',
    lg:  '24px',
    xl:  '32px',
    xxl: '48px',
  },
  radius: {
    sm:  '6px',
    md:  '10px',
    lg:  '16px',
    xl:  '24px',
  },
  fonts: {
    sans:  "'DM Sans', system-ui, sans-serif",
    mono:  "'JetBrains Mono', monospace",
    serif: "'DM Serif Display', serif",
  },
  fontSize: {
    xs:   '11px',
    sm:   '13px',
    md:   '15px',
    lg:   '18px',
    xl:   '24px',
    xxl:  '36px',
    hero: '48px',
  },
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.4)',
    md:  '0 4px 12px rgba(0,0,0,0.5)',
    lg:  '0 8px 24px rgba(0,0,0,0.6)',
    glow: (color) => `0 0 20px ${color}22`,
  },
};
