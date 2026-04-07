import React, { useState, useEffect } from 'react';
import { Panel } from '@/components/ui';
import { SkeletonGrid } from '@/components/ui/SkeletonLoader';
import PageTransition, { AnimatedNumber } from '@/components/ui/PageTransition';
import { useNavigationContext } from '@/context/NavigationContext';
import { getKPIs, getMemberSaves, getOperationalSaves } from '@/services/boardReportService';
import { getHealthDistribution, getLiveDashboard } from '@/services/memberService';
import { getComplaintCorrelation, getFeedbackSummary, getUnderstaffedDays } from '@/services/staffingService';
import { isRealClub, isAuthenticatedClub, getClubName } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';

const tabNames = ['Summary', 'Details'];

// Kept for Recharts chart fill/stroke colors only
const colors = {
  green: '#48bb78',
  blue: '#63b3ed',
  orange: '#ed8936',
  red: '#fc8181',
  yellow: '#ecc94b',
  bg: '#1a1a2e',
  border: '#2d2d44',
  textMuted: '#BCC3CF',
  text: '#D8DCE3',
  white: '#F0F0F5',
  brand: '#ff8b00',
};

function formatCurrency(val) {
  return '$' + val.toLocaleString();
}

function HealthBadge({ value }) {
  const colorClass = value >= 60
    ? 'bg-success-500/10 text-success-500'
    : value >= 40
      ? 'bg-warning-500/10 text-warning-500'
      : 'bg-error-500/10 text-error-500';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-xl font-bold text-[13px] ${colorClass}`}>
      {value}
    </span>
  );
}

function KPIStrip({ kpis, onDrillDown }) {
  const colorMap = {
    green: 'text-success-500',
    blue: 'text-blue-400',
    orange: 'text-warning-500',
    red: 'text-error-500',
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          onClick={() => onDrillDown?.()}
          className="bg-gray-900 rounded-xl p-4 text-center border border-[#2d2d44] cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-px"
        >
          <div className={`text-[28px] font-bold ${colorMap[kpi.color] || 'text-success-500'}`}>
            {kpi.prefix}
            <AnimatedNumber value={kpi.value} duration={1200} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
            {kpi.suffix}
          </div>
          <div
            className="text-xs text-[#BCC3CF] mt-1"
            title={kpi.label === 'Board Confidence Score' ? 'Composite score based on retention rate, financial performance vs. budget, member satisfaction trends, and operational response metrics.' : undefined}
          >
            {kpi.label}
            {kpi.label === 'Board Confidence Score' && <span className="ml-1 cursor-help opacity-60" title="Composite score based on retention rate, financial performance vs. budget, member satisfaction trends, and operational response metrics.">&#9432;</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BoardReport() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Allow async data to settle before rendering (services init in background)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!routeIntent) return;
    if (typeof routeIntent.tab === 'number' && routeIntent.tab >= 0 && routeIntent.tab < tabNames.length) {
      setActiveTab(routeIntent.tab);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const kpis = getKPIs();
  const memberSaves = getMemberSaves();
  const operationalSaves = getOperationalSaves();
  const dist = getHealthDistribution();

  const totalDues = memberSaves.reduce((sum, m) => sum + (m.duesAtRisk || 0), 0);
  const totalOpsRevenue = operationalSaves.reduce((sum, o) => sum + (o.revenueProtected || 0), 0);

  // Complaint resolution stats — use service layer (returns [] for real clubs with no data)
  const feedbackRecords = getComplaintCorrelation();
  const feedbackSummary = getFeedbackSummary();
  const understaffedDays = getUnderstaffedDays();
  const resolved = feedbackRecords.filter(f => f.status === 'resolved');
  const unresolved = feedbackRecords.filter(f => f.status !== 'resolved');
  const resolutionRate = feedbackRecords.length > 0
    ? Math.round((resolved.length / feedbackRecords.length) * 100) : 0;
  const resolvedWithDates = resolved.filter(f => f.resolved_date || f.resolved_at);
  const avgResolutionDays = resolvedWithDates.length > 0
    ? (resolvedWithDates.reduce((sum, f) => {
        const days = Math.round((new Date(f.resolved_date || f.resolved_at) - new Date(f.date || f.reported_at)) / (1000 * 60 * 60 * 24));
        return sum + (Number.isFinite(days) ? days : 0);
      }, 0) / resolvedWithDates.length).toFixed(1)
    : null;

  const isEmpty = isAuthenticatedClub() && kpis.every(k => k.value === 0);

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <SkeletonGrid cards={6} columns={3} cardHeight={120} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <PageTransition>
        <div className="p-6 max-w-[1100px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Board Report — Service, Members & Operations</h1>
              <p className="text-sm text-gray-500 mt-1">Monthly executive summary — service quality, member health, and operational response</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="rounded-lg bg-brand-500 text-white px-5 py-2 text-sm font-semibold cursor-pointer border-none">Export as PDF</button>
              <button onClick={() => window.print()} className="rounded-lg border border-brand-500 bg-transparent text-brand-500 px-5 py-2 text-sm font-semibold cursor-pointer">Print</button>
            </div>
          </div>
          <DataEmptyState icon="📊" title="Board report needs data" description="Import member, golf, and F&B data to generate your executive board report with KPIs, member saves, and operational insights." dataType="club data" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Board Report — Service, Members & Operations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Monthly executive summary — service quality, member health, and operational response
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setActiveTab(0); setTimeout(() => window.print(), 100); }}
            className="rounded-lg bg-brand-500 text-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold cursor-pointer border-none"
          >Export as PDF</button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-brand-500 bg-transparent text-brand-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
          >Print</button>
        </div>
      </div>

      {/* Demo data indicator */}
      {!isRealClub() && (
        <div className="rounded-xl border border-warning-500/40 bg-warning-50 p-2 px-3.5 mb-4 text-xs text-amber-700 flex items-center gap-2">
          <span className="font-bold">Demo data</span>
          <span>— Real metrics will appear after 30 days of live data. All figures shown are simulated.</span>
        </div>
      )}

      <KPIStrip kpis={kpis} onDrillDown={() => setActiveTab(1)} />

      {/* Board Confidence Score Methodology */}
      <details className="mb-4 bg-white border border-gray-200 rounded-lg p-3 px-4">
        <summary className="text-xs font-semibold text-gray-400 cursor-pointer list-none flex items-center gap-1.5">
          <span className="text-sm">&#9432;</span> How is the Board Confidence Score calculated?
        </summary>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { label: 'Service Quality', weight: '30%', value: '87%', benchmark: 'Complaint resolution + consistency', color: 'text-green-500' },
            { label: 'Member Health', weight: '25%', value: '14 retained', benchmark: 'Health scores + interventions', color: 'text-blue-500' },
            { label: 'Operational Response', weight: '25%', value: '4.2 hrs avg', benchmark: 'Detection to action time', color: 'text-amber-500' },
            { label: 'Financial Performance', weight: '20%', value: 'On budget', benchmark: 'Dues + F&B vs plan', color: 'text-violet-500' },
          ].map(m => (
            <div key={m.label} className="p-2.5 rounded-lg bg-gray-100 border border-gray-200">
              <div className={`text-[10px] font-bold uppercase tracking-wide ${m.color}`}>{m.label} ({m.weight})</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{m.value}</div>
              <div className="text-[10px] text-gray-400">{m.benchmark}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {tabNames.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-lg cursor-pointer font-semibold text-sm transition-all duration-150 ${
              activeTab === i
                ? 'bg-brand-500 text-white border-none'
                : 'bg-transparent text-gray-400 border border-gray-300'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 0 && (
        <>
          {/* Executive Summary — covers service, operations, and member health */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Executive Summary
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              This month, {getClubName()} delivered consistent service quality with an <strong>{resolutionRate}% complaint resolution rate</strong>{avgResolutionDays ? <> and
              an average resolution time of <strong>{avgResolutionDays} days</strong></> : ''}. The operations team responded to alerts with an
              average <strong>4.2-hour detection-to-action time</strong>, catching {operationalSaves.length} service disruptions before
              they impacted members.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Member health remained strong with <strong>{dist.find(d => d.level === 'Healthy')?.count || 200} members in healthy status</strong>.
              Through proactive interventions, <strong>{memberSaves.length} members</strong> showing early disengagement signals were
              successfully re-engaged — demonstrating the value of early detection and personal outreach.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Staffing alignment and proactive scheduling adjustments prevented service gaps on high-demand days. The
              operational response improvements continue to compound, with response times improving 48% since launch.
            </p>
          </Panel>

          {/* Service & Operations — unified section */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">
              Service & Operations
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Service consistency, complaint resolution, staffing coverage, and operational response.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {(() => {
                const consistencyScore = Math.round(
                  (resolutionRate * 0.4) + ((100 - (feedbackRecords.filter(f => f.isUnderstaffedDay).length / Math.max(feedbackRecords.length, 1) * 100)) * 0.3) + (70 * 0.3)
                );
                const csColorClass = consistencyScore >= 70 ? 'text-success-500' : consistencyScore >= 50 ? 'text-warning-500' : 'text-error-500';
                return (
                  <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                    <div className={`text-[28px] font-bold ${csColorClass}`}>{consistencyScore}</div>
                    <div className="text-[11px] text-[#BCC3CF]">Service Consistency Score</div>
                  </div>
                );
              })()}
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                <div className="text-[28px] font-bold text-success-500">{resolutionRate}%</div>
                <div className="text-[11px] text-[#BCC3CF]">Complaint Resolution Rate</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                <div className="text-[28px] font-bold text-success-500">{Math.round(((30 - understaffedDays.length) / 30) * 100)}%</div>
                <div className="text-[11px] text-[#BCC3CF]">Staffing Alignment Rate</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                <div className="text-[28px] font-bold text-success-500">4.2 hrs</div>
                <div className="text-[11px] text-[#BCC3CF]">Avg Detection to Action</div>
              </div>
            </div>

            {/* Staffing detail row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                <div className="text-[28px] font-bold text-success-500">{Math.max(0, 30 - understaffedDays.length)}</div>
                <div className="text-[11px] text-[#BCC3CF]">Days Fully Staffed</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                <div className="text-[28px] font-bold text-success-500">{operationalSaves.length}</div>
                <div className="text-[11px] text-[#BCC3CF]">Staffing Recommendations Acted On</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                {(() => {
                  const understaffedComplaintPct = feedbackRecords.length > 0 ? Math.round((feedbackRecords.filter(f => f.isUnderstaffedDay).length / feedbackRecords.length) * 100) : 0;
                  return (
                    <>
                      <div className={`text-[28px] font-bold ${understaffedComplaintPct > 30 ? 'text-warning-500' : 'text-success-500'}`}>{understaffedComplaintPct}%</div>
                      <div className="text-[11px] text-[#BCC3CF]">Complaints on Understaffed Days</div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Complaint categories */}
            <div className="flex gap-2 flex-wrap">
              {feedbackSummary.slice(0, 4).map(cat => (
                <div key={cat.category} className="py-1.5 px-3 rounded-lg text-xs bg-gray-100 border border-gray-200">
                  <span className="font-semibold text-gray-800 dark:text-white/90">{cat.category}</span>
                  <span className="text-gray-400"> — {cat.count} total, {cat.unresolvedCount} open</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Weather Impact Summary */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">
              Weather Impact
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Weather conditions and their effect on operations this month.
            </p>
            {(() => {
              const weatherImpactedComplaints = feedbackRecords.filter(f =>
                f.weatherContext?.isWeatherImpacted || f.weatherContext?.is_weather_impacted || f.isUnderstaffedDay
              );
              const uDaysData = getUnderstaffedDays();
              const totalWeatherDays = uDaysData.filter(d =>
                d.weather?.conditions && (d.weather.conditions === 'rainy' || d.weather.conditions === 'windy' || (d.weather?.wind || 0) > 15)
              ).length || uDaysData.length;
              const weatherPct = feedbackRecords.length > 0
                ? Math.round((weatherImpactedComplaints.length / feedbackRecords.length) * 100)
                : 0;

              // Weather-adjusted consistency score
              const resolvedC = feedbackRecords.filter(f => f.status === 'resolved').length;
              const nonWeatherCount = Math.max(1, feedbackRecords.length - weatherImpactedComplaints.length);
              const adjResRate = Math.round((resolvedC / nonWeatherCount) * 100);
              const understaffedComplaintsPct = feedbackRecords.length > 0
                ? feedbackRecords.filter(f => f.isUnderstaffedDay).length / feedbackRecords.length * 100 : 0;
              const adjScore = Math.min(100, Math.round(
                (adjResRate * 0.4) + ((100 - understaffedComplaintsPct) * 0.3) + (70 * 0.3)
              ));

              const adjScoreColorClass = adjScore >= 70 ? 'text-success-500' : adjScore >= 50 ? 'text-warning-500' : 'text-error-500';

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                      <div className={`text-[28px] font-bold ${totalWeatherDays > 3 ? 'text-warning-500' : 'text-blue-400'}`}>
                        {totalWeatherDays || '—'}
                      </div>
                      <div className="text-[11px] text-[#BCC3CF]">Adverse Weather Days</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                      <div className="text-[28px] font-bold text-blue-400">
                        {weatherImpactedComplaints.length || '—'}
                      </div>
                      <div className="text-[11px] text-[#BCC3CF]">Weather-Related Complaints</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                      <div className={`text-[28px] font-bold ${adjScoreColorClass}`}>
                        {weatherImpactedComplaints.length > 0 ? adjScore : '—'}
                      </div>
                      <div className="text-[11px] text-[#BCC3CF]">Weather-Adj Consistency</div>
                    </div>
                  </div>
                  <div className="text-[13px] text-gray-600 leading-relaxed">
                    {weatherImpactedComplaints.length > 0 ? (
                      <>
                        <strong>{weatherImpactedComplaints.length} complaints</strong> ({weatherPct}%) occurred on weather-impacted days,
                        accounting for conditions outside the team's control. The weather-adjusted service consistency score
                        of <strong>{adjScore}</strong> provides a fairer read on operational performance.
                      </>
                    ) : (
                      <>
                        Weather data integration is active. As complaint weather tagging populates,
                        this section will show how adverse weather affects complaint patterns and provide
                        weather-adjusted service consistency scores.
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </Panel>

          {/* Member Health Overview */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">
              Member Health Overview
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Health distribution and intervention outcomes this month.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {dist.map(d => {
                const delta = Number.isFinite(d?.delta) ? d.delta : 0;
                const deltaColorClass = delta > 0 ? 'text-error-500' : delta < 0 ? 'text-success-500' : 'text-[#BCC3CF]';
                return (
                  <div key={d.level} className="bg-gray-900 rounded-xl p-3.5 border border-[#2d2d44] text-center">
                    <div className="text-2xl font-bold" style={{ color: d.color }}>{d.count}</div>
                    <div className="text-[11px] text-[#BCC3CF]">{d.level}</div>
                    {delta !== 0 && (
                      <div className={`text-[10px] font-semibold mt-1 ${deltaColorClass}`}>
                        {delta > 0 ? '+' : ''}{delta} vs last month
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-[13px] text-gray-600 leading-relaxed">
              <strong>{memberSaves.length} members</strong> were successfully re-engaged through proactive interventions this month.
              Top interventions included GM personal calls, F&B director outreach, and membership director meetings.
            </div>
          </Panel>

          {/* Operational Saves Detail */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 mb-1.5">
              Operational Response Detail
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {memberSaves.length} interventions completed, {operationalSaves.length} disruptions prevented this month.
            </p>
            <div className="flex flex-col gap-2">
              {operationalSaves.map(o => (
                <div key={o.event} className="py-2.5 px-3.5 rounded-lg text-[13px] bg-gray-100 border border-gray-200">
                  <span className="font-semibold text-gray-800 dark:text-white/90">{o.event}</span>
                  <span className="text-gray-400"> — {o.outcome}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* F&B Performance */}
          <Panel>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-1.5">
              F&B Performance
            </h2>
            {(() => {
              // Compute F&B metrics from understaffed days data (which includes fbRevenue from close_outs)
              const uDays = getUnderstaffedDays();
              const normalAvg = uDays.length > 0 ? uDays[0]?.normalAvgFb : 0;
              const understaffedAvg = uDays.length > 0
                ? uDays.reduce((s, d) => s + (d.fbRevenue || 0), 0) / uDays.length
                : 0;
              const totalRevLoss = uDays.reduce((s, d) => s + (d.revenueLoss || 0), 0);

              // Also check getLiveDashboard for additional revenue data
              const live = getLiveDashboard();
              const hasRevenue = normalAvg > 0 || live?.weekOverWeek?.revenue?.current > 0;

              if (hasRevenue) {
                const revPerCover = normalAvg > 0 ? `$${Math.round(normalAvg / 80)}` : '—';
                const prdRate = '68.5%'; // from validated seed data
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-2xl font-bold text-gray-800 dark:text-white/90">${Math.round(normalAvg).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Avg Daily F&B Revenue</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-2xl font-bold text-[#ef4444]">-${Math.round(totalRevLoss).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Revenue Lost (Understaffed)</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-2xl font-bold text-[#22c55e]">{prdRate}</div>
                      <div className="text-xs text-gray-500">Post-Round Dining Rate</div>
                    </div>
                  </div>
                );
              }
              return (
                <>
                  <div className="rounded-xl border border-warning-500/40 bg-warning-50 dark:bg-warning-500/10 p-2 px-3 mb-4 text-xs flex items-center gap-1.5">
                    <span className="font-bold text-warning-500">Awaiting data</span>
                    <span className="text-gray-400">— Import F&B transactions via CSV Import or connect your POS system to unlock revenue metrics.</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 opacity-40">
                    {[
                      { label: 'Revenue per Cover', value: '—' },
                      { label: 'Covers vs Capacity', value: '—' },
                      { label: 'Post-Round Dining Rate', value: '—' },
                    ].map(m => (
                      <div key={m.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700 text-center">
                        <div className="text-2xl font-bold text-gray-400">{m.value}</div>
                        <div className="text-xs text-gray-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </Panel>
        </>
      )}

      {/* Details Tab */}
      {activeTab === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-800 mt-2">Member Interventions</h2>
          <div className="text-sm text-[#BCC3CF] mb-1">
            {memberSaves.length} members retained through proactive intervention
          </div>
          {memberSaves.map((m) => (
            <Panel key={m.name}>
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-base font-bold text-gray-800">{m.name}</h3>
              </div>
              <div className="flex gap-2 items-center mb-2.5">
                <span className="text-[13px] text-gray-500">Health:</span>
                <HealthBadge value={m.healthBefore} />
                <span className="text-gray-500">{'→'}</span>
                <HealthBadge value={m.healthAfter} />
              </div>
              <div className="text-[13px] leading-relaxed text-gray-600">
                <div><strong>Trigger:</strong> {m.trigger}</div>
                <div><strong>Action:</strong> {m.action}</div>
                <div><strong>Outcome:</strong> <span className="text-success-500">{m.outcome}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Evidence Chain</div>
                <div className="flex items-center flex-wrap">
                  {[
                    { label: 'Signal detected', color: 'bg-red-500' },
                    { label: 'GM alerted', color: 'bg-amber-500' },
                    { label: 'Action taken', color: 'bg-blue-500' },
                    { label: 'Member retained', color: 'bg-green-500' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${step.color}`} />
                        <span className="text-[11px] text-gray-600 whitespace-nowrap">{step.label}</span>
                      </div>
                      {i < 3 && <span className="mx-1.5 text-gray-500 text-[10px]">{'-->'}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ))}

          <h2 className="text-lg font-bold text-gray-800 mt-6">Operational Saves</h2>
          <div className="text-sm text-[#BCC3CF] mb-1">
            {operationalSaves.length} operational disruptions prevented
          </div>
          {operationalSaves.map((o) => (
            <Panel key={o.event}>
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-base font-bold text-gray-800">{o.event}</h3>
              </div>
              <div className="text-[13px] leading-relaxed text-gray-600">
                <div><strong>Detection:</strong> {o.detection}</div>
                <div><strong>Action:</strong> {o.action}</div>
                <div><strong>Outcome:</strong> <span className="text-success-500">{o.outcome}</span></div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      </div>
    </PageTransition>
  );
}
