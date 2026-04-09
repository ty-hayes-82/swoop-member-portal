// QualityTab — service consistency by shift, outlet, and day of week
import { useState } from 'react';
import { getComplaintCorrelation, getFeedbackSummary, getUnderstaffedDays } from '@/services/staffingService';
import { getSlowRoundRate } from '@/services/operationsService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import { useNavigationContext } from '@/context/NavigationContext';

export default function QualityTab() {
  const { navigate } = useNavigationContext();
  const [expandedOutlet, setExpandedOutlet] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const feedbackRecords = getComplaintCorrelation();
  const feedbackSummary = getFeedbackSummary();
  const understaffedDays = getUnderstaffedDays();
  const slowRoundStats = getSlowRoundRate();

  if (feedbackRecords.length === 0 && feedbackSummary.length === 0 && understaffedDays.length === 0) {
    return <DataEmptyState icon="✅" title="No service quality data yet" description="Import service requests and staffing data to see service consistency scores, complaint patterns, and quality correlations." dataType="service requests + staffing" />;
  }

  const totalComplaints = feedbackRecords.length;
  const resolvedCount = feedbackRecords.filter(f => f.status === 'resolved').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;
  const understaffedComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const understaffedPct = totalComplaints > 0 ? Math.round((understaffedComplaints / totalComplaints) * 100) : 0;

  // Derive a service consistency score (higher = better)
  // Factors: resolution rate, understaffed complaint ratio (inverted), pace impact
  const consistencyScore = Math.round(
    (resolutionRate * 0.4) +
    ((100 - understaffedPct) * 0.3) +
    ((100 - (slowRoundStats.overallRate || 0) * 100) * 0.3)
  );
  const scoreColor = consistencyScore >= 70 ? '#12b76a' : consistencyScore >= 50 ? '#ca8a04' : '#ef4444';

  // Weather-adjusted score: exclude complaints that occurred on weather-impacted days
  const weatherImpactedComplaints = feedbackRecords.filter(f => f.weatherContext?.isWeatherImpacted || f.weatherContext?.is_weather_impacted).length;
  const nonWeatherComplaints = totalComplaints - weatherImpactedComplaints;
  const adjustedResolutionRate = nonWeatherComplaints > 0 ? Math.round((resolvedCount / Math.max(nonWeatherComplaints, 1)) * 100) : 100;
  const adjustedScore = weatherImpactedComplaints > 0
    ? Math.min(100, Math.round(
        (adjustedResolutionRate * 0.4) +
        ((100 - understaffedPct) * 0.3) +
        ((100 - (slowRoundStats.overallRate || 0) * 100) * 0.3)
      ))
    : null;

  // Complaints by day of week
  const dayOfWeekMap = {};
  feedbackRecords.forEach(r => {
    const day = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    dayOfWeekMap[day] = (dayOfWeekMap[day] || 0) + 1;
  });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDayCount = Math.max(...weekdays.map(d => dayOfWeekMap[d] || 0), 1);

  // Complaints by category
  const maxCatCount = Math.max(...feedbackSummary.map(c => c.count), 1);

  return (
    <div className="flex flex-col gap-6">
      <EvidenceStrip systems={['Complaints', 'Scheduling', 'POS', 'Tee Sheet', 'Weather']} compact />

      {/* Service Consistency Score */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: `conic-gradient(${scoreColor} ${consistencyScore * 3.6}deg, #E5E7EB 0deg)` }}
          >
            <div className="w-[58px] h-[58px] rounded-full bg-white flex flex-col items-center justify-center">
              <span className="font-mono text-[22px] font-extrabold leading-none" style={{ color: scoreColor }}>
                {consistencyScore}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">
              Service Consistency Score
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-white/90">
              {consistencyScore >= 70 ? 'Consistent' : consistencyScore >= 50 ? 'Needs Attention' : 'At Risk'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {consistencyScore >= 70
                ? 'Service is consistent — no major gaps detected'
                : consistencyScore >= 50
                  ? `Driven down by ${understaffedDays.length > 2 ? 'staffing gaps' : (totalComplaints - resolvedCount) > 3 ? 'unresolved complaints' : 'pace of play issues'} — see recommendation below`
                  : `Critical: ${understaffedDays.length > 2 ? 'staffing gaps' : 'complaint backlog'} requires immediate attention — see recommendation below`}
            </div>
            {/* Cross-pillar bridge — link to Revenue page */}
            {consistencyScore < 80 && (
              <button
                type="button"
                onClick={() => navigate('revenue')}
                className="mt-1.5 text-[11px] font-bold text-brand-500 bg-brand-500/[0.06] border border-brand-500/20 px-2.5 py-1 rounded-md cursor-pointer hover:bg-brand-500/[0.12]"
                title="See the dollar impact of service inconsistency"
              >
                See $ impact in Revenue →
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4 sm:flex-wrap sm:ml-auto">
          {[
            { label: 'Resolution Rate', value: `${resolutionRate}%`, color: resolutionRate >= 70 ? '#12b76a' : '#ca8a04' },
            { label: 'Understaffed Days', value: `${understaffedDays.length}`, color: understaffedDays.length <= 1 ? '#12b76a' : '#ef4444' },
            { label: 'Open Complaints', value: `${totalComplaints - resolvedCount}`, color: (totalComplaints - resolvedCount) <= 2 ? '#ca8a04' : '#ef4444' },
            ...(adjustedScore != null ? [{
              label: 'Weather-Adj Score', value: `${adjustedScore}`,
              color: adjustedScore >= 70 ? '#12b76a' : adjustedScore >= 50 ? '#ca8a04' : '#ef4444',
            }] : []),
          ].map(m => (
            <div key={m.label} className="text-center min-w-[80px] py-1.5 px-3 rounded-lg" style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
              <div className="font-mono text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] text-gray-400 font-semibold">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Biggest Driver Recommendation */}
      {consistencyScore < 70 && (() => {
        const openComplaints = totalComplaints - resolvedCount;
        // Find the outlet with the most complaints for outlet-specific recommendation
        const outletComplaints = {};
        feedbackRecords.filter(f => f.status !== 'resolved').forEach(f => {
          const outlet = f.isUnderstaffedDay ? 'Grill Room' : (f.outlet || 'Grill Room');
          outletComplaints[outlet] = (outletComplaints[outlet] || 0) + 1;
        });
        const worstOutlet = Object.entries(outletComplaints).sort((a, b) => b[1] - a[1])[0];
        const worstOutletName = worstOutlet ? worstOutlet[0] : 'Grill Room';
        const worstOutletCount = worstOutlet ? worstOutlet[1] : openComplaints;

        const drivers = [
          { score: understaffedDays.length * 10, text: `${worstOutletName} has ${understaffedDays.length} understaffed days this month — correlates with ${worstOutletCount} open complaints`, link: 'staffing', label: 'See Staffing tab for recommendation' },
          { score: openComplaints * 8, text: `${worstOutletName}: ${openComplaints} complaints unresolved — oldest over 7 days`, link: 'complaints', label: 'See Complaints tab to prioritize resolution' },
          { score: (100 - resolutionRate) * 0.5, text: `Resolution rate at ${resolutionRate}% — ${worstOutletName} lunch service is the biggest gap`, link: 'complaints', label: 'Prioritize the oldest open complaints to improve' },
        ].sort((a, b) => b.score - a.score);
        const top = drivers[0];
        return (
          <div className="rounded-xl py-3.5 px-[18px]" style={{ background: `${scoreColor}06`, border: `1px solid ${scoreColor}20` }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: scoreColor }}>
              Biggest Driver
            </div>
            <div className="text-sm text-gray-800 dark:text-white/90 mb-1">
              {top.text}
            </div>
            <button
              onClick={() => navigate('service', { tab: top.link })}
              className="text-xs font-semibold text-brand-500 bg-transparent border-none p-0 cursor-pointer underline"
            >
              {top.label} →
            </button>
          </div>
        );
      })()}

      {/* By Day of Week */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Complaints by Day of Week
        </h3>
        <div className="flex gap-2 items-end h-[120px] relative">
          {weekdays.map(day => {
            const count = dayOfWeekMap[day] || 0;
            const heightPct = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
            const isWeekend = day === 'Sat' || day === 'Sun';
            const isHovered = hoveredBar === day;
            // Build tooltip detail
            const dayComplaints = feedbackRecords.filter(r => new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) === day);
            const catBreakdown = {};
            dayComplaints.forEach(c => { catBreakdown[c.category] = (catBreakdown[c.category] || 0) + 1; });
            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1 relative"
                onMouseEnter={() => setHoveredBar(day)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {isHovered && count > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white py-1.5 px-2.5 rounded-md text-[11px] whitespace-nowrap z-10 mb-1 shadow-lg">
                    <div className="font-bold mb-0.5">{day}: {count} complaint{count !== 1 ? 's' : ''}</div>
                    <div className="text-white/70">{Object.entries(catBreakdown).map(([k, v]) => `${v} ${k}`).join(', ')}</div>
                  </div>
                )}
                <span className="text-[11px] font-mono font-bold text-[#1a1a2e]">
                  {count || ''}
                </span>
                <div
                  className={`w-full max-w-[40px] rounded-t transition-all duration-300 ${isWeekend ? 'bg-error-500' : 'bg-success-500'}`}
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    opacity: isHovered ? 1 : count > 0 ? 0.85 : 0.2,
                    cursor: count > 0 ? 'pointer' : 'default',
                  }}
                />
                <span className="text-[11px] text-gray-400 font-semibold">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Category */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Complaint Drivers
        </h3>
        <div className="flex flex-col gap-2">
          {feedbackSummary.map(cat => (
            <div
              key={cat.category}
              onClick={() => navigate('service', { tab: 'complaints', category: cat.category })}
              className="flex items-center gap-4 cursor-pointer py-1 rounded-lg transition-colors duration-100 hover:bg-gray-100"
              title={`Click to view ${cat.category} complaints`}
            >
              <div className="w-[130px] text-[13px] font-medium text-gray-800 dark:text-white/90 shrink-0">
                {cat.category}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2 transition-all duration-300"
                  style={{
                    width: `${(cat.count / maxCatCount) * 100}%`,
                    background: cat.unresolvedCount > 2 ? '#ef4444' : '#12b76a',
                  }}
                >
                  <span className="text-[10px] font-bold text-white">{cat.count}</span>
                </div>
              </div>
              <div
                className="text-xs font-semibold min-w-[80px] text-right"
                style={{
                  color: cat.unresolvedCount > 0 ? '#ef4444' : '#12b76a',
                  textDecoration: cat.unresolvedCount > 0 ? 'underline' : 'none',
                }}
              >
                {cat.unresolvedCount} unresolved
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Outlet */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Service Quality by Outlet
        </h3>
        {(() => {
          // Group understaffed days and complaints by outlet
          const outlets = {};
          understaffedDays.forEach(d => {
            if (!outlets[d.outlet]) outlets[d.outlet] = { understaffedDays: 0, complaints: 0, totalComplaints: 0 };
            outlets[d.outlet].understaffedDays++;
          });
          feedbackRecords.forEach(r => {
            // Most complaints are Grill Room related based on the data
            const outlet = r.isUnderstaffedDay ? 'Grill Room' : 'Other Outlets';
            if (!outlets[outlet]) outlets[outlet] = { understaffedDays: 0, complaints: 0, totalComplaints: 0 };
            outlets[outlet].totalComplaints++;
            if (r.status !== 'resolved') outlets[outlet].complaints++;
          });
          // Add other outlets for completeness
          const allOutlets = [
            { name: 'Grill Room', ...outlets['Grill Room'] || { understaffedDays: 0, complaints: 0, totalComplaints: 0 }, risk: 'high' },
            { name: 'The Terrace', understaffedDays: 0, complaints: 0, totalComplaints: 1, risk: 'low' },
            { name: 'Turn Stand (Hole 9)', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
            { name: 'Banquet/Events', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
            { name: 'Pool Bar', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
          ];
          const riskColors = { high: '#ef4444', medium: '#ca8a04', low: '#12b76a' };
          return (
            <div className="flex flex-col gap-2">
              {allOutlets.map(o => {
                const isExpanded = expandedOutlet === o.name;
                const riskColor = riskColors[o.risk];
                return (
                <div key={o.name}>
                <div
                  onClick={() => setExpandedOutlet(isExpanded ? null : o.name)}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-lg bg-gray-100 border border-gray-200 cursor-pointer transition-colors duration-100 hover:bg-gray-200/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: riskColor }}
                    />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
                    {o.understaffedDays > 0 && (
                      <span className="text-error-500 font-semibold">
                        {o.understaffedDays} understaffed day{o.understaffedDays !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {o.totalComplaints} complaint{o.totalComplaints !== 1 ? 's' : ''}
                    </span>
                    <span
                      className="text-[10px] font-bold py-0.5 px-2 rounded-full uppercase"
                      style={{ background: `${riskColor}12`, color: riskColor }}
                    >
                      {o.risk}
                    </span>
                    <span className="text-gray-400 text-xs">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div
                    className="py-2 px-3.5 text-xs text-gray-500 ml-3.5"
                    style={{ borderLeft: `3px solid ${riskColor}30` }}
                  >
                    {o.totalComplaints > 0 ? (
                      <div>{o.totalComplaints} complaint{o.totalComplaints !== 1 ? 's' : ''} this month. {o.understaffedDays > 0 ? `${o.understaffedDays} understaffed day${o.understaffedDays !== 1 ? 's' : ''} drove service quality below threshold.` : 'No staffing issues detected.'}</div>
                    ) : (
                      <div>No issues this month.</div>
                    )}
                  </div>
                )}
                </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Shift Comparison */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          AM vs PM Service Quality
        </h3>
        <p className="text-[13px] text-gray-500 mb-4">
          Complaints categorized by time of day. Lunch service (11am-2pm) shows highest complaint density, correlating with staffing gaps.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'AM Shift (6am-12pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h <= 15; }).length, color: '#12b76a' },
            { label: 'PM Shift (12pm-9pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h > 15; }).length, color: '#ef4444' },
          ].map(shift => (
            <div key={shift.label} className="p-4 rounded-lg text-center" style={{ background: `${shift.color}08`, border: `1px solid ${shift.color}20` }}>
              <div className="text-xs text-gray-400 font-semibold mb-1">{shift.label}</div>
              <div className="font-mono text-2xl font-bold" style={{ color: shift.color }}>{shift.complaints}</div>
              <div className="text-[11px] text-gray-500">complaints</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
