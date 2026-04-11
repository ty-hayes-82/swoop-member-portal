/**
 * Playbook Definitions — product-defined catalog
 *
 * These are the playbook templates: name, description, category, steps.
 * Metrics (triggeredCount, runCount, trackRecord) come from the DB via /api/playbooks.
 */

export const PLAYBOOK_DEFINITIONS = [
  // ── SERVICE RECOVERY ──────────────────────────────────
  {
    id: 'service-save',
    name: 'Service Save Protocol',
    category: 'Service Recovery',
    categoryColor: '#c0392b',
    description: 'An engaged member files a complaint that goes unresolved, leading to resignation within days. One saved resignation protects annual dues plus ancillary revenue.',
    steps: [
      { badge: { text: '\uD83D\uDCE2 Staff Alert', bg: '#fff3cd', color: '#856404' }, title: 'Auto-escalate high-sentiment complaints', detail: 'Complaint auto-routed to department head. Alert includes complaint text, member profile, and last 3 visits.', timing: 'Hour 1\u20132' },
      { badge: { text: '\uD83D\uDEA9 Front Desk Flag', bg: '#f8d7da', color: '#721c24' }, title: 'GM personal alert with member profile', detail: 'GM alert with member tenure, dues level, and complaint details. Recommend personal call today.', timing: 'Hour 2\u20134' },
      { badge: { text: '\uD83C\uDF81 Comp Offer', bg: '#d4edda', color: '#155724' }, title: 'Personal GM follow-up + comp offer', detail: 'Comp offer queued: complimentary dinner for 2. Front desk flagged: greet member by name on next visit.', timing: 'Day 1\u20132' },
    ],
  },
  {
    id: 'new-member-90day',
    name: 'New Member 90-Day Integration',
    category: 'New Member Success',
    categoryColor: '#0ea5e9',
    description: 'New members who don\u2019t build habits in the first 90 days are 4x more likely to resign by Year 2. This playbook triggers at Day 30, 60, and 90 when engagement thresholds aren\u2019t met.',
    steps: [
      { badge: { text: '\uD83E\uDD1D Member Match', bg: '#dbeafe', color: '#1e40af' }, title: 'Introduce to compatible members', detail: 'Pair with established members who share interests. Personal intro email from club manager with suggested tee time together.', timing: 'Day 30' },
      { badge: { text: '\uD83C\uDF89 Family Invite', bg: '#fce7f3', color: '#9d174d' }, title: 'Family & kids event invitation', detail: 'Household invited to upcoming family event. Builds social ties beyond the member.', timing: 'Day 35' },
      { badge: { text: '\uD83D\uDCDE Concierge Touch', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal check-in from club manager', detail: 'Club manager calls: "How\u2019s your first month going? Any questions about tee time booking, dining, or events?"', timing: 'Day 60' },
      { badge: { text: '\uD83D\uDCCB Pulse Check', bg: '#fff7ed', color: '#9a3412' }, title: 'Capture early impressions before dissatisfaction', detail: '3-question pulse survey. Responses route to GM dashboard.', timing: 'Day 90' },
    ],
  },
  {
    id: 'ghost-reactivation',
    name: 'Ghost Member Reactivation',
    category: 'Member Engagement',
    categoryColor: '#6b7280',
    description: 'Members with zero activity across golf, dining, and events for 60+ days. They\u2019re paying dues but getting no value. This playbook catches them before the resignation letter.',
    steps: [
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Warm, no-pressure check-in from the GM', detail: 'No agenda \u2014 just checking in. Call notes logged to member profile.', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDF81 Surprise Gift', bg: '#d4edda', color: '#155724' }, title: 'Tangible reminder shipped to home', detail: 'Premium gift + handwritten note mailed to member\u2019s home address.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Complimentary guest pass removes re-entry barrier', detail: '"Bring a friend this weekend \u2014 guest fees on us." Removes the awkwardness of coming back alone.', timing: 'Day 7' },
      { badge: { text: '\uD83D\uDD04 Win-Back Sequence', bg: '#f8d7da', color: '#721c24' }, title: 'Escalate to full multi-touch campaign', detail: 'If no response after 14 days: email sequence + text from membership director + offer to pause dues.', timing: 'Day 14' },
    ],
  },
  {
    id: 'declining-intervention',
    name: 'Declining Member Intervention',
    category: 'Member Engagement',
    categoryColor: '#dc2626',
    description: 'When a member\u2019s 90-day engagement drops below 30% of their personal baseline, it\u2019s a quiet signal that something is wrong. This playbook catches the decline before the resignation.',
    steps: [
      { badge: { text: '\uD83D\uDCCB Quick Pulse', bg: '#fff7ed', color: '#9a3412' }, title: 'Surface hidden dissatisfaction early', detail: '2-question pulse survey auto-sent when decline detected. Responses flagged to GM within 1 hour.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Personal outreach if survey reveals concerns', detail: 'GM calls directly, briefed with engagement trajectory, tenure, and recent visit history.', timing: 'Day 3\u20135' },
      { badge: { text: '\uD83C\uDF82 Milestone Touch', bg: '#fce7f3', color: '#9d174d' }, title: 'Leverage upcoming birthday or anniversary', detail: 'If a milestone is within 30 days, use it as a warm re-engagement moment.', timing: 'Opportunistic' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Fresh Experience', bg: '#d4edda', color: '#155724' }, title: 'Complimentary lesson or clinic to reignite interest', detail: 'Offer a free lesson with the head pro or invite to an upcoming clinic.', timing: 'Day 7\u201310' },
    ],
  },
  {
    id: 'service-failure-rapid',
    name: 'Service Failure Rapid Response',
    category: 'Service Recovery',
    categoryColor: '#b91c1c',
    description: 'When negative sentiment is detected for a high-value member, the response window shrinks from hours to minutes. Aggressive, value-weighted service recovery.',
    steps: [
      { badge: { text: '\uD83D\uDEA8 Auto-Escalate', bg: '#f8d7da', color: '#721c24' }, title: 'Route to department head within 1 hour', detail: 'Complaint auto-escalated with full context: complaint text, member tenure, annual dues, recent visits, and lifetime spend.', timing: '< 1 hour' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'GM reaches out with full awareness', detail: 'GM calls within 4 hours with personalized acknowledgment of the issue and member history.', timing: '< 4 hours' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Make-Good Dinner', bg: '#d4edda', color: '#155724' }, title: 'Complimentary dinner as accountability gesture', detail: 'Dinner comped at member\u2019s preferred restaurant. GM personally checks in during the meal.', timing: 'Day 1\u20133' },
      { badge: { text: '\u2705 Close the Loop', bg: '#dbeafe', color: '#1e40af' }, title: 'Follow-up confirmation 7 days later', detail: 'Automated follow-up confirming the experience met expectations. Resolution logged to member profile.', timing: 'Day 7' },
    ],
  },
  {
    id: 'post-event',
    name: 'Post-Event Engagement Capture',
    category: 'Events & Programming',
    categoryColor: '#8b5cf6',
    description: 'Members who attend a club event are at peak engagement. But if they don\u2019t return within 7 days, that momentum evaporates. This playbook converts event energy into sustained visits.',
    steps: [
      { badge: { text: '\u26A0\uFE0F Feedback Check', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-check for negative event feedback', detail: 'If any negative feedback was flagged, auto-escalate to event coordinator before outreach begins.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDD Thank You', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal thank-you referencing the event', detail: 'Handwritten-style note referencing specific moments from the event.', timing: 'Day 2' },
      { badge: { text: '\uD83E\uDD1D Introductions', bg: '#dbeafe', color: '#1e40af' }, title: 'Connect with members they met at the event', detail: 'Link attendee with compatible members from the event who share interests.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve a slot for the coming weekend', detail: 'Hold their preferred tee time slot. Converts event enthusiasm into a concrete return visit.', timing: 'Day 4' },
    ],
  },
  {
    id: 'anniversary',
    name: 'Membership Anniversary Celebration',
    category: 'Member Engagement',
    categoryColor: '#d97706',
    description: 'Membership milestones are the moments members reflect on whether the club is still worth it. A proactive, personalized celebration reinforces belonging and reduces resignation risk at renewal time.',
    steps: [
      { badge: { text: '\uD83C\uDF89 GM Recognition', bg: '#fef3c7', color: '#92400e' }, title: 'Personalized card with member stats', detail: 'GM-signed card with member tenure stats, favorite tee times, and personal touches.', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDF81 Milestone Gift', bg: '#d4edda', color: '#155724' }, title: 'Anniversary-appropriate gift', detail: 'Tiered gift based on milestone: Year 1 merchandise, Year 5 engraved item, Year 10+ premium gift.', timing: 'Anniversary day' },
      { badge: { text: '\uD83C\uDF7E VIP Dinner', bg: '#ede9fe', color: '#5b21b6' }, title: 'Exclusive event invitation', detail: 'Invitation to annual milestone dinner for long-term members. Reserved table with recognition.', timing: 'Next event' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Complimentary Round', bg: '#dbeafe', color: '#1e40af' }, title: 'Prime tee time on anniversary week', detail: 'Complimentary prime slot during anniversary week with recognition from the starter.', timing: 'Anniversary week' },
    ],
  },

  // ── REVENUE ────────────────────────────────────
  {
    id: 'demand-surge',
    name: 'Demand Surge Playbook',
    category: 'Revenue',
    categoryColor: '#2563eb',
    description: 'When tee time demand spikes \u2014 holidays, tournaments, perfect weather weekends \u2014 this playbook dynamically adjusts pricing tiers, sends targeted offers, and optimizes slot allocation.',
    steps: [
      { badge: { text: '\uD83D\uDCC8 Demand Spike', bg: '#dbeafe', color: '#1e40af' }, title: 'Auto-detect booking surge pattern', detail: 'Booking velocity detected above baseline. Prime slots approaching full fill rate days out.', timing: 'Day -5' },
      { badge: { text: '\uD83D\uDCB0 Price Adjust', bg: '#fef3c7', color: '#92400e' }, title: 'Activate tiered premium pricing', detail: 'Premium tier activated for prime slots. Standard pricing maintained for off-peak. Guest fee premium auto-applied.', timing: 'Day -3' },
      { badge: { text: '\uD83D\uDCE7 Targeted Offer', bg: '#d4edda', color: '#155724' }, title: 'Send offers to low-frequency members', detail: 'Push notification to members who haven\u2019t played recently with a reserved slot offer.', timing: 'Day -2' },
    ],
  },
  {
    id: 'snowbird-opener',
    name: 'Snowbird Season-Opener',
    category: 'Revenue',
    categoryColor: '#0891b2',
    description: 'Triggers before each Snowbird member\u2019s historical arrival date and turns a seasonal return into a VIP homecoming.',
    steps: [
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve their preferred slot for arrival weekend', detail: 'Favorite tee time held for arrival weekend with welcome-back message.', timing: 'Week -3' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Welcome Dinner', bg: '#fce7f3', color: '#9d174d' }, title: 'Snowbird welcome-back dinner invitation', detail: 'Invite to welcome-back dinner with other returning seasonal members.', timing: 'Week -2' },
      { badge: { text: '\uD83D\uDCDD Concierge Note', bg: '#ede9fe', color: '#5b21b6' }, title: 'Club manager update on what\u2019s new', detail: 'Personal note from club manager with updates on new offerings, renovations, and upcoming events.', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDFC6 Tournament Access', bg: '#dbeafe', color: '#1e40af' }, title: 'Early access to first seasonal tournament', detail: 'VIP registration for the season-opening tournament. Priority pairing to rebuild social connections.', timing: 'Arrival week' },
    ],
  },
  {
    id: 'event-amplifier',
    name: 'Social Butterfly Event Amplifier',
    category: 'Revenue',
    categoryColor: '#ec4899',
    description: 'When event registration is below capacity with time remaining, this playbook activates Social Butterfly members as your event-fill engine.',
    steps: [
      { badge: { text: '\uD83C\uDF1F VIP Access', bg: '#fce7f3', color: '#9d174d' }, title: 'Exclusive angle for Social Butterflies', detail: 'Reserved table offer with preferred seating for their group.', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDFAB Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Let them bring a non-member friend', detail: 'Complimentary guest passes. Fills seats AND generates prospect leads.', timing: 'Day 2' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Dinner Bundle', bg: '#d4edda', color: '#155724' }, title: 'Pre-event dinner to increase F&B spend', detail: 'Special pre-event dinner menu with wine pairings to add F&B revenue per head.', timing: 'Day 3' },
    ],
  },
  {
    id: 'weather-window',
    name: 'Weekend Warrior Weather Window',
    category: 'Revenue',
    categoryColor: '#f59e0b',
    description: 'When weather forecasts show a perfect weekend and prime morning slots are open, this playbook fills tee times, generates guest revenue, and drives pro shop spend.',
    steps: [
      { badge: { text: '\u2600\uFE0F Tee Time Push', bg: '#fef3c7', color: '#92400e' }, title: 'Push notification with reserved slot', detail: 'Sent to Weekend Warriors who haven\u2019t booked yet with a reserved slot offer.', timing: 'Wednesday PM' },
      { badge: { text: '\uD83C\uDFAB Guest Invite', bg: '#dbeafe', color: '#1e40af' }, title: 'Fill foursomes with prospective members', detail: 'Guest fees waived. Each guest is a prospect lead logged to pipeline.', timing: 'Thursday AM' },
      { badge: { text: '\uD83D\uDED2 Pro Shop Credit', bg: '#d4edda', color: '#155724' }, title: 'Credit to drive ancillary spend', detail: 'Pro shop credit valid on the day only. Drives incremental spend per member.', timing: 'Friday AM' },
    ],
  },
  {
    id: 'dining-dormancy',
    name: 'Dining Dormancy Recovery',
    category: 'Revenue',
    categoryColor: '#ea580c',
    description: 'Active golfers who never eat at the club. They\u2019re on the property regularly but spending nothing in dining. This playbook cross-sells F&B to members already through the front door.',
    steps: [
      { badge: { text: '\uD83C\uDF7D\uFE0F Chef\u2019s Table', bg: '#fff7ed', color: '#9a3412' }, title: 'Invitation to a curated dining experience', detail: 'Complimentary chef\u2019s table tasting menu invitation.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Family Night', bg: '#fce7f3', color: '#9d174d' }, title: 'Family dining invitation', detail: 'Family night invitation to bring the whole household into the club.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDF77 Locker Surprise', bg: '#d4edda', color: '#155724' }, title: 'Gift left in locker after next round', detail: 'Wine bottle or dining voucher placed in locker with a personal note after their next round.', timing: 'Next visit' },
    ],
  },

  // ── OPERATIONS ─────────────────────────────────
  {
    id: 'staffing-gap',
    name: 'Staffing Adjustment',
    category: 'Operations',
    categoryColor: '#7c3aed',
    description: 'When staffing doesn\u2019t match demand \u2014 call-outs, weather shifts, event overlap, or seasonal spikes \u2014 this playbook connects schedules to demand signals and detects gaps before they become member complaints.',
    steps: [
      { badge: { text: '\u26A0\uFE0F Coverage Gap', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-detect staffing shortfall', detail: 'Staffing ratio below threshold detected. Department head alerted with gap analysis.', timing: 'Hour -4' },
      { badge: { text: '\uD83D\uDCDE Recall Alert', bg: '#dbeafe', color: '#1e40af' }, title: 'Activate cross-trained staff', detail: 'Cross-trained staff contacted. Updated floor plan sent to department head.', timing: 'Hour -3' },
      { badge: { text: '\u23F1 Pace Adjust', bg: '#ede9fe', color: '#5b21b6' }, title: 'Adjust reservation pacing', detail: 'Reservations re-paced with larger gaps between seatings. Walk-in wait estimate updated.', timing: 'Hour -2' },
    ],
  },
];

export const CATEGORY_FILTERS = ['All', 'Service Recovery', 'New Member Success', 'Member Engagement', 'Events & Programming', 'Revenue', 'Operations'];

export const CATEGORY_META = {
  'Service Recovery':      { icon: '\uD83D\uDEE1\uFE0F', color: '#DC2626', dotColor: '#EF4444', bg: '#FEF2F2' },
  'New Member Success':    { icon: '\uD83C\uDFAF', color: '#EA580C', dotColor: '#F97316', bg: '#FFF7ED' },
  'Member Engagement':     { icon: '\uD83D\uDCAC', color: '#2563EB', dotColor: '#3B82F6', bg: '#EFF6FF' },
  'Events & Programming':  { icon: '\uD83D\uDCC5', color: '#039855', dotColor: '#12b76a', bg: '#F0FDF4' },
  'Revenue':               { icon: '\uD83D\uDCB0', color: '#9333EA', dotColor: '#A855F7', bg: '#FDF4FF' },
  'Operations':            { icon: '\u2699\uFE0F',  color: '#0284C7', dotColor: '#0EA5E9', bg: '#F0F9FF' },
};
