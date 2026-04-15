// TodayView — operational cockpit
// 6 sections: Greeting, Staffing+Complaints, Member Alerts, Action Queue, Tomorrow Forecast
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPriorityItems, useCockpitData } from '@/services/cockpitService';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';
import PendingActionsInline from './PendingActionsInline';
import MemberAlerts from './MemberAlerts';
import WeekForecast from './WeekForecast';
import MorningBriefingSentence from './MorningBriefingSentence';
import DemoStoriesLauncher from './DemoStoriesLauncher';
import { getFirstName } from '../../utils/nameUtils';
import OvernightBrief from './OvernightBrief';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { isAuthenticatedClub } from '@/config/constants';
import { getDataMode, isGateOpen } from '@/services/demoGate';
import { hasRealMemberData, getMemberSummary } from '@/services/memberService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import OnboardingChecklist from './OnboardingChecklist';
import { getTodayTeeSheet } from '@/services/operationsService';
import { getHealthRollup } from '@/services/apiHealthService';

// ─── Dark theme tokens ────────────────────────────────────────────────────────
const D = {
  bg:        'rgb(14,14,14)',
  surface:   'rgba(255,255,255,0.03)',
  border:    'rgba(255,255,255,0.08)',
  borderSub: 'rgba(255,255,255,0.05)',
  text:      '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim:   'rgba(255,255,255,0.35)',
  accent:    'rgb(243,146,45)',
  accentBg:  'rgba(243,146,45,0.12)',
  accentBdr: 'rgba(243,146,45,0.3)',
  red:       'rgb(239,68,68)',
  redBg:     'rgba(239,68,68,0.08)',
  redBdr:    'rgba(239,68,68,0.18)',
  green:     'rgb(34,197,94)',
};

// Collapsible section — dark chrome with title + count + peek + chevron
function CollapsibleSection({ title, count, peek, accentColor, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = accentColor || D.accent;
  return (
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{title}</span>
          {count != null && (
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.1)', color: D.text, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
              {count}
            </span>
          )}
          {peek && (
            <span style={{ fontSize: 11, color: D.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peek}</span>
          )}
        </div>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: D.textMuted, flexShrink: 0, marginLeft: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${D.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Dark action button
function DarkBtn({ children, onClick, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 6, whiteSpace: 'nowrap',
        padding: '5px 12px', transition: 'opacity 0.15s',
        color: isPrimary ? D.accent : D.textMuted,
        background: isPrimary ? D.accentBg : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isPrimary ? D.accentBdr : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      {children}
    </button>
  );
}

// Dark detail row
function DRow({ icon, title, sub, action, onAction, accentColor, children }) {
  const bg = accentColor ? accentColor.replace('rgb', 'rgba').replace(')', ',0.07)') : D.surface;
  const bdr = accentColor ? accentColor.replace('rgb', 'rgba').replace(')', ',0.18)') : D.borderSub;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: bg, border: `1px solid ${bdr}` }}>
      {icon && <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 12, color: D.text, fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        {sub && <div style={{ fontSize: 11, color: D.textMuted }}>{sub}</div>}
        {children}
      </div>
      {action && <DarkBtn onClick={onAction}>{action}</DarkBtn>}
    </div>
  );
}

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
  const firstName = stored ? (() => { try { return getFirstName(JSON.parse(stored).name || ''); } catch { return ''; } })() : '';
  const nameStr = firstName ? `, ${firstName}` : '';
  if (hour < 12) return `Good morning${nameStr} — here's what needs your attention today`;
  if (hour < 17) return `Afternoon check-in${nameStr} — here's where things stand`;
  return `Good evening${nameStr} — end-of-day summary`;
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

  // Fresh live club with zero members — show the onboarding checklist.
  // Once any member exists, live widgets take over even if the checklist
  // would still mark the members step as incomplete (<10 threshold).
  if (getDataMode() === 'live' && (getMemberSummary().total || 0) === 0) {
    return (
      <PageTransition>
        <OnboardingChecklist />
        <WeekForecast />
      </PageTransition>
    );
  }

  // Real authenticated club with no operational data — show value-preview welcome state
  if (isAuthenticatedClub() && !briefing?.teeSheet?.roundsToday && priorities.length === 0 && !hasRealMemberData()) {
    const hasMembersGate = isGateOpen('members');
    const hasTeeSheet = isGateOpen('tee-sheet');
    const hasPOS = isGateOpen('fb');
    const steps = [
      { id: 'members', label: 'Member Roster', done: hasMembersGate, preview: "Who's going quiet and why — health scores, dues at risk, at-risk alerts" },
      { id: 'tee-sheet', label: 'Tee Sheet', done: hasTeeSheet, preview: "Today's bookings with health scores — know which at-risk members are on the course right now" },
      { id: 'fb', label: 'POS / F&B', done: hasPOS, preview: 'F&B leakage from slow rounds and understaffing — quantified to the dollar' },
    ];
    const connectedCount = steps.filter(s => s.done).length;
    return (
      <PageTransition>
        <div className="flex flex-col gap-5 w-full">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 m-0">{getGreeting()}</h1>
            <p className="text-sm text-gray-500 mt-1 mb-0">{formatDate()}</p>
          </div>

          {/* Value preview — what this dashboard becomes once connected */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-500 dark:text-brand-400 mb-1">
                Here's what you'll see when connected
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 m-0">
                Connect your three core systems to unlock your full operational briefing. Each source adds a layer of intelligence you can't get from any single vendor.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
              {steps.map(step => (
                <div key={step.id} className="px-5 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step.done ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                      {step.done ? '✓' : '○'}
                    </div>
                    <span className={`text-xs font-bold ${step.done ? 'text-success-700 dark:text-success-400' : 'text-gray-500 dark:text-gray-400'}`}>{step.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500 m-0 leading-relaxed">{step.preview}</p>
                </div>
              ))}
            </div>
            {connectedCount > 0 && (
              <div className="px-5 py-2.5 bg-success-50 dark:bg-success-500/5 border-t border-success-100 dark:border-success-500/20">
                <span className="text-xs text-success-700 dark:text-success-400 font-semibold">{connectedCount} of 3 source{connectedCount !== 1 ? 's' : ''} connected</span>
                <span className="text-xs text-gray-500 dark:text-gray-400"> — keep going to unlock the full briefing</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('admin', { tab: 'data-hub' })}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors"
            >
              {hasMembersGate ? 'Add More Data Sources →' : 'Start with Member Roster →'}
            </button>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="px-5 py-2.5 rounded-lg border border-gray-200 bg-transparent text-gray-600 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              View Integrations
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }


  return (
    <PageTransition>
      <div className="flex flex-col w-full" style={{ gap: 12, background: D.bg, borderRadius: 16, padding: 16 }}>

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

        {/* Morning Briefing — cross-domain synthesis: rounds + weather + at-risk on sheet + staffing */}
        <MorningBriefingSentence />

        {/* Overnight Brief — what agents surfaced while the GM was away */}
        <CollapsibleSection title="Overnight Brief" accentColor={D.accent} defaultOpen={true} peek="what surfaced while you were away">
          <OvernightBrief />
        </CollapsibleSection>

        {/* Section 1.6: Demo Story Flows — 3 storyboard moments, demo mode only */}
        {getDataMode() === 'demo' && <DemoStoriesLauncher />}

        {/* Split-screen demo link */}
        {getDataMode() === 'demo' && (
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

        {/* At-Risk Members on Today's Sheet — persistent named list with talking points */}
        {(() => {
          const atRiskOnSheet = buildCheckinAlerts().filter(a => a.isAtRisk);
          if (!atRiskOnSheet.length) return null;
          const peek = atRiskOnSheet.map(m => m.name.split(' ')[0]).join(', ');
          return (
            <CollapsibleSection
              title="At-Risk on Today's Sheet"
              count={atRiskOnSheet.length}
              peek={peek}
              accentColor={D.red}
              defaultOpen={true}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {atRiskOnSheet.map(m => {
                  const sc = m.healthScore < 30 ? D.red : m.healthScore < 50 ? '#f59e0b' : D.textMuted;
                  return (
                    <div key={m.memberId} style={{ padding: '10px 16px', borderBottom: `1px solid ${D.borderSub}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <MemberLink memberId={m.memberId} mode="drawer" style={{ fontWeight: 600, fontSize: 13, color: D.text }}>
                            {m.name}
                          </MemberLink>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, color: sc, background: sc + '20' }}>
                            {m.healthScore}
                          </span>
                          <span style={{ fontSize: 10, color: D.textDim }}>{m.archetype}</span>
                        </div>
                        <span style={{ fontSize: 11, color: D.textMuted, flexShrink: 0 }}>{m.time} · {m.course}</span>
                      </div>
                      <div style={{ fontSize: 11, color: D.textMuted, lineHeight: 1.5 }}>
                        💬 {m.talkingPoints[0]}
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: '8px 16px' }}>
                  <button type="button" onClick={() => navigate('members')} style={{ fontSize: 11, color: D.accent, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    View all members →
                  </button>
                </div>
              </div>
            </CollapsibleSection>
          );
        })()}

        {/* Section 3: Priority Member Alerts */}
        <CollapsibleSection title="Member Alerts" accentColor={D.red} defaultOpen={true} peek="health score changes, renewals, flags">
          <MemberAlerts />
        </CollapsibleSection>

        {/* Section 5: Action Queue */}
        <CollapsibleSection title="Action Queue" accentColor="#8b5cf6" defaultOpen={true} peek="pending approvals and agent recommendations">
          <PendingActionsInline topPriority={topPriority} />
        </CollapsibleSection>


      </div>
    </PageTransition>
  );
}
