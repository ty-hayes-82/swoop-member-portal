export const DEMO_CLUB_NAME = 'Oakmont Hills CC';
export const DEMO_CLUB_LOCATION = 'Scottsdale, AZ';
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
    const clubId = localStorage.getItem('swoop_club_id');
    if (!clubId || clubId === 'demo') return DEMO_CLUB_NAME;
    return 'Your Club';
  } catch { return DEMO_CLUB_NAME; }
}

export function isRealClub() {
  try {
    const clubId = localStorage.getItem('swoop_club_id');
    return clubId && clubId !== 'demo';
  } catch { return false; }
}

// Backward compat — some files import CLUB_NAME
export const CLUB_NAME = DEMO_CLUB_NAME;

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
