const CATEGORY_COLORS = {
  'tee-sheet': '#1a7a3c',
  pos: '#8b6420',
  crm: '#4a6fa5',
  staffing: '#12b76a',
  waitlist: '#7c3aed',
};

const STATUS_COLORS = {
  connected: '#12b76a',
  available: '#8b6420',
  'coming-soon': '#94a3b8',
};

export function IntegrationCard({ system, isSelected, onClick, cardRef }) {
  const categoryColor = CATEGORY_COLORS[system.category] ?? '#64748b';
  const statusColor = STATUS_COLORS[system.status] ?? '#64748b';

  return (
    <article
      ref={cardRef}
      onClick={onClick}
      className="bg-white dark:bg-white/[0.03] rounded-xl p-4 cursor-pointer transition-all duration-200"
      style={{
        border: isSelected ? `2px solid ${categoryColor}` : '1px solid #E5E7EB',
        boxShadow: isSelected ? '0 0 0 2px rgba(26,122,60,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex justify-between gap-2.5 mb-2.5">
        <div>
          <h3 className="m-0 text-base text-gray-800 dark:text-white/90">{system.name}</h3>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Badge text={system.category} color={categoryColor} />
            <Badge text={`Tier ${system.tier}`} color={'#64748b'} />
            <Badge text={system.status} color={statusColor} />
          </div>
        </div>
        <span className="w-[34px] h-[34px] rounded-[10px] border border-gray-200 dark:border-gray-800 inline-flex items-center justify-center text-xs font-bold">
          {system.logo}
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-2.5">
        <strong style={{ color: statusColor }}>{system.status}</strong>
        {' · '}
        Last sync: {system.lastSync ?? 'Not connected yet'}
      </div>

      <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">
        Key Endpoints
      </div>
      <div className="flex flex-wrap gap-1.5">
        {system.endpoints.map((endpoint) => (
          <span key={endpoint} className="bg-gray-100 rounded-md py-[3px] px-[7px] text-[11px] text-gray-500">
            {endpoint}
          </span>
        ))}
      </div>
    </article>
  );
}

function Badge({ text, color }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide rounded py-0.5 px-1.5"
      style={{ color, background: `${color}18` }}
    >
      {text}
    </span>
  );
}
