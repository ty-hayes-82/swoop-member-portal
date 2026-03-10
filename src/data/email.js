// Email campaign data — Oakmont Hills CC, January 2026

export const emailCampaigns = [
  { campaign: 'Happy New Year',         type: 'Newsletter',   date: 'Jan 2'  },
  { campaign: 'Course Maintenance',     type: 'Operational',  date: 'Jan 6'  },
  { campaign: 'Member-Guest Details',   type: 'Event Promo',  date: 'Jan 9'  },
  { campaign: 'Wine Dinner Recap',      type: 'Newsletter',   date: 'Jan 14' },
  { campaign: 'MLK Weekend',            type: 'Event Promo',  date: 'Jan 17' },
  { campaign: 'New Winter Menu',        type: 'F&B Promo',    date: 'Jan 21' },
  { campaign: 'February Preview',       type: 'Newsletter',   date: 'Jan 27' },
  { campaign: 'Super Bowl Party',       type: 'Event Promo',  date: 'Jan 30' },
];

// Open rates by campaign × archetype (rows=campaigns, cols=archetypes)
export const emailHeatmap = [
  { campaign: 'Happy New Year',       archetype: 'Social Butterfly', openRate: 0.78, clickRate: 0.32 },
  { campaign: 'Happy New Year',       archetype: 'Balanced Active',  openRate: 0.62, clickRate: 0.24 },
  { campaign: 'Happy New Year',       archetype: 'Die-Hard Golfer',  openRate: 0.44, clickRate: 0.12 },
  { campaign: 'Happy New Year',       archetype: 'New Member',       openRate: 0.71, clickRate: 0.28 },
  { campaign: 'Happy New Year',       archetype: 'Weekend Warrior',  openRate: 0.38, clickRate: 0.14 },
  { campaign: 'Happy New Year',       archetype: 'Declining',        openRate: 0.22, clickRate: 0.06 },
  { campaign: 'Happy New Year',       archetype: 'Ghost',            openRate: 0.08, clickRate: 0.02 },
  { campaign: 'Member-Guest Details', archetype: 'Social Butterfly', openRate: 0.74, clickRate: 0.38 },
  { campaign: 'Member-Guest Details', archetype: 'Balanced Active',  openRate: 0.68, clickRate: 0.34 },
  { campaign: 'Member-Guest Details', archetype: 'Die-Hard Golfer',  openRate: 0.72, clickRate: 0.44 },
  { campaign: 'Member-Guest Details', archetype: 'New Member',       openRate: 0.65, clickRate: 0.29 },
  { campaign: 'Member-Guest Details', archetype: 'Weekend Warrior',  openRate: 0.42, clickRate: 0.18 },
  { campaign: 'Member-Guest Details', archetype: 'Declining',        openRate: 0.18, clickRate: 0.04 },
  { campaign: 'Member-Guest Details', archetype: 'Ghost',            openRate: 0.06, clickRate: 0.01 },
  { campaign: 'New Winter Menu',      archetype: 'Social Butterfly', openRate: 0.82, clickRate: 0.44 },
  { campaign: 'New Winter Menu',      archetype: 'Balanced Active',  openRate: 0.58, clickRate: 0.22 },
  { campaign: 'New Winter Menu',      archetype: 'Die-Hard Golfer',  openRate: 0.28, clickRate: 0.08 },
  { campaign: 'New Winter Menu',      archetype: 'New Member',       openRate: 0.66, clickRate: 0.30 },
  { campaign: 'New Winter Menu',      archetype: 'Weekend Warrior',  openRate: 0.34, clickRate: 0.12 },
  { campaign: 'New Winter Menu',      archetype: 'Declining',        openRate: 0.14, clickRate: 0.03 },
  { campaign: 'New Winter Menu',      archetype: 'Ghost',            openRate: 0.04, clickRate: 0.01 },
];

export const decayingMembers = [
  { memberId: 'mbr_042', name: 'Kevin Hurst',  nov: 0.41, dec: 0.22, jan: 0.08, trend: -80 },
  { memberId: 'mbr_089', name: 'Anne Jordan',  nov: 0.38, dec: 0.24, jan: 0.14, trend: -63 },
  { memberId: 'mbr_271', name: 'Robert Callahan',   nov: 0.44, dec: 0.28, jan: 0.12, trend: -73 },
  { memberId: 'mbr_156', name: 'Priya Brock',   nov: 0.52, dec: 0.38, jan: 0.22, trend: -58 },
  { memberId: 'mbr_198', name: 'Marcus Flynn',  nov: 0.48, dec: 0.34, jan: 0.18, trend: -63 },
];
