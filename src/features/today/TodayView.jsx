// TodayView — single scrollable morning briefing
// Merges the old Cockpit Today + Analytics modes into one continuous scroll.
import { useState, useEffect } from 'react';
import { StoryHeadline, Panel } from '@/components/ui/index.js';
import { useApp } from '@/context/AppContext.jsx';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { getPriorityItems } from '@/services/cockpitService.js';
import MemberLink from '@/components/MemberLink.jsx';
import MorningBriefing from '@/components/ui/MorningBriefing.jsx';
import RecentInterventions from '@/components/ui/RecentInterventions.jsx';
import TodayMode from '@/features/daily-briefing/TodayMode.jsx';
import YesterdayRecap from '@/features/daily-briefing/YesterdayRecap.jsx';
import SinceLastVisit from './SinceLastVisit.jsx';
import PendingActionsInline from './PendingActionsInline.jsx';
import LogFeedbackButton from './LogFeedbackButton.jsx';
import WeekOverWeekGrid from './WeekOverWeekGrid.jsx';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { theme } from '@/config/theme.js';

export default function TodayView() {
  const { navigate } = useNavigation();
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

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

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

        {/* Since last visit badge */}
        <SinceLastVisit />

        {/* Morning context */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MorningBriefing />
        </div>

        {/* Today's 3 priorities */}
        <TodayMode onNavigate={navigate} />

        {/* Pending agent actions inline */}
        <PendingActionsInline />

        {/* Proof of recent wins */}
        <RecentInterventions />

        {/* Log member feedback */}
        <LogFeedbackButton />

        {/* Performance review divider */}
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

        {/* Yesterday's results */}
        <Panel title="Yesterday's Results" subtitle="How did January 16th perform vs. expectations?">
          <YesterdayRecap data={briefing.yesterdayRecap} />
        </Panel>

        {/* Week-over-week trends */}
        <Panel title="Week-Over-Week Trends" subtitle="How this week compares to last week">
          <WeekOverWeekGrid />
        </Panel>

      </div>
    </PageTransition>
  );
}
