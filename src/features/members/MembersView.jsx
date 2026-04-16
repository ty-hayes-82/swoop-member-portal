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
          title="Protect your dues revenue."
          description="Swoop cross-references your roster with tee sheet and POS data to identify at-risk members before they resign. Catch 82 to 61 health score drops early: clubs using Swoop protect an average of $32K+ in total annual dues revenue per at-risk member retained (Swoop NGCOA pilot average, based on avg $800/mo dues over 40-month member tenure)."
          dataType="members"
          actions={
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => navigate('integrations/csv-import', { category: 'members' })}
                className="w-full px-5 py-3 rounded-lg text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Import Member Roster →
              </button>
              <button
                type="button"
                onClick={() => navigate('integrations')}
                className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-transparent text-swoop-text-muted border border-swoop-border hover:text-swoop-text hover:border-swoop-text transition-colors"
              >
                Connect Integrations
              </button>
            </div>
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
