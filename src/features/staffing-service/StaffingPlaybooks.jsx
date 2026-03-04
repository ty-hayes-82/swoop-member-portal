// StaffingPlaybooks.jsx
import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const STEPS = [
  { title: '72-hour advance alert', description: 'Auto-scan the upcoming shift schedule against demand forecast (day-of-week patterns + event calendar + weather). Flag coverage gaps before they happen.', timeline: '72 hours ahead' },
  { title: 'Flex pool coverage', description: 'Maintain 3–4 cross-trained staff for Grill Room backup. When a gap is flagged, auto-text the flex pool for coverage confirmation.', timeline: 'Day of flag' },
  { title: 'Post-day audit', description: 'After each operating day, compare actual ticket times and complaint rates to baseline. If degradation detected, investigate root cause.', timeline: 'Daily review' },
];

const BEFORE = [
  { label: 'Understaffed days/month', value: '3' },
  { label: 'Avg revenue loss/day', value: '$1,133' },
  { label: 'Complaint multiplier', value: '2× on gap days' },
];

const AFTER = [
  { label: 'Understaffed days/month', value: '≤ 1' },
  { label: 'Revenue recovered/month', value: '+$2,100' },
  { label: 'Complaint rate', value: 'Baseline' },
];

export default function StaffingPlaybooks() {
  return (
    <div style={{ paddingTop: 8 }}>
      <PlaybookPanel
        id="staffing-gap"
        title="Staffing Gap Prevention"
        scenario="Three understaffed days in January (9th, 16th, 28th) caused 20% longer ticket times, doubled complaint rates, and ~8% lower revenue — roughly $3,400 in preventable losses."
        steps={STEPS}
        beforeMetrics={BEFORE}
        afterMetrics={AFTER}
        accentColor={theme.colors.staffing}
      />
    </div>
  );
}
