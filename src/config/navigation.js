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
    subtitle: 'Morning cockpit: risks, members, and pending actions.',
    sourceSystems: ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Weather', 'Complaints'],
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
    key: 'members',
    label: 'Member Health',
    section: 'PRIMARY',
    icon: '👥',
    color: theme.colors.navMembers,
    subtitle: 'Members needing attention, health scores, and member directory.',
    sourceSystems: ['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email'],
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
  // Moved to HIDDEN (V3): revenue, insights, actions
  {
    key: 'revenue',
    label: 'Revenue',
    section: 'HIDDEN',
    icon: '💰',
    color: theme.colors.navFb,
    subtitle: 'Revenue signals — redirects to Service.',
    sourceSystems: ['POS', 'Tee Sheet', 'Scheduling', 'Weather'],
    hidden: true,
  },
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
];

export const NAV_ITEMS = navItems;
