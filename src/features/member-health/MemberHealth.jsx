import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import HealthOverview from './tabs/HealthOverview';
import ArchetypeTab from './tabs/ArchetypeTab';
import EmailTab from './tabs/EmailTab';
import ResignationTimeline from './ResignationTimeline';
import RecoveryTab from './tabs/RecoveryTab';
import AllMembersView from './tabs/AllMembersView';
import { sourceSystems } from '@/services/memberService';
import ActionRecommendation from '@/components/ActionRecommendation.jsx';
import { SkeletonMemberList } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';
import CohortTab from './tabs/CohortTab';
import { shouldUseStatic, getDataMode } from '@/services/demoGate';

const TABS = [
  { key: 'health',       label: 'Health Overview' },
  { key: 'archetypes',   label: 'Archetypes' },
  { key: 'email',        label: 'Email Decay' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'recovery',     label: 'Recovery' },
  { key: 'cohorts',      label: 'First 90 Days' },
  { key: 'all-members',  label: 'Directory' },
];

export default function MemberHealth() {
  const [activeTab, setActiveTab] = useState('health');
  const [showInsight, setShowInsight] = useState(true);

  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  // FP-P02: Show loading skeleton
  if (isLoading) {
    return <SkeletonMemberList />;
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
      {showInsight ? (
        <div className="relative">
          <StoryHeadline
            variant="urgent"
            headline="5 members showed disengagement signals 6-8 weeks before leaving — here's what to watch for."
            context={(() => {
              const _g = getDataMode() === 'guided';
              const parts = [];
              if (!_g || shouldUseStatic('email')) parts.push('Email open rates dropped first');
              if (!_g || shouldUseStatic('tee-sheet')) parts.push('then golf frequency');
              if (!_g || shouldUseStatic('fb')) parts.push('then dining');
              const lead = parts.length > 0 ? parts.join(', ') + '.' : '';
              const gps = (!_g || shouldUseStatic('tee-sheet')) ? ' GPS data shows 3 members consistently leaving after 9 holes — an early signal invisible to the tee sheet.' : '';
              return `${lead}${gps} No single system sees the full picture. Swoop connected all three — 30 more members are showing early-stage decay right now.`;
            })()}
          />
          <button
            type="button"
            onClick={() => setShowInsight(false)}
            className="absolute top-2 right-3 border-none bg-transparent text-gray-400 text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInsight(true)}
          className="self-end border border-dashed border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-widest py-1.5 px-2.5 rounded-lg cursor-pointer"
        >
          Show AI insight
        </button>
      )}
      <FlowLink flowNum="01" persona="Sarah" />
      <Panel
        title="Member Intelligence"
        subtitle="Who needs attention, why, and what to do — catch disengagement before members walk"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={'#ff8b00'}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'health'       && <HealthOverview />}
        {activeTab === 'all-members'  && <AllMembersView />}
        {activeTab === 'archetypes'   && <ArchetypeTab />}
        {activeTab === 'email'        && <EmailTab />}
        {activeTab === 'resignations' && <ResignationTimeline />}
        {activeTab === 'recovery'     && <RecoveryTab />}
        {activeTab === 'cohorts'      && <CohortTab />}
      </Panel>

      <ActionRecommendation
        action="Call top 3 Critical members before end of business today"
        owner="Membership Director"
        dueBy="5:00 PM today"
        proofMetric="3 personal conversations, retention gestures offered, notes logged in CRM"
      />
      </div>
    </PageTransition>
  );
}
