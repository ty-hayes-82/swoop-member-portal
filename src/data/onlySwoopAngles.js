export const onlySwoopAngles = {
  dailyBriefing: {
    question: 'Which preventable resignations are unfolding before lunch?',
    insights: [
      'Complaint log · James Whitfield filed Jan 16 and no follow-up recorded',
      'Tee sheet · Arrives 10:40 AM today with Balanced Active archetype and low satisfaction score',
      'Staffing · Grill Room still short a lunch server after last Friday\'s understaffed shift',
    ],
    action: {
      text: 'GM calls James before 10:15 AM, loops in Service Recovery to close the loop and comp lunch.',
      owner: 'GM / Service Recovery',
      dueBy: '10:15 AM',
    },
  },
  memberHealth: {
    question: 'Who looks fine in single systems but is actually slipping across golf, dining, and email?',
    insights: [
      'Rounds · 68% drop over 6 weeks despite tee sheet still showing Saturday preference',
      'Dining · Grill spend down $540 versus typical month with no offsetting bar activity',
      'Email · Weekly briefing opens fell from 72% → 24%, indicating disengagement',
    ],
    action: {
      text: 'Membership director schedules 3 outreach calls focused on members under 40 health scores.',
      owner: 'Membership Director',
      dueBy: 'Today',
    },
  },
  waitlistDemand: {
    question: 'Which tee times must be held for high-risk members before the general waitlist sees them?',
    insights: [
      'Waitlist · 4 members flagged Critical requested Sat 8:10 AM within last 48h',
      'Revenue · Those members average $2.4K monthly total spend when retained',
      'Demand · Cancellation risk spikes to 72% for this slot because of wind + staff shortage combination',
    ],
    action: {
      text: 'Retention desk routes 8:10 AM slot to Karen Russo first, then notifies concierge to confirm personally.',
      owner: 'Retention Desk',
      dueBy: 'Within 15 min',
    },
  },
  fbPerformance: {
    question: 'Which slow rounds are about to drain $5.7K in dining covers this week?',
    insights: [
      'Tee sheet · Friday afternoon pace projections show +18 minutes on back nine',
      'POS · Grill conversion drops 35% whenever rounds exceed 4h 20m',
      'Weather · High winds forecast at noon push golfers inside at staggered times',
    ],
    action: {
      text: 'F&B manager pre-positions 2 floating servers between 11:30 AM-1:30 PM and pushes patio menu promos.',
      owner: 'F&B Manager',
      dueBy: 'Before 11:15 AM',
    },
  },
  staffingService: {
    question: 'Where will one staffing gap cascade into complaints and resign risk today?',
    insights: [
      'Scheduling · Friday lunch shift missing 2 tenured servers because of PTO overlap',
      'Complaints · 3 unresolved Grill tickets cite slow service during the same window',
      'Member risk · Two at-risk members are booked for lunch within that gap',
    ],
    action: {
      text: 'Ops lead reassigns a banquet floater + confirms concierge drop-ins at Grill tables 12 and 14.',
      owner: 'Ops Lead',
      dueBy: '11:00 AM',
    },
  },
  operations: {
    question: 'Which operational decision moves real dollars in the next six hours?',
    insights: [
      'Weather · 28 tee times threatened by 20mph gusts after 1:00 PM',
      'Staffing · Cart crew shortage adds 11-minute turnaround, compounding the delay',
      'Revenue · $8.7K in tee sheet + $3.1K in F&B at risk if golfers bail before lunch',
    ],
    context: [
      { label: 'Slots threatened', value: '28 tee times', icon: '📊' },
      { label: 'Dining at risk', value: '$3.1K', icon: '🍽️' },
      { label: 'Crew coverage', value: '−2 carts', icon: '🛺' },
    ],
    action: {
      text: 'Head pro staggers tee starts by 8 minutes and texts on-course concierge to greet board members personally.',
      owner: 'Head Pro',
      dueBy: 'ASAP',
    },
  },
  revenuePipeline: {
    question: 'Which guests convert if membership calls today?',
    insights: [
      'Guest behavior · David Chen logged 8 visits + $1,240 spend in 30 days',
      'Sponsorship · Board member Carol Pierce flagged him as ready for invite',
      'CRM · Notes show spouse touring rival club next week',
    ],
    action: {
      text: 'Membership chair schedules sponsor call and offers invite paperwork before Thursday board prep.',
      owner: 'Membership Chair',
      dueBy: 'End of day',
    },
  },
  agentCommand: {
    question: 'Which approvals actually move money or retention right now?',
    insights: [
      'Action queue · 7 pending approvals worth $148K in dues + $23K ancillary revenue',
      'Data proof · Each action cites tee sheet + POS + complaint evidence with confidence score',
      'Ops impact · Four actions unblock staffing/service gaps tied to active complaints',
    ],
    action: {
      text: 'GM clears the queue, assigning outreach owners and converting 3 approvals into tasks with due dates.',
      owner: 'GM',
      dueBy: 'Within 30 min',
    },
  },
  locationIntelligence: {
    question: 'Which at-risk members are on property right now and what should staff do before they leave?',
    insights: [
      'GPS · Member app shows James Whitfield on hole 14 with 26 minutes until Grill Room arrival',
      'Member health · Score 42 with 6-day complaint unresolved and dining down 48%',
      'Staffing · Only one concierge assigned to Grill entrance until 1:30 PM',
    ],
    action: {
      text: 'Service recovery lead meets James at Grill Room with his usual table + drink, confirms complaint resolution timeline.',
      owner: 'Service Recovery',
      dueBy: 'In 30 min',
    },
  },
};
