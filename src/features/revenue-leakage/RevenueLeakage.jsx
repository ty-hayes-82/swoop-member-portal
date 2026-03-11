import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import PaceImpactTab from './tabs/PaceImpactTab';
import StaffingImpactTab from './tabs/StaffingImpactTab';
import WeatherImpactTab from './tabs/WeatherImpactTab';
import BreakdownChart from './components/BreakdownChart';
import RecoveryCTA from './components/RecoveryCTA';
import { theme } from '@/config/theme';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';

const TABS = [
  { key: 'pace', label: 'Pace-of-Play Impact' },
  { key: 'staffing', label: 'Staffing Gaps' },
  { key: 'weather', label: 'Weather Shifts' },
];

// Calculate revenue losses by category
const PACE_LOSS = paceFBImpact.revenueLostPerMonth; // $5,760
const STAFFING_LOSS = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0); // $3,400
const WEATHER_LOSS = 420; // Balance to reach total
const TOTAL_LOSS = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS; // $9,580

export default function RevenueLeakage() {
  const [activeTab, setActiveTab] = useState('pace');
  const recoverableAmount = Math.round(PACE_LOSS * 0.35);
  
  // FP-P02: Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // FP-P02: Show loading skeleton
  if (isLoading) {
    return <SkeletonGrid cards={8} columns={4} cardHeight={200} />;
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <StoryHeadline
        variant="risk"
        headline={`Operational failures are costing you $${TOTAL_LOSS.toLocaleString()} in monthly F&B revenue.`}
        context="Revenue leakage happens when service breakdowns (slow rounds, understaffing, weather impacts) interrupt member dining patterns. Most clubs see the symptom (lower covers) but miss the operational cause."
      />

      <RecoveryCTA
        recoverableAmount={recoverableAmount}
        totalLoss={PACE_LOSS}
        onViewStaffingTab={() => setActiveTab('staffing')}
      />

      {/* P1: Breakdown Chart - Shows how total breaks down across categories */}
      <BreakdownChart
        totalLoss={TOTAL_LOSS}
        paceAmount={PACE_LOSS}
        staffingAmount={STAFFING_LOSS}
        weatherAmount={WEATHER_LOSS}
      />

      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: theme.fontSize.md,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.xs,
        }}>
          Action Paths to Recover ${TOTAL_LOSS.toLocaleString()}/month
        </h3>
        <p style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.md,
        }}>
          Prioritize pace first, protect staffing consistency second, and convert weather days with targeted indoor offers.
        </p>
        <div style={{ display: 'grid', gap: theme.spacing.sm }}>
          <ActionPath
            label="Pace of Play"
            amount={PACE_LOSS}
            color={theme.colors.operations}
            action="Deploy ranger coverage on holes 4, 8, 12, 16 (Sat/Sun 8-11am)."
          />
          <ActionPath
            label="Staffing"
            amount={STAFFING_LOSS}
            color={theme.colors.staffing}
            action="Hold 4-server Grill Room lunch minimum on high-demand days."
          />
          <ActionPath
            label="Weather"
            amount={WEATHER_LOSS}
            color={theme.colors.info}
            action="Trigger rain-day indoor dining offers and pre-shift staffing."
          />
        </div>
      </div>

      <Panel
        title="Deep Dive by Category"
        subtitle="Which operational failures are costing you F&B spend?"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={theme.colors.fb}
      >
        {activeTab === 'pace' && <PaceImpactTab />}
        {activeTab === 'staffing' && <StaffingImpactTab />}
        {activeTab === 'weather' && <WeatherImpactTab />}
      </Panel>
      </div>
    </PageTransition>
  );
}

function ActionPath({ label, amount, color, action }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: theme.spacing.sm,
      alignItems: 'start',
      padding: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.bg,
    }}>
      <div style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
        marginTop: 6,
      }} />
      <div style={{ display: 'grid', gap: 2 }}>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontWeight: 600 }}>
            {label}
          </span>
          <span style={{ fontSize: theme.fontSize.sm, color, fontFamily: theme.fonts.mono, fontWeight: 700 }}>
            ${amount.toLocaleString()}/month
          </span>
        </div>
        <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, margin: 0 }}>
          {action}
        </p>
      </div>
    </div>
  );
}
