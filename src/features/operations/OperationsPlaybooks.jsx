import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const STEPS = [
  {
    title: 'Deploy Rangers to Bottleneck Holes',
    description: 'Station rangers at holes 4, 8, 12, 16 during Saturday 8–11 AM peak. Zero-cost action using existing staff.',
    timeline: 'Week 1 — This Saturday',
  },
  {
    title: 'Widen Saturday Tee Intervals to 10 min',
    description: 'Reduce from 8-min to 10-min intervals on Saturdays. Fewer rounds but 50% less slow play and higher dining conversion.',
    timeline: 'Week 2 — Next Saturday',
  },
  {
    title: 'Activate Slow-Round Recovery Offer',
    description: 'Members finishing 4:30+ rounds receive auto-text: "Complimentary appetizer at the Grill." Converts frustration to revenue.',
    timeline: 'Week 3 — Ongoing',
  },
];

const BEFORE = [
  { label: 'Slow round rate',    value: '28%' },
  { label: 'Post-round dining',  value: '22% conversion' },
  { label: 'Est. dining/month',  value: '$12,400' },
];

const AFTER = [
  { label: 'Slow round rate',    value: '15%' },
  { label: 'Post-round dining',  value: '34% conversion' },
  { label: 'Est. dining/month',  value: '$20,800' },
];

export default function OperationsPlaybooks() {
  return (
    <div style={{ padding: `${theme.spacing.lg} 0` }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg }}>
        Coordinated interventions for the operations domain. Activate a playbook to track its revenue impact.
      </div>
      <PlaybookPanel
        id="slow-saturday"
        title="Slow Saturday Recovery"
        scenario="Weekend pace has deteriorated to 28% slow-round rate, causing a 15% dining conversion drop and member frustration. This 3-week plan coordinates ranger deployment, tee interval changes, and recovery offers."
        steps={STEPS}
        beforeMetrics={BEFORE}
        afterMetrics={AFTER}
        accentColor={theme.colors.operations}
      />
    </div>
  );
}
