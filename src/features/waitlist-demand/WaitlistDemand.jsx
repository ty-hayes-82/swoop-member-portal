import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import QueueTab from './tabs/QueueTab';
import PredictionsTab from './tabs/PredictionsTab';
import IntelligenceTab from './tabs/IntelligenceTab';
import { sourceSystems, getWaitlistSummary, getCancellationSummary } from '@/services/waitlistService';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'queue',        label: 'Member Queue' },
  { key: 'predictions',  label: 'Cancellation Risk' },
  { key: 'intelligence', label: 'Demand Intelligence' },
];

export default function WaitlistDemand() {
  const [activeTab, setActiveTab] = useState('queue');
  const waitlistSummary = getWaitlistSummary();
  const cancelSummary = getCancellationSummary();

  const tabsWithBadges = TABS.map(t => {
    if (t.key === 'queue' && waitlistSummary.highPriority > 0)
      return { ...t, label: `Member Queue · ${waitlistSummary.highPriority} priority` };
    if (t.key === 'predictions' && cancelSummary.highRisk > 0)
      return { ...t, label: `Cancellation Risk · ${cancelSummary.highRisk} high-risk` };
    return t;
  });

  const tabContent = {
    queue:        <QueueTab />,
    predictions:  <PredictionsTab />,
    intelligence: <IntelligenceTab />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="warning"
        headline={`${waitlistSummary.highPriority} at-risk members are waiting for Saturday slots — and your alerts don't know that.`}
        context={`First-come-first-served notification ignores health scores entirely. Anne Jordan (score: 38) has waited 4 days. Kevin Hurst (score: 24) has waited 6. Both are on resignation trajectories. Filling their slots first doesn't just fill a tee time — it changes a retention outcome.`}
      />
      <Panel
        title="Waitlist & Demand"
        subtitle="Who is waiting, who will cancel, and what does it cost?"
        tabs={tabsWithBadges}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor="#22D3EE"
        sourceSystems={sourceSystems}
      >
        {tabContent[activeTab]}
      </Panel>
    </div>
  );
}
