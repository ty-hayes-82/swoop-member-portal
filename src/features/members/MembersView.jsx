// MembersView — consolidated view combining Member Risk, Tee Sheet, and Experience Insights
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import { theme } from '@/config/theme';
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
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


const MODES = [
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'search', label: 'All Members' },
];

const HEADLINES = {
  'at-risk': () => {
    const summary = getMemberSummary();
    const atRisk = (summary.atRisk ?? 0) + (summary.critical ?? 0);
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
            <CollapsibleSection title="First 90 Days" icon="📊">
              <CohortTab />
            </CollapsibleSection>
          </div>
        )}

        {/* Mode: Search */}
        {mode === 'search' && (
          <AllMembersView />
        )}

        {/* Insights moved to top-level /insights route (Sprint 5) */}
        {/* Waitlist & Tee Sheet decommissioned from MVP nav */}
      </div>
    </PageTransition>
  );
}
