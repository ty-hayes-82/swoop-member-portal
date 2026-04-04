import { useMemo } from 'react';
import { getLiveDashboard } from '@/services/memberService';
import { isRealClub } from '@/config/constants';

const STATIC_INTERVENTIONS = [
  { date: 'Mar 8', action: 'Recovery outreach sent to Sarah Mitchell via Swoop app', outcome: 'Response received Mar 9', impact: 'Health score 38 \u2192 52', status: 'resolved' },
  { date: 'Mar 6', action: 'Staffing gap alert \u2014 added server to Grill Room Friday shift', outcome: 'Average check held at $47 (vs $28 prior understaffed Friday)', impact: '$3,400 revenue protected', status: 'resolved' },
  { date: 'Mar 4', action: 'Cancellation risk \u2014 proactive rebooking for 3 members', outcome: '2 of 3 rebooked within 24 hours', impact: '2 tee times filled, $624 in green fees', status: 'partial' },
];

const STATUS_CLS = {
  resolved: 'text-success-500 border-l-success-500',
  partial: 'text-warning-500 border-l-warning-500',
  pending: 'text-gray-500 border-l-gray-400',
};

export default function RecentInterventions() {
  const live = getLiveDashboard();

  const interventions = useMemo(() => {
    if (!live?.recentInterventions?.length) return isRealClub() ? [] : STATIC_INTERVENTIONS;
    return live.recentInterventions.map(r => {
      const scoreDelta = r.scoreBefore && r.scoreAfter
        ? `Health score ${r.scoreBefore} \u2192 ${r.scoreAfter}`
        : r.duesProtected ? `$${Number(r.duesProtected).toLocaleString()} protected` : '';
      return {
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        action: `${r.type}: ${r.memberName} \u2014 ${r.description?.slice(0, 80) || 'Intervention logged'}`,
        outcome: r.outcome || 'Monitoring for outcome',
        impact: scoreDelta,
        status: r.isSave ? 'resolved' : r.scoreAfter > r.scoreBefore ? 'partial' : 'pending',
      };
    });
  }, [live]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold dark:text-gray-400">Prove It</div>
          <div className="text-lg font-bold text-gray-800 dark:text-white/90">Recent Interventions</div>
        </div>
        <div className="text-[11px] font-bold text-success-500 bg-success-50 px-2.5 py-1 rounded-full dark:bg-success-500/15">
          {interventions.length} action{interventions.length !== 1 ? 's' : ''} this week
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {interventions.map((item, i) => (
          <div key={i} className={`flex gap-3 items-start px-3 py-2.5 bg-gray-100 rounded-lg border-l-[3px] dark:bg-gray-800 ${STATUS_CLS[item.status] || 'border-l-gray-400'}`}>
            <div className="text-[11px] font-mono text-gray-500 shrink-0 min-w-[42px] pt-0.5 dark:text-gray-400">
              {item.date}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800 leading-snug dark:text-white/90">{item.action}</div>
              <div className="text-xs text-gray-600 mt-0.5 dark:text-gray-400">{item.outcome}</div>
              {item.impact && (
                <div className={`text-xs font-bold mt-1 ${STATUS_CLS[item.status]?.split(' ')[0] || 'text-gray-500'}`}>
                  {item.impact}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
