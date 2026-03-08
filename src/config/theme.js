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
    textOnDark:   '#F0F0F0',

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
    black:        '#000000',
    white:        '#FFFFFF',

    // Chart — two data colors, neither competes with accent orange
    chartGolf:    '#2E8B7A',   // teal-green — golf data bars
    chartFB:      '#C49A2A',   // toned warm gold — F&B data bars (was #D4A017)
    chartBlue:    '#2E7BB8',   // kept for any remaining supplementary use
    chartPurple:  '#7B5DC0',   // kept for any remaining supplementary use

    // Landing page
    landingCream: '#F7F5F2',
    // §9 NOTE: lens* variable names are INTERNAL ONLY (architecture/config)
    // NEVER use "lens" or "lenses" language in customer-facing copy
    // See ARCHITECTURE.md §9 for translation table
    lensMemberIntelligence: '#A78BFA',
    lensTeeSheetDemand: '#4ADE80',
    lensFbOperations: '#F97316',
    lensStaffingLabor: '#F59E0B',
    lensRevenuePipeline: '#34D399',
    ctaGreen: '#4ADE80',
    ctaGreenHover: '#43C872',
    ctaGreenText: '#1F2F24',
    agentCyan: '#22D3EE',
    agentApproved: '#4ADE80',
    agentDismissed: '#94A3B8',
    navBriefing: '#6BB8EF',
    navOperations: '#4ADE80',
    navWaitlist: '#22D3EE',
    navFb: '#F0C674',
    navMembers: '#A78BFA',
    navStaffing: '#F59E0B',
    navPipeline: '#F472B6',
    navAgents: '#22D3EE',
    navIntegrations: '#A8D5BA',
    navDemo: '#F0C674',
    sidebarCard: '#263B2C',
    sidebarHover: '#2E4835',
    sidebarBorder: '#375040',
    sidebarTint: '#0F1F14',
    sidebarAccent: '#1A3A22',
    sidebarAccentBorder: '#2A5A32',
    briefingInk: '#1A2B1C',
    briefingMuted: '#4A6350',
    briefingPaper: '#F7F5F2',
    briefingBorder: '#DDD8CF',
    briefingDivider: '#EAE6DE',
    briefingSection: '#8A9E8D',
    reportSage: '#8BAF8B',
    dispatchGreen: '#22C55E',
    riskAtRisk: '#D97706',
    riskAtRiskAlt: '#C07020',
    archetypeRose: '#C2608A',
    archetypeWeekend: '#9A6B00',
    archetypeBrown: '#8B5A2B',
    archetypeTeal: '#1A7A9A',
    archetypeGhost: '#7A8C7D',
    archetypeSnowbird: '#6B7FBF',
    integrationHeroStart: '#183024',
    integrationHeroMid: '#234533',
    integrationHeroEnd: '#10251E',
    integrationTeeSheet: '#1A5C8E',
    integrationPos: '#8B6420',
    integrationCrm: '#6E4E9A',
    integrationWaitlist: '#9F3F65',
    integrationNeutral: '#4C5F70',
    integrationMuted: '#6F7780',
    integrationWarn: '#8E6D1A',
    integrationLinkInactive: '#C5CED6',
    integrationTrendDown: '#8F3D2B',
    integrationHighlight: '#7A8A7A',
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
