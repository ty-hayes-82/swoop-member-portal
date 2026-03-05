// actionTypes.js — all playbook action type definitions
// Each step in a playbook declares one of these types for icon + color display

export const ACTION_TYPES = {
  'email':           { icon: '✉',  label: 'Email',          color: '#6BB8EF' },
  'staff-alert':     { icon: '📢', label: 'Staff Alert',     color: '#F59E0B' },
  'front-desk-flag': { icon: '🚩', label: 'Front Desk Flag', color: '#A78BFA' },
  'comp-offer':      { icon: '🎁', label: 'Comp Offer',      color: '#4ADE80' },
  'report':          { icon: '📊', label: 'Report',          color: '#8BAF8B' },
  'calendar':        { icon: '📅', label: 'Schedule Update', color: '#F472B6' },
  'dispatch':        { icon: '📡', label: 'Dispatch',        color: '#22C55E' },
  'schedule':        { icon: '📋', label: 'Tee Sheet',       color: '#F0C674' },
  'outreach':        { icon: '📣', label: 'Outreach',        color: '#22D3EE' },
  'track':           { icon: '📈', label: 'Track',           color: '#A78BFA' },
};

// Simulated history records for each playbook — what happened last time it ran
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
