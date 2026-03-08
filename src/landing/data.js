import { theme } from '@/config/theme';

export const problemCards = [
  'You have 5 disconnected systems. Zero connected intelligence.',
  "You know something is wrong. You just can't see it until it's too late.",
  'James Whitfield complained. No one followed up. He resigned. $24K gone in 4 days.',
];

export const coreCapabilities = [
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
    waitlistTools: false,
    crm: 'partial',
    sheets: false,
  },
  {
    feature: 'Retention-prioritized waitlist',
    swoop: true,
    waitlistTools: 'partial',
    crm: false,
    sheets: false,
  },
  {
    feature: 'Cross-system analytics',
    swoop: true,
    waitlistTools: 'partial',
    crm: 'partial',
    sheets: false,
  },
  {
    feature: 'AI agent automation',
    swoop: true,
    waitlistTools: false,
    crm: false,
    sheets: false,
  },
  {
    feature: 'Real-time behavioral data',
    swoop: true,
    waitlistTools: 'partial',
    crm: 'partial',
    sheets: false,
  },
  {
    feature: 'Closed-loop engagement',
    swoop: true,
    waitlistTools: true,
    crm: 'partial',
    sheets: false,
  },
];

export const agents = [
  {
    icon: 'UserRound',
    name: 'Member Pulse',
    description: 'Detects early churn signals and proposes interventions before members disengage.',
  },
  {
    icon: 'Radar',
    name: 'Demand Optimizer',
    description: 'Balances waitlist demand, cancellation prediction, and tee sheet fill optimization.',
  },
  {
    icon: 'ChefHat',
    name: 'Service Recovery',
    description: 'Surfaces unresolved complaints and drafts recovery actions before resignation windows close.',
  },
  {
    icon: 'UsersRound',
    name: 'Labor Optimizer',
    description: 'Forecasts staffing gaps and recommends coverage shifts to protect service quality and margin.',
  },
  {
    icon: 'LineChart',
    name: 'Revenue Analyst',
    description: 'Flags preventable revenue leakage and recommends high-confidence margin actions.',
  },
  {
    icon: 'RefreshCw',
    name: 'Engagement Autopilot',
    description: 'Monitors declining participation and proposes targeted outreach for member reactivation.',
  },
];

export const integrationCategories = [
  { label: 'Tee Sheet & Booking', systems: 4, description: 'Leading tee sheet platforms' },
  { label: 'Member CRM', systems: 3, description: 'Club management systems' },
  { label: 'POS & F&B', systems: 5, description: 'Point-of-sale platforms' },
  { label: 'Communications', systems: 4, description: 'Email & SMS providers' },
  { label: 'Staffing & Payroll', systems: 3, description: 'Payroll & scheduling platforms' },
  { label: 'Finance & BI', systems: 4, description: 'Accounting & analytics tools' },
  { label: 'Web & Lead Capture', systems: 2, description: 'Marketing & CRM platforms' },
  { label: 'Access & Activity', systems: 3, description: 'Access control systems' },
];

export const foundingPartnerBenefits = [
  {
    title: 'Hands-on Onboarding',
    description:
      'Our team configures your integrations, trains your staff, and validates your data in the first 2 weeks.',
  },
  {
    title: 'Shape the Roadmap',
    description:
      'Monthly calls with our product team. Your feature requests get priority. Your workflows drive development.',
  },
  {
    title: 'Locked-in Pricing',
    description:
      'Founding partners keep their launch rate for life, even as the platform grows and pricing increases.',
  },
];

export const objections = [
  {
    question: 'Why not just use a standalone waitlist tool?',
    answer:
      "Standalone waitlist tools fill cancelled slots — one function from one data source. Swoop gives you cross-system intelligence: which members to prioritize, what their dining and engagement patterns predict, and how to close the loop with personalized outreach. Waitlist software is a feature. Swoop is the operating layer.",
  },
  {
    question: 'Why not just use my CRM reports?',
    answer:
      "Your CRM stores records. Swoop connects records across systems — tee sheet, POS, member engagement, staffing — and turns the gaps between them into actionable intelligence. A CRM tells you who resigned. Swoop tells you who's about to.",
  },
  {
    question: 'Why not build dashboards in Excel?',
    answer:
      "You can build a dashboard. You can't build prediction. Swoop's AI agents monitor behavioral signals in real time and recommend interventions before problems become resignations. Spreadsheets report the past. Swoop protects the future.",
  },
];

export const pricingTiers = [
  {
    name: 'Free — Health Scores',
    price: '$0/mo',
    description:
      'Connect your existing systems. See member health scores and basic risk alerts powered by integration data alone.',
    features: [
      'Health score dashboard',
      'Basic risk alerts',
      'Up to 3 system integrations',
      'Email support',
    ],
    cta: 'Start Free',
  },
  {
    name: 'Pro — Intelligence Dashboard',
    price: '$499/mo',
    badge: 'Most Popular',
    description:
      'Full platform access with cross-system intelligence. Optional member app integration for richer behavioral data.',
    features: [
      'Complete platform access',
      'Cross-system intelligence',
      'AI agent recommendations',
      'Up to 10 integrations',
      'Priority support',
    ],
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Club — Full Platform',
    price: '$1,499/mo',
    description:
      'Everything in Pro plus the Swoop member app, GPS behavioral data, push notifications, and closed-loop engagement.',
    features: [
      'Everything in Pro',
      'Swoop member app included',
      'GPS + real-time behavioral data',
      'Push notification channel',
      'Closed-loop engagement tracking',
      'Dedicated success manager',
    ],
    cta: 'Book a Demo',
  },
];

export const faqItems = [
  {
    question: 'How long does setup take?',
    answer:
      'Most clubs are live in under 2 weeks. We connect to your existing tee sheet, POS, and CRM — no rip-and-replace required.',
  },
  {
    question: 'Do I need to replace my current software?',
    answer:
      'No. Swoop sits on top of your existing systems and connects via API. We support 28 integrations across 10 categories.',
  },
  {
    question: "What if I don't have a tee sheet system?",
    answer:
      "You can still use Swoop's member intelligence, F&B, and staffing capabilities with manual data entry or CSV import. Tee sheet analytics activate when you connect a supported booking system.",
  },
  {
    question: "Is my members' data secure?",
    answer:
      'Yes. All data is encrypted in transit and at rest. We never share member data with third parties. SOC 2 compliance is on our roadmap.',
  },
  {
    question: 'Can I try it before committing?',
    answer:
      'Absolutely. Our Free tier gives you health scores with no credit card required. Pro includes a 14-day trial.',
  },
  {
    question: 'What makes Swoop different from standalone waitlist tools?',
    answer:
      'Standalone waitlist tools fill cancelled tee times — one function, one system. Swoop is a full intelligence platform that connects members, demand, service, labor, and revenue with AI agents, behavioral data, and closed-loop engagement. Waitlist software is a feature; Swoop is the operating layer.',
  },
];
