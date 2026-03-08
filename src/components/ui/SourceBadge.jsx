// SourceBadge.jsx — data provenance chip for stat cards and panel headers
// Quiet neutral style — system name + icon carry differentiation, not color
// Props: system (string), size ('sm'|'xs')

const SYSTEM_ICONS = {
  'Tee Sheet':   '⛳',
  'POS':         '🍽',
  'Member CRM':  '★',
  'Scheduling':  '📅',
  'Analytics':   '◉',
  'Weather API': '☁',
};

export default function SourceBadge({ system, size = 'sm' }) {
  const icon     = SYSTEM_ICONS[system] ?? '◈';
  const fontSize = size === 'xs' ? '10px' : '11px';
  const padding  = size === 'xs' ? '2px 6px' : '3px 8px';

  return (
    <span
      title={`Source: ${system}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '4px',
        padding,
        borderRadius:  '4px',
        background:    'var(--bg-deep)',
        border:        '1px solid var(--border)',
        fontSize,
        color:         'var(--text-muted)',
        fontWeight:    500,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
        flexShrink:    0,
        cursor:        'default',
        userSelect:    'none',
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
