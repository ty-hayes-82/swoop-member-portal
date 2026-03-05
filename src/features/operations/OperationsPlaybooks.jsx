import { PlaybookPanel } from '@/components/playbooks';
import { theme } from '@/config/theme';

const STEPS = [
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

const BEFORE = [
  { label: 'Slow round rate',   value: '28%' },
  { label: 'Post-round dining', value: '22% conversion' },
  { label: 'Est. dining/month', value: '$12,400' },
];

const AFTER = [
  { label: 'Slow round rate',   value: '15%' },
  { label: 'Post-round dining', value: '34% conversion' },
  { label: 'Est. dining/month', value: '$20,800' },
];

const IMPACT = {
  monthly: 8400, annual: 100800,
  logicChain: '28% slow rounds → 668 rounds × 15% lower conversion × $8.60 avg check lost = $5,740/mo pace + $2,660/mo recovery offer = $8,400/mo',
};

export default function OperationsPlaybooks() {
  return (
    <div style={{ padding: `${theme.spacing.lg} 0` }}>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg }}>
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
