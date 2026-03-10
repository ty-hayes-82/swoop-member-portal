import { useState } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import HealthOverview from './tabs/HealthOverview';
import ArchetypeTab from './tabs/ArchetypeTab';
import EmailTab from './tabs/EmailTab';
import ResignationTimeline from './ResignationTimeline';
import MemberPlaybooks from './MemberPlaybooks';
import { sourceSystems } from '@/services/memberService';
import { theme } from '@/config/theme';
import OnlySwoopModule from '@/components/ui/OnlySwoopModule.jsx';
import { onlySwoopAngles } from '@/data/onlySwoopAngles.js';
import ActionRecommendation from '@/components/ActionRecommendation.jsx';

const TABS = [
  { key: 'health',       label: 'Health Overview' },
  { key: 'archetypes',   label: 'Archetypes' },
  { key: 'email',        label: 'Email Decay' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'playbooks',    label: '▶ Response Plans' },
];

export default function MemberHealth() {
  const [activeTab, setActiveTab] = useState('health');
  const [showInsight, setShowInsight] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <OnlySwoopModule {...onlySwoopAngles.memberHealth} />
      {showInsight ? (
        <div style={{ position: 'relative' }}>
          <StoryHeadline
            variant="urgent"
            headline="5 members will resign this month — all showed decay signals 6–8 weeks before leaving."
            context="Email open rates dropped first, then golf frequency, then dining. No single system sees the full picture. Swoop connected all three — 30 more members are showing early-stage decay right now."
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
      <Panel
        title="Member Retention"
        subtitle="Who's at risk and what do we do about it?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.members}
        sourceSystems={sourceSystems}
      >
        {activeTab === 'health'       && <HealthOverview />}
        {activeTab === 'archetypes'   && <ArchetypeTab />}
        {activeTab === 'email'        && <EmailTab />}
        {activeTab === 'resignations' && <ResignationTimeline />}
        {activeTab === 'playbooks'    && <MemberPlaybooks />}
      </Panel>

      <ActionRecommendation
        action="Call top 3 Critical members before end of business today"
        owner="Membership Director"
        dueBy="5:00 PM today"
        proofMetric="3 personal conversations, retention gestures offered, notes logged in CRM"
      />
    </div>
  );
}