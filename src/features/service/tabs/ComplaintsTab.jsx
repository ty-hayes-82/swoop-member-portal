// ComplaintsTab — complaint patterns, resolution status, and understaffed-day correlation
import { useState, useEffect } from 'react';
import { isAuthenticatedClub } from '@/config/constants';
import { useNavigationContext } from '@/context/NavigationContext';
import { getComplaintCorrelation, getFeedbackSummary } from '@/services/staffingService';
import { getPaceFBImpact } from '@/services/operationsService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import MemberLink from '@/components/MemberLink';

const STATUS_STYLES = {
  resolved: { bg: `${'#22c55e'}12`, color: '#22c55e', label: 'Resolved' },
  in_progress: { bg: '#ca8a0412', color: '#ca8a04', label: 'In Progress' },
  acknowledged: { bg: `${'#2563eb' || '#3B82F6'}12`, color: '#2563eb' || '#3B82F6', label: 'Acknowledged' },
  escalated: { bg: `${'#ef4444'}12`, color: '#ef4444', label: 'Escalated' },
};

const STATUS_FILTERS = [
  { key: null, label: 'All' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ComplaintsTab() {
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const feedbackRecords = getComplaintCorrelation();

  if (isAuthenticatedClub() && feedbackRecords.length === 0) {
    return <DataEmptyState icon="📝" title="No complaint data yet" description="Import feedback data from your CRM to track complaints, resolution rates, and service patterns." dataType="feedback" />;
  }

  // Accept category filter from Quality tab drill-down
  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.category) setCategoryFilter(routeIntent.category);
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  let filteredComplaints = feedbackRecords;
  if (statusFilter) filteredComplaints = filteredComplaints.filter(f => f.status === statusFilter);
  else filteredComplaints = filteredComplaints.filter(f => f.status !== 'resolved');
  if (categoryFilter) filteredComplaints = filteredComplaints.filter(f => f.category === categoryFilter);

  const openComplaints = filteredComplaints;
  const understaffedComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const paceFB = getPaceFBImpact();
  const { fastConversionRate, slowConversionRate } = paceFB;
  const conversionDrop = ((fastConversionRate - slowConversionRate) / fastConversionRate * 100).toFixed(0);

  return (
    <div className="flex flex-col gap-6">

      {/* Status + Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.key)}
            className={`py-1 px-3.5 rounded-full text-xs font-semibold cursor-pointer border ${
              statusFilter === f.key
                ? 'border-brand-500 bg-brand-500/[0.07] text-brand-500'
                : 'border-gray-200 bg-transparent text-gray-400'
            }`}
          >
            {f.label} ({f.key ? feedbackRecords.filter(r => r.status === f.key).length : feedbackRecords.filter(r => r.status !== 'resolved').length})
          </button>
        ))}
        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter(null)}
            className="py-1 px-3.5 rounded-full text-xs font-semibold cursor-pointer border border-brand-500 bg-brand-500/[0.07] text-brand-500"
          >
            Category: {categoryFilter} ×
          </button>
        )}
      </div>

      {/* Root Cause Pattern Summary */}
      {understaffedComplaints > 0 && (
        <div className="rounded-xl py-3.5 px-[18px] bg-error-500/[0.04] border border-error-500/20">
          <div className="text-xs font-bold text-error-500 uppercase tracking-wide mb-1.5">
            Root Cause Pattern
          </div>
          <div className="text-sm text-gray-800 dark:text-white/90 mb-1">
            {understaffedComplaints} of {feedbackRecords.length} complaints occurred on understaffed days
          </div>
          <div className="text-xs text-gray-500">
            Service Speed complaints correlate with understaffed shifts — {conversionDrop}% lower dining conversion on slow-pace days
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90 m-0">
            {statusFilter === 'resolved' ? 'Resolved' : 'Open'} Complaints ({openComplaints.length})
          </h3>
          <div className="text-xs text-gray-400">
            {feedbackRecords.length} total this month
          </div>
        </div>

        {openComplaints.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">
            All complaints resolved.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {openComplaints.map(complaint => {
              const daysSince = Math.round((new Date('2026-01-31') - new Date(complaint.date)) / (1000 * 60 * 60 * 24));
              const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES.acknowledged;
              return (
                <div
                  key={complaint.id}
                  className={`p-4 bg-gray-100 rounded-lg flex justify-between items-center flex-wrap gap-2 ${daysSince > 7 ? 'border border-error-500/30' : 'border border-gray-200'}`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} className="font-semibold text-[#1a1a2e] text-sm">
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span className="font-semibold text-[#1a1a2e] text-sm">
                          Member {complaint.memberId}
                        </span>
                      )}
                      {complaint.isUnderstaffedDay && (
                        <span className="text-[10px] font-bold text-error-500 bg-error-500/[0.07] py-0.5 px-1.5 rounded-full">
                          Understaffed day
                        </span>
                      )}
                      {daysSince <= 3 && (
                        <span className="text-[10px] font-bold text-[#ca8a04] bg-[#ca8a0412] py-0.5 px-1.5 rounded-full">
                          High-demand day
                        </span>
                      )}
                      {(complaint.weatherContext?.isWeatherImpacted || complaint.weatherContext?.is_weather_impacted) && (
                        <span
                          className="text-[10px] font-bold text-blue-600 bg-blue-600/[0.07] py-0.5 px-1.5 rounded-full"
                          title={complaint.weatherContext?.impactReason || complaint.weatherContext?.impact_reason || ''}
                        >
                          Weather: {complaint.weatherContext?.impactReason || complaint.weatherContext?.impact_reason || 'Weather impact'}
                        </span>
                      )}
                      {!complaint.weatherContext && complaint.category === 'Pace of Play' && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-600/[0.07] py-0.5 px-1.5 rounded-full">
                          Weather impact
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {complaint.category} — {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysSince > 7 && (
                      <span className="text-[11px] font-bold text-error-500">
                        {daysSince}d open
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold py-0.5 px-2.5 rounded-full"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Resolved — shows resolution tracking */}
      {(() => {
        const resolved = feedbackRecords.filter(f => f.status === 'resolved' && f.resolved_date);
        if (resolved.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
              Recently Resolved ({resolved.length})
            </h3>
            <div className="flex flex-col gap-2">
              {resolved.map(complaint => (
                <div
                  key={complaint.id}
                  className="p-4 bg-gray-100 rounded-lg border border-success-500/20 flex justify-between items-center flex-wrap gap-2"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} className="font-semibold text-[#1a1a2e] text-sm">
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span className="font-semibold text-[#1a1a2e] text-sm">Member {complaint.memberId}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {complaint.category} — Filed {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[11px] font-semibold text-success-500">
                      Resolved {new Date(complaint.resolved_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      by {complaint.resolved_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Understaffed Day Correlation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Understaffed Day Correlation
        </h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="font-mono text-4xl font-extrabold text-error-500 leading-none">
              {understaffedComplaints}/{feedbackRecords.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              complaints occurred on understaffed days
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm leading-relaxed text-gray-500">
              <strong className="text-[#1a1a2e]">{Math.round((understaffedComplaints / feedbackRecords.length) * 100)}%</strong> of all complaints
              are linked to days when the Grill Room was understaffed. Staffing is the single biggest driver of service inconsistency.
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Drivers */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Complaint Drivers
        </h3>
        <div className="flex flex-col gap-1">
          {getFeedbackSummary().map(cat => (
            <div
              key={cat.category}
              className="flex justify-between items-center p-2 bg-gray-100 rounded-lg text-sm"
            >
              <div className="text-gray-800 dark:text-white/90 font-medium">{cat.category}</div>
              <div className="flex items-center gap-4 text-[13px] text-gray-500">
                <div>{cat.count} complaints</div>
                <div className="font-semibold" style={{ color: cat.unresolvedCount > 0 ? '#ef4444' : '#22c55e' }}>
                  {cat.unresolvedCount} unresolved
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Conditions Breakdown */}
      {(() => {
        const weatherComplaints = feedbackRecords.filter(f => f.weatherContext?.isWeatherImpacted || f.weatherContext?.is_weather_impacted);
        if (weatherComplaints.length === 0) return null;
        const byCondition = weatherComplaints.reduce((acc, f) => {
          const cond = f.weatherContext?.conditions || f.weatherContext?.impactReason || 'Unknown';
          acc[cond] = (acc[cond] || 0) + 1;
          return acc;
        }, {});
        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
              Complaints by Weather Condition
            </h3>
            <div className="text-[13px] text-gray-500 mb-4">
              {weatherComplaints.length} of {feedbackRecords.length} complaints ({Math.round(weatherComplaints.length / feedbackRecords.length * 100)}%) occurred on weather-impacted days
            </div>
            <div className="flex flex-col gap-1">
              {Object.entries(byCondition).sort((a, b) => b[1] - a[1]).map(([cond, count]) => (
                <div
                  key={cond}
                  className="flex justify-between items-center p-2 bg-gray-100 rounded-lg text-sm"
                >
                  <div className="text-gray-800 dark:text-white/90 font-medium">{cond}</div>
                  <div className="text-[13px] text-gray-500">{count} complaints</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Pace Impact on Dining */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
          Pace Impact on Post-Round Dining
        </h3>
        <p className="text-sm leading-relaxed text-gray-500 mb-4">
          When rounds exceed 4.5 hours, post-round dining conversion drops <strong className="text-error-500">{conversionDrop}%</strong> — from{' '}
          {(fastConversionRate * 100).toFixed(0)}% to {(slowConversionRate * 100).toFixed(0)}%. Slow pace is a service quality issue that directly impacts member satisfaction.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg text-center bg-success-500/[0.08] border border-success-500/20">
            <div className="text-[11px] text-gray-400 font-semibold mb-1">Under 4.5 hrs</div>
            <div className="font-mono text-2xl font-bold text-success-500">{(fastConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dine after round</div>
          </div>
          <div className="p-4 rounded-lg text-center bg-error-500/[0.08] border border-error-500/20">
            <div className="text-[11px] text-gray-400 font-semibold mb-1">Over 4.5 hrs</div>
            <div className="font-mono text-2xl font-bold text-error-500">{(slowConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dine after round</div>
          </div>
        </div>
      </div>
    </div>
  );
}
