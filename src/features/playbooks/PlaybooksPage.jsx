import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageTransition from '@/components/ui/PageTransition';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { useCurrentClub } from '@/hooks/useCurrentClub';
import { getDataMode } from '@/services/demoGate';

// ────────────────────────────────────────────────
// Playbook data
// ────────────────────────────────────────────────

const PLAYBOOKS = [
  // ── SERVICE RECOVERY ──────────────────────────────────
  {
    id: 'service-save',
    triggeredCount: 3,
    name: 'Service Save Protocol',
    category: 'Service Recovery',
    categoryColor: '#c0392b',
    description: 'An engaged member files a complaint that goes unresolved, leading to resignation within days. One saved resignation protects $18K\u2013$22K in dues plus $3K\u2013$5K in ancillary revenue.', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    triggeredFor: { name: 'James Whitfield', memberId: 'mbr_t01', note: '6-year member in good standing \u2014 complaint from this profile is a red flag' },
    monthlyImpact: '$18K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$216K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83D\uDCE2 Staff Alert', bg: '#fff3cd', color: '#856404' }, title: 'Auto-escalate high-sentiment complaints', detail: 'James Whitfield\u2019s complaint (slow service, felt ignored) \u2192 auto-routed to F&B Director. Alert includes complaint text, member profile, and last 3 visits.', timing: 'Hour 1\u20132' },
      { badge: { text: '\uD83D\uDEA9 Front Desk Flag', bg: '#f8d7da', color: '#721c24' }, title: 'GM personal alert with member profile', detail: 'GM alert: "James Whitfield \u2014 member since 2019, $18K/yr dues. Complaint about slow lunch on Jan 16 \u2014 unresolved 4 days. Recommend personal call today."', timing: 'Hour 2\u20134' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { badge: { text: '\uD83C\uDF81 Comp Offer', bg: '#d4edda', color: '#155724' }, title: 'Personal GM follow-up + comp offer', detail: 'Comp offer queued: complimentary dinner for 2. Front desk flagged: greet James by name on next visit.', timing: 'Day 1\u20132' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '4x run', result: '3 of 4 at-risk members retained', impact: '3 members retained' },
      { period: 'Q3 2025', runs: '2x run', result: '2 of 2 at-risk members retained', impact: '2 members retained' },
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
    category: 'New Member Success',
    categoryColor: '#0ea5e9',
    description: 'New members who don\u2019t build habits in the first 90 days are 4x more likely to resign by Year 2. This playbook triggers at Day 30, 60, and 90 when engagement thresholds aren\u2019t met \u2014 fewer than 3 rounds, zero dining visits, or zero events attended.',
    triggeredFor: { name: 'Rachel Simmons', memberId: 'mbr_309', note: 'Day 34 \u2014 1 round played, 0 dining, 0 events. Integration score: 18%' },
    monthlyImpact: '$22K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$264K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83E\uDD1D Member Match', bg: '#dbeafe', color: '#1e40af' }, title: 'Introduce to compatible members', detail: 'Rachel paired with 2 Balanced Active members who share her interest in weekend golf. Personal intro email from club manager with suggested tee time together.', timing: 'Day 30' },
      { badge: { text: '\uD83C\uDF89 Family Invite', bg: '#fce7f3', color: '#9d174d' }, title: 'Family & kids event invitation', detail: 'Rachel\u2019s household invited to upcoming Family BBQ & Pool Day. Includes spouse and 2 children \u2014 builds social ties beyond the member.', timing: 'Day 35' },
      { badge: { text: '\uD83D\uDCDE Concierge Touch', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal check-in from club manager', detail: 'Club manager calls Rachel: "How\u2019s your first month going? Any questions about tee time booking, dining reservations, or upcoming events?"', timing: 'Day 60' },
      { badge: { text: '\uD83D\uDCCB Pulse Check', bg: '#fff7ed', color: '#9a3412' }, title: 'Capture early impressions before dissatisfaction', detail: '3-question pulse survey: "What\u2019s exceeded expectations? What would make you visit more? Anything we can improve?" Responses route to GM dashboard.', timing: 'Day 90' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '8x run', result: '7 of 8 new members hit engagement thresholds by Day 90', impact: '$126K first-year dues secured' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '6x run', result: '5 of 6 integrated successfully', impact: '$90K secured' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 6,
    name: 'Ghost Member Reactivation',
    category: 'Member Engagement',
    categoryColor: '#6b7280',
    description: '24 members currently have zero activity across golf, dining, and events for 60+ days. They\u2019re paying dues but getting no value \u2014 the most likely next step is a resignation letter. Saving even 5 Ghost members protects ~$90K/yr.', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    triggeredFor: { name: 'David Kowalski', memberId: 'mbr_055', note: '72 days inactive \u2014 was a 2x/week golfer through September. No visits since Oct 3.' },
    monthlyImpact: '$7.5K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$90K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Warm, no-pressure check-in from the GM', detail: '"David, we\u2019ve missed you on the course. No agenda \u2014 just wanted to check in and see how things are going." Call notes logged to member profile.', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDF81 Surprise Gift', bg: '#d4edda', color: '#155724' }, title: 'Tangible reminder shipped to home', detail: 'Premium sleeve of Pro V1s + handwritten note mailed to David\u2019s home address. Cost: $18. ROI if he returns: $18K in annual dues.', timing: 'Day 3' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { badge: { text: '\uD83C\uDFCC\uFE0F Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Complimentary guest pass removes re-entry barrier', detail: '"Bring a friend this weekend \u2014 guest fees on us." Removes the awkwardness of coming back alone after a long absence.', timing: 'Day 7' },
      { badge: { text: '\uD83D\uDD04 Win-Back Sequence', bg: '#f8d7da', color: '#721c24' }, title: 'Escalate to full multi-touch campaign', detail: 'If no response after 14 days: 3-email sequence + text from membership director + offer to pause dues for 60 days rather than resign.', timing: 'Day 14' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '6x run', result: '4 of 6 ghost members reactivated', impact: '4 members reactivated' },
      { period: 'Q3 2025', runs: '3x run', result: '2 of 3 reactivated', impact: '$36K protected' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 12,
    name: 'Declining Member Intervention',
    category: 'Member Engagement',
    categoryColor: '#dc2626',
    description: '30 members trending down with $733K at risk. When a member\u2019s 90-day engagement drops below 30% of their personal baseline \u2014 rounds halved, dining flatlined \u2014 it\u2019s a quiet signal that something is wrong. This playbook catches the decline before the resignation.', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    triggeredFor: { name: 'Robert Ashford', memberId: 'mbr_t05', note: 'Rounds dropped from 8/mo to 2/mo. Dining visits from 6 to 1. Health score: 28 (was 74).' },
    monthlyImpact: '$24K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$290K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83D\uDCCB Quick Pulse', bg: '#fff7ed', color: '#9a3412' }, title: 'Surface hidden dissatisfaction early', detail: '2-question pulse: "How are we doing for you?" and "What would bring you in more?" Auto-sent when decline detected. Responses flagged to GM within 1 hour.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'Personal outreach if survey reveals concerns', detail: 'If survey flags dissatisfaction, or no response in 5 days: GM calls directly. Briefed with member\u2019s engagement trajectory, tenure, and recent visit history.', timing: 'Day 3\u20135' },
      { badge: { text: '\uD83C\uDF82 Milestone Touch', bg: '#fce7f3', color: '#9d174d' }, title: 'Leverage upcoming birthday or anniversary', detail: 'If a milestone is within 30 days, use it as a warm re-engagement moment: personalized card + complimentary round or dinner.', timing: 'Opportunistic' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Fresh Experience', bg: '#d4edda', color: '#155724' }, title: 'Complimentary lesson or clinic to reignite interest', detail: 'Offer a free 30-min lesson with the head pro or invite to an upcoming clinic. Reintroduces the member to what they loved about the club.', timing: 'Day 7\u201310' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '12x run', result: '8 of 12 declining members stabilized', impact: '8 members stabilized' },
      { period: 'Q3 2025', runs: '9x run', result: '6 of 9 stabilized', impact: '$108K protected' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 5,
    name: 'Service Failure Rapid Response',
    category: 'Service Recovery',
    categoryColor: '#b91c1c',
    description: 'A more aggressive, value-weighted version of the Service Save Protocol. When negative sentiment is detected for any member paying $12K+ in annual dues \u2014 survey below 3, front desk complaint, or negative post-visit feedback \u2014 the response window shrinks from hours to minutes.', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    triggeredFor: { name: 'Catherine Mercer', memberId: 'mbr_134', note: '$24K/yr dues, 14-year member. Rated post-dinner experience 2/5 \u2014 "waited 40 minutes for entrees, server never checked back."' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    monthlyImpact: '$24K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$288K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83D\uDEA8 Auto-Escalate', bg: '#f8d7da', color: '#721c24' }, title: 'Route to department head within 1 hour', detail: 'Catherine\u2019s 2/5 rating auto-escalated to F&B Director with full context: complaint text, member tenure, annual dues, last 5 dining visits, and lifetime spend.', timing: '< 1 hour' },
      { badge: { text: '\uD83D\uDCDE GM Call', bg: '#fef3c7', color: '#92400e' }, title: 'GM reaches out with full awareness', detail: 'GM calls within 4 hours: "Catherine, I saw your feedback about Thursday\u2019s dinner. That\u2019s not the experience you deserve after 14 years. I want to make it right."', timing: '< 4 hours' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Make-Good Dinner', bg: '#d4edda', color: '#155724' }, title: 'Complimentary dinner for 2 as accountability gesture', detail: 'Dinner for 2 comped at Catherine\u2019s preferred restaurant. GM personally checks in during the meal. Front desk briefed to greet by name on arrival.', timing: 'Day 1\u20133' },
      { badge: { text: '\u2705 Close the Loop', bg: '#dbeafe', color: '#1e40af' }, title: 'Follow-up confirmation 7 days later', detail: 'Automated follow-up: "Catherine, we wanted to confirm your recent experience met the standard you expect. Any remaining concerns?" Resolution logged to member profile.', timing: 'Day 7' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '5x run', result: '5 of 5 high-value members retained', impact: '5 members retained' },
      { period: 'Q3 2025', runs: '3x run', result: '3 of 3 retained', impact: '$62K protected' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 14,
    name: 'Post-Event Engagement Capture',
    category: 'Events & Programming',
    categoryColor: '#8b5cf6',
    description: 'Members who attend a club event \u2014 tournament, wine dinner, holiday party \u2014 are at peak engagement. But if they don\u2019t return within 7 days, that momentum evaporates. This playbook converts event energy into sustained visits.',
    triggeredFor: { name: 'Mark & Lisa Chen', note: 'Attended Holiday Wine Dinner (Dec 14) \u2014 no visits in 8 days. Normally visit 2x/week.' },
    monthlyImpact: '$6K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$72K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\u26A0\uFE0F Feedback Check', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-check for negative event feedback', detail: 'If any negative feedback was flagged at the Holiday Wine Dinner, auto-escalate to event coordinator before outreach begins.', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDCDD Thank You', bg: '#ede9fe', color: '#5b21b6' }, title: 'Personal thank-you referencing the event', detail: 'Handwritten-style note: "Mark & Lisa \u2014 so glad you joined the Wine Dinner. Chef Michael said you loved the Barolo pairing. Hope to see you again soon."', timing: 'Day 2' },
      { badge: { text: '\uD83E\uDD1D Introductions', bg: '#dbeafe', color: '#1e40af' }, title: 'Connect with members they met at the event', detail: 'Link Mark with 2 members from his dinner table who share golf interests. "You sat with Tom Richards \u2014 he plays Saturday mornings if you\u2019d like to join."', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve a slot for the coming weekend', detail: '"We held your usual Saturday 9:15am slot this weekend. Tap to confirm." Converts event enthusiasm into a concrete return visit.', timing: 'Day 4' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '14x run', result: '11 of 14 event attendees returned within 10 days', impact: '$38K in sustained engagement' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '10x run', result: '7 of 10 returned', impact: '$24K sustained' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 4,
    name: 'Membership Anniversary Celebration',
    category: 'Member Engagement',
    categoryColor: '#d97706',
    description: 'Membership milestones \u2014 1 year, 5 years, 10 years, 20 years \u2014 are the moments members reflect on whether the club is still worth it. A proactive, personalized celebration reinforces belonging and dramatically reduces resignation risk at renewal time.',
    triggeredFor: { name: 'William & Diane Harris', note: '10-year anniversary on March 28. 847 rounds played, $192K lifetime dues. Health score: 71 (watch list).' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    monthlyImpact: '$3K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$36K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83C\uDF89 GM Recognition', bg: '#fef3c7', color: '#92400e' }, title: 'Personalized card with member stats', detail: 'GM-signed card: "William & Diane \u2014 10 years and 847 rounds. Your favorite tee time: Saturday 7:45am. Most-ordered wine: the 2018 Caymus. Thank you for a decade."', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDF81 Milestone Gift', bg: '#d4edda', color: '#155724' }, title: 'Anniversary-appropriate gift', detail: 'Year 1: logoed merchandise. Year 5: engraved bag tag. Year 10: framed signature hole photo. Year 20: lifetime locker nameplate. William receives the framed photo.', timing: 'Anniversary day' },
      { badge: { text: '\uD83C\uDF7E VIP Dinner', bg: '#ede9fe', color: '#5b21b6' }, title: 'Exclusive event invitation', detail: 'Invitation to annual "Founders & Legends" dinner for 10+ year members. Reserved table, complimentary wine pairing, recognition from club president.', timing: 'Next event' },
      { badge: { text: '\uD83C\uDFCC\uFE0F Complimentary Round', bg: '#dbeafe', color: '#1e40af' }, title: 'Prime tee time on anniversary week', detail: 'Complimentary prime slot Saturday morning of anniversary week. Bag tag placed on cart with "10 Years" ribbon. Starter congratulates by name.', timing: 'Anniversary week' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '11x run', result: '11 of 11 milestone members renewed', impact: '$198K in dues retained' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '7x run', result: '7 of 7 renewed', impact: '$126K retained' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 2,
    name: 'Demand Surge Playbook',
    category: 'Revenue',
    categoryColor: '#2563eb',
    description: 'When tee time demand spikes \u2014 holidays, tournaments, perfect weather weekends \u2014 clubs leave revenue on the table with static pricing. This playbook dynamically adjusts pricing tiers, sends targeted offers to low-frequency members, and optimizes slot allocation.',
    triggeredFor: { name: 'Memorial Day Weekend', note: 'Tee time demand 3.2x normal \u2014 dynamic pricing window' },
    monthlyImpact: '$12K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$48K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83D\uDCC8 Demand Spike', bg: '#dbeafe', color: '#1e40af' }, title: 'Auto-detect booking surge pattern', detail: 'Booking velocity 3.2x baseline detected for May 24\u201326. Prime slots (7\u201310am) at 94% fill rate 5 days out.', timing: 'Day -5' },
      { badge: { text: '\uD83D\uDCB0 Price Adjust', bg: '#fef3c7', color: '#92400e' }, title: 'Activate tiered premium pricing', detail: 'Premium tier (+15%) activated for prime slots. Standard pricing maintained for off-peak. Guest fee premium (+$25) auto-applied.', timing: 'Day -3' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { badge: { text: '\uD83D\uDCE7 Targeted Offer', bg: '#d4edda', color: '#155724' }, title: 'Send offers to low-frequency members', detail: 'Push notification to 47 members who haven\u2019t played in 30+ days: "Perfect weather this weekend \u2014 we saved your favorite 8:30am slot."', timing: 'Day -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '6x run', result: '14% avg revenue lift per surge event', impact: '$72K incremental revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '4x run', result: '11% avg revenue lift', impact: '$44K incremental revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 0,
    name: 'Snowbird Season-Opener',
    category: 'Revenue',
    categoryColor: '#0891b2',
    description: '16 Snowbird members return seasonally, and every year the club misses the window to make their arrival feel curated. This playbook triggers 3 weeks before each Snowbird\u2019s historical arrival date and turns a seasonal return into a VIP homecoming.',
    triggeredFor: { name: 'George & Patricia Langford', memberId: 'mbr_311', note: 'Historically arrive Nov 1\u20137. Last year\u2019s first tee time: Nov 3 at 8:15am. $22K/yr dues.' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    monthlyImpact: '$8K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$96K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83C\uDFCC\uFE0F Tee Time Hold', bg: '#d4edda', color: '#155724' }, title: 'Reserve their preferred slot for arrival weekend', detail: 'George\u2019s favorite 8:15am Saturday slot held for Nov 2\u20133. Welcome-back message: "George, your tee time is waiting. Welcome home."', timing: 'Week -3' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Welcome Dinner', bg: '#fce7f3', color: '#9d174d' }, title: 'Snowbird welcome-back dinner invitation', detail: 'Invite George & Patricia to "Snowbird Welcome Dinner" with 8 other returning seasonal members. Reserved table, complimentary first round of drinks.', timing: 'Week -2' },
      { badge: { text: '\uD83D\uDCDD Concierge Note', bg: '#ede9fe', color: '#5b21b6' }, title: 'Club manager update on what\u2019s new', detail: 'Personal note from club manager: new chef, renovated patio, updated tee sheet system, and upcoming events for the season. Makes them feel in-the-loop from Day 1.', timing: 'Week -1' },
      { badge: { text: '\uD83C\uDFC6 Tournament Access', bg: '#dbeafe', color: '#1e40af' }, title: 'Early access to first seasonal tournament', detail: 'VIP registration for the season-opening Member-Guest tournament. Priority pairing with a regular member to rebuild social connections.', timing: 'Arrival week' },
    ],
    trackRecord: [
      { period: 'Winter 2025', runs: '12x run', result: 'Snowbird first-week spend up 34%', impact: '$28K incremental F&B + golf' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Winter 2024', runs: '8x run', result: 'First-week spend up 22%', impact: '$18K incremental' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    before: [
      { label: 'Snowbird first-week engagement', value: '1.2 visits' },
      { label: 'Time to "feel connected" again', value: '3\u20134 weeks' },
      { label: 'Seasonal F&B spend (first month)', value: '$420/member' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    after: [
      { label: 'Snowbird first-week engagement', value: '3.8 visits' },
      { label: 'Time to "feel connected" again', value: '< 1 week' },
      { label: 'Seasonal F&B spend (first month)', value: '$680/member' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
  },
  {
    id: 'event-amplifier',
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 3,
    name: 'Social Butterfly Event Amplifier',
    category: 'Revenue',
    categoryColor: '#ec4899',
    description: 'Social Butterflies are your best organic marketers \u2014 44 members who thrive on events and bring energy (and guests) wherever they go. When event registration is below 60% capacity with 10+ days to go, this playbook turns them into your event-fill engine.',
    triggeredFor: { name: 'Spring Wine & Jazz Night', note: '38% filled with 12 days to go. 44 Social Butterfly members not yet registered.' },
    monthlyImpact: '$9K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$108K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83C\uDF1F VIP Access', bg: '#fce7f3', color: '#9d174d' }, title: 'Exclusive angle for Social Butterflies', detail: '"We\u2019re holding a table for you and your group at Wine & Jazz Night. Preferred seating near the stage \u2014 reply to confirm your table of 6."', timing: 'Day 1' },
      { badge: { text: '\uD83C\uDFAB Guest Pass', bg: '#dbeafe', color: '#1e40af' }, title: 'Let them bring a non-member friend', detail: 'Each Social Butterfly gets 2 complimentary guest passes. Fills seats AND generates prospect leads \u2014 every guest is a potential new member.', timing: 'Day 2' },
      { badge: { text: '\uD83C\uDF7D\uFE0F Dinner Bundle', bg: '#d4edda', color: '#155724' }, title: 'Pre-event dinner to increase F&B spend', detail: '"Join us for a 3-course dinner before Jazz Night \u2014 special menu by Chef Michael, wine pairings included." Adds $85/head in F&B revenue.', timing: 'Day 3' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '5x run', result: 'Avg event fill rate lifted from 54% to 89%', impact: '$45K in event + F&B revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '4x run', result: 'Avg fill rate 52% to 82%', impact: '$32K revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    before: [
      { label: 'Avg event fill rate', value: '54%' },
      { label: 'Guest prospects generated per event', value: '2' },
      { label: 'Pre-event F&B upsell', value: '$0' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    after: [
      { label: 'Avg event fill rate', value: '89%' },
      { label: 'Guest prospects generated per event', value: '11' },
      { label: 'Pre-event F&B upsell', value: '$1,200' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
  },
  {
    id: 'weather-window',
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 1,
    name: 'Weekend Warrior Weather Window',
    category: 'Revenue',
    categoryColor: '#f59e0b',
    description: '46 Weekend Warriors play almost exclusively on Saturdays and Sundays. When weather forecasts show a perfect weekend and prime morning slots are open, this playbook fills tee times, generates guest revenue, and drives pro shop spend.',
    triggeredFor: { name: 'This Saturday', note: 'Forecast: 72\u00B0F, sunny, 5mph winds. 8 prime morning slots (7\u201310am) open \u2014 normally 100% booked by Wednesday.' },
    monthlyImpact: '$5K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$60K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\u2600\uFE0F Tee Time Push', bg: '#fef3c7', color: '#92400e' }, title: 'Push notification with reserved slot', detail: '"Perfect weather Saturday \u2014 we saved your 8:30am slot. Tap to confirm." Sent to 46 Weekend Warriors who haven\u2019t booked yet.', timing: 'Wednesday PM' },
      { badge: { text: '\uD83C\uDFAB Guest Invite', bg: '#dbeafe', color: '#1e40af' }, title: 'Fill foursomes with prospective members', detail: '"Have a friend who\u2019s been wanting to try the course? Guest fees waived this Saturday." Each guest is a prospect lead logged to pipeline.', timing: 'Thursday AM' },
      { badge: { text: '\uD83D\uDED2 Pro Shop Credit', bg: '#d4edda', color: '#155724' }, title: '$25 credit to drive ancillary spend', detail: '$25 pro shop credit valid Saturday only. Drives $25\u2013$75 in incremental spend per member. Credit auto-expires Sunday midnight.', timing: 'Friday AM' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '7x run', result: '94% prime slot fill rate (vs 71% baseline)', impact: '$35K incremental revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '9x run', result: '91% fill rate', impact: '$41K incremental' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    before: [
      { label: 'Perfect-weather weekend fill rate', value: '71%' },
      { label: 'Guest rounds on perfect weekends', value: '4 avg' },
      { label: 'Pro shop spend per round', value: '$12' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    after: [
      { label: 'Perfect-weather weekend fill rate', value: '94%' },
      { label: 'Guest rounds on perfect weekends', value: '14 avg' },
      { label: 'Pro shop spend per round', value: '$38' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
  },
  {
    id: 'dining-dormancy',
    hidden: true, // V3: Phase 2 — deferred
    triggeredCount: 18,
    name: 'Dining Dormancy Recovery',
    category: 'Revenue',
    categoryColor: '#ea580c',
    description: '98 Die-Hard Golfers and Weekend Warriors play regularly but never eat at the club. They\u2019re physically on the property 4+ times a month and spending $0 in dining. This playbook cross-sells F&B to members who are already through the front door.', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    triggeredFor: { name: 'Tom Brennan', memberId: 'mbr_304', note: '6 rounds in the last 30 days, $0 in dining. Avg post-round time on property: 22 minutes. Leaving without eating.' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    monthlyImpact: '$11K', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    yearlyImpact: '$132K/yr', // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    steps: [
      { badge: { text: '\uD83C\uDF7D\uFE0F Chef\u2019s Table', bg: '#fff7ed', color: '#9a3412' }, title: 'Invitation to a curated dining experience', detail: '"Tom \u2014 you\u2019ve been on the course all month. Let us treat you to Thursday\u2019s Chef\u2019s Table: 4-course tasting menu, wine pairings. On the house."', timing: 'Day 1' },
      { badge: { text: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Family Night', bg: '#fce7f3', color: '#9d174d' }, title: 'Family dining invitation', detail: 'If Tom has a household: "Bring the family for Friday Family Night \u2014 kids eat free, live music on the patio." Brings the whole household into the club.', timing: 'Day 3' },
      { badge: { text: '\uD83C\uDF77 Locker Surprise', bg: '#d4edda', color: '#155724' }, title: 'Gift left in locker after next round', detail: 'Bottle of wine or dessert voucher placed in Tom\u2019s locker after his next round with a note: "Great round today. Enjoy this on us at dinner tonight."', timing: 'Next visit' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '18x run', result: '12 of 18 began dining within 2 weeks', impact: '$14K new monthly F&B revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '14x run', result: '9 of 14 converted', impact: '$11K new F&B revenue' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
    ],
    before: [
      { label: 'Golfers who also dine', value: '34%' },
      { label: 'Avg F&B spend per active golfer', value: '$28/mo' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { label: 'Post-round dining conversion', value: '11%' },
    ],
    after: [
      { label: 'Golfers who also dine', value: '62%' },
      { label: 'Avg F&B spend per active golfer', value: '$94/mo' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { label: 'Post-round dining conversion', value: '38%' },
    ],
  },

  // ── OPERATIONS ─────────────────────────────────
  {
    id: 'staffing-gap',
    triggeredCount: 2,
    name: 'Staffing Adjustment',
    category: 'Operations',
    categoryColor: '#7c3aed',
    description: 'When staffing doesn\u2019t match demand \u2014 call-outs, weather shifts, event overlap, or seasonal spikes \u2014 service quality drops. This playbook connects tee sheet bookings, event calendars, and weather forecasts to staffing schedules, then detects gaps before they become member complaints.',
    triggeredFor: { name: 'Saturday Brunch Service', note: '2 servers called out \u2014 dining room at 85% capacity with 60% staffing' },
    steps: [
      { badge: { text: '\u26A0\uFE0F Coverage Gap', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-detect staffing shortfall', detail: 'Saturday brunch: 2 of 5 servers unavailable. Current ratio 1:18 (threshold 1:12). F&B Director alerted with gap analysis.', timing: 'Hour -4' },
      { badge: { text: '\uD83D\uDCDE Recall Alert', bg: '#dbeafe', color: '#1e40af' }, title: 'Activate cross-trained staff', detail: '3 cross-trained staff contacted: 1 banquet server available, 1 host can cover tables. Updated floor plan sent to F&B Director.', timing: 'Hour -3' },
      { badge: { text: '\u23F1 Pace Adjust', bg: '#ede9fe', color: '#5b21b6' }, title: 'Adjust reservation pacing', detail: 'Brunch reservations re-paced: 15-min gaps between seatings (was 10-min). Walk-in wait estimate updated on member app.', timing: 'Hour -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '8x run', result: 'Zero service complaints during gaps', impact: '$8K complaint costs avoided' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
      { period: 'Q3 2025', runs: '5x run', result: '1 complaint (vs 5 avg before)', impact: '$6K saved' }, // lint-no-hardcoded-dollars: allow — playbook catalog teaser
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

const CATEGORY_FILTERS = ['All', 'Service Recovery', 'New Member Success', 'Member Engagement', 'Events & Programming', 'Revenue', 'Operations'];

const CATEGORY_META = {
  'Service Recovery':      { icon: '\uD83D\uDEE1\uFE0F', color: '#DC2626', dotColor: '#EF4444', bg: '#FEF2F2' },
  'New Member Success':    { icon: '\uD83C\uDFAF', color: '#EA580C', dotColor: '#F97316', bg: '#FFF7ED' },
  'Member Engagement':     { icon: '\uD83D\uDCAC', color: '#2563EB', dotColor: '#3B82F6', bg: '#EFF6FF' },
  'Events & Programming':  { icon: '\uD83D\uDCC5', color: '#039855', dotColor: '#12b76a', bg: '#F0FDF4' },
  'Revenue':               { icon: '\uD83D\uDCB0', color: '#9333EA', dotColor: '#A855F7', bg: '#FDF4FF' },
  'Operations':            { icon: '\u2699\uFE0F',  color: '#0284C7', dotColor: '#0EA5E9', bg: '#F0F9FF' },
};

// ────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────

function PlaybookDetail({ playbook, onClose }) {
  const { showToast, addAction, dispatch } = useApp();
  const [editingSteps, setEditingSteps] = useState(false);
  const clubId = useCurrentClub();

  const customSteps = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('swoop_playbook_customizations') || '{}');
      return all[playbook.id] || null;
    } catch { return null; }
  })();
  const displaySteps = customSteps || playbook.steps;

  if (editingSteps) {
    const PlaybookEditor = React.lazy(() => import('@/features/automations/PlaybookEditor'));
    return (
      <React.Suspense fallback={<div className="p-4 text-gray-400">Loading editor...</div>}>
        <PlaybookEditor playbook={{ ...playbook, steps: displaySteps }} onClose={() => setEditingSteps(false)} />
      </React.Suspense>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <span className="text-[11px] font-bold tracking-wider text-brand-500 uppercase">Playbook</span>
          {playbook.triggeredCount > 0 && (
            <>
              <span className="bg-brand-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">TRIGGERED</span>
              <span className="text-[11px] font-semibold text-brand-500 bg-brand-500/10 px-2.5 py-0.5 rounded-md">
                Triggered for {playbook.triggeredCount} members
              </span>
            </>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white/90 m-0 mb-2">{playbook.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed m-0">{playbook.description}</p>
      </div>

      {/* Triggered For + Track Record */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <div className="text-xs text-gray-400 mb-1.5">Triggered for:</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-800 text-white px-3 py-1 rounded-md text-xs font-medium dark:bg-gray-200 dark:text-gray-900">{playbook.triggeredFor.name}</span>
            <span className="text-xs text-gray-400 italic">{playbook.triggeredFor.note}</span>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs text-gray-400">Track record</div>
          <div className="text-base font-bold text-success-600">{playbook.trackRecord[0]?.result}</div>
          <div className="text-xs text-gray-400">{playbook.trackRecord[0]?.period}</div>
        </div>
      </div>

      {/* Steps Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div className="text-xs sm:text-[13px] text-gray-400 font-medium">When you activate this playbook:</div>
        <button
          onClick={() => setEditingSteps(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-transparent text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 transition dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Customize Steps
          {customSteps && <span className="text-[9px] bg-brand-500 text-white px-1.5 py-px rounded-full ml-1">Customized</span>}
        </button>
      </div>

      {/* Steps */}
      {displaySteps.map((step, idx) => (
        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 lg:px-6 mb-3 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
            <span style={{ background: step.badge.bg, color: step.badge.color }} className="text-[11px] font-semibold px-2.5 py-0.5 rounded">{step.badge.text}</span>
            <span className="text-[11px] text-gray-400 ml-auto">{step.timing}</span>
          </div>
          <div className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-1">{step.title}</div>
          <div className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{step.detail}</div>
        </div>
      ))}

      {/* Track Record */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="text-success-600 font-bold">{'\u2713'}</span>
          <span className="text-xs font-bold tracking-wider text-success-600 uppercase">Track Record</span>
        </div>
        {playbook.trackRecord.map((tr, idx) => (
          <div key={idx} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2 ${
            idx < playbook.trackRecord.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-[13px] font-semibold text-gray-800 dark:text-white/90">{tr.period}</span>
              <span className="text-[10px] sm:text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded">{tr.runs}</span>
              <span className="text-xs sm:text-[13px] text-gray-500">{tr.result}</span>
            </div>
            <span className="text-xs sm:text-[13px] font-semibold text-success-600">{tr.impact}</span>
          </div>
        ))}
      </div>

      {/* Before / After */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-400 mb-3">{'\u25CF'} BEFORE</div>
          {playbook.before.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-2 mb-2 last:mb-0">
              <span className="text-xs sm:text-[13px] text-gray-500">{item.label}</span>
              <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90 whitespace-nowrap">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-xs font-semibold text-success-500 mb-3">{'\u25CF'} AFTER</div>
          {playbook.after.map((item, idx) => (
            <div key={idx} className="flex justify-between gap-2 mb-2 last:mb-0">
              <span className="text-xs sm:text-[13px] text-gray-500">{item.label}</span>
              <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white/90 whitespace-nowrap">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activate Button */}
      <div className="mt-6 sm:mt-8">
        <button
          onClick={() => {
            showToast(`${playbook.name} activated`, 'success');
            trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: playbook.name });
            addAction({ description: `${playbook.name} activated \u2014 ${playbook.triggeredCount || 0} members triggered`, actionType: 'RETENTION_OUTREACH', source: 'Playbook Engine', priority: 'high', impactMetric: playbook.impact || '' });
            dispatch({ type: 'ACTIVATE_PLAYBOOK', id: playbook.id });

            if (clubId && playbook.triggeredFor?.memberId) {
              fetch('/api/execute-playbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clubId,
                  playbookId: playbook.id,
                  playbookName: playbook.name,
                  memberId: playbook.triggeredFor.memberId,
                  triggeredBy: 'GM',
                  triggerReason: playbook.description,
                  steps: (playbook.steps || []).map((s, i) => ({
                    title: s.title,
                    description: s.detail,
                    assignedTo: s.owner || null,
                    dueDays: i * 3 + 1,
                  })),
                }),
              }).catch((err) => { console.error('Playbook execution API error:', err); });
            }
            if (onClose) onClose();
          }}
          className="w-full text-white border-none py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold cursor-pointer transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500"
          style={{ background: playbook.categoryColor || '#c0392b' }}
        >
          Activate this playbook
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Slide-over detail panel
// ────────────────────────────────────────────────

function DetailSlideOver({ playbook, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: visible ? 'blur(4px)' : 'none', opacity: visible ? 1 : 0 }}
      />
      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto transition-transform duration-250 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Close bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <span className="text-[13px] font-semibold text-gray-700 dark:text-white/80">Playbook Details</span>
          <button
            onClick={handleClose}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white cursor-pointer bg-transparent border-none px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {'\u2715'} Close
          </button>
        </div>
        <div className="p-5 sm:p-6 lg:p-8">
          <PlaybookDetail playbook={playbook} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────

export default function PlaybooksPage({ embedded = false }) {
  // In guided mode, only show playbooks when real agent data has been loaded (not static seed)
  const visiblePlaybooks = useMemo(() => getDataMode() === 'guided' ? [] : PLAYBOOKS, []);
  const [selectedId, setSelectedId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = useMemo(() => {
    if (categoryFilter === 'All') return visiblePlaybooks;
    return visiblePlaybooks.filter(p => p.category === categoryFilter);
  }, [categoryFilter, visiblePlaybooks]);

  const selectedPlaybook = selectedId ? visiblePlaybooks.find(p => p.id === selectedId) : null;

  // Build category summaries
  const categorySummaries = useMemo(() => {
    const cats = {};
    for (const pb of visiblePlaybooks) {
      if (!cats[pb.category]) cats[pb.category] = { count: 0, triggered: 0 };
      cats[pb.category].count++;
      cats[pb.category].triggered += pb.triggeredCount || 0;
    }
    return CATEGORY_FILTERS.slice(1).map(cat => ({
      name: cat,
      ...CATEGORY_META[cat],
      count: cats[cat]?.count || 0,
      triggered: cats[cat]?.triggered || 0,
    }));
  }, [visiblePlaybooks]);

  const totalTriggers = useMemo(() => visiblePlaybooks.reduce((s, p) => s + (p.triggeredCount || 0), 0), [visiblePlaybooks]);

  // Group filtered playbooks by category (preserving category order)
  const groupedPlaybooks = useMemo(() => {
    const groups = [];
    const catOrder = CATEGORY_FILTERS.slice(1);
    for (const cat of catOrder) {
      const items = filtered.filter(p => p.category === cat);
      if (items.length > 0) groups.push({ category: cat, items, meta: CATEGORY_META[cat] });
    }
    return groups;
  }, [filtered]);

  // Total runs for a playbook (sum of trackRecord runs)
  const getRuns = (pb) => {
    const first = pb.trackRecord[0];
    if (!first) return '0x run';
    const total = pb.trackRecord.reduce((s, tr) => {
      const m = tr.runs.match(/(\d+)/);
      return s + (m ? parseInt(m[1], 10) : 0);
    }, 0);
    return `${total}x run`;
  };

  const Wrapper = embedded ? ({ children }) => <>{children}</> : PageTransition;

  return (
    <Wrapper>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Category Filter Pills */}
        <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="inline-flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  categoryFilter === cat
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* ── Category Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {categorySummaries.map(cat => (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(prev => prev === cat.name ? 'All' : cat.name)}
              className={`flex flex-col items-start gap-1.5 p-3 sm:p-4 rounded-xl border-none cursor-pointer text-left transition-all focus-visible:ring-2 focus-visible:ring-brand-500 ${
                categoryFilter === cat.name ? 'ring-2 ring-offset-1 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{
                background: cat.bg,
                ...(categoryFilter === cat.name ? { ringColor: cat.color } : {}),
              }}
            >
              <div className="text-lg sm:text-xl">{cat.icon}</div>
              <div className="text-[11px] sm:text-xs font-bold leading-tight" style={{ color: cat.color }}>{cat.name}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: cat.color }}>{cat.triggered}</span>
                <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: cat.color }}>triggered</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium" style={{ color: cat.color }}>
                {cat.count} playbook{cat.count !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>

        {/* ── Total Bar ── */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400">
          <span>Showing <strong className="text-gray-700 dark:text-white/80">{filtered.length} playbooks</strong> across {groupedPlaybooks.length} categories</span>
          <span><span className="font-bold text-gray-700 dark:text-white/80 tabular-nums">{totalTriggers}</span> total triggers</span>
        </div>

        {/* ── Grouped Table ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_80px_1fr_70px] gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <div>Playbook</div>
            <div>Triggered</div>
            <div>Steps</div>
            <div>Track Record</div>
            <div className="text-right">Runs</div>
          </div>

          {/* Category Groups */}
          {groupedPlaybooks.map(group => (
            <div key={group.category}>
              {/* Category Label */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: group.meta.dotColor }} />
                <span className="text-xs font-bold" style={{ color: group.meta.color }}>{group.category}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: group.meta.bg, color: group.meta.color }}>{group.items.length}</span>
              </div>

              {/* Rows */}
              {group.items.map(pb => (
                <div
                  key={pb.id}
                  onClick={() => setSelectedId(pb.id)}
                  className={`group grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_1fr_70px] gap-1 sm:gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                    selectedId === pb.id
                      ? 'bg-brand-50 dark:bg-brand-500/5'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {/* Playbook Name */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold transition-colors ${
                      selectedId === pb.id ? 'text-brand-500' : 'text-gray-800 dark:text-white/90 group-hover:text-brand-500'
                    }`}>{pb.name}</span>
                    <svg className="w-3.5 h-3.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Triggered */}
                  <div className="flex items-center">
                    {pb.triggeredCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                        {pb.triggeredCount} triggered
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0 triggered</span>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">{pb.steps.length} steps</div>

                  {/* Track Record */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center leading-snug">{pb.trackRecord[0]?.result}</div>

                  {/* Runs */}
                  <div className="text-xs text-gray-400 text-right flex items-center justify-end sm:justify-end">{getRuns(pb)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Slide-Over Detail Panel ── */}
        {selectedPlaybook && (
          <DetailSlideOver
            key={selectedPlaybook.id}
            playbook={selectedPlaybook}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </Wrapper>
  );
}
