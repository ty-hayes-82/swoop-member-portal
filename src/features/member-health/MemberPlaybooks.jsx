import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const SERVICE_SAVE_STEPS = [
  { title: 'Auto-escalate high-sentiment complaints', description: 'Any feedback with sentiment < −0.5 from an engaged member (health score > 60) auto-routes to the department head within 2 hours.', timeline: 'Hour 1–2' },
  { title: 'GM personal alert', description: 'GM receives a push alert with member profile, complaint text, lifetime value, and suggested response script.', timeline: 'Hour 2–4' },
  { title: 'Personal GM follow-up', description: 'GM calls or visits the member directly. Comped experience offered if appropriate. Resolution confirmed in system.', timeline: 'Day 1–2' },
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
  { title: 'Detect — weekly health scan', description: 'Automated weekly scan flags members whose score drops below 50 or declines by 15+ points in 4 weeks.', timeline: 'Every Monday' },
  { title: 'Re-engage — email + events', description: 'Personalized event invitations based on archetype. Members attending 2+ events/month have 60% lower churn probability.', timeline: 'Week 1–2' },
  { title: 'Personal outreach', description: 'Non-responders after 2 weeks get a personal call. Script: acknowledge reduced activity, ask open questions, offer specific value.', timeline: 'Week 3' },
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

export default function MemberPlaybooks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      <PlaybookPanel
        id="service-save"
        title="Service Save Protocol"
        scenario="The mbr_203 pattern: an engaged member files a negative complaint that goes unresolved, leading to resignation within days. One saved resignation protects $18K–$22K in dues plus $3K–$5K in ancillary revenue."
        steps={SERVICE_SAVE_STEPS}
        beforeMetrics={SERVICE_SAVE_BEFORE}
        afterMetrics={SERVICE_SAVE_AFTER}
        accentColor={theme.colors.urgent}
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
