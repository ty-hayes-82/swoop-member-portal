// RevenuePage — Pillar 3 (PROVE IT) revenue leakage decomposition
//
// The storyboard moment: "$9,377 per month in F&B revenue lost to operational
// failures he didn't know existed. $5,177 from pace of play. $3,400 from
// understaffed Fridays. $800 from weather no-shows. Three root causes. Three
// different source systems. One number the GM has never seen before."
//
// This page is the proof of Layer 3: cross-domain revenue attribution that
// no single vendor (Jonas, ForeTees, Northstar) can produce.

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Panel } from '@/components/ui';
import StoryHeadline from '@/components/ui/StoryHeadline';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import SourceBadge from '@/components/ui/SourceBadge';
import PageTransition, { AnimatedNumber } from '@/components/ui/PageTransition';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import DataEmptyState from '@/components/ui/DataEmptyState';
import ScenarioSlider from '@/components/ui/ScenarioSlider';
import { ARAgingPanel, SettlementMixDonut } from '@/components/insights/DeepInsightWidgets';
import { useNavigation } from '@/context/NavigationContext';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import {
  getLeakageData,
  getDollarPerSlowRound,
  getBottleneckSummary,
  getSlowRoundContext,
} from '@/services/revenueService';
import { isGateOpen } from '@/services/demoGate';
import { getMemberSummary, getAtRiskMembers } from '@/services/memberService';
import AgentUpsell from '@/components/ui/AgentUpsell';

const COLORS = {
  pace: '#ef4444',
  staffing: '#f59e0b',
  weather: '#60a5fa',
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
      <div className="text-xs font-bold text-gray-800 dark:text-white/90">{item.payload.name}</div>
      <div className="text-sm font-mono text-gray-600 dark:text-gray-300">
        ${item.value.toLocaleString()}/mo
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">{item.payload.source}</div>
    </div>
  );
}

export default function RevenuePage() {
  const { navigate } = useNavigation();
  const { showToast } = useApp() || {};
  const [isLoading, setIsLoading] = useState(true);
  const [rangerDeployed, setRangerDeployed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleDeployRanger = (hole, estimatedRecovery) => {
    trackAction({
      actionType: 'approve',
      actionSubtype: 'deploy_ranger',
      referenceType: 'revenue_recommendation',
      referenceId: `ranger_hole_${hole}`,
      description: `Deploy ranger to Hole ${hole} on weekends — projected $${estimatedRecovery.toLocaleString()}/mo recovery`,
    });
    setRangerDeployed(true);
    if (showToast) {
      showToast(`Ranger deployment approved for Hole ${hole}. Logged to action history.`, 'success');
    }
  };

  // Memoize all data snapshots above ALL early returns so hook ordering stays
  // consistent across renders (Rules of Hooks — conditional hooks crash React).
  const leakage = useMemo(() => getLeakageData(), []);
  const bottleneck = useMemo(() => getBottleneckSummary(), []);
  const slowContext = useMemo(() => getSlowRoundContext(), []);
  const dollarPerSlowRound = useMemo(() => getDollarPerSlowRound(), []);

  if (isLoading) {
    return (
      <div className="p-6 w-full">
        <SkeletonGrid cards={4} columns={2} cardHeight={180} />
      </div>
    );
  }

  if (!leakage || leakage.TOTAL === 0) {
    const hasPOS = isGateOpen('fb');
    const hasTeeSheet = isGateOpen('tee-sheet');

    return (
      <PageTransition>
        <div className="p-6 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Revenue Leakage</h1>
            <p className="text-sm text-gray-500 mt-1">
              Revenue lost to slow rounds, understaffing, and weather — quantified across every system.
            </p>
          </div>

          {hasPOS && !hasTeeSheet ? (
            (() => {
              const memberSummary = getMemberSummary();
              const atRisk = getAtRiskMembers().slice(0, 3);
              const riskCount = (memberSummary.atRisk || 0) + (memberSummary.critical || 0);
              const duesAtRisk = memberSummary.potentialDuesAtRisk || 0;
              return (
                <div className="flex flex-col gap-4">
                  {/* POS connected — surface real member-spend intelligence */}
                  <div className="rounded-xl border border-green-200 bg-green-50/50 dark:bg-green-500/5 dark:border-green-500/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">✅</span>
                      <span className="font-semibold text-gray-800 dark:text-white/90">POS Connected — {686} transactions loaded</span>
                      <SourceBadge system="POS" size="xs" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white dark:bg-white/5 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Members Imported</div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono">{memberSummary.total || 0}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">spending patterns being analyzed</div>
                      </div>
                      {riskCount > 0 && (
                        <div className="bg-white dark:bg-white/5 rounded-lg p-3 border border-red-200 dark:border-red-500/20">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">At-Risk Members</div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{riskCount}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">declining engagement detected</div>
                        </div>
                      )}
                      {duesAtRisk > 0 && (
                        <div className="bg-white dark:bg-white/5 rounded-lg p-3 border border-red-200 dark:border-red-500/20">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-red-500 mb-1">Dues at Risk</div>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">${Math.round(duesAtRisk / 1000)}K</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">annual dues from at-risk members</div>
                        </div>
                      )}
                    </div>
                    {atRisk.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Members Declining — Cross-Reference with Spend</div>
                        <div className="flex flex-col gap-1.5">
                          {atRisk.map(m => (
                            <div key={m.id || m.memberId} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{m.name}</div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-mono text-red-500 font-semibold">Score {m.healthScore ?? m.score ?? '—'}</span>
                                {m.duesAnnual > 0 && <span>${Math.round(m.duesAnnual / 1000)}K/yr dues</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-500/5 dark:border-amber-500/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-white/90 mb-1">Next: Connect Tee Sheet → unlock revenue leakage</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Swoop will cross-reference POS checks against tee sheet rounds — identifying which rounds skip dining and quantifying the revenue impact per slow hole.
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          {[
                            { label: 'Industry avg leakage', value: '$8,400/mo', sub: 'benchmark — not your data yet' },
                            { label: 'Time to insight', value: '< 2 min', sub: 'after tee sheet import' },
                          ].map(({ label, value, sub }) => (
                            <div key={label} className="bg-white/60 dark:bg-white/5 rounded-lg p-3 border border-amber-100 dark:border-amber-500/10">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
                              <div className="font-bold text-gray-800 dark:text-white/90">{value}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <DataEmptyState
              icon="💰"
              title="Revenue leakage needs data"
              description={
                hasTeeSheet && !hasPOS
                  ? 'Connect your POS system to see how pace of play and staffing gaps translate to F&B revenue loss.'
                  : 'Import your tee sheet, POS, and scheduling data to see how operational failures connect to F&B revenue loss.'
              }
              dataType="operations data"
            />
          )}
        </div>
      </PageTransition>
    );
  }

  // Build chart data — always show all 3 rows so the chart isn't sparse;
  // zero-value rows render as locked/pending bars at a minimal stub width
  const ALL_LEAKAGE_ROWS = [
    { name: 'Pace of Play', value: leakage.PACE_LOSS, color: COLORS.pace, source: 'Tee Sheet + POS' },
    { name: 'Understaffed Days', value: leakage.STAFFING_LOSS, color: COLORS.staffing, source: 'Scheduling + POS' },
    { name: 'Weather No-Shows', value: leakage.WEATHER_LOSS, color: COLORS.weather, source: 'Weather + POS' },
  ];
  const chartData = ALL_LEAKAGE_ROWS.filter(d => d.value > 0);
  // For display: use all rows when chart would otherwise be too sparse
  const chartDisplayData = chartData.length < 2
    ? ALL_LEAKAGE_ROWS.map(d => ({ ...d, value: d.value > 0 ? d.value : Math.round(leakage.TOTAL * 0.05) || 100, locked: d.value === 0 }))
    : chartData;

  return (
    <PageTransition>
      <div className="p-6 w-full max-w-[1400px] mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Revenue Leakage
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Before members resign, they stop spending. Slow rounds, understaffed shifts, and missed dining — quantified across every system before it shows up in dues revenue.
            </p>
          </div>
          <button
            onClick={() => navigate('board-report')}
            className="rounded-lg bg-brand-500 text-white px-5 py-2 text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Generate Board Report →
          </button>
        </div>

        {/* Deep insights powered by imported CSV data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
          <SettlementMixDonut />
          <ARAgingPanel />
        </div>

        {/* Story headline — copy matches whichever leakage sources have real data */}
        {(() => {
          const activeSources = [
            leakage.PACE_LOSS > 0 && 'pace of play',
            leakage.STAFFING_LOSS > 0 && 'understaffing',
            leakage.WEATHER_LOSS > 0 && 'weather no-shows',
          ].filter(Boolean);
          const sourceCount = activeSources.length;
          const lossType = sourceCount === 1
            ? activeSources[0]
            : 'operational failures';
          const contextLine = sourceCount >= 3
            ? 'Three root causes. Three different source systems. One number that\'s invisible until you connect them.'
            : sourceCount === 2
            ? `Two root causes across two source systems. Connect scheduling and weather to see the full picture.`
            : `One root cause identified so far. Connect scheduling and weather data to uncover additional leakage.`;
          return (
            <StoryHeadline
              variant="urgent"
              headline={`$${leakage.TOTAL.toLocaleString()}/month in revenue lost to ${lossType}.`}
              context={contextLine}
            />
          );
        })()}

        <EvidenceStrip systems={leakage.sources} />

        {/* Hero KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Total Monthly Leakage</div>
            <div className="text-2xl font-bold text-error-500 font-mono mt-1">
              $<AnimatedNumber value={leakage.TOTAL} duration={1200} />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">${(leakage.TOTAL * 12).toLocaleString()}/yr</div>
            {/* "vs last month" delta is mocked until revenueService exposes a historical series. */}
            {leakage.MOM_DELTA != null && (
            <div className={`mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${leakage.MOM_DELTA > 0 ? 'bg-error-500/[0.08] text-error-500 border-error-500/15' : 'bg-success-500/[0.08] text-success-600 border-success-500/15'}`}
                 title={leakage.PRIOR_MONTH_TOTAL != null ? `Dec leakage was $${leakage.PRIOR_MONTH_TOTAL.toLocaleString()}/mo — Jan ${leakage.MOM_DELTA > 0 ? 'jumped' : 'dropped'} $${Math.abs(leakage.MOM_DELTA).toLocaleString()} as holiday staff left and pace slowed.` : undefined}>
              <span>{leakage.MOM_DELTA > 0 ? '↑' : '↓'}</span>
              <span>{leakage.MOM_DELTA > 0 ? '+' : '-'}${Math.abs(leakage.MOM_DELTA).toLocaleString()} vs last month</span>
            </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Pace of Play</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">
              $<AnimatedNumber value={leakage.PACE_LOSS} duration={1200} />
            </div>
            <SourceBadge system="Tee Sheet" size="xs" />
            <div className="text-[11px] text-gray-400 mt-1.5 leading-snug">Slow rounds drop post-round F&B conversion from ~41% to ~22%.</div>
          </div>
          {leakage.STAFFING_LOSS > 0 ? (
            <button
              type="button"
              onClick={() => navigate('service', { tab: 'staffing' })}
              className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800 cursor-pointer text-left hover:border-brand-500 hover:shadow-md transition-all group"
              title="View Staffing tab in Service for the underlying detail"
            >
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Understaffed Days</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">
                $<AnimatedNumber value={leakage.STAFFING_LOSS} duration={1200} />
              </div>
              <SourceBadge system="Scheduling" size="xs" />
              <div className="text-[11px] text-gray-400 mt-1.5 leading-snug group-hover:text-brand-500 transition-colors">Complaints spike 2–3x on short-staffed days. View staffing →</div>
            </button>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 dark:bg-white/[0.02] dark:border-gray-700 opacity-70">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Understaffed Days</div>
                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 border border-gray-300 rounded px-1 py-0.5">Locked</span>
              </div>
              <div className="text-2xl font-bold text-gray-300 dark:text-gray-600 font-mono mt-1">$—</div>
              <SourceBadge system="Scheduling" size="xs" />
              <div className="text-[11px] text-gray-400 mt-1.5 leading-snug">Connect scheduling data to unlock staffing-driven loss tracking.</div>
            </div>
          )}
          {leakage.WEATHER_LOSS > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Weather No-Shows</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">
                $<AnimatedNumber value={leakage.WEATHER_LOSS} duration={1200} />
              </div>
              <SourceBadge system="Weather API" size="xs" />
              <div className="text-[11px] text-gray-400 mt-1.5 leading-snug">Proactive notification recovers ~60% of at-risk tee times.</div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 dark:bg-white/[0.02] dark:border-gray-700 opacity-70">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Weather No-Shows</div>
                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 border border-gray-300 rounded px-1 py-0.5">Locked</span>
              </div>
              <div className="text-2xl font-bold text-gray-300 dark:text-gray-600 font-mono mt-1">$—</div>
              <SourceBadge system="Weather API" size="xs" />
              <div className="text-[11px] text-gray-400 mt-1.5 leading-snug">Connect scheduling + weather feed to unlock no-show analysis.</div>
            </div>
          )}
        </div>

        {/* Decomposition Chart */}
        <Panel
          title="Leakage Decomposition"
          subtitle={`Where the $${leakage.TOTAL.toLocaleString()} is going — and which systems prove it`}
          sourceSystems={['Tee Sheet', 'POS', 'Scheduling', 'Weather']}
        >
          {/* Trend context — Pillar 3: PROVE IT depth */}
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg dark:bg-white/5 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Tracking Since</div>
              <div className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">First month of revenue leakage tracking</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">This Month</div>
              <div className="text-sm font-bold font-mono text-error-500">${leakage.TOTAL.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Recoverable at 20%</div>
              <div className="text-sm font-bold font-mono text-success-500">~${Math.round(leakage.TOTAL * 0.2).toLocaleString()}/mo</div>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDisplayData} layout="vertical" margin={{ top: 6, right: 30, left: 80, bottom: 6 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${v.toLocaleString()}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} width={140} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartDisplayData.map((entry, i) => (
                    <Cell key={i} fill={entry.locked ? '#e5e7eb' : entry.color} opacity={entry.locked ? 0.7 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {chartDisplayData.some(d => d.locked) && (
            <div className="text-[10px] text-gray-400 mt-1 italic">
              Grey bars = data source not yet connected — connect scheduling and weather to compute those leakage buckets
            </div>
          )}
        </Panel>

        {/* Hole 12 Bottleneck Drill-down */}
        {bottleneck && (
          <Panel
            title={`The Hole ${bottleneck.hole} Bottleneck`}
            subtitle="Pace of play → dining conversion → dollar gap. The Layer 3 connection."
            sourceSystems={['Tee Sheet', 'POS']}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-error-50 border border-error-500/20 rounded-xl p-4 dark:bg-error-500/5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-error-500">Bottleneck</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white/90 mt-1">
                  Hole {bottleneck.hole}
                </div>
                <div className="text-xs text-gray-500 mt-1">{bottleneck.course} course</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-mono">
                  {bottleneck.avgDelay.toFixed(1)} min avg delay
                </div>
                <div className="text-xs text-gray-500">
                  {bottleneck.roundsAffected} rounds affected
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 dark:bg-white/[0.03] dark:border-gray-800">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Dining Conversion</div>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <div className="text-xs text-success-500 font-semibold">Fast rounds</div>
                    <div className="text-2xl font-bold text-success-500 font-mono">{bottleneck.fastConversionPct}%</div>
                  </div>
                  <div className="text-gray-300 text-2xl">vs</div>
                  <div>
                    <div className="text-xs text-error-500 font-semibold">Slow rounds</div>
                    <div className="text-2xl font-bold text-error-500 font-mono">{bottleneck.slowConversionPct}%</div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 mt-2">
                  Post-round dining conversion gap from POS data
                </div>
              </div>

              <div className="bg-warning-50 border border-warning-500/20 rounded-xl p-4 dark:bg-warning-500/5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-warning-500">Per-Round Impact</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white/90 font-mono mt-1">
                  ${dollarPerSlowRound}
                </div>
                <div className="text-xs text-gray-500 mt-1">per slow round</div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-2 leading-snug">
                  {slowContext.slowRounds.toLocaleString()} slow rounds/month ={' '}
                  <span className="font-mono font-bold text-error-500">
                    ${(slowContext.slowRounds * dollarPerSlowRound).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg dark:bg-white/5 dark:border-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed m-0">
                <strong className="text-gray-800 dark:text-white/90">Layer 3 insight:</strong>{' '}
                Nobody at this club has ever connected pace of play on Hole {bottleneck.hole} to dining revenue.
                The tee sheet knows the pace. The POS knows the dining. Neither knows the other exists. Swoop sees both.
              </p>
            </div>

            {/* Inline Fix It action — Pillar 2 */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap p-4 bg-gradient-to-r from-success-500/[0.06] to-success-500/[0.02] border border-success-500/20 rounded-xl">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-success-600 dark:text-success-400">
                  Recommended Action
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-white/90 mt-0.5">
                  Deploy ranger to Hole {bottleneck.hole} on weekends
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Projected recovery: ${Math.round(leakage.PACE_LOSS * 0.2).toLocaleString()}/mo at 20% slow-round reduction
                </div>
              </div>
              <button
                onClick={() => handleDeployRanger(bottleneck.hole, Math.round(leakage.PACE_LOSS * 0.2))}
                disabled={rangerDeployed}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold cursor-pointer border-none whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  rangerDeployed
                    ? 'bg-success-100 text-success-700 cursor-default'
                    : 'bg-success-500 text-white hover:bg-success-600'
                }`}
              >
                {rangerDeployed ? '✓ Approved' : 'Approve & Deploy →'}
              </button>
            </div>
          </Panel>
        )}

        <AgentUpsell
          agentName="Staffing-Demand Agent"
          benefit="Auto-adjusts coverage to recover"
          metric={`$${leakage.STAFFING_LOSS.toLocaleString()}/mo.`}
        />

        {/* Scenario Slider */}
        <ScenarioSlider
          baseSlowRounds={slowContext.slowRounds || 668}
          dollarPerSlowRound={dollarPerSlowRound}
          staffingRecoveryPotential={leakage.STAFFING_LOSS}
        />

        {/* CTA — with 4-tab preview */}
        <div className="bg-gradient-to-r from-brand-500/10 to-brand-500/5 border border-brand-500/30 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white/90">
                Take this story to the board
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
                The Board Report turns this analysis into a 4-tab executive summary.
              </p>
            </div>
            <button
              onClick={() => navigate('board-report')}
              className="rounded-lg bg-brand-500 text-white px-6 py-3 text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Generate Board Report →
            </button>
          </div>
          {/* 4-tab preview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Summary', icon: '📊', detail: 'Executive overview' },
              { label: 'Member Saves', icon: '🎯', detail: 'Retained members + dues' },
              { label: 'Operational Saves', icon: '⚡', detail: 'Disruptions prevented' },
              { label: 'What We Learned', icon: '💡', detail: 'Patterns + next priorities' },
            ].map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => navigate('board-report', { tab: i })}
                className="bg-white/80 dark:bg-white/[0.04] border border-brand-500/20 rounded-lg p-2.5 text-left cursor-pointer hover:border-brand-500/50 transition-colors"
              >
                <div className="text-sm">{tab.icon}</div>
                <div className="text-[11px] font-bold text-gray-800 dark:text-white/90 mt-0.5">{tab.label}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{tab.detail}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
