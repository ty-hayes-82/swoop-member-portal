// MorningBriefing — printable daily sheet GMs can hand to department heads.
import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { getDailyBriefing } from '@/services/briefingService';
import { getAtRiskMembers } from '@/services/memberService';

export default function MorningBriefing() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({
    results: false, actions: false, members: false, staffing: false, notes: false,
  });
  const briefing = getDailyBriefing();
  const atRisk = getAtRiskMembers();

  const handlePrint = () => window.print();
  const toggleSection = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const SectionHeader = ({ label, colorCls, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex justify-between items-center w-full py-1.5 border-none bg-transparent cursor-pointer text-left"
    >
      <div className={`text-[11px] font-bold tracking-widest uppercase ${colorCls}`}>
        {label}
      </div>
      <span className={`text-base ${colorCls}`}>{collapsed[sectionKey] ? '\uFF0B' : '\u2212'}</span>
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-none bg-blue-light-500 text-white flex items-center gap-2 shadow-theme-sm transition-opacity duration-150 hover:bg-blue-light-600"
      >
        \uD83D\uDDA8 Print Today's Briefing
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-8">
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-auto shadow-theme-xl">
            {/* Print header */}
            <div className="px-8 py-6 border-b-2 border-blue-light-500 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[22px] font-normal text-gray-900">
                    Oakmont Hills CC
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Morning Operations Briefing \u00B7 Saturday, January 17, 2026
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="px-4 py-2 rounded-md text-sm font-semibold cursor-pointer border-none bg-blue-light-500 text-white">
                    Print / Save PDF
                  </button>
                  <button onClick={() => setOpen(false)} className="px-3.5 py-2 rounded-md text-sm cursor-pointer border border-gray-300 bg-transparent text-gray-500">
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 flex flex-col gap-5">
              {/* Yesterday summary */}
              <section>
                <SectionHeader label="Yesterday's Results" colorCls="text-blue-light-500" sectionKey="results" />
                {!collapsed.results && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3.5 text-sm leading-relaxed text-gray-900">
                    Revenue <strong>${briefing.yesterdayRecap.revenue.toLocaleString()}</strong> \u2014 {briefing.yesterdayRecap.revenueVsPlan > 0 ? '\u25B2' : '\u25BC'} {Math.abs(briefing.yesterdayRecap.revenueVsPlan)}% vs. plan
                    {briefing.yesterdayRecap.revenueVsLastWeek && (
                      <>, {briefing.yesterdayRecap.revenueVsLastWeek > 0 ? '\u25B2' : '\u25BC'} {Math.abs(briefing.yesterdayRecap.revenueVsLastWeek).toFixed(1)}% vs. last Sat</>
                    )}.
                    {' '}{briefing.yesterdayRecap.rounds} rounds completed
                    {briefing.yesterdayRecap.roundsVsLastWeek && (
                      <> ({briefing.yesterdayRecap.roundsVsLastWeek > 0 ? '+' : ''}{briefing.yesterdayRecap.roundsVsLastWeek} vs. last Sat)</>
                    )}.
                    {briefing.yesterdayRecap.incidents.length > 0 && (
                      <span className="text-error-500"> {briefing.yesterdayRecap.incidents.length} issue{briefing.yesterdayRecap.incidents.length > 1 ? 's' : ''} to follow up on.</span>
                    )}
                  </div>
                )}
              </section>

              {/* Priority Actions */}
              <section>
                <SectionHeader label="Priority Actions \u2014 Do These First" colorCls="text-success-500" sectionKey="actions" />
                {!collapsed.actions && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    {(briefing.quickWins || []).map((win, idx) => (
                      <div key={win.id} className={`pb-2.5 ${idx < briefing.quickWins.length - 1 ? 'mb-2.5 border-b border-gray-200' : ''}`}>
                        <div className="text-sm font-semibold text-gray-900 mb-1">{win.icon} {win.title}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{win.detail}</div>
                        <div className="text-[11px] text-success-500 font-semibold mt-1">
                          Impact: {win.impact} \u00B7 Effort: {win.effort}
                          {win.conversionRate && <> \u00B7 {win.conversionRate}% conversion</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Watch list */}
              <section>
                <SectionHeader label="Members Needing Attention Today" colorCls="text-error-500" sectionKey="members" />
                {!collapsed.members && atRisk.filter(m => m.score < 40).map(m => (
                  <div key={m.memberId} className="border-b border-gray-200 py-2.5 flex justify-between">
                    <div>
                      <MemberLink memberId={m.memberId} className="text-sm font-semibold text-gray-900">{m.name}</MemberLink>
                      <div className="text-xs text-gray-500 mt-0.5">{m.topRisk}</div>
                    </div>
                    <div className="text-xs text-error-500 font-semibold shrink-0 ml-4 mt-1">Action needed</div>
                  </div>
                ))}
              </section>

              {/* Staffing */}
              <section>
                <SectionHeader label="Staffing & Weather" colorCls="text-blue-light-600" sectionKey="staffing" />
                {!collapsed.staffing && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3.5 text-sm text-gray-900 leading-relaxed">
                    <div>Weather: <strong>{briefing.todayRisks.conditionsText || briefing.todayRisks.weather}</strong>
                      {briefing.todayRisks.tempHigh && <> \u2014 {briefing.todayRisks.tempHigh}\u00B0F</>}
                      {briefing.todayRisks.gusts > 0 && <>, {briefing.todayRisks.gusts > briefing.todayRisks.wind ? `${briefing.todayRisks.wind}\u2013${briefing.todayRisks.gusts}` : briefing.todayRisks.wind} mph wind</>}
                      {briefing.todayRisks.precipProb > 0 && <>, {briefing.todayRisks.precipProb}% rain</>}
                    </div>
                    {briefing.todayRisks.forecast && (
                      <div className="mt-1 text-sm text-gray-500">{briefing.todayRisks.forecast}</div>
                    )}
                    <div className="mt-1">
                      {briefing.todayRisks.staffingGaps.length === 0
                        ? <span className="text-success-500">\u2713 All positions fully staffed</span>
                        : <span className="text-error-500">\u26A0 Gap: {briefing.todayRisks.staffingGaps.join(', ')}</span>}
                    </div>
                  </div>
                )}
              </section>

              {/* Notes */}
              <section>
                <SectionHeader label="Department Head Notes" colorCls="text-gray-500" sectionKey="notes" />
                {!collapsed.notes && ['Golf Operations', 'F&B', 'Membership', 'Grounds'].map(dept => (
                  <div key={dept} className="border-b border-gray-200 py-3 flex items-center gap-3">
                    <div className="text-sm text-gray-500 w-[120px] shrink-0">{dept}</div>
                    <div className="flex-1 border-b border-gray-300 h-5" />
                  </div>
                ))}
              </section>

              <div className="text-[11px] text-gray-400 text-center border-t border-gray-200 pt-4">
                Oakmont Hills CC \u00B7 Powered by Swoop Golf Intelligence \u00B7 Demo Environment
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
