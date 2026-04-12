// TodayView — operational cockpit
// 6 sections: Greeting, Staffing+Complaints, Member Alerts, Action Queue, Tomorrow Forecast
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPriorityItems, useCockpitData } from '@/services/cockpitService';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';
import TodaysRisks from './TodaysRisks';
import PendingActionsInline from './PendingActionsInline';
import MemberAlerts from './MemberAlerts';
import TomorrowForecast from './TomorrowForecast';
import WeekForecast from './WeekForecast';
import MorningBriefingSentence from './MorningBriefingSentence';
import DemoStoriesLauncher from './DemoStoriesLauncher';
import { getFirstName } from '../../utils/nameUtils';
import RecentActivityFeed from './RecentActivityFeed';
import SourceBadge from '@/components/ui/SourceBadge';
import { AnimatedNumber } from '@/components/ui/PageTransition';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { getWeatherAlerts } from '@/services/weatherService';
import { isAuthenticatedClub } from '@/config/constants';
import { getDataMode, isGateOpen, getLoadedGates } from '@/services/demoGate';
import { hasRealMemberData } from '@/services/memberService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import OnboardingChecklist from './OnboardingChecklist';
import { getTodayTeeSheet } from '@/services/operationsService';
import { getMemberSummary } from '@/services/memberService';
import { getDailyForecast, getHourlyForecast } from '@/services/weatherService';
import { trackAction } from '@/services/activityService';
import { getHealthRollup } from '@/services/apiHealthService';

// GM Greeting Alert — simulates real-time member check-in notifications
function buildCheckinAlerts() {
  const teeSheet = getTodayTeeSheet();
  if (!teeSheet.length) return [];
  return teeSheet
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
            t.cartPrep?.note?.includes('complaint') ? 'Acknowledge recent complaint — show you\'re aware and it\'s being fixed' : 'Ask about their recent experience — listen for friction points',
            `Playing ${t.course} course at ${t.time} — ${t.group.length > 1 ? `with ${t.group.filter(g => g !== t.name).join(', ')}` : 'solo today'}`,
            t.archetype === 'Declining' ? 'Invite to upcoming event to re-engage' : 'Mention a specific improvement the club has made recently',
          ]
        : [
            `VIP member ($${(t.duesAnnual / 1000).toFixed(0)}K dues) — personal greeting at the starter`,
            `Playing ${t.course} at ${t.time} with ${t.group.filter(g => g !== t.name).join(', ') || 'group'}`,
            'Thank them for their continued membership',
          ],
    }));
}

function GmGreetingAlert({ onDismiss }) {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    // Simulate check-ins arriving at staggered intervals
    const checkinAlerts = buildCheckinAlerts();
    const timers = checkinAlerts.map((alert, i) =>
      setTimeout(() => setAlerts(prev => [...prev, alert]), 3000 + i * 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const visible = alerts.filter(a => !dismissed.includes(a.memberId));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {visible.map(alert => {
        const scoreColor = alert.healthScore >= 70 ? '#12b76a' : alert.healthScore >= 50 ? '#f59e0b' : '#ef4444';
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
                  <span className="text-xs text-gray-400">&mdash;</span>
                </div>
                <div className="text-sm font-bold text-gray-800 mb-0.5">
                  {alert.name ? (
                    <MemberLink memberId={alert.memberId} mode="drawer" className="text-gray-800 hover:text-brand-500 no-underline">
                      {alert.name}
                    </MemberLink>
                  ) : (
                    <span>Member</span>
                  )}
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
                type="button"
                aria-label={`Dismiss check-in alert for ${alert.name}`}
                onClick={() => setDismissed(prev => [...prev, alert.memberId])}
                className="bg-transparent border-none cursor-pointer text-gray-300 hover:text-gray-500 text-lg p-1 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span aria-hidden="true">x</span>
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
  const firstName = stored ? getFirstName(JSON.parse(stored).name || '') : '';
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
  const { pendingAgentCount } = useApp();
  // Migrated to useServiceCache (SHIP_PLAN §2.3) — fall back to legacy getter
  const { data: cockpitData, isLoading: cockpitLoading } = useCockpitData();
  const priorities = cockpitData?.priorities ?? getPriorityItems();
  const topPriority = priorities[0];
  const briefing = getDailyBriefing();
  const roundsToday = briefing?.teeSheet?.roundsToday || 0;

  const [, setWeatherTick] = useState(0);
  useEffect(() => {
    const handler = () => setWeatherTick(t => t + 1);
    window.addEventListener('swoop:weather-updated', handler);
    return () => window.removeEventListener('swoop:weather-updated', handler);
  }, []);

  const weatherAlerts = getWeatherAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [core3Dismissed, setCore3Dismissed] = useState(() => !!localStorage.getItem('swoop_core3_celebrated'));

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Pillar 1 (SEE IT): tiny data trust pulse — polls /api/health rollup.
  // Null-safe: getHealthRollup never throws and returns overall:'unknown' on failure.
  const [healthRollup, setHealthRollup] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await getHealthRollup();
      if (!cancelled) setHealthRollup(r);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Guided mode with zero imports — show welcome card instead of empty dashes
  if (getDataMode() === 'guided' && getLoadedGates().length === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6 w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 m-0">{getGreeting()}</h1>
            <p className="text-sm text-gray-500 mt-1 mb-0">{formatDate()}</p>
          </div>
          <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-8 text-center">
            <div className="text-4xl mb-3">🏌️</div>
            <h2 className="text-lg font-bold text-gray-800 m-0 mb-2">Welcome to Swoop</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              Import your first data file to see your club come alive. Each file you connect unlocks new insights, alerts, and revenue intelligence.
            </p>
            <button
              type="button"
              onClick={() => navigate('admin', { tab: 'import' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-bold rounded-lg border-none cursor-pointer hover:bg-brand-600 transition-colors"
            >
              Open Import Panel →
            </button>
          </div>
          <DemoStoriesLauncher />
        </div>
      </PageTransition>
    );
  }

  // Fresh live club with zero members — show the onboarding checklist.
  // Once any member exists, live widgets take over even if the checklist
  // would still mark the members step as incomplete (<10 threshold).
  if (getDataMode() === 'live' && (getMemberSummary().total || 0) === 0) {
    return (
      <PageTransition>
        <OnboardingChecklist />
      </PageTransition>
    );
  }

  // Real authenticated club with no operational data — show welcome state
  if (isAuthenticatedClub() && !briefing?.teeSheet?.roundsToday && priorities.length === 0 && !hasRealMemberData()) {
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

  // Derive quick stats
  const memberSummary = getMemberSummary();
  const totalMembers = memberSummary.totalMembers || memberSummary.total || 0;
  const hourlyData = getHourlyForecast();
  const dailyData = getDailyForecast(1);

  // Course condition derived from weather
  const courseCondition = (() => {
    const today = dailyData?.[0];
    if (!today && !hourlyData?.length) return null;
    const wind = today?.wind || 0;
    const precip = typeof today?.precipProb === 'object' ? today?.precipProb?.percent : (today?.precipProb || 0);
    if (precip > 50 || wind > 25) return { label: 'Poor', color: '#ef4444', icon: '🌧️' };
    if (precip > 30 || wind > 15) return { label: 'Fair', color: '#f59e0b', icon: '⛅' };
    return { label: 'Good', color: '#12b76a', icon: '🌤️' };
  })();

  return (
    <PageTransition>
      <div className="flex flex-col w-full" style={{ gap: 12 }}>

        {/* Section 1: Compact Greeting Bar */}
        <div
          className="rounded-xl dark:border-gray-800 dark:bg-white/[0.03] today-greeting-enhanced fade-in-up"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div className="greeting-text" style={{ fontSize: 16, fontWeight: 600, color: 'white', letterSpacing: -0.2, margin: 0, whiteSpace: 'nowrap' }}>
              {getGreeting()}
            </div>
            <div className="greeting-date" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', fontWeight: 500 }}>
              {formatDate()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {(() => {
              const overall = healthRollup?.overall || 'unknown';
              const color = overall === 'ok' ? '#12b76a' : overall === 'degraded' ? '#f59e0b' : '#9ca3af';
              const ints = healthRollup?.integrations || [];
              const title = ints.length
                ? `Data pulse: ${ints.length} integration${ints.length === 1 ? '' : 's'} · ${ints.map(i => `${i.name.replace(/ sync$/i,'').replace(/Cross-club audit purge/,'Audit')} ${i.status}`).join(' · ')}`
                : 'Data pulse: health unknown (offline or fresh DB)';
              return (
                <button
                  type="button"
                  aria-label={title}
                  title={title}
                  onClick={() => navigate('admin', { tab: 'data-hub' })}
                  data-testid="today-data-pulse"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 9,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 0 2px rgba(255,255,255,0.08)`,
                    }}
                  />
                </button>
              );
            })()}
            <div
              className="greeting-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(232,167,50,0.12)',
                border: '1px solid rgba(232,167,50,0.2)',
                color: '#e8a732',
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 16,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                flexShrink: 0,
              }}
            >
              <span className="pulse-dot" /> {isAuthenticatedClub() ? 'Live Dashboard' : 'Demo Dashboard'}
            </div>
          </div>
        </div>

        {/* Core-3 celebration banner — shows once when members + tee-sheet + F&B are all imported */}
        {!core3Dismissed && isGateOpen('members') && isGateOpen('tee-sheet') && isGateOpen('fb') && (
          <div className="fade-in-up rounded-xl p-4" style={{ background: 'white', border: '2px solid transparent', borderImage: 'linear-gradient(135deg, #e8a732, #12b76a, #3B82F6) 1' }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-700 m-0">
                <strong>Full intelligence unlocked</strong> — 3 core systems connected. You now see cross-domain insights no single vendor can produce.
              </p>
              <button
                type="button"
                onClick={() => { localStorage.setItem('swoop_core3_celebrated', 'true'); setCore3Dismissed(true); }}
                className="text-xs text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer shrink-0"
              >Dismiss</button>
            </div>
          </div>
        )}

        {/* Section 1.4: What you can see now — hero insight summary for authenticated live clubs */}
        {isAuthenticatedClub() && memberSummary.total > 0 && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
            <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide mb-2 dark:text-brand-400">
              What you can see now
            </div>
            <div className="flex items-baseline gap-6 flex-wrap">
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90">{memberSummary.total.toLocaleString()}</div>
                <div className="text-xs text-gray-500">members imported</div>
              </div>
              {(memberSummary.atRisk + memberSummary.critical) > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {(memberSummary.atRisk + memberSummary.critical).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">need attention this week</div>
                </div>
              )}
              {memberSummary.watch > 0 && (
                <div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {memberSummary.watch.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">on the watch list</div>
                </div>
              )}
              {memberSummary.healthy > 0 && (
                <div>
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {memberSummary.healthy.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">healthy</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 1.5: Morning Briefing Synthesis (Pillar 1: SEE IT) */}
        <MorningBriefingSentence />

        {/* Section 1.6: Demo Story Flows — 3 storyboard moments, one click to start. */}
        <DemoStoriesLauncher />

        {/* Concierge quick-try card — shown in guided mode after member import */}
        {getDataMode() === 'guided' && isGateOpen('members') && (
          <div
            className="fade-in-up rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <div className="text-3xl flex-shrink-0">💬</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 mb-0.5">Try the Member Concierge</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                Text James Whitfield a message and watch AI respond with personalized context from his member profile.
              </div>
              <div className="text-[11px] text-indigo-500/70 italic mt-1">"Book my usual Saturday 7 AM" → "Done! Booth 12 at noon? Your Arnold Palmer will be waiting."</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('concierge')}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-lg border-none cursor-pointer hover:bg-indigo-600 transition-colors"
            >
              Open Concierge →
            </button>
          </div>
        )}

        {/* Split-screen demo link — shown after at least one import (not on empty state) */}
        {(getDataMode() === 'guided' || getDataMode() === 'demo') && isGateOpen('members') && (
          <div
            className="fade-in-up rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(232,167,50,0.08) 0%, rgba(232,167,50,0.04) 100%)',
              border: '1px solid rgba(232,167,50,0.2)',
            }}
          >
            <div className="text-3xl flex-shrink-0">🪟</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 mb-0.5">See Both Sides of the Glass</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                Watch the member experience and GM dashboard side by side — the killer demo that shows how Swoop connects every touchpoint.
              </div>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = '#/demo/split-screen'; }}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border-none cursor-pointer transition-colors"
              style={{ background: '#e8a732', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#d4982d'}
              onMouseLeave={e => e.currentTarget.style.background = '#e8a732'}
            >
              Launch Split Screen →
            </button>
          </div>
        )}

        {/* Section 2: Quick Stats Row */}
        <div className="fade-in-up fade-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: courseCondition?.icon || '🌤️', bg: '#ecfdf5', label: 'Course Condition', value: courseCondition?.label || '—', color: courseCondition?.color || '#9ca3af', source: 'Weather API' },
            roundsToday > 0 ? { icon: '👥', bg: '#eef2ff', label: 'Tee Times Today', value: String(roundsToday), color: '#6366f1', source: 'Tee Sheet' } : null,
            (() => {
              const teeSheet = getTodayTeeSheet();
              const atRiskOnSheet = teeSheet.filter(t => (t.healthScore ?? 100) < 50).length;
              if (teeSheet.length > 0 && atRiskOnSheet > 0) {
                return { icon: '🚨', bg: '#fef2f2', label: 'At-Risk on Sheet', value: String(atRiskOnSheet), color: '#ef4444', source: 'Tee Sheet + CRM' };
              }
              return { icon: '📊', bg: '#fffbeb', label: 'Active Members', value: totalMembers > 0 ? String(totalMembers) : '—', color: '#e8a732', source: 'Member CRM' };
            })(),
            { icon: '🔔', bg: '#f5f3ff', label: 'Pending Actions', value: cockpitLoading && !cockpitData ? '...' : String(pendingAgentCount || priorities.length), color: '#8b5cf6', source: 'Analytics' },
          ].filter(Boolean).map((stat) => (
            <div
              key={stat.label}
              className="today-stat-card"
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'default',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ width: 42, height: 42, background: stat.bg, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 2 }} title={stat.label === 'Pending Actions' ? 'Total actions awaiting your approval across all agents' : stat.label}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, letterSpacing: -0.3 }}>
                  {/^\d+$/.test(stat.value) ? <AnimatedNumber value={parseInt(stat.value, 10)} duration={800} /> : stat.value}
                </div>
                {stat.source && (
                  <div style={{ marginTop: 4 }}>
                    <SourceBadge system={stat.source} size="xs" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Section 2.5: Live Activity Feed */}
        <RecentActivityFeed />

        {/* F&B Quick Stats — renders when briefing has F&B data */}
        {briefing?.fb && (
          <div className="fade-in-up fade-delay-1 flex flex-col gap-2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { icon: '🍽️', label: 'Dining Covers Today', value: String(briefing.fb.covers), color: '#ea580c' },
                { icon: '💵', label: 'Avg Check Size', value: `$${briefing.fb.avgCheck}`, color: '#039855' },
                ...(roundsToday > 0 ? [{ icon: '⛳', label: 'Post-Round Dining', value: `${briefing.fb.postRoundRate}%`, color: '#2563eb' }] : []),
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{s.label}</div>
                    <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div style={{ marginTop: 2 }}>
                      <SourceBadge system="POS" size="xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-gray-500 px-2 leading-snug italic">
              Post-round dining is linked to pace of play —{' '}
              <span className="font-semibold text-error-600">slow rounds drop conversion to 22%</span>{' '}
              vs 41% for fast rounds.{' '}
              <button
                type="button"
                onClick={() => navigate('revenue')}
                className="text-brand-500 font-bold bg-transparent border-none cursor-pointer p-0 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                See Revenue →
              </button>
            </div>
          </div>
        )}

        {/* Email Engagement Stats — renders when briefing has email data */}
        {briefing?.email && (
          <div className="fade-in-up fade-delay-1 flex flex-col gap-2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { icon: '📧', label: 'Email Open Rate', value: `${briefing.email.openRate}%`, color: '#7c3aed' },
                { icon: '🖱️', label: 'Click-Through Rate', value: `${briefing.email.clickRate}%`, color: '#0891b2' },
                { icon: '📉', label: 'Engagement Decay', value: `${briefing.email.decayCount} members`, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{s.label}</div>
                    <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div style={{ marginTop: 2 }}>
                      <SourceBadge system="Email" size="xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-gray-500 px-2 leading-snug italic">
              Email decay is the <span className="font-bold text-error-600">first domino</span>{' '}
              in member disengagement.{' '}
              <button
                type="button"
                onClick={() => navigate('members', { mode: 'email-decay' })}
                className="text-brand-500 font-bold bg-transparent border-none cursor-pointer p-0 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                View decay watch list →
              </button>
            </div>
          </div>
        )}

        {/* Weather Alerts Banner */}
        {weatherAlerts.filter(a => !dismissedAlerts.includes(a.headline)).map((alert, i) => {
          const isSevere = alert.severity === 'EXTREME' || alert.severity === 'SEVERE';
          const handleNotify = () => {
            const teeSheet = getTodayTeeSheet();
            const affected = teeSheet.length;
            trackAction({
              actionType: 'approve',
              actionSubtype: 'weather_notify',
              referenceType: 'weather_alert',
              referenceId: alert.headline || `alert_${i}`,
              description: `Notify ${affected} affected tee times of ${alert.headline || alert.type}`,
            });
            setDismissedAlerts(prev => [...prev, alert.headline]);
          };
          return (
          <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 border flex-wrap gap-2 ${
            isSevere
              ? 'border-error-500/40 bg-error-50 dark:bg-error-500/10'
              : 'border-warning-500/40 bg-warning-50 dark:bg-warning-500/10'
          }`}>
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge system="Weather API" size="xs" />
              <span className={`text-sm font-semibold ${
                isSevere ? 'text-error-500' : 'text-warning-500'
              }`}>
                {alert.headline || `${alert.type} Warning`}
              </span>
              {alert.description && (
                <span className="text-xs text-gray-500">
                  — {alert.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isSevere && getTodayTeeSheet().length > 0 && (
                <button
                  onClick={handleNotify}
                  className="bg-error-500 text-white border-none cursor-pointer text-xs font-bold px-3 py-1 rounded-md hover:bg-error-600 focus-visible:ring-2 focus-visible:ring-brand-500"
                  title="Send weather alert to affected tee times"
                >
                  Notify affected tee times →
                </button>
              )}
              <button
                onClick={() => setDismissedAlerts(prev => [...prev, alert.headline])}
                aria-label={`Dismiss weather alert: ${alert.headline || alert.type}`}
                className="bg-transparent border-none cursor-pointer text-gray-400 text-sm px-1.5 py-0.5 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Dismiss
              </button>
            </div>
          </div>
          );
        })}

        {/* GM Greeting Alerts — real-time check-in notifications */}
        <GmGreetingAlert />

        {/* Section 3: Priority Member Alerts */}
        <MemberAlerts />

        {/* Section 4: Staffing vs Demand + Open Complaints (moved up for visibility) */}
        <TodaysRisks />

        {/* Section 5: Action Queue */}
        <PendingActionsInline topPriority={topPriority} />

        {/* Section 6: Weather — Hourly + 5-Day Forecast */}
        <div className="flex flex-col gap-3 fade-in-up fade-delay-2">
          <WeekForecast />
        </div>

        {/* Section 7: Tomorrow's Forecast */}
        <TomorrowForecast />

      </div>
    </PageTransition>
  );
}
