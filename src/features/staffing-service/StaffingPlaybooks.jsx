import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const STEPS = [
  {
    title: '72-hour advance gap detection',
    description: 'Auto-scan the upcoming shift schedule against demand forecast (day-of-week patterns + event calendar + weather). Flag coverage gaps before they happen.',
    preview: 'Scan enabled: checks every Sunday night for next week\'s Grill Room coverage vs. projected covers. Alerts sent 72h before any gap.',
    timeline: '72 hours ahead',
    actionType: 'staff-alert',
  },
  {
    title: 'Flex pool coverage — auto-text',
    description: 'Maintain 3–4 cross-trained staff for Grill Room backup. When a gap is flagged, auto-text the flex pool for coverage confirmation.',
    preview: 'Flex pool (4 staff) notified via SMS. First to confirm gets the shift. Calendar auto-updated when confirmed.',
    timeline: 'Day of flag',
    actionType: 'calendar',
  },
  {
    title: 'Post-day audit report',
    description: 'After each operating day, compare actual ticket times and complaint rates to baseline. If degradation detected, investigate root cause.',
    preview: 'Daily audit report generated at 11 PM. Flags any day where ticket time exceeds baseline by 15%+ or complaint rate doubles.',
    timeline: 'Daily review',
    actionType: 'report',
  },
];

const BEFORE = [
  { label: 'Understaffed days/month', value: '3' },
  { label: 'Avg revenue loss/day',    value: '$1,133' },
  { label: 'Complaint multiplier',    value: '2× on gap days' },
];

const AFTER = [
  { label: 'Understaffed days/month', value: '≤ 1' },
  { label: 'Revenue recovered/month', value: '+$2,100' },
  { label: 'Complaint rate',          value: 'Baseline' },
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
