import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import RevenueTab from './tabs/RevenueTab';
import PaceTab from './tabs/PaceTab';
import DemandTab from './tabs/DemandTab';
import OperationsPlaybooks from './OperationsPlaybooks';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'revenue', label: 'Daily Revenue' },
  { key: 'pace',    label: 'Pace of Play' },
  { key: 'demand',  label: 'Demand Intelligence' },
  { key: 'playbooks', label: '▶ Playbooks' },
];

export default function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState('revenue');

  const tabContent = {
    revenue:   <RevenueTab />,
    pace:      <PaceTab />,
    demand:    <DemandTab />,
    playbooks: <OperationsPlaybooks />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
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
      >
        {tabContent[activeTab]}
      </Panel>
    </div>
  );
}
