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
          <button key={f.label} onClick={() => setStatusFilter(f.key)} style={{
            padding: '5px 14px', borderRadius: '999px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', border: `1px solid ${statusFilter === f.key ? '#E8740C' : '#E5E7EB'}`,
            background: statusFilter === f.key ? `${'#E8740C'}12` : 'transparent',
            color: statusFilter === f.key ? '#E8740C' : '#9CA3AF',
          }}>{f.label} ({f.key ? feedbackRecords.filter(r => r.status === f.key).length : feedbackRecords.filter(r => r.status !== 'resolved').length})</button>
        ))}
        {categoryFilter && (
          <button onClick={() => setCategoryFilter(null)} style={{
            padding: '5px 14px', borderRadius: '999px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', border: `1px solid ${'#E8740C'}`,
            background: `${'#E8740C'}12`, color: '#E8740C',
          }}>Category: {categoryFilter} ×</button>
        )}
      </div>

      {/* Root Cause Pattern Summary */}
      {understaffedComplaints > 0 && (
        <div style={{
          background: `${'#ef4444'}06`, border: `1px solid ${'#ef4444'}20`,
          borderRadius: '12px', padding: '14px 18px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90 m-0">
            {statusFilter === 'resolved' ? 'Resolved' : 'Open'} Complaints ({openComplaints.length})
          </h3>
          <div className="text-xs text-gray-400">
            {feedbackRecords.length} total this month
          </div>
        </div>

        {openComplaints.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
            All complaints resolved.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {openComplaints.map(complaint => {
              const daysSince = Math.round((new Date('2026-01-31') - new Date(complaint.date)) / (1000 * 60 * 60 * 24));
              const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES.acknowledged;
              return (
                <div key={complaint.id} style={{
                  padding: '16px',
                  background: '#F3F4F6',
                  borderRadius: '8px',
                  border: `1px solid ${daysSince > 7 ? '#ef4444' + '30' : '#E5E7EB'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '8px',
                }}>
                  <div className="flex-1 min-w-[200px]">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                          Member {complaint.memberId}
                        </span>
                      )}
                      {complaint.isUnderstaffedDay && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#ef4444',
                          background: `${'#ef4444'}12`, padding: '2px 6px', borderRadius: '999px',
                        }}>
                          Understaffed day
                        </span>
                      )}
                      {daysSince <= 3 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#ca8a04',
                          background: '#ca8a0412', padding: '2px 6px', borderRadius: '999px',
                        }}>
                          High-demand day
                        </span>
                      )}
                      {(complaint.weatherContext?.isWeatherImpacted || complaint.weatherContext?.is_weather_impacted) && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#2563eb' || '#3B82F6',
                          background: `${'#2563eb' || '#3B82F6'}12`, padding: '2px 6px', borderRadius: '999px',
                        }} title={complaint.weatherContext?.impactReason || complaint.weatherContext?.impact_reason || ''}>
                          Weather: {complaint.weatherContext?.impactReason || complaint.weatherContext?.impact_reason || 'Weather impact'}
                        </span>
                      )}
                      {!complaint.weatherContext && complaint.category === 'Pace of Play' && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#2563eb' || '#3B82F6',
                          background: `${'#2563eb' || '#3B82F6'}12`, padding: '2px 6px', borderRadius: '999px',
                        }}>
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                        {daysSince}d open
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: '999px',
                      background: statusStyle.bg, color: statusStyle.color,
                    }}>
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
          <div style={{
            background: '#ffffff',
            border: `1px solid ${'#E5E7EB'}`,
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
              Recently Resolved ({resolved.length})
            </h3>
            <div className="flex flex-col gap-2">
              {resolved.map(complaint => (
                <div key={complaint.id} style={{
                  padding: '16px',
                  background: '#F3F4F6',
                  borderRadius: '8px',
                  border: `1px solid ${'#22c55e'}20`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '8px',
                }}>
                  <div className="flex-1 min-w-[200px]">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>Member {complaint.memberId}</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {complaint.category} — Filed {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>
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
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Understaffed Day Correlation
        </h3>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap',
        }}>
          <div className="flex-1 min-w-[200px]">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>
              {understaffedComplaints}/{feedbackRecords.length}
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              complaints occurred on understaffed days
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm leading-relaxed text-gray-500">
              <strong style={{ color: '#1a1a2e' }}>{Math.round((understaffedComplaints / feedbackRecords.length) * 100)}%</strong> of all complaints
              are linked to days when the Grill Room was understaffed. Staffing is the single biggest driver of service inconsistency.
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Drivers */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Complaint Drivers
        </h3>
        <div className="flex flex-col gap-1">
          {getFeedbackSummary().map(cat => (
            <div key={cat.category} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px', background: '#F3F4F6', borderRadius: '8px', fontSize: 14,
            }}>
              <div className="text-gray-800 dark:text-white/90 font-medium">{cat.category}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 13, color: '#6B7280' }}>
                <div>{cat.count} complaints</div>
                <div style={{ color: cat.unresolvedCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
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
          <div style={{
            background: '#ffffff',
            border: `1px solid ${'#E5E7EB'}`,
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
              Complaints by Weather Condition
            </h3>
            <div className="text-[13px] text-gray-500 mb-4">
              {weatherComplaints.length} of {feedbackRecords.length} complaints ({Math.round(weatherComplaints.length / feedbackRecords.length * 100)}%) occurred on weather-impacted days
            </div>
            <div className="flex flex-col gap-1">
              {Object.entries(byCondition).sort((a, b) => b[1] - a[1]).map(([cond, count]) => (
                <div key={cond} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px', background: '#F3F4F6', borderRadius: '8px', fontSize: 14,
                }}>
                  <div className="text-gray-800 dark:text-white/90 font-medium">{cond}</div>
                  <div className="text-[13px] text-gray-500">{count} complaints</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Pace Impact on Dining */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
          Pace Impact on Post-Round Dining
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B7280', margin: 0, marginBottom: '16px' }}>
          When rounds exceed 4.5 hours, post-round dining conversion drops <strong className="text-error-500">{conversionDrop}%</strong> — from{' '}
          {(fastConversionRate * 100).toFixed(0)}% to {(slowConversionRate * 100).toFixed(0)}%. Slow pace is a service quality issue that directly impacts member satisfaction.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div style={{ padding: '16px', borderRadius: '8px', background: `${'#22c55e'}08`, border: `1px solid ${'#22c55e'}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 4 }}>Under 4.5 hrs</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{(fastConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dine after round</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '8px', background: `${'#ef4444'}08`, border: `1px solid ${'#ef4444'}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 4 }}>Over 4.5 hrs</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{(slowConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dine after round</div>
          </div>
        </div>
      </div>
    </div>
  );
}
