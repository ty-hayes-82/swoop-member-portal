import { theme } from '@/config/theme';

// config/navigation.js — decision-based GM navigation items
// Each entry declares sourceSystems for data provenance display
export const navItems = [
  {
    key: 'daily-briefing',
    label: 'Daily Briefing',
    icon: '📋',
    color: theme.colors.navBriefing,
    subtitle: 'What needs my attention today?',
    sourceSystems: ['ForeTees', 'Jonas POS', 'Northstar', 'ClubReady'],
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: '⌘',
    color: theme.colors.navOperations,
    subtitle: 'How is the golf operation running?',
    sourceSystems: ['ForeTees', 'Weather API'],
  },
  {
    key: 'waitlist-demand',
    label: 'Waitlist & Demand',
    icon: '⟳',
    color: theme.colors.navWaitlist,
    subtitle: 'Who is waiting, who will cancel, and what does it cost?',
    sourceSystems: ['ForeTees', 'Northstar', 'Jonas POS', 'Weather API'],
  },
  {
    key: 'fb-performance',
    label: 'Revenue & F&B',
    icon: '◆',
    color: theme.colors.navFb,
    subtitle: 'Where is money being made or lost?',
    sourceSystems: ['Jonas POS', 'ForeTees', 'Weather API'],
  },
  {
    key: 'member-health',
    label: 'Member Retention',
    icon: '◉',
    color: theme.colors.navMembers,
    subtitle: 'Who is at risk and what do we do?',
    sourceSystems: ['Northstar', 'Club Prophet', 'ForeTees'],
  },
  {
    key: 'staffing-service',
    label: 'Staffing & Service',
    icon: '⊞',
    color: theme.colors.navStaffing,
    subtitle: 'Are we staffed right and serving members well?',
    sourceSystems: ['ClubReady', 'Jonas POS', 'Northstar'],
  },
  {
    key: 'growth-pipeline',
    label: 'Growth Pipeline',
    icon: '◎',
    color: theme.colors.navPipeline,
    subtitle: 'Which guests are ready to become members?',
    sourceSystems: ['ForeTees', 'Club Prophet'],
  },
  {
    key: 'agent-command',
    label: 'Agent Command',
    icon: '⬡',
    color: theme.colors.navAgents,
    subtitle: 'AI agents working on your behalf — approve, dismiss, configure.',
    sourceSystems: ['All Systems'],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: '🔌',
    color: theme.colors.navIntegrations,
    subtitle: 'Connect your systems. Unlock intelligence.',
    sourceSystems: [],
  },
  {
    key: 'demo-mode',
    label: 'Demo Mode',
    icon: '▶',
    color: theme.colors.navDemo,
    subtitle: 'Guided walkthroughs for demos',
    sourceSystems: [],
    hidden: true, // Accessible via /#/demo-mode URL only — not shown in main nav
  },
];
export const NAV_ITEMS = navItems;
