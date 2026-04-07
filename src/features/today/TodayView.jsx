// TodayView — operational cockpit
// 6 sections: Greeting, Staffing+Complaints, Member Alerts, Action Queue, Tomorrow Forecast
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPriorityItems } from '@/services/cockpitService';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';
import TodaysRisks from './TodaysRisks';
import PendingActionsInline from './PendingActionsInline';
import MemberAlerts from './MemberAlerts';
import TomorrowForecast from './TomorrowForecast';
import WeekForecast from './WeekForecast';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { getWeatherAlerts } from '@/services/weatherService';
import { isAuthenticatedClub } from '@/config/constants';
import { hasRealMemberData } from '@/services/memberService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { todayTeeSheet } from '@/data/teeSheet';

// GM Greeting Alert — simulates real-time member check-in notifications
const CHECKIN_ALERTS = todayTeeSheet
  .filter(t => t.healthScore < 50 || t.duesAnnual >= 20000)
  .slice(0, 3)
  .map(t => ({
    memberId: t.memberId,
    name: t.name,
    healthScore: t.healthScore,
    archetype: t.archetype,
    duesAnnual: t.duesAnnual,
    time: t.time,
    course: t.course,
    isAtRisk: t.healthScore < 50,
    isVip: t.duesAnnual >= 20000,
    talkingPoints: t.healthScore < 50
      ? [
          t.cartPrep.note?.includes('complaint') ? 'Acknowledge recent complaint — show you\'re aware and it\'s being fixed' : 'Ask about their recent experience — listen for friction points',
          `Playing ${t.course} course at ${t.time} — ${t.group.length > 1 ? `with ${t.group.filter(g => g !== t.name).join(', ')}` : 'solo today'}`,
          t.archetype === 'Declining' ? 'Invite to upcoming event to re-engage' : 'Mention a specific improvement the club has made recently',
        ]
      : [
          `VIP member ($${(t.duesAnnual / 1000).toFixed(0)}K dues) — personal greeting at the starter`,
          `Playing ${t.course} at ${t.time} with ${t.group.filter(g => g !== t.name).join(', ') || 'group'}`,
          'Thank them for their continued membership',
        ],
  }));

function GmGreetingAlert({ onDismiss }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    // Simulate check-ins arriving at staggered intervals
    const timers = CHECKIN_ALERTS.map((alert, i) =>
      setTimeout(() => setAlerts(prev => [...prev, alert]), 3000 + i * 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const visible = alerts.filter(a => !dismissed.includes(a.memberId));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {visible.map(alert => {
        const scoreColor = alert.healthScore >= 70 ? '#22c55e' : alert.healthScore >= 50 ? '#f59e0b' : '#ef4444';
        return (
          <div
            key={alert.memberId}
            className="rounded-xl border-l-4 border border-gray-200 bg-white p-4 shadow-sm animate-[slideDown_0.4s_ease-out]"
            style={{ borderLeftColor: alert.isAtRisk ? '#ef4444' : '#f59e0b' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full" style={{ background: alert.isAtRisk ? '#ef4444' : '#f59e0b' }}>
                    {alert.isAtRisk ? 'AT-RISK CHECK-IN' : 'VIP CHECK-IN'}
                  </span>
                  <span className="text-xs text-gray-400">Just now</span>
                </div>
                <div className="text-sm font-bold text-gray-800 mb-0.5">
                  <MemberLink memberId={alert.memberId} mode="drawer" className="text-gray-800 hover:text-brand-500 no-underline">
                    {alert.name}
                  </MemberLink>
                  {' '}just checked in
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>Health: <strong className="font-mono" style={{ color: scoreColor }}>{alert.healthScore}</strong></span>
                  <span>{alert.archetype}</span>
                  <span>{alert.time} {alert.course}</span>
                  <span>${(alert.duesAnnual / 1000).toFixed(0)}K/yr</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Talking Points</div>
                  <ul className="m-0 pl-4 space-y-1">
                    {alert.talkingPoints.map((point, i) => (
                      <li key={i} className="text-xs text-gray-700 leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setDismissed(prev => [...prev, alert.memberId])}
                className="bg-transparent border-none cursor-pointer text-gray-300 hover:text-gray-500 text-lg p-1"
              >
                x
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  const stored = localStorage.getItem('swoop_auth_user');
  const firstName = stored ? (JSON.parse(stored).name || '').split(' ')[0] : '';
  const nameStr = firstName ? `, ${firstName}` : '';
  if (hour < 12) return `Good morning${nameStr} — here's what needs your attention today`;
  return `Afternoon check-in${nameStr} — here's where things stand`;
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
          <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
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

        {/* GM Greeting Alerts — real-time check-in notifications */}
        <GmGreetingAlert />

        {/* Section 2: Action Queue — hero alert merged with pending actions */}
        <PendingActionsInline topPriority={topPriority} />

        {/* Section 3: Priority Member Alerts (top 3) */}
        <MemberAlerts />

        {/* Section 4: Tomorrow's Forecast */}
        <TomorrowForecast />

        {/* Section 5: 10-Day Forecast */}
        <WeekForecast />

        {/* Section 6: Staffing vs Demand + Open Complaints (lower priority — data still maturing) */}
        <TodaysRisks />

      </div>
    </PageTransition>
  );
}
