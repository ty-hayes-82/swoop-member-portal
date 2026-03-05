// ArchetypeBadge.jsx — inline archetype label for member name references
// Hard ceiling: 150 lines. Target: 60 lines.

const ARCHETYPES = {
  'Die-Hard Golfer':   { color: '#4ADE80', icon: '⛳' },
  'Social Butterfly':  { color: '#F472B6', icon: '🦋' },
  'Balanced Active':   { color: '#6BB8EF', icon: '◉'  },
  'Weekend Warrior':   { color: '#F0C674', icon: '📅'  },
  'Declining':         { color: '#EF4444', icon: '📉'  },
  'New Member':        { color: '#22C55E', icon: '★'   },
  'Ghost':             { color: '#8BAF8B', icon: '👻'  },
  'Snowbird':          { color: '#A78BFA', icon: '✈'   },
};

export default function ArchetypeBadge({ archetype, size = 'sm' }) {
  const def   = ARCHETYPES[archetype] ?? { color: '#8BAF8B', icon: '◈' };
  const small = size === 'xs';

  return (
    <span
      title={`Member archetype: ${archetype}`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '3px',
        padding:       small ? '1px 5px' : '2px 7px',
        borderRadius:  '4px',
        background:    `${def.color}15`,
        border:        `1px solid ${def.color}30`,
        fontSize:      small ? '10px' : '11px',
        color:         def.color,
        fontWeight:    600,
        whiteSpace:    'nowrap',
        flexShrink:    0,
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ fontSize: small ? '9px' : '10px' }}>{def.icon}</span>
      {archetype}
    </span>
  );
}

// Utility: get archetype color for inline use
export const getArchetypeColor = (archetype) =>
  ARCHETYPES[archetype]?.color ?? '#8BAF8B';
