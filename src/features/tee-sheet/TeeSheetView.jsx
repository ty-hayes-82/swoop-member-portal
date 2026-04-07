import { useState } from 'react';
import { StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge';
import MemberLink from '@/components/MemberLink';
import PageTransition from '@/components/ui/PageTransition';
import { todayTeeSheet, teeSheetSummary } from '@/data/teeSheet';

const healthColor = (score) => {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#ea580c';
  return '#ef4444';
};

const healthLabel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

function AlertCard({ teeTime }) {
  const color = healthColor(teeTime.healthScore);
  const isVip = teeTime.duesAnnual >= 18000;
  return (
    <div className="bg-white rounded-xl border-l-4 p-4 border border-gray-200" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <MemberLink memberId={teeTime.memberId} mode="drawer" className="font-bold text-sm text-gray-800">
              {teeTime.name}
            </MemberLink>
            <span className="text-xs text-gray-400">{teeTime.time} - {teeTime.course}</span>
            {isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">VIP</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm font-bold" style={{ color }}>{teeTime.healthScore}</span>
            <span className="text-[10px] font-semibold" style={{ color }}>{healthLabel(teeTime.healthScore)}</span>
            <ArchetypeBadge archetype={teeTime.archetype} size="xs" />
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${color}15`, color }}>
          {Math.round(teeTime.cancelRisk * 100)}% cancel risk
        </span>
      </div>
      <div className="text-xs text-gray-600 leading-relaxed">
        {teeTime.cartPrep.note}
      </div>
    </div>
  );
}

function CartPrepCard({ teeTime }) {
  const color = healthColor(teeTime.healthScore);
  const isAtRisk = teeTime.healthScore < 50;
  return (
    <div className={`rounded-xl border p-4 ${isAtRisk ? 'bg-red-50/30 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{teeTime.name}</span>
          <span className="text-xs text-gray-400">{teeTime.time}</span>
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>{teeTime.healthScore}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {teeTime.cartPrep.beverage && (
          <div className="flex items-start gap-1.5">
            <span className="text-gray-400 shrink-0">Beverage:</span>
            <span className="text-gray-700 font-medium">{teeTime.cartPrep.beverage}</span>
          </div>
        )}
        {teeTime.cartPrep.snack && (
          <div className="flex items-start gap-1.5">
            <span className="text-gray-400 shrink-0">Snack:</span>
            <span className="text-gray-700 font-medium">{teeTime.cartPrep.snack}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5 sm:col-span-1">
          <span className="text-gray-400 shrink-0">Group:</span>
          <span className="text-gray-700 font-medium">{teeTime.group.join(', ')}</span>
        </div>
      </div>
      {teeTime.cartPrep.note && (
        <div className={`mt-2 text-[11px] leading-relaxed p-2 rounded-lg ${isAtRisk ? 'bg-red-500/5 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-500'}`}>
          {teeTime.cartPrep.note}
        </div>
      )}
    </div>
  );
}

export default function TeeSheetView() {
  const [showCartPrep, setShowCartPrep] = useState(false);
  const atRiskTimes = todayTeeSheet.filter(t => t.healthScore < 50);
  const vipTimes = todayTeeSheet.filter(t => t.duesAnnual >= 18000 && t.healthScore >= 50);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <StoryHeadline
          variant="insight"
          headline="Who's on the course today — and who needs your attention?"
          context={`${teeSheetSummary.totalRounds} rounds booked across ${todayTeeSheet.length} groups. ${atRiskTimes.length} at-risk members playing today. ${teeSheetSummary.weatherTemp}\u00B0F, ${teeSheetSummary.weatherCondition}.`}
        />

        <EvidenceStrip systems={['Tee Sheet', 'Member CRM', 'Weather', 'POS']} />

        {/* At-Risk & VIP Alerts */}
        {atRiskTimes.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-error-500 uppercase tracking-wide mb-2.5">
              At-Risk Members on Course Today ({atRiskTimes.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {atRiskTimes.map(t => <AlertCard key={t.memberId} teeTime={t} />)}
            </div>
          </div>
        )}

        {/* Today's Tee Sheet Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="text-sm font-bold text-gray-800">Today's Tee Sheet</div>
              <div className="text-xs text-gray-400">Friday, January 17, 2026 - {todayTeeSheet.length} groups</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> At Risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Watch</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-200 border border-amber-400" /> VIP</span>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium">Course</th>
                  <th className="px-4 py-2.5 text-left font-medium">Member</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Archetype</th>
                  <th className="px-4 py-2.5 text-center font-medium">Health</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Group</th>
                  <th className="px-4 py-2.5 text-center font-medium hidden lg:table-cell">Cancel Risk</th>
                  <th className="px-4 py-2.5 text-left font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {todayTeeSheet.map((t, i) => {
                  const color = healthColor(t.healthScore);
                  const isAtRisk = t.healthScore < 50;
                  const isVip = t.duesAnnual >= 18000 && t.healthScore >= 50;
                  return (
                    <tr
                      key={`${t.memberId}-${t.time}`}
                      className={`border-t border-gray-100 transition-colors ${isAtRisk ? 'bg-red-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{t.time}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{t.course}</td>
                      <td className="px-4 py-2.5">
                        <MemberLink memberId={t.memberId} mode="drawer" className="font-semibold text-sm text-gray-800 hover:text-brand-500">
                          {t.name}
                        </MemberLink>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <ArchetypeBadge archetype={t.archetype} size="xs" />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-mono font-bold text-xs" style={{ color }}>{t.healthScore}</span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-gray-500 max-w-[200px] truncate">
                        {t.group.join(', ')}
                      </td>
                      <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                        {t.cancelRisk > 0.3 ? (
                          <span className="font-mono text-xs font-bold text-red-500">{Math.round(t.cancelRisk * 100)}%</span>
                        ) : (
                          <span className="font-mono text-xs text-gray-400">{Math.round(t.cancelRisk * 100)}%</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {isAtRisk && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">AT RISK</span>
                          )}
                          {isVip && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">VIP</span>
                          )}
                          {t.group.some(g => g === 'Guest' || g.includes('guest') || g === 'Client' || g.includes('Client')) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">GUEST</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cart Prep Section */}
        <div>
          <button
            onClick={() => setShowCartPrep(!showCartPrep)}
            className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer bg-transparent border-none p-0 mb-3"
          >
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCartPrep ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Cart Prep Recommendations ({todayTeeSheet.length} carts)
          </button>
          {showCartPrep && (
            <div className="flex flex-col gap-3">
              {todayTeeSheet.map(t => <CartPrepCard key={`prep-${t.memberId}`} teeTime={t} />)}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
