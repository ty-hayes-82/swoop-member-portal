import { useNavigation } from '@/context/NavigationContext';
import { isRealClub } from '@/config/constants';
import { getArchetypeSpendGaps } from '@/services/experienceInsightsService';
import { getMemberSummary } from '@/services/memberService';
import { getLeakageData } from '@/services/revenueService';

export default function RevenueSummaryCard() {
  const { navigate } = useNavigation();

  // For real clubs, don't show demo revenue data
  if (isRealClub()) {
    const memberSummary = getMemberSummary();
    const duesAtRisk = memberSummary.potentialDuesAtRisk || 0;
    if (duesAtRisk === 0) return null; // No revenue data yet
  }

  const leakage = getLeakageData();
  if (!leakage) return null;

  const spendTotal = getArchetypeSpendGaps().reduce((s, a) => s + a.totalUntapped, 0);
  const spendMonthly = Math.round(spendTotal / 12);
  const memberSummary = getMemberSummary();
  const duesAtRisk = memberSummary.potentialDuesAtRisk || 868000;
  const duesMonthly = Math.round(duesAtRisk / 12);
  const totalOpportunity = leakage.TOTAL + spendMonthly + duesMonthly;

  const topAction = {
    label: 'Deploy rangers to holes 4, 8, 12, 16 on weekends',
    impact: `+$${leakage.PACE_LOSS.toLocaleString()}/mo`,
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="text-[11px] font-bold text-success-500 uppercase tracking-wide">
          Revenue Snapshot
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <div>
            <div className="text-xs text-gray-400">Total addressable opportunity</div>
            <div className="text-2xl font-bold font-mono text-gray-800 dark:text-white/90">
              ${totalOpportunity.toLocaleString()}<span className="text-sm text-gray-400">/mo</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-right">
            ${(totalOpportunity * 12).toLocaleString()}/yr
          </div>
        </div>

        <div className="flex items-center justify-between py-1.5 px-2.5 bg-success-500/[0.024] border border-success-500/[0.12] rounded-lg gap-2">
          <div className="text-xs text-gray-500">
            Top action: <span className="text-gray-800 dark:text-white/90 font-semibold">{topAction.label}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('revenue')}
          className="py-2 px-4 text-xs font-bold text-brand-500 bg-brand-500/[0.03] border border-brand-500/20 rounded-xl cursor-pointer text-center"
        >
          Explore full breakdown in Revenue →
        </button>
      </div>
    </div>
  );
}
