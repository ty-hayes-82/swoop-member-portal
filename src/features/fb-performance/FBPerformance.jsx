import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import OutletTab from './tabs/OutletTab';
import ConversionTab from './tabs/ConversionTab';
import WeatherTab from './tabs/WeatherTab';
import { sourceSystems } from '@/services/fbService';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'outlets',    label: 'Outlet Performance' },
  { key: 'conversion', label: 'Post-Round Conversion' },
  { key: 'weather',    label: 'Rain-Day Intelligence' },
];

export default function FBPerformance() {
  const [activeTab, setActiveTab] = useState('outlets');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="opportunity"
        headline="Slow rounds are leaving $5,700/month in dining revenue on the table."
        context="35% of golfers dine post-round — but that drops to 22% after a slow round (4:30+). 28% of January rounds were slow. Fixing pace is also a dining intervention."
      />
      <EvidenceStrip signals={[
        { source: 'POS', detail: 'Cover counts and per-capita spend' },
        { source: 'Tee Sheet', detail: 'Pace-of-play to post-round dining conversion' },
        { source: 'Staffing', detail: 'Server-to-cover ratio and service timing' },
        { source: 'GPS', detail: 'Clubhouse dwell time after round' },
      ]} />

      <Panel
        title="Revenue & F&B"
        subtitle="Where is money being made, lost, or left on the table?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.fb}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'outlets'    && <OutletTab />}
        {activeTab === 'conversion' && <ConversionTab />}
        {activeTab === 'weather'    && <WeatherTab />}
      </Panel>
    </div>
  );
}
