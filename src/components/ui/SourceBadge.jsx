// SourceBadge.jsx — data provenance chip for stat cards and panel headers

const SYSTEM_ICONS = {
  'Tee Sheet':   '\u26F3',
  'POS':         '\uD83C\uDF7D',
  'Member CRM':  '\u2605',
  'Scheduling':  '\uD83D\uDCC5',
  'Analytics':   '\u25C9',
  'Weather API': '\u2601',
  'Complaint Log': '\u26A0',
  'Email':       '\u2709',
  'GPS/App':     '\uD83D\uDCCD',
};

export default function SourceBadge({ system, signal, timestamp, size = 'sm' }) {
  const icon = SYSTEM_ICONS[system] ?? '\u25C8';
  const sizeCls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-[3px]';

  // If signal and timestamp provided, show enhanced proof version
  if (signal && timestamp) {
    return (
      <span
        title={`${system} \u2022 ${timestamp}`}
        className={`inline-flex items-center gap-1.5 rounded-md bg-swoop-row border border-swoop-border font-medium tracking-tight whitespace-nowrap shrink-0 cursor-default select-none text-swoop-text-muted ${size === 'xs' ? 'text-[10px] px-2 py-1' : 'text-[11px] px-2.5 py-1.5'}`}
      >
        <span className={size === 'xs' ? 'text-[10px]' : 'text-[11px]'}>{icon}</span>
        <span className="text-swoop-text font-semibold">{signal}</span>
        <span className="text-[9px] text-swoop-text-muted opacity-80">
          {timestamp}
        </span>
      </span>
    );
  }

  // Fallback to simple system name badge (backward compatible)
  return (
    <span
      title={`Source: ${system}`}
      className={`inline-flex items-center gap-1 rounded bg-swoop-row border border-swoop-border font-medium tracking-wide whitespace-nowrap shrink-0 cursor-default select-none text-swoop-text-muted ${sizeCls}`}
    >
      <span className={size === 'xs' ? 'text-[9px]' : 'text-[10px]'}>{icon}</span>
      {system}
    </span>
  );
}

// Multi-source row — renders several SourceBadges inline
export function SourceBadgeRow({ sources = [], systems = [], size = 'xs' }) {
  const items = sources.length ? sources : systems.map(s => ({ system: s }));

  if (!items.length) return null;

  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      <span className="text-[10px] text-swoop-text-muted mr-0.5">
        {sources.length ? 'Signals:' : 'Source:'}
      </span>
      {items.map((item, idx) => (
        <SourceBadge
          key={item.system + idx}
          system={item.system}
          signal={item.signal}
          timestamp={item.timestamp}
          size={size}
        />
      ))}
    </div>
  );
}
