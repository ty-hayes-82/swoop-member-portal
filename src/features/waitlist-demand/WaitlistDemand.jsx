import { useEffect, useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import { theme } from '@/config/theme';
import OnlySwoopModule from '@/components/ui/OnlySwoopModule.jsx';
import { onlySwoopAngles } from '@/data/onlySwoopAngles.js';
import QueueTab from './tabs/QueueTab';
import PredictionsTab from './tabs/PredictionsTab';
import IntelligenceTab from './tabs/IntelligenceTab';
import { useNavigation } from '@/context/NavigationContext';
import {
  sourceSystems,
  getWaitlistSummary,
  getCancellationSummary,
  getWaitlistInsight,
} from '@/services/waitlistService';

const TABS = [
  { key: 'queue', label: 'Member Queue' },
  { key: 'predictions', label: 'Cancellation Risk' },
  { key: 'intelligence', label: 'Demand Intelligence' },
];

const ROUTE_LABEL = 'Tee Sheet & Demand';

export default function WaitlistDemand() {
  const { routeIntent, clearRouteIntent } = useNavigation();
  const [activeTab, setActiveTab] = useState('queue');
  const waitlistSummary = getWaitlistSummary() ?? {
    total: 0, highPriority: 0, atRisk: 0, avgDaysWaiting: 0,
  };
  const cancellationSummary = getCancellationSummary() ?? {
    total: 0, highRisk: 0, totalRevAtRisk: 0, topDriver: 'Insufficient data',
  };

  useEffect(() => {
    if (routeIntent?.waitlistTab && TABS.some((tab) => tab.key === routeIntent.waitlistTab)) {
      setActiveTab(routeIntent.waitlistTab);
      clearRouteIntent();
    }
  }, [routeIntent, clearRouteIntent]);

  const tabsWithBadges = TABS.map((tab) => {
    if (tab.key === 'queue' && waitlistSummary?.highPriority > 0) {
      return { ...tab, label: `${tab.label} · ${waitlistSummary.highPriority} priority` };
    }
    if (tab.key === 'predictions' && cancellationSummary?.highRisk > 0) {
      return { ...tab, label: `${tab.label} · ${cancellationSummary.highRisk} high-risk` };
    }
    return tab;
  });

  const tabContent = {
    queue: <QueueTab />,
    predictions: <PredictionsTab />,
    intelligence: <IntelligenceTab />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <OnlySwoopModule {...onlySwoopAngles.waitlistDemand} />
      <StoryHeadline
        variant="warning"
        headline={`${waitlistSummary.highPriority} retention-priority members are waiting while ${cancellationSummary.highRisk} bookings show high cancel risk.`}
        context={`${getWaitlistInsight()} Route them directly inside ${ROUTE_LABEL}.`}
      />

      <Panel
        title={ROUTE_LABEL}
        subtitle="Who is waiting, who will cancel, and what does it cost?"
        tabs={tabsWithBadges}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sourceSystems={sourceSystems}
      >
        {tabContent[activeTab]}
      </Panel>
    </div>
  );
}
