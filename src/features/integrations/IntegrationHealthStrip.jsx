export function IntegrationHealthStrip({ health }) {
  const freshnessColor = health.dataFreshness === 'n/a' ? '#f59e0b' : '#22c55e';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-[18px]">
      <StatCard
        label="Connected Systems"
        value={`${health.connected}/${health.total}`}
        accent={'#22c55e'}
      />
      <StatCard
        label="Data Freshness"
        value={health.dataFreshness}
        accent={freshnessColor}
      />
      <StatCard
        label="Sync Status"
        value={health.syncStatus}
        accent={health.syncStatus === 'Healthy' ? '#22c55e' : '#f59e0b'}
      />
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-[10px] py-3 px-3.5">
      <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-1.5">
        {label}
      </div>
      <div className="text-base font-bold font-mono" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
