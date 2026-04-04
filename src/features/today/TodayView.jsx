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
import { getWeatherAlerts } from '@/services/weatherService';
import { isAuthenticatedClub } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';

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
  const roundsToday = briefing?.teeSheet?.roundsToday || (isAuthenticatedClub() ? 0 : 220);

  const weatherAlerts = getWeatherAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Real club with no operational data — show welcome state instead of demo data
  const hasNoData = isAuthenticatedClub() && !briefing?.teeSheet?.roundsToday && priorities.length === 0;
  if (hasNoData) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>{getGreeting()}</h1>
            <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: '4px 0 0' }}>{formatDate()}</p>
          </div>
          <DataEmptyState icon="📊" title="Welcome to your dashboard" description="Import your member roster, tee sheet, and POS data to see today's operational briefing. Start with members — each data source you connect unlocks more insights." dataType="club data" />
        </div>
      </PageTransition>
    );
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

        {/* Weather Alerts Banner */}
        {weatherAlerts.filter(a => !dismissedAlerts.includes(a.headline)).map((alert, i) => (
          <div key={i} style={{
            background: alert.severity === 'EXTREME' || alert.severity === 'SEVERE'
              ? `${theme.colors.urgent}12` : `${theme.colors.warning}12`,
            border: `1px solid ${alert.severity === 'EXTREME' || alert.severity === 'SEVERE'
              ? theme.colors.urgent : theme.colors.warning}40`,
            borderRadius: theme.radius.md,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600,
                color: alert.severity === 'EXTREME' || alert.severity === 'SEVERE'
                  ? theme.colors.urgent : theme.colors.warning }}>
                {alert.headline || `${alert.type} Warning`}
              </span>
              {alert.description && (
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                  — {alert.description}
                </span>
              )}
            </div>
            <button
              onClick={() => setDismissedAlerts(prev => [...prev, alert.headline])}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.colors.textMuted, fontSize: theme.fontSize.sm,
                padding: '2px 6px',
              }}
            >
              Dismiss
            </button>
          </div>
        ))}

        {/* Section 2: Staffing vs Demand + Top 3 Complaints */}
        <TodaysRisks />

        {/* Section 3: Action Queue — hero alert merged with pending actions */}
        <PendingActionsInline topPriority={topPriority} />

        {/* Section 4: Priority Member Alerts (top 3) */}
        <MemberAlerts />

        {/* Section 5: Tomorrow's Forecast */}
        <TomorrowForecast />

      </div>
    </PageTransition>
  );
}
