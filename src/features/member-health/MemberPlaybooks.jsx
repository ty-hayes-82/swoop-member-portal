import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const SERVICE_SAVE_STEPS = [
  {
    title: 'Auto-escalate high-sentiment complaints',
    description: 'Any feedback with sentiment < −0.5 from an engaged member (health score > 60) auto-routes to the department head within 2 hours.',
    preview: "James Whitfield's complaint (slow service, felt ignored) → auto-routed to F&B Director. Alert includes complaint text, member profile, and last 3 visits.",
    timeline: 'Hour 1–2',
    actionType: 'staff-alert',
  },
  {
    title: 'GM personal alert with member profile',
    description: 'GM receives a push alert with member profile, complaint text, lifetime value, and suggested response script.',
    preview: 'GM alert: "James Whitfield — member since 2019, $18K/yr dues. Complaint about slow lunch on Jan 16 — unresolved 4 days. Recommend personal call today."',
    timeline: 'Hour 2–4',
    actionType: 'front-desk-flag',
  },
  {
    title: 'Personal GM follow-up + comp offer',
    description: 'GM calls or visits the member directly. Comped experience offered if appropriate. Resolution confirmed in system.',
    preview: 'Comp offer queued: complimentary dinner for 2. Front desk flagged: greet James by name on next visit.',
    timeline: 'Day 1–2',
    actionType: 'comp-offer',
  },
];

const SERVICE_SAVE_BEFORE = [
  { label: 'Avg response to negative feedback', value: '48+ hours' },
  { label: 'Complaint resolution rate',          value: '62%' },
  { label: 'Resignations from complaints',       value: '1 this month' },
];

const SERVICE_SAVE_AFTER = [
  { label: 'Response to high-sentiment feedback', value: '< 2 hours' },
  { label: 'Complaint resolution rate',           value: '94%' },
  { label: 'Preventable resignations',            value: '0' },
];

const DECAY_STEPS = [
  {
    title: 'Detect — weekly health scan',
    description: 'Automated weekly scan flags members whose score drops below 50 or declines by 15+ points in 4 weeks.',
    preview: 'Weekly scan scheduled every Monday. Currently flagging 30 Declining members. 4 approaching F&B minimum threshold.',
    timeline: 'Every Monday',
    actionType: 'report',
  },
  {
    title: 'Re-engage — personalized email + events',
    description: 'Personalized event invitations based on archetype. Members attending 2+ events/month have 60% lower churn probability.',
    preview: '30 personalized emails queued. Die-Hard Golfers: pace clinic invite. Social Butterflies: wine dinner. Weekend Warriors: couples golf.',
    timeline: 'Week 1–2',
    actionType: 'email',
  },
  {
    title: 'Personal outreach — non-responders',
    description: 'Non-responders after 2 weeks get a personal call. Script: acknowledge reduced activity, ask open questions, offer specific value.',
    preview: 'Front desk flagged: 30 members for GM or membership director personal outreach. Call script generated per archetype.',
    timeline: 'Week 3',
    actionType: 'front-desk-flag',
  },
];

const DECAY_BEFORE = [
  { label: 'Declining members (current)', value: '30 members' },
  { label: 'At-risk dues',                value: '$540K/yr' },
  { label: 'Projected conversions back',  value: '0%' },
];

const DECAY_AFTER = [
  { label: 'Declining members (targeted)', value: '30 members' },
  { label: 'Expected recovery rate',       value: '17% (5 members)' },
  { label: 'Protected annual dues',        value: '$90–110K' },
];

// memberContext passed to Service Save to show archetype of triggered member
const MBR_203_CONTEXT = {
  name: 'James Whitfield',
  archetype: 'Balanced Active',
  color: theme.colors.briefing,
  profile: 'Normally engaged across all domains — complaint from this archetype is a red flag',
};

export default function MemberPlaybooks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      <PlaybookPanel
        id="service-save"
        title="Service Save Protocol"
        scenario="The pattern we see with members like James Whitfield: an engaged member — in James's case, a 6-year member in good standing — files a complaint that goes unresolved, leading to resignation within days. One saved resignation protects $18K–$22K in dues plus $3K–$5K in ancillary revenue."
        steps={SERVICE_SAVE_STEPS}
        beforeMetrics={SERVICE_SAVE_BEFORE}
        afterMetrics={SERVICE_SAVE_AFTER}
        accentColor={theme.colors.urgent}
        memberContext={MBR_203_CONTEXT}
      />
      <PlaybookPanel
        id="engagement-decay"
        title="Engagement Decay Intervention"
        scenario="30 Declining members are in progressive multi-domain disengagement. Email decay precedes reduced golf and dining by 4–6 weeks — this is the window to act."
        steps={DECAY_STEPS}
        beforeMetrics={DECAY_BEFORE}
        afterMetrics={DECAY_AFTER}
        accentColor={theme.colors.members}
      />
    </div>
  );
}
