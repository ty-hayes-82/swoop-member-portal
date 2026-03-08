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
};

export const PLAYBOOK_HISTORY = {
  'slow-saturday': [
    { quarter: 'Q4 2025', runs: 3, outcome: 'Slow round rate: 32% → 17%', retained: null, impact: '+$24,100 revenue' },
    { quarter: 'Q3 2025', runs: 2, outcome: 'Slow round rate: 30% → 19%', retained: null, impact: '+$16,800 revenue' },
  ],
  'service-save': [
    { quarter: 'Q4 2025', runs: 4, outcome: '3 of 4 at-risk members retained', retained: 3, impact: '$54K dues protected' },
    { quarter: 'Q3 2025', runs: 2, outcome: '2 of 2 at-risk members retained', retained: 2, impact: '$36K dues protected' },
  ],
  'engagement-decay': [
    { quarter: 'Q4 2025', runs: 1, outcome: '6 of 28 declining members recovered', retained: 6, impact: '$108K dues protected' },
  ],
  'staffing-gap': [
    { quarter: 'Q4 2025', runs: 8, outcome: '7 of 8 gaps filled before service degraded', retained: null, impact: '$8,400 revenue preserved' },
    { quarter: 'Q3 2025', runs: 5, outcome: '5 of 5 gaps filled', retained: null, impact: '$5,250 revenue preserved' },
  ],
  'peak-demand-capture': [
    { quarter: 'Q4 2025', runs: 5, outcome: 'Waitlist fill rate: 61% → 88%; 3 at-risk members retained', retained: 3, impact: '+$31,000 revenue' },
    { quarter: 'Q3 2025', runs: 3, outcome: 'Waitlist fill rate: 58% → 82%; post-round conversion from fills: 22% → 39%', retained: null, impact: '+$18,600 revenue' },
  ],
};
