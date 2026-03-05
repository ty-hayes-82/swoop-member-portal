// config/navigation.js — decision-based GM navigation items
// Each entry declares sourceSystems for data provenance display
export const navItems = [
  {
    key: 'daily-briefing',
    label: 'Daily Briefing',
    icon: '📋',
    color: '#6BB8EF',
    subtitle: 'What needs my attention today?',
    sourceSystems: ['ForeTees', 'Jonas POS', 'Northstar', 'ClubReady'],
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: '⌘',
    color: '#4ADE80',
    subtitle: 'How is the golf operation running?',
    sourceSystems: ['ForeTees', 'Weather API'],
  },
  {
    key: 'fb-performance',
    label: 'Revenue & F&B',
    icon: '◆',
    color: '#F0C674',
    subtitle: 'Where is money being made or lost?',
    sourceSystems: ['Jonas POS', 'ForeTees', 'Weather API'],
  },
  {
    key: 'member-health',
    label: 'Member Retention',
    icon: '◉',
    color: '#A78BFA',
    subtitle: 'Who is at risk and what do we do?',
    sourceSystems: ['Northstar', 'Club Prophet', 'ForeTees'],
  },
  {
    key: 'staffing-service',
    label: 'Staffing & Service',
    icon: '⊞',
    color: '#F59E0B',
    subtitle: 'Are we staffed right and serving members well?',
    sourceSystems: ['ClubReady', 'Jonas POS', 'Northstar'],
  },
  {
    key: 'growth-pipeline',
    label: 'Growth Pipeline',
    icon: '◎',
    color: '#F472B6',
    subtitle: 'Which guests are ready to become members?',
    sourceSystems: ['ForeTees', 'Club Prophet'],
  },
  {
    key: 'demo-mode',
    label: 'Demo Mode',
    icon: '▶',
    color: '#F0C674',
    subtitle: 'Guided walkthroughs for demos',
    sourceSystems: [],
  },
];
export const NAV_ITEMS = navItems;
