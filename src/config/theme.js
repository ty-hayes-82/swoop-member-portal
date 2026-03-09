// theme.js — Light mode design tokens
// Clean neutral base + one orange accent — minimal, executive, swoopgolf.com-aligned

export const theme = {
  colors: {
    // Base — clean neutral, not parchment
    bg:           '#F8F9FA',   // near-white, cool-neutral
    bgCard:       '#FFFFFF',
    bgCardHover:  '#F1F1F2',
    bgDeep:       '#EAEAEC',
    bgSidebar:    '#1A1A1A',   // dark sidebar — stays exactly as-is
    border:       '#E4E4E7',
    borderLight:  '#EFEFEF',
    textPrimary:  '#18181B',   // near-black, neutral (was green-tinted)
    textSecondary:'#52525B',   // mid grey (was green-tinted)
    textMuted:    '#71717A',   // muted grey (was sage-green)
    textOnDark:   '#F0F0F0',

    // Single interactive accent
    accent:       '#F3922D',   // Swoop orange — every CTA, active state, live indicator

    // Lens orientation — sidebar left-border only, never used in content area
    operations:   '#F3922D',   // deep forest green
    fb:           '#2E7BB8',   // warm amber
    members:      '#5B3FA0',   // deep purple
    staffing:     '#E07D20',   // burnt orange
    pipeline:     '#F472B6',   // deep rose
    briefing:     '#2E7BB8',   // deep blue

    // Semantic — untouched, must remain unmistakable
    urgent:       '#C0392B',
    warning:      '#B5760A',
    success:      '#F3922D',
    info:         '#1A5C8E',
    black:        '#000000',
    white:        '#FFFFFF',

    // Chart — two data colors, neither competes with accent orange
    chartGolf:    '#F3922D',   // teal-green — golf data bars
    chartFB:      '#2E7BB8',   // toned warm gold — F&B data bars (was #D4A017)
    chartBlue:    '#2E7BB8',   // kept for any remaining supplementary use
    chartPurple:  '#7B5DC0',   // kept for any remaining supplementary use

    // Landing page
    landingCream: '#F7F5F2',
    // §9 NOTE: lens* variable names are INTERNAL ONLY (architecture/config)
    // internal: NEVER use "lens" or "lenses" language in customer-facing copy
    // See ARCHITECTURE.md §9 for translation table
    lensMemberIntelligence: '#A78BFA',
    lensTeeSheetDemand: '#F3922D',
    lensFbOperations: '#2E7BB8',
    lensStaffingLabor: '#E07D20',
    lensRevenuePipeline: '#F472B6',
    ctaGreen: '#F3922D',
    ctaGreenHover: '#E07D20',
    ctaGreenText: '#1A1A1A',
    agentCyan: '#22D3EE',
    agentApproved: '#F3922D',
    agentDismissed: '#94A3B8',
    navBriefing: '#6BB8EF',
    navOperations: '#F3922D',
    navWaitlist: '#2E7BB8',
    navFb: '#7B5DC0',
    navMembers: '#A78BFA',
    navStaffing: '#E07D20',
    navPipeline: '#F472B6',
    navAgents: '#22D3EE',
    navIntegrations: '#6D6D6D',
    navDemo: '#F0C674',
    sidebarCard: '#222222',
    sidebarHover: '#2A2A2A',
    sidebarBorder: '#333333',
    sidebarTint: '#111111',
    sidebarAccent: '#1F1F1F',
    sidebarAccentBorder: '#2B2B2B',
    briefingInk: '#111111',
    briefingMuted: '#4A4A4A',
    briefingPaper: '#F7F5F2',
    briefingBorder: '#DDD8CF',
    briefingDivider: '#EAE6DE',
    briefingSection: '#7C7C7C',
    reportSage: '#A0AEC0',
    dispatchGreen: '#F3922D',
    riskAtRisk: '#D97706',
    riskAtRiskAlt: '#C07020',
    archetypeRose: '#C2608A',
    archetypeWeekend: '#9A6B00',
    archetypeBrown: '#8B5A2B',
    archetypeTeal: '#1A7A9A',
    archetypeGhost: '#7A8C7D',
    archetypeSnowbird: '#6B7FBF',
    integrationHeroStart: '#0D0D0D',
    integrationHeroMid: '#141414',
    integrationHeroEnd: '#101010',
    integrationTeeSheet: '#1A5C8E',
    integrationPos: '#8B6420',
    integrationCrm: '#6E4E9A',
    integrationWaitlist: '#9F3F65',
    integrationNeutral: '#4C5F70',
    integrationMuted: '#6F7780',
    integrationWarn: '#8E6D1A',
    integrationLinkInactive: '#C5CED6',
    integrationTrendDown: '#8F3D2B',
    integrationHighlight: '#2E7BB8',
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
    xs: '12px', sm: '14px', md: '16px',
    lg: '20px', xl: '26px', xxl: '38px', hero: '52px',
  },
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.06)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.10)',
    glow: (color) => `0 0 16px ${color}22`,
  },
};
