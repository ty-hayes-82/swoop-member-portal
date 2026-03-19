// ExperienceInsights — correlations between experience inputs and business outcomes
import { useState, useEffect } from 'react';
import { Panel } from '@/components/ui';
import { theme } from '@/config/theme';
import { getArchetypeProfiles } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';
import { SegmentFilter, ArchetypeFilter } from './components/Filters';
import CorrelationsTab from './tabs/CorrelationsTab';
import TouchpointsTab from './tabs/TouchpointsTab';
import ComplaintsTab from './tabs/ComplaintsTab';
import EventsTab from './tabs/EventsTab';
import SpendPotentialTab from './tabs/SpendPotentialTab';
import SurveyTab from './tabs/SurveyTab';

const TABS = [
  { key: 'correlations', label: 'Correlations' },
  { key: 'touchpoints', label: 'Touchpoints' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'events', label: 'Event ROI' },
  { key: 'spend', label: 'Spend Potential' },
  { key: 'surveys', label: 'Survey Intelligence' },
];

const SEGMENT_COUNTS = { all: 300, 'at-risk': 47, healthy: 218 };

export default function ExperienceInsights() {
  const [activeTab, setActiveTab] = useState('correlations');
  const [segment, setSegment] = useState('all');
  const [archetype, setArchetype] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={2} cardHeight={140} />;
  }

  const archetypeCount = archetype
    ? (getArchetypeProfiles().find((p) => p.archetype === archetype)?.count ?? 0)
    : null;
  const effectiveCount = archetype ? archetypeCount : SEGMENT_COUNTS[segment];

  const tabContent = {
    correlations: <CorrelationsTab segment={segment} archetype={archetype} />,
    touchpoints: <TouchpointsTab segment={segment} archetype={archetype} />,
    complaints: <ComplaintsTab />,
    events: <EventsTab />,
    spend: <SpendPotentialTab archetype={archetype} />,
    surveys: <SurveyTab />,
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: theme.colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px',
          }}>
            Experience-Outcome Intelligence
          </div>
          <h2 style={{
            fontFamily: theme.fonts.serif,
            fontSize: '24px',
            fontWeight: 400,
            color: theme.colors.textPrimary,
            margin: 0,
            lineHeight: 1.2,
          }}>
            Which experiences drive retention — and which ones cost you members?
          </h2>
          <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '6px 0 0' }}>
            Cross-domain correlations between touchpoints and business outcomes. Data from 6 connected systems.
          </p>
        </div>

        <FlowLink flowNum="04" persona="Chef Marco" />

        {(activeTab === 'correlations' || activeTab === 'touchpoints' || activeTab === 'spend') && (
          <>
            <SegmentFilter segment={segment} onChange={setSegment} />
            <ArchetypeFilter archetype={archetype} onChange={setArchetype} />
          </>
        )}

        <Panel
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor={theme.colors.accent}
        >
          {tabContent[activeTab]}
        </Panel>
      </div>
    </PageTransition>
  );
}
