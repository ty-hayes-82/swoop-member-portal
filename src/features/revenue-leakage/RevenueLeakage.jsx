import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import PaceImpactTab from './tabs/PaceImpactTab';
import StaffingImpactTab from './tabs/StaffingImpactTab';
import WeatherImpactTab from './tabs/WeatherImpactTab';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'pace', label: 'Pace-of-Play Impact' },
  { key: 'staffing', label: 'Staffing Gaps' },
  { key: 'weather', label: 'Weather Shifts' },
];

const sourceSystems = ['POS', 'Tee Sheet', 'Scheduling', 'Weather API'];

export default function RevenueLeakage() {
  const [activeTab, setActiveTab] = useState('pace');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="risk"
        headline="Operational failures are costing you $9,580 in monthly F&B revenue."
        context="Revenue leakage happens when service breakdowns (slow rounds, understaffing, weather impacts) interrupt member dining patterns. Most clubs see the symptom (lower covers) but miss the operational cause."
      />
      
      <EvidenceStrip signals={[
        { source: 'Tee Sheet', detail: 'Pace-of-play delays affect 28% of rounds' },
        { source: 'Scheduling', detail: '3 understaffed days identified in January' },
        { source: 'POS', detail: 'Post-round conversion drops 46% after slow rounds' },
        { source: 'Weather API', detail: 'Rain days show 18% shift to indoor dining' },
      ]} />

      <Panel
        title="Revenue Leakage"
        subtitle="Which operational failures are costing you F&B spend?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.fb}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'pace' && <PaceImpactTab />}
        {activeTab === 'staffing' && <StaffingImpactTab />}
        {activeTab === 'weather' && <WeatherImpactTab />}
      </Panel>
    </div>
  );
}
