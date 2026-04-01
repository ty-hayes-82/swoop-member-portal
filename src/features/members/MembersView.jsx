// MembersView — consolidated view combining Member Risk, Tee Sheet, and Experience Insights
import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
// CollapsibleSection removed in V3 — At-Risk mode simplified
import { theme } from '@/config/theme';
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';

// Member Health tabs — V3: reduced to 2 (At-Risk uses HealthOverview, search uses AllMembersView)
import HealthOverview from '@/features/member-health/tabs/HealthOverview';
import AllMembersView from '@/features/member-health/tabs/AllMembersView';
import CohortTab from '@/features/member-health/tabs/CohortTab';


const MODES = [
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'cohorts', label: 'First 90 Days' },
  { key: 'search', label: 'All Members' },
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

        {/* Archetype filter chips — only in All Members mode (HealthOverview has its own filters) */}
        {mode === 'search' && (
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          }}>
            <button
              onClick={() => setArchetype(null)}
              style={{
                padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: `1px solid ${!archetype ? theme.colors.accent : theme.colors.border}`,
                background: !archetype ? `${theme.colors.accent}12` : 'transparent',
                color: !archetype ? theme.colors.accent : theme.colors.textMuted,
                whiteSpace: 'nowrap', transition: 'all 0.12s',
              }}
            >All Archetypes</button>
            {['Die-Hard Golfer', 'Social Butterfly', 'Balanced Active', 'Weekend Warrior', 'Declining', 'New Member', 'Ghost', 'Snowbird'].map((a) => (
              <button
                key={a}
                onClick={() => setArchetype(archetype === a ? null : a)}
                style={{
                  padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${archetype === a ? theme.colors.accent : theme.colors.border}`,
                  background: archetype === a ? `${theme.colors.accent}12` : 'transparent',
                  color: archetype === a ? theme.colors.accent : theme.colors.textMuted,
                  whiteSpace: 'nowrap', transition: 'all 0.12s',
                }}
              >{a}</button>
            ))}
          </div>
        )}

        {/* Mode: At-Risk — V3: simplified to HealthOverview + ResignationTimeline */}
        {mode === 'at-risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
            <HealthOverview />
          </div>
        )}

        {/* Mode: Search */}
        {mode === 'search' && (
          <AllMembersView initialArchetype={archetype} />
        )}

        {/* Mode: First 90 Days */}
        {mode === 'cohorts' && (
          <CohortTab />
        )}
      </div>
    </PageTransition>
  );
}
