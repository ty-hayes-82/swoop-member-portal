// SourceBadge.jsx — data provenance chip for stat cards and panel headers
// Props: system (string), size ('sm'|'xs')
// Hard ceiling: 150 lines. Target: 80 lines.

const SYSTEM_COLORS = {
  'ForeTees':     '#4ADE80',
  'Jonas POS':    '#F0C674',
  'Northstar':    '#A78BFA',
  'ClubReady':    '#F59E0B',
  'Club Prophet': '#6BB8EF',
  'Weather API':  '#60A5FA',
};

const SYSTEM_ICONS = {
  'ForeTees':     '⛳',
  'Jonas POS':    '🍽',
  'Northstar':    '★',
  'ClubReady':    '📅',
  'Club Prophet': '◉',
  'Weather API':  '☁',
};

export default function SourceBadge({ system, size = 'sm' }) {
  const color = SYSTEM_COLORS[system] ?? '#8BAF8B';
  const icon  = SYSTEM_ICONS[system]  ?? '◈';

  const fontSize  = size === 'xs' ? '10px' : '11px';
  const padding   = size === 'xs' ? '2px 6px' : '3px 8px';

  return (
    <span
      title={`Source: ${system}`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '4px',
        padding,
        borderRadius:   '4px',
        background:     `${color}0D`,
        border:         `1px solid ${color}22`,
        fontSize,
        color:          `${color}AA`,
        fontWeight:     500,
        letterSpacing:  '0.02em',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        cursor:         'default',
        userSelect:     'none',
      }}
    >
      <span style={{ fontSize: size === 'xs' ? '9px' : '10px' }}>{icon}</span>
      {system}
    </span>
  );
}

// Multi-source row — renders several SourceBadges inline
export function SourceBadgeRow({ systems = [], size = 'xs' }) {
  if (!systems.length) return null;
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '2px' }}>
        Source:
      </span>
      {systems.map(s => (
        <SourceBadge key={s} system={s} size={size} />
      ))}
    </div>
  );
}
