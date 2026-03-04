import { useState } from 'react';
import { Panel } from '@/components/ui';
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
  );
}
