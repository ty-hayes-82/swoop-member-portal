// MembersView — members intelligence page
// V6: simplified wrapper; all tab/filter logic lives inside HealthOverview
import { useState, useEffect } from 'react';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';
import { useNavigation } from '@/context/NavigationContext';
import AllMembersView from '@/features/member-health/tabs/AllMembersView';
import HealthOverview from '@/features/member-health/tabs/HealthOverview';

export default function MembersView() {
  const [isLoading, setIsLoading] = useState(true);
  const { navigate } = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={6} columns={2} cardHeight={140} />;
  }

  const summary = getMemberSummary();
  const memberCount = summary.totalMembers || summary.total || 0;

  if (memberCount === 0) {
    return (
      <PageTransition>
        <DataEmptyState
          icon="👥"
          title="Connect your club systems to unlock member intelligence"
          description="Identify $32K+ in at-risk annual dues per member, track cross-domain decay sequences, and catch 82→61 health score drops before members resign. Swoop pulls members, rounds, spend, and engagement directly from Jonas, Clubessential, Northstar, and similar systems."
          dataType="members"
          actions={
            <>
              <button
                type="button"
                onClick={() => navigate('integrations')}
                className="px-4 py-2 rounded-md text-xs font-bold bg-brand-500 text-white hover:bg-brand-600"
              >
                Connect Integrations →
              </button>
              <button
                type="button"
                onClick={() => navigate('integrations/csv-import', { category: 'members' })}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-transparent text-swoop-text-muted border border-swoop-border hover:text-swoop-text"
              >
                Or upload a CSV
              </button>
            </>
          }
        />
      </PageTransition>
    );
  }

  const hasEngagementData = isGateOpen('tee-sheet') || isGateOpen('fb') || isGateOpen('email');

  // Roster-only mode — no engagement data yet
  if (!hasEngagementData) {
    return (
      <PageTransition>
        <AllMembersView rosterOnly />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <HealthOverview />
    </PageTransition>
  );
}
