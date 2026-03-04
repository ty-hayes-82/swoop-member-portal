import { useState } from 'react';
import { Panel } from '@/components/ui';
import OutletTab from './tabs/OutletTab';
import ConversionTab from './tabs/ConversionTab';
import WeatherTab from './tabs/WeatherTab';
import { theme } from '@/config/theme';

const TABS = [
  { key: 'outlets',    label: 'Outlet Performance' },
  { key: 'conversion', label: 'Post-Round Conversion' },
  { key: 'weather',    label: 'Rain-Day Intelligence' },
];

export default function FBPerformance() {
  const [activeTab, setActiveTab] = useState('outlets');

  return (
    <Panel
      title="Revenue & F&B"
      subtitle="Where is money being made, lost, or left on the table?"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      accentColor={theme.colors.fb}
    >
      {activeTab === 'outlets'    && <OutletTab />}
      {activeTab === 'conversion' && <ConversionTab />}
      {activeTab === 'weather'    && <WeatherTab />}
    </Panel>
  );
}
