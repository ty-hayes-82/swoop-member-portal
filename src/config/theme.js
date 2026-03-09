// theme.js — Light mode design tokens
// Updated palette: black / white / orange (swoopgolf.com)

const ORANGE       = '#F3922D';
const ORANGE_DEEP  = '#D97706';
const ORANGE_SOFT  = '#FFB347';
const ORANGE_MUTED = '#F5B97A';
const BLACK        = '#0F0F0F';
const CHARCOAL     = '#181818';
const GRAPHITE     = '#2A2A2A';
const SLATE        = '#3F3F46';
const STEEL        = '#52525B';
const ASH          = '#6B7280';
const SILVER       = '#A1A1AA';
const CLOUD        = '#E4E4E7';
const FOG          = '#EFEFEF';
const PORCELAIN    = '#F8F9FA';
const PAPER        = '#FFFFFF';

export const theme = {
  colors: {
    bg:           PORCELAIN,
    bgCard:       PAPER,
    bgCardHover:  FOG,
    bgDeep:       '#ECECEC',
    bgSidebar:    CHARCOAL,
    border:       CLOUD,
    borderLight:  FOG,
    textPrimary:  BLACK,
    textSecondary:SLATE,
    textMuted:    ASH,
    textOnDark:   PAPER,

    accent:       ORANGE,

    operations:   ORANGE,
    fb:           ORANGE_SOFT,
    members:      BLACK,
    staffing:     ORANGE_DEEP,
    pipeline:     ORANGE_MUTED,
    briefing:     GRAPHITE,

    urgent:       '#C0392B',
    warning:      ORANGE_DEEP,
    success:      ORANGE,
    info:         GRAPHITE,
    black:        BLACK,
    white:        PAPER,

    chartGolf:    ORANGE,
    chartFB:      ORANGE_SOFT,
    chartBlue:    GRAPHITE,
    chartPurple:  SLATE,

    landingCream: '#F7F5F2',

    lensMemberIntelligence: BLACK,
    lensTeeSheetDemand:     ORANGE,
    lensFbOperations:       ORANGE_SOFT,
    lensStaffingLabor:      ORANGE_DEEP,
    lensRevenuePipeline:    ORANGE_MUTED,
    ctaGreen:               ORANGE,
    ctaGreenHover:          ORANGE_DEEP,
    ctaGreenText:           BLACK,
    agentCyan:              ORANGE,
    agentApproved:          ORANGE,
    agentDismissed:         SILVER,
    navBriefing:            GRAPHITE,
    navOperations:          ORANGE,
    navWaitlist:            ORANGE_SOFT,
    navFb:                  ORANGE_DEEP,
    navMembers:             BLACK,
    navStaffing:            ORANGE_DEEP,
    navPipeline:            ORANGE_MUTED,
    navAgents:              ORANGE,
    navIntegrations:        SLATE,
    navDemo:                ORANGE_SOFT,
    sidebarCard:            GRAPHITE,
    sidebarHover:           '#2F2F2F',
    sidebarBorder:          '#333333',
    sidebarTint:            '#1F1F1F',
    sidebarAccent:          '#222222',
    sidebarAccentBorder:    '#2E2E2E',
    briefingInk:            BLACK,
    briefingMuted:          SLATE,
    briefingPaper:          '#F7F5F2',
    briefingBorder:         '#DDD8CF',
    briefingDivider:        '#EAE6DE',
    briefingSection:        ASH,
    reportSage:             SILVER,
    dispatchGreen:          ORANGE,
    riskAtRisk:             ORANGE_DEEP,
    riskAtRiskAlt:          '#B45309',
    archetypeRose:          ORANGE_MUTED,
    archetypeWeekend:       ORANGE_DEEP,
    archetypeBrown:         GRAPHITE,
    archetypeTeal:          ORANGE_SOFT,
    archetypeGhost:         SILVER,
    archetypeSnowbird:      '#B3B3B3',
    integrationHeroStart:   '#0D0D0D',
    integrationHeroMid:     '#151515',
    integrationHeroEnd:     '#101010',
    integrationTeeSheet:    ORANGE,
    integrationPos:         ORANGE_SOFT,
    integrationCrm:         ORANGE_DEEP,
    integrationWaitlist:    ORANGE_MUTED,
    integrationNeutral:     SLATE,
    integrationMuted:       SILVER,
    integrationWarn:        ORANGE_DEEP,
    integrationLinkInactive:'#C5CED6',
    integrationTrendDown:   '#8F3D2B',
    integrationHighlight:   ORANGE,
  },
  spacing: {
    xs:  '4px', sm:  '8px', md:  '16px',
    lg:  '24px', xl:  '32px', xxl: '48px',
  },
  radius: {
    sm: '6px', md: '10px', lg: '16px', xl: '24px',
  },
  fonts: {
    sans:  "'Plus Jakarta Sans', system-ui, sans-serif",
    mono:  "'JetBrains Mono', monospace",
    serif: "'Plus Jakarta Sans', system-ui, sans-serif",
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
