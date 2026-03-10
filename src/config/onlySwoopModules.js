export const onlySwoopModules = {
  'daily-briefing': {
    question: 'Which preventable resignations are unfolding before lunch?',
    sources: ['Complaint log', 'Tee sheet pacing', 'Dining / POS'],
    insights: [
      'James Whitfield: unresolved Jan 16 complaint + zero dining in 6 days + walks off #18 at 10:42 a.m.',
      'Two other at-risk members are on property during the wind advisory — $36K in dues physically on site this morning.',
    ],
    action: {
      text: 'Have concierge meet Whitfield as he exits the course, comp his Grill Room lunch, and log the follow-up before 11:45 a.m.',
      owner: 'GM or Concierge Lead',
      dueBy: '11:45 a.m.',
    },
  },
  'member-health': {
    question: 'Who is slipping even though each system alone says they’re fine?',
    sources: ['Email engagement', 'Rounds played', 'Dining spend'],
    insights: [
      'Ali Beck: email opens −58%, dining −41%, zero rounds in 21 days even though CRM still lists her as “active”.',
      'Giulia Ives + Suresh Drake share “behavioral decay” pattern — no event attendance + unresolved service ticket hiding inside staffing notes.',
    ],
    action: {
      text: 'Membership director calls the top three “Outreach this week” members with a specific talking point pulled from the decay strip.',
      owner: 'Membership Director',
      dueBy: '4:00 p.m.',
    },
  },
  'waitlist-demand': {
    question: 'Which guest actually deserves the open 10:42 slot?',
    sources: ['Waitlist queue', 'Member health scores', 'Slot economics'],
    insights: [
      'Kenneth Williams (Health 16) carries $312 retention value and a sponsor request, outranking FIFO #1 who would cancel anyway.',
      'Cancellation prediction shows 18% of today’s backlog will churn in 28 hours without intervention — queue reprioritized by dues impact.',
    ],
    action: {
      text: 'Assign the 10:42 slot to Kenneth, notify his sponsor, and mark the save so the board sees the $312 protected revenue.',
      owner: 'Golf Ops Lead',
      dueBy: '1:00 p.m.',
    },
  },
  'fb-performance': {
    question: 'How does tee sheet pace drive tonight’s covers?',
    sources: ['Pace-of-play sensors', 'POS checks', 'Staff rota'],
    insights: [
      'Last Friday’s 38-minute back-nine delays cut Grill Room conversion 35% and left $5.7K on the table.',
      'Today’s wind pattern plus under-staffed lunch shift repeats the same conditions unless we add coverage.',
    ],
    action: {
      text: 'Add one swing server 4–8 p.m., stage turn snacks on hole 14, and brief F&B lead on the predicted surge before 2 p.m.',
      owner: 'Service Director',
      dueBy: '2:00 p.m.',
    },
  },
  'staffing-service': {
    question: 'Where will coverage gaps trigger the next resignation?',
    sources: ['Scheduling', 'Complaint history', 'Member risk'],
    insights: [
      'Grill Room short two servers on Jan 16 → 40-minute lunch → complaint → resignation risk now at 72-hour window.',
      'This Friday shows the same gap plus two VIP arrivals — risk multiplier is 1.8× if no coverage added.',
    ],
    action: {
      text: 'Assign Robert Mills recovery plan to the service manager, confirm callback owner, and log comp approval before doors open.',
      owner: 'Service Manager',
      dueBy: '12:30 p.m.',
    },
  },
  operations: {
    question: 'Which operational disruptions hit revenue before 2 p.m.?',
    sources: ['Weather radar', 'Tee sheet utilization', 'Labor plan'],
    insights: [
      'Wind advisory at noon collides with two partially staffed tee blocks — forecasted $8.7K at risk.',
      'Caddie shortage on holes 10–18 already pushed last Friday’s pace beyond 4:45 — trend repeating without intervention.',
    ],
    action: {
      text: 'Shift starters to the back nine, notify members on pace risk, and publish a 1:30 p.m. update to operations staff.',
      owner: 'Director of Golf',
      dueBy: '1:30 p.m.',
    },
  },
  'growth-pipeline': {
    question: 'Which guests convert if we call today?',
    sources: ['Guest visit history', 'Spend + sponsor notes', 'Member CRM'],
    insights: [
      'Julie Quinn has 6 visits, $553 in spend, and sponsor follow-up overdue — still listed as “warm” but behaves like a hot lead.',
      'Two corporate prospects log zero spend yet show $36K potential because dues defaults were never adjusted — data corrected here.',
    ],
    action: {
      text: 'Membership chair calls the top three hot prospects with varied dues projections and updates sponsor notes before tomorrow’s board packet.',
      owner: 'Membership Chair',
      dueBy: 'End of day',
    },
  },
  'agent-command': {
    question: 'Which actions prove their ROI before the board meets?',
    sources: ['Agent recommendations', 'Member health signals', 'Financial impact model'],
    insights: [
      'Escalate Whitfield complaint: $18K dues tied to a single callback; Swoop surfaces the unresolved ticket + spend drop.',
      'Retention routing action shows $733K annual dues coverage if today’s queue is approved — each button click is a board talking point.',
    ],
    action: {
      text: 'Approve the three highest dollar-impact cards (Whitfield, Grill Room staffing, retention routing) and assign owners with due times.',
      owner: 'GM + Department Leads',
      dueBy: 'Noon',
    },
  },
  'location-intelligence': {
    question: 'Who is on property right now that we can save?',
    sources: ['Swoop app GPS', 'Member risk scores', 'Service alerts'],
    insights: [
      '47 members on property, three of them at-risk — Whitfield on hole 14, Sandra Chen seated in Grill Room, Robert Mills on range.',
      'Service recovery alert pulsing because two board members plus a high-risk member are within the same outlet.',
    ],
    action: {
      text: 'Dispatch concierge to James at 10:40 a.m., assign hospitality lead to Sandra, and log each touchpoint for tomorrow’s briefing.',
      owner: 'Concierge / Member Experience',
      dueBy: 'Live (within 15 min)',
    },
  },
};
