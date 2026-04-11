import { getDataMode } from '@/services/demoGate';

export const DEMO_CLUB_NAME = 'Pinetree Country Club';
export const DEMO_CLUB_LOCATION = 'Kennesaw, GA';
export const DEMO_DATE = '2026-01-17';
export const DEMO_MONTH = 'January 2026';
export const DEMO_TIMESTAMP = 'Jan 17, 2026 7:00 AM';
export const DEMO_TIME = '7:00 AM';

// Dynamic club name — reads from localStorage (set during onboarding or login)
export function getClubName() {
  try {
    const stored = localStorage.getItem('swoop_club_name');
    if (stored) return stored;
    const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
    if (user.clubName) return user.clubName;
    if (getDataMode() !== 'live') return DEMO_CLUB_NAME;
    return 'Your Club';
  } catch { return DEMO_CLUB_NAME; }
}

export function isRealClub() {
  try {
    if (getDataMode() !== 'live') return false;
    // Seeded/test clubs are not "real" — check for production flag
    const isProduction = localStorage.getItem('swoop_production') === 'true';
    return isProduction;
  } catch { return false; }
}

// Backward compat — some files import CLUB_NAME
export const CLUB_NAME = DEMO_CLUB_NAME;

// Whether this is an authenticated non-demo club (for data fallback decisions)
// Unlike isRealClub(), this does NOT require the swoop_production flag.
// Used by services to decide: show empty states (real club) vs demo data (demo mode).
export function isAuthenticatedClub() {
  return getDataMode() === 'live';
}

// Whether static demo data should be used
// As of V4, always returns false — demo mode now uses live DB data from club_001
export function useStaticData() {
  return false;
}

/**
 * Club profile presets — proves the system scales across club sizes and types.
 * Each profile defines structural parameters that drive data generation and thresholds.
 * The demo uses 'mid-private' (Pinetree). Investors can see how the same engine
 * adapts to a 1200-member resort or a 150-member boutique club.
 */
export const CLUB_PROFILES = {
  'boutique-private': {
    label: 'Boutique Private (150 members)',
    memberCount: 150,
    avgDues: 24000,
    archetypeWeights: { 'Die-Hard Golfer': 0.25, 'Social Butterfly': 0.10, 'Balanced Active': 0.20, 'Weekend Warrior': 0.15, 'Declining': 0.08, 'New Member': 0.10, 'Ghost': 0.05, 'Snowbird': 0.07 },
    renewalRate: 0.94,
    avgHealthScore: 72,
    holes: 18,
    fbVenues: 1,
    staffCount: 25,
  },
  'mid-private': {
    label: 'Mid-Size Private (390 members)',
    memberCount: 390,
    avgDues: 16400,
    archetypeWeights: { 'Die-Hard Golfer': 0.20, 'Social Butterfly': 0.15, 'Balanced Active': 0.18, 'Weekend Warrior': 0.15, 'Declining': 0.08, 'New Member': 0.10, 'Ghost': 0.05, 'Snowbird': 0.09 },
    renewalRate: 0.91,
    avgHealthScore: 68,
    holes: 18,
    fbVenues: 2,
    staffCount: 45,
  },
  'large-resort': {
    label: 'Large Resort Club (1200 members)',
    memberCount: 1200,
    avgDues: 12000,
    archetypeWeights: { 'Die-Hard Golfer': 0.15, 'Social Butterfly': 0.18, 'Balanced Active': 0.15, 'Weekend Warrior': 0.18, 'Declining': 0.10, 'New Member': 0.08, 'Ghost': 0.08, 'Snowbird': 0.08 },
    renewalRate: 0.87,
    avgHealthScore: 64,
    holes: 36,
    fbVenues: 4,
    staffCount: 120,
  },
  'city-club': {
    label: 'City/Athletic Club (600 members)',
    memberCount: 600,
    avgDues: 8500,
    archetypeWeights: { 'Die-Hard Golfer': 0.05, 'Social Butterfly': 0.30, 'Balanced Active': 0.20, 'Weekend Warrior': 0.10, 'Declining': 0.10, 'New Member': 0.12, 'Ghost': 0.08, 'Snowbird': 0.05 },
    renewalRate: 0.85,
    avgHealthScore: 62,
    holes: 0,
    fbVenues: 3,
    staffCount: 60,
  },
};

export const DEFAULT_CLUB_PROFILE = 'mid-private';

/**
 * Returns the active club profile. In demo mode, defaults to mid-private (Pinetree).
 * In live mode, would be loaded from club settings.
 */
export function getClubProfile() {
  try {
    const stored = localStorage.getItem('swoop_club_profile');
    if (stored && CLUB_PROFILES[stored]) return { id: stored, ...CLUB_PROFILES[stored] };
  } catch { /* fall through */ }
  return { id: DEFAULT_CLUB_PROFILE, ...CLUB_PROFILES[DEFAULT_CLUB_PROFILE] };
}

export const SLOW_ROUND_THRESHOLD_MIN = 270;
export const POST_ROUND_WINDOW_MIN = 90;
export const HEALTH_THRESHOLDS = {
  healthy: 70,
  watch: 50,
  atRisk: 30,
  critical: 0,
};

export const PLAYBOOK_IDS = {
  slowSaturday: 'slow-saturday',
  serviceSave: 'service-save',
  engagementDecay: 'engagement-decay',
  staffingGap: 'staffing-gap',
  peakDemand: 'peak-demand-capture',
  PEAK_DEMAND: 'peak-demand-capture',
};

export const UNDERSTAFFED_DATES = ['2026-01-09', '2026-01-16', '2026-01-28'];

export const AGENT_IDS = {
  RETENTION_SENTINEL: 'retention-sentinel',
  DEMAND_OPTIMIZER: 'demand-optimizer',
  SERVICE_RECOVERY: 'service-recovery',
  REVENUE_ANALYST: 'revenue-analyst',
  ENGAGEMENT_COACH: 'engagement-coach',
  DRAFT_COMMUNICATOR: 'draft-communicator',
};

export const ROUTES = {
  BRIEFING: 'briefing',
  OPERATIONS: 'operations',
  FB: 'fb-performance',
  MEMBERS: 'member-health',
  STAFFING: 'staffing-service',
  PIPELINE: 'growth-pipeline',
  DEMO: 'demo-mode',
};
