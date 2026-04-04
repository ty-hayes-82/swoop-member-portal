import { useFixItActions } from '@/hooks/useFixItActions';

/**
 * RevenueTracker — cumulative impact display for sidebar / header
 */
export default function RevenueTracker({ compact = false }) {
  const { activeCount, totalPlaybooks, totalRevenueImpact } = useFixItActions();

  const fmt = (n) => n >= 1000
    ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
    : `$${n}`;

  if (compact) {
    return (
      <div className={`px-3 py-3 rounded-xl border ${activeCount > 0 ? 'bg-success-50 border-success-200 dark:bg-success-500/10 dark:border-success-500/30' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
        <div className="text-xs text-gray-500 mb-0.5 dark:text-gray-400">
          {activeCount}/{totalPlaybooks} playbooks active
        </div>
        <div className={`text-base font-mono font-bold ${activeCount > 0 ? 'text-success-500' : 'text-gray-600 dark:text-gray-400'}`}>
          {fmt(totalRevenueImpact.monthly)}<span className="text-xs font-normal">/mo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800">
      <div className="text-sm text-gray-600 mb-3 dark:text-gray-400">Revenue Impact Tracker</div>
      <div className="flex gap-6">
        {[
          { label: 'Monthly', value: fmt(totalRevenueImpact.monthly) },
          { label: 'Annualized', value: fmt(totalRevenueImpact.annual) },
          { label: 'Playbooks', value: `${activeCount} / ${totalPlaybooks}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className={`text-xl font-mono font-bold ${activeCount > 0 ? 'text-success-500' : 'text-gray-800 dark:text-white/90'}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
