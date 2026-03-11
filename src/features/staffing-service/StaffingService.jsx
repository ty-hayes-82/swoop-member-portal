import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import ServiceTab from './tabs/ServiceTab';
import StaffingTab from './tabs/StaffingTab';
import StaffingPlaybooks from './StaffingPlaybooks';
import { sourceSystems } from '@/services/staffingService';
import { theme } from '@/config/theme';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';

import PageTransition from '@/components/ui/PageTransition';

const TABS = [
  { key: 'service',   label: 'Service Quality' },
  { key: 'staffing',  label: 'Staffing Impact' },
  { key: 'playbooks', label: '▶ Response Plans' },
];

export default function StaffingService() {
  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={3} cardHeight={160} />;
  }

  const [activeTab, setActiveTab] = useState('service');

  return (
    <PageTransition>
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="urgent"
        headline="The Jan 16 complaint was never resolved. James Whitfield resigned Jan 22 — $18K in annual dues lost."
        context="A scheduling gap caused slow service. The complaint was acknowledged but not acted on. Four days later, the member is gone. This is the cost of a staffing gap that no single system could see — until now."
      />
      <EvidenceStrip signals={[
        { source: 'Staffing', detail: 'Coverage gaps and shift patterns' },
        { source: 'Complaint', detail: 'Service failure correlation' },
        { source: 'CRM', detail: 'Member resignation risk from service gaps' },
      ]} />

      <Panel
        title="Staffing & Service"
        subtitle="Are we staffed right and serving members well?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.staffing}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'service'   && <ServiceTab />}
        {activeTab === 'staffing'  && <StaffingTab />}
        {activeTab === 'playbooks' && <StaffingPlaybooks />}
      </Panel>
    </div>
    </PageTransition>
  );
}
