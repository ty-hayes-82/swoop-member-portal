// Outreach Playbooks — archetype-specific retention actions
// GM can customize these per archetype via the Outreach Playbooks page

export const outreachCategories = [
  { key: 'personal', label: 'Personal Touch', icon: '\u2764\uFE0F', color: '#e11d48' },
  { key: 'social', label: 'Social & Community', icon: '\uD83E\uDD1D', color: '#7c3aed' },
  { key: 'engagement', label: 'Re-Engagement', icon: '\u26A1', color: '#f59e0b' },
  { key: 'service', label: 'Service Recovery', icon: '\uD83D\uDEE0\uFE0F', color: '#0ea5e9' },
  { key: 'milestone', label: 'Milestones & Celebrations', icon: '\uD83C\uDF89', color: '#039855' },
];

export const defaultOutreachActions = [
  // Personal Touch
  {
    id: 'birthday-outreach',
    category: 'milestone',
    label: 'Birthday/Anniversary Outreach',
    description: 'Flag approaching milestones and schedule a celebration touch \u2014 complimentary dinner, cake at the club, or a personal card from the GM.',
    defaultOwner: 'Membership Director',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['all'],
  },
  {
    id: 'send-gift',
    category: 'personal',
    label: 'Send a Gift or Surprise',
    description: 'Trigger a small gesture: pro shop gift card, sleeve of premium balls, or a branded item shipped to their home.',
    defaultOwner: 'Membership Director',
    effort: 'medium',
    impact: 'high',
    applicableArchetypes: ['all'],
  },
  {
    id: 'reserve-tee-time',
    category: 'personal',
    label: 'Reserve a Preferred Tee Time',
    description: 'Proactively hold a prime weekend tee time and send a "we saved this for you" message. Signals exclusivity and care.',
    defaultOwner: 'Head Golf Professional',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['Die-Hard Golfer', 'Weekend Warrior', 'Balanced Active', 'Snowbird'],
  },
  {
    id: 'guest-pass',
    category: 'social',
    label: 'Offer a Complimentary Guest Pass',
    description: 'Let them bring a friend for a round or dining experience. Social members re-engage when they can bring their circle.',
    defaultOwner: 'Membership Director',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['all'],
  },
  {
    id: 'concierge-touch',
    category: 'personal',
    label: 'Concierge Touch',
    description: 'Personal outreach from the concierge or club manager \u2014 a warm check-in call or handwritten note showing the club values their membership.',
    defaultOwner: 'Club Manager',
    effort: 'low',
    impact: 'medium',
    applicableArchetypes: ['all'],
  },
  {
    id: 'gm-personal-call',
    category: 'personal',
    label: 'GM Personal Call',
    description: 'Direct call from the GM to check in, address concerns, or simply reinforce the relationship. Most effective for high-value or critical members.',
    defaultOwner: 'GM',
    effort: 'medium',
    impact: 'very-high',
    applicableArchetypes: ['all'],
  },
  {
    id: 'win-back-campaign',
    category: 'engagement',
    label: 'Trigger Win-Back Campaign',
    description: 'A multi-touch sequence (personal note \u2192 call \u2192 in-person invite \u2192 gift) that runs automatically over 2\u20133 weeks.',
    defaultOwner: 'Membership Director',
    effort: 'high',
    impact: 'very-high',
    applicableArchetypes: ['Declining', 'Ghost', 'Weekend Warrior'],
  },
  {
    id: 'feedback-survey',
    category: 'service',
    label: 'Survey / Feedback Request',
    description: 'Send a short, personal "How are we doing for you?" check-in that uncovers hidden dissatisfaction before it becomes a resignation letter.',
    defaultOwner: 'Membership Director',
    effort: 'low',
    impact: 'medium',
    applicableArchetypes: ['all'],
  },
  {
    id: 'family-invite',
    category: 'social',
    label: 'Family & Kids Event Invite',
    description: 'Invite the member and their family to an upcoming family event, kids clinic, or themed dinner night.',
    defaultOwner: 'Events Director',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['Social Butterfly', 'Balanced Active', 'New Member'],
  },
  {
    id: 'private-lesson',
    category: 'engagement',
    label: 'Complimentary Lesson or Clinic',
    description: 'Offer a free lesson with the pro or invite to an upcoming golf clinic. Re-engages golfers through skill improvement.',
    defaultOwner: 'Head Golf Professional',
    effort: 'medium',
    impact: 'high',
    applicableArchetypes: ['Die-Hard Golfer', 'Weekend Warrior', 'New Member', 'Balanced Active'],
  },
  {
    id: 'dining-experience',
    category: 'social',
    label: 'Complimentary Dining Experience',
    description: 'Invite for a complimentary dinner or tasting event. Works especially well for social and dining-focused members.',
    defaultOwner: 'F&B Director',
    effort: 'medium',
    impact: 'high',
    applicableArchetypes: ['Social Butterfly', 'Balanced Active', 'Declining'],
  },
  {
    id: 'pro-shop-credit',
    category: 'engagement',
    label: 'Pro Shop Credit',
    description: 'Issue a $50\u2013$100 pro shop credit as a thank-you or re-engagement incentive. Drives a visit and creates goodwill.',
    defaultOwner: 'Head Golf Professional',
    effort: 'medium',
    impact: 'medium',
    applicableArchetypes: ['Die-Hard Golfer', 'Weekend Warrior', 'Snowbird'],
  },
  {
    id: 'member-intro',
    category: 'social',
    label: 'Introduce to Other Members',
    description: 'Connect the member with others who share similar interests \u2014 playing partners, dining companions, or committee involvement.',
    defaultOwner: 'Membership Director',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['New Member', 'Social Butterfly', 'Snowbird'],
  },
  {
    id: 'exclusive-event',
    category: 'social',
    label: 'VIP / Exclusive Event Invite',
    description: 'Invite to a members-only wine dinner, pro-am event, or exclusive tournament. Creates a sense of belonging and value.',
    defaultOwner: 'Events Director',
    effort: 'low',
    impact: 'high',
    applicableArchetypes: ['all'],
  },
  {
    id: 'service-recovery',
    category: 'service',
    label: 'Service Recovery Follow-Up',
    description: 'When a complaint is logged, trigger an immediate personal follow-up with resolution and a goodwill gesture.',
    defaultOwner: 'Club Manager',
    effort: 'medium',
    impact: 'very-high',
    applicableArchetypes: ['all'],
  },
];

// Archetype-specific recommended playbooks (priority-ordered)
export const archetypePlaybooks = {
  'Die-Hard Golfer': {
    description: 'Lives for the course. Re-engage through golf experiences and recognition.',
    topActions: ['reserve-tee-time', 'private-lesson', 'pro-shop-credit', 'birthday-outreach', 'guest-pass'],
  },
  'Social Butterfly': {
    description: 'Thrives on dining, events, and community. Re-engage through social connections.',
    topActions: ['dining-experience', 'family-invite', 'exclusive-event', 'member-intro', 'guest-pass'],
  },
  'Balanced Active': {
    description: 'Uses everything \u2014 golf, dining, events. Broad engagement approach works best.',
    topActions: ['concierge-touch', 'guest-pass', 'exclusive-event', 'birthday-outreach', 'feedback-survey'],
  },
  'Weekend Warrior': {
    description: 'Weekends only. Value convenience and prime-time access.',
    topActions: ['reserve-tee-time', 'guest-pass', 'private-lesson', 'pro-shop-credit', 'birthday-outreach'],
  },
  'Declining': {
    description: 'Actively disengaging. Urgent, high-touch outreach required.',
    topActions: ['gm-personal-call', 'win-back-campaign', 'feedback-survey', 'dining-experience', 'send-gift'],
  },
  'New Member': {
    description: 'Still forming habits. Onboarding touches and social integration are critical.',
    topActions: ['member-intro', 'concierge-touch', 'family-invite', 'private-lesson', 'guest-pass'],
  },
  'Ghost': {
    description: 'Minimal or zero engagement. Requires direct outreach to re-establish connection.',
    topActions: ['gm-personal-call', 'win-back-campaign', 'send-gift', 'feedback-survey', 'exclusive-event'],
  },
  'Snowbird': {
    description: 'Seasonal member. Time outreach around their active months.',
    topActions: ['reserve-tee-time', 'concierge-touch', 'member-intro', 'exclusive-event', 'birthday-outreach'],
  },
};

// Get recommended actions for a specific archetype (checks localStorage for GM customizations)
export function getActionsForArchetype(archetype) {
  // Check for GM-customized playbook in localStorage
  try {
    const saved = localStorage.getItem('swoop_outreach_playbooks');
    if (saved) {
      const playbooks = JSON.parse(saved);
      if (playbooks[archetype]?.enabled?.length > 0) {
        return playbooks[archetype].enabled
          .map(id => defaultOutreachActions.find(a => a.id === id))
          .filter(Boolean);
      }
    }
  } catch (e) { /* ignore */ }
  // Fall back to defaults
  const playbook = archetypePlaybooks[archetype];
  if (!playbook) return defaultOutreachActions.slice(0, 5);
  return playbook.topActions.map(id => defaultOutreachActions.find(a => a.id === id)).filter(Boolean);
}

// Get all actions applicable to an archetype
export function getAllActionsForArchetype(archetype) {
  return defaultOutreachActions.filter(
    a => a.applicableArchetypes.includes('all') || a.applicableArchetypes.includes(archetype)
  );
}

export function getActionById(id) {
  return defaultOutreachActions.find(a => a.id === id);
}
