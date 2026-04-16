// TodayView — operational cockpit. Layout tracks swoop-member-portal/today.html
// using .swoop-section / .swoop-detail-row class hooks from swoop-dark.css.
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { getPriorityItems, useCockpitData } from '@/services/cockpitService';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';
import SwoopSection from '@/components/ui/SwoopSection';
import PendingActionsInline from './PendingActionsInline';
import MemberAlerts from './MemberAlerts';
import WeekForecast from './WeekForecast';
import { getFirstName } from '../../utils/nameUtils';
import OvernightBrief from './OvernightBrief';
import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import { isAuthenticatedClub } from '@/config/constants';
import { getDataMode, isGateOpen } from '@/services/demoGate';
import { getConnectedSystems } from '@/services/integrationsService';
import { hasRealMemberData, getMemberSummary, getAtRiskMembers, getWatchMembers } from '@/services/memberService';
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

// Section color accents used throughout today.html
const C = {
  neutral: 'rgba(255,255,255,0.55)',
  accent:  'rgb(243,146,45)',
  danger:  'rgb(239,68,68)',
  success: 'rgb(34,197,94)',
};
const MONO = "'JetBrains Mono', monospace";

function MicroLabel({ children, color = 'rgba(255,255,255,0.4)' }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: 4 }}>
      {children}
    </div>
  );
}

// Club Status KPI tile — matches today.html lines 135–183
function ClubKpiTile({ label, labelColor, icon, value, valueSize = 32, valueColor, source, footerLines, accentBg, accentBorder, onClick }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
      background: accentBg || 'rgba(255,255,255,0.04)',
      border: `1px solid ${accentBorder || 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14,
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      cursor: onClick ? 'pointer' : undefined,
    }}>
      <MicroLabel color={labelColor}>{label}</MicroLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: valueSize, fontWeight: 800, color: valueColor || '#fff', fontFamily: MONO, lineHeight: 1 }}>
          {value}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{source}</div>
      {footerLines && footerLines.length > 0 && (
        <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px solid ${accentBorder || 'rgba(255,255,255,0.06)'}` }}>
          {footerLines.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: line.color || 'rgba(255,255,255,0.5)', fontWeight: line.bold ? 600 : 400 }}>
              {line.text}
            </div>
          ))}
        </div>
      )}
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
            t.cartPrep?.note?.includes('complaint') ? 'Acknowledge recent complaint: show you\'re aware and it\'s being fixed' : 'Ask about their recent experience: listen for friction points',
            `Playing ${t.course} course at ${t.time}${t.group.length > 1 ? `, with ${t.group.filter(g => g !== t.name).join(', ')}` : ', solo today'}`,
            t.archetype === 'Declining' ? 'Invite to upcoming event to re-engage' : 'Mention a specific improvement the club has made recently',
          ]
        : [
            `VIP member ($${(t.duesAnnual / 1000).toFixed(0)}K dues): personal greeting at the starter`,
            `Playing ${t.course} at ${t.time} with ${t.group.filter(g => g !== t.name).join(', ') || 'group'}`,
            'Thank them for their continued membership',
          ],
    }));
}

// eslint-disable-next-line no-unused-vars
function _UnusedGmGreetingAlert({ onDismiss }) {
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
            className="rounded-xl border-l-4 border border-swoop-border bg-swoop-panel p-4 shadow-sm animate-[slideDown_0.4s_ease-out]"
            style={{ borderLeftColor: alert.isAtRisk ? '#ef4444' : '#f59e0b' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full" style={{ background: alert.isAtRisk ? '#ef4444' : '#f59e0b' }}>
                    {alert.isAtRisk ? 'AT-RISK CHECK-IN' : 'VIP CHECK-IN'}
                  </span>
                  <span className="text-xs text-swoop-text-label">&mdash;</span>
                </div>
                <div className="text-sm font-bold text-swoop-text mb-0.5">
                  {alert.name ? (
                    <MemberLink memberId={alert.memberId} mode="drawer" className="text-swoop-text hover:text-brand-500 no-underline">
                      {alert.name}
                    </MemberLink>
                  ) : (
                    <span>Member</span>
                  )}
                  {' '}just checked in
                </div>
                <div className="flex items-center gap-3 text-xs text-swoop-text-muted mb-2">
                  <span>Health: <strong className="font-mono" style={{ color: scoreColor }}>{alert.healthScore}</strong></span>
                  <span>{alert.archetype}</span>
                  <span>{alert.time} {alert.course}</span>
                  <span>${(alert.duesAnnual / 1000).toFixed(0)}K/yr</span>
                </div>
                <div className="bg-swoop-row rounded-lg p-3 border border-swoop-border-inset">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-swoop-text-label mb-1.5">Talking Points</div>
                  <ul className="m-0 pl-4 space-y-1">
                    {alert.talkingPoints.map((point, i) => (
                      <li key={i} className="text-xs text-swoop-text-2 leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Dismiss check-in alert for ${alert.name}`}
                onClick={() => setDismissed(prev => [...prev, alert.memberId])}
                className="bg-transparent border-none cursor-pointer text-swoop-text-ghost hover:text-gray-500 text-lg p-1 focus-visible:ring-2 focus-visible:ring-brand-500"
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

function getGreeting(atRiskCount = 0, watchCount = 0, roundsToday = 0) {
  const hour = new Date().getHours();
  const stored = localStorage.getItem('swoop_auth_user');
  const firstName = stored ? (() => { try { return getFirstName(JSON.parse(stored).name || ''); } catch { return ''; } })() : '';
  const nameStr = firstName ? `, ${firstName}` : '';
  const riskTotal = atRiskCount + watchCount;

  // Data-driven greeting: lead with the executive outcome when data is available
  if (riskTotal > 0 && roundsToday > 0) {
    return `${roundsToday} rounds on the sheet${nameStr}. ${riskTotal} member${riskTotal !== 1 ? 's' : ''} need attention.`;
  }
  if (riskTotal > 0) {
    return `${riskTotal} member${riskTotal !== 1 ? 's' : ''} flagged for intervention today${nameStr}.`;
  }
  if (roundsToday > 0) {
    return `${roundsToday} rounds on the tee sheet${nameStr}. All members in good standing.`;
  }

  if (hour < 12) return `Good morning${nameStr}. Here's your club health at a glance.`;
  if (hour < 17) return `Afternoon check-in${nameStr}. Here's where things stand.`;
  return `Good evening${nameStr}. End-of-day summary.`;
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
  // Data-source gates — used to suppress phantom KPIs when a source isn't connected.
  // Fixes the 1_today P1 where tee-sheet / staffing numbers appeared out of thin air.
  const teeSheetConnected = isGateOpen('tee-sheet') || roundsToday > 0;

  // Priority member counts — derived live so empty states can't collide with headers
  const atRiskCount = getAtRiskMembers().length;
  const watchCount = getWatchMembers().length;
  const priorityMemberCount = Math.min(atRiskCount + watchCount, 5);
  const hasActivityData = isGateOpen('tee-sheet') || isGateOpen('fb') || isGateOpen('email');


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
    // Weather forecast is only actionable once a tee sheet or scheduling system is
    // connected — hide it during zero-data onboarding to reduce visual noise.
    const hasTeeSheetOrSched = getConnectedSystems().some(
      s => (s.category === 'tee-sheet' || s.category === 'scheduling') && s.status === 'connected',
    );
    return (
      <PageTransition>
        <OnboardingChecklist />
        {hasTeeSheetOrSched && <WeekForecast />}
      </PageTransition>
    );
  }

  // Real authenticated club with no operational data — show value-preview welcome state
  if (isAuthenticatedClub() && !briefing?.teeSheet?.roundsToday && priorities.length === 0 && !hasRealMemberData()) {
    const hasMembersGate = isGateOpen('members');
    const hasTeeSheet = isGateOpen('tee-sheet');
    const hasPOS = isGateOpen('fb');
    const steps = [
      { id: 'members', label: 'Member Roster', done: hasMembersGate, preview: "Who's going quiet and why: health scores, dues at risk, at-risk alerts" },
      { id: 'tee-sheet', label: 'Tee Sheet', done: hasTeeSheet, preview: "Today's bookings with health scores. Know which at-risk members are on the course right now." },
      { id: 'fb', label: 'POS / F&B', done: hasPOS, preview: 'F&B leakage from slow rounds and understaffing, quantified to the dollar' },
    ];
    const connectedCount = steps.filter(s => s.done).length;
    return (
      <PageTransition>
        <div className="flex flex-col gap-5 w-full">
          <div>
            <h1 className="text-2xl font-bold text-swoop-text m-0">{getGreeting()}</h1>
            <p className="text-sm text-swoop-text-muted mt-1 mb-0">{formatDate()}</p>
          </div>

          {/* Value preview — what this dashboard becomes once connected */}
          <div className="rounded-2xl border border-swoop-border bg-swoop-panel overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-500 mb-1">
                Here's what you'll see when connected
              </div>
              <p className="text-sm text-swoop-text-muted m-0">
                Connect your three core systems to activate your full operational briefing. Each source adds a layer of intelligence you can't get from any single vendor.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-swoop-border-inset">
              {steps.map(step => (
                <div key={step.id} className="px-5 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${step.done ? 'bg-success-100 text-success-700' : 'bg-swoop-row text-swoop-text-label'}`}>
                      {step.done ? '✓' : '○'}
                    </div>
                    <span className={`text-xs font-bold ${step.done ? 'text-success-700' : 'text-swoop-text-muted'}`}>{step.label}</span>
                  </div>
                  <p className="text-[11px] text-swoop-text-muted m-0 leading-relaxed">{step.preview}</p>
                </div>
              ))}
            </div>
            {connectedCount > 0 && (
              <div className="px-5 py-2.5 bg-success-50 border-t border-success-100">
                <span className="text-xs text-success-700 font-semibold">{connectedCount} of 3 source{connectedCount !== 1 ? 's' : ''} connected</span>
                <span className="text-xs text-swoop-text-muted">: connect your remaining sources to activate the full briefing</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => { try { localStorage.setItem('swoop_club_id', 'demo'); } catch {} window.location.reload(); }}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors"
            >
              Explore with Sample Data →
            </button>
            <button
              type="button"
              onClick={() => navigate('admin', { tab: 'data-hub' })}
              className="px-5 py-2.5 rounded-lg border border-swoop-border bg-transparent text-swoop-text-muted text-sm font-semibold cursor-pointer hover:bg-swoop-row-hover transition-colors"
            >
              {hasMembersGate ? 'Add More Data Sources' : 'Connect My Data'}
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
          className="rounded-xl today-greeting-enhanced fade-in-up"
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
              {getGreeting(atRiskCount, watchCount, roundsToday)}
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

        {/* Club Status — 4 KPI tiles (pinned top, expanded) */}
        <SwoopSection
          title="Club Status"
          titleColor={C.neutral}
          defaultOpen={true}
          peek={
            teeSheetConnected
              ? `Good conditions · ${roundsToday || 220} rounds · ${pendingAgentCount ?? 0} pending actions`
              : `Connect tee sheet to see today's rounds and at-risk alerts · ${pendingAgentCount ?? 0} pending actions`
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <ClubKpiTile
              label="Course Condition"
              icon="🌤️"
              value="Good"
              valueSize={24}
              valueColor={C.success}
              source="☁ Weather API · 85°F, clear"
              footerLines={[
                { text: 'Wind: 10–14 mph · Humidity 42%' },
                { text: 'No rain in forecast · Cart paths dry' },
              ]}
            />
            {teeSheetConnected ? (
              <ClubKpiTile
                label="Tee Times Today"
                icon="👥"
                value={roundsToday || 220}
                valueColor={C.accent}
                source="⛳ Tee Sheet"
                footerLines={[
                  { text: 'First tee: 6:30 AM · Last: 4:15 PM' },
                  { text: '92% utilisation · 18 walk-ins expected' },
                ]}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('integrations')}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <MicroLabel>Tee Times Today</MicroLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>⛳</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: C.neutral, fontFamily: MONO, lineHeight: 1 }}>—</span>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Tee Sheet not connected</div>
                <div style={{ marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Jonas · ForeTees · Golf Genius · GolfNow</div>
                  <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: C.accent, borderRadius: 6, padding: '4px 10px' }}>
                    Connect Tee Sheet →
                  </div>
                </div>
              </div>
            )}
            {teeSheetConnected ? (
              <ClubKpiTile
                label="At-Risk on Sheet"
                labelColor="rgba(239,68,68,0.7)"
                icon="🚨"
                value="6"
                valueColor={C.danger}
                source="◈ Tee Sheet + CRM"
                accentBg="rgba(239,68,68,0.07)"
                accentBorder="rgba(239,68,68,0.18)"
                footerLines={[
                  { text: '$95K combined dues · 3 critical' },
                  { text: 'View tee sheet for greet window →', color: C.danger, bold: true },
                ]}
              />
            ) : (
              <ClubKpiTile
                label="At-Risk on Sheet"
                labelColor="rgba(255,255,255,0.4)"
                icon="⛳"
                value="—"
                valueSize={24}
                valueColor={C.neutral}
                source="Awaiting tee sheet connection"
                footerLines={[
                  { text: 'We\u2019ll cross-reference who\u2019s teeing off' },
                  { text: 'today once your tee sheet is connected', color: C.accent, bold: true },
                ]}
                onClick={() => navigate('integrations')}
              />
            )}
            {(() => {
              const inboxCount = pendingAgentCount ?? 0;
              const memberAlerts = atRiskCount + watchCount;
              const totalPending = inboxCount + memberAlerts;
              return (
                <ClubKpiTile
                  label="Pending Actions"
                  labelColor="rgba(243,146,45,0.7)"
                  icon="🔔"
                  value={totalPending}
                  valueColor={totalPending > 0 ? C.accent : C.neutral}
                  source="◉ Actions Inbox + Member Alerts"
                  accentBg={totalPending > 0 ? 'rgba(243,146,45,0.07)' : undefined}
                  accentBorder={totalPending > 0 ? 'rgba(243,146,45,0.18)' : undefined}
                  onClick={totalPending > 0 ? () => navigate('automations') : undefined}
                  footerLines={
                    totalPending > 0
                      ? [
                          { text: `${inboxCount} inbox · ${memberAlerts} member alert${memberAlerts !== 1 ? 's' : ''}` },
                          { text: 'Review now →', color: C.accent, bold: true },
                        ]
                      : [
                          { text: 'All clear: no open actions' },
                        ]
                  }
                />
              );
            })()}
          </div>
        </SwoopSection>

        {/* Overnight Brief — gated: only meaningful when activity data exists */}
        {hasActivityData ? (
          <SwoopSection title="Overnight Brief" titleColor={C.neutral} peek="what surfaced while you were away" defaultOpen={true}>
            <OvernightBrief />
          </SwoopSection>
        ) : (
          <SwoopSection title="Overnight Brief" titleColor={C.neutral} peek="Connect POS or Tee Sheet to activate" defaultOpen={true}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(() => {
                const memberCount = getMemberSummary().total;
                if (memberCount > 0) {
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10 }}>
                      <span style={{ fontSize: 14 }}>✅</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                        <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{memberCount} members in roster.</strong>{' '}
                        Connect POS and tee sheet to establish engagement baselines and surface at-risk alerts.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                  What appears here once connected
                </div>
                {[
                  { icon: '🚨', label: 'At-risk members who visited yesterday with declining spend', color: C.danger },
                  { icon: '📉', label: 'Engagement drops detected overnight across dining + golf', color: C.accent },
                  { icon: '💬', label: 'Service complaints flagged in the last 24 hours', color: C.neutral },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(243,146,45,0.07)', border: '1px solid rgba(243,146,45,0.18)', borderRadius: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🔒 Connect your POS or Tee Sheet to surface overnight signals</span>
              </div>
            </div>
          </SwoopSection>
        )}

        {/* Live Check-ins (pinned 3rd, collapsed by default) */}
        {(() => {
          const checkins = buildCheckinAlerts();
          if (!checkins.length) return null;
          const peek = checkins.map(c => `${c.name.split(' ')[0]} (${c.isAtRisk ? 'at-risk' : 'VIP'})`).join(' · ');
          return (
            <SwoopSection
              title="Live Check-ins"
              titleColor={C.neutral}
              count={`${checkins.length} active`}
              peek={peek}
              defaultOpen={false}
            >
              {checkins.map(m => {
                const isRisk = m.isAtRisk;
                const color = isRisk ? C.danger : C.accent;
                const bg = isRisk ? 'rgba(239,68,68,0.07)' : 'rgba(243,146,45,0.07)';
                const bdr = isRisk ? 'rgba(239,68,68,0.18)' : 'rgba(243,146,45,0.18)';
                return (
                  <div key={m.memberId} className="swoop-detail-row" style={{ background: bg, borderColor: bdr, flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, background: `${color.replace('rgb', 'rgba').replace(')', ',0.15)')}`, border: `1px solid ${color.replace('rgb', 'rgba').replace(')', ',0.3)')}`, padding: '2px 7px', borderRadius: 999, flexShrink: 0 }}>
                        {isRisk ? 'AT-RISK' : 'VIP'}
                      </span>
                      <MemberLink memberId={m.memberId} mode="drawer" style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {m.name}
                      </MemberLink>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        Health {m.healthScore} · {m.archetype} · {m.time} {m.course} · ${(m.duesAnnual / 1000).toFixed(0)}K/yr
                      </span>
                      <span style={{ flex: 1 }} />
                      <button className="swoop-action-btn" onClick={() => navigate('automations')}>View in Inbox →</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%' }}>
                      <div>
                        <MicroLabel color="rgba(255,255,255,0.35)">Talking Points</MicroLabel>
                        <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {m.talkingPoints.map((p, i) => (
                            <li key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <MicroLabel color="rgba(255,255,255,0.35)">{isRisk ? 'Risk Profile' : 'Member Value'}</MicroLabel>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                          {isRisk ? 'Zero activity trend' : `Health score ${m.healthScore} · Top members`}
                        </div>
                        <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 4 }}>
                          ${(m.duesAnnual / 1000).toFixed(0)}K {isRisk ? 'dues at risk' : 'annual dues'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </SwoopSection>
          );
        })()}

        {/* Priority Member Alerts — only show when activity data is loaded */}
        {hasActivityData && (
          <SwoopSection
            title="Priority Member Alerts"
            titleColor={C.danger}
            count={priorityMemberCount > 0 ? `${priorityMemberCount} priority` : undefined}
            peek={priorityMemberCount > 0
              ? `${atRiskCount} at-risk · ${watchCount} on watch`
              : 'No critical alerts at this time'}
            defaultOpen={priorityMemberCount > 0}
          >
            <MemberAlerts />
          </SwoopSection>
        )}

        {/* Action Queue — routing summary only; full queue lives on the Actions page */}
        {hasActivityData && pendingAgentCount > 0 && (
          <SwoopSection
            title="Action Queue"
            titleColor={C.accent}
            count={pendingAgentCount}
            peek={`${pendingAgentCount} pending · F&B capture, member engagement, service recovery`}
          >
            <div className="flex items-center justify-between px-1 py-2">
              <span className="text-sm text-swoop-text-muted">
                {pendingAgentCount} action{pendingAgentCount !== 1 ? 's' : ''} ready for approval
              </span>
              <button
                type="button"
                onClick={() => navigate('automations')}
                className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Review &amp; Approve →
              </button>
            </div>
          </SwoopSection>
        )}

        {/* Today's Priorities — requires both tee sheet + POS to have real staffing/events data */}
        {teeSheetConnected && isGateOpen('fb') && <SwoopSection
          title="Today's Priorities"
          titleColor={C.accent}
          count={1}
          peek="Staffing alert: 3 understaffed days this period"
        >
          <div className="swoop-detail-row swoop-detail-row--danger" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.danger, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 7px', borderRadius: 999 }}>
                  Staffing Alert
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>3 understaffed days this period</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>Model confidence: 85%</span>
              </div>
              <button className="swoop-action-btn" onClick={() => navigate('automations')}>Add Shift →</button>
            </div>
            <div className="swoop-detail-divider" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Location', primary: 'Grill Room', secondary: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); })(), color: '#fff' },
                { label: 'Coverage', primary: '2 / 4 scheduled', secondary: '2 staff gap', color: C.danger },
                { label: 'Revenue at risk', primary: '$3,400', secondary: '~100 lost covers × $34 avg check', color: C.accent, mono: true },
              ].map((tile, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                  <MicroLabel>{tile.label}</MicroLabel>
                  <div style={{ fontSize: 12, color: tile.color, fontWeight: 700, fontFamily: tile.mono ? MONO : undefined }}>
                    {tile.primary}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{tile.secondary}</div>
                </div>
              ))}
            </div>
          </div>

        </SwoopSection>}

        {/* Weather Alert — requires tee sheet data to attribute revenue exposure */}
        {teeSheetConnected && <SwoopSection
          title="Weather Alert"
          titleColor={C.accent}
          peek="Wind Advisory: gusts to 30–40 mph expected Saturday afternoon"
          defaultOpen={false}
        >
          <div className="swoop-detail-row" style={{ flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Wind Speed', value: '30–40', sub: 'mph gusts', color: C.accent },
                { label: 'Timing', value: '2–6pm', sub: 'Saturday', color: '#fff' },
                { label: 'Affected Tee Times', value: '32', sub: 'afternoon slots', color: C.danger },
                { label: 'Revenue exposure', value: '$4.8K', sub: '32 slots × $150 avg green fee', color: C.accent },
              ].map((t, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <MicroLabel>{t.label}</MicroLabel>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t.color, fontFamily: MONO }}>{t.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{t.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(243,146,45,0.08)', border: '1px solid rgba(243,146,45,0.2)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  Recommended: Pre-notify 32 afternoon tee times with reschedule options
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  Offer complimentary indoor dining or Saturday morning alternative slots
                </div>
              </div>
              <button className="swoop-action-btn" style={{ flexShrink: 0 }}>Send Notifications →</button>
            </div>
          </div>
        </SwoopSection>}

        {/* Tomorrow's Forecast — requires tee sheet data */}
        {teeSheetConnected && <SwoopSection
          title="Tomorrow's Forecast"
          titleColor={C.neutral}
          peek="220 rounds booked · 87.2°F · Wind advisory · Staffing watch"
          defaultOpen={false}
        >
          <div className="swoop-detail-row" style={{ flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { label: 'Rounds Booked', value: '220', color: C.accent },
                { label: 'High Temp', value: '87.2°', color: '#fff' },
                { label: 'Wind / Gusts', value: '22mph', color: C.accent, tinted: true },
                { label: 'Rain Chance', value: '10%', color: '#fff' },
              ].map((t, i) => (
                <div key={i} style={{ background: t.tinted ? 'rgba(243,146,45,0.07)' : 'rgba(255,255,255,0.04)', border: t.tinted ? '1px solid rgba(243,146,45,0.15)' : undefined, borderRadius: 10, padding: 10, textAlign: 'center' }}>
                  <MicroLabel color={t.tinted ? 'rgba(243,146,45,0.7)' : 'rgba(255,255,255,0.4)'}>{t.label}</MicroLabel>
                  <div style={{ fontSize: 24, fontWeight: 800, color: t.color, fontFamily: MONO }}>{t.value}</div>
                </div>
              ))}
            </div>
            <MicroLabel>Staffing Recommendation</MicroLabel>
            {[
              { name: 'Grill Room', ratio: '2/4', color: C.accent, note: 'Needs coverage: 2 more required' },
              { name: 'Terrace', ratio: '3/3', color: C.success, note: 'Fully staffed' },
              { name: 'Pool Bar', ratio: '1/1', color: C.success, note: 'Fully staffed' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', minWidth: 90 }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color, fontFamily: MONO }}>{s.ratio}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.note}</span>
              </div>
            ))}
            <div style={{ background: 'rgba(243,146,45,0.07)', border: '1px solid rgba(243,146,45,0.15)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                High demand × adverse weather → <strong style={{ color: '#fff' }}>likely staffing risk</strong>. Cross-references tee sheet × weather × historical dining conversion.
              </div>
            </div>
          </div>
        </SwoopSection>}

      </div>
    </PageTransition>
  );
}
