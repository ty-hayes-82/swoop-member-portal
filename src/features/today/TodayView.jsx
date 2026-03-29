// TodayView — single scrollable morning briefing
// Merges the old Cockpit Today + Analytics modes into one continuous scroll.
import { useState, useEffect } from 'react';
import { StoryHeadline, Panel } from '@/components/ui/index.js';
import { useApp } from '@/context/AppContext.jsx';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { getPriorityItems } from '@/services/cockpitService.js';
import { getMemberSummary } from '@/services/memberService.js';
import MemberLink from '@/components/MemberLink.jsx';
import MorningBriefing from '@/components/ui/MorningBriefing.jsx';
import RecentInterventions from '@/components/ui/RecentInterventions.jsx';
import TodayMode from '@/features/daily-briefing/TodayMode.jsx';
import YesterdayRecap from '@/features/daily-briefing/YesterdayRecap.jsx';
import SinceLastVisit from './SinceLastVisit.jsx';
import PendingActionsInline from './PendingActionsInline.jsx';
import RevenueSummaryCard from './RevenueSummaryCard.jsx';
import LogFeedbackButton from './LogFeedbackButton.jsx';
import WeekOverWeekGrid from './WeekOverWeekGrid.jsx';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { theme } from '@/config/theme.js';
import { useProductMaturity } from '@/hooks/useProductMaturity.js';
import StalenessAlert from '@/components/ui/StalenessAlert';

export default function TodayView() {
  const { navigate } = useNavigation();
  const { isOnboarding } = useProductMaturity();
  const briefing = getDailyBriefing();
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

  const summary = getMemberSummary();
  // Compute total from tier counts if summary.total is missing/zero
  const tierSum = (summary.healthy || 0) + (summary.watch || 0) + (summary.atRisk || 0) + (summary.critical || 0);
  const totalMembers = summary.total || tierSum || 300;
  // Derive health score from tier distribution when live data is available,
  // to avoid showing static fallback score (72) alongside live tier counts (5 Critical)
  const derivedScore = tierSum > 0
    ? Math.round(((summary.healthy || 0) * 85 + (summary.watch || 0) * 57 + (summary.atRisk || 0) * 35 + (summary.critical || 0) * 15) / tierSum)
    : null;
  const healthScore = derivedScore ?? summary.avgHealthScore ?? 72;
  const healthColor = healthScore >= 70 ? '#16a34a' : healthScore >= 50 ? '#ca8a04' : healthScore >= 30 ? '#ea580c' : '#b91c1c';
  const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 50 ? 'Watch' : healthScore >= 30 ? 'At Risk' : 'Critical';

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

        {/* Staleness alert — shows when data sources are stale */}
        <StalenessAlert />

        {/* Health Score Hero — the first thing a GM sees */}
        <div style={{
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.lg,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flex: '1 1 auto', minWidth: 200 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `conic-gradient(${healthColor} ${healthScore * 3.6}deg, ${theme.colors.border} 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: '50%', background: theme.colors.bgCard,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: theme.fonts.mono, fontSize: '22px', fontWeight: 800, color: healthColor, lineHeight: 1 }}>
                  {Math.round(healthScore)}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Club Health Score
              </div>
              <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
                {healthLabel}
              </div>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 }}>
                {totalMembers} members tracked
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Healthy', count: summary.healthy ?? 0, color: '#16a34a' },
              { label: 'Watch', count: summary.watch ?? 0, color: '#ca8a04' },
              { label: 'At Risk', count: summary.atRisk ?? 0, color: '#ea580c' },
              { label: 'Critical', count: summary.critical ?? 0, color: '#b91c1c' },
            ].map((tier) => (
              <div key={tier.label} style={{
                textAlign: 'center', minWidth: 56,
                padding: '6px 10px', borderRadius: theme.radius.sm,
                background: `${tier.color}08`, border: `1px solid ${tier.color}20`,
              }}>
                <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.lg, fontWeight: 700, color: tier.color }}>
                  {tier.count}
                </div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, fontWeight: 600 }}>{tier.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top priority alert */}
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

        {/* Since last visit badge — includes yesterday's metrics when away >12h */}
        <SinceLastVisit yesterdayData={briefing.yesterdayRecap} />

        {/* Morning context */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MorningBriefing />
        </div>

        {/* Today's 3 priorities */}
        <TodayMode onNavigate={navigate} />

        {/* Pending agent actions inline — exclude top priority to avoid duplication */}
        <PendingActionsInline excludeId={topPriority?.id} />

        {/* Revenue snapshot */}
        <RevenueSummaryCard />

        {/* Proof of recent wins */}
        <RecentInterventions />

        {/* Log member feedback */}
        <LogFeedbackButton />

        {/* Getting Started checklist — onboarding users only */}
        {isOnboarding && (
          <GettingStartedChecklist onNavigate={navigate} />
        )}

        {/* Performance review — hidden during onboarding to reduce cognitive load */}
        {!isOnboarding && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingTop: theme.spacing.md,
              borderTop: `1px solid ${theme.colors.border}`,
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: theme.colors.operations,
                background: `${theme.colors.operations}12`,
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Performance Review
              </span>
            </div>
            <Panel title="Week-Over-Week Trends" subtitle="How this week compares to last week">
              <WeekOverWeekGrid />
            </Panel>
          </>
        )}

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
    { key: 'explore_revenue', label: 'Explore the Revenue breakdown', action: () => { markDone('explore_revenue'); onNavigate('revenue'); } },
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
              {completed[step.key] ? '✓' : ''}
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
