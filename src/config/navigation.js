import { theme } from '@/config/theme';

// navItems — canonical navigation definitions + grouping
// Simplified architecture: INTELLIGENCE → REPORTING → SETTINGS
export const navItems = [
  // ============================================
  // INTELLIGENCE — Daily + Weekly Use (Tier 1 & 2)
  // ============================================
  {
    key: 'daily-briefing',
    label: 'Real-Time Cockpit',
    section: 'INTELLIGENCE',
    icon: '🎯',
    color: theme.colors.navBriefing,
    subtitle: 'Where is today breaking — before members feel it?',
    sourceSystems: ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Weather', 'Complaints'],
    badge: 'Daily Action View',
  },
  {
    key: 'actions',
    label: 'Actions',
    section: 'INTELLIGENCE',
    icon: '⚡',
    color: theme.colors.navAgents,
    subtitle: 'AI inbox, playbooks, agents, and outreach — one decision center.',
    sourceSystems: ['All Systems'],
  },
  {
    key: 'member-health',
    label: 'Member Risk',
    section: 'INTELLIGENCE',
    icon: '⚠️',
    color: theme.colors.navMembers,
    subtitle: 'Early Warning System — who\'s disengaging across multiple touchpoints?',
    sourceSystems: ['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email'],
    badge: 'Wedge Product',
  },
  {
    key: 'revenue-leakage',
    label: 'Revenue Leakage',
    section: 'INTELLIGENCE',
    icon: '💰',
    color: theme.colors.navFb,
    subtitle: 'Which operational failures are costing you F&B spend?',
    sourceSystems: ['POS', 'Tee Sheet', 'Scheduling', 'Weather'],
  },
  {
    key: 'experience-insights',
    label: 'Experience Insights',
    section: 'INTELLIGENCE',
    icon: '🔗',
    color: theme.colors.navMembers,
    subtitle: 'Which experiences drive retention — and which ones cost you members?',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Email', 'Complaints', 'Events'],
  },
  {
    key: 'waitlist-demand',
    label: 'Tee Sheet Demand',
    section: 'INTELLIGENCE',
    icon: '⟳',
    color: theme.colors.navWaitlist,
    subtitle: 'Who is waiting, who will cancel, and what does it cost?',
    sourceSystems: ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'],
  },
  // Hidden intelligence pages
  {
    key: 'staffing-service',
    label: 'Staffing & Service',
    section: 'INTELLIGENCE',
    icon: '👥',
    color: theme.colors.navStaffing,
    subtitle: 'Where are staffing gaps creating service risk right now?',
    sourceSystems: ['Scheduling', 'POS', 'Member CRM', 'Complaints'],
    hidden: true,
  },
  {
    key: 'location-intelligence',
    label: 'On-Property',
    section: 'INTELLIGENCE',
    icon: '📍',
    color: theme.colors.navOperations,
    subtitle: 'GPS behavior your tee sheet cannot see — know if members finish their round.',
    sourceSystems: ['Swoop App', 'Member CRM'],
    hidden: true,
  },

  // ============================================
  // FIX IT — Legacy (hidden, kept for backward compat)
  // ============================================
  {
    key: 'intervention-queue',
    label: 'Intervention Queue',
    section: 'FIX IT',
    icon: '📋',
    color: theme.colors.navAgents,
    subtitle: 'Pending member outreach and recovery tasks.',
    sourceSystems: ['Member CRM', 'Swoop App'],
    hidden: true,
  },
  {
    key: 'outreach-playbooks',
    label: 'Member Outreach',
    section: 'FIX IT',
    icon: '📨',
    color: theme.colors.navAgents,
    subtitle: 'Archetype-specific retention actions — personalized outreach the GM can customize.',
    sourceSystems: ['Member CRM', 'Analytics'],
    hidden: true,
  },
  {
    key: 'playbooks',
    label: 'Outreach Playbooks',
    section: 'FIX IT',
    icon: '📚',
    color: theme.colors.navAgents,
    subtitle: 'Step-by-step playbooks for service recovery, retention saves, and proactive outreach.',
    sourceSystems: ['Member CRM', 'Analytics'],
    hidden: true,
  },
  {
    key: 'agent-command',
    label: 'AI Agents',
    section: 'FIX IT',
    icon: '🤖',
    color: theme.colors.navAgents,
    subtitle: 'AI-recommended interventions with context — approve and track outcomes.',
    sourceSystems: ['All Systems'],
    hidden: true,
  },

  // ============================================
  // REPORTING — Board-Ready Evidence (Tier 3)
  // ============================================
  {
    key: 'board-report',
    label: 'Board Report',
    section: 'REPORTING',
    icon: '📊',
    color: theme.colors.navDemo,
    subtitle: 'Monthly executive summary — retention, revenue, and operational saves.',
    sourceSystems: ['All Systems'],
  },
  // Hidden reporting pages
  {
    key: 'attribution',
    label: 'Attribution',
    section: 'REPORTING',
    icon: '💵',
    color: theme.colors.navPipeline,
    subtitle: 'Dollars saved, members retained, revenue protected — connected to actions.',
    sourceSystems: ['All Systems'],
    hidden: true,
  },
  {
    key: 'historical-trends',
    label: 'Historical Trends',
    section: 'REPORTING',
    icon: '📈',
    color: theme.colors.navOperations,
    subtitle: '6-month performance comparisons across all metrics.',
    sourceSystems: ['All Systems'],
    hidden: true,
  },

  // ============================================
  // SETTINGS — Admin & Configuration (Tier 4, collapsed)
  // ============================================
  {
    key: 'integrations',
    label: 'Connected Systems',
    section: 'SETTINGS',
    icon: '🔌',
    color: theme.colors.navIntegrations,
    subtitle: 'Connect your systems. Unlock Layer 3 intelligence.',
    sourceSystems: [],
  },
  {
    key: 'integrations/csv-import',
    label: 'Data Upload',
    section: 'SETTINGS',
    icon: '⬇️',
    color: theme.colors.navIntegrations,
    subtitle: 'Upload CSV/XLSX when APIs are missing.',
    sourceSystems: [],
  },
  {
    key: 'data-model',
    label: 'Data Model',
    section: 'SETTINGS',
    icon: '🗂️',
    color: theme.colors.navIntegrations,
    subtitle: 'Browse tables, columns, and relationships in your Postgres schema.',
    sourceSystems: ['Postgres'],
    hidden: true,
  },
  {
    key: 'storyboard-flows',
    label: 'Playbook Guides',
    section: 'SETTINGS',
    icon: '📖',
    color: theme.colors.navOperations,
    subtitle: 'How your team uses Swoop — interactive guides from signal to action to proof.',
    sourceSystems: ['All Systems'],
  },
  // Hidden settings/admin pages
  {
    key: 'member-profile',
    label: 'Member Profiles',
    section: 'SETTINGS',
    icon: '👤',
    color: theme.colors.navMembers,
    subtitle: 'Full member dossier with history, family, preferences, and invoices.',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Analytics'],
    hidden: true,
  },
  {
    key: 'demo-mode',
    label: 'Demo Mode',
    section: 'SETTINGS',
    icon: '▶',
    color: theme.colors.navDemo,
    subtitle: 'Guided walkthroughs for demos',
    sourceSystems: [],
    hidden: true,
  },
];

export const NAV_ITEMS = navItems;
