// MembersView — consolidated view combining Member Risk, Tee Sheet, and Experience Insights
import { useState, useEffect, useCallback } from 'react';
import { StoryHeadline } from '@/components/ui';
// CollapsibleSection removed in V3 — At-Risk mode simplified
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import StatCard from '@/components/ui/StatCard';
import { isGateOpen } from '@/services/demoGate';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { TierRevenueMix, HouseholdComposition } from '@/components/insights/DeepInsightWidgets';

// Member Health tabs
import HealthOverview from '@/features/member-health/tabs/HealthOverview';
import AllMembersView from '@/features/member-health/tabs/AllMembersView';
import CohortTab from '@/features/member-health/tabs/CohortTab';
import EmailTab from '@/features/member-health/tabs/EmailTab';
import ArchetypeTab from '@/features/member-health/tabs/ArchetypeTab';
import ResignationTimeline from '@/features/member-health/ResignationTimeline';


const MODES = [
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'search', label: 'All Members' },
  { key: 'email-decay', label: 'Email Engagement' },
  { key: 'archetypes', label: 'Archetypes' },
  { key: 'resignations', label: 'Resignations' },
  { key: 'cohorts', label: 'First 90 Days' },
];

const HEADLINES = {
  'at-risk': () => {
    const summary = getMemberSummary();
    const atRisk = (summary.atRisk ?? 0) + (summary.critical ?? 0);
    return {
      variant: 'warning',
      headline: `Which members need your attention this week — and what's the best action for each?`,
      context: atRisk > 0
        ? `${atRisk} members showing engagement changes across golf, dining, and events.`
        : 'No members currently flagged — last checked today.',
    };
  },
  'search': () => ({
    variant: 'insight',
    headline: `Member directory — search by name, archetype, or health level`,
    context: `${getMemberSummary().totalMembers || getMemberSummary().total || 0} members with health scores, archetypes, and engagement data.`,
  }),
  'cohorts': () => ({
    variant: 'insight',
    headline: `New member integration — track the first 90 days`,
    context: `Monitor engagement milestones, habit formation, and onboarding progress for recent joins.`,
  }),
  'email-decay': () => ({
    variant: 'warning',
    headline: `Email engagement decay — the earliest churn signal`,
    context: `Members whose email open rates declined 25%+ over recent campaigns. Email decay precedes behavioral changes by 2-4 weeks.`,
  }),
  'archetypes': () => ({
    variant: 'insight',
    headline: `Member archetypes — behavioral profiles and engagement patterns`,
    context: `8 behavioral archetypes showing how members interact with golf, dining, events, and communications.`,
  }),
  'resignations': () => ({
    variant: 'warning',
    headline: `Resignation analysis — patterns, signals, and prevention`,
    context: `5 distinct resignation trajectories with different root causes and intervention strategies.`,
  }),
};

export default function MembersView() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [mode, setMode] = useState('at-risk');
  const [segment, setSegment] = useState('all');
  const [archetype, setArchetype] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreMsg, setRescoreMsg] = useState(null);

  const handleRescore = useCallback(async () => {
    setRescoring(true);
    setRescoreMsg(null);
    try {
      const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_auth_token') : null;
      const res = await fetch(`/api/compute-health-scores${clubId ? `?clubId=${clubId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && token !== 'demo' ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRescoreMsg({ type: 'success', text: `Scores updated for ${data.updated ?? 'all'} members.` });
        window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: 'scores' } }));
      } else {
        setRescoreMsg({ type: 'error', text: data.error || 'Score update failed.' });
      }
    } catch (err) {
      setRescoreMsg({ type: 'error', text: `Score update failed: ${err.message}` });
    }
    setRescoring(false);
  }, []);

  // Accept navigation intent for mode, segment, and archetype filters
  useEffect(() => {
    if (!routeIntent) return;
    const MODE_ALIASES = { 'all-members': 'search', 'email': 'email-decay' };
    const rawMode = routeIntent.mode || routeIntent.tab;
    const intentMode = MODE_ALIASES[rawMode] || rawMode;
    if (intentMode && MODES.some(m => m.key === intentMode)) {
      setMode(intentMode);
    }
    if (routeIntent.segment) setSegment(routeIntent.segment);
    if (routeIntent.archetype) setArchetype(routeIntent.archetype);
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={2} cardHeight={140} />;
  }

  // Real club with no member data — show welcome state
  const summary = getMemberSummary();
  const memberCount = summary.totalMembers || summary.total || 0;
  if (memberCount === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6">
          <StoryHeadline
            variant="insight"
            headline="Member intelligence starts with your roster"
            context="Import your member data to unlock health scores, at-risk alerts, and engagement analytics."
          />
          <DataEmptyState
            icon="👥"
            title="No members imported yet"
            description="Upload your member roster CSV to see health scores, archetypes, at-risk alerts, and engagement trends for every member. Start with Admin → Integrations → Open Upload Tool."
            dataType="members"
          />
        </div>
      </PageTransition>
    );
  }

  // Check if engagement data sources are available (tee sheet, POS, email)
  // Without these, health scores can't be computed — show roster-only mode
  const hasEngagementData = isGateOpen('tee-sheet') || isGateOpen('fb') || isGateOpen('email');

  // If members imported but no engagement data, force "All Members" tab (roster view)
  const activeMode = hasEngagementData ? mode : 'search';
  const headlineData = hasEngagementData
    ? HEADLINES[activeMode]()
    : {
        variant: 'insight',
        headline: 'Member directory — roster imported',
        context: `${memberCount} members loaded. Import tee sheet, POS, or email data to unlock health scores, archetypes, and at-risk alerts.`,
      };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <StoryHeadline
              variant={headlineData.variant}
              headline={headlineData.headline}
              context={headlineData.context}
            />
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRescore}
              disabled={rescoring}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand-300 text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:border-brand-500/40 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rescoring ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  Scoring…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Re-Score Members
                </>
              )}
            </button>
            {rescoreMsg && (
              <span className={`text-[11px] font-medium ${rescoreMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {rescoreMsg.text}
              </span>
            )}
          </div>
        </div>

        <EvidenceStrip systems={['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email']} />

        {/* Tier-revenue mix + household composition powered by imported data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          <TierRevenueMix />
          <HouseholdComposition />
        </div>

        {/* Roster summary stats */}
        {(summary.avgTenure > 0 || summary.avgDues > 0 || summary.renewalRate > 0) && (
          <div className="grid grid-cols-3 gap-3">
            {summary.avgTenure > 0 && (
              <StatCard label="Avg Tenure" value={`${summary.avgTenure} years`} />
            )}
            {summary.avgDues > 0 && (
              <StatCard label="Avg Annual Dues" value={summary.avgDues} format="currency" />
            )}
            {summary.renewalRate > 0 && (
              <StatCard label="Renewal Rate" value={Math.round(summary.renewalRate * 100)} format="percent" />
            )}
          </div>
        )}

        {/* Health tier KPI strip — quick-read signal counts before tab selection */}
        {hasEngagementData && (summary.critical > 0 || summary.atRisk > 0 || summary.watch > 0) && (
          <div className="flex items-center gap-3 flex-wrap">
            {summary.critical > 0 && (
              <button
                onClick={() => setMode('at-risk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {summary.critical} Critical
              </button>
            )}
            {summary.atRisk > 0 && (
              <button
                onClick={() => setMode('at-risk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {summary.atRisk} At-Risk
              </button>
            )}
            {summary.watch > 0 && (
              <button
                onClick={() => setMode('at-risk')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer dark:bg-yellow-500/10 dark:text-yellow-600 dark:border-yellow-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                {summary.watch} Watch
              </button>
            )}
            {summary.healthy > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {summary.healthy} Healthy
              </span>
            )}
          </div>
        )}

        {/* Mode switcher — disable engagement tabs when no activity data */}
        <div role="tablist" aria-label="Member views" className="flex gap-1 self-start rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
          {MODES.map(({ key, label }) => {
            const engagementOnly = ['at-risk', 'email-decay', 'archetypes', 'resignations', 'cohorts'].includes(key);
            const disabled = engagementOnly && !hasEngagementData;
            const disabledHints = {
              'at-risk': 'Import tee sheet data to see at-risk member alerts',
              'email-decay': 'Connect email integration to track engagement decay',
              'archetypes': 'Import activity data to generate behavioral archetypes',
              'resignations': 'Import tee sheet or POS data to detect resignation patterns',
              'cohorts': 'Import activity data to track new member onboarding',
            };
            return (
              <button
                key={key}
                role="tab"
                aria-selected={activeMode === key}
                onClick={() => !disabled && setMode(key)}
                disabled={disabled}
                className={`px-5 py-1.5 rounded-lg text-sm font-semibold border-none transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  disabled
                    ? 'bg-transparent text-gray-300 cursor-not-allowed'
                    : activeMode === key
                      ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white cursor-pointer'
                      : 'bg-transparent text-gray-500 hover:text-gray-700 cursor-pointer'
                }`}
                title={disabled ? (disabledHints[key] || 'Import tee sheet, POS, or email data to unlock this view') : ''}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Archetype filter chips — only with engagement data */}
        {activeMode === 'search' && hasEngagementData && (
          <div className="flex gap-1.5 flex-wrap overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <button
              onClick={() => setArchetype(null)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer border whitespace-nowrap transition-all duration-100 ${
                !archetype
                  ? 'border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300'
              }`}
            >All Archetypes</button>
            {['Die-Hard Golfer', 'Social Butterfly', 'Balanced Active', 'Weekend Warrior', 'Declining', 'New Member', 'Ghost', 'Snowbird'].map((a) => (
              <button
                key={a}
                onClick={() => setArchetype(archetype === a ? null : a)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer border whitespace-nowrap transition-all duration-100 ${
                  archetype === a
                    ? 'border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-500/10'
                    : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300'
                }`}
              >{a}</button>
            ))}
          </div>
        )}

        <div role="tabpanel">
          {activeMode === 'at-risk' && (
            <div className="flex flex-col gap-6">
              <HealthOverview />
            </div>
          )}
          {activeMode === 'search' && (
            <AllMembersView initialArchetype={archetype} rosterOnly={!hasEngagementData} />
          )}
          {activeMode === 'email-decay' && <EmailTab />}
          {activeMode === 'archetypes' && <ArchetypeTab />}
          {activeMode === 'resignations' && <ResignationTimeline />}
          {activeMode === 'cohorts' && <CohortTab />}
        </div>
      </div>
    </PageTransition>
  );
}
