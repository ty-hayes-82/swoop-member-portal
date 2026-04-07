import { theme } from '@/config/theme';

export const ACTION_TYPES = {
  email: { icon: '✉', label: 'Email', color: theme.colors.navBriefing },
  'staff-alert': { icon: '📢', label: 'Staff Alert', color: theme.colors.navStaffing },
  'front-desk-flag': { icon: '🚩', label: 'Front Desk Flag', color: theme.colors.navMembers },
  'comp-offer': { icon: '🎁', label: 'Comp Offer', color: theme.colors.agentApproved },
  report: { icon: '📊', label: 'Report', color: theme.colors.reportSage },
  calendar: { icon: '📅', label: 'Schedule Update', color: theme.colors.navPipeline },
  dispatch: { icon: '📡', label: 'Dispatch', color: theme.colors.dispatchGreen },
  schedule: { icon: '📋', label: 'Tee Sheet', color: theme.colors.navFb },
  outreach: { icon: '📣', label: 'Outreach', color: theme.colors.agentCyan },
  track: { icon: '📈', label: 'Track', color: theme.colors.navMembers },
};

export const AGENT_ACTION_TYPES = {
  RETENTION_OUTREACH: { icon: '🎯', label: 'Retention Outreach', color: theme.colors.agentCyan },
  WAITLIST_PRIORITY: { icon: '⛳', label: 'Waitlist Priority', color: theme.colors.agentApproved },
  SERVICE_ESCALATION: { icon: '🛎', label: 'Service Escalation', color: theme.colors.navStaffing },
  REVENUE_CAPTURE: { icon: '💵', label: 'Revenue Capture', color: theme.colors.navPipeline },
  RE_ENGAGEMENT: { icon: '🤝', label: 'Re-engagement', color: theme.colors.navMembers },
  DRAFT_MESSAGE: { icon: '✉', label: 'Draft Message', color: theme.colors.navBriefing },
  STAFFING_ALERT: { icon: '📢', label: 'Staffing Alert', color: theme.colors.navStaffing },
  FOLLOW_UP: { icon: '🔄', label: 'Follow-Up', color: theme.colors.agentApproved },
  POST_ROUND_DINING: { icon: '🍽', label: 'Post-Round Dining', color: theme.colors.navFb },
  STAFF_PUSH_ALERT: { icon: '📲', label: 'Staff Alert', color: theme.colors.navStaffing },
  SNOWBIRD_WELCOME: { icon: '🌴', label: 'Welcome Back', color: theme.colors.navMembers },
  RAPID_RESPONSE: { icon: '⚡', label: 'Rapid Response', color: theme.colors.navStaffing },
  DAY30_CHECKIN: { icon: '📞', label: 'Day-30 Check-in', color: theme.colors.agentCyan },
  DINING_DORMANCY: { icon: '🍷', label: 'Dining Nudge', color: theme.colors.navFb },
};

/**
 * Unified lookup — resolves an action type key from either enum.
 * Returns { icon, label, color } or a sensible fallback.
 */
export function resolveActionType(key) {
  if (!key) return { icon: '⚡', label: 'Action', color: '#6B7280' };
  // Check standard types first (kebab-case), then agent types (SCREAMING_SNAKE)
  if (ACTION_TYPES[key]) return ACTION_TYPES[key];
  if (AGENT_ACTION_TYPES[key]) return AGENT_ACTION_TYPES[key];
  // Normalize: try converting between conventions
  const asSnake = key.replace(/-/g, '_').toUpperCase();
  if (AGENT_ACTION_TYPES[asSnake]) return AGENT_ACTION_TYPES[asSnake];
  const asKebab = key.replace(/_/g, '-').toLowerCase();
  if (ACTION_TYPES[asKebab]) return ACTION_TYPES[asKebab];
  return { icon: '⚡', label: key.replace(/[_-]/g, ' '), color: '#6B7280' };
}

export const PLAYBOOK_HISTORY = {
  'service-save': [
    { quarter: 'Q4 2025', runs: 4, outcome: '3 of 4 at-risk members retained', retained: 3, impact: '$54K dues protected' },
    { quarter: 'Q3 2025', runs: 2, outcome: '2 of 2 at-risk members retained', retained: 2, impact: '$36K dues protected' },
  ],
  'new-member-90day': [
    { quarter: 'Q4 2025', runs: 8, outcome: '7 of 8 new members fully integrated by Day 90', retained: 7, impact: '$126K dues protected' },
    { quarter: 'Q3 2025', runs: 5, outcome: '4 of 5 new members fully integrated', retained: 4, impact: '$72K dues protected' },
  ],
  'engagement-decay': [
    { quarter: 'Q4 2025', runs: 1, outcome: '6 of 28 declining members recovered', retained: 6, impact: '$108K dues protected' },
  ],
  'staffing-gap': [
    { quarter: 'Q4 2025', runs: 8, outcome: '7 of 8 gaps filled before service degraded', retained: null, impact: '$8,400 revenue preserved' },
    { quarter: 'Q3 2025', runs: 5, outcome: '5 of 5 gaps filled', retained: null, impact: '$5,250 revenue preserved' },
  ],
};
