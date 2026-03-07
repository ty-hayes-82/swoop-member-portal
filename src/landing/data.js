import { theme } from '@/config/theme';

export const problemCards = [
  'You have 5 disconnected systems. Zero connected intelligence.',
  "You know something is wrong. You just can't see it until it's too late.",
  'James Whitfield complained. No one followed up. He resigned. $24K gone in 4 days.',
];

export const lenses = [
  {
    icon: 'Users',
    title: 'Member Intelligence',
    color: theme.colors.lensMemberIntelligence,
    description:
      'Surface changing engagement behavior before it turns into churn risk. Prioritize interventions by member value and relationship sensitivity.',
  },
  {
    icon: 'Calendar',
    title: 'Tee Sheet & Demand',
    color: theme.colors.lensTeeSheetDemand,
    description:
      'Predict cancellations and backfill each open slot with the right member. Optimize pace and demand signals without overbooking guesswork.',
  },
  {
    icon: 'Utensils',
    title: 'F&B Operations',
    color: theme.colors.lensFbOperations,
    description:
      'Connect golf flow, weather, and reservations to outlet demand in real time. Shift prep and staffing before service degrades.',
  },
  {
    icon: 'UsersRound',
    title: 'Staffing & Labor',
    color: theme.colors.lensStaffingLabor,
    description:
      'Tie labor coverage to predicted demand across golf and clubhouse touchpoints. Catch understaffed windows early enough to avoid member friction.',
  },
  {
    icon: 'DollarSign',
    title: 'Revenue & Pipeline',
    color: theme.colors.lensRevenuePipeline,
    description:
      'Track revenue opportunities and risks from lead to retained member. Prove which actions moved conversion, spend, and renewal outcomes.',
  },
];

export const comparisonFeatures = [
  {
    feature: 'Member churn prediction',
    swoop: true,
    noteefy: false,
    crm: false,
    sheets: false,
  },
  {
    feature: 'Retention-prioritized waitlist',
    swoop: true,
    noteefy: true,
    crm: false,
    sheets: false,
  },
  {
    feature: 'Cross-lens analytics',
    swoop: true,
    noteefy: false,
    crm: false,
    sheets: false,
  },
  {
    feature: 'AI agent automation',
    swoop: true,
    noteefy: false,
    crm: false,
    sheets: false,
  },
  {
    feature: 'Real-time behavioral data',
    swoop: true,
    noteefy: true,
    crm: false,
    sheets: false,
  },
  {
    feature: 'Closed-loop engagement',
    swoop: true,
    noteefy: false,
    crm: false,
    sheets: false,
  },
];

export const agents = [
  {
    icon: 'Radar',
    name: 'Demand Sentinel',
    description: 'Flags demand swings by segment and recommends inventory moves before losses compound.',
  },
  {
    icon: 'RefreshCw',
    name: 'Waitlist Optimizer',
    description: 'Reorders waitlists by retention value and match-fit, then auto-notifies best-fit members.',
  },
  {
    icon: 'UserRound',
    name: 'Member Save Agent',
    description: 'Detects service-risk members and triggers personalized save sequences for GM follow-up.',
  },
  {
    icon: 'ChefHat',
    name: 'F&B Flow Agent',
    description: 'Predicts rushes from tee sheet and weather signals to adjust outlet prep and staffing.',
  },
  {
    icon: 'UsersRound',
    name: 'Labor Planner',
    description: 'Forecasts coverage gaps and recommends shifts to protect service level and margin.',
  },
  {
    icon: 'LineChart',
    name: 'Revenue Analyst',
    description: 'Attribution-ready insights connect actions to recovered revenue and retained annual value.',
  },
];

export const integrationCategories = [
  { label: 'Tee Sheet & Booking', systems: 4 },
  { label: 'Member CRM', systems: 3 },
  { label: 'POS & F&B', systems: 5 },
  { label: 'Communications', systems: 4 },
  { label: 'Staffing & Payroll', systems: 3 },
  { label: 'Finance & BI', systems: 4 },
  { label: 'Web & Lead Capture', systems: 2 },
  { label: 'Access & Activity', systems: 3 },
];

export const testimonials = [
  {
    club: 'Ridgeview Country Club, Dallas TX',
    quote:
      'Swoop surfaced three resignations-in-progress we would have missed. We retained two and recovered six figures in annual dues value.',
    author: 'Elena Vasquez, General Manager',
    metricLabel: 'Annual dues at risk recovered',
    metricValue: '$186K',
  },
  {
    club: 'Stonebridge Golf & Lake Club, Naples FL',
    quote:
      'The retention-prioritized waitlist changed how we fill late openings. Members feel seen, and our tee sheet now protects relationships and revenue.',
    author: 'Michael Carver, General Manager',
    metricLabel: 'Waitlist fill conversion lift',
    metricValue: '+31%',
  },
  {
    club: 'Cedar Point Club, Charlotte NC',
    quote:
      'For the first time, we can prove which interventions changed outcomes. The board finally sees analytics tied to member experience and dollars.',
    author: 'Priya Natarajan, General Manager',
    metricLabel: 'Churn-risk members retained',
    metricValue: '14 in 90 days',
  },
];
