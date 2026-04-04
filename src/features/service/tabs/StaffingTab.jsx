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
      <div className="rounded-2xl p-6 bg-gradient-to-br from-brand-500/[0.08] to-brand-500/[0.02] border border-brand-500/30">
        <div className="flex items-start gap-4">
          <span className="text-[28px] shrink-0">📋</span>
          <div className="flex-1">
            <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">
              Tomorrow's Staffing Risk
            </div>
            <div className="text-lg font-bold text-[#1a1a2e] mb-2">
              {briefing?.todayRisks?.demandForecast?.recommendation
                || 'Saturday: Grill Room needs 4 servers — only 2 scheduled'}
            </div>
            <div className="text-sm text-gray-500 leading-relaxed mb-4">
              {briefing?.todayRisks?.demandForecast
                ? <>Based on {briefing.todayRisks.demandForecast.expectedRounds} expected rounds
                  ({briefing?.teeSheet?.roundsToday || 220} booked × {briefing.todayRisks.demandForecast.golfModifier} weather factor)
                  {briefing.todayRisks.demandForecast.weatherSummary !== 'No weather disruptions — standard demand expected'
                    && <> — {briefing.todayRisks.demandForecast.weatherSummary}</>}.
                  On similar days with 2 servers, complaints increased {avgComplaintMultiplier}x.</>
                : <>Based on {briefing?.teeSheet?.roundsToday || 220} booked rounds + weather forecast + 1 private dining event.
                  On similar days with 2 servers, complaints increased {avgComplaintMultiplier}x and ticket times rose 20%.</>}
            </div>
            <div className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer">
              Add server to Saturday schedule
            </div>
          </div>
        </div>
      </div>

      {/* Understaffing = Inconsistent Service */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4">
          Understaffing Drives Service Inconsistency
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-6">
          <MetricCard label="Understaffed Days (Jan)" value={String(understaffedDays.length)} sublabel="Grill Room lunch service" />
          <MetricCard label="Complaint Spike" value={`${avgComplaintMultiplier}x higher`} sublabel={`${totalComplaints} complaints on those days`} />
          <MetricCard label="Ticket Time Impact" value="+20%" sublabel="Average increase when short-staffed" />
        </div>
      </div>

      {/* Understaffed Days Detail */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
              className="p-4 bg-gray-100 rounded-lg border border-gray-200 cursor-pointer transition-colors duration-100 hover:bg-gray-200/40"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-semibold text-[#1a1a2e] mb-1">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span className="text-gray-400 text-xs ml-2">{isExpanded ? '▾' : '▸'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-gray-500">{day.outlet} Lunch</span>
                    {day.weather?.conditions && (
                      <span
                        className="text-[10px] font-bold py-0.5 px-1.5 rounded-full"
                        style={{
                          color: (day.weather.conditions === 'sunny' || day.weather.conditions === 'clear' || day.weather.conditions === 'perfect')
                            ? '#ca8a04' : '#2563eb',
                          background: (day.weather.conditions === 'sunny' || day.weather.conditions === 'clear' || day.weather.conditions === 'perfect')
                            ? '#ca8a0412' : '#2563eb12',
                        }}
                      >
                        {day.weather.conditions}{day.weather.highTemp ? ` ${day.weather.highTemp}°F` : ''}
                        {day.weather.wind ? `, ${day.weather.wind}mph` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[13px] font-bold text-error-500 bg-error-500/10 py-0.5 px-2.5 rounded-full">
                  {day.scheduledStaff}/{day.requiredStaff} servers
                </div>
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 text-[13px] text-gray-500">
                <div>
                  Ticket time: <strong className="text-[#1a1a2e]">+{(day.ticketTimeIncrease * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  Complaints: <strong className="text-[#1a1a2e]">{day.complaintMultiplier.toFixed(1)}x higher</strong>
                </div>
                <div>
                  Service impact: <strong className="text-error-500">Degraded</strong>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div className="py-2 px-3.5 text-[13px] ml-3.5 border-l-[3px] border-l-error-500/30">
                <div className="font-semibold text-gray-800 dark:text-white/90 mb-1.5">
                  {dayComplaints.length} complaint{dayComplaints.length !== 1 ? 's' : ''} filed on this day:
                </div>
                {dayComplaints.length > 0 ? dayComplaints.map(c => (
                  <div key={c.id} className="flex justify-between items-center py-1 border-b border-gray-200">
                    <span>
                      <MemberLink mode="drawer" memberId={c.memberId} className="font-semibold text-brand-500 no-underline">
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-2">
          Staffing-to-Satisfaction Correlation
        </h3>
        <p className="text-sm leading-relaxed text-gray-500 mb-4">
          <strong className="text-[#1a1a2e]">{totalComplaints} of {feedbackRecords.length} complaints</strong>{' '}
          occurred on understaffed days. When the Grill Room runs with 2-3 servers instead of 4, service complaints increase {avgComplaintMultiplier}x.
        </p>
        <div className="bg-gradient-to-br from-success-500/[0.08] to-success-500/[0.02] border border-success-500/30 rounded-lg p-4 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div className="text-sm leading-normal text-gray-500">
            <strong className="text-[#1a1a2e]">Recommendation:</strong>{' '}
            Maintain 4-server minimum for Grill Room lunch on high-demand days (Wed-Sat). This eliminates the primary driver of service inconsistency.
          </div>
        </div>
      </div>

      {/* 7-Day Staffing Outlook */}
      {(() => {
        const dailyForecast = getDailyForecast(7);
        if (!dailyForecast?.length) return null;

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                  <div
                    key={i}
                    className={`flex justify-between items-center py-2 px-3 rounded-lg border ${hasRisk ? 'bg-amber-500/[0.08] border-amber-500/30' : 'bg-gray-100 border-gray-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-[#1a1a2e] w-[120px]">
                        {dateStr}
                      </span>
                      <span className="text-xs text-gray-500">
                        {day.conditionsText || day.conditions || '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{day.high || '—'}°F</span>
                      <span className={gusts > 15 ? 'text-amber-500' : ''}>
                        {gusts > 0 ? `${gusts}mph` : '—'}
                      </span>
                      <span className={precipProb > 40 ? 'text-amber-500' : ''}>
                        {precipProb}% rain
                      </span>
                      {hasRisk && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/[0.07] py-0.5 px-1.5 rounded-full">
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
      <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold text-[#1a1a2e] font-mono mb-1">{value}</div>
      {sublabel && <div className="text-xs text-gray-400 leading-snug">{sublabel}</div>}
    </div>
  );
}
