import { theme } from '@/config/theme';

// navItems - canonical navigation definitions + grouping (Layer 3 Intelligence Framework)
// Organized around the three critical questions that define Layer 3 value
export const navItems = [
  // ============================================
  // SEE IT - The Three Critical Questions
  // ============================================
  {
    key: 'daily-briefing',
    label: 'Real-Time Cockpit',
    section: 'SEE IT',
    icon: '🎯',
    color: theme.colors.navBriefing,
    subtitle: 'Where is today breaking - before members feel it?',
    sourceSystems: ['Tee Sheet', 'POS', 'Member CRM', 'Scheduling', 'Weather', 'Complaints'],
    badge: 'Daily Action View',
  },
  {
    key: 'member-health',
    label: 'Member Risk',
    section: 'SEE IT',
    icon: '⚠️',
    color: theme.colors.navMembers,
    subtitle: 'Early Warning System - who\'s disengaging across multiple touchpoints?',
    sourceSystems: ['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email'],
    badge: 'Wedge Product',
  },
  {
    key: 'revenue-leakage',
    label: 'Revenue Leakage',
    section: 'SEE IT',
    icon: '💰',
    color: theme.colors.navFb,
    subtitle: 'Which operational failures are costing you F&B spend?',
    sourceSystems: ['POS', 'Tee Sheet', 'Scheduling', 'Weather'],
    badge: 'NEW',
  },
  {
    key: 'experience-insights',
    label: 'Experience Insights',
    section: 'SEE IT',
    icon: '🔗',
    color: theme.colors.navMembers,
    subtitle: 'Which experiences drive retention — and which ones cost you members?',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Email', 'Complaints', 'Events'],
    badge: 'NEW',
  },
  {
    key: 'staffing-service',
    label: 'Staffing & Service',
    section: 'SEE IT',
    icon: '👥',
    color: theme.colors.navStaffing,
    subtitle: 'Where are staffing gaps creating service risk right now?',
    sourceSystems: ['Scheduling', 'POS', 'Member CRM', 'Complaints'],
    hidden: true,
  },
  {
    key: 'waitlist-demand',
    label: 'Tee Sheet Demand',
    section: 'SEE IT',
    icon: '⟳',
    color: theme.colors.navWaitlist,
    subtitle: 'Who is waiting, who will cancel, and what does it cost?',
    sourceSystems: ['Tee Sheet', 'Member CRM', 'POS', 'Weather API'],
  },
  {
    key: 'location-intelligence',
    label: 'On-Property',
    section: 'SEE IT',
    icon: '📍',
    color: theme.colors.navOperations,
    subtitle: 'GPS behavior your tee sheet cannot see - know if members finish their round.',
    sourceSystems: ['Swoop App', 'Member CRM'],
    hidden: true,
  },

  // ============================================
  // FIX IT - Intelligent Actions
  // ============================================
  {
    key: 'agent-command',
    label: 'Intelligent Actions',
    section: 'FIX IT',
    icon: '🤖',
    color: theme.colors.navAgents,
    subtitle: 'AI-recommended interventions with context - approve and track outcomes.',
    sourceSystems: ['All Systems'],
  },
  {
    key: 'intervention-queue',
    label: 'Intervention Queue',
    section: 'FIX IT',
    icon: '📋',
    color: theme.colors.navAgents,
    subtitle: 'Pending member outreach and recovery tasks.',
    sourceSystems: ['Member CRM', 'Swoop App'],
    hidden: true, // TODO: Implement this page
  },
  {
    key: 'outreach-playbooks',
    label: 'Member Outreach',
    section: 'FIX IT',
    icon: '\uD83D\uDCE8',
    color: theme.colors.navAgents,
    subtitle: 'Archetype-specific retention actions \u2014 personalized outreach the GM can customize.',
    sourceSystems: ['Member CRM', 'Analytics'],
  },
  {
    key: 'playbooks',
    label: 'Outreach Playbooks',
    section: 'FIX IT',
    icon: '📚',
    color: theme.colors.navAgents,
    subtitle: 'Step-by-step playbooks for service recovery, retention saves, and proactive outreach.',
    sourceSystems: ['Member CRM', 'Analytics'],
  },

  // ============================================
  // PROVE IT - Board-Ready Evidence
  // ============================================
  {
    key: 'board-report',
    label: 'Board Report',
    section: 'PROVE IT',
    icon: '📊',
    color: theme.colors.navDemo,
    subtitle: 'Monthly executive summary - retention, revenue, and operational saves.',
    sourceSystems: ['All Systems'],
  },
  {
    key: 'attribution',
    label: 'Attribution',
    section: 'PROVE IT',
    icon: '💵',
    color: theme.colors.navPipeline,
    subtitle: 'Dollars saved, members retained, revenue protected - connected to actions.',
    sourceSystems: ['All Systems'],
    hidden: true, // TODO: Implement this page
  },
  {
    key: 'historical-trends',
    label: 'Historical Trends',
    section: 'PROVE IT',
    icon: '📈',
    color: theme.colors.navOperations,
    subtitle: '6-month performance comparisons across all metrics.',
    sourceSystems: ['All Systems'],
    hidden: true, // TODO: Implement this page
  },

  // ============================================
  // SETUP - Configuration & Data
  // ============================================
  {
    key: 'integrations',
    label: 'Connected Systems',
    section: 'SETUP',
    icon: '🔌',
    color: theme.colors.navIntegrations,
    subtitle: 'Connect your systems. Unlock Layer 3 intelligence.',
    sourceSystems: [],
  },
  {
    key: 'integrations/csv-import',
    label: 'Data Upload',
    section: 'SETUP',
    icon: '⬇️',
    color: theme.colors.navIntegrations,
    subtitle: 'Upload CSV/XLSX when APIs are missing.',
    sourceSystems: [],
    hidden: false,
  },
  {
    key: 'data-model',
    label: 'Data Model',
    section: 'SETUP',
    icon: '🗂️',
    color: theme.colors.navIntegrations,
    subtitle: 'Browse tables, columns, and relationships in your Postgres schema.',
    sourceSystems: ['Postgres'],
    hidden: false,
  },
  {
    key: 'member-profile',
    label: 'Member Profiles',
    section: 'SETUP',
    icon: '👤',
    color: theme.colors.navMembers,
    subtitle: 'Full member dossier with history, family, preferences, and invoices.',
    sourceSystems: ['Member CRM', 'POS', 'Tee Sheet', 'Analytics'],
    hidden: true,
  },
  {
    key: 'demo-mode',
    label: 'Demo Mode',
    section: 'SETUP',
    icon: '▶',
    color: theme.colors.navDemo,
    subtitle: 'Guided walkthroughs for demos',
    sourceSystems: [],
    hidden: true,
  },
];

export const NAV_ITEMS = navItems;
