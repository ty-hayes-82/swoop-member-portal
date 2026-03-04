// StaffingService.jsx
import { useState } from 'react';
import { Panel } from '@/components/ui';
import ServiceTab from './tabs/ServiceTab';
import StaffingTab from './tabs/StaffingTab';
import StaffingPlaybooks from './StaffingPlaybooks';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'service',   label: 'Service Quality' },
  { key: 'staffing',  label: 'Staffing Impact' },
  { key: 'playbooks', label: '▶ Playbooks' },
];

export default function StaffingService() {
  const [activeTab, setActiveTab] = useState('service');

  return (
    <Panel
      title="Staffing & Service"
      subtitle="Are we staffed right and serving members well?"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentColor={theme.colors.staffing}
    >
      {activeTab === 'service'   && <ServiceTab />}
      {activeTab === 'staffing'  && <StaffingTab />}
      {activeTab === 'playbooks' && <StaffingPlaybooks />}
    </Panel>
  );
}
