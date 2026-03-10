import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import RevenueTab from './tabs/RevenueTab';
import PaceTab from './tabs/PaceTab';
import DemandTab from './tabs/DemandTab';
import OperationsPlaybooks from './OperationsPlaybooks';
import { sourceSystems } from '@/services/operationsService';
import { getWaitlistSummary } from '@/services/pipelineService';
import { theme } from '@/config/theme';
import OnlySwoopModule from '@/components/ui/OnlySwoopModule.jsx';
import { onlySwoopAngles } from '@/data/onlySwoopAngles.js';

export default function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState('revenue');
  const waitlistSummary = getWaitlistSummary();

  const TABS = [
    { key: 'revenue',   label: 'Daily Revenue' },
    { key: 'pace',      label: 'Pace of Play' },
    { key: 'demand',    label: `Demand Intelligence${waitlistSummary.highPriority > 0 ? ` · ${waitlistSummary.highPriority} priority` : ''}` },
    { key: 'playbooks', label: '▶ Response Plans' },
  ];

  const tabContent = {
    revenue:   <RevenueTab />,
    pace:      <PaceTab />,
    demand:    <DemandTab />,
    playbooks: <OperationsPlaybooks />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <OnlySwoopModule {...onlySwoopAngles.operations} />
      <StoryHeadline
        variant="warning"
        headline="Understaffing on 3 Fridays cost $3,400 — and contributed to a resignation worth $18K/year."
        context="Jan 9, 16, 28: Grill Room understaffed. Revenue ran 8% below normal. Complaint rate doubled. One unresolved complaint (Jan 16) is now an active resignation risk."
      />
      <Panel
        title="Operations"
        subtitle="How is the golf operation running today?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.operations}
        sourceSystems={sourceSystems}
      >
        {tabContent[activeTab]}
      </Panel>
    </div>
  );
}
