// MembersView — members intelligence page
// V6: simplified wrapper; all tab/filter logic lives inside HealthOverview
import { useState, useEffect } from 'react';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';
import AllMembersView from '@/features/member-health/tabs/AllMembersView';
import HealthOverview from '@/features/member-health/tabs/HealthOverview';

export default function MembersView() {
  const [isLoading, setIsLoading] = useState(true);

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
          title="No members imported yet"
          description="Upload your member roster CSV to see health scores, archetypes, at-risk alerts, and engagement trends for every member. Start with Admin → Integrations → Open Upload Tool."
          dataType="members"
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
