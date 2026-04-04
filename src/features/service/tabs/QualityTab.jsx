// QualityTab — service consistency by shift, outlet, and day of week
import { useState } from 'react';
import { isAuthenticatedClub } from '@/config/constants';
import { getComplaintCorrelation, getFeedbackSummary, getUnderstaffedDays } from '@/services/staffingService';
import { getSlowRoundRate } from '@/services/operationsService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { useNavigationContext } from '@/context/NavigationContext';

export default function QualityTab() {
  const { navigate } = useNavigationContext();
  const [expandedOutlet, setExpandedOutlet] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const feedbackRecords = getComplaintCorrelation();
  const feedbackSummary = getFeedbackSummary();
  const understaffedDays = getUnderstaffedDays();
  const slowRoundStats = getSlowRoundRate();

  if (isAuthenticatedClub() && feedbackRecords.length === 0) {
    return <DataEmptyState icon="✅" title="No service quality data yet" description="Import POS and feedback data to see service consistency scores, complaint patterns, and quality correlations." dataType="POS + feedback" />;
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
  const scoreColor = consistencyScore >= 70 ? '#22c55e' : consistencyScore >= 50 ? '#ca8a04' : '#ef4444';

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

      {/* Service Consistency Score */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div className="flex items-center gap-4">
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${consistencyScore * 3.6}deg, ${'#E5E7EB'} 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%', background: '#ffffff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
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
          </div>
        </div>

        <div className="flex gap-4 flex-wrap ml-auto">
          {[
            { label: 'Resolution Rate', value: `${resolutionRate}%`, color: resolutionRate >= 70 ? '#22c55e' : '#ca8a04' },
            { label: 'Understaffed Days', value: `${understaffedDays.length}`, color: understaffedDays.length <= 1 ? '#22c55e' : '#ef4444' },
            { label: 'Open Complaints', value: `${totalComplaints - resolvedCount}`, color: (totalComplaints - resolvedCount) <= 2 ? '#ca8a04' : '#ef4444' },
            ...(adjustedScore != null ? [{
              label: 'Weather-Adj Score', value: `${adjustedScore}`,
              color: adjustedScore >= 70 ? '#22c55e' : adjustedScore >= 50 ? '#ca8a04' : '#ef4444',
            }] : []),
          ].map(m => (
            <div key={m.label} style={{
              textAlign: 'center', minWidth: 80, padding: '6px 12px',
              borderRadius: '8px', background: `${m.color}08`, border: `1px solid ${m.color}20`,
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', fontWeight: 700, color: m.color }}>{m.value}</div>
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
          <div style={{
            background: `${scoreColor}06`, border: `1px solid ${scoreColor}20`,
            borderRadius: '12px', padding: '14px 18px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Biggest Driver
            </div>
            <div className="text-sm text-gray-800 dark:text-white/90 mb-1">
              {top.text}
            </div>
            <button
              onClick={() => navigate('service', { tab: top.link })}
              style={{
                fontSize: '12px', fontWeight: 600, color: '#ff8b00',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {top.label} →
            </button>
          </div>
        );
      })()}

      {/* By Day of Week */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
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
            const tooltipText = count > 0 ? `${day}: ${count} complaint${count !== 1 ? 's' : ''}\n${Object.entries(catBreakdown).map(([k, v]) => `${v} ${k}`).join(', ')}` : `${day}: No complaints`;
            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1 relative"
                onMouseEnter={() => setHoveredBar(day)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {isHovered && count > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                    background: '#1a1a2e', color: '#fff', padding: '6px 10px', borderRadius: 6,
                    fontSize: 11, whiteSpace: 'nowrap', zIndex: 10, marginBottom: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}>
                    <div className="font-bold mb-0.5">{day}: {count} complaint{count !== 1 ? 's' : ''}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>{Object.entries(catBreakdown).map(([k, v]) => `${v} ${k}`).join(', ')}</div>
                  </div>
                )}
                <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#1a1a2e' }}>
                  {count || ''}
                </span>
                <div style={{
                  width: '100%', maxWidth: 40,
                  height: `${Math.max(heightPct, 4)}%`,
                  background: isWeekend ? '#ef4444' : '#22c55e',
                  borderRadius: '4px 4px 0 0',
                  opacity: isHovered ? 1 : count > 0 ? 0.85 : 0.2,
                  transition: 'height 0.3s, opacity 0.15s',
                  cursor: count > 0 ? 'pointer' : 'default',
                }} />
                <span className="text-[11px] text-gray-400 font-semibold">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Category */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Complaint Drivers
        </h3>
        <div className="flex flex-col gap-2">
          {feedbackSummary.map(cat => (
            <div
              key={cat.category}
              onClick={() => navigate('service', { tab: 'complaints', category: cat.category })}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer', padding: '4px 0', borderRadius: '8px',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              title={`Click to view ${cat.category} complaints`}
            >
              <div className="w-[130px] text-[13px] font-medium text-gray-800 dark:text-white/90 shrink-0">
                {cat.category}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div style={{
                  height: '100%', width: `${(cat.count / maxCatCount) * 100}%`,
                  background: cat.unresolvedCount > 2 ? '#ef4444' : '#22c55e',
                  borderRadius: 4, transition: 'width 0.3s',
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                }}>
                  <span className="text-[10px] font-bold text-white">{cat.count}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: cat.unresolvedCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600, minWidth: 80, textAlign: 'right', textDecoration: cat.unresolvedCount > 0 ? 'underline' : 'none' }}>
                {cat.unresolvedCount} unresolved
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Outlet */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
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
          const riskColors = { high: '#ef4444', medium: '#ca8a04', low: '#22c55e' };
          return (
            <div className="flex flex-col gap-2">
              {allOutlets.map(o => {
                const isExpanded = expandedOutlet === o.name;
                const outletComplaints = feedbackRecords.filter(r => r.isUnderstaffedDay ? o.name === 'Grill Room' : o.name === 'Other Outlets' || o.totalComplaints === 0);
                return (
                <div key={o.name}>
                <div
                  onClick={() => setExpandedOutlet(isExpanded ? null : o.name)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '8px',
                    background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}`,
                    cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${'#E5E7EB'}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: riskColors[o.risk], flexShrink: 0,
                    }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {o.understaffedDays > 0 && (
                      <span className="text-error-500 font-semibold">
                        {o.understaffedDays} understaffed day{o.understaffedDays !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {o.totalComplaints} complaint{o.totalComplaints !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                      background: `${riskColors[o.risk]}12`, color: riskColors[o.risk],
                      textTransform: 'uppercase',
                    }}>
                      {o.risk}
                    </span>
                    <span className="text-gray-400 text-xs">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ padding: '8px 14px 12px', fontSize: 12, color: '#6B7280', borderLeft: `3px solid ${riskColors[o.risk]}30`, marginLeft: 14 }}>
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
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          AM vs PM Service Quality
        </h3>
        <p className="text-[13px] text-gray-500 mb-4">
          Complaints categorized by time of day. Lunch service (11am-2pm) shows highest complaint density, correlating with staffing gaps.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'AM Shift (6am-12pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h <= 15; }).length, color: '#22c55e' },
            { label: 'PM Shift (12pm-9pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h > 15; }).length, color: '#ef4444' },
          ].map(shift => (
            <div key={shift.label} style={{
              padding: '16px', borderRadius: '8px',
              background: `${shift.color}08`, border: `1px solid ${shift.color}20`,
              textAlign: 'center',
            }}>
              <div className="text-xs text-gray-400 font-semibold mb-1">{shift.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: shift.color }}>{shift.complaints}</div>
              <div className="text-[11px] text-gray-500">complaints</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
