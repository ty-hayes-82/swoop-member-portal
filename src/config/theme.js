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

// Semantic color scales (DES-P03)
const SUCCESS_50   = '#F0FDF4';
const SUCCESS_500  = '#12b76a';
const SUCCESS_700  = '#027a48';
const WARNING_50   = '#FFFBEB';
const WARNING_500  = '#F59E0B';
const WARNING_700  = '#B45309';
const DANGER_50    = '#FEF2F2';
const DANGER_500   = '#EF4444';
const DANGER_700   = '#B91C1C';
const INFO_50      = '#EFF6FF';
const INFO_500     = '#3B82F6';
const INFO_700     = '#1D4ED8';

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

    // Semantic colors (DES-P03)
    success50:    SUCCESS_50,
    success500:   SUCCESS_500,
    success700:   SUCCESS_700,
    warning50:    WARNING_50,
    warning500:   WARNING_500,
    warning700:   WARNING_700,
    danger50:     DANGER_50,
    danger500:    DANGER_500,
    danger700:    DANGER_700,
    info50:       INFO_50,
    info500:      INFO_500,
    info700:      INFO_700,

    urgent:       DANGER_700,
    warning:      WARNING_700,
    success:      SUCCESS_500,
    info:         INFO_700,
    black:        BLACK,
    white:        PAPER,

    chartGolf:    ORANGE,
    chartFB:      ORANGE_SOFT,
    chartBlue:    GRAPHITE,
    chartPurple:  SLATE,

    landingCream: '#F7F5F2',
    heroGreen:    '#1A2E20',
    darkSection:  '#0E1A10',
    brass:        '#B5956A',
    brand:        '#F3922D',

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
    serif: "'Fraunces', Georgia, serif",
  },
  fontSize: {
    xs: '12px', sm: '14px', md: '16px',
    lg: '20px', xl: '26px', xxl: '38px', hero: '52px', display: '64px',
  },
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.06)',
    md:  '0 4px 12px rgba(0,0,0,0.08)',
    lg:  '0 8px 24px rgba(0,0,0,0.10)',
    card:'0 12px 32px rgba(17,17,17,0.08)',
    cardHover:'0 20px 44px rgba(17,17,17,0.12)',
    glow: (color) => `0 0 16px ${color}22`,
  },
  neutrals: {
    paper: PAPER,
    cream: '#FAF7F2',
    sand:  '#F2ECE1',
    mist:  '#ECE7DD',
    ink:   '#111111',
  },
  landing: {
    sectionPaddingY: 'clamp(80px, 10vw, 140px)',
    sectionPaddingYSm: 'clamp(48px, 7vw, 88px)',
    containerMax: 1200,
    containerNarrow: 820,
    containerWide: 1320,
    gutter: 'clamp(20px, 4vw, 40px)',
    radius: 20,
    quoteSerif: "'Plus Jakarta Sans', Georgia, serif",
  },
};
