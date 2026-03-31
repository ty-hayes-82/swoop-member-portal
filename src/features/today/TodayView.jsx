// TodayView — morning cockpit
// 3 sections: (1) Today's Risks, (2) Priority Members, (3) Pending Actions
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui/index.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { getPriorityItems } from '@/services/cockpitService.js';
import MemberLink from '@/components/MemberLink.jsx';
import TodaysRisks from './TodaysRisks.jsx';
import PendingActionsInline from './PendingActionsInline.jsx';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { theme } from '@/config/theme.js';
import { useProductMaturity } from '@/hooks/useProductMaturity.js';

export default function TodayView() {
  const { navigate } = useNavigation();
  const { isOnboarding } = useProductMaturity();
  const priorities = getPriorityItems();
  const topPriority = priorities[0];

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

        {/* Section 1: Today's Risks — operational risk cards */}
        <TodaysRisks />

        {/* Section 2: Priority member alert */}
        <StoryHeadline
          variant="urgent"
          headline={topPriority?.memberName ? (
            <>
              <MemberLink
                mode="drawer"
                memberId={topPriority.memberId}
                style={{
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  textDecorationColor: `${theme.colors.urgent}80`,
                }}
              >
                {topPriority.memberName}
              </MemberLink>
              {' '}{topPriority.headline.replace(topPriority.memberName, '').trim()}
            </>
          ) : (
            topPriority?.headline ?? 'No active priority items.'
          )}
          context={topPriority?.recommendation ?? ''}
        />

        {/* Section 3: Pending actions — always visible */}
        <PendingActionsInline excludeId={topPriority?.id} />

        {/* Getting Started checklist — onboarding users only, below pending actions */}
        {isOnboarding && <GettingStartedChecklist onNavigate={navigate} />}

      </div>
    </PageTransition>
  );
}

function GettingStartedChecklist({ onNavigate }) {
  const [completed, setCompleted] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('swoop_onboarding_steps') || '{}');
    } catch { return {}; }
  });

  const markDone = (key) => {
    const updated = { ...completed, [key]: true };
    setCompleted(updated);
    try { localStorage.setItem('swoop_onboarding_steps', JSON.stringify(updated)); } catch {}
  };

  const steps = [
    { key: 'review_action', label: 'Review and approve your first action', action: () => { markDone('review_action'); onNavigate('actions'); } },
    { key: 'review_member', label: 'Open a member profile and review their health', action: () => { markDone('review_member'); onNavigate('members'); } },
    { key: 'check_service', label: 'Check the Service & Staffing page', action: () => { markDone('check_service'); onNavigate('service'); } },
    { key: 'view_board_report', label: 'Preview your Board Report', action: () => { markDone('view_board_report'); onNavigate('board-report'); } },
  ];

  const allDone = steps.every(s => completed[s.key]);
  if (allDone) return null;

  return (
    <div style={{
      border: `1px solid ${theme.colors.accent}30`,
      borderRadius: theme.radius.md,
      background: `${theme.colors.accent}04`,
      padding: theme.spacing.md,
    }}>
      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
        Getting Started
      </div>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.md }}>
        Complete these steps to get the most out of Swoop in your first week.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((step) => (
          <button
            key={step.key}
            onClick={step.action}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: theme.radius.sm,
              border: `1px solid ${completed[step.key] ? theme.colors.success + '30' : theme.colors.border}`,
              background: completed[step.key] ? `${theme.colors.success}06` : theme.colors.bgCard,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${completed[step.key] ? theme.colors.success : theme.colors.border}`,
              background: completed[step.key] ? theme.colors.success : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff',
            }}>
              {completed[step.key] ? '\u2713' : ''}
            </span>
            <span style={{
              fontSize: theme.fontSize.sm, fontWeight: 500,
              color: completed[step.key] ? theme.colors.textMuted : theme.colors.textPrimary,
              textDecoration: completed[step.key] ? 'line-through' : 'none',
            }}>
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
