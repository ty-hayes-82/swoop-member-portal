// ServiceView — service quality, staffing intelligence, and complaint patterns
// Addresses #1 survey demand (service consistency, 70%) and #2 (staffing-to-demand, 60%)
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
import { theme } from '@/config/theme';
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <StoryHeadline
          variant="insight"
          headline="Is your service consistent across shifts, outlets, and days — and where is it at risk?"
          context="Cross-domain view connecting staffing levels, complaint patterns, and pace of play to service quality outcomes."
        />

        <EvidenceStrip systems={['Scheduling', 'POS', 'Tee Sheet', 'Complaints', 'Weather']} />

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: theme.colors.bgDeep,
          borderRadius: theme.radius.md,
          padding: '3px',
          border: `1px solid ${theme.colors.border}`,
          alignSelf: 'flex-start',
        }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '7px 20px',
                borderRadius: '8px',
                fontSize: theme.fontSize.sm,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s',
                background: activeTab === key ? theme.colors.bgCard : 'transparent',
                color: activeTab === key ? theme.colors.textPrimary : theme.colors.textMuted,
                boxShadow: activeTab === key ? theme.shadow.sm : 'none',
              }}
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
