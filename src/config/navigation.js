import { theme } from '@/config/theme';

// navItems — canonical navigation definitions + grouping
// MVP Navigation: exactly 7 primary items, survey-validated
// All old route keys kept as hidden entries for backward compat + Header metadata
export const navItems = [
  // ============================================
  // PRIMARY — The 5 MVP nav items (V3 realignment)
  // ============================================
  {
    key: 'today',
    label: 'Today',
    section: 'PRIMARY',
    icon: '🎯',
    color: theme.colors.navBriefing,
    subtitle: 'Morning cockpit: operations, service, members, and what needs your attention.',
    sourceSystems: ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Weather', 'Complaints'],
  },
  {
    key: 'members',
    label: 'Members',
    section: 'PRIMARY',
    icon: '👥',
    color: theme.colors.navMembers,
    subtitle: 'Member intelligence: who needs attention, why, and what to do.',
    sourceSystems: ['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email'],
  },
  {
    key: 'tee-sheet',
    label: 'Tee Sheet',
    section: 'PRIMARY',
    icon: '🏌️',
    color: theme.colors.navOperations,
    subtitle: "Today's bookings, at-risk golfers, and cart prep recommendations.",
    sourceSystems: ['Tee Sheet', 'Member CRM', 'Weather', 'POS'],
  },
  {
    key: 'service',
    label: 'Service',
    section: 'PRIMARY',
    icon: '⚙️',
    color: theme.colors.navOperations,
    subtitle: 'Service quality, staffing intelligence, and complaint patterns.',
    sourceSystems: ['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather'],
  },
  {
    key: 'revenue',
    label: 'Revenue',
    section: 'PRIMARY',
    icon: '💰',
    color: theme.colors.navFb,
    subtitle: 'Revenue leakage decomposition, scenario modeling, and board-ready attribution.',
    sourceSystems: ['Tee Sheet', 'POS', 'Scheduling', 'Weather'],
  },
  {
    key: 'automations',
    label: 'Automations',
    section: 'PRIMARY',
    icon: '⚡',
    color: theme.colors.navBriefing,
    subtitle: 'AI agents, action inbox, and automated playbooks.',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Scheduling', 'Email'],
  },
  {
    key: 'board-report',
    label: 'Board Report',
    section: 'PRIMARY',
    icon: '📊',
    color: theme.colors.navDemo,
    subtitle: 'Monthly executive summary — service quality, member health, and impact.',
    sourceSystems: ['All Systems'],
  },
  {
    key: 'admin',
    label: 'Admin',
    section: 'PRIMARY',
    icon: '⚙️',
    color: theme.colors.navIntegrations,
    subtitle: 'Integrations and data health monitoring.',
    sourceSystems: ['Postgres'],
  },
  // Hidden routes (insights, actions)
  {
    key: 'insights',
    label: 'Insights',
    section: 'HIDDEN',
    icon: '🔗',
    color: theme.colors.navMembers,
    subtitle: 'Experience insights — redirects to Service.',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Email', 'Complaints', 'Events'],
    hidden: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    section: 'HIDDEN',
    icon: '⚡',
    color: theme.colors.navAgents,
    subtitle: 'Pending actions — accessible via sidebar drawer.',
    sourceSystems: ['All Systems'],
    hidden: true,
  },

  // ============================================
  // HIDDEN — V3 Phase 5: minimal set for Header metadata + direct nav
  // All legacy routes redirect via NavigationContext.ROUTE_REDIRECTS
  // ============================================
  {
    key: 'member-profile',
    label: 'Member Profiles',
    section: 'HIDDEN',
    icon: '👤',
    color: theme.colors.navMembers,
    subtitle: 'Full member dossier with history, family, preferences, and invoices.',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Analytics'],
    hidden: true,
  },
  {
    key: 'playbooks',
    label: 'Playbooks',
    section: 'HIDDEN',
    icon: '📋',
    color: theme.colors.navAgents,
    subtitle: 'Automated protocols for service recovery, engagement, and new member success.',
    sourceSystems: ['Member CRM', 'Tee Sheet', 'Complaints'],
    hidden: true,
  },
];

export const NAV_ITEMS = navItems;
