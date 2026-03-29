import { useState, useEffect } from 'react';
import { Panel, StoryHeadline } from '@/components/ui';
import PaceImpactTab from './tabs/PaceImpactTab';
import StaffingImpactTab from './tabs/StaffingImpactTab';
import WeatherImpactTab from './tabs/WeatherImpactTab';
import { theme } from '@/config/theme';
import { useNavigation } from '@/context/NavigationContext';
import { paceFBImpact } from '@/data/pace';
import { understaffedDays } from '@/data/staffing';
import { archetypeSpendGaps } from '@/services/experienceInsightsService';
import { getMemberSummary } from '@/services/memberService';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition from '@/components/ui/PageTransition';
import ScenarioModeling from './components/ScenarioModeling';
import FlowLink from '@/components/ui/FlowLink';
import RecoveryCTA from './components/RecoveryCTA';
import BreakdownChart from './components/BreakdownChart';
import ActionPath from './components/ActionPath';
import ProShopTab from './components/ProShopTab';

const TABS = [
  { key: 'pace', label: 'Service Pace' },
  { key: 'staffing', label: 'Staffing Gaps' },
  { key: 'weather', label: 'Weather Shifts' },
  { key: 'proshop', label: 'Pro Shop & Lessons' },
];

const PACE_LOSS = paceFBImpact.revenueLostPerMonth;
const STAFFING_LOSS = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0);
const WEATHER_LOSS = 420;
const PROSHOP_LOSS = Math.round((72000 + 45000) / 12); // $72K pro shop gap + $45K lesson conversion, annualized to monthly
const TOTAL_LOSS = PACE_LOSS + STAFFING_LOSS + WEATHER_LOSS + PROSHOP_LOSS;

const mono = "'JetBrains Mono', monospace";

export default function RevenueLeakage() {
  const { navigate: nav } = useNavigation();
  const [activeTab, setActiveTab] = useState('pace');
  const recoverableAmount = Math.round(PACE_LOSS * 0.35);

  // Unified revenue opportunity data
  const spendTotal = archetypeSpendGaps.reduce((s, a) => s + a.totalUntapped, 0);
  const spendMonthly = Math.round(spendTotal / 12);
  const memberSummary = getMemberSummary();
  const duesAtRisk = memberSummary.potentialDuesAtRisk || 533000;
  const duesMonthly = Math.round(duesAtRisk / 12);
  const totalOpportunity = TOTAL_LOSS + spendMonthly + duesMonthly;

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
          headline={`Operational failures are costing you $${TOTAL_LOSS.toLocaleString()} in monthly F&B revenue.`}
          context="Revenue leakage happens when service breakdowns (slow rounds, understaffing, weather impacts) interrupt member dining patterns. Most clubs see the symptom (lower covers) but miss the operational cause."
        />

        <FlowLink flowNum="03" persona="Mike" />

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
              { label: 'Revenue Leakage', sub: 'Recoverable', value: TOTAL_LOSS, color: theme.colors.urgent, link: null },
              { label: 'Pro Shop & Lessons', sub: 'Growable', value: PROSHOP_LOSS, color: 'rgb(139,92,246)', link: () => setActiveTab('proshop') },
              { label: 'Spend Potential', sub: 'Growable', value: spendMonthly, color: theme.colors.success, link: () => nav('experience-insights') },
              { label: 'Dues at Risk', sub: 'Protectable', value: duesMonthly, color: theme.colors.warning, link: () => nav('member-health') },
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
          {activeTab === 'proshop' && <ProShopTab />}
        </Panel>
      </div>
    </PageTransition>
  );
}
