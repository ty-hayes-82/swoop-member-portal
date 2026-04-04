// ServiceView — service quality, staffing intelligence, and complaint patterns
// Addresses #1 survey demand (service consistency, 70%) and #2 (staffing-to-demand, 60%)
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
import { useNavigationContext } from '@/context/NavigationContext';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import QualityTab from './tabs/QualityTab';
import StaffingTab from './tabs/StaffingTab';
import ComplaintsTab from './tabs/ComplaintsTab';

const TABS = [
  { key: 'quality', label: 'Quality' },
  { key: 'staffing', label: 'Staffing' },
  { key: 'complaints', label: 'Complaints' },
];

export default function ServiceView() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [activeTab, setActiveTab] = useState('quality');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.tab && TABS.some(t => t.key === routeIntent.tab)) {
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

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <StoryHeadline
          variant="insight"
          headline="Is your service consistent across shifts, outlets, and days — and where is it at risk?"
          context="Cross-domain view connecting staffing levels, complaint patterns, and pace of play to service quality outcomes."
        />

        <EvidenceStrip systems={['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather']} />

        {/* Tab switcher */}
        <div className="flex self-start rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all duration-150 ${
                activeTab === key
                  ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'quality' && <QualityTab />}
        {activeTab === 'staffing' && <StaffingTab />}
        {activeTab === 'complaints' && <ComplaintsTab />}
      </div>
    </PageTransition>
  );
}
