// data/integrations.js — Full vendor catalog, categories, and combo insights
// Phase 2 swap: integrationsService.js fetches from /api/integrations instead
// Data flow: this file → integrationsService.js → Integrations.jsx

// ── Category definitions (10 strategic categories) ───────────────────────────
export const CATEGORIES = [
  { id: 'tee-sheet',       label: 'Tee Sheet',        icon: '⛳', themeColor: 'operations' },
  { id: 'member-crm',      label: 'Member CRM',        icon: '★',  themeColor: 'members'    },
  { id: 'fb-pos',          label: 'F&B / POS',         icon: '🍽', themeColor: 'fb'         },
  { id: 'staffing',        label: 'Staff Scheduling',  icon: '📅', themeColor: 'staffing'   },
  { id: 'dynamic-pricing', label: 'Dynamic Pricing',   icon: '💹', themeColor: 'operations' },
  { id: 'waitlist',        label: 'Waitlist & Demand', icon: '🔔', themeColor: 'pipeline'   },
  { id: 'pace-hardware',   label: 'Pace / On-Course',  icon: '🚗', themeColor: 'operations' },
  { id: 'events',          label: 'Tournaments',       icon: '🏆', themeColor: 'pipeline'   },
  { id: 'communications',  label: 'Member Comms',      icon: '✉',  themeColor: 'members'    },
  { id: 'cx-feedback',     label: 'CX & Feedback',     icon: '⭐', themeColor: 'members'    },
];

// ── Full vendor catalog (28 vendors across 10 categories) ────────────────────
// tier: 1 = Priority | 2 = Standard | 3 = Roadmap
// status: 'connected' | 'available' | 'coming_soon'
export const VENDORS = [

  // ── Tee Sheet ──────────────────────────────────────────────────────────────
  {
    id: 'foretees', name: 'ForeTees', categoryId: 'tee-sheet', tier: 1,
    icon: '⛳', themeColor: 'operations', status: 'connected', lastSync: '4 min ago', goLive: '3-5 days',
    why: "Dominant private club tee sheet. Used by 26 of Golf Digest's Top 100. Round completions, pace data, and booking players all flow from here.",
    partners: ['ForeTees', 'EZLinks', 'Golf Genius'],
    description: 'Tee sheet reservations, pace of play, booking players, and round completion data.',
  },
  {
    id: 'nbc-ezlinks', name: 'NBC Sports Next / EZLinks', categoryId: 'tee-sheet', tier: 1,
    icon: '⛳', themeColor: 'operations', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Powers 11,000+ courses in 40+ countries. The gateway to daily-fee and resort operators if Swoop expands beyond private clubs.',
    partners: ['GolfNow', 'EZLinks', 'NBC Sports Next'],
    description: 'Tee time distribution, dynamic pricing, and booking engine for daily-fee and resort properties.',
  },
  {
    id: 'club-caddie', name: 'Club Caddie', categoryId: 'tee-sheet', tier: 2,
    icon: '⛳', themeColor: 'operations', status: 'available', lastSync: null, goLive: '5-7 days',
    why: "Azure-hosted, module-based, formal partner ecosystem. Strong mid-market daily-fee coverage that ForeTees doesn't reach.",
    partners: ['Club Caddie', 'Lightspeed', 'GolfNow'],
    description: 'All-in-one tee sheet, POS, and booking engine for daily-fee and multi-course operators.',
  },
  {
    id: 'foreup', name: 'foreUP', categoryId: 'tee-sheet', tier: 2,
    icon: '⛳', themeColor: 'operations', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Cloud POS + dashboards. Complements Club Caddie in the daily-fee segment - together they cover the non-private-club market.',
    partners: ['foreUP', 'GolfNow', 'Golf Genius'],
    description: 'Cloud tee sheet, POS, and analytics dashboards for daily-fee courses.',
  },

  // ── Member CRM ─────────────────────────────────────────────────────────────
  {
    id: 'northstar', name: 'Northstar', categoryId: 'member-crm', tier: 1,
    icon: '★', themeColor: 'members', status: 'connected', lastSync: '12 min ago', goLive: '5-7 days',
    why: '~14% US private club market share. Serves The NY Athletic Club, Harvard Club. All-in-one Nexus platform: accounting + member + F&B in one database.',
    partners: ['Northstar Club Management', 'Clubessential', 'Jonas Club Software', 'MembersFirst'],
    description: 'Member profiles, dues, household relationships, membership types, and churn data.',
  },
  {
    id: 'jonas-crm', name: 'Jonas Club Software', categoryId: 'member-crm', tier: 1,
    icon: '★', themeColor: 'members', status: 'available', lastSync: null, goLive: '7-10 days',
    why: "~36% US private club market share - the single most important integration for private club GMs. Constellation-owned: stable, long-tenured, won't disappear.",
    partners: ['Jonas Club Software', 'MembersFirst', 'ClubHouse Online'],
    description: 'Club accounting, member management, POS, and engagement platform for private clubs.',
  },
  {
    id: 'clubessential', name: 'Clubessential', categoryId: 'member-crm', tier: 1,
    icon: '★', themeColor: 'members', status: 'available', lastSync: null, goLive: '7-10 days',
    why: '~18% US share. PE-backed, building embedded payments + Club Intelligence analytics. Integrating here layers Swoop AI on top of rich CRM data.',
    partners: ['Clubessential', 'Golf Genius', 'Yellow Dog', 'AvidXchange'],
    description: 'Membership, reservations, mobile ordering, CRM, analytics, and payments for private clubs.',
  },
  {
    id: 'clubprophet', name: 'Club Prophet', categoryId: 'member-crm', tier: 2,
    icon: '◉', themeColor: 'briefing', status: 'available', lastSync: null, goLive: '5-7 days',
    why: "Strong mid-market membership financials. F&B minimums, account balances, and prospect pipeline connect to Swoop's Growth Pipeline lens.",
    partners: ['Club Prophet', 'Northstar', 'Clubessential HQ'],
    description: 'Membership financials, F&B minimums, account balances, and prospect pipeline.',
  },

  // ── F&B / POS ──────────────────────────────────────────────────────────────
  {
    id: 'jonas', name: 'Jonas POS', categoryId: 'fb-pos', tier: 1,
    icon: '🍽', themeColor: 'fb', status: 'connected', lastSync: '2 min ago', goLive: '3-5 days',
    why: 'Same vendor as the member CRM. One connection - two lenses of data. POS checks, line items, ticket times, and F&B minimums all flow here.',
    partners: ['Jonas Club Software', 'Northstar ClubPOS', 'Lightspeed', 'Square for Restaurants'],
    description: 'POS checks, line items, payment methods, ticket timing, and comp/discount tracking.',
  },
  {
    id: 'gotab', name: 'GoTab', categoryId: 'fb-pos', tier: 1,
    icon: '🍽', themeColor: 'fb', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Explicitly built for country clubs. Mobile order & pay produces richer line-item data than traditional POS - ideal for post-round dining conversion analysis.',
    partners: ['GoTab', 'Lightspeed', 'Toast'],
    description: 'Mobile order & pay, POS, KDS, and kiosk management for country clubs and hospitality venues.',
  },
  {
    id: 'toast', name: 'Toast', categoryId: 'fb-pos', tier: 2,
    icon: '🍽', themeColor: 'fb', status: 'available', lastSync: null, goLive: '7-10 days',
    why: 'Dominant restaurant POS. Most relevant for resort and semi-private clients running full F&B service rather than member dining.',
    partners: ['Toast', 'Square', 'Lightspeed'],
    description: 'Full-service restaurant POS, management suite, and analytics for resort F&B operations.',
  },
  {
    id: 'lightspeed', name: 'Lightspeed Golf', categoryId: 'fb-pos', tier: 2,
    icon: '🍽', themeColor: 'fb', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'All-in-one cloud platform with built-in POS + tee sheet. Already in Golfmanager and Whoosh partner ecosystems - integration-friendly.',
    partners: ['Lightspeed', 'Golfmanager', 'Whoosh'],
    description: 'Unified cloud golf + F&B + retail platform with built-in reporting and marketing.',
  },

  // ── Staff Scheduling ────────────────────────────────────────────────────────
  {
    id: 'clubready', name: '7shifts', categoryId: 'staffing', tier: 1,
    icon: '📅', themeColor: 'staffing', status: 'connected', lastSync: '8 min ago', goLive: '2-3 days',
    why: 'Purpose-built for hospitality. Strong API, widely used in golf & food service. Clean shift + labor cost data feeds the Staffing Gap to Revenue Loss combo.',
    partners: ['7shifts', 'ClubReady', 'HotSchedules (Fourth)', 'When I Work'],
    description: 'Staff shifts, department coverage, understaffed day flags, and labor cost tracking.',
  },
  {
    id: 'hotschedules', name: 'HotSchedules (Fourth)', categoryId: 'staffing', tier: 1,
    icon: '📅', themeColor: 'staffing', status: 'available', lastSync: null, goLive: '5-7 days',
    why: "Enterprise-grade. Common at larger resort/country club properties with 50+ staff - where premium properties' scheduling data most likely lives.",
    partners: ['Fourth / HotSchedules', '7shifts', 'ADP'],
    description: 'Enterprise shift scheduling, labor forecasting, and HR workflows for large club properties.',
  },
  {
    id: 'when-i-work', name: 'When I Work', categoryId: 'staffing', tier: 2,
    icon: '📅', themeColor: 'staffing', status: 'available', lastSync: null, goLive: '3-5 days',
    why: 'Mid-market, well-documented API, common at semi-private and daily-fee operations. Completes coverage for non-premium properties.',
    partners: ['When I Work', '7shifts', 'Homebase'],
    description: 'Shift scheduling, team messaging, and labor tracking for mid-market golf operations.',
  },

  // ── Dynamic Pricing ─────────────────────────────────────────────────────────
  {
    id: 'sagacity', name: 'Sagacity Golf', categoryId: 'dynamic-pricing', tier: 1,
    icon: '💹', themeColor: 'operations', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Deepest golf-specific dynamic pricing product with its own AI and industry benchmarking. Starting at $99/mo - widely adopted - more courses for Swoop to connect with.',
    partners: ['Sagacity Golf', 'foreUP', 'Club Caddie'],
    description: 'AI-powered dynamic tee time pricing with benchmarking and demand forecasting.',
  },
  {
    id: 'priswing', name: 'Priswing', categoryId: 'dynamic-pricing', tier: 2,
    icon: '💹', themeColor: 'operations', status: 'available', lastSync: null, goLive: '7-10 days',
    why: 'Pure-play dynamic pricing specialist. More technically focused - a natural integration partner to surface whether pricing levers are being pulled correctly.',
    partners: ['Priswing', 'GolfNow', 'foreUP'],
    description: 'Demand-based tee time pricing optimization for golf course operators.',
  },
  {
    id: 'golfback', name: 'GolfBack', categoryId: 'dynamic-pricing', tier: 3,
    icon: '💹', themeColor: 'operations', status: 'coming_soon', lastSync: null, goLive: 'Coming Q3',
    why: "Combines booking engine + dynamic pricing + email comms. Relevant where operators haven't separated those functions yet.",
    partners: ['GolfBack', 'Lightspeed', 'SendGrid'],
    description: 'Booking engine, dynamic pricing, and email communications in one platform.',
  },

  // ── Waitlist & Demand ───────────────────────────────────────────────────────
  {
    id: 'noteefy', name: 'Noteefy', categoryId: 'waitlist', tier: 1,
    icon: '🔔', themeColor: 'pipeline', status: 'available', lastSync: null, goLive: '3-5 days',
    why: "The market-defining waitlist product. Swoop's positioning - Noteefy fills tee times; Swoop fills with the right members - lands harder when Noteefy data reveals GM context Noteefy alone can't show.",
    partners: ['Noteefy', 'ForeTees', 'Gallus'],
    description: 'Automated waitlist alerts, cancellation recovery, and demand intelligence for golf operators.',
  },
  {
    id: 'club-unity', name: 'Club Unity', categoryId: 'waitlist', tier: 2,
    icon: '🔔', themeColor: 'pipeline', status: 'available', lastSync: null, goLive: '5-7 days',
    why: "Built specifically for private/semi-private clubs with a cancellation watch feature directly relevant to Swoop's demand intelligence build.",
    partners: ['Club Unity', 'ForeTees', 'Northstar'],
    description: 'Member-first tee time booking with cancellation watch and demand-based restrictions.',
  },
  {
    id: 'teetimesnipe', name: 'Tee Time Snipe', categoryId: 'waitlist', tier: 3,
    icon: '🔔', themeColor: 'pipeline', status: 'coming_soon', lastSync: null, goLive: 'Coming Q3',
    why: 'Consumer-facing waitlist app. Lets Swoop surface demand signals from golfers actively trying to get on-course - not just existing members.',
    partners: ['Tee Time Snipe', 'GolfNow', 'EZLinks'],
    description: 'Consumer tee time alert and auto-booking service across North America.',
  },

  // ── Pace / On-Course Hardware ───────────────────────────────────────────────
  {
    id: 'tagmarshal', name: 'Tagmarshal', categoryId: 'pace-hardware', tier: 1,
    icon: '🚗', themeColor: 'operations', status: 'available', lastSync: null, goLive: '7-10 days',
    why: 'Gold standard pace management. Used by Top 100 courses. Markets 25+ integration partners. GPS + analytics hub = rich real-time data for the Slow Saturday Recovery playbook.',
    partners: ['Tagmarshal', 'Golf Genius', 'ForeTees'],
    description: 'GPS-based pace & flow management, real-time analytics, and operator alerts for golf courses.',
  },
  {
    id: 'fairwayiq', name: 'FAIRWAYiQ', categoryId: 'pace-hardware', tier: 1,
    icon: '🚗', themeColor: 'operations', status: 'available', lastSync: null, goLive: '7-10 days',
    why: 'Strong cloud analytics on top of cart sensors. Already has Golf Genius integration - open partner mindset. Turf protection and geofencing data opens course ops beyond pace.',
    partners: ['FAIRWAYiQ', 'Golf Genius', 'ForeTees'],
    description: 'Cart GPS sensors, pace-of-play management, turf protection, and geofencing analytics.',
  },
  {
    id: 'izon', name: 'IZON Technology', categoryId: 'pace-hardware', tier: 2,
    icon: '🚗', themeColor: 'operations', status: 'available', lastSync: null, goLive: '10-14 days',
    why: 'In-cart screen system with native F&B integration. Uniquely bridges pace data and on-course ordering in one feed - the only pace vendor that directly feeds the F&B lens.',
    partners: ['IZON Technology', 'Golf Genius', 'Jonas POS'],
    description: 'In-cart GPS screens with course management tools and native F&B ordering integration.',
  },

  // ── Tournaments & Events ────────────────────────────────────────────────────
  {
    id: 'golf-genius', name: 'Golf Genius', categoryId: 'events', tier: 1,
    icon: '🏆', themeColor: 'pipeline', status: 'coming_soon', lastSync: null, goLive: 'Coming Q2',
    why: 'Dominant at 60+ countries. Already integrated with Clubessential, FAIRWAYiQ, and TenFore. Tournament participation is a member health signal that connects event data to retention.',
    partners: ['Golf Genius', 'Clubessential', 'FAIRWAYiQ', 'ForeTees'],
    description: 'Tournament management, leagues, event websites, and live scoring for clubs and associations.',
  },
  {
    id: 'bluegolf', name: 'BlueGolf', categoryId: 'events', tier: 2,
    icon: '🏆', themeColor: 'pipeline', status: 'coming_soon', lastSync: null, goLive: 'Coming Q2',
    why: 'Strong at tour/association level. Relevant if Swoop expands into club association or regional tour clients with large event calendars.',
    partners: ['BlueGolf', 'Golf Genius', 'USGA GHIN'],
    description: 'Tournament management, registration, scoring, and pace-of-play tools for tours and clubs.',
  },
  {
    id: 'spark-golf', name: 'Spark Golf', categoryId: 'events', tier: 2,
    icon: '🏆', themeColor: 'pipeline', status: 'coming_soon', lastSync: null, goLive: 'Coming Q3',
    why: 'League-focused with a built-in marketplace. Leagues drive recurring rounds and member engagement - feeds both the Operations and Member Retention lenses.',
    partners: ['Spark Golf', 'Golf Genius', 'ForeTees'],
    description: 'League management platform and marketplace connecting golfers and operators.',
  },

  // ── Member Communications ───────────────────────────────────────────────────
  {
    id: 'email', name: 'Mailchimp', categoryId: 'communications', tier: 1,
    icon: '✉', themeColor: 'members', status: 'connected', lastSync: '22 min ago', goLive: '3-5 days',
    why: 'Widest adoption, solid API, and the most member engagement data for Swoop to pull from. Email open rates are early churn signals in the Engagement Decay playbook.',
    partners: ['Mailchimp', 'Constant Contact', 'SendGrid', 'MembersFirst Engage'],
    description: 'Campaign sends, open and click tracking, unsubscribes, and engagement decay signals.',
  },
  {
    id: 'membersfirst', name: 'MembersFirst Engage', categoryId: 'communications', tier: 1,
    icon: '✉', themeColor: 'members', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Built for private clubs - open rates carry more signal than generic email because the audience is a known, dues-paying member population.',
    partners: ['MembersFirst', 'Jonas Club Software', 'Northstar'],
    description: 'Private club email marketing, mobile app, and member engagement platform.',
  },
  {
    id: 'sendgrid', name: 'SendGrid', categoryId: 'communications', tier: 2,
    icon: '✉', themeColor: 'members', status: 'available', lastSync: null, goLive: '3-5 days',
    why: 'Used by several golf management platforms as their underlying send engine. Covers operators not on Mailchimp and enables transactional notification workflows.',
    partners: ['SendGrid', 'Mailchimp', 'Constant Contact'],
    description: 'Transactional and marketing email delivery with engagement analytics and automation.',
  },

  // ── CX & Feedback ──────────────────────────────────────────────────────────
  {
    id: 'weather', name: 'Weather API', categoryId: 'cx-feedback', tier: 1,
    icon: '🌤', themeColor: 'operations', status: 'connected', lastSync: '1 min ago', goLive: '1 day',
    why: 'Live demand modifier. Rain reduces golf bookings 40% but increases F&B 15%. The Weather x Demand combo is only possible with this feed connected.',
    partners: ['Tomorrow.io', 'Weather.com API', 'OpenWeatherMap'],
    description: 'Daily conditions, precipitation, wind, and demand modifier computation.',
  },
  {
    id: 'players1st', name: 'Players 1st', categoryId: 'cx-feedback', tier: 1,
    icon: '⭐', themeColor: 'members', status: 'available', lastSync: null, goLive: '5-7 days',
    why: "3,000+ golf facilities globally. CXM platform aggregates feedback + analytics + integrations. Grounds Swoop's health scores in actual survey data rather than behavioral inference alone.",
    partners: ['Players 1st', 'Northstar', 'Clubessential'],
    description: 'Golf-specific customer experience surveys, CXM dashboards, and AI-powered insights.',
  },
  {
    id: 'teereach', name: 'TeeReach', categoryId: 'cx-feedback', tier: 2,
    icon: '⭐', themeColor: 'members', status: 'available', lastSync: null, goLive: '5-7 days',
    why: 'Golf-specific review generation and insights. Links member health signals to external reputation - a GM story about public perception, not just internal engagement.',
    partners: ['TeeReach', 'Google Reviews', 'Players 1st'],
    description: 'Review generation, texting, and member satisfaction insights for golf courses.',
  },
];

// ── Combo insights (14 cross-system insights) ─────────────────────────────────
export const COMBOS = [
  {
    id: 'tee-to-table',
    systems: ['foretees', 'jonas'],
    label: 'Tee-to-Table Revenue',
    insight: 'After a slow round (>270 min), post-round dining conversion drops 15%. Slow rounds cost an estimated $5,760/month in lost F&B revenue.',
    automations: [
      'Alert F&B host when a round exceeds 4 hours',
      'Offer comp dessert to groups checking out late',
      'Track post-round revenue per tee-time slot',
    ],
    preview: { type: 'sparkline', sparklineKey: 'postRoundConversion', value: '35%', label: 'Post-round dining conversion', subtext: 'Drops to 20% after slow rounds', trend: 'down' },
    swoop_only: true,
  },
  {
    id: 'weather-demand',
    systems: ['foretees', 'weather'],
    label: 'Weather x Demand',
    insight: 'Rain reduces golf bookings 40% but increases F&B revenue 15% — members come to the club anyway. Invisible when systems are siloed.',
    automations: [
      'Proactively text waitlisted members on rain days',
      'Adjust F&B staffing 24 hours in advance',
      'Push dining promotions the evening before rain',
    ],
    preview: { type: 'kpi', value: '+15%', label: 'F&B revenue on rain days', subtext: '-40% golf, +15% dining - always' },
    swoop_only: true,
  },
  {
    id: 'churn-signal',
    systems: ['northstar', 'foretees'],
    label: 'Engagement Decay -> Churn',
    insight: 'Members who resign show a 2-3 month decay pattern across golf, dining, and email before submitting notice. No single system sees the full picture.',
    automations: [
      'Flag members trending down across all domains',
      'Trigger GM personal outreach at health score 50',
      'Schedule retention call before score hits 30',
    ],
    preview: { type: 'sparkline', sparklineKey: 'atRiskMemberCount', value: '6-8 wks', label: 'Average warning lead time', subtext: 'Before resignation letter arrives', trend: 'up' },
    swoop_only: true,
  },
  {
    id: 'complaint-churn',
    systems: ['northstar', 'jonas'],
    label: 'Service Failure -> Resignation',
    insight: 'James Whitfield: active Balanced Active member. Service Speed complaint Jan 18 went unresolved. Resigned Jan 22. A $22K/year dues loss, preventable in 4 days.',
    automations: [
      'Escalate unresolved complaints after 48 hours',
      'Assign GM follow-up for members with health < 60',
      'Draft personal apology email in one click',
    ],
    preview: { type: 'kpi', value: '$22K', label: 'Annual dues lost - James Whitfield', subtext: 'Complaint unresolved -> resigned in 4 days' },
    swoop_only: true,
  },
  {
    id: 'staff-revenue',
    systems: ['clubready', 'jonas'],
    label: 'Staffing Gap -> Revenue Loss',
    insight: 'On understaffed Grill Room days (Jan 9, 16, 28), ticket times ran 20% longer, complaints doubled, and F&B revenue was ~8% lower. The cost is invisible unless staffing and POS are connected.',
    automations: [
      'Flag scheduling gaps 72 hours in advance',
      'Compute revenue-at-risk per understaffed shift',
      'Suggest coverage from cross-trained staff',
    ],
    preview: { type: 'kpi', value: '-8%', label: 'F&B revenue on understaffed days', subtext: 'Jan 9, 16, 28 - Grill Room' },
    swoop_only: true,
  },
  {
    id: 'email-churn',
    systems: ['email', 'northstar'],
    label: 'Email Decay -> Churn Prediction',
    insight: 'Members who stop opening emails are 3x more likely to resign within 90 days. Email silence is a churn signal most clubs miss entirely.',
    automations: [
      'Flag members with 3+ consecutive non-opens',
      'Trigger re-engagement sequence before score drops',
      'Notify GM when email score diverges from health score',
    ],
    preview: { type: 'sparkline', sparklineKey: 'emailOpenRateAvg', value: '36%', label: 'Avg email open rate (Jan)', subtext: 'Down from 42% in August', trend: 'down' },
    swoop_only: true,
  },
  {
    id: 'pace-fb',
    systems: ['tagmarshal', 'jonas'],
    label: 'Slow Round -> Lost Dining',
    insight: 'Tagmarshal real-time pace data lets the F&B host know a group is running long before they finish. A proactive table hold converts slow rounds into dining revenue instead of apologies.',
    automations: [
      'Alert F&B host when a tracked group exceeds 4 hours',
      'Auto-hold a table for groups in final 3 holes',
      'Log post-round conversion rate per pace bracket',
    ],
    preview: { type: 'kpi', value: '28%', label: 'Dining conversion on slow rounds', subtext: 'vs. 43% on on-pace rounds' },
    swoop_only: true,
  },
  {
    id: 'waitlist-archetype',
    systems: ['noteefy', 'northstar'],
    label: 'Right Member, Right Slot',
    insight: 'Noteefy fills open tee times fast. Swoop tells you if the waiting member is the right archetype for that slot - a Die-Hard in a prime Saturday morning spot vs. a Weekend Warrior in a midweek afternoon.',
    automations: [
      'Score waitlisted members by archetype fit for the slot',
      'Prioritize Ghost members for off-peak slots to rebuild engagement',
      'Alert GM when a Declining member claims a high-value time',
    ],
    preview: { type: 'kpi', value: '3.2x', label: 'Retention lift - archetype-matched slots', subtext: 'vs. random waitlist fill order' },
    swoop_only: true,
  },
  {
    id: 'pricing-demand',
    systems: ['sagacity', 'foretees'],
    label: 'Pricing x Archetype Fit',
    insight: 'Dynamic price drops on slow Saturdays attract more bookings, but often the wrong archetype. Swoop surfaces the revenue vs. membership quality tradeoff so the GM can decide, not just accept.',
    automations: [
      'Flag tee times filled via discount by archetype type',
      'Compute long-term retention value of discount-driven bookings',
      'Alert GM when discount strategy shifts archetype mix',
    ],
    preview: { type: 'kpi', value: '-18%', label: 'Retention rate - discount-fill bookings', subtext: 'vs. full-price bookings from same period' },
    swoop_only: true,
  },
  {
    id: 'event-retention',
    systems: ['golf-genius', 'northstar'],
    label: 'Event Drop-Off -> Early Churn',
    insight: 'Members who stop entering tournaments show 3x higher resignation rates within 90 days. Tournament disengagement is the earliest visible signal before the health score drops.',
    automations: [
      'Flag members who skipped last 2+ tournaments they previously entered',
      'Trigger GM personal invite for next event',
      'Assign to Engagement Decay playbook if score < 60',
    ],
    preview: { type: 'sparkline', sparklineKey: 'resignationCount', value: '3x', label: 'Resignation rate after event drop-off', subtext: 'vs. members with consistent event attendance', trend: 'up' },
    swoop_only: true,
  },
  {
    id: 'survey-health',
    systems: ['players1st', 'northstar'],
    label: 'Survey Score -> Health Score',
    insight: "Players 1st satisfaction data enriches Swoop's member health score with the member's own words. A behavioral score of 72 paired with a satisfaction score of 4.1/10 is a different risk profile than 72 paired with 8.9/10.",
    automations: [
      'Blend Players 1st NPS into Swoop health score weighting',
      'Flag members with low satisfaction score despite high activity',
      'Surface verbatim feedback in GM member profile view',
    ],
    preview: { type: 'kpi', value: '2.4x', label: 'Churn prediction accuracy', subtext: 'Behavioral + satisfaction vs. behavioral alone' },
    swoop_only: true,
  },
  {
    id: 'incart-fb',
    systems: ['izon', 'jonas'],
    label: 'On-Course Ordering Trends',
    insight: 'IZON in-cart orders peak on slow round days - members order more food and drinks when waiting on the tee. Swoop surfaces this F&B opportunity invisible in POS data alone.',
    automations: [
      'Push on-course promotions to cart screens on slow-pacing days',
      'Flag outlet inventory depletion risk when cart orders spike',
      'Track per-round F&B spend by tee time vs. round time',
    ],
    preview: { type: 'kpi', value: '+22%', label: 'In-cart F&B spend on slow round days', subtext: 'Highest order volume when pace exceeds 4:30' },
    swoop_only: true,
  },
  {
    id: 'weather-staffing',
    systems: ['weather', 'clubready'],
    label: 'Forecast -> Staff Adjustment',
    insight: "A 72-hour weather forecast for rain reliably predicts a dining surge. Swoop connects the forecast to the staffing schedule 3 days early - before the GM knows they're short.",
    automations: [
      'Flag rain days with projected F&B surge 72 hours out',
      'Auto-suggest additional Grill Room coverage for rain days',
      "Alert GM if staffing hasn't been adjusted 24 hours before rain",
    ],
    preview: { type: 'kpi', value: '72 hrs', label: 'Average advance notice for staffing adjustment', subtext: 'vs. same-day scramble without forecast integration' },
    swoop_only: true,
  },
  {
    id: 'pace-archetype',
    systems: ['tagmarshal', 'foretees'],
    label: 'Slow Pairing Detection',
    insight: 'When a tee time booking includes a known slow archetype combination, Tagmarshal pace history confirms the pattern. Swoop flags future pairings before they cause a cascade of delays.',
    automations: [
      'Score tee time pairings by predicted pace based on archetype history',
      'Flag high-risk slow pairings in the tee sheet 48 hours ahead',
      'Suggest starter interventions for flagged tee times',
    ],
    preview: { type: 'kpi', value: '68%', label: 'Slow round prediction accuracy', subtext: 'For flagged archetype pairings vs. 34% baseline' },
    swoop_only: true,
  },
];

// ── Backward-compat aliases ────────────────────────────────────────────────────
// IntegrationCard and IntegrationMap reference SYSTEMS[]. These are now derived
// from VENDORS so no changes are needed in those components.
const ORIGINAL_IDS = ['foretees', 'jonas', 'northstar', 'clubready', 'weather', 'email', 'clubprophet', 'golf-genius'];
export const SYSTEMS = VENDORS.filter(v =>
  ORIGINAL_IDS.includes(v.id)
).map(v => ({
  ...v,
  category: CATEGORIES.find(c => c.id === v.categoryId)?.label ?? v.categoryId,
}));

export const integrations = SYSTEMS.map(s => ({ ...s, dataPoints: [] }));
export const integrationsById = Object.fromEntries(integrations.map(i => [i.id, i]));

// ── Legacy VENDOR_LANDSCAPE (VendorLandscapeSection) ─────────────────────────
export const VENDOR_LANDSCAPE = CATEGORIES.map(cat => ({
  category: cat.label,
  icon: cat.icon,
  themeColor: cat.themeColor,
  description: '',
  vendors: VENDORS
    .filter(v => v.categoryId === cat.id)
    .map(v => ({
      name: v.name,
      tier: v.tier === 1 ? 'primary' : v.tier === 2 ? 'supported' : 'coming_soon',
    })),
}));
