// RevenueView — consolidated revenue intelligence
// Combines Revenue Leakage + Spend Potential + Scenario Modeling
import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { useNavigation } from '@/context/NavigationContext';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { archetypeSpendGaps } from '@/services/experienceInsightsService';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import EvidenceStrip from '@/components/ui/EvidenceStrip';

// Extracted components from RevenueLeakage
import RecoveryCTA from '@/features/revenue-leakage/components/RecoveryCTA';
import BreakdownChart from '@/features/revenue-leakage/components/BreakdownChart';
import ActionPath from '@/features/revenue-leakage/components/ActionPath';
import ProShopTab from '@/features/revenue-leakage/components/ProShopTab';
import ScenarioModeling from '@/features/revenue-leakage/components/ScenarioModeling';

// Existing tab components
import PaceImpactTab from '@/features/revenue-leakage/tabs/PaceImpactTab';
import StaffingImpactTab from '@/features/revenue-leakage/tabs/StaffingImpactTab';
import WeatherImpactTab from '@/features/revenue-leakage/tabs/WeatherImpactTab';

// Spend Potential from Experience Insights
import SpendPotentialTab from '@/features/experience-insights/tabs/SpendPotentialTab';

const PACE_LOSS = paceFBImpact.revenueLostPerMonth;
const STAFFING_LOSS = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0);
const WEATHER_LOSS = 420;
const PROSHOP_LOSS = Math.round((72000 + 45000) / 12);
const TOTAL_LOSS = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS + PROSHOP_LOSS;

const DEEP_TABS = [
  { key: 'pace', label: 'Pace-of-Play Impact' },
  { key: 'staffing', label: 'Staffing Gaps' },
  { key: 'weather', label: 'Weather Shifts' },
  { key: 'proshop', label: 'Pro Shop & Lessons' },
];

const mono = "'JetBrains Mono', monospace";

export default function RevenueView() {
  const { navigate: nav, routeIntent, clearRouteIntent } = useNavigation();
  const [activeTab, setActiveTab] = useState('pace');
  const [archetype, setArchetype] = useState(null);
  const recoverableAmount = Math.round(PACE_LOSS * 0.35);

  const spendTotal = archetypeSpendGaps.reduce((s, a) => s + a.totalUntapped, 0);
  const spendMonthly = Math.round(spendTotal / 12);
  const memberSummary = getMemberSummary();
  const duesAtRisk = memberSummary.potentialDuesAtRisk || 533000;
  const duesMonthly = Math.round(duesAtRisk / 12);
  const totalOpportunity = TOTAL_LOSS + spendMonthly + duesMonthly;

  // Accept navigation intent for tab and archetype filters
  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.tab && DEEP_TABS.some(t => t.key === routeIntent.tab)) {
      setActiveTab(routeIntent.tab);
    }
    if (routeIntent.archetype) setArchetype(routeIntent.archetype);
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonGrid cards={8} columns={4} cardHeight={200} />;
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <StoryHeadline
          variant="risk"
          headline={`$${totalOpportunity.toLocaleString()}/month in addressable revenue opportunity across operations, spend gaps, and at-risk dues.`}
          context="Revenue leakage happens when service breakdowns interrupt member dining patterns. Spend gaps represent untapped wallet share. At-risk dues are protectable with early intervention."
        />

        <EvidenceStrip systems={['POS', 'Tee Sheet', 'Scheduling', 'Weather', 'Member CRM']} />

        {/* Unified Revenue Opportunity */}
        <div style={{
          background: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm }}>
            Total Revenue Opportunity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            {[
              { label: 'Revenue Leakage', sub: 'Recoverable', value: TOTAL_LOSS, color: theme.colors.urgent },
              { label: 'Pro Shop & Lessons', sub: 'Growable', value: PROSHOP_LOSS, color: 'rgb(139,92,246)' },
              { label: 'Spend Potential', sub: 'Growable', value: spendMonthly, color: theme.colors.success },
              { label: 'Dues at Risk', sub: 'Protectable', value: duesMonthly, color: theme.colors.warning, link: () => nav('members') },
            ].map((p) => (
              <div
                key={p.label}
                onClick={p.link ?? undefined}
                style={{
                  background: `${p.color}08`,
                  border: `1px solid ${p.color}25`,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  textAlign: 'center',
                  cursor: p.link ? 'pointer' : 'default',
                }}
              >
                <div style={{ fontSize: 10, color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>{p.sub}</div>
                <div style={{ fontFamily: mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: p.color }}>
                  ${p.value.toLocaleString()}<span style={{ fontSize: theme.fontSize.xs, fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>{p.label}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.sm }}>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}>Combined addressable opportunity: </span>
            <span style={{ fontFamily: mono, fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
              ${totalOpportunity.toLocaleString()}/mo
            </span>
            <span style={{ fontSize: 11, color: theme.colors.textMuted }}> (${(totalOpportunity * 12).toLocaleString()}/yr)</span>
          </div>

          {/* Top 5 Actions to Capture Revenue */}
          <div style={{ marginTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.border}`, paddingTop: theme.spacing.md }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.sm }}>
              Top 5 Actions to Capture Revenue
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { rank: 1, action: 'Call top 3 Critical members today', impact: duesMonthly, source: 'Dues at Risk', color: theme.colors.warning, link: () => nav('members') },
                { rank: 2, action: 'Deploy rangers to holes 4, 8, 12, 16 (weekends)', impact: PACE_LOSS, source: 'Pace of Play', color: theme.colors.urgent },
                { rank: 3, action: 'Launch "Dine After Your Round" campaign for Die-Hard Golfers', impact: Math.round(spendMonthly * 0.4), source: 'Spend Potential', color: theme.colors.success },
                { rank: 4, action: 'Hold 4-server minimum on high-demand lunch shifts', impact: STAFFING_LOSS, source: 'Staffing Gaps', color: 'rgb(217,119,6)' },
                { rank: 5, action: 'Cross-sell fitting services to lesson-takers', impact: Math.round(PROSHOP_LOSS * 0.3), source: 'Pro Shop', color: 'rgb(139,92,246)' },
              ].map((item) => (
                <div
                  key={item.rank}
                  onClick={item.link ?? undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: theme.colors.bg,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    cursor: item.link ? 'pointer' : 'default',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: `${item.color}15`, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {item.rank}
                  </span>
                  <div style={{ flex: 1, fontSize: theme.fontSize.xs, color: theme.colors.textPrimary }}>
                    {item.action}
                  </div>
                  <span style={{
                    fontSize: 10, color: theme.colors.textMuted,
                    background: theme.colors.bgDeep, padding: '2px 6px', borderRadius: 4,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.source}
                  </span>
                  <span style={{
                    fontFamily: mono, fontSize: theme.fontSize.xs, fontWeight: 700,
                    color: item.color, whiteSpace: 'nowrap',
                  }}>
                    +${item.impact.toLocaleString()}/mo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RecoveryCTA
          recoverableAmount={recoverableAmount}
          totalLoss={PACE_LOSS}
          onViewStaffingTab={() => setActiveTab('staffing')}
        />

        <BreakdownChart
          totalLoss={TOTAL_LOSS}
          paceAmount={PACE_LOSS}
          staffingAmount={STAFFING_LOSS}
          weatherAmount={WEATHER_LOSS}
          proshopAmount={PROSHOP_LOSS}
        />

        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f0f', marginBottom: '4px' }}>
            Action Paths to Recover ${TOTAL_LOSS.toLocaleString()}/month
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            Prioritize pace first, protect staffing consistency second, and convert weather days with targeted indoor offers.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            <ActionPath label="Pace of Play" amount={PACE_LOSS} color="rgb(243,146,45)" action="Deploy ranger coverage on holes 4, 8, 12, 16 (Sat/Sun 8-11am)." />
            <ActionPath label="Staffing" amount={STAFFING_LOSS} color="rgb(217,119,6)" action="Hold 4-server Grill Room lunch minimum on high-demand days." />
            <ActionPath label="Weather" amount={WEATHER_LOSS} color="rgb(29,78,216)" action="Trigger rain-day indoor dining offers and pre-shift staffing." />
          </div>
        </div>

        <ScenarioModeling
          paceLoss={PACE_LOSS}
          staffingLoss={STAFFING_LOSS}
          weatherLoss={WEATHER_LOSS}
        />

        {/* Spend Potential by Archetype */}
        <Panel title="Spend Potential by Archetype" subtitle="Where is untapped wallet share across your member base?">
          <SpendPotentialTab archetype={archetype} />
        </Panel>

        {/* Deep Dive by Category */}
        <Panel
          title="Deep Dive by Category"
          subtitle="Which operational failures are costing you F&B spend?"
          tabs={DEEP_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor={theme.colors.fb}
        >
          {activeTab === 'pace' && <PaceImpactTab />}
          {activeTab === 'staffing' && <StaffingImpactTab />}
          {activeTab === 'weather' && <WeatherImpactTab />}
          {activeTab === 'proshop' && <ProShopTab />}
        </Panel>
      </div>
    </PageTransition>
  );
}
