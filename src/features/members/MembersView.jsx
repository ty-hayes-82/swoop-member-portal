// MembersView — consolidated view combining Member Risk, Tee Sheet, and Experience Insights
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
// CollapsibleSection removed in V3 — At-Risk mode simplified
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import { isAuthenticatedClub } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';

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
    context: `${getMemberSummary().totalMembers || 300} members with health scores, archetypes, and engagement data.`,
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

  // Accept navigation intent for mode, segment, and archetype filters
  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.mode && MODES.some(m => m.key === routeIntent.mode)) {
      setMode(routeIntent.mode);
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
  if (isAuthenticatedClub() && (!summary.totalMembers || summary.totalMembers === 0)) {
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

  const headlineData = HEADLINES[mode]();

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">

        <StoryHeadline
          variant={headlineData.variant}
          headline={headlineData.headline}
          context={headlineData.context}
        />

        <EvidenceStrip systems={['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email']} />

        {/* Mode switcher */}
        <div role="tablist" aria-label="Member views" className="flex gap-1 self-start rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`px-5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap ${
                mode === key
                  ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Archetype filter chips — only in All Members mode (HealthOverview has its own filters) */}
        {mode === 'search' && (
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
          {/* Mode: At-Risk — V3: simplified to HealthOverview + ResignationTimeline */}
          {mode === 'at-risk' && (
            <div className="flex flex-col gap-6">
              <HealthOverview />
            </div>
          )}

          {/* Mode: Search */}
          {mode === 'search' && (
            <AllMembersView initialArchetype={archetype} />
          )}

          {/* Mode: Email Engagement Decay */}
          {mode === 'email-decay' && (
            <EmailTab />
          )}

          {/* Mode: Member Archetypes */}
          {mode === 'archetypes' && (
            <ArchetypeTab />
          )}

          {/* Mode: Resignation Analysis */}
          {mode === 'resignations' && (
            <ResignationTimeline />
          )}

          {/* Mode: First 90 Days */}
          {mode === 'cohorts' && (
            <CohortTab />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
