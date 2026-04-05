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
import { getWeatherAlerts } from '@/services/weatherService';
import { isAuthenticatedClub } from '@/config/constants';
import { hasRealMemberData } from '@/services/memberService';
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
  // Don't show empty state if we have imported member data
  const hasNoData = isAuthenticatedClub() && !briefing?.teeSheet?.roundsToday && priorities.length === 0 && !hasRealMemberData();
  if (hasNoData) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6 w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 m-0">{getGreeting()}</h1>
            <p className="text-sm text-gray-500 mt-1 mb-0">{formatDate()}</p>
          </div>
          <DataEmptyState icon="📊" title="Welcome to your dashboard" description="Import your member roster, tee sheet, and POS data to see today's operational briefing. Start with members — each data source you connect unlocks more insights." dataType="club data" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 w-full">

        {/* Section 1: Morning Briefing Header */}
        <div className="rounded-xl border border-brand-100 bg-brand-25 px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-lg font-bold text-gray-800 dark:text-white/90 mb-1 font-serif">
            {getGreeting()}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatDate()}</span>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <span>{roundsToday} rounds booked today</span>
            {briefing?.todayRisks?.forecast && (
              <>
                <span className="text-gray-200 dark:text-gray-700">|</span>
                <span className="text-warning-500">{briefing.todayRisks.forecast}</span>
              </>
            )}
          </div>
        </div>

        {/* Weather Alerts Banner */}
        {weatherAlerts.filter(a => !dismissedAlerts.includes(a.headline)).map((alert, i) => (
          <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
            alert.severity === 'EXTREME' || alert.severity === 'SEVERE'
              ? 'border-error-500/40 bg-error-50 dark:bg-error-500/10'
              : 'border-warning-500/40 bg-warning-50 dark:bg-warning-500/10'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${
                alert.severity === 'EXTREME' || alert.severity === 'SEVERE'
                  ? 'text-error-500' : 'text-warning-500'
              }`}>
                {alert.headline || `${alert.type} Warning`}
              </span>
              {alert.description && (
                <span className="text-xs text-gray-500">
                  — {alert.description}
                </span>
              )}
            </div>
            <button
              onClick={() => setDismissedAlerts(prev => [...prev, alert.headline])}
              className="bg-transparent border-none cursor-pointer text-gray-400 text-sm px-1.5 py-0.5"
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
