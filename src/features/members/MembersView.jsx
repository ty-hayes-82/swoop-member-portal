// MembersView — consolidated view combining Member Risk, Tee Sheet, and Experience Insights
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { theme } from '@/config/theme';
import { useNavigationContext } from '@/context/NavigationContext';
import { getHealthDistribution, getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';

// Member Health tabs
import HealthOverview from '@/features/member-health/tabs/HealthOverview';
import AllMembersView from '@/features/member-health/tabs/AllMembersView';
import ArchetypeTab from '@/features/member-health/tabs/ArchetypeTab';
import EmailTab from '@/features/member-health/tabs/EmailTab';
import RecoveryTab from '@/features/member-health/tabs/RecoveryTab';
import CohortTab from '@/features/member-health/tabs/CohortTab';
import ResignationTimeline from '@/features/member-health/ResignationTimeline';

// Experience Insights tabs (extracted)
import CorrelationsTab from '@/features/experience-insights/tabs/CorrelationsTab';
import TouchpointsTab from '@/features/experience-insights/tabs/TouchpointsTab';
import ComplaintsTab from '@/features/experience-insights/tabs/ComplaintsTab';
import EventsTab from '@/features/experience-insights/tabs/EventsTab';
import SurveyTab from '@/features/experience-insights/tabs/SurveyTab';
import { SegmentFilter, ArchetypeFilter } from '@/features/experience-insights/components/Filters';

// Tee Sheet Demand (full component)
import { WaitlistDemand } from '@/features/waitlist-demand';

// Local components
import InsightCards from './InsightCards';

const MODES = [
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'search', label: 'All Members' },
  { key: 'insights', label: 'Insights' },
  { key: 'tee-sheet', label: 'Waitlist & Tee Sheet' },
];

const HEADLINES = {
  'at-risk': () => {
    const dist = getHealthDistribution();
    const atRisk = (dist.atRisk ?? 0) + (dist.critical ?? 0);
    const summary = getMemberSummary();
    return {
      variant: 'warning',
      headline: `${atRisk} members at risk — $${((summary.potentialDuesAtRisk || 733000) / 1000).toFixed(0)}K/yr in dues need attention.`,
      context: 'Early warning system: members showing multi-domain disengagement patterns.',
    };
  },
  'search': () => ({
    variant: 'insight',
    headline: `${getMemberSummary().totalMembers || 300} members — search, filter, and drill down.`,
    context: 'Complete member directory with health scores, archetypes, and engagement data.',
  }),
  'insights': () => ({
    variant: 'opportunity',
    headline: 'Which experiences drive retention — and which ones cost you members?',
    context: 'Cross-domain correlations between touchpoints and business outcomes.',
  }),
  'tee-sheet': () => ({
    variant: 'insight',
    headline: 'Who is waiting, who will cancel, and what does it cost?',
    context: 'Waitlist management, cancellation risk, and demand intelligence.',
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

  const headlineData = HEADLINES[mode]();

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

        <StoryHeadline
          variant={headlineData.variant}
          headline={headlineData.headline}
          context={headlineData.context}
        />

        <EvidenceStrip systems={['Member CRM', 'Analytics', 'Tee Sheet', 'POS', 'Email']} />

        {/* Mode switcher */}
        <div style={{
          display: 'flex',
          background: theme.colors.bgDeep,
          borderRadius: theme.radius.md,
          padding: '3px',
          border: `1px solid ${theme.colors.border}`,
          alignSelf: 'flex-start',
        }}>
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: '7px 20px',
                borderRadius: '8px',
                fontSize: theme.fontSize.sm,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s',
                background: mode === key ? theme.colors.bgCard : 'transparent',
                color: mode === key ? theme.colors.textPrimary : theme.colors.textMuted,
                boxShadow: mode === key ? theme.shadow.sm : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mode: At-Risk */}
        {mode === 'at-risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
            <HealthOverview />
            <ResignationTimeline />
            <CollapsibleSection title="Archetypes" icon="🧬">
              <ArchetypeTab />
            </CollapsibleSection>
            <CollapsibleSection title="Email Decay" icon="📧">
              <EmailTab />
            </CollapsibleSection>
            <CollapsibleSection title="Recovery" icon="💚">
              <RecoveryTab />
            </CollapsibleSection>
            <CollapsibleSection title="Cohort Analysis" icon="📊">
              <CohortTab />
            </CollapsibleSection>
          </div>
        )}

        {/* Mode: Search */}
        {mode === 'search' && (
          <AllMembersView />
        )}

        {/* Mode: Insights */}
        {mode === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
            <InsightCards onDeepDive={() => {}} />

            <SegmentFilter segment={segment} onChange={setSegment} />
            <ArchetypeFilter archetype={archetype} onChange={setArchetype} />

            <CollapsibleSection title="Correlations" icon="🔗" defaultExpanded>
              <CorrelationsTab segment={segment} archetype={archetype} />
            </CollapsibleSection>
            {/* Deep Dives divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: theme.spacing.md,
              margin: `${theme.spacing.sm} 0`,
            }}>
              <div style={{ flex: 1, height: 1, background: theme.colors.border }} />
              <span style={{
                fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap',
              }}>
                Deep Dives
              </span>
              <div style={{ flex: 1, height: 1, background: theme.colors.border }} />
            </div>

            <CollapsibleSection title="Touchpoints" icon="🎯">
              <TouchpointsTab segment={segment} archetype={archetype} />
            </CollapsibleSection>
            <CollapsibleSection title="Complaints" icon="🚨">
              <ComplaintsTab />
            </CollapsibleSection>
            <CollapsibleSection title="Event ROI" icon="🎫">
              <EventsTab />
            </CollapsibleSection>
            <CollapsibleSection title="Survey Intelligence" icon="📋">
              <SurveyTab />
            </CollapsibleSection>
          </div>
        )}

        {/* Mode: Tee Sheet */}
        {mode === 'tee-sheet' && (
          <WaitlistDemand />
        )}
      </div>
    </PageTransition>
  );
}
