import { useState, useMemo } from 'react';
import { theme } from '@/config/theme';
import PageTransition from '@/components/ui/PageTransition';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';

// ────────────────────────────────────────────────
// Playbook data
// ────────────────────────────────────────────────

const PLAYBOOKS = [
  // ── RETENTION ──────────────────────────────────
  {
    id: 'service-save',
    triggeredCount: 3,
    name: 'Service Save Protocol',
    category: 'Retention',
    categoryColor: '#c0392b',
    description: 'An engaged member files a complaint that goes unresolved, leading to resignation within days. One saved resignation protects $18K\u2013$22K in dues plus $3K\u2013$5K in ancillary revenue.',
    triggeredFor: { name: 'James Whitfield', note: '6-year member in good standing \u2014 complaint from this profile is a red flag' },
    monthlyImpact: '$18K',
    yearlyImpact: '$216K/yr',
    steps: [
      { badge: { text: '\uD83D\uDCE2 Staff Alert', bg: '#fff3cd', color: '#856404' }, title: 'Auto-escalate high-sentiment complaints', detail: 'James Whitfield\u2019s complaint (slow service, felt ignored) \u2192 auto-routed to F&B Director. Alert includes complaint text, member profile, and last 3 visits.', timing: 'Hour 1\u20132' },
      { badge: { text: '\uD83D\uDEA9 Front Desk Flag', bg: '#f8d7da', color: '#721c24' }, title: 'GM personal alert with member profile', detail: 'GM alert: "James Whitfield \u2014 member since 2019, $18K/yr dues. Complaint about slow lunch on Jan 16 \u2014 unresolved 4 days. Recommend personal call today."', timing: 'Hour 2\u20134' },
      { badge: { text: '\uD83C\uDF81 Comp Offer', bg: '#d4edda', color: '#155724' }, title: 'Personal GM follow-up + comp offer', detail: 'Comp offer queued: complimentary dinner for 2. Front desk flagged: greet James by name on next visit.', timing: 'Day 1\u20132' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '4x run', result: '3 of 4 at-risk members retained', impact: '$54K dues protected' },
      { period: 'Q3 2025', runs: '2x run', result: '2 of 2 at-risk members retained', impact: '$36K dues protected' },
    ],
    before: [
      { label: 'Avg response to negative feedback', value: '48+ hours' },
      { label: 'Complaint resolution rate', value: '62%' },
      { label: 'Resignations from complaints', value: '1 this month' },
    ],
    after: [
      { label: 'Response to high-sentiment feedback', value: '< 2 hours' },
      { label: 'Complaint resolution rate', value: '94%' },
      { label: 'Preventable resignations', value: '0' },
    ],
  },
  {
    id: 'new-member-90day',
    triggeredCount: 8,
    name: 'New Member 90-Day Integration',
    category: 'Retention',
    categoryColor: '#0ea5e9',
    description: 'New members who don\u2019t build habits in the first 90 days are 4x more likely to resign by Year 2. This playbook triggers at Day 30, 60, and 90 when engagement thresholds aren\u2019t met \u2014 fewer than 3 rounds, zero dining visits, or zero events attended.',
    triggeredFor: { name: 'Rachel Simmons', note: 'Day 34 \u2014 1 round played, 0 dining, 0 events. Integration score: 18%' },
    monthlyImpact: '$22K',
    yearlyImpact: '$264K/yr',
    steps: [
      { badge: { text: '\uD83E\uDD1D Member Match', bg: '#dbeafe', color: '#1e40af' }, title: 'Introduce to compatible members', detail: 'Rachel paired with 2 Balanced Active members who share her interest in weekend golf. Personal intro email from club manager with suggested tee time together.', timing: 'Day 30' },
      { badge: { text: '\uD83C\uDF89 Family Invite', bg: '#fce7f3', color: '#9d174d' }, title: 'Family & kids event invitation', detail: 'Rachel\u2019s household invited to upcoming Family BBQ & Pool Day. Includes spouse and 2 children \u2014 builds social ties beyond the member.', timing: 'Day 35' },
      { badge: { text: '\uD83D\uDCDE Concierge Touch', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal check-in from club manager', detail: 'Club manager calls Rachel: "How\u2019s your first month going? Any questions about tee time booking, dining reservations, or upcoming events?"', timing: 'Day 60' },
      { badge: { text: '\uD83D\uDCCB Pulse Check', bg: '#fff7ed', color: '#9a3412' }, title: 'Capture early impressions before dissatisfaction', detail: '3-question pulse survey: "What\u2019s exceeded expectations? What would make you visit more? Anything we can improve?" Responses route to GM dashboard.', timing: 'Day 90' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '8x run', result: '7 of 8 new members hit engagement thresholds by Day 90', impact: '$126K first-year dues secured' },
      { period: 'Q3 2025', runs: '6x run', result: '5 of 6 integrated successfully', impact: '$90K secured' },
    ],
    before: [
      { label: 'New members engaged by Day 90', value: '54%' },
      { label: 'Year-1 resignation rate', value: '22%' },
      { label: 'Avg social connections formed', value: '0.8' },
    ],
    after: [
      { label: 'New members engaged by Day 90', value: '88%' },
      { label: 'Year-1 resignation rate', value: '6%' },
      { label: 'Avg social connections formed', value: '3.4' },
    ],
  },
  {
    id: 'ghost-reactivation',
    triggeredCount: 6,
    name: 'Ghost Member Reactivation',
    category: 'Retention',
    categoryColor: '#6b7280',
    description: '24 members currently have zero activity across golf, dining, and events for 60+ days. They\u2019re paying dues but getting no value \u2014 the most likely next step is a resignation letter. Saving even 5 Ghost members protects ~$90K/yr.',
    triggeredFor: { name: 'David Kowalski', note: '72 days inactive \u2014 was a 2x/week golfer through September. No visits since Oct 3.' },
    monthlyImpact: '$7.5K',
    yearlyImpact: '$90K/yr',
    steps: [
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Warm, no-pressure check-in from the GM', detail: '"David, we\u2019ve missed you on the course. No agenda \u2014 just wanted to check in and see how things are going." Call notes logged to member profile.', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDF81 Surprise Gift', bg: '#d4edda', color: '#155724' }, title: 'Tangible reminder shipped to home', detail: 'Premium sleeve of Pro V1s + handwritten note mailed to David\u2019s home address. Cost: $18. ROI if he returns: $18K in annual dues.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Complimentary guest pass removes re-entry barrier', detail: '"Bring a friend this weekend \u2014 guest fees on us." Removes the awkwardness of coming back alone after a long absence.', timing: 'Day 7' },
      { badge: { text: '\uD83D\uDD04 Win-Back Sequence', bg: '#f8d7da', color: '#721c24' }, title: 'Escalate to full multi-touch campaign', detail: 'If no response after 14 days: 3-email sequence + text from membership director + offer to pause dues for 60 days rather than resign.', timing: 'Day 14' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '6x run', result: '4 of 6 ghost members reactivated', impact: '$72K dues protected' },
      { period: 'Q3 2025', runs: '3x run', result: '2 of 3 reactivated', impact: '$36K protected' },
    ],
    before: [
      { label: 'Ghost member reactivation rate', value: '12%' },
      { label: 'Avg days to first outreach', value: '90+' },
      { label: 'Ghost-to-resigned pipeline', value: '68%' },
    ],
    after: [
      { label: 'Ghost member reactivation rate', value: '67%' },
      { label: 'Avg days to first outreach', value: '3' },
      { label: 'Ghost-to-resigned pipeline', value: '19%' },
    ],
  },
  {
    id: 'declining-intervention',
    triggeredCount: 12,
    name: 'Declining Member Intervention',
    category: 'Retention',
    categoryColor: '#dc2626',
    description: '30 members trending down with $733K at risk. When a member\u2019s 90-day engagement drops below 30% of their personal baseline \u2014 rounds halved, dining flatlined \u2014 it\u2019s a quiet signal that something is wrong. This playbook catches the decline before the resignation.',
    triggeredFor: { name: 'Robert Ashford', note: 'Rounds dropped from 8/mo to 2/mo. Dining visits from 6 to 1. Health score: 28 (was 74).' },
    monthlyImpact: '$24K',
    yearlyImpact: '$290K/yr',
    steps: [
      { badge: { text: '\uD83D\uDCCB Quick Pulse', bg: '#fff7ed', color: '#9a3412' }, title: 'Surface hidden dissatisfaction early', detail: '2-question pulse: "How are we doing for you?" and "What would bring you in more?" Auto-sent when decline detected. Responses flagged to GM within 1 hour.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Personal outreach if survey reveals concerns', detail: 'If survey flags dissatisfaction, or no response in 5 days: GM calls directly. Briefed with member\u2019s engagement trajectory, tenure, and recent visit history.', timing: 'Day 3\u20135' },
      { badge: { text: '\uD83C\uDF82 Milestone Touch', bg: '#fce7f3', color: '#9d174d' }, title: 'Leverage upcoming birthday or anniversary', detail: 'If a milestone is within 30 days, use it as a warm re-engagement moment: personalized card + complimentary round or dinner.', timing: 'Opportunistic' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Fresh Experience', bg: '#d4edda', color: '#155724' }, title: 'Complimentary lesson or clinic to reignite interest', detail: 'Offer a free 30-min lesson with the head pro or invite to an upcoming clinic. Reintroduces the member to what they loved about the club.', timing: 'Day 7\u201310' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '12x run', result: '8 of 12 declining members stabilized', impact: '$144K dues protected' },
      { period: 'Q3 2025', runs: '9x run', result: '6 of 9 stabilized', impact: '$108K protected' },
    ],
    before: [
      { label: 'Declining members caught before resignation', value: '20%' },
      { label: 'Avg time to detect decline', value: '4\u20136 months' },
      { label: 'Intervention success rate', value: '31%' },
    ],
    after: [
      { label: 'Declining members caught before resignation', value: '78%' },
      { label: 'Avg time to detect decline', value: '< 2 weeks' },
      { label: 'Intervention success rate', value: '67%' },
    ],
  },
  {
    id: 'service-failure-rapid',
    triggeredCount: 5,
    name: 'Service Failure Rapid Response',
    category: 'Retention',
    categoryColor: '#b91c1c',
    description: 'A more aggressive, value-weighted version of the Service Save Protocol. When negative sentiment is detected for any member paying $12K+ in annual dues \u2014 survey below 3, front desk complaint, or negative post-visit feedback \u2014 the response window shrinks from hours to minutes.',
    triggeredFor: { name: 'Catherine Mercer', note: '$24K/yr dues, 14-year member. Rated post-dinner experience 2/5 \u2014 "waited 40 minutes for entrees, server never checked back."' },
    monthlyImpact: '$24K',
    yearlyImpact: '$288K/yr',
    steps: [
      { badge: { text: '\uD83D\uDEA8 Auto-Escalate', bg: '#f8d7da', color: '#721c24' }, title: 'Route to department head within 1 hour', detail: 'Catherine\u2019s 2/5 rating auto-escalated to F&B Director with full context: complaint text, member tenure, annual dues, last 5 dining visits, and lifetime spend.', timing: '< 1 hour' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'GM reaches out with full awareness', detail: 'GM calls within 4 hours: "Catherine, I saw your feedback about Thursday\u2019s dinner. That\u2019s not the experience you deserve after 14 years. I want to make it right."', timing: '< 4 hours' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Make-Good Dinner', bg: '#d4edda', color: '#155724' }, title: 'Complimentary dinner for 2 as accountability gesture', detail: 'Dinner for 2 comped at Catherine\u2019s preferred restaurant. GM personally checks in during the meal. Front desk briefed to greet by name on arrival.', timing: 'Day 1\u20133' },
      { badge: { text: '\u2705 Close the Loop', bg: '#dbeafe', color: '#1e40af' }, title: 'Follow-up confirmation 7 days later', detail: 'Automated follow-up: "Catherine, we wanted to confirm your recent experience met the standard you expect. Any remaining concerns?" Resolution logged to member profile.', timing: 'Day 7' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '5x run', result: '5 of 5 high-value members retained', impact: '$96K dues protected' },
      { period: 'Q3 2025', runs: '3x run', result: '3 of 3 retained', impact: '$62K protected' },
    ],
    before: [
      { label: 'Response time to high-value complaints', value: '24\u201348 hours' },
      { label: 'High-value member complaint resolution', value: '71%' },
      { label: 'Resignations after service failures', value: '2 this quarter' },
    ],
    after: [
      { label: 'Response time to high-value complaints', value: '< 1 hour' },
      { label: 'High-value member complaint resolution', value: '100%' },
      { label: 'Resignations after service failures', value: '0' },
    ],
  },
  {
    id: 'post-event',
    triggeredCount: 14,
    name: 'Post-Event Engagement Capture',
    category: 'Retention',
    categoryColor: '#8b5cf6',
    description: 'Members who attend a club event \u2014 tournament, wine dinner, holiday party \u2014 are at peak engagement. But if they don\u2019t return within 7 days, that momentum evaporates. This playbook converts event energy into sustained visits.',
    triggeredFor: { name: 'Mark & Lisa Chen', note: 'Attended Holiday Wine Dinner (Dec 14) \u2014 no visits in 8 days. Normally visit 2x/week.' },
    monthlyImpact: '$6K',
    yearlyImpact: '$72K/yr',
    steps: [
      { badge: { text: '\u26A0\uFE0F Feedback Check', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-check for negative event feedback', detail: 'If any negative feedback was flagged at the Holiday Wine Dinner, auto-escalate to event coordinator before outreach begins.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDD Thank You', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal thank-you referencing the event', detail: 'Handwritten-style note: "Mark & Lisa \u2014 so glad you joined the Wine Dinner. Chef Michael said you loved the Barolo pairing. Hope to see you again soon."', timing: 'Day 2' },
      { badge: { text: '\uD83E\uDD1D Introductions', bg: '#dbeafe', color: '#1e40af' }, title: 'Connect with members they met at the event', detail: 'Link Mark with 2 members from his dinner table who share golf interests. "You sat with Tom Richards \u2014 he plays Saturday mornings if you\u2019d like to join."', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve a slot for the coming weekend', detail: '"We held your usual Saturday 9:15am slot this weekend. Tap to confirm." Converts event enthusiasm into a concrete return visit.', timing: 'Day 4' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '14x run', result: '11 of 14 event attendees returned within 10 days', impact: '$38K in sustained engagement' },
      { period: 'Q3 2025', runs: '10x run', result: '7 of 10 returned', impact: '$24K sustained' },
    ],
    before: [
      { label: 'Post-event return rate (within 7 days)', value: '41%' },
      { label: 'Event-to-sustained engagement conversion', value: '22%' },
      { label: 'Follow-up after events', value: 'None' },
    ],
    after: [
      { label: 'Post-event return rate (within 7 days)', value: '79%' },
      { label: 'Event-to-sustained engagement conversion', value: '58%' },
      { label: 'Follow-up after events', value: 'Automated' },
    ],
  },
  {
    id: 'anniversary',
    triggeredCount: 4,
    name: 'Membership Anniversary Celebration',
    category: 'Retention',
    categoryColor: '#d97706',
    description: 'Membership milestones \u2014 1 year, 5 years, 10 years, 20 years \u2014 are the moments members reflect on whether the club is still worth it. A proactive, personalized celebration reinforces belonging and dramatically reduces resignation risk at renewal time.',
    triggeredFor: { name: 'William & Diane Harris', note: '10-year anniversary on March 28. 847 rounds played, $192K lifetime dues. Health score: 71 (watch list).' },
    monthlyImpact: '$3K',
    yearlyImpact: '$36K/yr',
    steps: [
      { badge: { text: '\uD83C\uDF89 GM Recognition', bg: '#fef3c7', color: '#92400e' }, title: 'Personalized card with member stats', detail: 'GM-signed card: "William & Diane \u2014 10 years and 847 rounds. Your favorite tee time: Saturday 7:45am. Most-ordered wine: the 2018 Caymus. Thank you for a decade."', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDF81 Milestone Gift', bg: '#d4edda', color: '#155724' }, title: 'Anniversary-appropriate gift', detail: 'Year 1: logoed merchandise. Year 5: engraved bag tag. Year 10: framed signature hole photo. Year 20: lifetime locker nameplate. William receives the framed photo.', timing: 'Anniversary day' },
      { badge: { text: '\uD83C\uDF7E VIP Dinner', bg: '#ede9fe', color: '#5b21b6' }, title: 'Exclusive event invitation', detail: 'Invitation to annual "Founders & Legends" dinner for 10+ year members. Reserved table, complimentary wine pairing, recognition from club president.', timing: 'Next event' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Complimentary Round', bg: '#dbeafe', color: '#1e40af' }, title: 'Prime tee time on anniversary week', detail: 'Complimentary prime slot Saturday morning of anniversary week. Bag tag placed on cart with "10 Years" ribbon. Starter congratulates by name.', timing: 'Anniversary week' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '11x run', result: '11 of 11 milestone members renewed', impact: '$198K in dues retained' },
      { period: 'Q3 2025', runs: '7x run', result: '7 of 7 renewed', impact: '$126K retained' },
    ],
    before: [
      { label: 'Resignation rate at renewal (milestone years)', value: '14%' },
      { label: 'Members who feel "recognized"', value: '38%' },
      { label: 'Anniversary acknowledgment', value: 'Generic email' },
    ],
    after: [
      { label: 'Resignation rate at renewal (milestone years)', value: '0%' },
      { label: 'Members who feel "recognized"', value: '94%' },
      { label: 'Anniversary acknowledgment', value: 'Multi-touch, personalized' },
    ],
  },

  // ── REVENUE ────────────────────────────────────
  {
    id: 'demand-surge',
    triggeredCount: 2,
    name: 'Demand Surge Playbook',
    category: 'Revenue',
    categoryColor: '#2563eb',
    description: 'When tee time demand spikes \u2014 holidays, tournaments, perfect weather weekends \u2014 clubs leave revenue on the table with static pricing. This playbook dynamically adjusts pricing tiers, sends targeted offers to low-frequency members, and optimizes slot allocation.',
    triggeredFor: { name: 'Memorial Day Weekend', note: 'Tee time demand 3.2x normal \u2014 dynamic pricing window' },
    monthlyImpact: '$12K',
    yearlyImpact: '$48K/yr',
    steps: [
      { badge: { text: '\uD83D\uDCC8 Demand Spike', bg: '#dbeafe', color: '#1e40af' }, title: 'Auto-detect booking surge pattern', detail: 'Booking velocity 3.2x baseline detected for May 24\u201326. Prime slots (7\u201310am) at 94% fill rate 5 days out.', timing: 'Day -5' },
      { badge: { text: '\uD83D\uDCB0 Price Adjust', bg: '#fef3c7', color: '#92400e' }, title: 'Activate tiered premium pricing', detail: 'Premium tier (+15%) activated for prime slots. Standard pricing maintained for off-peak. Guest fee premium (+$25) auto-applied.', timing: 'Day -3' },
      { badge: { text: '\uD83D\uDCE7 Targeted Offer', bg: '#d4edda', color: '#155724' }, title: 'Send offers to low-frequency members', detail: 'Push notification to 47 members who haven\u2019t played in 30+ days: "Perfect weather this weekend \u2014 we saved your favorite 8:30am slot."', timing: 'Day -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '6x run', result: '14% avg revenue lift per surge event', impact: '$72K incremental revenue' },
      { period: 'Q3 2025', runs: '4x run', result: '11% avg revenue lift', impact: '$44K incremental revenue' },
    ],
    before: [
      { label: 'Revenue capture during peak demand', value: '~78%' },
      { label: 'Low-frequency member re-engagement', value: '12%' },
      { label: 'Guest fee optimization', value: 'Static' },
    ],
    after: [
      { label: 'Revenue capture during peak demand', value: '94%' },
      { label: 'Low-frequency member re-engagement', value: '34%' },
      { label: 'Guest fee optimization', value: 'Dynamic' },
    ],
  },
  {
    id: 'snowbird-opener',
    triggeredCount: 0,
    name: 'Snowbird Season-Opener',
    category: 'Revenue',
    categoryColor: '#0891b2',
    description: '16 Snowbird members return seasonally, and every year the club misses the window to make their arrival feel curated. This playbook triggers 3 weeks before each Snowbird\u2019s historical arrival date and turns a seasonal return into a VIP homecoming.',
    triggeredFor: { name: 'George & Patricia Langford', note: 'Historically arrive Nov 1\u20137. Last year\u2019s first tee time: Nov 3 at 8:15am. $22K/yr dues.' },
    monthlyImpact: '$8K',
    yearlyImpact: '$96K/yr',
    steps: [
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve their preferred slot for arrival weekend', detail: 'George\u2019s favorite 8:15am Saturday slot held for Nov 2\u20133. Welcome-back message: "George, your tee time is waiting. Welcome home."', timing: 'Week -3' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Welcome Dinner', bg: '#fce7f3', color: '#9d174d' }, title: 'Snowbird welcome-back dinner invitation', detail: 'Invite George & Patricia to "Snowbird Welcome Dinner" with 8 other returning seasonal members. Reserved table, complimentary first round of drinks.', timing: 'Week -2' },
      { badge: { text: '\uD83D\uDCDD Concierge Note', bg: '#ede9fe', color: '#5b21b6' }, title: 'Club manager update on what\u2019s new', detail: 'Personal note from club manager: new chef, renovated patio, updated tee sheet system, and upcoming events for the season. Makes them feel in-the-loop from Day 1.', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDFC6 Tournament Access', bg: '#dbeafe', color: '#1e40af' }, title: 'Early access to first seasonal tournament', detail: 'VIP registration for the season-opening Member-Guest tournament. Priority pairing with a regular member to rebuild social connections.', timing: 'Arrival week' },
    ],
    trackRecord: [
      { period: 'Winter 2025', runs: '12x run', result: 'Snowbird first-week spend up 34%', impact: '$28K incremental F&B + golf' },
      { period: 'Winter 2024', runs: '8x run', result: 'First-week spend up 22%', impact: '$18K incremental' },
    ],
    before: [
      { label: 'Snowbird first-week engagement', value: '1.2 visits' },
      { label: 'Time to "feel connected" again', value: '3\u20134 weeks' },
      { label: 'Seasonal F&B spend (first month)', value: '$420/member' },
    ],
    after: [
      { label: 'Snowbird first-week engagement', value: '3.8 visits' },
      { label: 'Time to "feel connected" again', value: '< 1 week' },
      { label: 'Seasonal F&B spend (first month)', value: '$680/member' },
    ],
  },
  {
    id: 'event-amplifier',
    triggeredCount: 3,
    name: 'Social Butterfly Event Amplifier',
    category: 'Revenue',
    categoryColor: '#ec4899',
    description: 'Social Butterflies are your best organic marketers \u2014 44 members who thrive on events and bring energy (and guests) wherever they go. When event registration is below 60% capacity with 10+ days to go, this playbook turns them into your event-fill engine.',
    triggeredFor: { name: 'Spring Wine & Jazz Night', note: '38% filled with 12 days to go. 44 Social Butterfly members not yet registered.' },
    monthlyImpact: '$9K',
    yearlyImpact: '$108K/yr',
    steps: [
      { badge: { text: '\uD83C\uDF1F VIP Access', bg: '#fce7f3', color: '#9d174d' }, title: 'Exclusive angle for Social Butterflies', detail: '"We\u2019re holding a table for you and your group at Wine & Jazz Night. Preferred seating near the stage \u2014 reply to confirm your table of 6."', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDFAB Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Let them bring a non-member friend', detail: 'Each Social Butterfly gets 2 complimentary guest passes. Fills seats AND generates prospect leads \u2014 every guest is a potential new member.', timing: 'Day 2' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Dinner Bundle', bg: '#d4edda', color: '#155724' }, title: 'Pre-event dinner to increase F&B spend', detail: '"Join us for a 3-course dinner before Jazz Night \u2014 special menu by Chef Michael, wine pairings included." Adds $85/head in F&B revenue.', timing: 'Day 3' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '5x run', result: 'Avg event fill rate lifted from 54% to 89%', impact: '$45K in event + F&B revenue' },
      { period: 'Q3 2025', runs: '4x run', result: 'Avg fill rate 52% to 82%', impact: '$32K revenue' },
    ],
    before: [
      { label: 'Avg event fill rate', value: '54%' },
      { label: 'Guest prospects generated per event', value: '2' },
      { label: 'Pre-event F&B upsell', value: '$0' },
    ],
    after: [
      { label: 'Avg event fill rate', value: '89%' },
      { label: 'Guest prospects generated per event', value: '11' },
      { label: 'Pre-event F&B upsell', value: '$1,200' },
    ],
  },
  {
    id: 'weather-window',
    triggeredCount: 1,
    name: 'Weekend Warrior Weather Window',
    category: 'Revenue',
    categoryColor: '#f59e0b',
    description: '46 Weekend Warriors play almost exclusively on Saturdays and Sundays. When weather forecasts show a perfect weekend and prime morning slots are open, this playbook fills tee times, generates guest revenue, and drives pro shop spend.',
    triggeredFor: { name: 'This Saturday', note: 'Forecast: 72\u00B0F, sunny, 5mph winds. 8 prime morning slots (7\u201310am) open \u2014 normally 100% booked by Wednesday.' },
    monthlyImpact: '$5K',
    yearlyImpact: '$60K/yr',
    steps: [
      { badge: { text: '\u2600\uFE0F Tee Time Push', bg: '#fef3c7', color: '#92400e' }, title: 'Push notification with reserved slot', detail: '"Perfect weather Saturday \u2014 we saved your 8:30am slot. Tap to confirm." Sent to 46 Weekend Warriors who haven\u2019t booked yet.', timing: 'Wednesday PM' },
      { badge: { text: '\uD83C\uDFAB Guest Invite', bg: '#dbeafe', color: '#1e40af' }, title: 'Fill foursomes with prospective members', detail: '"Have a friend who\u2019s been wanting to try the course? Guest fees waived this Saturday." Each guest is a prospect lead logged to pipeline.', timing: 'Thursday AM' },
      { badge: { text: '\uD83D\uDED2 Pro Shop Credit', bg: '#d4edda', color: '#155724' }, title: '$25 credit to drive ancillary spend', detail: '$25 pro shop credit valid Saturday only. Drives $25\u2013$75 in incremental spend per member. Credit auto-expires Sunday midnight.', timing: 'Friday AM' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '7x run', result: '94% prime slot fill rate (vs 71% baseline)', impact: '$35K incremental revenue' },
      { period: 'Q3 2025', runs: '9x run', result: '91% fill rate', impact: '$41K incremental' },
    ],
    before: [
      { label: 'Perfect-weather weekend fill rate', value: '71%' },
      { label: 'Guest rounds on perfect weekends', value: '4 avg' },
      { label: 'Pro shop spend per round', value: '$12' },
    ],
    after: [
      { label: 'Perfect-weather weekend fill rate', value: '94%' },
      { label: 'Guest rounds on perfect weekends', value: '14 avg' },
      { label: 'Pro shop spend per round', value: '$38' },
    ],
  },
  {
    id: 'dining-dormancy',
    triggeredCount: 18,
    name: 'Dining Dormancy Recovery',
    category: 'Revenue',
    categoryColor: '#ea580c',
    description: '98 Die-Hard Golfers and Weekend Warriors play regularly but never eat at the club. They\u2019re physically on the property 4+ times a month and spending $0 in dining. This playbook cross-sells F&B to members who are already through the front door.',
    triggeredFor: { name: 'Tom Brennan', note: '6 rounds in the last 30 days, $0 in dining. Avg post-round time on property: 22 minutes. Leaving without eating.' },
    monthlyImpact: '$11K',
    yearlyImpact: '$132K/yr',
    steps: [
      { badge: { text: '\uD83C\uDF7D\uFE0F Chef\u2019s Table', bg: '#fff7ed', color: '#9a3412' }, title: 'Invitation to a curated dining experience', detail: '"Tom \u2014 you\u2019ve been on the course all month. Let us treat you to Thursday\u2019s Chef\u2019s Table: 4-course tasting menu, wine pairings. On the house."', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Family Night', bg: '#fce7f3', color: '#9d174d' }, title: 'Family dining invitation', detail: 'If Tom has a household: "Bring the family for Friday Family Night \u2014 kids eat free, live music on the patio." Brings the whole household into the club.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDF77 Locker Surprise', bg: '#d4edda', color: '#155724' }, title: 'Gift left in locker after next round', detail: 'Bottle of wine or dessert voucher placed in Tom\u2019s locker after his next round with a note: "Great round today. Enjoy this on us at dinner tonight."', timing: 'Next visit' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '18x run', result: '12 of 18 began dining within 2 weeks', impact: '$14K new monthly F&B revenue' },
      { period: 'Q3 2025', runs: '14x run', result: '9 of 14 converted', impact: '$11K new F&B revenue' },
    ],
    before: [
      { label: 'Golfers who also dine', value: '34%' },
      { label: 'Avg F&B spend per active golfer', value: '$28/mo' },
      { label: 'Post-round dining conversion', value: '11%' },
    ],
    after: [
      { label: 'Golfers who also dine', value: '62%' },
      { label: 'Avg F&B spend per active golfer', value: '$94/mo' },
      { label: 'Post-round dining conversion', value: '38%' },
    ],
  },

  // ── OPERATIONS ─────────────────────────────────
  {
    id: 'staffing-gap',
    triggeredCount: 2,
    name: 'Staffing Gap Protocol',
    category: 'Operations',
    categoryColor: '#7c3aed',
    description: 'When staffing drops below service thresholds \u2014 call-outs, seasonal transitions, event overlap \u2014 member experience degrades fast. This playbook auto-detects coverage gaps, triggers cross-training recalls, and adjusts service pacing to maintain quality.',
    triggeredFor: { name: 'Saturday Brunch Service', note: '2 servers called out \u2014 dining room at 85% capacity with 60% staffing' },
    monthlyImpact: '$8K',
    yearlyImpact: '$96K/yr',
    steps: [
      { badge: { text: '\u26A0\uFE0F Coverage Gap', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-detect staffing shortfall', detail: 'Saturday brunch: 2 of 5 servers unavailable. Current ratio 1:18 (threshold 1:12). F&B Director alerted with gap analysis.', timing: 'Hour -4' },
      { badge: { text: '\uD83D\uDCDE Recall Alert', bg: '#dbeafe', color: '#1e40af' }, title: 'Activate cross-trained staff', detail: '3 cross-trained staff contacted: 1 banquet server available, 1 host can cover tables. Updated floor plan sent to F&B Director.', timing: 'Hour -3' },
      { badge: { text: '\u23F1 Pace Adjust', bg: '#ede9fe', color: '#5b21b6' }, title: 'Adjust reservation pacing', detail: 'Brunch reservations re-paced: 15-min gaps between seatings (was 10-min). Walk-in wait estimate updated on member app.', timing: 'Hour -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '8x run', result: 'Zero service complaints during gaps', impact: '$8K complaint costs avoided' },
      { period: 'Q3 2025', runs: '5x run', result: '1 complaint (vs 5 avg before)', impact: '$6K saved' },
    ],
    before: [
      { label: 'Avg complaints per staffing gap', value: '3.2' },
      { label: 'Time to fill coverage gap', value: '90+ min' },
      { label: 'Member satisfaction during gaps', value: '3.1/5' },
    ],
    after: [
      { label: 'Avg complaints per staffing gap', value: '0.2' },
      { label: 'Time to fill coverage gap', value: '< 25 min' },
      { label: 'Member satisfaction during gaps', value: '4.4/5' },
    ],
  },
];

const CATEGORY_FILTERS = ['All', 'Retention', 'Revenue', 'Operations'];

// ────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────

function PlaybookCard({ playbook, onSelect, isSelected }) {
  const stepCount = playbook.steps.length;
  return (
    <div
      onClick={() => onSelect(playbook.id)}
      style={{
        background: '#fff',
        border: isSelected ? '2px solid #e8772e' : '1px solid #e5e5e5',
        borderRadius: 14,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 0 0 3px rgba(232,119,46,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: playbook.categoryColor,
          textTransform: 'uppercase', background: playbook.categoryColor + '12',
          padding: '3px 8px', borderRadius: 4,
        }}>
          {playbook.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {playbook.triggeredCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#e8772e',
              background: 'rgba(232,119,46,0.1)', padding: '2px 7px', borderRadius: 4,
            }}>{playbook.triggeredCount} triggered</span>
          )}
          <span style={{ fontSize: 11, color: '#999' }}>{stepCount} steps</span>
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f0f0f', lineHeight: 1.3 }}>{playbook.name}</div>
      <div style={{
        fontSize: 13, color: '#666', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {playbook.description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #f4f4f5' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#d9534f' }}>{playbook.monthlyImpact}<span style={{ fontSize: 11, fontWeight: 500, color: '#999' }}>/mo</span></span>
        <span style={{ fontSize: 11, color: '#888', background: '#f9f9f9', padding: '2px 8px', borderRadius: 4 }}>{playbook.trackRecord[0]?.runs} last quarter</span>
      </div>
    </div>
  );
}

function PlaybookDetail({ playbook }) {
  const { showToast } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#e8772e', textTransform: 'uppercase' }}>Playbook</span>
          <span style={{ background: '#e8772e', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>TRIGGERED</span>
          {playbook.triggeredCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#e8772e', background: 'rgba(232,119,46,0.08)', padding: '3px 10px', borderRadius: 6 }}>
              Currently triggered for {playbook.triggeredCount} members
            </span>
          )}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0f', margin: '0 0 8px 0', fontFamily: 'inherit' }}>{playbook.name}</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, maxWidth: 700, margin: 0 }}>{playbook.description}</p>
      </div>

      {/* Triggered For + Monthly Impact */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Triggered for:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ background: '#1a1a2e', color: 'white', padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>{playbook.triggeredFor.name}</span>
            <span style={{ color: '#888', fontSize: 13, fontStyle: 'italic' }}>{playbook.triggeredFor.note}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#999' }}>Monthly impact</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d9534f' }}>{playbook.monthlyImpact}</div>
          <div style={{ fontSize: 13, color: '#999' }}>{playbook.yearlyImpact}</div>
        </div>
      </div>

      {/* Steps Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>When you activate this playbook:</div>
      </div>

      {/* Steps */}
      {playbook.steps.map((step, idx) => (
        <div key={idx} style={{
          background: '#fafafa', border: '1px solid #eee', borderRadius: 12,
          padding: '20px 24px', marginBottom: 12,
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, background: '#4a90d9', color: 'white', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
            }}>{idx + 1}</div>
            <span style={{
              background: step.badge.bg, color: step.badge.color,
              padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{step.badge.text}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#0f0f0f', fontSize: 14, marginBottom: 4 }}>{step.title}</div>
            <div style={{ color: '#777', fontSize: 13, lineHeight: 1.5 }}>{step.detail}</div>
          </div>
          <div style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>{step.timing}</div>
        </div>
      ))}

      {/* Track Record */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24, marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ color: '#27ae60', fontWeight: 700 }}>{'\u2713'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#27ae60', textTransform: 'uppercase' }}>Track Record</span>
        </div>
        {playbook.trackRecord.map((tr, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            borderBottom: idx < playbook.trackRecord.length - 1 ? '1px solid #f0f0f0' : 'none',
            alignItems: 'center', flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{tr.period}</span>
              <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#666' }}>{tr.runs}</span>
              <span style={{ color: '#666', fontSize: 13 }}>{tr.result}</span>
            </div>
            <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 13 }}>{tr.impact}</span>
          </div>
        ))}
      </div>

      {/* Before / After */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 16 }}>{'\u25CF'} BEFORE</div>
          {playbook.before.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx < playbook.before.length - 1 ? 12 : 0, gap: 12 }}>
              <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f', whiteSpace: 'nowrap' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#27ae60', marginBottom: 16 }}>{'\u25CF'} AFTER</div>
          {playbook.after.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx < playbook.after.length - 1 ? 12 : 0, gap: 12 }}>
              <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f', whiteSpace: 'nowrap' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activate Button */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => {
            showToast(`${playbook.name} activated`, 'success');
            trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: playbook.name });
          }}
          style={{
            width: '100%', background: playbook.categoryColor || '#c0392b', color: 'white', border: 'none',
            padding: 16, borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Activate this playbook
        </button>
      </div>
    </div>
  );
}

export default function PlaybooksPage() {
  const [selectedId, setSelectedId] = useState(PLAYBOOKS[0].id);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const selected = PLAYBOOKS.find(p => p.id === selectedId);

  const filtered = useMemo(() => {
    if (categoryFilter === 'All') return PLAYBOOKS;
    return PLAYBOOKS.filter(p => p.category === categoryFilter);
  }, [categoryFilter]);

  // Auto-select first in filtered list if current selection is filtered out
  const effectiveSelected = filtered.find(p => p.id === selectedId) ? selected : filtered[0];

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#e8772e', textTransform: 'uppercase', marginBottom: 6 }}>
              Outreach Playbooks
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0f', margin: '0 0 6px', fontFamily: theme.fonts.serif }}>
              Automated Response Protocols
            </h1>
            <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>
              Step-by-step playbooks that activate automatically when patterns are detected. Each playbook coordinates staff alerts, member outreach, and follow-up actions.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f0f0f' }}>{PLAYBOOKS.length}</div>
              <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Playbooks</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#27ae60' }}>{PLAYBOOKS.filter(p => p.category === 'Retention').length}</div>
              <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retention</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{PLAYBOOKS.filter(p => p.category === 'Revenue').length}</div>
              <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 10 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{PLAYBOOKS.filter(p => p.category === 'Operations').length}</div>
              <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operations</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 6, background: '#f4f4f5', borderRadius: 10, padding: 3, alignSelf: 'flex-start' }}>
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: categoryFilter === cat ? '#fff' : 'transparent',
                color: categoryFilter === cat ? '#0f0f0f' : '#888',
                boxShadow: categoryFilter === cat ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Two-column layout: cards left, detail right */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left: Playbook Cards */}
          <div style={{
            flex: '0 0 380px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 12,
            paddingRight: 4,
          }}>
            {filtered.map(pb => (
              <PlaybookCard
                key={pb.id}
                playbook={pb}
                onSelect={(id) => setSelectedId(id)}
                isSelected={effectiveSelected?.id === pb.id}
              />
            ))}
          </div>

          {/* Right: Selected Playbook Detail */}
          {effectiveSelected && (
            <div style={{
              flex: 1, minWidth: 0,
              background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14,
              padding: '32px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
            }}>
              <PlaybookDetail playbook={effectiveSelected} />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
