import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const SLOW_SAT_STEPS = [
  {
    title: 'Deploy Rangers to Bottleneck Holes',
    description: 'Station rangers at holes 4, 8, 12, 16 during Saturday 8–11 AM peak. Zero-cost action using existing staff.',
    preview: 'Dispatch notification sent to on-duty rangers with hole assignments and GPS coordinates.',
    timeline: 'Week 1 — This Saturday',
    actionType: 'dispatch',
  },
  {
    title: 'Widen Saturday Tee Intervals to 10 min',
    description: 'Reduce from 8-min to 10-min intervals on Saturdays. Fewer rounds but 50% less slow play and higher dining conversion.',
    preview: 'Tee sheet updated automatically: Saturday intervals changed 8 → 10 min. 16 fewer slots.',
    timeline: 'Week 2 — Next Saturday',
    actionType: 'schedule',
  },
  {
    title: 'Activate Slow-Round Recovery Offer',
    description: 'Members finishing 4:30+ rounds receive auto-text: "Complimentary appetizer at the Grill."',
    preview: 'Auto-text queued: triggered when round completion exceeds 270 min. Template ready.',
    timeline: 'Week 3 — Ongoing',
    actionType: 'email',
  },
];

const PEAK_DEMAND_STEPS = [
  {
    title: 'Identify At-Risk Members in Queue',
    description: 'Score every waitlist entry against health score and resignation risk. Members with health < 50 are flagged for priority notification.',
    preview: 'Health scores pulled from Member CRM + Tee Sheet: 5 members flagged as retention priority.',
    timeline: 'Immediate',
    actionType: 'report',
  },
  {
    title: 'Send Priority Cancellation Alerts',
    description: 'Notify retention-flagged members first when a Saturday AM cancellation opens — ahead of general first-come list.',
    preview: 'Priority alert queued: Anne Jordan, Kevin Hurst, James Whitfield, Steven Park, Linda Leonard.',
    timeline: 'On next cancellation',
    actionType: 'outreach',
  },
  {
    title: 'Attach Post-Round Dining Incentive',
    description: '"Table reserved for post-round lunch" added to every priority notification. Coordinates Tee Sheet + POS in one action.',
    preview: 'Comp reservation pre-attached: Grill Room, 11 AM–1 PM window, linked to booking confirmation.',
    timeline: 'On notification send',
    actionType: 'comp-offer',
  },
  {
    title: 'Alert F&B for Cover Count Adjustment',
    description: 'Notify F&B Director to prep for 15% additional Saturday covers driven by retention-priority fills and attached dining offers.',
    preview: 'Staff alert sent to F&B Director: +8 est. covers, Saturday AM, linked to waitlist activation.',
    timeline: 'Day before',
    actionType: 'staff-alert',
  },
  {
    title: 'Track Fill → Dining → Health Delta',
    description: 'Log each visit session: tee time filled, dining conversion (Y/N), health score before/after. Builds ROI evidence for board reporting.',
    preview: 'Session tracking active: tee fill → post-round dining → health score delta → revenue attribution.',
    timeline: 'Ongoing',
    actionType: 'track',
  },
];

const SLOW_SAT_BEFORE = [
  { label: 'Slow round rate',   value: '28%' },
  { label: 'Post-round dining', value: '22% conversion' },
  { label: 'Est. dining/month', value: '$12,400' },
];

const SLOW_SAT_AFTER = [
  { label: 'Slow round rate',   value: '15%' },
  { label: 'Post-round dining', value: '34% conversion' },
  { label: 'Est. dining/month', value: '$20,800' },
];

const PEAK_DEMAND_BEFORE = [
  { label: 'Waitlist fill rate',       value: '67%' },
  { label: 'Priority notifications',   value: '0 (first-come)' },
  { label: 'Post-round conversion',    value: '22% from fills' },
];

const PEAK_DEMAND_AFTER = [
  { label: 'Waitlist fill rate',       value: '91%' },
  { label: 'Priority notifications',   value: 'Retention-first' },
  { label: 'Post-round conversion',    value: '41% from fills' },
];

export default function OperationsPlaybooks() {
  return (
    <div style={{ padding: `${theme.spacing.lg} 0`, display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
        Coordinated interventions for the operations domain. Activate a playbook to track its revenue impact.
      </div>

      <PlaybookPanel
        id="slow-saturday"
        title="Slow Saturday Recovery"
        scenario="Weekend pace has deteriorated to 28% slow-round rate, causing a 15% dining conversion drop and member frustration. This 3-week plan coordinates ranger deployment, tee interval changes, and recovery offers."
        steps={SLOW_SAT_STEPS}
        beforeMetrics={SLOW_SAT_BEFORE}
        afterMetrics={SLOW_SAT_AFTER}
        accentColor={theme.colors.operations}
      />

      <PlaybookPanel
        id="peak-demand-capture"
        title="Peak Demand Capture"
        scenario="Saturday 7–9 AM has 10+ waitlisted members, 5 of whom are at retention risk. First-come-first-served alerts ignore health scores entirely — this playbook routes cancellation alerts to at-risk members first and attaches a dining incentive in the same action."
        steps={PEAK_DEMAND_STEPS}
        beforeMetrics={PEAK_DEMAND_BEFORE}
        afterMetrics={PEAK_DEMAND_AFTER}
        accentColor={theme.colors.agentCyan}
      />
    </div>
  );
}
