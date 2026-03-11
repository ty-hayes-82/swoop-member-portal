import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import RevenueTab from './tabs/RevenueTab';
import PaceTab from './tabs/PaceTab';
import DemandTab from './tabs/DemandTab';
import OperationsPlaybooks from './OperationsPlaybooks';
import { sourceSystems } from '@/services/operationsService';
import { getWaitlistSummary } from '@/services/pipelineService';
import { theme } from '@/config/theme';

export default function OperationsDashboard() {
  const [activeTab, setActiveTab] = useState('revenue');
  const waitlistSummary = getWaitlistSummary();

  const TABS = [
    { key: 'revenue',   label: 'Daily Revenue' },
    { key: 'pace',      label: 'Pace of Play' },
    {
      key: 'demand',
      label: 'Demand Intelligence',
      badge: waitlistSummary.highPriority > 0 ? `${waitlistSummary.highPriority} priority` : null,
    },
    { key: 'playbooks', label: 'Response Plans', badge: '2 playbooks' },
  ];

  const tabContent = {
    revenue:   <RevenueTab />,
    pace:      <PaceTab />,
    demand:    <DemandTab />,
    playbooks: <OperationsPlaybooks />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      <div
        style={{
          borderTop: `1px solid ${theme.colors.borderStrong ?? theme.colors.border}`,
          paddingTop: theme.spacing.md,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: theme.spacing.sm,
        }}
      >
        <div>
          <p style={{
            margin: 0,
            fontSize: theme.fontSize.xs,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: theme.colors.textMuted,
          }}>Operations Dashboard</p>
          <p style={{
            margin: '4px 0 0',
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}>
            Daily revenue, pace of play, demand intelligence, and response plans
          </p>
        </div>
        <a
          href="#operations-dashboard-panel"
          style={{
            fontSize: theme.fontSize.xs,
            fontWeight: 600,
            color: theme.colors.operations,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Jump to KPIs →
        </a>
      </div>

      <StoryHeadline
        variant="warning"
        headline="Understaffing on 3 Fridays cost $3,400 — and contributed to a resignation worth $18K/year."
        context="Jan 9, 16, 28: Grill Room understaffed. Revenue ran 8% below normal. Complaint rate doubled. One unresolved complaint (Jan 16) is now an active resignation risk."
      />
      <div id="operations-dashboard-panel">
        <Panel
          title="Operations"
          subtitle="How is the golf operation running today?"
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor={theme.colors.operations}
          sourceSystems={sourceSystems}
        >
          {tabContent[activeTab]}
        </Panel>
      </div>
    </div>
  );
}
