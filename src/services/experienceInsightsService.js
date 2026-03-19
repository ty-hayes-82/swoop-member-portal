// experienceInsightsService.js — correlation calculations from existing data
// _init() hydrates from Postgres; arrays/objects are mutated in-place so imports stay current.
import { memberArchetypes } from '@/data/members';

// Touchpoint correlations with retention — derived from cross-domain analysis
export const touchpointCorrelations = [
  { touchpoint: 'Round Frequency', retentionImpact: 0.89, category: 'golf', description: 'Strongest predictor. Members playing 3+ rounds/month have 94% renewal rate vs. 61% for <1 round/month.' },
  { touchpoint: 'Post-Round Dining', retentionImpact: 0.78, category: 'dining', description: 'Members who dine after rounds have 2.3x higher renewal rates. The round-to-dining connection is the strongest cross-domain signal.' },
  { touchpoint: 'Event Attendance', retentionImpact: 0.72, category: 'events', description: '2nd strongest predictor of retention after round frequency. Members attending 2+ events/quarter renew at 91%.' },
  { touchpoint: 'Email Engagement', retentionImpact: 0.64, category: 'email', description: 'Newsletter open rate above 40% correlates with 85% renewal. Drop below 15% is an early warning signal.' },
  { touchpoint: 'Pro Shop Visits', retentionImpact: 0.58, category: 'proshop', description: 'Equipment purchases signal commitment. Members with $500+/yr pro shop spend renew at 88%.' },
  { touchpoint: 'Staff Interactions', retentionImpact: 0.55, category: 'service', description: 'Members who are greeted by name by staff have 22% higher satisfaction scores.' },
  { touchpoint: 'Course Condition Rating', retentionImpact: 0.51, category: 'course', description: 'Course quality is table stakes. Members rating conditions below 3/5 are 3x more likely to resign.' },
  { touchpoint: 'Complaint Resolution', retentionImpact: 0.82, category: 'service', description: 'Each complaint resolved within 24hrs improves renewal probability by 18%. Unresolved complaints are the #1 resignation accelerator.' },
];

// At-risk member touchpoint correlations — reordered for recovery context
export const touchpointCorrelationsAtRisk = [
  { touchpoint: 'Complaint Resolution', retentionImpact: 0.91, category: 'service', description: 'The #1 recovery lever. At-risk members whose complaints are resolved same-day recover at 74% vs. 31% for delayed resolution.' },
  { touchpoint: 'Round Frequency', retentionImpact: 0.85, category: 'golf', description: 'Re-engaging at-risk members with even 1 round/month improves recovery probability by 40%.' },
  { touchpoint: 'Staff Interactions', retentionImpact: 0.79, category: 'service', description: 'Personal GM outreach is 3.4x more effective than email for at-risk members. Name recognition matters most when members feel invisible.' },
  { touchpoint: 'Event Attendance', retentionImpact: 0.74, category: 'events', description: 'A single event attendance can reset a declining member. Social reconnection breaks the isolation-resignation cycle.' },
  { touchpoint: 'Post-Round Dining', retentionImpact: 0.68, category: 'dining', description: 'At-risk members who dine post-round are signaling they still value the club experience. Protect this behavior.' },
  { touchpoint: 'Email Engagement', retentionImpact: 0.52, category: 'email', description: 'Email re-engagement is a weak recovery signal for at-risk members — by the time they stop opening emails, the decline is advanced.' },
  { touchpoint: 'Pro Shop Visits', retentionImpact: 0.41, category: 'proshop', description: 'Pro shop spend drops last in the decay sequence. Low predictive value for at-risk recovery.' },
  { touchpoint: 'Course Condition Rating', retentionImpact: 0.38, category: 'course', description: 'Course conditions are a hygiene factor, not a recovery lever. Fixing conditions alone won\'t save an at-risk member.' },
];

// Experience-to-outcome correlation cards
export const correlationInsights = [
  {
    id: 'dining-after-rounds',
    headline: 'Members who dine after rounds have 2.3x higher renewal rates',
    detail: 'Of 182 members who regularly dine post-round, 168 renewed (92%). Of 118 who never dine after golf, only 72 renewed (61%). The round-to-dining connection is the strongest cross-domain retention signal.',
    domains: ['Golf', 'Dining'],
    impact: 'high',
    metric: { value: '2.3x', label: 'renewal rate multiplier' },
    trend: [86, 87, 89, 90, 91, 92], delta: '+6pp', deltaDirection: 'up',
  },
  {
    id: 'complaint-resolution',
    headline: 'Complaints resolved within 24hrs improve renewal probability by 18%',
    detail: 'Across all 47 complaints this quarter, members whose issues were resolved same-day renewed at 89% vs. 71% for delayed resolution. Kevin Hurst is the proof case: multi-domain decline accelerated after an unresolved service event.',
    domains: ['Service', 'Retention'],
    impact: 'high',
    metric: { value: '+18%', label: 'renewal improvement' },
    trend: [71, 74, 78, 82, 86, 89], delta: '+18pp', deltaDirection: 'up',
  },
  {
    id: 'event-retention',
    headline: 'Event attendance is the 2nd strongest predictor of retention after round frequency',
    detail: 'Members attending 2+ events per quarter renew at 91% vs. 67% for non-attendees. Social Butterflies who attend events but rarely golf still renew at 84% — events create emotional attachment independent of golf.',
    domains: ['Events', 'Retention'],
    impact: 'high',
    metric: { value: '91%', label: 'renewal rate (2+ events/qtr)' },
    trend: [84, 86, 87, 89, 90, 91], delta: '+7pp', deltaDirection: 'up',
  },
  {
    id: 'email-decay-warning',
    headline: 'Email open rate below 15% precedes resignation by 6-8 weeks',
    detail: 'In 9 of 11 resignations this year, email engagement dropped below 15% at least 6 weeks before the member left. This makes email decay the earliest detectable disengagement signal across all touchpoints.',
    domains: ['Email', 'Retention'],
    impact: 'medium',
    metric: { value: '6-8 wks', label: 'early warning window' },
    trend: [10, 9, 8, 7, 7, 6], delta: '-4 wks', deltaDirection: 'down',
  },
  {
    id: 'staffing-experience',
    headline: 'Understaffed days generate 2.1x more complaints and cost $1,133/day in lost revenue',
    detail: 'On 3 understaffed Fridays in January, complaint rates doubled and F&B revenue ran 8% below normal. The compounding effect: staffing gaps create service failures, which create complaints, which accelerate disengagement.',
    domains: ['Staffing', 'F&B', 'Service'],
    impact: 'high',
    metric: { value: '2.1x', label: 'complaint rate on understaffed days' },
    trend: [2.8, 2.5, 2.3, 2.2, 2.1, 2.1], delta: '-0.7x', deltaDirection: 'down',
  },
  {
    id: 'multi-domain-decay',
    headline: 'Members declining in 3+ domains resign within 60 days without intervention',
    detail: 'When golf, dining, AND email all decline simultaneously, the member is in a resignation spiral. Swoop detected this pattern in Kevin Hurst (Oct: golf dropped, Nov: dining stopped, Dec: email went dark, Jan: resigned).',
    domains: ['Golf', 'Dining', 'Email'],
    impact: 'high',
    metric: { value: '60 days', label: 'avg time to resignation' },
    trend: [75, 70, 66, 63, 61, 60], delta: '-15 days', deltaDirection: 'down',
  },
];

// Event ROI data
export const eventROI = [
  { type: 'Member-Guest Tournament', attendance: 48, retentionRate: 96, avgSpend: 285, roi: 4.2, frequency: 'Quarterly' },
  { type: 'Wine Dinner', attendance: 32, retentionRate: 94, avgSpend: 125, roi: 3.8, frequency: 'Monthly' },
  { type: 'Family Pool Day', attendance: 28, retentionRate: 92, avgSpend: 85, roi: 3.1, frequency: 'Weekly (summer)' },
  { type: 'Golf Clinic', attendance: 22, retentionRate: 90, avgSpend: 65, roi: 2.7, frequency: 'Bi-weekly' },
  { type: "Chef's Table", attendance: 12, retentionRate: 98, avgSpend: 195, roi: 5.1, frequency: 'Monthly' },
  { type: 'Holiday Gala', attendance: 120, retentionRate: 93, avgSpend: 175, roi: 3.5, frequency: 'Annual' },
];

// Complaint-to-loyalty statistics
export const complaintLoyaltyStats = {
  totalComplaints: 47,
  resolvedWithin24h: 31,
  renewalRateResolved: 89,
  renewalRateUnresolved: 71,
  avgResolutionTime: '18 hours',
  topCategories: [
    { category: 'Service Speed', count: 18, resolvedPct: 72, retentionImpact: -12 },
    { category: 'Course Condition', count: 11, resolvedPct: 91, retentionImpact: -4 },
    { category: 'Food Quality', count: 8, resolvedPct: 88, retentionImpact: -6 },
    { category: 'Pace of Play', count: 6, resolvedPct: 67, retentionImpact: -8 },
    { category: 'Billing', count: 4, resolvedPct: 100, retentionImpact: -2 },
  ],
};

// Archetype spend patterns for spend potential analysis
export const getArchetypeSpendPatterns = () => {
  return memberArchetypes.map(a => ({
    archetype: a.archetype,
    count: a.count,
    engagement: { golf: a.golf, dining: a.dining, events: a.events, email: a.email },
    trend: a.trend,
    avgAnnualSpend: Math.round((a.golf * 120 + a.dining * 80 + a.events * 45) / 100),
    spendPotential: Math.round(((100 - a.dining) * 80 + (100 - a.events) * 45) / 100),
  }));
};

// Archetype-specific touchpoint correlations — each archetype has different retention drivers
export const touchpointCorrelationsByArchetype = {
  'Die-Hard Golfer': [
    { touchpoint: 'Round Frequency', retentionImpact: 0.94, category: 'golf', description: 'The defining retention driver. Die-Hards who play 4+ rounds/month renew at 97%. Any drop below 2/month is an immediate warning.' },
    { touchpoint: 'Pace of Play Satisfaction', retentionImpact: 0.88, category: 'course', description: 'Die-Hards are the most pace-sensitive archetype. A single 5+ hour round triggers 3x more complaints than other members.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.82, category: 'course', description: 'Course quality is table stakes for this group. They notice greens speed, fairway conditions, and bunker maintenance.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.71, category: 'proshop', description: 'Equipment investment signals commitment. Die-Hards averaging $800+/yr in pro shop spend renew at 96%.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.52, category: 'dining', description: 'Dining is secondary for this group. Only 34% dine after rounds — the biggest untapped cross-sell opportunity.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.38, category: 'events', description: 'Events matter less for Die-Hards unless golf-centric (member-guest tournaments, golf clinics).' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.32, category: 'email', description: 'Low email engagement is normal for this group — they show up on the course, not in their inbox.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.45, category: 'service', description: 'Pro shop staff and starters matter most. Ranger interactions during pace issues are critical moments.' },
  ],
  'Social Butterfly': [
    { touchpoint: 'Event Attendance', retentionImpact: 0.92, category: 'events', description: 'Events are the primary retention driver. Social Butterflies attending 3+ events/quarter renew at 96%.' },
    { touchpoint: 'Dining Frequency', retentionImpact: 0.89, category: 'dining', description: 'Dining is social infrastructure for this group. Weekly dining visits correlate with 94% renewal.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.84, category: 'service', description: 'Being known by name, preferred table, remembered drink order — these create the emotional attachment that retains.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.78, category: 'email', description: 'Highest email engagement of any archetype. Open rates above 60% correlate with event attendance above 3/quarter.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.74, category: 'service', description: 'Social Butterflies share experiences with other members. One unresolved complaint can influence 5-8 other members.' },
    { touchpoint: 'Round Frequency', retentionImpact: 0.34, category: 'golf', description: 'Golf is optional for this group. Many retain at high rates with 0-1 rounds/month.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.28, category: 'proshop', description: 'Minimal pro shop engagement. Not a useful signal for this archetype.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.22, category: 'course', description: 'Course conditions are irrelevant to retention for members who rarely play.' },
  ],
  'Balanced Active': [
    { touchpoint: 'Round Frequency', retentionImpact: 0.82, category: 'golf', description: 'Balanced members need consistent golf access. 2-3 rounds/month is the sweet spot for this group.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.79, category: 'dining', description: 'The round-to-dining connection is strongest for Balanced Active members. 62% already dine — push to 80%.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.75, category: 'events', description: 'Events reinforce the multi-domain connection. Balanced members who attend events AND play golf renew at 93%.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.68, category: 'service', description: 'Consistent, friendly service across all touchpoints matters. They notice when quality drops in any domain.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.72, category: 'service', description: 'Unresolved complaints hit harder here — these members engage broadly, so a failure in one area colors all others.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.61, category: 'email', description: 'Moderate email engagement is healthy for this group. Watch for drops below 30% as an early warning.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.55, category: 'course', description: 'Course quality matters as part of the overall experience, but less than for Die-Hards.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.48, category: 'proshop', description: 'Moderate pro shop spending reflects broad engagement. Not a primary retention signal.' },
  ],
  'Weekend Warrior': [
    { touchpoint: 'Round Frequency', retentionImpact: 0.86, category: 'golf', description: 'Weekend access is everything. If a Weekend Warrior can\'t get Saturday tee times, they question membership value.' },
    { touchpoint: 'Pace of Play Satisfaction', retentionImpact: 0.81, category: 'course', description: 'Time-constrained members are the most pace-sensitive after Die-Hards. They have limited weekend hours.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.65, category: 'dining', description: 'Family brunch after golf is the conversion opportunity. Make the club a weekend destination, not just a tee time.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.52, category: 'events', description: 'Weekend-only events matter. Weeknight events get zero traction with this time-constrained group.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.58, category: 'service', description: 'Weekend staff quality matters disproportionately. These members only see your weekend team.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.74, category: 'service', description: 'Weekend complaints must be resolved by Monday. They have limited touchpoints — one bad experience looms large.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.28, category: 'email', description: 'Low email engagement is structural — they check email during work, not on weekends when they\'re at the club.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.62, category: 'course', description: 'Weekend course conditions must be pristine. These members compare Saturday conditions to weekday play elsewhere.' },
  ],
  'Declining': [
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.91, category: 'service', description: 'The #1 recovery lever. Declining members with unresolved complaints resign 4x faster than those with resolved issues.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.85, category: 'service', description: 'Personal GM outreach is the most effective intervention. A single personal call can reverse a 3-month decline.' },
    { touchpoint: 'Round Frequency', retentionImpact: 0.78, category: 'golf', description: 'Re-engaging with even 1 round/month improves recovery by 40%. The round itself resets emotional connection.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.72, category: 'events', description: 'A single event attendance can break the isolation spiral. Invite declining members to intimate, low-pressure events.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.65, category: 'dining', description: 'Dining after a recovery round signals re-engagement. Protect this behavior with a comp appetizer or drink.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.48, category: 'email', description: 'By the time email engagement drops, the decline is advanced. Email is a lagging indicator for this group.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.32, category: 'proshop', description: 'Pro shop spend drops last in the decay sequence. Not useful for early detection.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.28, category: 'course', description: 'Course conditions are a hygiene factor, not a recovery lever for declining members.' },
  ],
  'New Member': [
    { touchpoint: 'Event Attendance', retentionImpact: 0.88, category: 'events', description: 'Events are the #1 first-year retention driver. New members attending 2+ events in 90 days renew at 94%.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.85, category: 'service', description: 'Being greeted by name within the first month predicts long-term retention. First impressions define the relationship.' },
    { touchpoint: 'Round Frequency', retentionImpact: 0.78, category: 'golf', description: 'Getting new members on the course early matters. 3+ rounds in the first 60 days correlates with 91% Year 2 renewal.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.74, category: 'dining', description: 'Dining habits form early. New members who dine in their first month maintain 2.1x higher dining frequency long-term.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.82, category: 'email', description: 'New members have the highest email open rates (68%). Capitalize with onboarding content, event invites, and tips.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.89, category: 'service', description: 'A complaint in the first 90 days is a critical moment. Resolve it personally and immediately — there is no goodwill buffer.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.52, category: 'proshop', description: 'Equipment purchases signal commitment. Encourage new member discount on first pro shop purchase.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.45, category: 'course', description: 'New members are comparing to their previous club or public course. First impressions of course quality matter.' },
  ],
  'Ghost': [
    { touchpoint: 'Staff Interactions', retentionImpact: 0.92, category: 'service', description: 'Personal outreach is the only proven intervention for Ghosts. Automated messages don\'t work — they need a human connection.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.88, category: 'service', description: 'Many Ghosts have an unresolved issue they never reported. Proactive "how are we doing?" outreach surfaces hidden complaints.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.75, category: 'events', description: 'A single event can re-activate a Ghost. Low-pressure social events (wine dinner, family day) work better than golf events.' },
    { touchpoint: 'Round Frequency', retentionImpact: 0.68, category: 'golf', description: 'Any round is a win. Don\'t push frequency — push a single re-engagement round with a personal invitation.' },
    { touchpoint: 'Post-Round Dining', retentionImpact: 0.45, category: 'dining', description: 'If a Ghost plays AND dines, they\'re re-engaging. This is a strong recovery signal to watch for.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.22, category: 'email', description: 'Ghosts have already tuned out email. Open rates below 8% are typical. Don\'t rely on email to reach them.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.15, category: 'proshop', description: 'Zero pro shop activity is expected. Not a useful signal for this archetype.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.12, category: 'course', description: 'Ghosts aren\'t on the course to rate conditions. Irrelevant for recovery.' },
  ],
  'Snowbird': [
    { touchpoint: 'Round Frequency', retentionImpact: 0.85, category: 'golf', description: 'In-season round frequency is the key metric. Snowbirds playing 3+/week during their season renew at 95%.' },
    { touchpoint: 'Dining Frequency', retentionImpact: 0.81, category: 'dining', description: 'Snowbirds are high spenders during season. Dining 4+ times/week signals full engagement with club life.' },
    { touchpoint: 'Event Attendance', retentionImpact: 0.77, category: 'events', description: 'Season-specific events (holiday gala, member-guest) are critical. These are the social anchors that justify off-season dues.' },
    { touchpoint: 'Staff Interactions', retentionImpact: 0.74, category: 'service', description: 'Being remembered after months away is the moment that decides renewal. "Welcome back, Mrs. Fletcher" matters.' },
    { touchpoint: 'Complaint Resolution', retentionImpact: 0.72, category: 'service', description: 'Complaints during limited season time feel amplified. Resolve immediately — they have no time to wait.' },
    { touchpoint: 'Email Engagement', retentionImpact: 0.65, category: 'email', description: 'Off-season email keeps the connection alive. Monthly "club update" emails maintain emotional attachment during away months.' },
    { touchpoint: 'Course Condition Rating', retentionImpact: 0.68, category: 'course', description: 'Peak-season course conditions must be excellent. Snowbirds compare your January course to other warm-climate clubs.' },
    { touchpoint: 'Pro Shop Visits', retentionImpact: 0.55, category: 'proshop', description: 'Seasonal equipment purchases signal return commitment. "See you next season" merchandise is a smart play.' },
  ],
};

// Archetype-specific correlation insight headlines
export const correlationInsightsByArchetype = {
  'Die-Hard Golfer': [
    { id: 'dh-pace', headline: 'Pace of play is 2.8x more important to Die-Hards than any other archetype', detail: 'A single 5+ hour round generates 3x more complaints from Die-Hards. They value course access and playability above all else.', domains: ['Golf', 'Service'], impact: 'high', metric: { value: '2.8x', label: 'pace sensitivity vs. avg' } },
    { id: 'dh-dining', headline: 'Only 34% of Die-Hards dine after rounds — $14,976 untapped per year', detail: '52 Die-Hard Golfers are your biggest dining cross-sell opportunity. Post-round dining credit ($15 Grill Room credit) has 3.2x ROI in pilots.', domains: ['Golf', 'Dining'], impact: 'high', metric: { value: '$14.9K', label: 'untapped dining/yr' } },
  ],
  'Social Butterfly': [
    { id: 'sb-events', headline: 'Social Butterflies attending 3+ events/quarter renew at 96%', detail: 'Events are the primary retention driver — not golf. Chef\'s Table and Wine Dinner have the highest retention correlation for this group.', domains: ['Events', 'Retention'], impact: 'high', metric: { value: '96%', label: 'renewal rate (3+ events)' } },
    { id: 'sb-influence', headline: 'One unresolved complaint from a Social Butterfly influences 5-8 other members', detail: 'Social Butterflies are your biggest word-of-mouth amplifiers. Their experience shapes perception for the broader membership.', domains: ['Service', 'Retention'], impact: 'high', metric: { value: '5-8x', label: 'influence multiplier' } },
  ],
  'Balanced Active': [
    { id: 'ba-cross', headline: 'Balanced members who engage in golf AND dining renew at 93%', detail: 'The cross-domain connection is strongest for this archetype. Golf + dining together create a stickier membership than either alone.', domains: ['Golf', 'Dining'], impact: 'high', metric: { value: '93%', label: 'renewal (golf + dining)' } },
    { id: 'ba-decay', headline: 'Multi-domain decline in Balanced Active members signals resignation within 45 days', detail: 'When golf, dining, and email all decline simultaneously, these members are in a spiral. Intervene within 2 weeks.', domains: ['Golf', 'Dining', 'Email'], impact: 'high', metric: { value: '45d', label: 'avg time to resign' } },
  ],
  'Weekend Warrior': [
    { id: 'ww-access', headline: 'Weekend Warriors denied Saturday tee times are 3.1x more likely to resign', detail: 'Tee time access is the single biggest retention factor. Prioritize weekend slots for this group during high-demand periods.', domains: ['Golf', 'Retention'], impact: 'high', metric: { value: '3.1x', label: 'churn risk when denied' } },
    { id: 'ww-family', headline: 'Family brunch after golf drives 2.4x higher weekend dining conversion', detail: 'Make the club a weekend destination. Family-friendly post-round dining converts 65% of Weekend Warriors vs. 27% without.', domains: ['Dining', 'Events'], impact: 'medium', metric: { value: '2.4x', label: 'dining conversion' } },
  ],
  'Declining': [
    { id: 'dc-gm', headline: 'Personal GM call reverses decline in 34% of cases', detail: 'No automated intervention works for declining members. A single personal phone call from the GM is 3.4x more effective than any email campaign.', domains: ['Service', 'Retention'], impact: 'high', metric: { value: '34%', label: 'recovery rate (GM call)' } },
    { id: 'dc-speed', headline: 'Intervene within 2 weeks of multi-domain decline or lose the member', detail: 'The window for saving a declining member is narrow. After 4 weeks of concurrent golf + dining + email decline, recovery drops to 8%.', domains: ['Golf', 'Dining', 'Email'], impact: 'high', metric: { value: '2 wks', label: 'intervention window' } },
  ],
  'New Member': [
    { id: 'nm-90day', headline: 'First 90 days define the entire membership — 2+ events predict 94% renewal', detail: 'New member onboarding is the highest-ROI retention investment. Social integration in the first quarter drives long-term engagement.', domains: ['Events', 'Retention'], impact: 'high', metric: { value: '94%', label: 'renewal (2+ events in 90d)' } },
    { id: 'nm-complaint', headline: 'A complaint in the first 90 days requires immediate GM intervention', detail: 'New members have zero goodwill buffer. An unresolved first complaint leads to resignation 67% of the time.', domains: ['Service', 'Retention'], impact: 'high', metric: { value: '67%', label: 'resign rate (unresolved)' } },
  ],
  'Ghost': [
    { id: 'gh-personal', headline: 'Only personal outreach works — automated messages have 0% re-engagement rate for Ghosts', detail: 'Ghosts have already tuned out all automated communication. A personal call or in-person conversation is the only proven intervention.', domains: ['Service', 'Retention'], impact: 'high', metric: { value: '0%', label: 'auto-message recovery' } },
    { id: 'gh-event', headline: 'A single event attendance re-activates 28% of Ghost members', detail: 'Low-pressure social events (wine dinner, family day) outperform golf events for Ghost re-engagement by 3.1x.', domains: ['Events', 'Retention'], impact: 'high', metric: { value: '28%', label: 're-activation rate' } },
  ],
  'Snowbird': [
    { id: 'sn-welcome', headline: '"Welcome back" recognition drives 95% in-season satisfaction for Snowbirds', detail: 'Being remembered after months away is the #1 loyalty driver. Staff training on seasonal member recognition has 8.2x ROI.', domains: ['Service', 'Retention'], impact: 'high', metric: { value: '95%', label: 'satisfaction with recognition' } },
    { id: 'sn-offseason', headline: 'Monthly off-season emails maintain 78% emotional attachment', detail: 'Snowbirds who receive monthly club updates during off-season renew at 92% vs. 79% for those who don\'t.', domains: ['Email', 'Retention'], impact: 'medium', metric: { value: '+13pp', label: 'renewal improvement' } },
  ],
};

export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Scheduling', 'Email', 'Complaints'];

// Archetype spend gap analysis — dollar value of untapped potential
export const archetypeSpendGaps = [
  {
    archetype: 'Balanced Active',
    count: 64,
    currentDining: 62,
    potentialDining: 100,
    currentEvents: 54,
    potentialEvents: 100,
    avgAnnualSpend: 4800,
    untappedDining: 3264,
    untappedEvents: 2944,
    totalUntapped: 6208,
    campaign: 'Invite to themed dinner series + wine pairing events. These members are already engaged in golf — dining is the natural cross-sell.',
  },
  {
    archetype: 'Social Butterfly',
    count: 38,
    currentDining: 78,
    potentialDining: 100,
    currentEvents: 85,
    potentialEvents: 100,
    avgAnnualSpend: 5200,
    untappedDining: 1672,
    untappedEvents: 1140,
    totalUntapped: 2812,
    campaign: 'Already strong in events and dining. Offer golf clinic invites + member-guest tournament slots to deepen cross-domain engagement.',
  },
  {
    archetype: 'Die-Hard Golfer',
    count: 52,
    currentDining: 34,
    potentialDining: 100,
    currentEvents: 22,
    potentialEvents: 100,
    avgAnnualSpend: 3600,
    untappedDining: 6864,
    untappedEvents: 8112,
    totalUntapped: 14976,
    campaign: 'Biggest opportunity. Post-round dining incentive: "Your round includes a $15 Grill Room credit today." Event hook: 19th hole tournaments with dining built in.',
  },
  {
    archetype: 'Weekend Warrior',
    count: 45,
    currentDining: 41,
    potentialDining: 100,
    currentEvents: 28,
    potentialEvents: 100,
    avgAnnualSpend: 3200,
    untappedDining: 5310,
    untappedEvents: 6480,
    totalUntapped: 11790,
    campaign: 'Time-constrained members. Weekend brunch after golf, family-friendly events on Saturday afternoons. Make the club a weekend destination, not just a tee time.',
  },
  {
    archetype: 'Declining',
    count: 26,
    currentDining: 18,
    potentialDining: 100,
    currentEvents: 12,
    potentialEvents: 100,
    avgAnnualSpend: 1800,
    untappedDining: 4284,
    untappedEvents: 4576,
    totalUntapped: 8860,
    campaign: 'Re-engagement priority. Personal GM outreach + exclusive "welcome back" event invitation. Focus on reversing decline before revenue capture.',
  },
  {
    archetype: 'New Member',
    count: 18,
    currentDining: 45,
    potentialDining: 100,
    currentEvents: 35,
    potentialEvents: 100,
    avgAnnualSpend: 2400,
    untappedDining: 1980,
    untappedEvents: 2340,
    totalUntapped: 4320,
    campaign: '90-day onboarding program: intro golf clinic, new member mixer, dining tour. Set cross-domain habits early.',
  },
];

export const sourceSystems = ['Member CRM', 'POS', 'Tee Sheet', 'Scheduling', 'Email', 'Complaints'];

// Archetype spend patterns for spend potential analysis
export const getArchetypeSpendPatterns = () => {
  return memberArchetypes.map(a => ({
    archetype: a.archetype,
    count: a.count,
    engagement: { golf: a.golf, dining: a.dining, events: a.events, email: a.email },
    trend: a.trend,
    avgAnnualSpend: Math.round((a.golf * 120 + a.dining * 80 + a.events * 45) / 100),
    spendPotential: Math.round(((100 - a.dining) * 80 + (100 - a.events) * 45) / 100),
  }));
};

// ─── Live data hydration ────────────────────────────────────────────────────
let _d = null;

export const _init = async () => {
  try {
    const res = await fetch('/api/experience-insights');
    if (!res.ok) return;
    _d = await res.json();

    if (Array.isArray(_d.touchpointCorrelations)) {
      touchpointCorrelations.length = 0;
      touchpointCorrelations.push(..._d.touchpointCorrelations);
    }
    if (Array.isArray(_d.correlationInsights)) {
      correlationInsights.length = 0;
      correlationInsights.push(..._d.correlationInsights);
    }
    if (Array.isArray(_d.eventROI)) {
      eventROI.length = 0;
      eventROI.push(..._d.eventROI);
    }
    if (_d.complaintLoyaltyStats) {
      Object.assign(complaintLoyaltyStats, _d.complaintLoyaltyStats);
    }
    if (Array.isArray(_d.archetypeSpendGaps)) {
      archetypeSpendGaps.length = 0;
      archetypeSpendGaps.push(..._d.archetypeSpendGaps);
    }
  } catch {
    /* keep static fallback */
  }
};
