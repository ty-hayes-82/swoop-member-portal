// ServiceView — service quality, staffing intelligence, and complaint patterns
// Addresses #1 survey demand (service consistency, 70%) and #2 (staffing-to-demand, 60%)
import { useState, useEffect } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';
import { ServiceTicketsPanel } from '@/components/insights/DeepInsightWidgets';
import QualityTab from './tabs/QualityTab';
import StaffingTab from './tabs/StaffingTab';
import ComplaintsTab from './tabs/ComplaintsTab';

const ALL_TABS = [
  { key: 'quality', label: 'Quality' },
  { key: 'staffing', label: 'Staffing' },
  { key: 'complaints', label: 'Complaints' },
];

export default function ServiceView() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const tabs = ALL_TABS;
  const [activeTab, setActiveTab] = useState('quality');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.tab && tabs.some(t => t.key === routeIntent.tab)) {
      setActiveTab(routeIntent.tab);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={3} cardHeight={160} />;
  }

  // Service page requires complaint data to be meaningful
  if (!isGateOpen('complaints')) {
    return (
      <PageTransition>
        <DataEmptyState
          icon="📋"
          title="No service data yet"
          description="Import service requests and complaint data to see service consistency scores, staffing gaps, and complaint patterns."
          dataType="service requests"
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <EvidenceStrip systems={['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather']} />

        {/* Service tickets surface from imported service_requests */}
        <ServiceTicketsPanel />

        {/* Tab switcher */}
        <div role="tablist" aria-label="Service tabs" className="flex gap-1 self-start rounded-lg bg-swoop-row p-0.5 border border-swoop-border overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
                activeTab === key
                  ? 'bg-swoop-panel text-swoop-text shadow-theme-xs'
                  : 'bg-transparent text-swoop-text-muted hover:text-swoop-text-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div role="tabpanel">
          {activeTab === 'quality' && <QualityTab />}
          {activeTab === 'staffing' && <StaffingTab />}
          {activeTab === 'complaints' && <ComplaintsTab />}
        </div>
      </div>
    </PageTransition>
  );
}
