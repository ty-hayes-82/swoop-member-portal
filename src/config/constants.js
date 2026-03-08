export const CLUB_NAME = 'Oakmont Hills CC';
export const CLUB_LOCATION = 'Scottsdale, AZ';
export const DEMO_DATE = '2026-01-17';
export const DEMO_MONTH = 'January 2026';

export const SLOW_ROUND_THRESHOLD_MIN = 270; // 4:30 for 18 holes
export const POST_ROUND_WINDOW_MIN = 90;
export const HEALTH_THRESHOLDS = {
  healthy:  70,
  watch:    50,
  atRisk:   30,
  critical:  0,
};

export const PLAYBOOK_IDS = {
  slowSaturday:      'slow-saturday',
  serviceSave:       'service-save',
  engagementDecay:   'engagement-decay',
  staffingGap:       'staffing-gap',
  peakDemand:        'peak-demand-capture',
  PEAK_DEMAND:       'peak-demand-capture',
};

export const UNDERSTAFFED_DATES = ['2026-01-09', '2026-01-16', '2026-01-28'];

export const AGENT_IDS = {
  CHIEF_OF_STAFF:      'chief-of-staff',
  SERVICE_RECOVERY:    'service-recovery',
  STAFFING_OPTIMIZER:  'staffing-optimizer',
  RETENTION_SENTINEL:  'retention-sentinel',
  PIPELINE_NURTURE:    'pipeline-nurture',
  PLAN_ORCHESTRATOR:   'plan-orchestrator',
};

export const AGENT_ACTION_TYPES = {
  DRAFT_NOTE:    { icon: '✉️', label: 'Draft Personal Note',   color: '#6BB8EF' },
  ALERT_STAFF:   { icon: '📣', label: 'Alert Staff',           color: '#F59E0B' },
  SCHEDULE_CALL: { icon: '📅', label: 'Schedule Call',         color: '#A78BFA' },
  ADJUST_STAFF:  { icon: '⊞',  label: 'Adjust Staffing',      color: '#F59E0B' },
  SEND_INVITE:   { icon: '⛳', label: 'Send Tee Time Invite',  color: '#4ADE80' },
  ESCALATE:      { icon: '⚠️', label: 'Escalate to GM',       color: '#C0392B' },
};

export const ROUTES = {
  BRIEFING:   'briefing',
  OPERATIONS: 'operations',
  FB:         'fb-performance',
  MEMBERS:    'member-health',
  STAFFING:   'staffing-service',
  PIPELINE:   'growth-pipeline',
  DEMO:       'demo-mode',
};
