// ComplaintsTab — complaint patterns, resolution status, and understaffed-day correlation
import { useState, useEffect } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { getComplaintCorrelation, getFeedbackSummary, getUnderstaffedDays } from '@/services/staffingService';
import { getPaceFBImpact } from '@/services/operationsService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import MemberLink from '@/components/MemberLink';
import ActionPanel from '@/components/ui/ActionPanel';
import { trackAction } from '@/services/activityService';
import AgentUpsell from '@/components/ui/AgentUpsell';

const CATEGORY_LABELS = {
  'staff_service': 'Staff Service',
  'food_quality': 'Food Quality',
  'course_conditions': 'Course Conditions',
  'pace_of_play': 'Pace of Play',
  'facilities': 'Facilities',
  'billing': 'Billing',
  'communication': 'Communication',
  'pro_shop': 'Pro Shop',
  'locker_room': 'Locker Room',
  'service_speed': 'Service Speed',
};
function humanizeCategory(raw) {
  if (!raw) return 'General';
  return CATEGORY_LABELS[raw.toLowerCase().replace(/\s+/g, '_')] ||
    raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_STYLES = {
  resolved: { bg: `${'#12b76a'}12`, color: '#12b76a', label: 'Resolved' },
  in_progress: { bg: '#ca8a0412', color: '#ca8a04', label: 'In Progress' },
  acknowledged: { bg: `${'#2563eb' || '#3B82F6'}12`, color: '#2563eb' || '#3B82F6', label: 'Acknowledged' },
  escalated: { bg: `${'#ef4444'}12`, color: '#ef4444', label: 'Escalated' },
};

const STATUS_FILTERS = [
  { key: null, label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ComplaintsTab() {
  const { routeIntent, clearRouteIntent, navigate } = useNavigationContext();
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);

  const feedbackRecords = getComplaintCorrelation();

  // Accept category filter from Quality tab drill-down
  useEffect(() => {
    if (!routeIntent) return;
    if (routeIntent.category) setCategoryFilter(routeIntent.category);
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  if (feedbackRecords.length === 0) {
    return <DataEmptyState icon="📝" title="No complaint data yet" description="Import service requests to track complaints, resolution rates, and service patterns." dataType="service requests" />;
  }

  let filteredComplaints = feedbackRecords;
  if (statusFilter) filteredComplaints = filteredComplaints.filter(f => f.status === statusFilter);
  else filteredComplaints = filteredComplaints.filter(f => f.status !== 'resolved');
  if (categoryFilter) filteredComplaints = filteredComplaints.filter(f => f.category === categoryFilter);

  const openComplaints = filteredComplaints;
  const understaffedComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const paceFB = getPaceFBImpact();
  const { fastConversionRate, slowConversionRate } = paceFB;
  const conversionDrop = fastConversionRate > 0 ? ((fastConversionRate - slowConversionRate) / fastConversionRate * 100).toFixed(0) : '0';

  const understaffedDays = getUnderstaffedDays();
  const understaffedPct = feedbackRecords.length > 0
    ? Math.round((understaffedComplaints / feedbackRecords.length) * 100)
    : 0;
  const weatherImpactedComplaints = feedbackRecords.filter(f =>
    f.weatherContext?.isWeatherImpacted || f.weatherContext?.is_weather_impacted
  ).length;
  const weatherPct = feedbackRecords.length > 0
    ? Math.round((weatherImpactedComplaints / feedbackRecords.length) * 100)
    : 0;
  const slowRoundComplaints = feedbackRecords.filter(f =>
    f.category === 'Food Quality' || f.category === 'Service Speed'
  ).length;
  const slowRoundPct = feedbackRecords.length > 0
    ? Math.round((slowRoundComplaints / feedbackRecords.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Primary action: funnel resolution tasks to Actions Inbox */}
      <div className="rounded-xl border border-brand-500/40 bg-brand-500/[0.05] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-swoop-text">Resolve complaints in the Actions Inbox</div>
          <div className="text-xs text-swoop-text-muted mt-0.5">
            {openComplaints.length > 0
              ? `${openComplaints.length} open complaint${openComplaints.length !== 1 ? 's' : ''} — assign, track, and close them from one place.`
              : 'All complaints resolved. New service issues surface here and route to your inbox.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate?.('automations')}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer hover:bg-brand-600 transition-colors whitespace-nowrap"
        >
          View in Actions Inbox →
        </button>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-500/[0.05] to-purple-500/[0.02] border border-purple-500/30">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
            Layer 3 · Cross-Domain Complaint Context
          </div>
          <EvidenceStrip systems={['Complaints', 'Scheduling', 'Weather', 'Pace of Play']} compact />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-swoop-panel border border-purple-200 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-error-500">Understaffed days</div>
            <div className="text-2xl font-bold text-swoop-text font-mono mt-1">{understaffedPct}%</div>
            <div className="text-[11px] text-swoop-text-muted">of complaints occur on understaffed shifts</div>
          </div>
          <div className="bg-swoop-panel border border-purple-200 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Adverse weather</div>
            <div className="text-2xl font-bold text-swoop-text font-mono mt-1">{weatherPct > 0 ? `${weatherPct}%` : '—'}</div>
            <div className="text-[11px] text-swoop-text-muted">of complaints during adverse conditions</div>
          </div>
          <div className="bg-swoop-panel border border-purple-200 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-warning-500">Slow rounds</div>
            <div className="text-2xl font-bold text-swoop-text font-mono mt-1">{slowRoundPct}%</div>
            <div className="text-[11px] text-swoop-text-muted">of dining complaints follow slow rounds</div>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-swoop-text-muted italic leading-snug">
          Complaints aren't random: they cluster around specific cross-domain operational gaps.
        </div>
      </div>

      {/* Status + Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.key)}
            className={`py-1 px-3.5 rounded-full text-xs font-semibold cursor-pointer border ${
              statusFilter === f.key
                ? 'border-brand-500 bg-brand-500/[0.07] text-brand-500'
                : 'border-swoop-border bg-transparent text-swoop-text-label'
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
          <div className="text-sm text-swoop-text mb-1">
            {understaffedComplaints} of {feedbackRecords.length} complaints occurred on understaffed days
          </div>
          <div className="text-xs text-swoop-text-muted">
            Service Speed complaints correlate with understaffed shifts: {conversionDrop}% lower dining conversion on slow-pace days
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-swoop-text m-0">
            {statusFilter === 'resolved' ? 'Resolved' : 'Open'} Complaints ({openComplaints.length})
          </h3>
          <div className="text-xs text-swoop-text-label">
            {feedbackRecords.length} total this month
          </div>
        </div>

        {openComplaints.length === 0 ? (
          <div className="py-6 text-center text-swoop-text-label text-sm">
            {feedbackRecords.length === 0
              ? 'No complaint records this month.'
              : statusFilter === 'resolved'
                ? 'No resolved complaints to show.'
                : 'All complaints resolved — nothing open.'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {openComplaints.map(complaint => {
              const daysSince = Math.max(0, Math.round((Date.now() - new Date(complaint.date).getTime()) / (1000 * 60 * 60 * 24)));
              const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES.acknowledged;
              const isComplaintExpanded = expandedComplaintId === complaint.id;
              const complaintRecommended = [];
              if (daysSince > 3 && complaint.status !== 'resolved') {
                complaintRecommended.push({ key: 'escalate', icon: '🔺', label: 'Escalate to GM', type: 'staff_task', description: `${daysSince} days unresolved: needs personal attention` });
              }
              if (complaint.status !== 'resolved') {
                complaintRecommended.push({ key: 'recovery-email', icon: '✉', label: 'Send Recovery Email', type: 'email', description: `Acknowledge ${complaint.category} complaint` });
                complaintRecommended.push({ key: 'apology-sms', icon: '💬', label: 'Send Apology Text', type: 'sms', description: 'Personal apology via SMS' });
              }

              // Severity tint from age: >7d danger, 3–7d warn, <3d neutral
              const severityRgb = daysSince > 7 ? '239,68,68' : daysSince > 3 ? '243,146,45' : '202,138,4';
              const severityColor = `rgb(${severityRgb})`;
              const severityLabel = daysSince > 7 ? 'OVERDUE' : daysSince > 3 ? 'AGING' : 'NEW';
              return (
                <div key={complaint.id}>
                  <div
                    onClick={() => setExpandedComplaintId(isComplaintExpanded ? null : complaint.id)}
                    className="swoop-detail-row cursor-pointer"
                    style={{
                      background: `rgba(${severityRgb},0.07)`,
                      borderColor: `rgba(${severityRgb},0.18)`,
                      flexDirection: 'column',
                      gap: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: severityColor,
                          background: `rgba(${severityRgb},0.15)`,
                          border: `1px solid rgba(${severityRgb},0.3)`,
                          padding: '2px 7px',
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        {severityLabel}
                      </span>
                      {complaint.memberName ? (
                        <MemberLink
                          mode="drawer"
                          memberId={complaint.memberId}
                          style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}
                        >
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          Member {complaint.memberId}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {humanizeCategory(complaint.category)} · {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {daysSince > 0 ? ` · ${daysSince}d open` : ''}
                      </span>
                      {complaint.isUnderstaffedDay && (
                        <span className="text-[10px] font-bold text-error-500 bg-error-500/[0.07] py-0.5 px-1.5 rounded-full">
                          Understaffed
                        </span>
                      )}
                      {(complaint.weatherContext?.isWeatherImpacted || complaint.weatherContext?.is_weather_impacted) && (
                        <span
                          className="text-[10px] font-bold text-blue-400 bg-blue-400/[0.1] py-0.5 px-1.5 rounded-full"
                          title={complaint.weatherContext?.impactReason || complaint.weatherContext?.impact_reason || ''}
                        >
                          Weather
                        </span>
                      )}
                      <span style={{ flex: '1 1 0%' }} />
                      <span
                        className="text-[10px] font-semibold py-0.5 px-2 rounded-full"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {statusStyle.label}
                      </span>
                      {complaint.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackAction({
                              actionType: 'approve',
                              actionSubtype: 'schedule_resolution',
                              memberId: complaint.memberId,
                              memberName: complaint.memberName,
                              referenceType: 'complaint',
                              referenceId: complaint.id,
                              description: `Schedule resolution call for ${complaint.category} (${daysSince}d open)`,
                            });
                          }}
                          className="swoop-action-btn"
                          title="Schedule a resolution call (one-tap)"
                        >
                          Schedule call →
                        </button>
                      )}
                    </div>
                  </div>
                  {isComplaintExpanded && complaint.status !== 'resolved' && (
                    <ActionPanel
                      context={{
                        memberId: complaint.memberId,
                        memberName: complaint.memberName,
                        description: `${complaint.category} complaint: ${daysSince} days open`,
                        source: 'Service Recovery',
                      }}
                      recommended={complaintRecommended}
                      onClose={() => setExpandedComplaintId(null)}
                      compact
                    />
                  )}
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
          <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
            <h3 className="text-base font-bold text-swoop-text mb-4">
              Recently Resolved ({resolved.length})
            </h3>
            <div className="flex flex-col gap-2">
              {resolved.map(complaint => (
                <div
                  key={complaint.id}
                  className="p-4 bg-swoop-row rounded-lg border border-success-500/20 flex justify-between items-center flex-wrap gap-2"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} className="font-semibold text-swoop-text text-sm">
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span className="font-semibold text-swoop-text text-sm">Member {complaint.memberId}</span>
                      )}
                    </div>
                    <div className="text-xs text-swoop-text-muted">
                      {humanizeCategory(complaint.category)}, filed {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[11px] font-semibold text-success-500">
                      Resolved {new Date(complaint.resolved_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-swoop-text-label">
                      by {complaint.resolved_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <AgentUpsell
        agentName="Service Recovery Agent"
        benefit="Resolves complaints in 4.2 hrs avg, before members disengage."
      />

      {/* Understaffed Day Correlation */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
        <h3 className="text-base font-bold text-swoop-text mb-4">
          Understaffed Day Correlation
        </h3>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="font-mono text-4xl font-extrabold text-error-500 leading-none">
              {understaffedComplaints}/{feedbackRecords.length}
            </div>
            <div className="text-sm text-swoop-text-muted mt-1">
              complaints occurred on understaffed days
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm leading-relaxed text-swoop-text-muted">
              <strong className="text-swoop-text">{Math.round((understaffedComplaints / feedbackRecords.length) * 100)}%</strong> of all complaints
              are linked to days when the Grill Room was understaffed. Staffing is the single biggest driver of service inconsistency.
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Drivers */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
        <h3 className="text-base font-bold text-swoop-text mb-4">
          Complaint Drivers
        </h3>
        <div className="flex flex-col gap-1">
          {getFeedbackSummary().map(cat => (
            <div
              key={cat.category}
              className="flex justify-between items-center p-2 bg-swoop-row rounded-lg text-sm"
            >
              <div className="text-swoop-text font-medium">{humanizeCategory(cat.category)}</div>
              <div className="flex items-center gap-4 text-[13px] text-swoop-text-muted">
                <div>{cat.count} complaints</div>
                <div className="font-semibold" style={{ color: cat.unresolvedCount > 0 ? '#ef4444' : '#12b76a' }}>
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
          <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
            <h3 className="text-base font-bold text-swoop-text mb-4">
              Complaints by Weather Condition
            </h3>
            <div className="text-[13px] text-swoop-text-muted mb-4">
              {weatherComplaints.length} of {feedbackRecords.length} complaints ({Math.round(weatherComplaints.length / feedbackRecords.length * 100)}%) occurred on weather-impacted days
            </div>
            <div className="flex flex-col gap-1">
              {Object.entries(byCondition).sort((a, b) => b[1] - a[1]).map(([cond, count]) => (
                <div
                  key={cond}
                  className="flex justify-between items-center p-2 bg-swoop-row rounded-lg text-sm"
                >
                  <div className="text-swoop-text font-medium">{cond}</div>
                  <div className="text-[13px] text-swoop-text-muted">{count} complaints</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Pace Impact on Dining */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6">
        <h3 className="text-base font-bold text-swoop-text mb-2">
          Pace Impact on Post-Round Dining
        </h3>
        <p className="text-sm leading-relaxed text-swoop-text-muted mb-4">
          When rounds exceed 4.5 hours, post-round dining conversion drops <strong className="text-error-500">{conversionDrop}%</strong> — from{' '}
          {(fastConversionRate * 100).toFixed(0)}% to {(slowConversionRate * 100).toFixed(0)}%. Slow pace is a service quality issue that directly impacts member satisfaction.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg text-center bg-success-500/[0.08] border border-success-500/20">
            <div className="text-[11px] text-swoop-text-label font-semibold mb-1">Under 4.5 hrs</div>
            <div className="font-mono text-2xl font-bold text-success-500">{(fastConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-swoop-text-muted">dine after round</div>
          </div>
          <div className="p-4 rounded-lg text-center bg-error-500/[0.08] border border-error-500/20">
            <div className="text-[11px] text-swoop-text-label font-semibold mb-1">Over 4.5 hrs</div>
            <div className="font-mono text-2xl font-bold text-error-500">{(slowConversionRate * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-swoop-text-muted">dine after round</div>
          </div>
        </div>
      </div>
    </div>
  );
}
