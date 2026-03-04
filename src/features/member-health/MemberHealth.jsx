import { useState } from 'react';
import { Panel } from '@/components/ui';
import HealthOverview from './tabs/HealthOverview';
import ArchetypeTab from './tabs/ArchetypeTab';
import EmailTab from './tabs/EmailTab';
import ResignationTimeline from './ResignationTimeline';
import MemberPlaybooks from './MemberPlaybooks';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'health',       label: 'Health Overview' },
  { key: 'archetypes',   label: 'Archetypes' },
  { key: 'email',        label: 'Email Decay' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'playbooks',    label: '▶ Playbooks' },
];

export default function MemberHealth() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <Panel
      title="Member Retention"
      subtitle="Who's at risk and what do we do about it?"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentColor={theme.colors.members}
    >
      {activeTab === 'health'       && <HealthOverview />}
      {activeTab === 'archetypes'   && <ArchetypeTab />}
      {activeTab === 'email'        && <EmailTab />}
      {activeTab === 'resignations' && <ResignationTimeline />}
      {activeTab === 'playbooks'    && <MemberPlaybooks />}
    </Panel>
  );
}
