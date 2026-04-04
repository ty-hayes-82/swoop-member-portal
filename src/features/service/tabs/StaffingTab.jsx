// StaffingTab — staffing-to-demand intelligence
// Addresses #2 survey demand: "Better staffing to match real demand" (60%)
// 4/4 survey respondents would act on "Add server based on weather + demand"
import { useState } from 'react';
import { isAuthenticatedClub } from '@/config/constants';
import { getUnderstaffedDays, getComplaintCorrelation } from '@/services/staffingService';
import { getDailyBriefing } from '@/services/briefingService';
import { getDailyForecast } from '@/services/weatherService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import MemberLink from '@/components/MemberLink';

export default function StaffingTab() {
  const [expandedDay, setExpandedDay] = useState(null);
  const briefing = getDailyBriefing();
  const understaffedDays = getUnderstaffedDays();
  const feedbackRecords = getComplaintCorrelation();

  if (isAuthenticatedClub() && understaffedDays.length === 0 && feedbackRecords.length === 0) {
    return <DataEmptyState icon="📋" title="No staffing data yet" description="Import staffing and shift data to see coverage gaps, demand forecasting, and complaint correlation." dataType="staffing" />;
  }

  const totalComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const avgComplaintMultiplier = understaffedDays.length > 0
    ? (understaffedDays.reduce((sum, day) => sum + day.complaintMultiplier, 0) / understaffedDays.length).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col gap-6">

      {/* Tomorrow's Staffing Risk — most actionable cross-domain insight */}
      <div style={{
        background: `linear-gradient(135deg, ${'#E8740C'}08, ${'#E8740C'}02)`,
        border: `1px solid ${'#E8740C'}30`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <span className="text-[28px] shrink-0">📋</span>
          <div className="flex-1">
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#E8740C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Tomorrow's Staffing Risk
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
              {briefing?.todayRisks?.demandForecast?.recommendation
                || 'Saturday: Grill Room needs 4 servers — only 2 scheduled'}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, marginBottom: '16px' }}>
              {briefing?.todayRisks?.demandForecast
                ? <>Based on {briefing.todayRisks.demandForecast.expectedRounds} expected rounds
                  ({briefing?.teeSheet?.roundsToday || 220} booked × {briefing.todayRisks.demandForecast.golfModifier} weather factor)
                  {briefing.todayRisks.demandForecast.weatherSummary !== 'No weather disruptions — standard demand expected'
                    && <> — {briefing.todayRisks.demandForecast.weatherSummary}</>}.
                  On similar days with 2 servers, complaints increased {avgComplaintMultiplier}x.</>
                : <>Based on {briefing?.teeSheet?.roundsToday || 220} booked rounds + weather forecast + 1 private dining event.
                  On similar days with 2 servers, complaints increased {avgComplaintMultiplier}x and ticket times rose 20%.</>}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: '8px',
              background: '#E8740C', color: '#fff',
              fontSize: '14px', fontWeight: 600,
              cursor: 'pointer',
            }}>
              Add server to Saturday schedule
            </div>
          </div>
        </div>
      </div>

      {/* Understaffing = Inconsistent Service */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">
          Understaffing Drives Service Inconsistency
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <MetricCard label="Understaffed Days (Jan)" value={String(understaffedDays.length)} sublabel="Grill Room lunch service" />
          <MetricCard label="Complaint Spike" value={`${avgComplaintMultiplier}x higher`} sublabel={`${totalComplaints} complaints on those days`} />
          <MetricCard label="Ticket Time Impact" value="+20%" sublabel="Average increase when short-staffed" />
        </div>
      </div>

      {/* Understaffed Days Detail */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
          Understaffed Days — January 2026
        </h3>
        <div className="flex flex-col gap-2">
          {understaffedDays.map((day, idx) => {
            const isExpanded = expandedDay === day.date;
            const dayComplaints = feedbackRecords.filter(f => f.date === day.date && f.isUnderstaffedDay);
            return (
            <div key={idx}>
            <div
              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
              style={{
                padding: '16px',
                background: '#F3F4F6',
                borderRadius: '8px',
                border: `1px solid ${'#E5E7EB'}`,
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${'#E5E7EB'}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>{isExpanded ? '▾' : '▸'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-gray-500">{day.outlet} Lunch</span>
                    {day.weather?.conditions && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: '999px',
                        color: (day.weather.conditions === 'sunny' || day.weather.conditions === 'clear' || day.weather.conditions === 'perfect')
                          ? '#ca8a04' : '#2563eb' || '#3B82F6',
                        background: (day.weather.conditions === 'sunny' || day.weather.conditions === 'clear' || day.weather.conditions === 'perfect')
                          ? '#ca8a0412' : `${'#2563eb' || '#3B82F6'}12`,
                      }}>
                        {day.weather.conditions}{day.weather.highTemp ? ` ${day.weather.highTemp}°F` : ''}
                        {day.weather.wind ? `, ${day.weather.wind}mph` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#ef4444',
                  background: `${'#ef4444'}10`, padding: '3px 10px', borderRadius: '999px',
                }}>
                  {day.scheduledStaff}/{day.requiredStaff} servers
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: 13, color: '#6B7280' }}>
                <div>
                  Ticket time: <strong style={{ color: '#1a1a2e' }}>+{(day.ticketTimeIncrease * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  Complaints: <strong style={{ color: '#1a1a2e' }}>{day.complaintMultiplier.toFixed(1)}x higher</strong>
                </div>
                <div>
                  Service impact: <strong className="text-error-500">Degraded</strong>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div style={{ padding: '8px 14px 12px', borderLeft: `3px solid ${'#ef4444'}30`, marginLeft: 14, fontSize: 13 }}>
                <div className="font-semibold text-gray-800 dark:text-white/90 mb-1.5">
                  {dayComplaints.length} complaint{dayComplaints.length !== 1 ? 's' : ''} filed on this day:
                </div>
                {dayComplaints.length > 0 ? dayComplaints.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${'#E5E7EB'}` }}>
                    <span>
                      <MemberLink mode="drawer" memberId={c.memberId} style={{ fontWeight: 600, color: '#E8740C', textDecoration: 'none' }}>
                        {c.memberName || c.memberId}
                      </MemberLink>
                      <span className="text-gray-400"> — {c.category}</span>
                    </span>
                    <span className="text-[11px] text-gray-400">{c.status}</span>
                  </div>
                )) : <div className="text-gray-400">No individual complaints recorded for this date.</div>}
              </div>
            )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Staffing-to-Satisfaction Correlation */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
          Staffing-to-Satisfaction Correlation
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B7280', margin: 0, marginBottom: '16px' }}>
          <strong style={{ color: '#1a1a2e' }}>{totalComplaints} of {feedbackRecords.length} complaints</strong>{' '}
          occurred on understaffed days. When the Grill Room runs with 2-3 servers instead of 4, service complaints increase {avgComplaintMultiplier}x.
        </p>
        <div style={{
          background: `linear-gradient(135deg, ${'#22c55e'}08, ${'#22c55e'}02)`,
          border: `1px solid ${'#22c55e'}30`,
          borderRadius: '8px',
          padding: '16px',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <span className="text-lg">💡</span>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: '#6B7280' }}>
            <strong style={{ color: '#1a1a2e' }}>Recommendation:</strong>{' '}
            Maintain 4-server minimum for Grill Room lunch on high-demand days (Wed-Sat). This eliminates the primary driver of service inconsistency.
          </div>
        </div>
      </div>

      {/* 7-Day Staffing Outlook */}
      {(() => {
        const dailyForecast = getDailyForecast(7);
        if (!dailyForecast?.length) return null;

        return (
          <div style={{
            background: '#ffffff',
            border: `1px solid ${'#E5E7EB'}`,
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">
              7-Day Weather & Demand Outlook
            </h3>
            <div className="flex flex-col gap-1">
              {dailyForecast.map((day, i) => {
                const gusts = day.gusts || day.wind || 0;
                const precipProb = day.precipProb || 0;
                const hasRisk = gusts > 15 || precipProb > 40 || (day.high || 72) < 45;
                const dateStr = day.date
                  ? new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  : `Day ${i + 1}`;

                return (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: hasRisk ? `${'#f59e0b'}08` : '#F3F4F6',
                    borderRadius: '8px', border: `1px solid ${hasRisk ? '#f59e0b' + '30' : '#E5E7EB'}`,
                  }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', width: 120 }}>
                        {dateStr}
                      </span>
                      <span className="text-xs text-gray-500">
                        {day.conditionsText || day.conditions || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#6B7280' }}>
                      <span>{day.high || '—'}°F</span>
                      <span style={{ color: gusts > 15 ? '#f59e0b' : undefined }}>
                        {gusts > 0 ? `${gusts}mph` : '—'}
                      </span>
                      <span style={{ color: precipProb > 40 ? '#f59e0b' : undefined }}>
                        {precipProb}% rain
                      </span>
                      {hasRisk && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#f59e0b',
                          background: `${'#f59e0b'}12`, padding: '2px 6px', borderRadius: '999px',
                        }}>
                          Demand shift
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function MetricCard({ label, value, sublabel }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.4 }}>{sublabel}</div>}
    </div>
  );
}
