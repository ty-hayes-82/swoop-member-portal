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
      <div className={`px-3 py-3 rounded-xl border ${activeCount > 0 ? 'bg-success-50 border-success-200' : 'bg-swoop-row border-swoop-border'}`}>
        <div className="text-xs text-swoop-text-muted mb-0.5">
          {activeCount}/{totalPlaybooks} playbooks active
        </div>
        <div className={`text-base font-mono font-bold ${activeCount > 0 ? 'text-success-500' : 'text-swoop-text-muted'}`}>
          {fmt(totalRevenueImpact.monthly)}<span className="text-xs font-normal">/mo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-swoop-panel border border-swoop-border">
      <div className="text-sm text-swoop-text-muted mb-3">Revenue Impact Tracker</div>
      <div className="flex gap-6">
        {[
          { label: 'Monthly', value: fmt(totalRevenueImpact.monthly) },
          { label: 'Annualized', value: fmt(totalRevenueImpact.annual) },
          { label: 'Playbooks', value: `${activeCount} / ${totalPlaybooks}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-swoop-text-muted">{label}</div>
            <div className={`text-xl font-mono font-bold ${activeCount > 0 ? 'text-success-500' : 'text-swoop-text'}`}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
