export function IntegrationHealthStrip({ health }) {
  const freshnessColor = health.dataFreshness === 'n/a' ? '#f59e0b' : '#12b76a';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
      <StatCard
        label="Connected Systems"
        value={`${health.connected}/${health.total}`}
        accent={'#12b76a'}
      />
      <StatCard
        label="Data Freshness"
        value={health.dataFreshness}
        accent={freshnessColor}
      />
      <StatCard
        label="Sync Status"
        value={health.syncStatus}
        accent={health.syncStatus === 'Healthy' ? '#12b76a' : '#f59e0b'}
      />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-swoop-panel border border-swoop-border rounded-[10px] py-3 px-3.5">
      <div className="text-[11px] uppercase tracking-widest text-swoop-text-label mb-1.5">
        {label}
      </div>
      <div className="text-base font-bold font-mono" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
