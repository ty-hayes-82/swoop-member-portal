import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import HealthOverview from './tabs/HealthOverview';
import ArchetypeTab from './tabs/ArchetypeTab';
import EmailTab from './tabs/EmailTab';
import ResignationTimeline from './ResignationTimeline';
import RecoveryTab from './tabs/RecoveryTab';
import AllMembersView from './tabs/AllMembersView';
import { sourceSystems } from '@/services/memberService';
import { theme } from '@/config/theme';
import ActionRecommendation from '@/components/ActionRecommendation.jsx';
import { SkeletonMemberList } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import FlowLink from '@/components/ui/FlowLink';
import CohortTab from './tabs/CohortTab';

const TABS = [
  { key: 'health',       label: 'Health Overview' },
  { key: 'all-members',  label: 'All Members' },
  { key: 'archetypes',   label: 'Archetypes' },
  { key: 'email',        label: 'Email Decay' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'recovery',     label: 'Recovery' },
  { key: 'cohorts',      label: 'First 90 Days' },
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {showInsight ? (
        <div style={{ position: 'relative' }}>
          <StoryHeadline
            variant="urgent"
            headline="5 members showed disengagement signals 6-8 weeks before leaving — here's what to watch for."
            context="Email open rates dropped first, then golf frequency, then dining. GPS data shows 3 members consistently leaving after 9 holes — an early signal invisible to the tee sheet. No single system sees the full picture. Swoop connected all three — 30 more members are showing early-stage decay right now."
          />
          <button
            type="button"
            onClick={() => setShowInsight(false)}
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              border: 'none',
              background: 'none',
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.xs,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInsight(true)}
          style={{
            alignSelf: 'flex-end',
            border: '1px dashed ' + theme.colors.border,
            background: theme.colors.bg,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '6px 10px',
            borderRadius: theme.radius.sm,
            cursor: 'pointer',
          }}
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
        accentColor={theme.colors.members}
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