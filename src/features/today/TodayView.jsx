// TodayView — operational cockpit
// 6 sections: Greeting, Staffing+Complaints, Member Alerts, Action Queue, Tomorrow Forecast
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPriorityItems } from '@/services/cockpitService';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';
import TodaysRisks from './TodaysRisks';
import PendingActionsInline from './PendingActionsInline';
import MemberAlerts from './MemberAlerts';
import TomorrowForecast from './TomorrowForecast';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { theme } from '@/config/theme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning — here's what needs your attention today";
  return "Afternoon check-in — here's where things stand";
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function TodayView() {
  const { navigate } = useNavigation();
  const priorities = getPriorityItems();
  const topPriority = priorities[0];
  const briefing = getDailyBriefing();
  const roundsToday = briefing?.teeSheet?.roundsToday || 220;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

        {/* Section 1: Morning Briefing Header */}
        <div style={{
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          padding: '20px 24px',
        }}>
          <div style={{
            fontSize: theme.fontSize.lg, fontWeight: 700,
            color: theme.colors.textPrimary, marginBottom: 4,
            fontFamily: theme.fonts.serif,
          }}>
            {getGreeting()}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
          }}>
            <span>{formatDate()}</span>
            <span style={{ color: theme.colors.border }}>|</span>
            <span>{roundsToday} rounds booked today</span>
            {briefing?.todayRisks?.forecast && (
              <>
                <span style={{ color: theme.colors.border }}>|</span>
                <span style={{ color: theme.colors.warning }}>{briefing.todayRisks.forecast}</span>
              </>
            )}
          </div>
        </div>

        {/* Section 2 & 3: Staffing vs Demand + Open Complaints with Aging */}
        <TodaysRisks />

        {/* Section 4: Top 5 Member Alerts */}
        <MemberAlerts />

        {/* Section 5: Action Queue — hero alert merged with pending actions */}
        <PendingActionsInline topPriority={topPriority} />

        {/* Section 6: Tomorrow's Forecast */}
        <TomorrowForecast />

      </div>
    </PageTransition>
  );
}
