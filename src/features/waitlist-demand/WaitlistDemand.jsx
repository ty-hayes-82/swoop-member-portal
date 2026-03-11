import { useEffect, useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import { theme } from '@/config/theme';
import QueueTab from './tabs/QueueTab';
import PredictionsTab from './tabs/PredictionsTab';
import IntelligenceTab from './tabs/IntelligenceTab';
import { useNavigation } from '@/context/NavigationContext';
import {
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';

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
  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={3} cardHeight={160} />;
  }

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
    <PageTransition>
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="warning"
        headline={`${waitlistSummary.highPriority} retention-priority members are waiting while ${cancellationSummary.highRisk} bookings show high cancel risk.`}
        context={`${getWaitlistInsight()} Route them directly inside ${ROUTE_LABEL}.`}
      />

      <EvidenceStrip signals={[
        { source: 'Tee Sheet', detail: 'Booking patterns and cancellation history' },
        { source: 'CRM', detail: 'Member health score and dues at risk' },
        { source: 'POS', detail: 'Post-round spend correlation' },
      ]} />

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
    </PageTransition>
  );
}
