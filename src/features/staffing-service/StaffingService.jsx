// StaffingService.jsx
import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="urgent"
        headline="The Jan 16 complaint was never resolved. mbr_203 resigns Jan 22 — $18K in annual dues lost."
        context="A scheduling gap caused slow service. The complaint was acknowledged but not acted on. Four days later, the member is gone. This is the cost of a staffing gap that no single system could see — until now."
      />
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
    </div>
  );
}
