import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import HealthOverview from './tabs/HealthOverview';
import ArchetypeTab from './tabs/ArchetypeTab';
import EmailTab from './tabs/EmailTab';
import ResignationTimeline from './ResignationTimeline';
import MemberPlaybooks from './MemberPlaybooks';
import { sourceSystems } from '@/services/memberService';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'health',       label: 'Health Overview' },
  { key: 'archetypes',   label: 'Archetypes' },
  { key: 'email',        label: 'Email Decay' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'playbooks',    label: '▶ Response Plans' },
];

export default function MemberHealth() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="urgent"
        headline="5 members will resign this month — all showed decay signals 6–8 weeks before leaving."
        context="Email open rates dropped first, then golf frequency, then dining. No single system sees the full picture. Swoop connected all three — 30 more members are showing early-stage decay right now."
      />
      <Panel
        title="Member Retention"
        subtitle="Who's at risk and what do we do about it?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.members}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'health'       && <HealthOverview />}
        {activeTab === 'archetypes'   && <ArchetypeTab />}
        {activeTab === 'email'        && <EmailTab />}
        {activeTab === 'resignations' && <ResignationTimeline />}
        {activeTab === 'playbooks'    && <MemberPlaybooks />}
      </Panel>
    </div>
  );
}
